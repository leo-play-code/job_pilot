import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateCoverLetter } from '@/lib/ai'
import { deductCredits } from '@/lib/credits'
import { CREDIT_COSTS } from '@/lib/constants'
import { recordUsage } from '@/lib/usage'
import { search104Jobs, mapJob104ToListing } from '@/lib/104-api'
import { applyTo104Job } from '@/lib/104-apply'
import { unpackDecrypt } from '@/lib/encryption'
import type { ResumeContent } from '@/types/resume'

const batchSchema = z.object({
  resumeId: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = batchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const userId = session.user.id
  const { resumeId } = parsed.data

  // Load search config
  const config = await prisma.jobSearchConfig.findUnique({ where: { userId } })
  if (!config) {
    return NextResponse.json({ error: 'search_config_missing' }, { status: 400 })
  }

  // Load 104 credentials
  const cred = await prisma.userPlatformCredential.findUnique({
    where: { userId_platform: { userId, platform: 'JOB_104' } },
  })
  if (!cred) {
    return NextResponse.json({ error: 'credentials_not_configured' }, { status: 400 })
  }
  const email = unpackDecrypt(cred.encryptedEmail)
  const password = unpackDecrypt(cred.encryptedPassword)

  // Check user has at least enough credits for 1 application
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
  if (!user || user.credits < CREDIT_COSTS.AUTO_APPLY) {
    return NextResponse.json({ error: 'insufficient_credits' }, { status: 402 })
  }

  // Load resume for AI cover letter generation
  let resumeContent: ResumeContent | string = ''
  if (resumeId) {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } })
    if (resume) {
      const content = resume.content as unknown as ResumeContent
      resumeContent = content.rawText ? content.rawText : content
    }
  }

  // Search 104 for matching jobs
  const keyword = config.keywords.join(' ')
  // subLocationCodes (鄉鎮市區) takes priority over city-level locationCodes
  const area =
    config.subLocationCodes.length > 0
      ? config.subLocationCodes.join(',')
      : config.locationCodes.join(',') || undefined

  let rawListings: ReturnType<typeof mapJob104ToListing>[] = []
  try {
    const result = await search104Jobs({ keyword, area, rows: 20 })
    rawListings = (result.data?.list ?? []).map(mapJob104ToListing)
  } catch (err) {
    console.error('[auto-apply/batch] 104 search error:', err)
    return NextResponse.json({ error: 'search_unavailable' }, { status: 503 })
  }

  if (rawListings.length === 0) {
    return NextResponse.json({ data: { applied: 0, failed: 0, results: [] } })
  }

  // Get already-applied jobIds to avoid duplicates
  const existingApplications = await prisma.jobApplication.findMany({
    where: { userId, status: { in: ['APPLIED', 'ALREADY_APPLIED'] } },
    include: { jobListing: { select: { jobId: true } } },
  })
  const appliedJobIds = new Set(existingApplications.map((a) => a.jobListing.jobId))

  // Filter out already-applied
  const newListings = rawListings.filter((l) => !appliedJobIds.has(l.jobId))

  // Upsert job listings into DB
  for (const listing of newListings) {
    await prisma.jobListing.upsert({
      where: { jobId_platform: { jobId: listing.jobId, platform: 'JOB_104' } },
      create: listing,
      update: { title: listing.title, company: listing.company, salaryDesc: listing.salaryDesc, description: listing.description },
    })
  }

  // Limit to maxApplyCount
  const toApply = newListings.slice(0, config.maxApplyCount)

  const results: Array<{
    jobId: string
    title: string
    company: string
    success: boolean
    errorType?: string
    errorMessage?: string
  }> = []

  let appliedCount = 0
  let failedCount = 0

  for (const listing of toApply) {
    // Check credit balance before each apply
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
    if (!currentUser || currentUser.credits < CREDIT_COSTS.AUTO_APPLY) {
      results.push({ jobId: listing.jobId, title: listing.title, company: listing.company, success: false, errorType: 'insufficient_credits', errorMessage: '點數不足，停止投遞' })
      break
    }

    // Get the jobListing DB record
    const dbListing = await prisma.jobListing.findUnique({
      where: { jobId_platform: { jobId: listing.jobId, platform: 'JOB_104' } },
    })
    if (!dbListing) continue

    // Generate cover letter if needed
    let coverLetterContent: string | undefined
    if (config.coverLetterMode === 'AI_GENERATED') {
      try {
        coverLetterContent = await generateCoverLetter({
          resumeContent,
          jobTitle: listing.title,
          jobDesc: listing.description,
          wordCount: config.wordCount as 'SHORT' | 'MEDIUM' | 'LONG',
          language: 'zh',
        })
      } catch (err) {
        console.error('[auto-apply/batch] AI cover letter error:', err)
        coverLetterContent = undefined // fall back to platform default
      }
    }

    // Apply via Puppeteer
    const applyResult = await applyTo104Job({
      jobUrl: listing.applyUrl,
      email,
      password,
      coverLetterContent,
      coverLetterIndex: config.coverLetterMode === 'PLATFORM_DEFAULT' ? config.coverLetterIndex : undefined,
    })

    // Create application record
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobListingId: dbListing.id,
        resumeId: resumeId ?? null,
        coverLetterContent: coverLetterContent ?? null,
        coverLetterMode: config.coverLetterMode,
        platform: 'JOB_104',
        status: applyResult.success ? 'APPLIED' : applyResult.errorType === 'already_applied' ? 'ALREADY_APPLIED' : 'FAILED',
        appliedAt: applyResult.success ? new Date() : null,
        errorMessage: applyResult.errorMessage ?? null,
      },
    })

    if (applyResult.success) {
      // Deduct credits only on success
      await deductCredits(userId, CREDIT_COSTS.AUTO_APPLY, `104自動投遞: ${listing.title} @ ${listing.company}`)
      await recordUsage(userId, 'AUTO_APPLY')
      appliedCount++
    } else {
      failedCount++
    }

    results.push({
      jobId: listing.jobId,
      title: listing.title,
      company: listing.company,
      success: applyResult.success,
      errorType: applyResult.errorType,
      errorMessage: applyResult.errorMessage,
    })

    // Stop if critical error (bad credentials or captcha) — no point continuing
    if (applyResult.errorType === 'invalid_credentials' || applyResult.errorType === 'captcha') {
      break
    }
  }

  return NextResponse.json({
    data: {
      applied: appliedCount,
      failed: failedCount,
      results,
    },
  })
}

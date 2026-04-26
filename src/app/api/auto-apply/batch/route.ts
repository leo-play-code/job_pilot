import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateCoverLetter } from '@/lib/ai'
import { deductCredits } from '@/lib/credits'
import { CREDIT_COSTS } from '@/lib/constants'
import { recordUsage } from '@/lib/usage'
import { mapJob104ToListing } from '@/lib/104-api'
import { search104JobsWithPage } from '@/lib/104-search'
import { login104, applyJobWithPage } from '@/lib/104-apply'
import { launchBrowser } from '@/lib/puppeteer'
import { unpackDecrypt, packEncrypted } from '@/lib/encryption'
import type { ResumeContent } from '@/types/resume'
import type { Page } from 'puppeteer'

const batchSchema = z.object({
  resumeId: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Cookie session helpers
// ---------------------------------------------------------------------------

async function injectCookies(page: Page, encryptedCookies: string): Promise<boolean> {
  try {
    const rawJson = unpackDecrypt(encryptedCookies)
    const cookies = JSON.parse(rawJson) as Parameters<typeof page.setCookie>[0][]
    if (!cookies.length) return false
    await page.setCookie(...cookies)
    return true
  } catch {
    return false
  }
}

async function verify104Session(page: Page): Promise<boolean> {
  try {
    // Navigate to a member-only page; if redirected to signin/login, session is invalid.
    // Avoid loading the heavy main page to reduce bot-detection surface.
    await page.goto('https://pda.104.com.tw/applyRecord', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    const url = page.url()
    return (
      !url.includes('signin.104') &&
      !url.includes('login.104') &&
      !url.includes('oidc.104')
    )
  } catch {
    return false
  }
}

async function refreshCookiesInDB(
  page: Page,
  userId: string,
): Promise<void> {
  try {
    const cookies = await page.cookies(
      'https://www.104.com.tw',
      'https://104.com.tw',
      'https://vip.104.com.tw',
      'https://member.104.com.tw',
    )
    if (!cookies.length) return
    const encryptedCookies = packEncrypted(JSON.stringify(cookies))
    await prisma.userPlatformCredential.update({
      where: { userId_platform: { userId, platform: 'JOB_104' } },
      data: { encryptedCookies, cookiesUpdatedAt: new Date() },
    })
  } catch (err) {
    console.warn('[auto-apply/batch] refreshCookiesInDB failed:', err)
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

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

  const keyword = config.keywords.join(' ')
  const area =
    config.subLocationCodes.length > 0
      ? config.subLocationCodes.join(',')
      : config.locationCodes.join(',') || undefined

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

  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-TW,zh;q=0.9' })

  let sessionRestored = false

  try {
    // Step 1: Try cookie session first, fallback to password login
    if (cred.encryptedCookies) {
      const injected = await injectCookies(page, cred.encryptedCookies)
      if (injected) {
        sessionRestored = await verify104Session(page)
      }
    }

    if (!sessionRestored) {
      try {
        await login104(page, email, password)
        await refreshCookiesInDB(page, userId)
        sessionRestored = true
      } catch {
        const captchaEl = await page.$(
          '[class*="captcha"], #recaptcha, iframe[src*="recaptcha"], [data-sitekey]',
        )
        if (captchaEl) {
          return NextResponse.json(
            { error: 'session_expired', message: '104 Session 已過期且遇到 CAPTCHA，請至設定頁重新連結 104 帳號' },
            { status: 400 },
          )
        }
        return NextResponse.json(
          { error: 'invalid_credentials', message: '104 帳號或密碼錯誤，請至設定頁更新' },
          { status: 400 },
        )
      }
    }

    // Step 2: Search while logged in — multi-page to gather enough candidates
    const PAGE_SIZE = 20
    const MAX_SEARCH_PAGES = Math.ceil(config.maxApplyCount / PAGE_SIZE)

    const existingApplications = await prisma.jobApplication.findMany({
      where: { userId, status: { in: ['APPLIED', 'ALREADY_APPLIED'] } },
      include: { jobListing: { select: { jobId: true } } },
    })
    const appliedJobIds = new Set(existingApplications.map((a) => a.jobListing.jobId))

    const newListings: ReturnType<typeof mapJob104ToListing>[] = []
    let searchPage = 1
    let totalPages = 1

    while (newListings.length < config.maxApplyCount && searchPage <= Math.min(totalPages, MAX_SEARCH_PAGES)) {
      try {
        const result = await search104JobsWithPage(page, { keyword, area, rows: PAGE_SIZE, page: searchPage })
        totalPages = result.data?.totalPage ?? 1
        const pageListings = (result.data?.list ?? []).map(mapJob104ToListing)
        const freshListings = pageListings.filter((l) => !appliedJobIds.has(l.jobId))
        newListings.push(...freshListings)

        // Upsert fresh listings into DB
        for (const listing of freshListings) {
          await prisma.jobListing.upsert({
            where: { jobId_platform: { jobId: listing.jobId, platform: 'JOB_104' } },
            create: listing,
            update: { title: listing.title, company: listing.company, salaryDesc: listing.salaryDesc, description: listing.description },
          })
        }

        if (pageListings.length < PAGE_SIZE) break // Last page
        searchPage++
      } catch (err) {
        console.error(`[auto-apply/batch] 104 search error (page ${searchPage}):`, err)
        if (searchPage === 1) {
          return NextResponse.json({ error: 'search_unavailable', message: '104 搜尋失敗，請稍後再試' }, { status: 503 })
        }
        break // Partial results OK on subsequent pages
      }
    }

    if (newListings.length === 0) {
      return NextResponse.json({ data: { applied: 0, failed: 0, results: [], message: '未找到符合條件的新職缺' } })
    }

    const toApply = newListings.slice(0, config.maxApplyCount)

    // Step 3: Apply to each job (already logged in, same page)
    for (const listing of toApply) {
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
      if (!currentUser || currentUser.credits < CREDIT_COSTS.AUTO_APPLY) {
        results.push({ jobId: listing.jobId, title: listing.title, company: listing.company, success: false, errorType: 'insufficient_credits', errorMessage: '點數不足，停止投遞' })
        break
      }

      const dbListing = await prisma.jobListing.findUnique({
        where: { jobId_platform: { jobId: listing.jobId, platform: 'JOB_104' } },
      })
      if (!dbListing) continue

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
        }
      }

      const applyResult = await applyJobWithPage(page, {
        jobUrl: listing.applyUrl,
        coverLetterContent,
        coverLetterIndex: config.coverLetterMode === 'PLATFORM_DEFAULT' ? config.coverLetterIndex : undefined,
      })

      await prisma.jobApplication.create({
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
        await deductCredits(userId, CREDIT_COSTS.AUTO_APPLY, `104自動投遞: ${listing.title} @ ${listing.company}`)
        await recordUsage(userId, 'AUTO_APPLY')
        appliedCount++

        // Refresh cookies every 5 successful applications
        if (appliedCount % 5 === 0) {
          await refreshCookiesInDB(page, userId)
        }
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

      if (applyResult.errorType === 'invalid_credentials' || applyResult.errorType === 'captcha') {
        break
      }
    }
  } finally {
    // Final cookie refresh before closing
    if (sessionRestored) {
      await refreshCookiesInDB(page, userId)
    }
    await browser.close()
  }

  return NextResponse.json({
    data: { applied: appliedCount, failed: failedCount, results },
  })
}

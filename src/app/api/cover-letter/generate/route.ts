import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateCoverLetter } from '@/lib/ai'
import { checkDailyLimit, recordUsage } from '@/lib/usage'
import type { ResumeContent } from '@/types/resume'

const generateCoverLetterSchema = z.object({
  resumeId: z.string().optional(),
  resumeSummary: z.string().optional(),
  jobTitle: z.string().min(1),
  jobDesc: z.string().min(1),
  wordCount: z.enum(['SHORT', 'MEDIUM', 'LONG']),
  language: z.enum(['zh', 'en']),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await checkDailyLimit(session.user.id)
  } catch {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = generateCoverLetterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 })
  }

  const { resumeId, resumeSummary, jobTitle, jobDesc, wordCount, language } = parsed.data

  let resumeContent: ResumeContent | string = resumeSummary ?? ''

  if (resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: session.user.id },
    })
    if (resume) {
      resumeContent = resume.content as unknown as ResumeContent
    }
  }

  const content = await generateCoverLetter({ resumeContent, jobTitle, jobDesc, wordCount, language })

  const coverLetter = await prisma.coverLetter.create({
    data: {
      userId: session.user.id,
      resumeId: resumeId ?? null,
      jobTitle,
      jobDesc,
      content,
      wordCount,
      language,
    },
  })

  await recordUsage(session.user.id, 'GENERATE_COVER_LETTER')

  return NextResponse.json({ data: { coverLetterId: coverLetter.id, content } })
}

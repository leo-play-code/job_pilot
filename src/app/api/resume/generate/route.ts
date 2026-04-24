import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { enhanceResume } from '@/lib/ai'
import { checkDailyLimit, recordUsage } from '@/lib/usage'

const generateResumeSchema = z.object({
  content: z.union([z.string().min(1), z.record(z.unknown())]),
  templateId: z.string().min(1),
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
  const parsed = generateResumeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 })
  }

  const { content, templateId, language } = parsed.data
  const rawInput = typeof content === 'string' ? content : JSON.stringify(content)

  let enhanced
  try {
    enhanced = await enhanceResume(rawInput, language)
  } catch (err) {
    console.error('[resume/generate] AI error:', err)
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 })
  }

  const title = enhanced.personalInfo.name
    ? `${enhanced.personalInfo.name} — ${new Date().toLocaleDateString()}`
    : `Resume ${new Date().toLocaleDateString()}`

  const resume = await prisma.resume.create({
    data: {
      userId: session.user.id,
      title,
      content: enhanced as object,
      templateId,
      language,
    },
  })

  await recordUsage(session.user.id, 'GENERATE_RESUME')

  return NextResponse.json({ data: { resumeId: resume.id, content: enhanced } })
}

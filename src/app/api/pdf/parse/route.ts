import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { parsePdf } from '@/lib/pdf'
import { enhanceResume } from '@/lib/ai'
import { checkDailyLimit, recordUsage } from '@/lib/usage'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await checkDailyLimit(session.user.id)
  } catch {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 422 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 422 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 422 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const rawText = await parsePdf(buffer)
  const language = (formData.get('language') as 'zh' | 'en' | null) ?? 'zh'
  const content = await enhanceResume(rawText, language)

  await recordUsage(session.user.id, 'PARSE_PDF')

  return NextResponse.json({ data: { content } })
}

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkDailyLimit, recordUsage } from '@/lib/usage'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await checkDailyLimit(session.user.id)
  } catch {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
  }

  // TODO: parse multipart, validate PDF ≤5MB, parsePdf(), enhanceResume(), recordUsage
  await recordUsage(session.user.id, 'PARSE_PDF')
  return NextResponse.json({ data: null }, { status: 501 })
}

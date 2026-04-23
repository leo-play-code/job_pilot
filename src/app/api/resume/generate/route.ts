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

  // TODO: validate body, call enhanceResume(), save Resume, recordUsage
  await recordUsage(session.user.id, 'GENERATE_RESUME')
  return NextResponse.json({ data: null }, { status: 501 })
}

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getCreditBalance } from '@/lib/credits'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const credits = await getCreditBalance(session.user.id)
    return NextResponse.json({ data: { credits } })
  } catch (error) {
    console.error('[credits/balance] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

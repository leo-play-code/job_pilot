import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTodayUsage } from '@/lib/usage'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })

  if (user?.plan === 'PRO') {
    return NextResponse.json({ data: { used: 0, limit: null, unlimited: true } })
  }

  const data = await getTodayUsage(session.user.id)
  return NextResponse.json({ data })
}

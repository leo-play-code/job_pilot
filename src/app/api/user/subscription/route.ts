import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      stripeCurrentPeriodEnd: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const now = new Date()
  const hasActiveSubscription =
    user.plan === 'PRO' &&
    user.stripeCurrentPeriodEnd != null &&
    user.stripeCurrentPeriodEnd > now

  return NextResponse.json({
    data: {
      plan: user.plan,
      currentPeriodEnd: user.stripeCurrentPeriodEnd?.toISOString() ?? null,
      hasActiveSubscription,
    },
  })
}

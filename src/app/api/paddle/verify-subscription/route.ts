import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { paddle } from '@/lib/paddle'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const transactionId = body.transactionId as string | undefined

  if (!transactionId) {
    return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let transaction: any
  try {
    transaction = await paddle.transactions.get(transactionId)
  } catch {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  if (transaction.status !== 'completed') {
    return NextResponse.json({ error: 'Transaction not completed yet' }, { status: 400 })
  }

  const customData = transaction.customData as Record<string, string> | null

  if (!customData?.userId) {
    return NextResponse.json({ error: 'Missing user data in transaction' }, { status: 400 })
  }

  // Security: verify this transaction was created for the current user
  if (customData.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Credit packs use verify-transaction instead
  if (customData.type === 'credit_pack') {
    return NextResponse.json({ error: 'Use /api/paddle/verify-transaction for credit packs' }, { status: 400 })
  }

  const subscriptionId = transaction.subscriptionId as string | undefined
  if (!subscriptionId) {
    // Paddle may take a moment to link the subscription to the transaction
    return NextResponse.json({ error: 'Subscription not linked yet, retry shortly' }, { status: 400 })
  }

  // Fetch subscription details for accurate billing period
  let periodEnd: Date | null = null
  let priceId: string | undefined
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription: any = await paddle.subscriptions.get(subscriptionId)
    priceId = subscription.items?.[0]?.price?.id as string | undefined
    periodEnd = subscription.currentBillingPeriod?.endsAt
      ? new Date(subscription.currentBillingPeriod.endsAt)
      : null
  } catch {
    // Non-fatal: update plan with what we have from the transaction
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      plan: 'PRO',
      ...(transaction.customerId && { paddleCustomerId: transaction.customerId }),
      paddleSubscriptionId: subscriptionId,
      paddlePriceId: priceId,
      paddleCurrentPeriodEnd: periodEnd,
    },
  })

  const updated = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, paddleCurrentPeriodEnd: true },
  })

  return NextResponse.json({
    data: {
      plan: updated?.plan ?? 'PRO',
      currentPeriodEnd: updated?.paddleCurrentPeriodEnd?.toISOString() ?? null,
      hasActiveSubscription: true,
    },
  })
}

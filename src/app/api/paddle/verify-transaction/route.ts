import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { paddle } from '@/lib/paddle'
import { addCredits } from '@/lib/credits'
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

  // Fetch transaction directly from Paddle API to verify it's real and completed
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

  if (!customData || customData.type !== 'credit_pack') {
    return NextResponse.json({ error: 'Not a credit pack transaction' }, { status: 400 })
  }

  // Security: verify this transaction was created for the current user
  if (customData.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Idempotency: skip if already credited for this transaction
  const existing = await prisma.creditTransaction.findFirst({
    where: { paddleTransactionId: transactionId },
  })

  if (existing) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })
    return NextResponse.json({ data: { credits: user?.credits ?? 0 } })
  }

  const credits = parseInt(customData.credits, 10)
  const packId = customData.packId

  await addCredits(session.user.id, credits, packId.toUpperCase() + '_PACK', transactionId)

  if (transaction.customerId) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { paddleCustomerId: transaction.customerId },
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  })

  return NextResponse.json({ data: { credits: user?.credits ?? 0 } })
}

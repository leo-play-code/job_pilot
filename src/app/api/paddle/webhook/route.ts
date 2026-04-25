import { NextResponse } from 'next/server'
import { paddle } from '@/lib/paddle'
import { prisma } from '@/lib/prisma'
import { addCredits } from '@/lib/credits'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('paddle-signature') ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = paddle.webhooks.unmarshal(rawBody, process.env.PADDLE_WEBHOOK_SECRET!, signature)
  } catch (err) {
    console.error('[paddle-webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = event.data as any

    switch (event.eventType) {
      case 'transaction.completed': {
        const customData = data.customData as Record<string, string> | null
        const transactionId = data.id as string
        console.log(`[paddle-webhook] transaction.completed txn=${transactionId} customData=`, customData)

        if (customData?.type === 'credit_pack') {
          // Idempotency: skip if already credited (e.g. verify-transaction already ran)
          const existing = await prisma.creditTransaction.findFirst({
            where: { paddleTransactionId: transactionId },
          })
          if (existing) {
            console.log(`[paddle-webhook] txn=${transactionId} already credited, skipping`)
            break
          }

          const userId = customData.userId
          const credits = parseInt(customData.credits, 10)
          const packId = customData.packId
          await addCredits(userId, credits, packId.toUpperCase() + '_PACK', transactionId)
          console.log(`[paddle-webhook] credited ${credits} pts to user=${userId}`)

          if (data.customerId) {
            await prisma.user.update({
              where: { id: userId },
              data: { paddleCustomerId: data.customerId },
            })
          }
        }
        break
      }

      case 'subscription.created': {
        const customData = data.customData as Record<string, string> | null
        const userId = customData?.userId
        if (!userId) break

        const customerId = data.customerId as string
        const subscriptionId = data.id as string
        const priceId = data.items?.[0]?.price?.id as string | undefined
        const periodEnd = data.currentBillingPeriod?.endsAt
          ? new Date(data.currentBillingPeriod.endsAt)
          : null

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'PRO',
            paddleCustomerId: customerId,
            paddleSubscriptionId: subscriptionId,
            paddlePriceId: priceId,
            paddleCurrentPeriodEnd: periodEnd,
          },
        })
        break
      }

      case 'subscription.updated': {
        const customerId = data.customerId as string
        const priceId = data.items?.[0]?.price?.id as string | undefined
        const periodEnd = data.currentBillingPeriod?.endsAt
          ? new Date(data.currentBillingPeriod.endsAt)
          : null
        const isActive = data.status === 'active'

        await prisma.user.update({
          where: { paddleCustomerId: customerId },
          data: {
            plan: isActive ? 'PRO' : 'FREE',
            paddlePriceId: priceId,
            paddleCurrentPeriodEnd: periodEnd,
          },
        })
        break
      }

      case 'subscription.canceled': {
        const customerId = data.customerId as string

        await prisma.user.update({
          where: { paddleCustomerId: customerId },
          data: {
            plan: 'FREE',
            paddleSubscriptionId: null,
            paddleCurrentPeriodEnd: null,
          },
        })
        break
      }

      default:
        console.log(`[paddle-webhook] Unhandled event: ${event.eventType}`)
    }
  } catch (err) {
    console.error('[paddle-webhook] Error processing event:', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

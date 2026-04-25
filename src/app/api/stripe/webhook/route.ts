import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('[webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const firstItem = subscription.items.data[0]
        const periodEnd = firstItem?.current_period_end

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            plan: 'PRO',
            stripeSubscriptionId: subscriptionId,
            stripePriceId: firstItem?.price.id,
            stripeCurrentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const firstItem = subscription.items.data[0]
        const periodEnd = firstItem?.current_period_end

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            plan: subscription.status === 'active' ? 'PRO' : 'FREE',
            stripePriceId: firstItem?.price.id,
            stripeCurrentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            plan: 'FREE',
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        console.log('[webhook] invoice.payment_failed received — logging only')
        break
      }

      default:
        console.log(`[webhook] Unhandled Stripe event: ${event.type}`)
    }
  } catch (err) {
    console.error('[webhook] Error processing event:', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

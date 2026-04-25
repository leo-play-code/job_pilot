import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch user from DB (never rely on session for stripe data)
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create Stripe customer if not exists
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
      })

      user = await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
        select: {
          id: true,
          email: true,
          name: true,
          stripeCustomerId: true,
        },
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId!,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_MONTHLY!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/zh/settings/billing?success=true`,
      cancel_url: `${appUrl}/zh/settings/billing?canceled=true`,
    })

    return NextResponse.json({ data: { checkoutUrl: checkoutSession.url } })
  } catch (error) {
    console.error('[create-checkout-session] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

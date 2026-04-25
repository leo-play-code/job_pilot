import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { paddle } from '@/lib/paddle'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, paddleCustomerId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactionData: any = {
      items: [{ priceId: process.env.PADDLE_PRICE_ID_MONTHLY!, quantity: 1 }],
      customData: { userId },
      checkoutSettings: {
        successUrl: `${appUrl}/zh/settings/billing?success=true`,
      },
    }

    if (user.paddleCustomerId) {
      transactionData.customerId = user.paddleCustomerId
    } else {
      transactionData.customer = {
        email: user.email,
        name: user.name ?? undefined,
      }
    }

    const transaction = await paddle.transactions.create(transactionData)

    return NextResponse.json({ data: { transactionId: transaction.id, checkoutUrl: transaction.checkout?.url ?? null } })
  } catch (error) {
    console.error('[paddle-create-checkout-session] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

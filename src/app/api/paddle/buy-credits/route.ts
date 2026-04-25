import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { paddle } from '@/lib/paddle'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/credits'

const VALID_PACK_IDS: CreditPackId[] = ['starter', 'jobseeker', 'power']

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const packId = body.packId as CreditPackId

    if (!VALID_PACK_IDS.includes(packId)) {
      return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 })
    }

    const userId = session.user.id
    const pack = CREDIT_PACKS[packId]

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
      items: [{ priceId: pack.priceId, quantity: 1 }],
      customData: {
        type: 'credit_pack',
        packId,
        userId,
        credits: String(pack.credits),
      },
      checkoutSettings: {
        successUrl: `${appUrl}/zh/pricing?credits_success=true`,
        cancelUrl: `${appUrl}/zh/pricing?credits_canceled=true`,
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

    return NextResponse.json({ data: { checkoutUrl: transaction.checkout?.url ?? null } })
  } catch (error) {
    console.error('[paddle-buy-credits] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

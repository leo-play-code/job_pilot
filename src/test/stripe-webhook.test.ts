import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    customers: { create: vi.fn() },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/stripe/webhook/route'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWebhookRequest(body = 'raw-body-string'): Request {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
  })
}

// ---------------------------------------------------------------------------
// Tests — POST /api/stripe/webhook
// ---------------------------------------------------------------------------

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

    // Default headers mock returns a stripe-signature
    vi.mocked(headers).mockResolvedValue({
      get: (key: string) => (key === 'stripe-signature' ? 'test-sig' : null),
    } as never)
  })

  // -------------------------------------------------------------------------
  // checkout.session.completed
  // -------------------------------------------------------------------------

  it('checkout.session.completed 應把 user 升級為 PRO', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test123',
          subscription: 'sub_test456',
        },
      },
    }

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as never)
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      items: {
        data: [
          {
            current_period_end: 1748217600,
            price: { id: 'price_test' },
          },
        ],
      },
    } as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const res = await POST(makeWebhookRequest())

    // Response
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ received: true })

    // stripe.subscriptions.retrieve called with the subscription ID
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test456')

    // prisma.user.update called to upgrade user to PRO
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: 'cus_test123' },
        data: expect.objectContaining({
          plan: 'PRO',
          stripeSubscriptionId: 'sub_test456',
          stripePriceId: 'price_test',
          stripeCurrentPeriodEnd: new Date(1748217600 * 1000),
        }),
      }),
    )
  })

  // -------------------------------------------------------------------------
  // customer.subscription.deleted
  // -------------------------------------------------------------------------

  it('customer.subscription.deleted 應把 user 降級為 FREE', async () => {
    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_test123',
          items: {
            data: [
              {
                current_period_end: 1748217600,
                price: { id: 'price_test' },
              },
            ],
          },
          current_period_end: 1748217600,
          status: 'canceled',
        },
      },
    }

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const res = await POST(makeWebhookRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ received: true })

    // prisma.user.update called to downgrade user to FREE
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: 'cus_test123' },
        data: expect.objectContaining({
          plan: 'FREE',
          stripeSubscriptionId: null,
          stripeCurrentPeriodEnd: null,
        }),
      }),
    )
  })

  // -------------------------------------------------------------------------
  // Invalid signature → 400
  // -------------------------------------------------------------------------

  it('無效 signature 應回傳 400', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const res = await POST(makeWebhookRequest())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })
})

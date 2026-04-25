import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

vi.mock('@/lib/paddle', () => ({
  paddle: {
    webhooks: { unmarshal: vi.fn() },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    creditTransaction: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/credits', () => ({
  addCredits: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/paddle/webhook/route'
import { paddle } from '@/lib/paddle'
import { prisma } from '@/lib/prisma'
import { addCredits } from '@/lib/credits'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWebhookRequest(body = 'raw-body-string'): Request {
  return new Request('http://localhost/api/paddle/webhook', {
    method: 'POST',
    body,
    headers: { 'paddle-signature': 'test-sig' },
  })
}

// ---------------------------------------------------------------------------
// Tests — POST /api/paddle/webhook
// ---------------------------------------------------------------------------

describe('POST /api/paddle/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PADDLE_WEBHOOK_SECRET = 'pdl_ntfset_test'
  })

  // -------------------------------------------------------------------------
  // subscription.created
  // -------------------------------------------------------------------------

  it('subscription.created 應把 user 升級為 PRO', async () => {
    const mockEvent = {
      eventType: 'subscription.created',
      data: {
        id: 'sub_test456',
        customerId: 'ctm_test123',
        customData: { userId: 'user-1' },
        items: [{ price: { id: 'pri_monthly' } }],
        currentBillingPeriod: { endsAt: '2026-05-25T00:00:00Z' },
      },
    }

    vi.mocked(paddle.webhooks.unmarshal).mockReturnValue(mockEvent as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const res = await POST(makeWebhookRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ received: true })

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          plan: 'PRO',
          paddleCustomerId: 'ctm_test123',
          paddleSubscriptionId: 'sub_test456',
        }),
      }),
    )
  })

  // -------------------------------------------------------------------------
  // subscription.canceled
  // -------------------------------------------------------------------------

  it('subscription.canceled 應把 user 降級為 FREE', async () => {
    const mockEvent = {
      eventType: 'subscription.canceled',
      data: {
        id: 'sub_test456',
        customerId: 'ctm_test123',
        status: 'canceled',
      },
    }

    vi.mocked(paddle.webhooks.unmarshal).mockReturnValue(mockEvent as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const res = await POST(makeWebhookRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ received: true })

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { paddleCustomerId: 'ctm_test123' },
        data: expect.objectContaining({
          plan: 'FREE',
          paddleSubscriptionId: null,
          paddleCurrentPeriodEnd: null,
        }),
      }),
    )
  })

  // -------------------------------------------------------------------------
  // transaction.completed (credit pack)
  // -------------------------------------------------------------------------

  it('transaction.completed (credit_pack) 應新增點數', async () => {
    const mockEvent = {
      eventType: 'transaction.completed',
      data: {
        id: 'txn_test789',
        customerId: 'ctm_test123',
        customData: {
          type: 'credit_pack',
          packId: 'starter',
          userId: 'user-1',
          credits: '20',
        },
      },
    }

    vi.mocked(paddle.webhooks.unmarshal).mockReturnValue(mockEvent as never)
    vi.mocked(addCredits).mockResolvedValue(undefined)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const res = await POST(makeWebhookRequest())

    expect(res.status).toBe(200)
    expect(addCredits).toHaveBeenCalledWith('user-1', 20, 'STARTER_PACK', 'txn_test789')
  })

  // -------------------------------------------------------------------------
  // Invalid signature → 400
  // -------------------------------------------------------------------------

  it('無效 signature 應回傳 400', async () => {
    vi.mocked(paddle.webhooks.unmarshal).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const res = await POST(makeWebhookRequest())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })
})

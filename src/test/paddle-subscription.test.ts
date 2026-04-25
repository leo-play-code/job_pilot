import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/paddle', () => ({
  paddle: {
    transactions: { create: vi.fn() },
    customerPortalSessions: { create: vi.fn() },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { paddle } from '@/lib/paddle'
import { GET } from '@/app/api/user/subscription/route'
import { POST as createCheckoutSession } from '@/app/api/paddle/create-checkout-session/route'

// ---------------------------------------------------------------------------
// Tests — GET /api/user/subscription
// ---------------------------------------------------------------------------

describe('GET /api/user/subscription', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await GET()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('Free 用戶回傳 plan=FREE, hasActiveSubscription=false', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-free' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'FREE',
      paddleCurrentPeriodEnd: null,
    } as never)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({
      plan: 'FREE',
      hasActiveSubscription: false,
      currentPeriodEnd: null,
    })
  })

  it('Pro 用戶回傳 plan=PRO, hasActiveSubscription=true', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-pro' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'PRO',
      paddleCurrentPeriodEnd: futureDate,
    } as never)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.plan).toBe('PRO')
    expect(body.data.hasActiveSubscription).toBe(true)
    expect(body.data.currentPeriodEnd).toBe(futureDate.toISOString())
  })

  it('Pro 用戶但訂閱已過期回傳 hasActiveSubscription=false', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-expired' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'PRO',
      paddleCurrentPeriodEnd: pastDate,
    } as never)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.plan).toBe('PRO')
    expect(body.data.hasActiveSubscription).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests — POST /api/paddle/create-checkout-session
// ---------------------------------------------------------------------------

describe('POST /api/paddle/create-checkout-session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PADDLE_PRICE_ID_MONTHLY = 'pri_monthly_test'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('未登入回傳 401', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await createCheckoutSession()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('已登入且有 paddleCustomerId 應回傳 checkoutUrl', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      paddleCustomerId: 'ctm_existing',
    } as never)
    vi.mocked(paddle.transactions.create).mockResolvedValue({
      checkout: { url: 'https://buy.paddle.com/checkout/test123' },
    } as never)

    const res = await createCheckoutSession()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveProperty('checkoutUrl')
    expect(body.data.checkoutUrl).toBe('https://buy.paddle.com/checkout/test123')

    expect(paddle.transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'ctm_existing',
        items: [{ priceId: 'pri_monthly_test', quantity: 1 }],
      }),
    )
  })

  it('已登入但無 paddleCustomerId 應以 email 建立 checkout', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-new' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-new',
      email: 'newuser@example.com',
      name: 'New User',
      paddleCustomerId: null,
    } as never)
    vi.mocked(paddle.transactions.create).mockResolvedValue({
      checkout: { url: 'https://buy.paddle.com/checkout/new123' },
    } as never)

    const res = await createCheckoutSession()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.checkoutUrl).toBe('https://buy.paddle.com/checkout/new123')

    expect(paddle.transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({ email: 'newuser@example.com' }),
      }),
    )
  })
})

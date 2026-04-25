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

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    customers: { create: vi.fn() },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { GET } from '@/app/api/user/subscription/route'
import { POST as createCheckoutSession } from '@/app/api/stripe/create-checkout-session/route'

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
      stripeCurrentPeriodEnd: null,
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
    // A date well in the future
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-pro' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'PRO',
      stripeCurrentPeriodEnd: futureDate,
    } as never)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.plan).toBe('PRO')
    expect(body.data.hasActiveSubscription).toBe(true)
    expect(body.data.currentPeriodEnd).toBe(futureDate.toISOString())
  })

  it('Pro 用戶但訂閱已過期回傳 hasActiveSubscription=false', async () => {
    // A date in the past
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // -1 day

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-expired' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'PRO',
      stripeCurrentPeriodEnd: pastDate,
    } as never)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.plan).toBe('PRO')
    expect(body.data.hasActiveSubscription).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests — POST /api/stripe/create-checkout-session
// ---------------------------------------------------------------------------

describe('POST /api/stripe/create-checkout-session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_PRICE_ID_MONTHLY = 'price_monthly_test'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('未登入回傳 401', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await createCheckoutSession()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('已登入且有 stripeCustomerId 應回傳 checkoutUrl', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      stripeCustomerId: 'cus_test_existing',
    } as never)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_abc123',
    } as never)

    const res = await createCheckoutSession()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveProperty('checkoutUrl')
    expect(body.data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_abc123')

    // stripe.checkout.sessions.create should be called with customer ID
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_test_existing',
        mode: 'subscription',
      }),
    )
  })

  it('已登入但無 stripeCustomerId 應先建立 Customer 再回傳 checkoutUrl', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-new' } } as never)

    // First findUnique returns user without stripeCustomerId
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-new',
      email: 'newuser@example.com',
      name: 'New User',
      stripeCustomerId: null,
    } as never)

    vi.mocked(stripe.customers.create).mockResolvedValue({
      id: 'cus_new_123',
    } as never)

    // After update, user has stripeCustomerId
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-new',
      email: 'newuser@example.com',
      name: 'New User',
      stripeCustomerId: 'cus_new_123',
    } as never)

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_new',
    } as never)

    const res = await createCheckoutSession()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_new')

    // stripe.customers.create should have been called
    expect(stripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'newuser@example.com' }),
    )
  })
})

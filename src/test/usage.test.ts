import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    usageLog: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { checkDailyLimit, getTodayUsage, recordUsage } from '@/lib/usage'
import { prisma } from '@/lib/prisma'

describe('usage lib', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getTodayUsage returns used count and limit 10', async () => {
    vi.mocked(prisma.usageLog.count).mockResolvedValue(2)
    const result = await getTodayUsage('user-1')
    expect(result).toEqual({ used: 2, limit: 10 })
  })

  it('checkDailyLimit throws when at limit (FREE user)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'FREE' } as never)
    vi.mocked(prisma.usageLog.count).mockResolvedValue(10)
    await expect(checkDailyLimit('user-1')).rejects.toThrow('daily_limit_reached')
  })

  it('checkDailyLimit passes when under limit (FREE user)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'FREE' } as never)
    vi.mocked(prisma.usageLog.count).mockResolvedValue(1)
    await expect(checkDailyLimit('user-1')).resolves.toBeUndefined()
  })

  it('checkDailyLimit bypasses limit for PRO user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'PRO' } as never)
    // usageLog.count should NOT be called for PRO users
    await expect(checkDailyLimit('user-1')).resolves.toBeUndefined()
    expect(prisma.usageLog.count).not.toHaveBeenCalled()
  })

  it('recordUsage creates a log entry', async () => {
    vi.mocked(prisma.usageLog.create).mockResolvedValue({} as never)
    await recordUsage('user-1', 'GENERATE_RESUME')
    expect(prisma.usageLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1', action: 'GENERATE_RESUME' }) }),
    )
  })
})

// ---------------------------------------------------------------------------
// [stripe-subscription] Unit — checkDailyLimit() PRO bypass
// ---------------------------------------------------------------------------

describe('PRO bypass', () => {
  beforeEach(() => vi.clearAllMocks())

  it('PRO 用戶直接放行，不查 UsageLog', async () => {
    // Arrange: user is PRO
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'PRO' } as never)

    // Act
    const result = await checkDailyLimit('pro-user-1')

    // Assert: allowed (no throw, resolves undefined)
    expect(result).toBeUndefined()

    // Assert: usageLog.count was never called — PRO bypasses the count check
    expect(prisma.usageLog.count).not.toHaveBeenCalled()
  })
})

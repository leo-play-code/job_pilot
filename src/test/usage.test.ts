import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
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

  it('getTodayUsage returns used count and limit 3', async () => {
    vi.mocked(prisma.usageLog.count).mockResolvedValue(2)
    const result = await getTodayUsage('user-1')
    expect(result).toEqual({ used: 2, limit: 3 })
  })

  it('checkDailyLimit throws when at limit', async () => {
    vi.mocked(prisma.usageLog.count).mockResolvedValue(3)
    await expect(checkDailyLimit('user-1')).rejects.toThrow('daily_limit_reached')
  })

  it('checkDailyLimit passes when under limit', async () => {
    vi.mocked(prisma.usageLog.count).mockResolvedValue(1)
    await expect(checkDailyLimit('user-1')).resolves.toBeUndefined()
  })

  it('recordUsage creates a log entry', async () => {
    vi.mocked(prisma.usageLog.create).mockResolvedValue({} as never)
    await recordUsage('user-1', 'GENERATE_RESUME')
    expect(prisma.usageLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1', action: 'GENERATE_RESUME' }) }),
    )
  })
})

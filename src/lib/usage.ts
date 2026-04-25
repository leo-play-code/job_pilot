import { prisma } from '@/lib/prisma'
import type { UsageAction } from '@prisma/client'

const FREE_DAILY_LIMIT = 10

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export async function checkDailyLimit(userId: string): Promise<void> {
  // PRO users are not subject to daily limits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })
  if (user?.plan === 'PRO') return

  const used = await prisma.usageLog.count({
    where: { userId, date: todayString() },
  })
  if (used >= FREE_DAILY_LIMIT) {
    throw new Error('daily_limit_reached')
  }
}

export async function recordUsage(userId: string, action: UsageAction): Promise<void> {
  await prisma.usageLog.create({
    data: { userId, action, date: todayString() },
  })
}

export async function getTodayUsage(userId: string): Promise<{ used: number; limit: number }> {
  const used = await prisma.usageLog.count({
    where: { userId, date: todayString() },
  })
  return { used, limit: FREE_DAILY_LIMIT }
}

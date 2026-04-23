import { prisma } from '@/lib/prisma'
import type { UsageAction } from '@prisma/client'

const FREE_DAILY_LIMIT = 3

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export async function checkDailyLimit(userId: string): Promise<void> {
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

import { prisma } from '@/lib/prisma'
export { CREDIT_COSTS } from '@/lib/constants'

export const CREDIT_PACKS = {
  starter: { credits: 20, priceId: process.env.PADDLE_CREDIT_PACK_STARTER_PRICE_ID! },
  jobseeker: { credits: 50, priceId: process.env.PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID! },
  power: { credits: 120, priceId: process.env.PADDLE_CREDIT_PACK_POWER_PRICE_ID! },
} as const

export type CreditPackId = keyof typeof CREDIT_PACKS

export async function getCreditBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })
  return user?.credits ?? 0
}

export async function addCredits(
  userId: string,
  amount: number,
  reason: string,
  paddleTransactionId?: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
    prisma.creditTransaction.create({
      data: { userId, amount, reason, paddleTransactionId },
    }),
  ])
}

export async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })
  if (!user || user.credits < amount) {
    throw new Error('insufficient_credits')
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    }),
    prisma.creditTransaction.create({
      data: { userId, amount: -amount, reason },
    }),
  ])
}

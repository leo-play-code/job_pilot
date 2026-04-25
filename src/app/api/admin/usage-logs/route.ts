import { NextResponse } from 'next/server'
import { Prisma, UsageAction } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(email?: string | null) {
  return email === process.env.ADMIN_EMAIL
}

const PAGE_SIZE = 50

const VALID_ACTIONS = new Set<string>([
  'GENERATE_RESUME',
  'PARSE_PDF',
  'GENERATE_COVER_LETTER',
])

export async function GET(req: Request) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const actionParam = searchParams.get('action') ?? undefined
  const date = searchParams.get('date') ?? undefined
  const userId = searchParams.get('userId') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const where: Prisma.UsageLogWhereInput = {}

  if (actionParam && VALID_ACTIONS.has(actionParam)) {
    where.action = actionParam as UsageAction
  }

  if (date) {
    where.date = date
  }

  if (userId) {
    where.userId = userId
  }

  const [logs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where,
      include: {
        user: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.usageLog.count({ where }),
  ])

  const data = logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    userEmail: log.user.email,
    action: log.action,
    date: log.date,
    createdAt: log.createdAt,
  }))

  return NextResponse.json({ data: { logs: data, total, page } })
}

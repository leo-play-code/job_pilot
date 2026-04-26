import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
  const status = searchParams.get('status') ?? undefined

  const where = {
    userId: session.user.id,
    ...(status ? { status: status as 'PENDING' | 'APPLIED' | 'FAILED' | 'ALREADY_APPLIED' } : {}),
  }

  const [total, applications] = await Promise.all([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      include: {
        jobListing: {
          select: { title: true, company: true, location: true, applyUrl: true, salaryDesc: true },
        },
        resume: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({
    data: {
      applications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  })
}

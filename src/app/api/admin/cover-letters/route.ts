import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(email?: string | null) {
  return email === process.env.ADMIN_EMAIL
}

const PAGE_SIZE = 50

export async function GET(req: Request) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const userId = searchParams.get('userId') ?? undefined

  const where: Prisma.CoverLetterWhereInput = {}

  if (search) {
    where.OR = [
      { jobTitle: { contains: search } },
      { user: { email: { contains: search } } },
    ]
  }

  if (userId) {
    where.userId = userId
  }

  const [coverLetters, total] = await Promise.all([
    prisma.coverLetter.findMany({
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
    prisma.coverLetter.count({ where }),
  ])

  const data = coverLetters.map((cl) => ({
    id: cl.id,
    jobTitle: cl.jobTitle,
    userId: cl.userId,
    userEmail: cl.user.email,
    wordCount: cl.wordCount,
    language: cl.language,
    createdAt: cl.createdAt,
  }))

  return NextResponse.json({ data: { coverLetters: data, total, page } })
}

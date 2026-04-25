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

  const where: Prisma.ResumeWhereInput = {}

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { user: { email: { contains: search } } },
    ]
  }

  if (userId) {
    where.userId = userId
  }

  const [resumes, total] = await Promise.all([
    prisma.resume.findMany({
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
    prisma.resume.count({ where }),
  ])

  const data = resumes.map((r) => ({
    id: r.id,
    title: r.title,
    userId: r.userId,
    userEmail: r.user.email,
    templateId: r.templateId,
    language: r.language,
    rawPdfUrl: r.rawPdfUrl,
    createdAt: r.createdAt,
  }))

  return NextResponse.json({ data: { resumes: data, total, page } })
}

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')

  if (!pageParam || !limitParam) {
    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: coverLetters })
  }

  const page = Math.max(1, parseInt(pageParam, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 6))
  const skip = (page - 1) * limit

  const [coverLetters, total] = await Promise.all([
    prisma.coverLetter.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.coverLetter.count({ where: { userId: session.user.id } }),
  ])

  return NextResponse.json({
    data: { coverLetters, total, page, totalPages: Math.ceil(total / limit) },
  })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await prisma.coverLetter.deleteMany({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ data: { deletedCount: result.count } })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')

  const where = { status: 'active' as const }
  const select = {
    id: true,
    name: true,
    description: true,
    category: true,
    thumbnailUrl: true,
    sortOrder: true,
    status: true,
  }
  const orderBy = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }]

  if (!pageParam || !limitParam) {
    const templates = await prisma.template.findMany({ where, select, orderBy })
    return NextResponse.json({ data: templates })
  }

  const page = Math.max(1, parseInt(pageParam, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 6))
  const skip = (page - 1) * limit

  const [templates, total] = await Promise.all([
    prisma.template.findMany({ where, select, orderBy, skip, take: limit }),
    prisma.template.count({ where }),
  ])

  return NextResponse.json({
    data: { templates, total, page, totalPages: Math.ceil(total / limit) },
  })
}

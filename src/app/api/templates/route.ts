import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      thumbnailUrl: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({ data: templates })
}

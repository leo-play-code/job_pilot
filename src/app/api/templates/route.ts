import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const templates = await prisma.template.findMany({
    where: {
      // status='active' is the canonical filter; ensures draft/inactive templates are hidden
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      thumbnailUrl: true,
      sortOrder: true,
      status: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({ data: templates })
}

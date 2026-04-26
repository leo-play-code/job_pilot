import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const configSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(10),
  locationCodes: z.array(z.string()).max(10),
  subLocationCodes: z.array(z.string()).max(500).default([]),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  jobTypes: z.array(z.string()).max(5),
  industries: z.array(z.string()).max(10),
  coverLetterMode: z.enum(['AI_GENERATED', 'PLATFORM_DEFAULT']).default('AI_GENERATED'),
  coverLetterIndex: z.number().int().min(1).max(5).default(1),
  wordCount: z.enum(['SHORT', 'MEDIUM', 'LONG']).default('MEDIUM'),
  maxApplyCount: z.number().int().min(1).max(100).default(10),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const config = await prisma.jobSearchConfig.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ data: config })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = configSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 })
  }

  const config = await prisma.jobSearchConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  })

  return NextResponse.json({ data: config })
}

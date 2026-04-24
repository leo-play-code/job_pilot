import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: Promise<{ id: string }> }

const patchResumeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.record(z.unknown()).optional(),
  templateId: z.string().min(1).optional(),
  language: z.enum(['zh', 'en']).optional(),
  layoutOverride: z.object({
    sectionOrder: z.array(z.string()),
  }).optional(),
})

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: resume })
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = patchResumeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 })
  }

  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { content, layoutOverride, ...rest } = parsed.data
  const hasContentChange = content !== undefined || layoutOverride !== undefined

  const updated = await prisma.resume.update({
    where: { id },
    data: {
      ...rest,
      ...(content !== undefined && { content: content as object }),
      ...(layoutOverride !== undefined && { layoutOverride: layoutOverride as object }),
      // Clear cached PDF whenever content or layout changes
      ...(hasContentChange && { pdfUrl: null, pdfGeneratedAt: null }),
    },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.resume.deleteMany({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ data: null })
}

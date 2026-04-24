import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateTemplateThumbnail } from '@/lib/thumbnail'
import { uploadToS3, getS3Key } from '@/lib/s3'

function isAdmin(email?: string | null) {
  return email === process.env.ADMIN_EMAIL
}

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['tech', 'finance', 'creative', 'other']),
  sortOrder: z.number().int().default(0),
  htmlDefinition: z.object({
    css: z.string().min(1),
    layout: z.enum(['single', 'split']),
    sectionOrder: z.array(z.string()).optional(),
  }),
})

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const templates = await prisma.template.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ data: templates })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 422 })
  }

  const { htmlDefinition, ...meta } = parsed.data

  const template = await prisma.template.create({
    data: {
      ...meta,
      htmlDefinition: htmlDefinition as object,
    },
  })

  // Generate thumbnail in background (best-effort, won't fail the request)
  generateTemplateThumbnail(htmlDefinition)
    .then(async (png) => {
      if (!process.env.AWS_S3_BUCKET) return
      const key = getS3Key('template-thumbnail', template.id)
      const url = await uploadToS3(key, png, 'image/png')
      await prisma.template.update({ where: { id: template.id }, data: { thumbnailUrl: url } })
    })
    .catch((err) => console.error('[admin/templates] thumbnail generation failed:', err))

  return NextResponse.json({ data: template }, { status: 201 })
}

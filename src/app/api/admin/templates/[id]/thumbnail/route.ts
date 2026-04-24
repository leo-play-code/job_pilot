import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateTemplateThumbnail } from '@/lib/thumbnail'
import { uploadToS3, getS3Key } from '@/lib/s3'
import type { TemplateDefinition } from '@/types/resume'

interface Params { params: Promise<{ id: string }> }

function isAdmin(email?: string | null) {
  return email === process.env.ADMIN_EMAIL
}

export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!process.env.AWS_S3_BUCKET) {
    return NextResponse.json({ error: 'S3 not configured' }, { status: 503 })
  }

  const definition = template.htmlDefinition as unknown as TemplateDefinition
  const png = await generateTemplateThumbnail(definition)
  const key = getS3Key('template-thumbnail', template.id)
  const url = await uploadToS3(key, png, 'image/png')

  const updated = await prisma.template.update({
    where: { id },
    data: { thumbnailUrl: url },
  })

  return NextResponse.json({ data: updated })
}

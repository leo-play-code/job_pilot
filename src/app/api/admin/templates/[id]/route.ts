import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: Promise<{ id: string }> }

function isAdmin(email?: string | null) {
  return email === process.env.ADMIN_EMAIL
}

const patchTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.enum(['tech', 'finance', 'creative', 'other']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  htmlDefinition: z.object({
    css: z.string().min(1),
    layout: z.enum(['single', 'split']),
    sectionOrder: z.array(z.string()).optional(),
  }).optional(),
})

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = patchTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 })
  }

  const { htmlDefinition, status, ...rest } = parsed.data

  // Sync isActive with status for backward compatibility
  let derivedIsActive: boolean | undefined
  if (status === 'active') derivedIsActive = true
  else if (status === 'inactive') derivedIsActive = false

  const updated = await prisma.template.update({
    where: { id },
    data: {
      ...rest,
      ...(status !== undefined && { status }),
      ...(derivedIsActive !== undefined && { isActive: derivedIsActive }),
      ...(htmlDefinition !== undefined && { htmlDefinition: htmlDefinition as object }),
    },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.template.delete({ where: { id } })

  return NextResponse.json({ data: null })
}

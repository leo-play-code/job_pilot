import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(email?: string | null) {
  return email === process.env.ADMIN_EMAIL
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (target.email === session?.user?.email) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.usageLog.deleteMany({ where: { userId: id } }),
    prisma.coverLetter.deleteMany({ where: { userId: id } }),
    prisma.resume.deleteMany({ where: { userId: id } }),
    prisma.account.deleteMany({ where: { userId: id } }),
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ])

  return NextResponse.json({ data: { ok: true, deletedEmail: target.email } })
}

const updateUserSchema = z.object({
  plan: z.enum(['FREE', 'PRO']).optional(),
  credits: z.number().int().min(0).optional(),
}).refine(d => d.plan !== undefined || d.credits !== undefined, {
  message: 'At least one field required',
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.plan !== undefined && { plan: parsed.data.plan }),
      ...(parsed.data.credits !== undefined && { credits: parsed.data.credits }),
    },
    select: { id: true, email: true, plan: true, credits: true },
  })

  return NextResponse.json(user)
}

import { NextResponse } from 'next/server'
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

  const existing = await prisma.resume.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.coverLetter.updateMany({
    where: { resumeId: id },
    data: { resumeId: null },
  })

  await prisma.resume.delete({ where: { id } })

  return NextResponse.json({ data: { ok: true } })
}

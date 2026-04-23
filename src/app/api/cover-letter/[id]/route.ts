import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const coverLetter = await prisma.coverLetter.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!coverLetter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: coverLetter })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.coverLetter.deleteMany({
    where: { id: params.id, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}

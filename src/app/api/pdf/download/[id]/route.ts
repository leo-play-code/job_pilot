import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resume = await prisma.resume.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // TODO: call generateResumePdf(), return PDF buffer with Content-Disposition header
  return NextResponse.json({ data: null }, { status: 501 })
}

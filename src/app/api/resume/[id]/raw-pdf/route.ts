import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // 2. Ownership check
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, rawPdfUrl: true },
  })

  if (!resume) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 3. Check rawPdfUrl presence
  if (!resume.rawPdfUrl) {
    return NextResponse.json({ error: 'No raw PDF available' }, { status: 404 })
  }

  // 4. Return S3 URL
  return NextResponse.json({ data: { url: resume.rawPdfUrl } })
}

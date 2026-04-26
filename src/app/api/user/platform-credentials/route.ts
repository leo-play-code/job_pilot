import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { packEncrypted } from '@/lib/encryption'

const saveSchema = z.object({
  platform: z.enum(['JOB_104']),
  email: z.string().email(),
  password: z.string().min(1),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const credential = await prisma.userPlatformCredential.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: 'JOB_104' } },
    select: { id: true },
  })

  return NextResponse.json({ data: { exists: !!credential } })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = saveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const { platform, email, password } = parsed.data

  await prisma.userPlatformCredential.upsert({
    where: { userId_platform: { userId: session.user.id, platform } },
    create: {
      userId: session.user.id,
      platform,
      encryptedEmail: packEncrypted(email),
      encryptedPassword: packEncrypted(password),
    },
    update: {
      encryptedEmail: packEncrypted(email),
      encryptedPassword: packEncrypted(password),
    },
  })

  return NextResponse.json({ data: { success: true } })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.userPlatformCredential.deleteMany({
    where: { userId: session.user.id, platform: 'JOB_104' },
  })

  return NextResponse.json({ data: { success: true } })
}


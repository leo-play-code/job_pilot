import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { paddle } from '@/lib/paddle'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { paddleCustomerId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.paddleCustomerId) {
      return NextResponse.json({ error: 'no_paddle_customer' }, { status: 400 })
    }

    const portalSession = await paddle.customerPortalSessions.create(user.paddleCustomerId, [])

    return NextResponse.json({
      data: { portalUrl: portalSession.urls.general.overview },
    })
  } catch (error) {
    console.error('[paddle-create-portal-session] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

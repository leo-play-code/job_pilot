import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { launchBrowser } from '@/lib/puppeteer'
import { packEncrypted } from '@/lib/encryption'

const POLL_INTERVAL_MS = 2000
const MAX_WAIT_MS = 5 * 60 * 1000 // 5 minutes

export async function POST() {
  // Only available in local development
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: 'local_only', message: '此功能只能在本機開發環境使用' },
      { status: 403 },
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  // Must have credentials configured first
  const cred = await prisma.userPlatformCredential.findUnique({
    where: { userId_platform: { userId, platform: 'JOB_104' } },
    select: { id: true },
  })
  if (!cred) {
    return NextResponse.json(
      { error: 'credentials_not_configured', message: '請先設定 104 帳號密碼' },
      { status: 400 },
    )
  }

  const browser = await launchBrowser({ forceVisible: true })
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-TW,zh;q=0.9' })
  await page.setViewport({ width: 1280, height: 800 })

  try {
    await page.goto('https://login.104.com.tw/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Poll until user manually completes login (URL leaves signin/login domain)
    const startTime = Date.now()
    while (Date.now() - startTime < MAX_WAIT_MS) {
      const url = page.url()
      const stillOnLogin =
        url.includes('signin.104') || url.includes('login.104') || url.includes('oidc.104')
      if (!stillOnLogin) break
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    }

    // Check if still on login page (timeout)
    const finalUrl = page.url()
    if (
      finalUrl.includes('signin.104') ||
      finalUrl.includes('login.104') ||
      finalUrl.includes('oidc.104')
    ) {
      return NextResponse.json(
        { error: 'login_timeout', message: '等待登入逾時（5 分鐘），請重試' },
        { status: 408 },
      )
    }

    // Extract cookies from all 104 domains
    const cookies = await page.cookies(
      'https://www.104.com.tw',
      'https://104.com.tw',
      'https://vip.104.com.tw',
      'https://member.104.com.tw',
      'https://pro.104.com.tw',
    )

    if (!cookies.length) {
      return NextResponse.json(
        { error: 'no_cookies', message: '未能提取 Session，請重試' },
        { status: 500 },
      )
    }

    // Encrypt and store cookies
    const encryptedCookies = packEncrypted(JSON.stringify(cookies))
    await prisma.userPlatformCredential.update({
      where: { userId_platform: { userId, platform: 'JOB_104' } },
      data: { encryptedCookies, cookiesUpdatedAt: new Date() },
    })

    return NextResponse.json({ data: { success: true, cookiesCount: cookies.length } })
  } finally {
    await browser.close()
  }
}

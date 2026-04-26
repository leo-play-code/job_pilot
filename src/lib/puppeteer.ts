import type { Browser } from 'puppeteer'

export interface LaunchOptions {
  forceVisible?: boolean
}

export async function launchBrowser(opts?: LaunchOptions): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteerCore = (await import('puppeteer-core')).default
    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless as boolean,
    })
  }
  const headless = opts?.forceVisible ? false : process.env.PUPPETEER_HEADLESS !== 'false'
  const puppeteer = (await import('puppeteer')).default
  return puppeteer.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: headless ? 0 : 50,
  })
}

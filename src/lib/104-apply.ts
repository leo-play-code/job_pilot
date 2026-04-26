import type { Page } from 'puppeteer'
import { launchBrowser } from '@/lib/puppeteer'

export type Apply104ErrorType =
  | 'invalid_credentials'
  | 'captcha'
  | 'already_applied'
  | 'form_error'
  | 'timeout'
  | 'no_saved_cover_letter'
  | 'unknown'

export interface Apply104Params {
  jobUrl: string
  email: string
  password: string
  coverLetterContent?: string // undefined = use platform default (leave blank)
  coverLetterIndex?: number   // 1-5，PLATFORM_DEFAULT 時使用
}

export interface Apply104Result {
  success: boolean
  errorType?: Apply104ErrorType
  errorMessage?: string
}


export async function login104(page: Page, email: string, password: string): Promise<void> {
  // 104 uses a two-step login at signin.104.com.tw (reachable via login.104.com.tw/login)
  await page.goto('https://login.104.com.tw/login', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  })

  // Step 1: Fill in email / identity (id="identity", placeholder="輸入身分證或Email")
  await page.waitForSelector('#identity', { timeout: 15000 })
  await page.click('#identity', { clickCount: 3 })
  await page.type('#identity', email, { delay: 60 })

  // Press Enter to advance to the password step — more reliable than finding button by text
  await page.keyboard.press('Enter')

  // Step 2: Wait for the real password input to appear (distinct from name="fakeInput")
  await page.waitForFunction(
    () => {
      const inputs = Array.from(document.querySelectorAll('input[type="password"]'))
      return inputs.some(inp => (inp as HTMLInputElement).name !== 'fakeInput' && (inp as HTMLElement).offsetWidth > 0)
    },
    { timeout: 15000 },
  )

  const pwdSelector = 'input[type="password"]:not([name="fakeInput"])'
  await page.click(pwdSelector, { clickCount: 3 })
  await page.type(pwdSelector, password, { delay: 60 })

  // Press Enter to submit — avoids silent failure from btn?.click() when button text varies
  await page.keyboard.press('Enter')

  // Wait for login success — URL leaves signin/login domain
  await page.waitForFunction(
    () => !window.location.hostname.includes('signin.104') && !window.location.hostname.includes('login.104'),
    { timeout: 20000 },
  )
}

/** Apply to a single job using an already-logged-in page (no browser launch). */
export async function applyJobWithPage(
  page: Page,
  params: Omit<Apply104Params, 'email' | 'password'>,
): Promise<Apply104Result> {
  try {
    // Navigate to job page (already logged in)
    await page.goto(params.jobUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Check if already applied
    const alreadyApplied = await page.$(
      '[data-qa="applied-badge"], .applied-badge, [class*="already-applied"]',
    )
    if (alreadyApplied) {
      return { success: false, errorType: 'already_applied', errorMessage: '您已投遞過此職缺' }
    }

    // Step 3: Click apply button
    const applyBtn = await page.$(
      '[data-qa="btn-apply"], .js-apply-btn, button[class*="apply"], a[class*="apply"]',
    )
    if (!applyBtn) {
      return { success: false, errorType: 'form_error', errorMessage: '找不到投遞按鈕，104 頁面結構可能已更新' }
    }
    await applyBtn.click()

    // Step 4: Handle application modal
    await page.waitForSelector(
      '[data-qa="apply-modal"], .apply-modal, #apply-form, [class*="applyModal"]',
      { timeout: 10000 },
    )

    // Fill cover letter: AI_GENERATED → clear & type; PLATFORM_DEFAULT → load saved cover letter
    if (params.coverLetterContent) {
      // AI_GENERATED: clear textarea and fill with generated content
      const coverLetterInput = await page.$(
        'textarea[name="selfIntro"], textarea[data-qa*="cover"], [class*="selfIntro"] textarea, textarea[placeholder*="自我推薦"]',
      )
      if (coverLetterInput) {
        await coverLetterInput.click({ clickCount: 3 })
        await coverLetterInput.type(params.coverLetterContent, { delay: 8 })
      }
    } else if (params.coverLetterIndex) {
      // PLATFORM_DEFAULT: click "載入自薦信" button and select the N-th saved cover letter
      const loadBtn = await page.$(
        '[data-qa="load-cover-letter-btn"], .load-selfintro-btn, button:has-text("載入自薦信"), [class*="loadSelfIntro"]',
      )
      if (!loadBtn) {
        return {
          success: false,
          errorType: 'no_saved_cover_letter',
          errorMessage: '找不到預存自薦信，請至 104 → 會員中心 → 自薦信管理新增',
        }
      }
      await loadBtn.click()

      // Wait for the dropdown/list of saved cover letters to appear
      await page.waitForSelector(
        '[data-qa="cover-letter-list"], .selfintro-list, [class*="selfIntroList"], [class*="coverLetterList"]',
        { timeout: 8000 },
      )

      // Select the N-th option (1-indexed)
      const optionSelector =
        `[data-qa="cover-letter-list"] > *:nth-child(${params.coverLetterIndex}),` +
        `.selfintro-list > *:nth-child(${params.coverLetterIndex}),` +
        `[class*="selfIntroList"] > *:nth-child(${params.coverLetterIndex}),` +
        `[class*="coverLetterList"] > *:nth-child(${params.coverLetterIndex})`
      const option = await page.$(optionSelector)
      if (!option) {
        return {
          success: false,
          errorType: 'no_saved_cover_letter',
          errorMessage: `找不到第 ${params.coverLetterIndex} 份預存自薦信，請至 104 → 會員中心 → 自薦信管理新增`,
        }
      }
      await option.click()

      // Wait until the textarea is populated with the selected cover letter
      await page.waitForFunction(
        (selector: string) => {
          const textarea = document.querySelector(selector) as HTMLTextAreaElement | null
          return textarea !== null && textarea.value.trim() !== ''
        },
        { timeout: 8000 },
        'textarea[name="selfIntro"], textarea[data-qa*="cover"], [class*="selfIntro"] textarea, textarea[placeholder*="自我推薦"]',
      )
    }

    // Step 5: Submit
    const submitBtn = await page.$(
      '[data-qa="apply-submit-btn"], button[type="submit"], .btn-apply-submit',
    )
    if (!submitBtn) {
      return { success: false, errorType: 'form_error', errorMessage: '找不到送出按鈕' }
    }
    await submitBtn.click()

    // Wait for success confirmation
    await page.waitForSelector(
      '[data-qa="apply-success"], .apply-success, [class*="applySuccess"], [class*="apply-success"]',
      { timeout: 15000 },
    )

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.toLowerCase().includes('timeout')) {
      return { success: false, errorType: 'timeout', errorMessage: '操作逾時，請稍後再試' }
    }
    return { success: false, errorType: 'unknown', errorMessage: message }
  }
}

/** Convenience wrapper: launch browser, login, apply one job, close. */
export async function applyTo104Job(params: Apply104Params): Promise<Apply104Result> {
  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-TW,zh;q=0.9' })
  try {
    try {
      await login104(page, params.email, params.password)
    } catch {
      const captchaEl = await page.$(
        '[class*="captcha"], #recaptcha, iframe[src*="recaptcha"], [data-sitekey]',
      )
      if (captchaEl) {
        return { success: false, errorType: 'captcha', errorMessage: '偵測到 CAPTCHA，請先至 104 網站手動登入一次後再試' }
      }
      return { success: false, errorType: 'invalid_credentials', errorMessage: '104 帳號或密碼錯誤，請至設定頁更新帳號' }
    }
    return await applyJobWithPage(page, params)
  } finally {
    await browser.close()
  }
}

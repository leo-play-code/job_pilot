import type { Page } from 'puppeteer'
import { launchBrowser } from '@/lib/puppeteer'
import type { Job104SearchParams, Job104SearchResponse } from '@/lib/104-api'

function buildSearchUrl(params: Job104SearchParams): string {
  const url = new URL('https://www.104.com.tw/jobs/search/')
  if (params.keyword) url.searchParams.set('keyword', params.keyword)
  if (params.area) url.searchParams.set('area', params.area)
  if (params.jobcat) url.searchParams.set('jobcat', params.jobcat)
  if (params.indcat) url.searchParams.set('indcat', params.indcat)
  if (params.s9) url.searchParams.set('s9', params.s9)
  url.searchParams.set('order', params.order ?? '14')
  url.searchParams.set('ro', '0')
  if (params.page && params.page > 1) url.searchParams.set('page', String(params.page))
  if (params.rows) url.searchParams.set('rows', String(params.rows))
  return url.toString()
}

/** Search using an existing Puppeteer page (caller manages browser lifecycle). */
export async function search104JobsWithPage(
  page: Page,
  params: Job104SearchParams,
): Promise<Job104SearchResponse> {
  // Register response interceptor BEFORE navigation to avoid race condition.
  // The 104 Vue SPA automatically fires /jobs/search/list when it reads URL params on mount —
  // no need to interact with UI elements.
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/jobs/search/list'),
    { timeout: 30000 },
  )

  await page.goto(buildSearchUrl(params), { waitUntil: 'domcontentloaded', timeout: 30000 })

  const response = await responsePromise

  const contentType = response.headers()['content-type'] ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      `104 search returned non-JSON response (${contentType}); possible bot detection`,
    )
  }

  return (await response.json()) as Job104SearchResponse
}

/** Convenience wrapper: launch browser, search, close. */
export async function search104Jobs(params: Job104SearchParams): Promise<Job104SearchResponse> {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    return await search104JobsWithPage(page, params)
  } finally {
    await browser.close()
  }
}

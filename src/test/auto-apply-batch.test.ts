import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

vi.mock('@/lib/puppeteer', () => ({
  launchBrowser: vi.fn(),
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobSearchConfig: {
      findUnique: vi.fn(),
    },
    userPlatformCredential: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    resume: {
      findFirst: vi.fn(),
    },
    jobApplication: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    jobListing: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/104-search', () => ({
  search104JobsWithPage: vi.fn(),
}))

vi.mock('@/lib/104-api', () => ({
  mapJob104ToListing: vi.fn(),
}))

vi.mock('@/lib/encryption', () => ({
  unpackDecrypt: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({
  generateCoverLetter: vi.fn(),
}))

vi.mock('@/lib/104-apply', () => ({
  login104: vi.fn(),
  applyJobWithPage: vi.fn(),
}))

vi.mock('@/lib/credits', () => ({
  deductCredits: vi.fn(),
}))

vi.mock('@/lib/usage', () => ({
  recordUsage: vi.fn(),
}))

vi.mock('@/lib/constants', () => ({
  CREDIT_COSTS: { AUTO_APPLY: 1 },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { search104JobsWithPage } from '@/lib/104-search'
import { login104 } from '@/lib/104-apply'
import { launchBrowser } from '@/lib/puppeteer'
import { unpackDecrypt } from '@/lib/encryption'
import { POST } from '@/app/api/auto-apply/batch/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePostRequest(body: unknown = {}): Request {
  return new Request('http://localhost/api/auto-apply/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeFakePage() {
  return {
    setExtraHTTPHeaders: vi.fn().mockResolvedValue(undefined),
    $: vi.fn().mockResolvedValue(null),
  }
}

/**
 * Sets up the common mocks required for the batch route to reach the
 * search104JobsWithPage call. Tests then assert on how it was called.
 */
function setupCommonMocks(configOverrides: Record<string, unknown> = {}) {
  const fakePage = makeFakePage()
  const fakeBrowser = {
    newPage: vi.fn().mockResolvedValue(fakePage),
    close: vi.fn().mockResolvedValue(undefined),
  }
  vi.mocked(launchBrowser).mockResolvedValue(fakeBrowser as never)
  vi.mocked(login104).mockResolvedValue(undefined)

  vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)

  vi.mocked(prisma.jobSearchConfig.findUnique).mockResolvedValue({
    userId: 'user-1',
    keywords: ['前端工程師'],
    locationCodes: ['6001001000'],
    subLocationCodes: [],
    salaryMin: null,
    salaryMax: null,
    jobTypes: [],
    industries: [],
    coverLetterMode: 'PLATFORM_DEFAULT',
    coverLetterIndex: 1,
    wordCount: 'MEDIUM',
    maxApplyCount: 10,
    ...configOverrides,
  } as never)

  vi.mocked(prisma.userPlatformCredential.findUnique).mockResolvedValue({
    userId: 'user-1',
    platform: 'JOB_104',
    encryptedEmail: 'packed-email',
    encryptedPassword: 'packed-password',
  } as never)

  vi.mocked(unpackDecrypt).mockReturnValueOnce('test@example.com').mockReturnValueOnce('password123')

  vi.mocked(prisma.user.findUnique).mockResolvedValue({ credits: 100 } as never)

  vi.mocked(prisma.jobApplication.findMany).mockResolvedValue([] as never)

  // search returns empty list so the route short-circuits after the area check
  vi.mocked(search104JobsWithPage).mockResolvedValue({
    data: { list: [], totalPage: 0, totalCount: 0 },
  } as never)

  return { fakePage, fakeBrowser }
}

// ---------------------------------------------------------------------------
// Tests — area 參數邏輯
// ---------------------------------------------------------------------------

describe('POST /api/auto-apply/batch — area 參數邏輯', () => {
  beforeEach(() => vi.clearAllMocks())

  it('有 subLocationCodes 時，search104JobsWithPage 的 area 使用 subLocationCodes', async () => {
    setupCommonMocks({
      subLocationCodes: ['6001001001', '6001001002'],
      locationCodes: ['6001001000'],
    })

    const res = await POST(makePostRequest({}))

    // Route returns 200 (empty results) — we only care about the area argument
    expect(res.status).toBe(200)

    expect(search104JobsWithPage).toHaveBeenCalledTimes(1)
    const callParams = vi.mocked(search104JobsWithPage).mock.calls[0][1]
    expect(callParams.area).toBe('6001001001,6001001002')
  })

  it('沒有 subLocationCodes 時，search104JobsWithPage 的 area fallback 使用 locationCodes', async () => {
    setupCommonMocks({
      subLocationCodes: [],
      locationCodes: ['6001001000'],
    })

    const res = await POST(makePostRequest({}))

    expect(res.status).toBe(200)

    expect(search104JobsWithPage).toHaveBeenCalledTimes(1)
    const callParams = vi.mocked(search104JobsWithPage).mock.calls[0][1]
    expect(callParams.area).toBe('6001001000')
  })
})

// ---------------------------------------------------------------------------
// Tests — 登入優先於搜尋
// ---------------------------------------------------------------------------

describe('POST /api/auto-apply/batch — 登入優先於搜尋', () => {
  beforeEach(() => vi.clearAllMocks())

  it('login104 在 search104JobsWithPage 之前被呼叫', async () => {
    const callOrder: string[] = []
    setupCommonMocks()

    vi.mocked(login104).mockImplementation(async () => {
      callOrder.push('login')
    })
    vi.mocked(search104JobsWithPage).mockImplementation(async () => {
      callOrder.push('search')
      return { data: { list: [], totalPage: 0, totalCount: 0 } } as never
    })

    await POST(makePostRequest({}))

    expect(callOrder).toEqual(['login', 'search'])
  })

  it('login104 失敗（非 captcha）時回傳 400 invalid_credentials，不進入搜尋', async () => {
    setupCommonMocks()
    vi.mocked(login104).mockRejectedValue(new Error('login failed'))
    // fakePage.$ already returns null → no captcha detected

    const res = await POST(makePostRequest({}))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('invalid_credentials')
    expect(search104JobsWithPage).not.toHaveBeenCalled()
  })

  it('搜尋返回空陣列時回傳 200 且 message: 未找到符合條件的新職缺', async () => {
    setupCommonMocks()
    vi.mocked(search104JobsWithPage).mockResolvedValue({
      data: { list: [], totalPage: 0, totalCount: 0 },
    } as never)

    const res = await POST(makePostRequest({}))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.message).toBe('未找到符合條件的新職缺')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

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

vi.mock('@/lib/104-api', () => ({
  search104Jobs: vi.fn(),
  mapJob104ToListing: vi.fn(),
}))

vi.mock('@/lib/encryption', () => ({
  unpackDecrypt: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({
  generateCoverLetter: vi.fn(),
}))

vi.mock('@/lib/104-apply', () => ({
  applyTo104Job: vi.fn(),
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
import { search104Jobs } from '@/lib/104-api'
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

/**
 * Sets up the common mocks required for the batch route to reach the
 * search104Jobs call. Tests then assert on how search104Jobs was called.
 */
function setupCommonMocks(configOverrides: Record<string, unknown> = {}) {
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

  // search104Jobs returns empty list so the route short-circuits after the area check
  vi.mocked(search104Jobs).mockResolvedValue({
    data: { list: [], totalPage: 0, totalCount: 0 },
  } as never)
}

// ---------------------------------------------------------------------------
// Tests — area 參數邏輯
// ---------------------------------------------------------------------------

describe('POST /api/auto-apply/batch — area 參數邏輯', () => {
  beforeEach(() => vi.clearAllMocks())

  it('有 subLocationCodes 時，search104Jobs 的 area 使用 subLocationCodes', async () => {
    setupCommonMocks({
      subLocationCodes: ['6001001001', '6001001002'],
      locationCodes: ['6001001000'],
    })

    const res = await POST(makePostRequest({}))

    // Route returns 200 (empty results) — we only care about the area argument
    expect(res.status).toBe(200)

    expect(search104Jobs).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(search104Jobs).mock.calls[0][0]
    expect(callArgs.area).toBe('6001001001,6001001002')
  })

  it('沒有 subLocationCodes 時，search104Jobs 的 area fallback 使用 locationCodes', async () => {
    setupCommonMocks({
      subLocationCodes: [],
      locationCodes: ['6001001000'],
    })

    const res = await POST(makePostRequest({}))

    expect(res.status).toBe(200)

    expect(search104Jobs).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(search104Jobs).mock.calls[0][0]
    expect(callArgs.area).toBe('6001001000')
  })
})

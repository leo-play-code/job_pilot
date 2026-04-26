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
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/job-search/config/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost/api/job-search/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Minimal valid config body */
const baseConfig = {
  keywords: ['前端工程師'],
  locationCodes: ['6001001000'],
  jobTypes: [],
  industries: [],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/job-search/config', () => {
  beforeEach(() => vi.clearAllMocks())

  it('成功儲存，upsert 被呼叫且含 subLocationCodes 和 coverLetterIndex', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.jobSearchConfig.upsert).mockResolvedValue({
      id: 'cfg-1',
      userId: 'user-1',
      subLocationCodes: ['6001001001'],
      coverLetterIndex: 2,
    } as never)

    const res = await POST(
      makePostRequest({
        ...baseConfig,
        subLocationCodes: ['6001001001'],
        coverLetterIndex: 2,
      }),
    )

    expect(res.status).toBe(200)

    // Verify upsert was called
    expect(prisma.jobSearchConfig.upsert).toHaveBeenCalledTimes(1)

    const upsertCall = vi.mocked(prisma.jobSearchConfig.upsert).mock.calls[0][0]
    // Both create and update data should contain the new fields
    expect(upsertCall.create).toMatchObject({
      subLocationCodes: ['6001001001'],
      coverLetterIndex: 2,
    })
    expect(upsertCall.update).toMatchObject({
      subLocationCodes: ['6001001001'],
      coverLetterIndex: 2,
    })
  })

  it('subLocationCodes 超過 50 個 → 回傳 422', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)

    const tooMany = Array.from({ length: 51 }, (_, i) => `600100100${i}`)

    const res = await POST(
      makePostRequest({
        ...baseConfig,
        subLocationCodes: tooMany,
      }),
    )

    expect(res.status).toBe(422)
    expect(prisma.jobSearchConfig.upsert).not.toHaveBeenCalled()
  })

  it('coverLetterIndex 超出範圍 (6) → 回傳 422', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)

    const res = await POST(
      makePostRequest({
        ...baseConfig,
        coverLetterIndex: 6,
      }),
    )

    expect(res.status).toBe(422)
    expect(prisma.jobSearchConfig.upsert).not.toHaveBeenCalled()
  })

  it('未傳 coverLetterIndex → upsert 被呼叫且 coverLetterIndex 預設為 1', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.jobSearchConfig.upsert).mockResolvedValue({
      id: 'cfg-2',
      userId: 'user-1',
      coverLetterIndex: 1,
    } as never)

    const res = await POST(makePostRequest(baseConfig))

    expect(res.status).toBe(200)
    expect(prisma.jobSearchConfig.upsert).toHaveBeenCalledTimes(1)

    const upsertCall = vi.mocked(prisma.jobSearchConfig.upsert).mock.calls[0][0]
    // Zod default should apply: coverLetterIndex = 1
    expect(upsertCall.create).toMatchObject({ coverLetterIndex: 1 })
    expect(upsertCall.update).toMatchObject({ coverLetterIndex: 1 })
  })

  it('未登入 → 回傳 401', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await POST(makePostRequest(baseConfig))

    expect(res.status).toBe(401)
    expect(prisma.jobSearchConfig.upsert).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findFirst: vi.fn(),
    },
    coverLetter: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/ai', () => ({
  generateCoverLetter: vi.fn(),
}))

vi.mock('@/lib/usage', () => ({
  checkDailyLimit: vi.fn(),
  recordUsage: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateCoverLetter } from '@/lib/ai'
import { checkDailyLimit, recordUsage } from '@/lib/usage'
import { POST } from '@/app/api/cover-letter/generate/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGenerateRequest(body: object = {}) {
  return new Request('http://localhost/api/cover-letter/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobTitle: 'Software Engineer',
      jobDesc: 'Build scalable backend services using Node.js',
      wordCount: 'MEDIUM',
      language: 'en',
      ...body,
    }),
  })
}

// ---------------------------------------------------------------------------
// Tests — POST /api/cover-letter/generate
// ---------------------------------------------------------------------------

describe('POST /api/cover-letter/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await POST(makeGenerateRequest())
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when daily limit is exceeded', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockRejectedValue(new Error('daily_limit_reached'))

    const res = await POST(makeGenerateRequest())
    expect(res.status).toBe(429)

    const body = await res.json()
    expect(body.error).toBe('daily_limit_reached')
  })

  it('returns 422 when body is invalid (missing required fields)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)

    const res = await POST(
      new Request('http://localhost/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: 'Engineer' }), // missing jobDesc, wordCount, language
      }),
    )
    expect(res.status).toBe(422)
  })

  it('returns 200 with coverLetterId and content on success', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(generateCoverLetter).mockResolvedValue('This is the generated cover letter text.')
    vi.mocked(prisma.coverLetter.create).mockResolvedValue({
      id: 'cl-001',
      userId: 'user-1',
      jobTitle: 'Software Engineer',
      content: 'This is the generated cover letter text.',
    } as never)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    const res = await POST(makeGenerateRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveProperty('coverLetterId')
    expect(body.data).toHaveProperty('content')
    expect(body.data.coverLetterId).toBe('cl-001')
    expect(body.data.content).toBe('This is the generated cover letter text.')
  })

  it('calls prisma.coverLetter.create with correct data', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(generateCoverLetter).mockResolvedValue('Cover letter output')
    vi.mocked(prisma.coverLetter.create).mockResolvedValue({ id: 'cl-001' } as never)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    await POST(makeGenerateRequest({ jobTitle: 'Backend Engineer', jobDesc: 'Node.js APIs', wordCount: 'LONG', language: 'zh' }))

    expect(prisma.coverLetter.create).toHaveBeenCalledTimes(1)
    expect(prisma.coverLetter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          jobTitle: 'Backend Engineer',
          jobDesc: 'Node.js APIs',
          wordCount: 'LONG',
          language: 'zh',
          content: 'Cover letter output',
        }),
      }),
    )
  })

  it('returns 503 when AI is unavailable', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(generateCoverLetter).mockRejectedValue(new Error('OpenAI service down'))

    const res = await POST(makeGenerateRequest())
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.error).toBe('ai_unavailable')
  })

  it('fetches resume from DB when resumeId is provided', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue({
      id: 'resume-abc',
      userId: 'user-1',
      content: {
        personalInfo: { name: 'Jane Doe', email: 'jane@example.com' },
        experience: [],
        education: [],
        skills: ['Python'],
      },
    } as never)
    vi.mocked(generateCoverLetter).mockResolvedValue('Great cover letter')
    vi.mocked(prisma.coverLetter.create).mockResolvedValue({ id: 'cl-002' } as never)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    await POST(makeGenerateRequest({ resumeId: 'resume-abc' }))

    expect(prisma.resume.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'resume-abc', userId: 'user-1' }),
      }),
    )
  })

  it('calls recordUsage with GENERATE_COVER_LETTER', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(generateCoverLetter).mockResolvedValue('Cover letter content')
    vi.mocked(prisma.coverLetter.create).mockResolvedValue({ id: 'cl-001' } as never)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    await POST(makeGenerateRequest())

    expect(recordUsage).toHaveBeenCalledTimes(1)
    expect(recordUsage).toHaveBeenCalledWith('user-1', 'GENERATE_COVER_LETTER')
  })
})

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
      create: vi.fn(),
    },
    usageLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/ai', () => ({
  enhanceResume: vi.fn(),
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
import { enhanceResume } from '@/lib/ai'
import { checkDailyLimit, recordUsage } from '@/lib/usage'
import { POST } from '@/app/api/resume/generate/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_ENHANCED_RESUME = {
  personalInfo: { name: 'John Doe', email: 'john@example.com', phone: '0912345678' },
  summary: 'Experienced software engineer',
  experience: [
    {
      company: 'Acme Corp',
      title: 'Software Engineer',
      startDate: '2020',
      current: true,
      bullets: ['Led development of core APIs'],
    },
  ],
  education: [
    { school: 'NTU', degree: 'B.S.', field: 'Computer Science', startDate: '2016', endDate: '2020' },
  ],
  skills: ['TypeScript', 'React', 'Node.js'],
}

function makeGenerateRequest(body: object = {}) {
  return new Request('http://localhost/api/resume/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'John Doe, Software Engineer with 5 years of experience',
      templateId: 'modern',
      language: 'zh',
      ...body,
    }),
  })
}

// ---------------------------------------------------------------------------
// Tests — POST /api/resume/generate
// ---------------------------------------------------------------------------

describe('POST /api/resume/generate', () => {
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

  it('returns 422 when body is invalid', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)

    const res = await POST(
      new Request('http://localhost/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', templateId: 'modern', language: 'zh' }),
      }),
    )
    expect(res.status).toBe(422)
  })

  it('returns 503 when AI is unavailable', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(enhanceResume).mockRejectedValue(new Error('OpenAI service down'))

    const res = await POST(makeGenerateRequest())
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.error).toBe('ai_unavailable')
  })

  it('returns 200 with resumeId and content on success', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(enhanceResume).mockResolvedValue(MOCK_ENHANCED_RESUME as never)
    vi.mocked(prisma.resume.create).mockResolvedValue({
      id: 'resume-001',
      userId: 'user-1',
      title: 'John Doe — 1/1/2024',
      content: MOCK_ENHANCED_RESUME,
      templateId: 'modern',
      language: 'zh',
    } as never)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    const res = await POST(makeGenerateRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveProperty('resumeId')
    expect(body.data).toHaveProperty('content')
    expect(body.data.resumeId).toBe('resume-001')
    expect(body.data.content).toMatchObject({ personalInfo: { name: 'John Doe' } })
  })

  it('calls prisma.resume.create once with correct data', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(enhanceResume).mockResolvedValue(MOCK_ENHANCED_RESUME as never)
    vi.mocked(prisma.resume.create).mockResolvedValue({ id: 'resume-001', userId: 'user-1' } as never)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    await POST(makeGenerateRequest({ language: 'zh', templateId: 'modern' }))

    expect(prisma.resume.create).toHaveBeenCalledTimes(1)
    expect(prisma.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          templateId: 'modern',
          language: 'zh',
          content: expect.objectContaining({ personalInfo: expect.objectContaining({ name: 'John Doe' }) }),
        }),
      }),
    )
  })

  it('calls recordUsage with GENERATE_RESUME action', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(enhanceResume).mockResolvedValue(MOCK_ENHANCED_RESUME as never)
    vi.mocked(prisma.resume.create).mockResolvedValue({ id: 'resume-001', userId: 'user-1' } as never)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    await POST(makeGenerateRequest())

    expect(recordUsage).toHaveBeenCalledTimes(1)
    expect(recordUsage).toHaveBeenCalledWith('user-1', 'GENERATE_RESUME')
  })

  it('passes string content directly to enhanceResume', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(enhanceResume).mockResolvedValue(MOCK_ENHANCED_RESUME as never)
    vi.mocked(prisma.resume.create).mockResolvedValue({ id: 'resume-001', userId: 'user-1' } as never)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    const rawContent = 'My custom resume string content'
    await POST(makeGenerateRequest({ content: rawContent }))

    expect(enhanceResume).toHaveBeenCalledWith(rawContent, 'zh')
  })
})

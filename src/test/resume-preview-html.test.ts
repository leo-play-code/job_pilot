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
      findUnique: vi.fn(),
    },
    template: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/pdf', () => ({
  buildResumeHtml: vi.fn(),
  BUILTIN_TEMPLATE_DEFINITIONS: {
    modern: {
      css: 'body{font-family:sans-serif;color:#222;margin:0} h1{font-size:26px} h2{font-size:14px}',
      layout: 'single',
      sectionOrder: ['summary', 'experience', 'education', 'skills'],
    },
    professional: {
      css: 'body{font-family:Georgia,serif;display:grid} .sidebar{background:#1a2744;color:#fff}',
      layout: 'split',
      sectionOrder: ['summary', 'experience'],
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { buildResumeHtml, BUILTIN_TEMPLATE_DEFINITIONS } from '@/lib/pdf'
import { GET } from '@/app/api/resume/[id]/preview-html/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(id: string): Request {
  return new Request(`http://localhost/api/resume/${id}/preview-html`)
}

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

const MOCK_RESUME_CONTENT = {
  personalInfo: { name: 'Alice Chen', email: 'alice@example.com', phone: '0912345678' },
  summary: 'Senior software engineer',
  experience: [
    {
      company: 'TechCorp',
      title: 'Senior Engineer',
      startDate: '2020',
      current: true,
      bullets: ['Architected core platform'],
    },
  ],
  education: [{ school: 'NTU', degree: 'B.S.', field: 'CS', startDate: '2016', endDate: '2020' }],
  skills: ['TypeScript', 'React'],
}

const MOCK_RESUME = {
  id: 'resume-001',
  userId: 'user-1',
  title: 'Alice Chen',
  content: MOCK_RESUME_CONTENT,
  templateId: 'modern',
  language: 'en',
  layoutOverride: null,
}

// ---------------------------------------------------------------------------
// Tests — GET /api/resume/:id/preview-html
// ---------------------------------------------------------------------------

describe('GET /api/resume/:id/preview-html', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await GET(makeRequest('resume-001'), makeParams('resume-001'))
    expect(res.status).toBe(401)
  })

  it('returns 200 with html field when resume exists and user is owner', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(MOCK_RESUME as never)
    vi.mocked(buildResumeHtml).mockReturnValue(
      `<html><head><style>body{font-size:14px}</style></head><body><h1>${MOCK_RESUME_CONTENT.personalInfo.name}</h1></body></html>`,
    )

    const res = await GET(makeRequest('resume-001'), makeParams('resume-001'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveProperty('html')
    expect(typeof body.data.html).toBe('string')
  })

  it('html contains personalInfo.name', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(MOCK_RESUME as never)
    vi.mocked(buildResumeHtml).mockReturnValue(
      `<html><head><style>body{color:#222}</style></head><body><h1>Alice Chen</h1></body></html>`,
    )

    const res = await GET(makeRequest('resume-001'), makeParams('resume-001'))
    const body = await res.json()

    expect(body.data.html).toContain('Alice Chen')
  })

  it('html contains <style> tag (CSS injected)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(MOCK_RESUME as never)
    vi.mocked(buildResumeHtml).mockReturnValue(
      `<html><head><style>body{font-family:sans-serif}</style></head><body><h1>Alice Chen</h1></body></html>`,
    )

    const res = await GET(makeRequest('resume-001'), makeParams('resume-001'))
    const body = await res.json()

    expect(body.data.html).toContain('<style>')
  })

  it('returns 403 when resume exists but belongs to a different user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'other-user' } } as never)
    // findFirst (with userId filter) returns null — not the owner
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(null)
    // findUnique (ownership check) returns the resume — it exists but not owned by caller
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({ id: 'resume-001' } as never)

    const res = await GET(makeRequest('resume-001'), makeParams('resume-001'))
    expect(res.status).toBe(403)
  })

  it('returns 404 when resume does not exist at all', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(null)

    const res = await GET(makeRequest('nonexistent-id'), makeParams('nonexistent-id'))
    expect(res.status).toBe(404)
  })

  it('calls buildResumeHtml with correct arguments (builtin template)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(MOCK_RESUME as never)
    vi.mocked(buildResumeHtml).mockReturnValue('<html><head><style>body{}</style></head><body>Test</body></html>')

    await GET(makeRequest('resume-001'), makeParams('resume-001'))

    expect(buildResumeHtml).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(buildResumeHtml).mock.calls[0]
    // First arg: resume content
    expect(callArgs[0]).toMatchObject({ personalInfo: expect.objectContaining({ name: 'Alice Chen' }) })
    // Second arg: template definition (builtin 'modern')
    expect(callArgs[1]).toEqual(BUILTIN_TEMPLATE_DEFINITIONS.modern)
    // Third arg: language
    expect(callArgs[2]).toBe('en')
    // Fourth arg: no layoutOverride sectionOrder
    expect(callArgs[3]).toBeUndefined()
  })

  it('uses DB template definition for custom templateId', async () => {
    const customTemplate = {
      css: '.custom{color:red}',
      layout: 'single' as const,
      sectionOrder: ['summary', 'skills'],
    }

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue({
      ...MOCK_RESUME,
      templateId: 'custom-template-id-xyz',
    } as never)
    vi.mocked(prisma.template.findUnique).mockResolvedValue({
      id: 'custom-template-id-xyz',
      htmlDefinition: customTemplate,
    } as never)
    vi.mocked(buildResumeHtml).mockReturnValue('<html><head><style>.custom{color:red}</style></head><body>Custom</body></html>')

    const res = await GET(makeRequest('resume-001'), makeParams('resume-001'))
    expect(res.status).toBe(200)

    // buildResumeHtml should have been called with the DB template definition
    const buildCallArgs = vi.mocked(buildResumeHtml).mock.calls[0]
    // Second argument should be the DB template definition
    expect(buildCallArgs[1]).toEqual(customTemplate)
  })
})

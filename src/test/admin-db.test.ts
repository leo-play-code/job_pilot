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
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    coverLetter: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    usageLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GET as getResumes } from '@/app/api/admin/resumes/route'
import { DELETE as deleteResume } from '@/app/api/admin/resumes/[id]/route'
import { GET as getCoverLetters } from '@/app/api/admin/cover-letters/route'
import { DELETE as deleteCoverLetter } from '@/app/api/admin/cover-letters/[id]/route'
import { GET as getUsageLogs } from '@/app/api/admin/usage-logs/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

process.env.ADMIN_EMAIL = 'admin@test.com'

const ADMIN_SESSION = { user: { email: 'admin@test.com' } }
const NON_ADMIN_SESSION = { user: { email: 'notadmin@test.com' } }

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

// ---------------------------------------------------------------------------
// Test 1: GET /api/admin/resumes
// ---------------------------------------------------------------------------

describe('GET /api/admin/resumes', () => {
  const mockResumes = [
    {
      id: 'res-1',
      title: 'My Resume',
      userId: 'user-1',
      templateId: 'modern',
      language: 'zh',
      rawPdfUrl: null,
      createdAt: new Date('2026-01-01'),
      user: { email: 'user1@test.com' },
    },
    {
      id: 'res-2',
      title: 'Another Resume',
      userId: 'user-2',
      templateId: 'professional',
      language: 'en',
      rawPdfUrl: null,
      createdAt: new Date('2026-01-02'),
      user: { email: 'user2@test.com' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@test.com'
  })

  it('returns 200 with resumes list and total for admin session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.resume.findMany).mockResolvedValueOnce(mockResumes as any)
    vi.mocked(prisma.resume.count).mockResolvedValueOnce(2)

    const req = new Request('http://localhost/api/admin/resumes')
    const res = await getResumes(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.total).toBe(2)
    expect(json.data.page).toBe(1)
    expect(json.data.resumes).toHaveLength(2)
  })

  it('maps user.email to userEmail on each resume', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.resume.findMany).mockResolvedValueOnce(mockResumes as any)
    vi.mocked(prisma.resume.count).mockResolvedValueOnce(2)

    const req = new Request('http://localhost/api/admin/resumes')
    const res = await getResumes(req)
    const json = await res.json()

    expect(json.data.resumes[0].userEmail).toBe('user1@test.com')
    expect(json.data.resumes[1].userEmail).toBe('user2@test.com')
    // raw user object should not be exposed
    expect(json.data.resumes[0].user).toBeUndefined()
  })

  it('returns 403 for non-admin session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(NON_ADMIN_SESSION as any)

    const req = new Request('http://localhost/api/admin/resumes')
    const res = await getResumes(req)

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })

  it('calls findMany with where clause containing search term when ?search is provided', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.resume.findMany).mockResolvedValueOnce([mockResumes[0]] as any)
    vi.mocked(prisma.resume.count).mockResolvedValueOnce(1)

    const req = new Request('http://localhost/api/admin/resumes?search=foo')
    await getResumes(req)

    expect(prisma.resume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: expect.objectContaining({ contains: 'foo' }) }),
          ]),
        }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// Test 2: DELETE /api/admin/resumes/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/admin/resumes/:id', () => {
  const mockResume = {
    id: 'test-id',
    title: 'Resume to Delete',
    userId: 'user-1',
    templateId: 'modern',
    language: 'zh',
    rawPdfUrl: null,
    createdAt: new Date('2026-01-01'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@test.com'
  })

  it('returns 200 with ok:true for admin deleting existing resume', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(mockResume as any)
    vi.mocked(prisma.coverLetter.updateMany).mockResolvedValueOnce({ count: 1 } as any)
    vi.mocked(prisma.resume.delete).mockResolvedValueOnce(mockResume as any)

    const req = new Request('http://localhost/api/admin/resumes/test-id', { method: 'DELETE' })
    const res = await deleteResume(req, makeParams('test-id'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.ok).toBe(true)
  })

  it('nullifies related coverLetter.resumeId before deleting', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(mockResume as any)
    vi.mocked(prisma.coverLetter.updateMany).mockResolvedValueOnce({ count: 1 } as any)
    vi.mocked(prisma.resume.delete).mockResolvedValueOnce(mockResume as any)

    const req = new Request('http://localhost/api/admin/resumes/test-id', { method: 'DELETE' })
    await deleteResume(req, makeParams('test-id'))

    expect(prisma.coverLetter.updateMany).toHaveBeenCalledWith({
      where: { resumeId: 'test-id' },
      data: { resumeId: null },
    })
  })

  it('returns 403 for non-admin session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(NON_ADMIN_SESSION as any)

    const req = new Request('http://localhost/api/admin/resumes/test-id', { method: 'DELETE' })
    const res = await deleteResume(req, makeParams('test-id'))

    expect(res.status).toBe(403)
  })

  it('returns 404 when resume does not exist', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/admin/resumes/nonexistent', { method: 'DELETE' })
    const res = await deleteResume(req, makeParams('nonexistent'))

    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Test 3: GET /api/admin/cover-letters
// ---------------------------------------------------------------------------

describe('GET /api/admin/cover-letters', () => {
  const mockCoverLetters = [
    {
      id: 'cl-1',
      jobTitle: 'Frontend Engineer',
      userId: 'user-1',
      wordCount: 300,
      language: 'zh',
      createdAt: new Date('2026-01-01'),
      user: { email: 'user1@test.com' },
    },
    {
      id: 'cl-2',
      jobTitle: 'Backend Engineer',
      userId: 'user-2',
      wordCount: 250,
      language: 'en',
      createdAt: new Date('2026-01-02'),
      user: { email: 'user2@test.com' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@test.com'
  })

  it('returns 200 with cover letters list and total for admin session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.coverLetter.findMany).mockResolvedValueOnce(mockCoverLetters as any)
    vi.mocked(prisma.coverLetter.count).mockResolvedValueOnce(2)

    const req = new Request('http://localhost/api/admin/cover-letters')
    const res = await getCoverLetters(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.total).toBe(2)
    expect(json.data.page).toBe(1)
    expect(json.data.coverLetters).toHaveLength(2)
  })

  it('maps user.email to userEmail on each cover letter', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.coverLetter.findMany).mockResolvedValueOnce(mockCoverLetters as any)
    vi.mocked(prisma.coverLetter.count).mockResolvedValueOnce(2)

    const req = new Request('http://localhost/api/admin/cover-letters')
    const res = await getCoverLetters(req)
    const json = await res.json()

    expect(json.data.coverLetters[0].userEmail).toBe('user1@test.com')
    expect(json.data.coverLetters[1].userEmail).toBe('user2@test.com')
    expect(json.data.coverLetters[0].user).toBeUndefined()
  })

  it('returns 403 for non-admin session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(NON_ADMIN_SESSION as any)

    const req = new Request('http://localhost/api/admin/cover-letters')
    const res = await getCoverLetters(req)

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })
})

// ---------------------------------------------------------------------------
// Test 4: DELETE /api/admin/cover-letters/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/admin/cover-letters/:id', () => {
  const mockCoverLetter = {
    id: 'cl-test-id',
    jobTitle: 'Software Engineer',
    userId: 'user-1',
    wordCount: 300,
    language: 'zh',
    createdAt: new Date('2026-01-01'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@test.com'
  })

  it('returns 200 with ok:true for admin deleting existing cover letter', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce(mockCoverLetter as any)
    vi.mocked(prisma.coverLetter.delete).mockResolvedValueOnce(mockCoverLetter as any)

    const req = new Request('http://localhost/api/admin/cover-letters/cl-test-id', { method: 'DELETE' })
    const res = await deleteCoverLetter(req, makeParams('cl-test-id'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.ok).toBe(true)
  })

  it('returns 403 for non-admin session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(NON_ADMIN_SESSION as any)

    const req = new Request('http://localhost/api/admin/cover-letters/cl-test-id', { method: 'DELETE' })
    const res = await deleteCoverLetter(req, makeParams('cl-test-id'))

    expect(res.status).toBe(403)
  })

  it('returns 404 when cover letter does not exist', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/admin/cover-letters/nonexistent', { method: 'DELETE' })
    const res = await deleteCoverLetter(req, makeParams('nonexistent'))

    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Test 5: GET /api/admin/usage-logs
// ---------------------------------------------------------------------------

describe('GET /api/admin/usage-logs', () => {
  const mockLogs = [
    {
      id: 'log-1',
      userId: 'user-1',
      action: 'GENERATE_RESUME',
      date: '2026-01-01',
      createdAt: new Date('2026-01-01'),
      user: { email: 'user1@test.com' },
    },
    {
      id: 'log-2',
      userId: 'user-2',
      action: 'PARSE_PDF',
      date: '2026-01-02',
      createdAt: new Date('2026-01-02'),
      user: { email: 'user2@test.com' },
    },
    {
      id: 'log-3',
      userId: 'user-1',
      action: 'GENERATE_COVER_LETTER',
      date: '2026-01-03',
      createdAt: new Date('2026-01-03'),
      user: { email: 'user1@test.com' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@test.com'
  })

  it('returns 200 with logs list and total for admin session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.usageLog.findMany).mockResolvedValueOnce(mockLogs as any)
    vi.mocked(prisma.usageLog.count).mockResolvedValueOnce(3)

    const req = new Request('http://localhost/api/admin/usage-logs')
    const res = await getUsageLogs(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.total).toBe(3)
    expect(json.data.page).toBe(1)
    expect(json.data.logs).toHaveLength(3)
  })

  it('maps user.email to userEmail on each log', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.usageLog.findMany).mockResolvedValueOnce(mockLogs as any)
    vi.mocked(prisma.usageLog.count).mockResolvedValueOnce(3)

    const req = new Request('http://localhost/api/admin/usage-logs')
    const res = await getUsageLogs(req)
    const json = await res.json()

    expect(json.data.logs[0].userEmail).toBe('user1@test.com')
    expect(json.data.logs[1].userEmail).toBe('user2@test.com')
    expect(json.data.logs[2].userEmail).toBe('user1@test.com')
    // action should be present
    expect(json.data.logs[0].action).toBe('GENERATE_RESUME')
    expect(json.data.logs[0].user).toBeUndefined()
  })

  it('calls findMany with where.action filter when ?action is provided', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any)
    vi.mocked(prisma.usageLog.findMany).mockResolvedValueOnce([mockLogs[0]] as any)
    vi.mocked(prisma.usageLog.count).mockResolvedValueOnce(1)

    const req = new Request('http://localhost/api/admin/usage-logs?action=GENERATE_RESUME')
    await getUsageLogs(req)

    expect(prisma.usageLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          action: 'GENERATE_RESUME',
        }),
      }),
    )
  })

  it('returns 403 for non-admin session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(NON_ADMIN_SESSION as any)

    const req = new Request('http://localhost/api/admin/usage-logs')
    const res = await getUsageLogs(req)

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })
})

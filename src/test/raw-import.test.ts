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
      findFirst: vi.fn(),
    },
    coverLetter: {
      create: vi.fn(),
    },
    usageLog: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/pdf', () => ({
  parsePdf: vi.fn(),
}))

vi.mock('@/lib/s3', () => ({
  uploadToS3: vi.fn(),
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
import { parsePdf } from '@/lib/pdf'
import { uploadToS3 } from '@/lib/s3'
import { generateCoverLetter } from '@/lib/ai'
import { checkDailyLimit, recordUsage } from '@/lib/usage'

import { POST as importRawPost } from '@/app/api/resume/import-raw/route'
import { GET as rawPdfGet } from '@/app/api/resume/[id]/raw-pdf/route'
import { POST as coverLetterGeneratePost } from '@/app/api/cover-letter/generate/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a Blob that passes `instanceof Blob` AND has a working `.arrayBuffer()`.
 *
 * jsdom's Blob.arrayBuffer() is either missing or broken; we patch it on the
 * instance so the route's `await file.arrayBuffer()` call works correctly.
 */
function makeBlobWithArrayBuffer(buffer: Buffer, type: string): Blob {
  // Convert Buffer → plain string to satisfy TypeScript's strict BlobPart typing
  const blob = new Blob([buffer.toString('binary')], { type })
  // Patch arrayBuffer directly on the instance
  ;(blob as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = () => {
    const ab = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer
    return Promise.resolve(ab)
  }
  return blob
}

/** Build a Request whose formData() returns a fully controlled mock FormData */
function makePdfRequest(opts: {
  title?: string
  language?: string
  pdfBuffer?: Buffer
  fileType?: string
  includeFile?: boolean
} = {}): Request {
  const {
    title = 'My Resume',
    language = 'zh',
    pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content'),
    fileType = 'application/pdf',
    includeFile = true,
  } = opts

  const mockFile = includeFile
    ? makeBlobWithArrayBuffer(pdfBuffer, fileType)
    : null

  // Mock FormData whose .get() returns the objects above
  const mockFormData = {
    get: (key: string) => {
      if (key === 'file') return mockFile
      if (key === 'title') return title ?? null
      if (key === 'language') return language ?? null
      return null
    },
  }

  // Create a minimal request, override .formData()
  const req = new Request('http://localhost/api/resume/import-raw', { method: 'POST' })
  req.formData = () => Promise.resolve(mockFormData as unknown as FormData)
  return req
}

/** Build a GET request for raw-pdf route */
function makeRawPdfRequest(): Request {
  return new Request('http://localhost/api/resume/test-id/raw-pdf')
}

/** Build params object matching the dynamic route signature */
function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

// ---------------------------------------------------------------------------
// Test 1 — POST /api/resume/import-raw
// ---------------------------------------------------------------------------

describe('POST /api/resume/import-raw', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no S3 bucket configured (so rawPdfUrl stays '')
    delete process.env.AWS_S3_BUCKET
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await importRawPost(makePdfRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 422 when no file is provided', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)

    const formData = new FormData()
    const req = new Request('http://localhost/api/resume/import-raw', {
      method: 'POST',
      body: formData,
    })

    const res = await importRawPost(req)
    expect(res.status).toBe(422)
  })

  it('returns 422 when file is not a PDF', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)

    const res = await importRawPost(makePdfRequest({ fileType: 'text/plain' }))
    expect(res.status).toBe(422)
  })

  it('returns 200 with resumeId and title; prisma.resume.create called once; no usageLog', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(parsePdf).mockResolvedValue('John Doe | Software Engineer\nExperience: ...')
    vi.mocked(prisma.resume.create).mockResolvedValue({
      id: 'resume-abc',
      title: 'My Resume',
      userId: 'user-1',
    } as never)

    const res = await importRawPost(makePdfRequest({ title: 'My Resume' }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveProperty('resumeId')
    expect(body.data).toHaveProperty('title')
    expect(typeof body.data.resumeId).toBe('string')
    expect(typeof body.data.title).toBe('string')

    // prisma.resume.create called exactly once
    expect(prisma.resume.create).toHaveBeenCalledTimes(1)

    // usageLog.create must NOT be called (no AI involved)
    expect(prisma.usageLog.create).not.toHaveBeenCalled()
  })

  it('content.rawText is non-empty string when parsePdf returns text', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(parsePdf).mockResolvedValue('Extracted resume text from PDF')
    vi.mocked(prisma.resume.create).mockResolvedValue({
      id: 'resume-xyz',
      title: 'My Resume',
      userId: 'user-1',
    } as never)

    await importRawPost(makePdfRequest())

    const createCall = vi.mocked(prisma.resume.create).mock.calls[0][0]
    const content = (createCall as unknown as { data: { content: { rawText: string } } }).data.content
    expect(typeof content.rawText).toBe('string')
    expect(content.rawText.length).toBeGreaterThan(0)
    expect(content.rawText).toBe('Extracted resume text from PDF')
  })

  it('rawPdfUrl field exists in create call (string, can be empty when no S3 bucket)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(parsePdf).mockResolvedValue('Some resume text')
    vi.mocked(prisma.resume.create).mockResolvedValue({
      id: 'resume-xyz',
      title: 'test',
      userId: 'user-1',
    } as never)

    await importRawPost(makePdfRequest())

    const createCall = vi.mocked(prisma.resume.create).mock.calls[0][0]
    const data = (createCall as unknown as { data: Record<string, unknown> }).data
    expect(data).toHaveProperty('rawPdfUrl')
    expect(typeof data.rawPdfUrl).toBe('string')
    // No AWS_S3_BUCKET → empty string
    expect(data.rawPdfUrl).toBe('')
  })

  it('rawPdfUrl is set to S3 URL when AWS_S3_BUCKET is configured', async () => {
    process.env.AWS_S3_BUCKET = 'my-bucket'
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(parsePdf).mockResolvedValue('Resume text')
    vi.mocked(uploadToS3).mockResolvedValue('https://cdn.example.com/resumes/user-1/resume-id.pdf')
    vi.mocked(prisma.resume.create).mockResolvedValue({
      id: 'resume-s3',
      title: 'My Resume',
      userId: 'user-1',
    } as never)

    await importRawPost(makePdfRequest())

    const createCall = vi.mocked(prisma.resume.create).mock.calls[0][0]
    const data = (createCall as unknown as { data: Record<string, unknown> }).data
    expect(typeof data.rawPdfUrl).toBe('string')
    expect((data.rawPdfUrl as string).startsWith('https://')).toBe(true)

    delete process.env.AWS_S3_BUCKET
  })

  it('rawText stays empty string when parsePdf throws (non-fatal)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(parsePdf).mockRejectedValue(new Error('PDF parse failed'))
    vi.mocked(prisma.resume.create).mockResolvedValue({
      id: 'resume-err',
      title: 'My Resume',
      userId: 'user-1',
    } as never)

    // Should still return 200
    const res = await importRawPost(makePdfRequest())
    expect(res.status).toBe(200)

    const createCall = vi.mocked(prisma.resume.create).mock.calls[0][0]
    const content = (createCall as unknown as { data: { content: { rawText: string } } }).data.content
    expect(content.rawText).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Test 2 — GET /api/resume/:id/raw-pdf
// ---------------------------------------------------------------------------

describe('GET /api/resume/:id/raw-pdf', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await rawPdfGet(makeRawPdfRequest(), makeParams('test-id'))
    expect(res.status).toBe(401)
  })

  it('returns 200 with url when resume has rawPdfUrl', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue({
      id: 'test-id',
      rawPdfUrl: 'https://cdn.example.com/resumes/user-1/test-id.pdf',
    } as never)

    const res = await rawPdfGet(makeRawPdfRequest(), makeParams('test-id'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveProperty('url')
    expect(body.data.url).toBe('https://cdn.example.com/resumes/user-1/test-id.pdf')
  })

  it('returns 404 when rawPdfUrl is empty string', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue({
      id: 'test-id',
      rawPdfUrl: '',
    } as never)

    const res = await rawPdfGet(makeRawPdfRequest(), makeParams('test-id'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when rawPdfUrl is null', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue({
      id: 'test-id',
      rawPdfUrl: null,
    } as never)

    const res = await rawPdfGet(makeRawPdfRequest(), makeParams('test-id'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when resume does not exist (non-owner)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'other-user' } } as never)
    // The DB query includes userId filter, so returns null for non-owner
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(null)

    const res = await rawPdfGet(makeRawPdfRequest(), makeParams('test-id'))
    expect(res.status).toBe(404)
  })

  it('queries with correct userId for ownership check', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-42' } } as never)
    vi.mocked(prisma.resume.findFirst).mockResolvedValue({
      id: 'test-id',
      rawPdfUrl: 'https://example.com/file.pdf',
    } as never)

    await rawPdfGet(makeRawPdfRequest(), makeParams('test-id'))

    expect(prisma.resume.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-42', id: 'test-id' }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// Test 3 — Unit: cover letter generation uses rawText as context
// ---------------------------------------------------------------------------

describe('POST /api/cover-letter/generate — rawText as context', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes rawText directly to generateCoverLetter when resume has rawText', async () => {
    const rawText = 'Full resume text: John Doe, Software Engineer at Acme Corp...'

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    // Mock resume with rawText
    vi.mocked(prisma.resume.findFirst).mockResolvedValue({
      id: 'resume-raw',
      userId: 'user-1',
      content: {
        personalInfo: { name: 'John Doe', email: 'john@example.com' },
        experience: [{ company: 'Acme Corp', title: 'Engineer', startDate: '2020', current: true, bullets: [] }],
        education: [],
        skills: ['TypeScript'],
        rawText,
      },
    } as never)

    vi.mocked(generateCoverLetter).mockResolvedValue('Generated cover letter content')
    vi.mocked(prisma.coverLetter.create).mockResolvedValue({
      id: 'cl-1',
      content: 'Generated cover letter content',
    } as never)

    const req = new Request('http://localhost/api/cover-letter/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeId: 'resume-raw',
        jobTitle: 'Software Engineer',
        jobDesc: 'Build backend services',
        wordCount: 'MEDIUM',
        language: 'en',
      }),
    })

    const res = await coverLetterGeneratePost(req)
    expect(res.status).toBe(200)

    // generateCoverLetter must have been called with resumeContent = rawText string
    expect(generateCoverLetter).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(generateCoverLetter).mock.calls[0][0]

    // resumeContent should be the raw string (not a structured object)
    expect(typeof callArgs.resumeContent).toBe('string')
    expect(callArgs.resumeContent).toBe(rawText)
    expect(callArgs.resumeContent).toContain('Full resume text')

    // Ensure it did NOT receive only structured fields like experience[0].company
    expect(callArgs.resumeContent).not.toEqual(
      expect.objectContaining({ experience: expect.anything() }),
    )
  })

  it('falls back to structured content when rawText is absent', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(checkDailyLimit).mockResolvedValue(undefined)
    vi.mocked(recordUsage).mockResolvedValue(undefined)

    const structuredContent = {
      personalInfo: { name: 'Jane Smith', email: 'jane@example.com' },
      experience: [{ company: 'Beta Inc', title: 'PM', startDate: '2021', current: true, bullets: ['Led product'] }],
      education: [],
      skills: ['Product management'],
      // No rawText
    }

    vi.mocked(prisma.resume.findFirst).mockResolvedValue({
      id: 'resume-struct',
      userId: 'user-1',
      content: structuredContent,
    } as never)

    vi.mocked(generateCoverLetter).mockResolvedValue('Structured cover letter')
    vi.mocked(prisma.coverLetter.create).mockResolvedValue({
      id: 'cl-2',
      content: 'Structured cover letter',
    } as never)

    const req = new Request('http://localhost/api/cover-letter/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeId: 'resume-struct',
        jobTitle: 'Product Manager',
        jobDesc: 'Drive product roadmap',
        wordCount: 'SHORT',
        language: 'en',
      }),
    })

    await coverLetterGeneratePost(req)

    const callArgs = vi.mocked(generateCoverLetter).mock.calls[0][0]
    // Without rawText, resumeContent is the structured object
    expect(typeof callArgs.resumeContent).toBe('object')
    expect(callArgs.resumeContent).toMatchObject(
      expect.objectContaining({ personalInfo: expect.anything() }),
    )
  })
})

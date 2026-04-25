import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    template: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/template-vision', () => ({
  analyzeTemplateImage: vi.fn(),
  pdfFirstPageToPng: vi.fn(),
  TemplateVisionError: class TemplateVisionError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
      super(message)
      this.name = 'TemplateVisionError'
    }
  },
}))

vi.mock('@/lib/s3', () => ({
  uploadToS3: vi.fn(),
  getS3Url: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { analyzeTemplateImage, TemplateVisionError } from '@/lib/template-vision'
import { uploadToS3 } from '@/lib/s3'
import { POST as importPost } from '@/app/api/admin/templates/import/route'
import { PATCH as patchTemplate } from '@/app/api/admin/templates/[id]/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = 'admin@example.com'
const MOCK_ANALYSIS = {
  layout: 'single' as const,
  primaryColor: '#336699',
  secondaryColor: '#ffffff',
  fontFamily: 'sans-serif' as const,
  detectedSections: ['summary', 'experience', 'education', 'skills'],
  confidence: 0.95,
  css: 'body{font-family:sans-serif;color:#222;margin:0} h1{font-size:24px} h2{font-size:14px}',
}

/**
 * Create a blob-like object that satisfies the route's instanceof Blob check.
 * Route checks: file instanceof Blob, file.type, file.size, file.arrayBuffer()
 */
function makeBlobFile(data: Buffer, type: string): Blob {
  const blob = new Blob([data.toString('binary')], { type })
  // Override arrayBuffer to return a proper ArrayBuffer from the buffer
  ;(blob as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = () => {
    const ab = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer
    return Promise.resolve(ab)
  }
  return blob
}

function makeImportRequest(opts: {
  file?: Blob | null
  hasFile?: boolean
} = {}): Request {
  const pngData = Buffer.from('\x89PNG\r\n\x1a\n' + 'fake png data content')
  const file = opts.file !== undefined
    ? opts.file
    : (opts.hasFile === false ? null : makeBlobFile(pngData, 'image/png'))

  const mockFormData = {
    get: (key: string) => {
      if (key === 'file') return file
      return null
    },
  }

  const req = new Request('http://localhost/api/admin/templates/import', { method: 'POST' })
  req.formData = () => Promise.resolve(mockFormData as unknown as FormData)
  return req
}

function makePatchRequest(id: string, body: object): { req: Request; params: { params: Promise<{ id: string }> } } {
  const req = new Request(`http://localhost/api/admin/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return {
    req,
    params: { params: Promise.resolve({ id }) },
  }
}

// ---------------------------------------------------------------------------
// Tests — POST /api/admin/templates/import
// ---------------------------------------------------------------------------

describe('POST /api/admin/templates/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = ADMIN_EMAIL
    delete process.env.AWS_S3_BUCKET
  })

  it('returns 403 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', email: 'regular@example.com' } } as never)

    const res = await importPost(makeImportRequest() as never)
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns 403 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await importPost(makeImportRequest() as never)
    expect(res.status).toBe(403)
  })

  it('returns 422 when no file is provided', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)

    const res = await importPost(makeImportRequest({ hasFile: false }) as never)
    expect(res.status).toBe(422)
  })

  it('returns 422 when file type is not allowed', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)

    const textFile = makeBlobFile(Buffer.from('plain text content'), 'text/plain')
    const res = await importPost(makeImportRequest({ file: textFile }) as never)
    expect(res.status).toBe(422)
  })

  it('returns 200 with templateId, analysis, htmlDefinition for valid PNG', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(analyzeTemplateImage).mockResolvedValue(MOCK_ANALYSIS)
    vi.mocked(prisma.template.create).mockResolvedValue({
      id: 'template-draft-001',
      name: 'Draft Template',
      status: 'draft',
      isActive: false,
    } as never)

    const res = await importPost(makeImportRequest() as never)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveProperty('templateId')
    expect(body.data).toHaveProperty('analysis')
    expect(body.data).toHaveProperty('htmlDefinition')
    expect(body.data.templateId).toBe('template-draft-001')
    expect(body.data.analysis).toMatchObject({ layout: 'single', primaryColor: '#336699' })
    expect(body.data.htmlDefinition).toMatchObject({ css: MOCK_ANALYSIS.css, layout: 'single' })
  })

  it('creates Template record with status=draft and isActive=false', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(analyzeTemplateImage).mockResolvedValue(MOCK_ANALYSIS)
    vi.mocked(prisma.template.create).mockResolvedValue({
      id: 'template-draft-001',
      status: 'draft',
      isActive: false,
    } as never)

    await importPost(makeImportRequest() as never)

    expect(prisma.template.create).toHaveBeenCalledTimes(1)
    expect(prisma.template.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'draft',
          isActive: false,
        }),
      }),
    )
  })

  it('calls analyzeTemplateImage with PNG buffer and image/png mime', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(analyzeTemplateImage).mockResolvedValue(MOCK_ANALYSIS)
    vi.mocked(prisma.template.create).mockResolvedValue({ id: 'template-001', status: 'draft', isActive: false } as never)

    await importPost(makeImportRequest() as never)

    expect(analyzeTemplateImage).toHaveBeenCalledTimes(1)
    const [bufferArg, mimeArg] = vi.mocked(analyzeTemplateImage).mock.calls[0]
    expect(Buffer.isBuffer(bufferArg)).toBe(true)
    expect(mimeArg).toBe('image/png')
  })

  it('calls uploadToS3 when AWS_S3_BUCKET is set', async () => {
    process.env.AWS_S3_BUCKET = 'my-bucket'
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(analyzeTemplateImage).mockResolvedValue(MOCK_ANALYSIS)
    vi.mocked(prisma.template.create).mockResolvedValue({ id: 'template-s3-001', status: 'draft', isActive: false } as never)
    vi.mocked(uploadToS3).mockResolvedValue('https://cdn.example.com/templates/references/template-s3-001.png')
    vi.mocked(prisma.template.update).mockResolvedValue({ id: 'template-s3-001' } as never)

    await importPost(makeImportRequest() as never)

    expect(uploadToS3).toHaveBeenCalledTimes(1)
    const [s3Key, , mimeArg] = vi.mocked(uploadToS3).mock.calls[0]
    expect(s3Key).toContain('templates/references/')
    expect(mimeArg).toBe('image/png')

    delete process.env.AWS_S3_BUCKET
  })

  it('does NOT call uploadToS3 when AWS_S3_BUCKET is not set', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(analyzeTemplateImage).mockResolvedValue(MOCK_ANALYSIS)
    vi.mocked(prisma.template.create).mockResolvedValue({ id: 'template-001', status: 'draft', isActive: false } as never)

    await importPost(makeImportRequest() as never)

    expect(uploadToS3).not.toHaveBeenCalled()
  })

  it('returns 503 when Vision API fails with TemplateVisionError', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(analyzeTemplateImage).mockRejectedValue(
      new (TemplateVisionError as unknown as new (msg: string) => Error)('Vision API request failed'),
    )

    const res = await importPost(makeImportRequest() as never)
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.error).toBe('vision_api_unavailable')
  })
})

// ---------------------------------------------------------------------------
// Tests — PATCH /api/admin/templates/:id
// ---------------------------------------------------------------------------

describe('PATCH /api/admin/templates/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = ADMIN_EMAIL
  })

  it('returns 403 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', email: 'regular@example.com' } } as never)
    const { req, params } = makePatchRequest('template-001', { status: 'active' })

    const res = await patchTemplate(req, params)
    expect(res.status).toBe(403)
  })

  it('updates status to active and sets isActive=true', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(prisma.template.update).mockResolvedValue({
      id: 'template-001',
      status: 'active',
      isActive: true,
    } as never)
    const { req, params } = makePatchRequest('template-001', { status: 'active' })

    const res = await patchTemplate(req, params)
    expect(res.status).toBe(200)

    expect(prisma.template.update).toHaveBeenCalledTimes(1)
    expect(prisma.template.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'template-001' },
        data: expect.objectContaining({
          status: 'active',
          isActive: true,
        }),
      }),
    )
  })

  it('returns 200 with updated template data', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    const updatedTemplate = {
      id: 'template-001',
      name: 'My Template',
      status: 'active',
      isActive: true,
    }
    vi.mocked(prisma.template.update).mockResolvedValue(updatedTemplate as never)
    const { req, params } = makePatchRequest('template-001', { status: 'active' })

    const res = await patchTemplate(req, params)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject({ id: 'template-001', status: 'active', isActive: true })
  })

  it('updates status to inactive and sets isActive=false', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(prisma.template.update).mockResolvedValue({
      id: 'template-001',
      status: 'inactive',
      isActive: false,
    } as never)
    const { req, params } = makePatchRequest('template-001', { status: 'inactive' })

    const res = await patchTemplate(req, params)
    expect(res.status).toBe(200)

    expect(prisma.template.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'inactive',
          isActive: false,
        }),
      }),
    )
  })

  it('returns 422 for invalid input', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    const { req, params } = makePatchRequest('template-001', { status: 'invalid_status' })

    const res = await patchTemplate(req, params)
    expect(res.status).toBe(422)
  })

  it('allows partial update (only name, no status change)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', email: ADMIN_EMAIL } } as never)
    vi.mocked(prisma.template.update).mockResolvedValue({
      id: 'template-001',
      name: 'Updated Name',
    } as never)
    const { req, params } = makePatchRequest('template-001', { name: 'Updated Name' })

    const res = await patchTemplate(req, params)
    expect(res.status).toBe(200)

    expect(prisma.template.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Updated Name' }),
      }),
    )
  })
})

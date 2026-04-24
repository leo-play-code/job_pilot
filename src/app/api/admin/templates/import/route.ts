import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { analyzeTemplateImage, pdfFirstPageToPng, TemplateVisionError } from '@/lib/template-vision'
import { uploadToS3, getS3Url } from '@/lib/s3'

function isAdmin(email?: string | null) {
  return email === process.env.ADMIN_EMAIL
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

function isAllowedMimeType(type: string): type is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type)
}

export async function POST(request: NextRequest) {
  // 1. Validate admin
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_request: could not parse form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'invalid_file_type: no file provided' }, { status: 422 })
  }

  // 3. Validate file type
  const mimeType = file.type
  if (!isAllowedMimeType(mimeType)) {
    return NextResponse.json({ error: 'invalid_file_type' }, { status: 422 })
  }

  // File size limits: 5MB for images, 10MB for PDFs
  const MAX_SIZE_IMAGE = 5 * 1024 * 1024
  const MAX_SIZE_PDF = 10 * 1024 * 1024
  const maxSize = mimeType === 'application/pdf' ? MAX_SIZE_PDF : MAX_SIZE_IMAGE
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `invalid_file_type: file too large (max ${maxSize / 1024 / 1024}MB)` },
      { status: 422 },
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  let fileBuffer = Buffer.from(arrayBuffer)

  // 4. PDF → PNG conversion
  let imageMimeType: 'image/png' | 'image/jpeg' = mimeType === 'application/pdf' ? 'image/png' : (mimeType as 'image/png' | 'image/jpeg')
  let pngBuffer: Buffer = fileBuffer

  if (mimeType === 'application/pdf') {
    try {
      pngBuffer = await pdfFirstPageToPng(fileBuffer)
      imageMimeType = 'image/png'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.startsWith('pdf_rendering_failed')) {
        return NextResponse.json(
          { error: 'pdf_rendering_failed: 請直接上傳 PNG 圖片' },
          { status: 422 },
        )
      }
      if (msg.startsWith('invalid_pdf')) {
        return NextResponse.json({ error: msg }, { status: 422 })
      }
      return NextResponse.json({ error: 'pdf_rendering_failed: 請直接上傳 PNG 圖片' }, { status: 422 })
    }
  }

  // 5. Analyze with Claude Vision API
  let analysis
  try {
    analysis = await analyzeTemplateImage(pngBuffer, imageMimeType)
  } catch (err) {
    if (err instanceof TemplateVisionError) {
      console.error('[templates/import] Vision API error:', err.message, err.cause)
      return NextResponse.json({ error: 'vision_api_unavailable' }, { status: 503 })
    }
    if (err instanceof Error && err.message === 'ANTHROPIC_API_KEY not configured') {
      console.error('[templates/import] ANTHROPIC_API_KEY not configured')
      return NextResponse.json({ error: 'vision_api_unavailable' }, { status: 503 })
    }
    console.error('[templates/import] Unexpected error during analysis:', err)
    return NextResponse.json({ error: 'vision_api_unavailable' }, { status: 503 })
  }

  // 6. Create draft template record first to get the ID for S3 key
  const htmlDefinition = {
    css: analysis.css,
    layout: analysis.layout,
    sectionOrder: analysis.detectedSections,
  }

  let referenceImageUrl: string | null = null

  // Create template record
  const template = await prisma.template.create({
    data: {
      name: 'Draft Template',
      description: 'AI 分析草稿',
      category: 'other',
      htmlDefinition: htmlDefinition as object,
      aiAnalysis: analysis as object,
      referenceImageUrl: null, // will update after S3 upload
      status: 'draft',
      isActive: false,
    },
  })

  // 7. Upload reference image to S3 (best-effort, won't fail the request)
  if (process.env.AWS_S3_BUCKET) {
    try {
      // Use PNG buffer (already converted from PDF if needed)
      const s3Key = `templates/references/${template.id}.png`
      referenceImageUrl = await uploadToS3(s3Key, pngBuffer, 'image/png')
      await prisma.template.update({
        where: { id: template.id },
        data: { referenceImageUrl },
      })
    } catch (err) {
      console.error('[templates/import] S3 upload failed (non-fatal):', err)
    }
  }

  // 8. Return response
  return NextResponse.json(
    {
      data: {
        templateId: template.id,
        analysis,
        htmlDefinition,
      },
    },
    { status: 200 },
  )
}

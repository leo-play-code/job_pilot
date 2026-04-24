import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { parsePdf } from '@/lib/pdf'
import { uploadToS3 } from '@/lib/s3'
import type { ResumeContent } from '@/types/resume'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // 2. Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_request: could not parse form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 422 })
  }

  // 3. Validate file type and size
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 422 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 422 })
  }

  const titleParam = formData.get('title')
  const languageParam = formData.get('language')
  const language = (languageParam === 'en' ? 'en' : 'zh') as 'zh' | 'en'

  const fileName = file instanceof File ? file.name : 'resume.pdf'
  const title = (typeof titleParam === 'string' && titleParam.trim())
    ? titleParam.trim()
    : fileName.replace(/\.pdf$/i, '')

  // 4. Extract rawText with pdf-parse
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(arrayBuffer)

  let rawText = ''
  try {
    rawText = await parsePdf(fileBuffer)
  } catch (err) {
    console.error('[resume/import-raw] pdf-parse error:', err)
    // Non-fatal: rawText stays empty string
  }

  // 5. Pre-generate resumeId for S3 key
  const { randomUUID } = await import('crypto')
  const resumeId = randomUUID()

  // 6. Upload original PDF to S3 (best-effort, fallback to empty string)
  let rawPdfUrl = ''
  if (process.env.AWS_S3_BUCKET) {
    try {
      const s3Key = `resumes/${userId}/${resumeId}.pdf`
      rawPdfUrl = await uploadToS3(s3Key, fileBuffer, 'application/pdf')
    } catch (err) {
      console.error('[resume/import-raw] S3 upload failed (non-fatal):', err)
    }
  }

  // 7. Build content
  const content: ResumeContent = {
    personalInfo: { name: '', email: '' },
    experience: [],
    education: [],
    skills: [],
    rawText,
    extra: {},
  }

  // 8. Create Resume record
  const resume = await prisma.resume.create({
    data: {
      id: resumeId,
      userId,
      title,
      content: content as object,
      templateId: 'modern',
      language,
      rawPdfUrl,
    },
  })

  // 9. Return (no UsageLog — no AI)
  return NextResponse.json({ data: { resumeId: resume.id, title: resume.title } })
}

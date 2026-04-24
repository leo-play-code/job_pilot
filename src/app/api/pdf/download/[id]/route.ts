import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateResumePdf } from '@/lib/pdf'
import { uploadToS3, getS3Key, getS3Url } from '@/lib/s3'
import type { ResumeContent, LayoutOverride } from '@/types/resume'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Return cached S3 PDF if it was generated after the last update
  if (
    resume.pdfUrl &&
    resume.pdfGeneratedAt &&
    resume.pdfGeneratedAt > resume.updatedAt &&
    process.env.AWS_S3_BUCKET
  ) {
    return NextResponse.redirect(resume.pdfUrl)
  }

  // Generate PDF
  const layoutOverride = resume.layoutOverride as LayoutOverride | null
  const pdfBuffer = await generateResumePdf({
    content: resume.content as unknown as ResumeContent,
    templateId: resume.templateId,
    language: resume.language as 'zh' | 'en',
    layoutOverride: layoutOverride ?? undefined,
  })

  // Upload to S3 and update cache (best-effort, won't fail the download)
  if (process.env.AWS_S3_BUCKET) {
    const key = getS3Key('resume-pdf', id)
    uploadToS3(key, pdfBuffer, 'application/pdf')
      .then((url) =>
        prisma.resume.update({
          where: { id },
          data: { pdfUrl: url, pdfGeneratedAt: new Date() },
        })
      )
      .catch((err) => console.error('[pdf/download] S3 cache failed:', err))
  }

  const filename = `resume-${id}.pdf`
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}

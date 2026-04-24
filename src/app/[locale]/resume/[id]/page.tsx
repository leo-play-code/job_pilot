import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { ResumeEditorClient } from '@/components/resume/ResumeEditorClient'
import { ResumeActions } from '@/components/resume/ResumeActions'
import type { ResumeContent, LayoutOverride } from '@/types/resume'

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const [session, locale] = await Promise.all([auth(), getLocale()])
  if (!session) redirect(`/${locale}/login`)

  const { id } = await params
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!resume) notFound()

  const content = resume.content as unknown as ResumeContent
  const layoutOverride = resume.layoutOverride as LayoutOverride | null

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold">{resume.title}</h1>
          <p className="text-sm text-muted-foreground capitalize">{resume.templateId} 模板</p>
        </div>
        <ResumeActions resumeId={id} />
      </div>

      <ResumeEditorClient
        resumeId={id}
        initialContent={content}
        templateId={resume.templateId}
        initialLayoutOverride={layoutOverride}
      />
    </div>
  )
}

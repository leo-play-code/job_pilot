import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ResumeRenderer } from '@/components/resume/ResumeRenderer'
import { ResumeActions } from '@/components/resume/ResumeActions'
import type { ResumeContent, TemplateId } from '@/types/resume'

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const session = await auth()
  if (!session) redirect('/zh/login')

  const { id } = await params
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!resume) notFound()

  const content = resume.content as unknown as ResumeContent

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold">{resume.title}</h1>
          <p className="text-sm text-muted-foreground capitalize">{resume.templateId} 模板</p>
        </div>
        <ResumeActions resumeId={id} />
      </div>

      <div className="overflow-x-auto">
        <ResumeRenderer content={content} templateId={resume.templateId as TemplateId} />
      </div>
    </div>
  )
}

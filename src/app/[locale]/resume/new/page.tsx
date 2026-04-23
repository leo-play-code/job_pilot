import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { ResumeBuilderForm } from '@/components/resume/ResumeBuilderForm'
import type { ResumeContent, TemplateId, Language } from '@/types/resume'

interface ResumeNewPageProps {
  searchParams: Promise<{ edit?: string }>
}

export default async function ResumeNewPage({ searchParams }: ResumeNewPageProps) {
  const [session, locale] = await Promise.all([auth(), getLocale()])
  if (!session) redirect(`/${locale}/login`)

  const { edit } = await searchParams
  let initialData = null

  if (edit) {
    const resume = await prisma.resume.findFirst({
      where: { id: edit, userId: session.user.id },
    })
    if (resume) {
      const c = resume.content as unknown as ResumeContent
      initialData = {
        content: {
          personalInfo: c.personalInfo,
          experience: c.experience ?? [],
          education: c.education ?? [],
          skills: c.skills ?? [],
          achievements: c.achievements ?? [],
          summary: c.summary,
        },
        templateId: resume.templateId as TemplateId,
        language: resume.language as Language,
        resumeId: resume.id,
      }
    }
  }

  return <ResumeBuilderForm initialData={initialData} />
}

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { ResumeList } from '@/components/resume/ResumeList'
import { CoverLetterList } from '@/components/cover-letter/CoverLetterList'
import { UsageBadge } from '@/components/shared/UsageBadge'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default async function DashboardPage() {
  const [session, locale, t] = await Promise.all([auth(), getLocale(), getTranslations('dashboard')])
  if (!session) redirect(`/${locale}/login`)

  const [rawResumes, rawCoverLetters] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, templateId: true, createdAt: true, rawPdfUrl: true },
    }),
    prisma.coverLetter.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, jobTitle: true, wordCount: true, createdAt: true },
    }),
  ])

  const resumes = rawResumes.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
  const coverLetters = rawCoverLetters.map((cl) => ({ ...cl, createdAt: cl.createdAt.toISOString() }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <UsageBadge />
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">{t('resumes')}</h2>
          <ResumeList resumes={resumes} />
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-4">{t('coverLetters')}</h2>
          <CoverLetterList coverLetters={coverLetters} />
        </section>
      </div>
    </div>
  )
}

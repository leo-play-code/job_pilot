import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { AutoApplyClient } from '@/components/auto-apply/AutoApplyClient'

export default async function AutoApplyPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()])
  if (!session) redirect(`/${locale}/login`)

  const [resumes, config, credentialExists] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    }),
    prisma.jobSearchConfig.findUnique({ where: { userId: session.user.id } }),
    prisma.userPlatformCredential.findUnique({
      where: { userId_platform: { userId: session.user.id, platform: 'JOB_104' } },
      select: { id: true },
    }),
  ])

  return (
    <AutoApplyClient
      resumes={resumes}
      initialConfig={config ? {
        keywords: config.keywords,
        locationCodes: config.locationCodes,
        subLocationCodes: config.subLocationCodes,
        salaryMin: config.salaryMin ?? undefined,
        salaryMax: config.salaryMax ?? undefined,
        jobTypes: config.jobTypes,
        industries: config.industries,
        coverLetterMode: config.coverLetterMode,
        wordCount: config.wordCount as 'SHORT' | 'MEDIUM' | 'LONG',
        coverLetterIndex: config.coverLetterIndex,
        maxApplyCount: config.maxApplyCount,
      } : null}
      credentialExists={!!credentialExists}
    />
  )
}

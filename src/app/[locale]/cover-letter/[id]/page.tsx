import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { CoverLetterDisplay } from '@/components/cover-letter/CoverLetterDisplay'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'

interface CoverLetterDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CoverLetterDetailPage({ params }: CoverLetterDetailPageProps) {
  const [session, locale] = await Promise.all([auth(), getLocale()])
  if (!session) redirect(`/${locale}/login`)

  const { id } = await params
  const coverLetter = await prisma.coverLetter.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!coverLetter) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none rounded"
          aria-label="返回 Dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{coverLetter.jobTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(coverLetter.createdAt).toLocaleDateString('zh-TW')} · {coverLetter.wordCount.toLowerCase()} 篇
          </p>
        </div>
      </div>

      <CoverLetterDisplay content={coverLetter.content} jobTitle={coverLetter.jobTitle} />
    </div>
  )
}

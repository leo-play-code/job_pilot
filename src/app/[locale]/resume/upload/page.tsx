import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { UploadTabsClient } from '@/components/resume/UploadTabsClient'

export default async function ResumeUploadPage() {
  const [session, locale, t] = await Promise.all([auth(), getLocale(), getTranslations('resume.upload')])
  if (!session) redirect(`/${locale}/login`)

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-muted-foreground text-sm mb-8">
        {t('dropzone')}
      </p>
      <UploadTabsClient />
    </div>
  )
}

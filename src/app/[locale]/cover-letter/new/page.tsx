import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { CoverLetterBuilderForm } from '@/components/cover-letter/CoverLetterBuilderForm'

export default async function CoverLetterNewPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()])
  if (!session) redirect(`/${locale}/login`)

  return <CoverLetterBuilderForm />
}

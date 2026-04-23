import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function LandingPage() {
  const t = useTranslations('landing')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
      <p className="text-muted-foreground text-lg mb-8 text-center max-w-md">
        {t('subtitle')}
      </p>
      <Link
        href="/login"
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90"
      >
        {t('cta')}
      </Link>
    </main>
  )
}

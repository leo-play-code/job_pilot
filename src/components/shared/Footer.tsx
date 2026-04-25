import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} JobPilot. {t('rights')}</p>
          <nav className="flex items-center gap-4" aria-label="Legal links">
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              {t('terms')}
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              {t('privacy')}
            </Link>
            <span>
              {t('contact')}:{' '}
              <a
                href="mailto:support@jobpilot.app"
                className="hover:text-foreground underline transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                support@jobpilot.app
              </a>
            </span>
          </nav>
        </div>
      </div>
    </footer>
  )
}

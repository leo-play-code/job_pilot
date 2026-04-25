import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy')
  return { title: t('title') }
}

interface Props {
  params: Promise<{ locale: string }>
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('privacy')
  const isZh = locale === 'zh'

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-10">
        {t('lastUpdated')}: {isZh ? '2026 年 4 月 25 日' : 'April 25, 2026'}
      </p>

      <div className="space-y-8 text-foreground">

        {/* 1. Overview */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('overview.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('overview.body')}</p>
        </section>

        {/* 2. Data Collected */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('collected.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('collected.item1')}</li>
            <li>{t('collected.item2')}</li>
            <li>{t('collected.item3')}</li>
            <li>{t('collected.item4')}</li>
          </ul>
        </section>

        {/* 3. How We Use Data */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('usage.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('usage.item1')}</li>
            <li>{t('usage.item2')}</li>
            <li>{t('usage.item3')}</li>
          </ul>
        </section>

        {/* 4. Payment Data (Stripe) */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('stripe.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('stripe.body')}</p>
        </section>

        {/* 5. Third-Party Services */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('thirdparty.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('thirdparty.item1')}</li>
            <li>{t('thirdparty.item2')}</li>
            <li>{t('thirdparty.item3')}</li>
          </ul>
        </section>

        {/* 6. Data Retention */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('retention.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('retention.body')}</p>
        </section>

        {/* 7. Your Rights */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('rights.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('rights.body')}</p>
        </section>

        {/* 8. Cookies */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('cookies.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('cookies.body')}</p>
        </section>

        {/* 9. Contact */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('contact.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('contact.body')}{' '}
            <a
              href="mailto:support@jobpilot.app"
              className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              support@jobpilot.app
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}

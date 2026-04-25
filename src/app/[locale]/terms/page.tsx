import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms')
  return { title: t('title') }
}

interface Props {
  params: Promise<{ locale: string }>
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('terms')
  const isZh = locale === 'zh'

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-10">
        {t('lastUpdated')}: {isZh ? '2026 年 4 月 25 日' : 'April 25, 2026'}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground">

        {/* 1. Acceptance */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('acceptance.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('acceptance.body')}</p>
        </section>

        {/* 2. Service Description */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('service.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('service.body')}</p>
        </section>

        {/* 3. Subscription & Payment */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('payment.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('payment.item1')}</li>
            <li>{t('payment.item2')}</li>
            <li>{t('payment.item3')}</li>
            <li>{t('payment.item4')}</li>
          </ul>
        </section>

        {/* 4. Refund Policy */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('refund.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('refund.body')}</p>
        </section>

        {/* 5. User Obligations */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('obligations.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('obligations.body')}</p>
        </section>

        {/* 6. Intellectual Property */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('ip.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('ip.body')}</p>
        </section>

        {/* 7. Disclaimer */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('disclaimer.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('disclaimer.body')}</p>
        </section>

        {/* 8. Changes */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('changes.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('changes.body')}</p>
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

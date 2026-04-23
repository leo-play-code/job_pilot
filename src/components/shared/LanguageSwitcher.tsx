'use client'

import { useRouter, usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(next: 'zh' | 'en') {
    router.replace(pathname, { locale: next })
  }

  return (
    <div className="flex gap-2 text-sm" role="navigation" aria-label="Language switcher">
      <button
        onClick={() => switchLocale('zh')}
        aria-current={locale === 'zh' ? 'true' : undefined}
        className={`focus-visible:ring-2 focus-visible:ring-primary outline-none rounded ${
          locale === 'zh' ? 'font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        中文
      </button>
      <span className="text-muted-foreground" aria-hidden="true">/</span>
      <button
        onClick={() => switchLocale('en')}
        aria-current={locale === 'en' ? 'true' : undefined}
        className={`focus-visible:ring-2 focus-visible:ring-primary outline-none rounded ${
          locale === 'en' ? 'font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
    </div>
  )
}

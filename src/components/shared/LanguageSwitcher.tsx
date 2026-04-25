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
        disabled={locale === 'zh'}
        aria-current={locale === 'zh' ? 'true' : undefined}
        className={`outline-none rounded transition-all ${
          locale === 'zh'
            ? 'font-bold cursor-default'
            : 'text-muted-foreground hover:text-foreground hover:scale-110 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary'
        }`}
      >
        中文
      </button>
      <span className="text-muted-foreground" aria-hidden="true">/</span>
      <button
        onClick={() => switchLocale('en')}
        disabled={locale === 'en'}
        aria-current={locale === 'en' ? 'true' : undefined}
        className={`outline-none rounded transition-all ${
          locale === 'en'
            ? 'font-bold cursor-default'
            : 'text-muted-foreground hover:text-foreground hover:scale-110 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary'
        }`}
      >
        EN
      </button>
    </div>
  )
}

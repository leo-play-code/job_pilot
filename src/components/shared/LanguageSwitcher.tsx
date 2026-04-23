'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(next: string) {
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
  }

  return (
    <div className="flex gap-2 text-sm">
      <button
        onClick={() => switchLocale('zh')}
        className={locale === 'zh' ? 'font-bold' : 'text-muted-foreground'}
      >
        中文
      </button>
      <span className="text-muted-foreground">/</span>
      <button
        onClick={() => switchLocale('en')}
        className={locale === 'en' ? 'font-bold' : 'text-muted-foreground'}
      >
        EN
      </button>
    </div>
  )
}

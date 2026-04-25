'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UserAvatarDropdown } from './UserAvatarDropdown'

function CreditsBadge({ locale }: { locale: string }) {
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.json())
      .then(json => setCredits(json.data?.credits ?? 0))
      .catch(() => null)
  }, [])

  if (credits === null) return null

  return (
    <Link
      href={`/${locale}/settings/credits`}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted px-2 py-1 rounded-full"
    >
      <Coins className="h-3 w-3 text-amber-500" />
      {credits}
    </Link>
  )
}

export function Header() {
  const { data: session } = useSession()
  const t = useTranslations('auth')
  const locale = useLocale()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          JobPilot
        </Link>
        <nav className="flex items-center gap-4">
          <LanguageSwitcher />
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all inline-block"
              >
                Dashboard
              </Link>
              <CreditsBadge locale={locale} />
              <UserAvatarDropdown session={session} locale={locale} />
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 hover:scale-105 active:scale-95 transition-all"
            >
              {t('login')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

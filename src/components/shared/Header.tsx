'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { Coins, Loader2 } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { useCreditsBalance } from '@/hooks/useCreditsBalance'

function CreditsBadge() {
  const { data: credits, isFetching } = useCreditsBalance()

  if (credits === null || credits === undefined) return null

  return (
    <Link
      href="/settings/credits"
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted px-2 py-1 rounded-full"
    >
      <Coins className="h-3 w-3 text-amber-500" />
      {credits}
      {isFetching && <Loader2 className="h-3 w-3 animate-spin ml-0.5" />}
    </Link>
  )
}

export function Header() {
  const { data: session } = useSession()
  const t = useTranslations('auth')
  const locale = useLocale()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity shrink-0">
          JobPilot
        </Link>

        {/* Main nav — 未來在這裡加更多項目 */}
        {session && (
          <nav className="hidden sm:flex items-center gap-1 flex-1 sm:ml-8 lg:ml-64">
            <Link
              href="/dashboard"
              className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              首頁
            </Link>
            <Link
              href="/auto-apply"
              className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              自動投遞
            </Link>
          </nav>
        )}

        {/* Utility nav — credits + avatar / login */}
        <div className="flex items-center gap-3 ml-auto">
          {/* <LanguageSwitcher /> */}{/* TODO: 國際化版本啟用 */}
          {session ? (
            <>
              <CreditsBadge />
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
        </div>
      </div>
    </header>
  )
}

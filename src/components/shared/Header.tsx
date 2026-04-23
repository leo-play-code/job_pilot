'use client'

import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import { UserCircle } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const { data: session } = useSession()
  const t = useTranslations('auth')
  const locale = useLocale()

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          JobPilot
        </Link>
        <nav className="flex items-center gap-4">
          <LanguageSwitcher />
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>

              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? 'User avatar'}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <UserCircle
                    className="h-8 w-8 text-muted-foreground"
                    aria-label="User icon"
                  />
                )}
                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none rounded"
                >
                  {t('logout')}
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            >
              {t('login')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

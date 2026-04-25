'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { signOut } from 'next-auth/react'
import { BlurImage } from '@/components/shared/BlurImage'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import {
  UserCircle, Settings, CreditCard, Coins, LayoutTemplate,
  Users, LogOut, ChevronDown, Sparkles, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Session } from 'next-auth'

interface Props {
  session: Session
  locale: string
}

export function UserAvatarDropdown({ session, locale }: Props) {
  const router = useRouter()
  const t = useTranslations('header')
  const { user } = session

  const pathname = usePathname()
  const isPro = user.plan === 'PRO'
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)

  // Reset spinner when pathname changes (navigation completed)
  useEffect(() => {
    setNavigatingTo(null)
  }, [pathname])

  // Safety fallback: always clear spinner after 3s in case pathname didn't change
  useEffect(() => {
    if (navigatingTo === null) return
    const timer = setTimeout(() => setNavigatingTo(null), 3000)
    return () => clearTimeout(timer)
  }, [navigatingTo])

  const navigate = (path: string) => {
    // If already on this page (ignoring query string), skip loading state
    const targetPathname = path.split('?')[0]
    if (targetPathname !== pathname) {
      setNavigatingTo(path)
    }
    router.push(path)
  }

  const handleLogout = async (e: Event) => {
    e.preventDefault()
    setIsLoggingOut(true)
    await signOut({ callbackUrl: `/${locale}/login` })
  }

  const isNavigating = navigatingTo !== null

  const itemClass = (path?: string) =>
    cn(
      'flex items-center gap-2.5 px-3 py-1.5 text-sm cursor-pointer select-none outline-none rounded-sm',
      'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
      'transition-colors',
      (isLoggingOut || (path && navigatingTo === path)) && 'opacity-50 pointer-events-none',
    )

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-1 rounded-full outline-none"
          aria-label="使用者選單"
          disabled={isLoggingOut}
        >
          <div className="relative">
            {user.image ? (
              <BlurImage
                src={user.image}
                alt={user.name ?? 'User avatar'}
                width={32}
                height={32}
                priority
                sizes="40px"
                className="rounded-full object-cover"
              />
            ) : (
              <UserCircle className="h-8 w-8 text-muted-foreground" />
            )}
            {isPro && (
              <span className="absolute -bottom-1 -right-1 inline-flex items-center text-[9px] font-bold px-1 py-px rounded bg-amber-400 text-amber-900 leading-none border border-white">
                Pro
              </span>
            )}
          </div>
          {isNavigating || isLoggingOut ? (
            <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-lg border border-border bg-background shadow-lg py-1 animate-in fade-in-0 zoom-in-95"
        >
          {/* User info header */}
          <div className="px-3 py-2 flex items-center gap-3">
            {user.image ? (
              <BlurImage
                src={user.image}
                alt={user.name ?? 'avatar'}
                width={36}
                height={36}
                sizes="40px"
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <UserCircle className="h-9 w-9 text-muted-foreground flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name ?? '使用者'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <span className={cn(
                'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5',
                isPro
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-muted text-muted-foreground',
              )}>
                {isPro ? 'Pro' : user.plan}
              </span>
            </div>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {/* Upgrade Pro item — only for FREE users */}
          {!isPro && (
            <>
              <DropdownMenu.Item
                onSelect={() => navigate(`/${locale}/pricing`)}
                className={cn(
                  itemClass(`/${locale}/pricing`),
                  'text-primary font-medium hover:bg-primary/5 focus:bg-primary/5',
                )}
              >
                {navigatingTo === `/${locale}/pricing`
                  ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  : <Sparkles className="h-4 w-4 text-amber-500" />
                }
                {t('upgradePro')}
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
            </>
          )}

          {/* Settings items */}
          <DropdownMenu.Item
            onSelect={() => navigate(`/${locale}/settings`)}
            className={itemClass(`/${locale}/settings`)}
          >
            {navigatingTo === `/${locale}/settings`
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Settings className="h-4 w-4" />
            }
            個人設定
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => navigate(`/${locale}/settings/billing`)}
            className={itemClass(`/${locale}/settings/billing`)}
          >
            {navigatingTo === `/${locale}/settings/billing`
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CreditCard className="h-4 w-4" />
            }
            帳單與訂閱
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => navigate(`/${locale}/settings/credits`)}
            className={itemClass(`/${locale}/settings/credits`)}
          >
            {navigatingTo === `/${locale}/settings/credits`
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Coins className="h-4 w-4" />
            }
            點數餘額
          </DropdownMenu.Item>

          {/* Admin section */}
          {user.isAdmin && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Label className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                管理後台
              </DropdownMenu.Label>

              <DropdownMenu.Item
                onSelect={() => navigate(`/${locale}/admin/templates`)}
                className={itemClass(`/${locale}/admin/templates`)}
              >
                {navigatingTo === `/${locale}/admin/templates`
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <LayoutTemplate className="h-4 w-4" />
                }
                模板管理
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onSelect={() => navigate(`/${locale}/admin/dashboard`)}
                className={itemClass(`/${locale}/admin/dashboard`)}
              >
                {navigatingTo === `/${locale}/admin/dashboard`
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Users className="h-4 w-4" />
                }
                使用者後台
              </DropdownMenu.Item>
            </>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={handleLogout}
            className={cn(
              'flex items-center gap-2.5 px-3 py-1.5 text-sm select-none outline-none rounded-sm',
              'text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-colors',
              isLoggingOut ? 'cursor-wait opacity-70' : 'cursor-pointer',
            )}
          >
            {isLoggingOut
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <LogOut className="h-4 w-4" />
            }
            {isLoggingOut ? '登出中…' : '登出'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

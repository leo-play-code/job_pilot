'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Coins } from 'lucide-react'
import { useCreditsBalance } from '@/hooks/useCreditsBalance'

export default function CreditsPage() {
  const { status } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const { data: credits, isLoading } = useCreditsBalance()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace(`/${locale}/login`)
  }, [status, router, locale])

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="text-muted-foreground text-sm">載入中…</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">點數餘額</h1>

      {/* ── 點數餘額 ── */}
      <section className="border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold">點數餘額</h2>
        </div>
        <p className="text-3xl font-bold mt-2">{credits ?? 0} <span className="text-sm font-normal text-muted-foreground">點</span></p>
        <p className="text-xs text-muted-foreground mt-1">點數永不過期，可用於自動投遞履歷（1 次投遞 = 5 點）。</p>
        <div className="mt-4">
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Coins className="h-4 w-4" />
            購買點數包
          </Link>
        </div>
      </section>

      <Link
        href={`/${locale}/settings`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← 返回設定
      </Link>
    </div>
  )
}

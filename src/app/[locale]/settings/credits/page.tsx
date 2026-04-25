'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Coins } from 'lucide-react'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  plan: 'FREE' | 'PRO'
  credits: number
  createdAt: string
}

export default function CreditsPage() {
  const { status } = useSession()
  const router = useRouter()
  const locale = useLocale()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace(`/${locale}/login`)
  }, [status, router, locale])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/me')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => { setProfile(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  if (status === 'loading' || loading || !profile) {
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
        <p className="text-3xl font-bold mt-2">{profile.credits} <span className="text-sm font-normal text-muted-foreground">點</span></p>
        <p className="text-xs text-muted-foreground mt-1">點數由管理員發放，未來可用於兌換進階功能。</p>
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

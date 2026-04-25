'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import { UserCircle, Check, Pencil, X, Coins, CreditCard, Star } from 'lucide-react'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  plan: 'FREE' | 'PRO'
  credits: number
  createdAt: string
}

const PLAN_FEATURES = {
  FREE: [
    '每月 3 份 AI 履歷生成',
    '每月 3 份 AI Cover Letter',
    '基本履歷模板',
    '匯出 PDF',
  ],
  PRO: [
    '無限 AI 履歷生成',
    '無限 AI Cover Letter',
    '全部高級模板',
    '優先客服支援',
    '進階 AI 功能',
  ],
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const locale = useLocale()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

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

  function startEdit() {
    setNameInput(profile?.name ?? '')
    setEditingName(true)
  }

  async function saveName() {
    if (!nameInput.trim()) return
    setSaving(true)
    const res = await fetch('/api/user/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.trim() }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setProfile(prev => prev ? { ...prev, name: data.name } : prev)
      setEditingName(false)
      await update({ name: data.name })
      showToast('名字已更新', true)
    } else {
      showToast(data.error ?? '更新失敗', false)
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  if (status === 'loading' || loading || !profile) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="text-muted-foreground text-sm">載入中…</div>
      </div>
    )
  }

  const isPro = profile.plan === 'PRO'

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 text-sm px-4 py-2 rounded-lg shadow-lg animate-in fade-in-0 ${
          toast.ok ? 'bg-foreground text-background' : 'bg-destructive text-destructive-foreground'
        }`}>
          {toast.msg}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-8">帳號設定</h1>

      {/* ── 個人資料 ── */}
      <section className="border border-border rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold mb-4">個人資料</h2>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.image ? (
              <Image
                src={profile.image}
                alt="avatar"
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <UserCircle className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              {profile.image ? '來自 Google' : '預設頭像'}
            </p>
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">顯示名稱</label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                    className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={50}
                  />
                  <button
                    onClick={saveName}
                    disabled={saving}
                    className="p-1.5 rounded-md text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm">{profile.name ?? <span className="text-muted-foreground italic">未設定</span>}</span>
                  <button onClick={startEdit} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>

            {/* Joined */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">加入時間</label>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 點數餘額 ── */}
      <section className="border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold">點數餘額</h2>
        </div>
        <p className="text-3xl font-bold mt-2">{profile.credits} <span className="text-sm font-normal text-muted-foreground">點</span></p>
        <p className="text-xs text-muted-foreground mt-1">點數由管理員發放，未來可用於兌換進階功能。</p>
      </section>

      {/* ── 帳單與訂閱 ── */}
      <section className="border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-violet-500" />
          <h2 className="text-base font-semibold">帳單與訂閱</h2>
        </div>

        {/* Current plan */}
        <div className={`rounded-lg p-4 mb-5 ${isPro ? 'bg-primary/10 border border-primary/30' : 'bg-muted border border-border'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPro && <Star className="h-4 w-4 text-primary fill-primary" />}
              <span className="font-semibold">{isPro ? 'PRO 方案' : 'FREE 方案'}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPro ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
              目前方案
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isPro ? '享有所有進階功能與無限使用額度' : '基本功能，每月限量使用'}
          </p>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {(['FREE', 'PRO'] as const).map(plan => (
            <div key={plan} className={`rounded-lg border p-3 ${plan === profile.plan ? 'border-primary/50' : 'border-border'}`}>
              <p className={`text-xs font-semibold mb-2 ${plan === 'PRO' ? 'text-primary' : 'text-muted-foreground'}`}>{plan}</p>
              <ul className="space-y-1">
                {PLAN_FEATURES[plan].map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!isPro && (
          <button
            disabled
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Star className="h-4 w-4 fill-current" />
            升級到 PRO（即將推出）
          </button>
        )}
        {isPro && (
          <p className="text-center text-xs text-muted-foreground">如需變更方案，請聯絡管理員。</p>
        )}
      </section>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Users, FileText, Mail, Zap, LayoutTemplate, RefreshCw, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import AdminResumesTab from '@/components/admin/AdminResumesTab'
import AdminCoverLettersTab from '@/components/admin/AdminCoverLettersTab'
import AdminUsageLogsTab from '@/components/admin/AdminUsageLogsTab'

type TabId = 'users' | 'resumes' | 'coverLetters' | 'usageLogs'

const TABS: { id: TabId; label: string }[] = [
  { id: 'users',       label: '使用者' },
  { id: 'resumes',     label: '履歷' },
  { id: 'coverLetters',label: '自薦信' },
  { id: 'usageLogs',   label: '使用記錄' },
]

interface UserRow {
  id: string
  name: string | null
  email: string
  plan: 'FREE' | 'PRO'
  credits: number
  createdAt: string
  _count: {
    resumes: number
    coverLetters: number
    usageLogs: number
  }
}

interface Summary {
  total: number
  newThisMonth: number
  free: number
  pro: number
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const locale = useLocale()

  const [activeTab, setActiveTab] = useState<TabId>('users')

  const [users, setUsers] = useState<UserRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  // credits inline edit state: { [userId]: string }
  const [editingCredits, setEditingCredits] = useState<Record<string, string>>({})
  const creditsInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [session, status, router, locale])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (!res.ok) { setLoading(false); return }
    const json = await res.json()
    setSummary(json.summary)
    setUsers(json.users)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function patchUser(userId: string, body: { plan?: 'FREE' | 'PRO'; credits?: number }) {
    setUpdatingId(userId)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u))
      toast.success('已更新')
    } else {
      toast.error('更新失敗，請再試一次')
    }
    setUpdatingId(null)
  }

  function startEditCredits(userId: string, current: number) {
    setEditingCredits(prev => ({ ...prev, [userId]: String(current) }))
    setTimeout(() => creditsInputRef.current?.focus(), 50)
  }

  function cancelEditCredits(userId: string) {
    setEditingCredits(prev => { const n = { ...prev }; delete n[userId]; return n })
  }

  async function confirmEditCredits(userId: string) {
    const val = parseInt(editingCredits[userId] ?? '', 10)
    if (isNaN(val) || val < 0) { toast.error('請輸入有效的點數數字'); return }
    cancelEditCredits(userId)
    await patchUser(userId, { credits: val })
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (status === 'loading' || (!session?.user?.isAdmin && status === 'authenticated')) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin 後台</h1>
          <p className="text-sm text-muted-foreground mt-0.5">使用者管理與系統資料</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/templates"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors"
          >
            <LayoutTemplate className="h-4 w-4" />
            模板管理
          </Link>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Non-users tabs */}
      {activeTab === 'resumes' && <AdminResumesTab />}
      {activeTab === 'coverLetters' && <AdminCoverLettersTab />}
      {activeTab === 'usageLogs' && <AdminUsageLogsTab />}

      {/* Users tab content */}
      {activeTab === 'users' && <>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard icon={<Users className="h-5 w-5 text-blue-500" />} label="總使用者" value={summary.total} bg="bg-blue-50 dark:bg-blue-950/30" />
          <SummaryCard icon={<Zap className="h-5 w-5 text-emerald-500" />} label="本月新增" value={summary.newThisMonth} bg="bg-emerald-50 dark:bg-emerald-950/30" />
          <SummaryCard icon={<FileText className="h-5 w-5 text-slate-500" />} label="FREE 方案" value={summary.free} bg="bg-slate-50 dark:bg-slate-800/40" />
          <SummaryCard icon={<Mail className="h-5 w-5 text-violet-500" />} label="PRO 方案" value={summary.pro} bg="bg-violet-50 dark:bg-violet-950/30" />
        </div>
      )}

      {/* User table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold">使用者列表 ({filtered.length})</h2>
          <input
            type="text"
            placeholder="搜尋 email 或名字…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm px-3 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary w-48"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">名字</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">方案</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">點數</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">履歷</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">CL</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">AI 次數</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">加入時間</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">載入中…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">找不到使用者</td></tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium truncate max-w-[120px]">
                      {user.name ?? <span className="text-muted-foreground italic">未設定</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">{user.email}</td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <select
                        value={user.plan}
                        disabled={updatingId === user.id}
                        onChange={e => patchUser(user.id, { plan: e.target.value as 'FREE' | 'PRO' })}
                        className={`text-xs font-semibold px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 ${
                          user.plan === 'PRO'
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                      </select>
                    </td>

                    {/* Credits inline edit */}
                    <td className="px-4 py-3 text-center">
                      {editingCredits[user.id] !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            ref={creditsInputRef}
                            type="number"
                            min={0}
                            value={editingCredits[user.id]}
                            onChange={e => setEditingCredits(prev => ({ ...prev, [user.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') confirmEditCredits(user.id)
                              if (e.key === 'Escape') cancelEditCredits(user.id)
                            }}
                            className="w-16 text-xs text-center border border-border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button onClick={() => confirmEditCredits(user.id)} className="text-primary hover:text-primary/80">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => cancelEditCredits(user.id)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditCredits(user.id, user.credits)}
                          disabled={updatingId === user.id}
                          className="hover:underline tabular-nums disabled:opacity-50"
                          title="點擊編輯點數"
                        >
                          {user.credits}
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">{user._count.resumes}</td>
                    <td className="px-4 py-3 text-center">{user._count.coverLetters}</td>
                    <td className="px-4 py-3 text-center">{user._count.usageLogs}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>}
    </div>
  )
}

function SummaryCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className={`rounded-lg p-4 ${bg} border border-border`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

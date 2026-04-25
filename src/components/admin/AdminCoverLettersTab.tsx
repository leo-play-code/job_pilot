'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface CoverLetterRow {
  id: string
  jobTitle: string
  userId: string
  userEmail: string
  wordCount: 'SHORT' | 'MEDIUM' | 'LONG'
  language: string
  createdAt: string
}

const wordCountBadge: Record<CoverLetterRow['wordCount'], { label: string; className: string }> = {
  SHORT:  { label: 'SHORT',  className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  MEDIUM: { label: 'MEDIUM', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  LONG:   { label: 'LONG',   className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

export default function AdminCoverLettersTab() {
  const [coverLetters, setCoverLetters] = useState<CoverLetterRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchCoverLetters() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(page))
    const res = await fetch(`/api/admin/cover-letters?${params}`)
    const json = await res.json()
    setCoverLetters(json.data.coverLetters)
    setTotal(json.data.total)
    setLoading(false)
  }

  useEffect(() => {
    fetchCoverLetters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function handleDelete(id: string) {
    if (!window.confirm('確定要刪除這筆自薦信？')) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/cover-letters/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCoverLetters(prev => prev.filter(cl => cl.id !== id))
      setTotal(prev => prev - 1)
      toast.success('已刪除')
    } else {
      toast.error('刪除失敗，請再試一次')
    }
    setDeletingId(null)
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(1)
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold">自薦信列表 ({total})</h2>
        <input
          type="text"
          placeholder="搜尋標題或 email…"
          value={search}
          onChange={handleSearchChange}
          className="text-sm px-3 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary w-56"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">職缺標題</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">用戶 email</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">字數</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">語言</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">建立時間</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">載入中…</td>
              </tr>
            ) : coverLetters.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">沒有自薦信資料</td>
              </tr>
            ) : (
              coverLetters.map(cl => {
                const badge = wordCountBadge[cl.wordCount] ?? wordCountBadge.SHORT
                return (
                  <tr key={cl.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cl.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 truncate max-w-[160px]">{cl.jobTitle}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">{cl.userEmail}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{cl.language}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(cl.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(cl.id)}
                        disabled={deletingId === cl.id}
                        className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded disabled:opacity-50 transition-colors"
                      >
                        {deletingId === cl.id ? '刪除中…' : '刪除'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
        <span className="text-sm text-muted-foreground">第 {page} 頁</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page <= 1 || loading}
            className="text-sm px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            上一頁
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages || total <= 50 || loading}
            className="text-sm px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  )
}

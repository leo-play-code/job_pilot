'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface ResumeRow {
  id: string
  title: string
  userId: string
  userEmail: string
  templateId: string
  language: string
  rawPdfUrl: string | null
  createdAt: string
}

export default function AdminResumesTab() {
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchResumes() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(page))
    const res = await fetch(`/api/admin/resumes?${params}`)
    const json = await res.json()
    setResumes(json.data.resumes)
    setTotal(json.data.total)
    setLoading(false)
  }

  useEffect(() => {
    fetchResumes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function handleDelete(id: string) {
    if (!window.confirm('確定要刪除這筆履歷？')) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/resumes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setResumes(prev => prev.filter(r => r.id !== id))
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
        <h2 className="text-sm font-semibold">履歷列表 ({total})</h2>
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
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">標題</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">用戶 email</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">模板</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">語言</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">原始 PDF</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">建立時間</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">載入中…</td>
              </tr>
            ) : resumes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">沒有履歷資料</td>
              </tr>
            ) : (
              resumes.map(resume => (
                <tr key={resume.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{resume.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 truncate max-w-[160px]">{resume.title}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">{resume.userEmail}</td>
                  <td className="px-4 py-3 text-muted-foreground">{resume.templateId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{resume.language}</td>
                  <td className="px-4 py-3 text-center">
                    {resume.rawPdfUrl ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">有</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(resume.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(resume.id)}
                      disabled={deletingId === resume.id}
                      className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded disabled:opacity-50 transition-colors"
                    >
                      {deletingId === resume.id ? '刪除中…' : '刪除'}
                    </button>
                  </td>
                </tr>
              ))
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

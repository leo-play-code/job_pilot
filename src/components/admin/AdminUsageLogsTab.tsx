'use client'

import { useState, useEffect } from 'react'

type ActionType = '' | 'GENERATE_RESUME' | 'PARSE_PDF' | 'GENERATE_COVER_LETTER'

interface UsageLogRow {
  id: string
  userId: string
  userEmail: string
  action: 'GENERATE_RESUME' | 'PARSE_PDF' | 'GENERATE_COVER_LETTER'
  date: string
  createdAt: string
}

const actionBadge: Record<UsageLogRow['action'], { label: string; className: string }> = {
  GENERATE_RESUME:      { label: 'GENERATE_RESUME',      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PARSE_PDF:            { label: 'PARSE_PDF',            className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  GENERATE_COVER_LETTER:{ label: 'GENERATE_COVER_LETTER', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

export default function AdminUsageLogsTab() {
  const [logs, setLogs] = useState<UsageLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<ActionType>('')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(false)

  async function fetchLogs() {
    setLoading(true)
    const params = new URLSearchParams()
    if (actionFilter) params.set('action', actionFilter)
    if (dateFilter) params.set('date', dateFilter)
    params.set('page', String(page))
    const res = await fetch(`/api/admin/usage-logs?${params}`)
    const json = await res.json()
    setLogs(json.data.logs)
    setTotal(json.data.total)
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter, dateFilter])

  function handleActionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setActionFilter(e.target.value as ActionType)
    setPage(1)
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDateFilter(e.target.value)
    setPage(1)
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold">使用記錄 ({total})</h2>
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={handleActionChange}
            className="text-sm px-3 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">全部動作</option>
            <option value="GENERATE_RESUME">GENERATE_RESUME</option>
            <option value="PARSE_PDF">PARSE_PDF</option>
            <option value="GENERATE_COVER_LETTER">GENERATE_COVER_LETTER</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateChange}
            className="text-sm px-3 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">用戶 email</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">動作</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">日期</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">建立時間</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-muted-foreground">載入中…</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-muted-foreground">沒有使用記錄</td>
              </tr>
            ) : (
              logs.map(log => {
                const badge = actionBadge[log.action]
                return (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{log.userEmail}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{log.date}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('zh-TW', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
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

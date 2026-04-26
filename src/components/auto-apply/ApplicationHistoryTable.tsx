'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'

interface Application {
  id: string
  status: 'PENDING' | 'APPLIED' | 'FAILED' | 'ALREADY_APPLIED'
  coverLetterContent: string | null
  appliedAt: string | null
  createdAt: string
  errorMessage: string | null
  jobListing: {
    title: string
    company: string
    location: string
    applyUrl: string
    salaryDesc: string | null
  }
}

const STATUS_CONFIG: Record<
  Application['status'],
  { label: string; className: string }
> = {
  PENDING:        { label: '待投遞',  className: 'bg-gray-100 text-gray-600' },
  APPLIED:        { label: '已投遞',  className: 'bg-blue-100 text-blue-700' },
  FAILED:         { label: '投遞失敗', className: 'bg-red-100 text-red-700' },
  ALREADY_APPLIED: { label: '已投遞過', className: 'bg-gray-100 text-gray-500' },
}

export function ApplicationHistoryTable() {
  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/auto-apply/history?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setApplications(json.data.applications)
          setTotal(json.data.total)
          setTotalPages(json.data.totalPages)
        }
      })
      .finally(() => setIsLoading(false))
  }, [page])

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground text-sm">
        載入中...
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground text-sm">
        尚無投遞記錄，點擊「開始投遞」分頁開始自動投遞。
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">共 {total} 筆記錄</div>

      {applications.map((app) => {
        const status = STATUS_CONFIG[app.status]
        const isExpanded = expandedId === app.id

        return (
          <div key={app.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={app.jobListing.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline flex items-center gap-1 text-sm"
                  >
                    {app.jobListing.title}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {app.jobListing.company} · {app.jobListing.location}
                  {app.jobListing.salaryDesc && ` · ${app.jobListing.salaryDesc}`}
                </p>
                {app.errorMessage && (
                  <p className="text-xs text-destructive mt-1">{app.errorMessage}</p>
                )}
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(app.appliedAt ?? app.createdAt).toLocaleString('zh-TW', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {app.coverLetterContent && (
              <div className="mt-2.5">
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  {isExpanded ? '收起自薦信' : '查看自薦信'}
                </button>
                {isExpanded && (
                  <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3 leading-relaxed">
                    {app.coverLetterContent}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            上一頁
          </button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  )
}

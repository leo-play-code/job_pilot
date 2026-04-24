'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { SquarePen, Trash2 } from 'lucide-react'
import { ClearAllDialog } from '@/components/dashboard/ClearAllDialog'

interface ResumeItem {
  id: string
  title: string
  templateId: string
  createdAt: string
}

interface ResumeListProps {
  resumes: ResumeItem[]
}

export function ResumeList({ resumes: initialResumes }: ResumeListProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [resumes, setResumes] = useState(initialResumes)
  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const allSelected = resumes.length > 0 && selectedIds.size === resumes.length

  function exitEditMode() {
    setEditMode(false)
    setSelectedIds(new Set())
    setError(null)
  }

  function toggleItem(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(resumes.map(r => r.id)))
    }
  }

  async function handleDeleteSelected() {
    setIsPending(true)
    setError(null)
    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.allSettled(
        ids.map(id => fetch(`/api/resume/${id}`, { method: 'DELETE' }))
      )
      const successIds = new Set(
        ids.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok)
      )
      const failed = ids.length - successIds.size
      setResumes(prev => prev.filter(r => !successIds.has(r.id)))
      setSelectedIds(new Set())
      setDeleteSelectedOpen(false)
      if (failed > 0) setError(t('deleteError'))
      else exitEditMode()
    } finally {
      setIsPending(false)
    }
  }

  async function handleClearAll() {
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch('/api/resume', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setResumes([])
      setClearAllOpen(false)
      exitEditMode()
    } catch {
      setError(t('clearAllError'))
      setClearAllOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  if (resumes.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noResumes')}</p>
  }

  return (
    <>
      {/* Edit mode toggle row */}
      <div className="flex items-center justify-end mb-3 min-h-[28px]">
        {editMode ? (
          <button
            onClick={exitEditMode}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('exitEditMode')}
          </button>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t('editMode')}
          >
            <SquarePen size={14} />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      <ul className="space-y-1.5">
        {resumes.map((r) => {
          const checked = selectedIds.has(r.id)
          return (
            <li key={r.id} className="flex items-center gap-2">
              {/* Checkbox (edit mode only) */}
              {editMode && (
                <button
                  onClick={() => toggleItem(r.id)}
                  className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    checked
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/40 hover:border-primary/60'
                  }`}
                  aria-label={checked ? 'deselect' : 'select'}
                >
                  {checked && <span className="w-2 h-2 rounded-full bg-white" />}
                </button>
              )}

              {/* Item card */}
              {editMode ? (
                <div
                  onClick={() => toggleItem(r.id)}
                  className={`flex-1 flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer transition-colors min-w-0 ${
                    checked ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-US')}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize shrink-0 ml-2">{r.templateId}</span>
                </div>
              ) : (
                <Link
                  href={`/resume/${r.id}`}
                  className="flex-1 flex items-center justify-between px-3 py-2 border rounded-lg hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 transition-all min-w-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-US')}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize shrink-0 ml-2">{r.templateId}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      {/* Action bar (edit mode only) */}
      {editMode && (
        <div className="mt-3 pt-3 border-t flex items-center gap-2 flex-wrap">
          {/* Select all */}
          <button
            onClick={toggleSelectAll}
            className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
              allSelected
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/40 hover:border-primary/60'
            }`}
            aria-label={t('selectAll')}
          >
            {allSelected && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>
          <span className="text-xs text-muted-foreground flex-1">
            {selectedIds.size > 0 ? t('selectedCount', { n: selectedIds.size }) : t('selectAll')}
          </span>
          <button
            onClick={() => setDeleteSelectedOpen(true)}
            disabled={selectedIds.size === 0}
            className="text-xs px-2.5 py-1 rounded-md border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('deleteSelected')}
          </button>
          <button
            onClick={() => setClearAllOpen(true)}
            className="text-xs px-2.5 py-1 rounded-md bg-destructive text-white hover:bg-red-600 transition-colors flex items-center gap-1"
          >
            <Trash2 size={11} />
            {t('clearAll')}
          </button>
        </div>
      )}

      <ClearAllDialog
        open={deleteSelectedOpen}
        onClose={() => setDeleteSelectedOpen(false)}
        onConfirm={handleDeleteSelected}
        isPending={isPending}
        titleKey="deleteSelectedResumesTitle"
      />
      <ClearAllDialog
        open={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={handleClearAll}
        isPending={isPending}
        titleKey="clearAllResumesTitle"
      />
    </>
  )
}

'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Trash2 } from 'lucide-react'

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
  const tc = useTranslations('common')
  const locale = useLocale()
  const [resumes, setResumes] = useState(initialResumes)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setLoadingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/resume/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch {
      setError(t('deleteError'))
    } finally {
      setConfirmId(null)
      setLoadingId(null)
    }
  }

  if (resumes.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noResumes')}</p>
  }

  return (
    <>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <ul className="space-y-1.5">
        {resumes.map((r) => (
          <li key={r.id} className="flex items-center gap-1.5 group">
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

            {confirmId === r.id ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={loadingId === r.id}
                  className="text-xs font-medium bg-destructive text-white px-2.5 py-1 rounded-md disabled:opacity-50 transition-all hover:bg-red-600 hover:scale-105 hover:shadow-md active:scale-95"
                >
                  {tc('delete')}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md transition-all hover:bg-slate-200 hover:text-slate-800 hover:scale-105 hover:shadow-md active:scale-95"
                >
                  {tc('cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(r.id)}
                className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label={tc('delete')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

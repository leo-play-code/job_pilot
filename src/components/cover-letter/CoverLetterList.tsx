'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Trash2 } from 'lucide-react'

interface CoverLetterItem {
  id: string
  jobTitle: string
  wordCount: string
  createdAt: string
}

interface CoverLetterListProps {
  coverLetters: CoverLetterItem[]
}

export function CoverLetterList({ coverLetters: initialItems }: CoverLetterListProps) {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [items, setItems] = useState(initialItems)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setLoadingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/cover-letter/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItems(prev => prev.filter(cl => cl.id !== id))
    } catch {
      setError(t('deleteError'))
    } finally {
      setConfirmId(null)
      setLoadingId(null)
    }
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noCoverLetters')}</p>
  }

  return (
    <>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <ul className="space-y-1.5">
        {items.map((cl) => (
          <li key={cl.id} className="flex items-center gap-1.5 group">
            <Link
              href={`/cover-letter/${cl.id}`}
              className="flex-1 flex items-center justify-between px-3 py-2 border rounded-lg hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 transition-all min-w-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{cl.jobTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(cl.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-US')}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{cl.wordCount}</span>
            </Link>

            {confirmId === cl.id ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDelete(cl.id)}
                  disabled={loadingId === cl.id}
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
                onClick={() => setConfirmId(cl.id)}
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

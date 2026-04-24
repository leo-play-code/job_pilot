'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Trash2 } from 'lucide-react'

interface CoverLetterActionsProps {
  coverLetterId: string
}

export function CoverLetterActions({ coverLetterId }: CoverLetterActionsProps) {
  const tc = useTranslations('common')
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await fetch(`/api/cover-letter/${coverLetterId}`, { method: 'DELETE' })
      router.push('/dashboard')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-medium bg-destructive text-white px-2.5 py-1 rounded-md disabled:opacity-50 transition-all hover:bg-red-600 hover:scale-105 hover:shadow-md active:scale-95"
        >
          {tc('delete')}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md transition-all hover:bg-slate-200 hover:text-slate-800 hover:scale-105 hover:shadow-md active:scale-95"
        >
          {tc('cancel')}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/40 text-destructive rounded-md text-sm hover:bg-destructive hover:text-white hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-destructive outline-none"
    >
      <Trash2 className="h-4 w-4" />
      {tc('delete')}
    </button>
  )
}

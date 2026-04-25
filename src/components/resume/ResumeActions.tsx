'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { Download, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ResumeActionsProps {
  resumeId: string
  rawPdfUrl?: string | null
}

export function ResumeActions({ resumeId, rawPdfUrl }: ResumeActionsProps) {
  const tc = useTranslations('common')
  const tr = useTranslations('resume')
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rawLoading, setRawLoading] = useState(false)
  const [isPdfDownloading, setIsPdfDownloading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await fetch(`/api/resume/${resumeId}`, { method: 'DELETE' })
      router.push('/dashboard')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  async function handleDownloadPdf() {
    if (isPdfDownloading) return
    setIsPdfDownloading(true)
    try {
      const res = await fetch(`/api/pdf/download/${resumeId}`)
      if (!res.ok) throw new Error('failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume-${resumeId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(tc('downloadPdfError'))
    } finally {
      setIsPdfDownloading(false)
    }
  }

  async function handleDownloadOriginal() {
    if (rawLoading) return
    setRawLoading(true)
    try {
      const res = await fetch(`/api/resume/${resumeId}/raw-pdf`)
      if (!res.ok) return
      const json = await res.json() as { data: { url: string } }
      if (json.data?.url) window.open(json.data.url, '_blank')
    } catch {
      // silently fail — show disabled state already handled
    } finally {
      setRawLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Link
        href={`/resume/new?edit=${resumeId}`}
        className="flex items-center gap-1.5 px-4 py-2 border rounded-md text-sm hover:bg-muted hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
      >
        <Pencil className="h-4 w-4" />
        {tr('edit')}
      </Link>

      <button
        onClick={handleDownloadPdf}
        disabled={isPdfDownloading}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
      >
        {isPdfDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {tr('download')}
      </button>

      {rawPdfUrl && rawPdfUrl !== '' && (
        <button
          onClick={handleDownloadOriginal}
          disabled={rawLoading}
          className="flex items-center gap-1.5 px-4 py-2 border rounded-md text-sm hover:bg-muted hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          {tr('rawImport.downloadOriginal')}
        </button>
      )}

      {confirming ? (
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
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-destructive/40 text-destructive rounded-md text-sm hover:bg-destructive hover:text-white hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-destructive outline-none"
        >
          <Trash2 className="h-4 w-4" />
          {tc('delete')}
        </button>
      )}
    </div>
  )
}

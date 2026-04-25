'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, X } from 'lucide-react'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const t = useTranslations('upgrade')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  if (!open) return null

  const handleUpgrade = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      window.location.href = json.data.checkoutUrl
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="upgrade-modal-title" className="text-xl font-bold mb-2">
          {t('title')}
        </h2>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          {t('description')}
        </p>

        {error && (
          <p className="text-sm text-destructive mb-3">發生錯誤，請稍後再試。</p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 mb-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('cta')}
        </button>

        <button
          onClick={onClose}
          className="w-full border rounded-md py-2 text-sm hover:bg-muted hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          暫時關閉
        </button>
      </div>
    </div>
  )
}

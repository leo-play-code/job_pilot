'use client'

import { useEffect, useState, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface SubscriptionData {
  plan: 'FREE' | 'PRO'
  currentPeriodEnd: string | null
  hasActiveSubscription: boolean
}

function BillingContent() {
  const t = useTranslations('billing')
  const searchParams = useSearchParams()

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isSuccess = searchParams.get('success') === 'true'
  const isCanceled = searchParams.get('canceled') === 'true'

  useEffect(() => {
    fetch('/api/user/subscription')
      .then((r) => r.json())
      .then((json) => {
        setSubscription(json.data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setActionError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      window.location.href = json.data.checkoutUrl
    } catch {
      setActionError('checkout_failed')
      setCheckoutLoading(false)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setActionError(null)
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      window.location.href = json.data.portalUrl
    } catch {
      setActionError('portal_failed')
      setPortalLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

        {/* Success Banner */}
        {isSuccess && (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 mb-6">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{t('successBanner')}</p>
          </div>
        )}

        {/* Canceled Banner */}
        {isCanceled && (
          <div className="flex items-center gap-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{t('canceledBanner')}</p>
          </div>
        )}

        {/* Subscription Card */}
        <div className="rounded-xl border bg-card p-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-7 w-48 bg-muted rounded" />
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded-lg mt-4" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">發生錯誤，請稍後再試。</p>
          ) : subscription ? (
            <div className="space-y-4">
              {/* Plan display */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {t('currentPlan')}
                </p>
                <p className="text-2xl font-bold">
                  {subscription.plan === 'PRO' ? t('planPro') : t('planFree')}
                </p>
              </div>

              {/* Period end for Pro */}
              {subscription.plan === 'PRO' && subscription.currentPeriodEnd && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t('periodEnd')}
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              )}

              {actionError && (
                <p className="text-sm text-destructive">發生錯誤，請稍後再試。</p>
              )}

              {/* CTA */}
              {subscription.plan === 'FREE' ? (
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
                >
                  {checkoutLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('subscribeCta')}
                </button>
              ) : (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="w-full h-10 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-60 mt-2"
                >
                  {portalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('portalCta')}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="h-8 w-40 bg-muted animate-pulse rounded mb-6" />
          <div className="rounded-xl border bg-card p-6 animate-pulse space-y-3">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-7 w-48 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded-lg mt-4" />
          </div>
        </div>
      </main>
    }>
      <BillingContent />
    </Suspense>
  )
}

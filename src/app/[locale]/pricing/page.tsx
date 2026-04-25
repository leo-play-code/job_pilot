'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Loader2, Check } from 'lucide-react'

interface SubscriptionData {
  plan: 'FREE' | 'PRO'
  currentPeriodEnd: string | null
  hasActiveSubscription: boolean
}

function PlanCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-8 animate-pulse">
      <div className="h-6 w-24 bg-muted rounded mb-2" />
      <div className="h-9 w-32 bg-muted rounded mb-6" />
      <div className="space-y-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-full bg-muted rounded" />
        ))}
      </div>
      <div className="h-10 w-full bg-muted rounded-lg" />
    </div>
  )
}

export default function PricingPage() {
  const t = useTranslations('pricing')
  const { data: session, status: authStatus } = useSession()

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === 'authenticated') {
      setSubscriptionLoading(true)
      fetch('/api/user/subscription')
        .then((r) => r.json())
        .then((json) => setSubscription(json.data))
        .catch(() => setSubscription(null))
        .finally(() => setSubscriptionLoading(false))
    }
  }, [authStatus])

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      window.location.href = json.data.checkoutUrl
    } catch {
      setError('checkout_failed')
      setCheckoutLoading(false)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      window.location.href = json.data.portalUrl
    } catch {
      setError('portal_failed')
      setPortalLoading(false)
    }
  }

  const isAuthenticated = authStatus === 'authenticated'
  const currentPlan = subscription?.plan ?? null
  // Also treat "authenticated but subscription not yet fetched" as loading
  const isLoadingPlan = authStatus === 'loading' || (isAuthenticated && (subscriptionLoading || subscription === null))

  const freeFeatures = [
    t('features.limit10'),
    t('features.templates'),
    t('features.pdf'),
  ]

  const proFeatures = [
    t('features.unlimited'),
    t('features.templates'),
    t('features.pdf'),
    t('features.priority'),
  ]

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive mb-6">
            發生錯誤，請稍後再試。
          </p>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Card */}
          <div className="rounded-2xl border bg-card p-8 flex flex-col">
            <div>
              <h2 className="text-xl font-semibold mb-1">{t('free.name')}</h2>
              <p className="text-3xl font-bold mb-6">{t('free.price')}</p>
              <ul className="space-y-3 mb-8">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto">
              {isLoadingPlan ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
              ) : isAuthenticated ? (
                // Authenticated users never redirect to login — show current plan label
                <button
                  disabled
                  className="w-full h-10 rounded-lg border text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed"
                >
                  {currentPlan === 'PRO' ? t('free.cta') : t('free.currentPlan')}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="block w-full h-10 rounded-lg border text-sm font-medium flex items-center justify-center hover:bg-accent transition-colors"
                >
                  {t('free.cta')}
                </Link>
              )}
            </div>
          </div>

          {/* Pro Card */}
          <div className="rounded-2xl border-2 ring-2 ring-primary bg-card p-8 flex flex-col relative">
            <div>
              <h2 className="text-xl font-semibold mb-1">{t('pro.name')}</h2>
              <p className="text-3xl font-bold mb-6">{t('pro.price')}</p>
              <ul className="space-y-3 mb-8">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto space-y-2">
              {isLoadingPlan ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
              ) : isAuthenticated && currentPlan === 'PRO' ? (
                <>
                  <p className="text-sm text-center text-primary font-medium mb-2">
                    {t('pro.currentPlan')}
                  </p>
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {portalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('pro.manage')}
                  </button>
                </>
              ) : isAuthenticated ? (
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {checkoutLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('pro.cta')}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="block w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center hover:opacity-90 transition-colors"
                >
                  {t('pro.cta')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

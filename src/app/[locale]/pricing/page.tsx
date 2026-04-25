'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Loader2, Check, Coins } from 'lucide-react'
import { usePaddle } from '@/hooks/usePaddle'
import { useQueryClient } from '@tanstack/react-query'
import { CREDITS_QUERY_KEY } from '@/hooks/useCreditsBalance'
import { toast } from 'sonner'

interface SubscriptionData {
  plan: 'FREE' | 'PRO'
  currentPeriodEnd: string | null
  hasActiveSubscription: boolean
}

const CREDIT_PACKS: Array<{ id: string; labelKey: string; popular?: boolean }> = [
  { id: 'starter', labelKey: 'starter' },
  { id: 'jobseeker', labelKey: 'jobseeker', popular: true },
  { id: 'power', labelKey: 'power' },
]

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

  const paddle = usePaddle()
  const queryClient = useQueryClient()

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(1)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [creditPackLoading, setCreditPackLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const creditsSuccess = searchParams.get('credits_success') === 'true'
  const creditsCanceled = searchParams.get('credits_canceled') === 'true'

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

  // Listen for Paddle checkout.completed → verify transaction → update credits badge live
  useEffect(() => {
    const handler = (e: Event) => {
      const { transactionId } = (e as CustomEvent<{ transactionId: string }>).detail
      queryClient.invalidateQueries({ queryKey: [...CREDITS_QUERY_KEY] })
      void fetch('/api/paddle/verify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      })
        .then(() => queryClient.invalidateQueries({ queryKey: [...CREDITS_QUERY_KEY] }))
        .then(() => toast.success(t('credits.success')))
        .catch(() => toast.info('點數確認中，請稍後查看餘額'))
    }
    window.addEventListener('paddle:checkout:completed', handler)
    return () => window.removeEventListener('paddle:checkout:completed', handler)
  }, [queryClient, t])

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/paddle/create-checkout-session', { method: 'POST' })
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
      const res = await fetch('/api/paddle/create-portal-session', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      window.location.href = json.data.portalUrl
    } catch {
      setError('portal_failed')
      setPortalLoading(false)
    }
  }

  const handleBuyCredits = async (packId: string) => {
    if (authStatus !== 'authenticated') {
      window.location.href = '/login'
      return
    }
    if (!paddle) return
    setCreditPackLoading(packId)
    setError(null)
    try {
      const res = await fetch('/api/paddle/buy-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      const txnId = json.data.transactionId
      paddle.Checkout.open({
        transactionId: txnId,
      })
    } catch {
      setError('checkout_failed')
    } finally {
      setCreditPackLoading(null)
    }
  }

  const isAuthenticated = authStatus === 'authenticated'
  const currentPlan = subscription?.plan ?? null
  const isLoadingPlan = authStatus === 'loading' || (isAuthenticated && (subscriptionLoading || subscription === null))

  const freeFeatures = [
    t('features.limit5'),
    t('features.templates'),
    t('features.pdf'),
  ]

  const proFeatures = [
    t('features.unlimited'),
    t('features.autoApply'),
    t('features.templates'),
    t('features.pdf'),
    t('features.priority'),
  ]

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
        </div>

        {creditsSuccess && (
          <p className="text-center text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6">
            {t('credits.success')}
          </p>
        )}
        {creditsCanceled && (
          <p className="text-center text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3 mb-6">
            {t('credits.canceled')}
          </p>
        )}
        {error && (
          <p className="text-center text-sm text-destructive mb-6">
            發生錯誤，請稍後再試。
          </p>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
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
                <button
                  disabled
                  className="w-full h-10 rounded-lg border text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed"
                >
                  {currentPlan === 'PRO' ? t('free.cta') : t('free.currentPlan')}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="w-full h-10 rounded-lg border text-sm font-medium flex items-center justify-center hover:bg-accent transition-colors"
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
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center hover:opacity-90 transition-colors"
                >
                  {t('pro.cta')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Credit Packs */}
        <div>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{t('credits.title')}</h2>
            </div>
            <p className="text-muted-foreground text-sm">{t('credits.subtitle')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('credits.autoApplyCost')}</p>
          </div>

          {/* Slider labels */}
          <div className="flex justify-between mb-3 px-1">
            {CREDIT_PACKS.map((pack, i) => (
              <button
                key={pack.id}
                onClick={() => setSelectedIndex(i)}
                className={`flex flex-col items-center text-sm font-medium transition-colors ${
                  selectedIndex === i ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`credits.${pack.labelKey}.name`)}
                <span className="text-xs font-normal mt-0.5">{t(`credits.${pack.labelKey}.credits`)}</span>
              </button>
            ))}
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer mb-8"
          />

          {/* Selected pack detail card */}
          {(() => {
            const pack = CREDIT_PACKS[selectedIndex]
            const isLoading = creditPackLoading === pack.id
            return (
              <div
                className={`rounded-2xl border bg-card p-8 relative transition-all ${
                  pack.popular ? 'border-2 border-primary ring-1 ring-primary' : ''
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {t('credits.popularBadge')}
                  </span>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-xl mb-2">{t(`credits.${pack.labelKey}.name`)}</h3>
                  <p className="text-4xl font-bold mb-1">{t(`credits.${pack.labelKey}.price`)}</p>
                  <p className="text-lg text-primary font-medium">{t(`credits.${pack.labelKey}.credits`)}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t(`credits.${pack.labelKey}.highlight`)}</p>
                </div>
                <button
                  onClick={() => handleBuyCredits(pack.id)}
                  disabled={isLoading}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('credits.buyNow')}
                </button>
              </div>
            )
          })()}
        </div>
      </div>
    </main>
  )
}

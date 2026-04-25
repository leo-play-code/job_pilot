'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface UsageData {
  used: number
  limit?: number
  unlimited?: boolean
}

export function UsageBadge() {
  const t = useTranslations('dashboard')
  const [usage, setUsage] = useState<UsageData | null>(null)

  useEffect(() => {
    fetch('/api/usage/today')
      .then((r) => r.json())
      .then((json) => setUsage(json.data))
      .catch(() => null)
  }, [])

  if (!usage) return null

  // PRO: unlimited = true → show gold "Pro ∞" badge
  if (usage.unlimited) {
    return (
      <span className="inline-flex items-center text-sm font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300">
        Pro ∞
      </span>
    )
  }

  const limit = usage.limit ?? 0
  const remaining = limit - usage.used

  return (
    <span className="text-sm text-muted-foreground">
      {t('usageRemaining', { remaining, limit })}
    </span>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export function UsageBadge() {
  const t = useTranslations('dashboard')
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)

  useEffect(() => {
    fetch('/api/usage/today')
      .then((r) => r.json())
      .then((json) => setUsage(json.data))
      .catch(() => null)
  }, [])

  if (!usage) return null

  const remaining = usage.limit - usage.used

  return (
    <span className="text-sm text-muted-foreground">
      {t('usageRemaining', { remaining, limit: usage.limit })}
    </span>
  )
}

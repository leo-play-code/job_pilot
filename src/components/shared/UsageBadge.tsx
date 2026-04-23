'use client'

import { useEffect, useState } from 'react'

export function UsageBadge() {
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
      今日剩餘 {remaining}/{usage.limit} 次
    </span>
  )
}

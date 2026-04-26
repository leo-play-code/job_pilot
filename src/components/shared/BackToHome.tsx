'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Home } from 'lucide-react'

export function BackToHome() {
  const pathname = usePathname()
  const isHome = /^\/(?:zh|en)?\/?$/.test(pathname)

  if (isHome) return null

  return (
    <div className="container mx-auto px-4 pt-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        回到首頁
      </Link>
    </div>
  )
}

'use client'

import type { Language } from '@/types/resume'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  value: Language
  onChange: (lang: Language) => void
}

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <div className="flex rounded-md border overflow-hidden w-fit">
      {(['zh', 'en'] as Language[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={cn(
            'px-5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none',
            value === lang
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          {lang === 'zh' ? '中文' : 'English'}
        </button>
      ))}
    </div>
  )
}

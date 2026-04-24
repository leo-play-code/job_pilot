'use client'

import type { WordCountOption } from '@/types/resume'
import { WORD_COUNT_MAP } from '@/types/resume'
import { cn } from '@/lib/utils'

interface WordCountSelectorProps {
  value: WordCountOption
  onChange: (v: WordCountOption) => void
}

const OPTIONS: { id: WordCountOption; label: string }[] = [
  { id: 'SHORT', label: '短篇' },
  { id: 'MEDIUM', label: '中篇' },
  { id: 'LONG', label: '長篇' },
]

export function WordCountSelector({ value, onChange }: WordCountSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'border-2 rounded-lg p-3 text-center transition-all',
            value === o.id
              ? 'border-primary scale-[1.03] shadow-sm'
              : 'border-muted hover:border-primary/50 hover:scale-[1.05] hover:shadow-sm active:scale-95',
          )}
        >
          <p className="font-medium text-sm">{o.label}</p>
          <p className="text-xs text-muted-foreground mt-1">~{WORD_COUNT_MAP[o.id]} 字</p>
        </button>
      ))}
    </div>
  )
}

'use client'

import { TEMPLATES, type TemplateId } from '@/types/resume'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
  value: TemplateId
  onChange: (id: TemplateId) => void
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'border-2 rounded-lg p-4 text-left transition-all',
            value === t.id
              ? 'border-primary scale-[1.02] shadow-sm'
              : 'border-muted hover:border-primary/50 hover:scale-[1.03] hover:shadow-sm active:scale-95',
          )}
        >
          <div className="w-full h-24 bg-muted rounded mb-3" />
          <p className="font-medium text-sm">{t.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
        </button>
      ))}
    </div>
  )
}

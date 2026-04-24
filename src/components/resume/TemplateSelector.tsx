'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { TemplateRecord } from '@/types/resume'
import { cn } from '@/lib/utils'

// ── Built-in SVG previews (fallback when thumbnailUrl is not set) ─────────────

function ModernPreview({ selected }: { selected: boolean }) {
  const accent = selected ? 'hsl(221 83% 53% / 0.7)' : '#94a3b8'
  const line = '#cbd5e1'
  const lineLight = '#e2e8f0'
  return (
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="12" y="10" width="80" height="7" rx="2" fill={accent} />
      <rect x="12" y="20" width="50" height="4" rx="1" fill={lineLight} />
      <line x1="12" y1="30" x2="148" y2="30" stroke={line} strokeWidth="1" />
      <rect x="12" y="36" width="30" height="4" rx="1" fill={accent} opacity="0.6" />
      <rect x="12" y="44" width="120" height="3" rx="1" fill={line} />
      <rect x="12" y="50" width="100" height="3" rx="1" fill={line} />
      <rect x="12" y="56" width="80" height="3" rx="1" fill={lineLight} />
      <rect x="12" y="64" width="30" height="4" rx="1" fill={accent} opacity="0.6" />
      <rect x="12" y="72" width="120" height="3" rx="1" fill={line} />
      <rect x="12" y="78" width="90" height="3" rx="1" fill={line} />
      <rect x="12" y="84" width="60" height="3" rx="1" fill={lineLight} />
    </svg>
  )
}

function ProfessionalPreview({ selected }: { selected: boolean }) {
  const accent = selected ? 'hsl(221 83% 53% / 0.7)' : '#94a3b8'
  const line = '#cbd5e1'
  const lineLight = '#e2e8f0'
  const sidebarBg = selected ? 'hsl(221 83% 53% / 0.08)' : '#f1f5f9'
  return (
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="0" width="160" height="18" rx="0" fill={accent} />
      <rect x="10" y="5" width="60" height="5" rx="1" fill="white" opacity="0.9" />
      <rect x="10" y="12" width="40" height="3" rx="1" fill="white" opacity="0.6" />
      <rect x="0" y="18" width="52" height="82" fill={sidebarBg} />
      <rect x="6" y="24" width="20" height="3" rx="1" fill={accent} opacity="0.7" />
      <rect x="6" y="30" width="38" height="3" rx="1" fill={line} />
      <rect x="6" y="35" width="30" height="3" rx="1" fill={line} />
      <rect x="6" y="40" width="35" height="3" rx="1" fill={lineLight} />
      <rect x="6" y="50" width="20" height="3" rx="1" fill={accent} opacity="0.7" />
      <rect x="6" y="56" width="38" height="3" rx="1" fill={line} />
      <rect x="6" y="61" width="32" height="3" rx="1" fill={line} />
      <rect x="6" y="66" width="28" height="3" rx="1" fill={lineLight} />
      <rect x="58" y="24" width="28" height="3" rx="1" fill={accent} opacity="0.7" />
      <rect x="58" y="30" width="92" height="3" rx="1" fill={line} />
      <rect x="58" y="35" width="80" height="3" rx="1" fill={line} />
      <rect x="58" y="40" width="68" height="3" rx="1" fill={lineLight} />
      <rect x="58" y="50" width="28" height="3" rx="1" fill={accent} opacity="0.7" />
      <rect x="58" y="56" width="92" height="3" rx="1" fill={line} />
      <rect x="58" y="61" width="76" height="3" rx="1" fill={line} />
      <rect x="58" y="66" width="60" height="3" rx="1" fill={lineLight} />
    </svg>
  )
}

function CreativePreview({ selected }: { selected: boolean }) {
  const sidebarColor = selected ? 'hsl(221 83% 53% / 0.85)' : '#475569'
  const accent = selected ? 'hsl(221 83% 53% / 0.7)' : '#64748b'
  const line = '#cbd5e1'
  const lineLight = '#e2e8f0'
  return (
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="0" width="45" height="100" fill={sidebarColor} />
      <rect x="6" y="12" width="28" height="5" rx="1" fill="white" opacity="0.9" />
      <rect x="6" y="20" width="22" height="3" rx="1" fill="white" opacity="0.6" />
      <rect x="6" y="26" width="18" height="3" rx="1" fill="white" opacity="0.5" />
      <rect x="6" y="38" width="16" height="3" rx="1" fill="white" opacity="0.8" />
      <rect x="6" y="44" width="30" height="2.5" rx="1" fill="white" opacity="0.45" />
      <rect x="6" y="49" width="28" height="2.5" rx="1" fill="white" opacity="0.45" />
      <rect x="52" y="10" width="60" height="6" rx="1" fill={accent} />
      <rect x="52" y="19" width="42" height="3" rx="1" fill={line} />
      <line x1="52" y1="27" x2="152" y2="27" stroke={line} strokeWidth="1" />
      <rect x="52" y="32" width="28" height="3" rx="1" fill={accent} opacity="0.7" />
      <rect x="52" y="38" width="98" height="2.5" rx="1" fill={line} />
      <rect x="52" y="43" width="82" height="2.5" rx="1" fill={line} />
      <rect x="52" y="48" width="70" height="2.5" rx="1" fill={lineLight} />
      <rect x="52" y="57" width="28" height="3" rx="1" fill={accent} opacity="0.7" />
      <rect x="52" y="63" width="98" height="2.5" rx="1" fill={line} />
      <rect x="52" y="68" width="75" height="2.5" rx="1" fill={line} />
      <rect x="52" y="73" width="60" height="2.5" rx="1" fill={lineLight} />
    </svg>
  )
}

const SVG_PREVIEW_MAP: Record<string, React.ComponentType<{ selected: boolean }>> = {
  modern: ModernPreview,
  professional: ProfessionalPreview,
  creative: CreativePreview,
}

// ── Selector ─────────────────────────────────────────────────────────────────

interface TemplateSelectorProps {
  value: string
  onChange: (id: string) => void
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(json => setTemplates(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border-2 rounded-lg p-4 border-muted animate-pulse">
            <div className="w-full h-24 rounded mb-3 bg-muted" />
            <div className="h-4 w-20 bg-muted rounded mb-2" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {templates.map((t) => {
        const selected = value === t.id
        const SvgPreview = SVG_PREVIEW_MAP[t.id]

        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'border-2 rounded-lg p-4 text-left transition-all',
              selected
                ? 'border-primary scale-[1.02] shadow-sm'
                : 'border-muted hover:border-primary/50 hover:scale-[1.03] hover:shadow-sm active:scale-95',
            )}
          >
            <div className="w-full h-24 rounded mb-3 overflow-hidden border border-border/40 bg-slate-50 relative">
              {t.thumbnailUrl ? (
                <Image
                  src={t.thumbnailUrl}
                  alt={t.name}
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
              ) : SvgPreview ? (
                <SvgPreview selected={selected} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  {t.name}
                </div>
              )}
            </div>
            <p className="font-medium text-sm">{t.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
          </button>
        )
      })}
    </div>
  )
}

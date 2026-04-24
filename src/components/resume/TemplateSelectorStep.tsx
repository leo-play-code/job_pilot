'use client'

import { TemplateSelector } from './TemplateSelector'
import type { Language, TemplateId } from '@/types/resume'

interface TemplateSelectorStepProps {
  templateId: TemplateId
  language: Language
  onTemplateChange: (id: TemplateId) => void
  onLanguageChange: (lang: Language) => void
}

export function TemplateSelectorStep({
  templateId,
  language,
  onTemplateChange,
  onLanguageChange,
}: TemplateSelectorStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-semibold mb-4">選擇模板</h3>
        <TemplateSelector value={templateId} onChange={onTemplateChange} />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-4">履歷語言</h3>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {(['zh', 'en'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              className={`border-2 rounded-lg py-2.5 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                language === lang
                  ? 'border-primary bg-primary/5 text-primary scale-[1.03] shadow-sm'
                  : 'border-muted hover:border-primary/50 hover:scale-105 active:scale-95'
              }`}
            >
              {lang === 'zh' ? '中文' : 'English'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

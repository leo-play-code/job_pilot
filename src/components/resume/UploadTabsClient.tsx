'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { DropZone } from '@/components/resume/DropZone'
import { RawImportForm } from '@/components/resume/RawImportForm'
import { cn } from '@/lib/utils'

type Tab = 'ai' | 'raw'

export function UploadTabsClient() {
  const t = useTranslations('resume.rawImport')
  const [activeTab, setActiveTab] = useState<Tab>('ai')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            activeTab === 'ai'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t('aiTabLabel')}
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            activeTab === 'raw'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t('tabLabel')}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'ai' ? <DropZone /> : <RawImportForm />}
    </div>
  )
}

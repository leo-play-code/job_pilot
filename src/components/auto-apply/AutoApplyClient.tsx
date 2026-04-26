'use client'

import { useState } from 'react'
import { SearchConfigForm } from './SearchConfigForm'
import { PlatformCredentialSetup } from './PlatformCredentialSetup'
import { BatchApplyPanel } from './BatchApplyPanel'
import { ApplicationHistoryTable } from './ApplicationHistoryTable'

interface Resume {
  id: string
  title: string
}

interface SearchConfig {
  keywords: string[]
  locationCodes: string[]
  subLocationCodes: string[]
  salaryMin?: number
  salaryMax?: number
  jobTypes: string[]
  industries: string[]
  coverLetterMode: 'AI_GENERATED' | 'PLATFORM_DEFAULT'
  wordCount: 'SHORT' | 'MEDIUM' | 'LONG'
  coverLetterIndex: number
  maxApplyCount: number
}

interface Props {
  resumes: Resume[]
  initialConfig: SearchConfig | null
  credentialExists: boolean
  hasCookies: boolean
  cookiesUpdatedAt: string | null
  isLocal: boolean
}

const TABS = [
  { id: 'settings', label: '設定', comingSoon: false },
  { id: 'apply', label: '開始投遞', comingSoon: true },
  { id: 'history', label: '投遞記錄', comingSoon: false },
] as const

type TabId = (typeof TABS)[number]['id']

export function AutoApplyClient({
  resumes,
  initialConfig,
  credentialExists,
  hasCookies,
  cookiesUpdatedAt,
  isLocal,
}: Props) {
  const [config, setConfig] = useState<SearchConfig | null>(initialConfig)
  const [hasCredential, setHasCredential] = useState(credentialExists)
  const [cookieState, setCookieState] = useState({
    hasCookies,
    cookiesUpdatedAt,
  })
  const [activeTab, setActiveTab] = useState<TabId>('settings')

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">104 自動投遞</h1>
        <p className="text-muted-foreground mt-1 text-sm">設定搜尋條件，AI 自動搜尋職缺並批次投遞</p>
      </div>

      {/* Tab bar */}
      <div className="border-b mb-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.comingSoon && (
                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 leading-none">
                  開發中
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <PlatformCredentialSetup
            exists={hasCredential}
            hasCookies={cookieState.hasCookies}
            cookiesUpdatedAt={cookieState.cookiesUpdatedAt}
            isLocal={isLocal}
            onSaved={() => setHasCredential(true)}
            onSessionCaptured={(updatedAt) =>
              setCookieState({ hasCookies: true, cookiesUpdatedAt: updatedAt })
            }
          />
          <SearchConfigForm
            initialValues={config}
            onSaved={(newConfig) => {
              setConfig(newConfig)
              setActiveTab('apply')
            }}
          />
        </div>
      )}

      {activeTab === 'apply' && (
        <BatchApplyPanel
          resumes={resumes}
          config={config}
          hasCredential={hasCredential}
          onGoToSettings={() => setActiveTab('settings')}
          onComplete={() => setActiveTab('history')}
        />
      )}

      {activeTab === 'history' && <ApplicationHistoryTable />}
    </div>
  )
}

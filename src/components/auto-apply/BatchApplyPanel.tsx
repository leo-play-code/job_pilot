'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Play, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useCreditsBalance } from '@/hooks/useCreditsBalance'
import { CREDIT_COSTS } from '@/lib/constants'

interface Resume {
  id: string
  title: string
}

interface Config {
  keywords: string[]
  locationCodes: string[]
  coverLetterMode: 'AI_GENERATED' | 'PLATFORM_DEFAULT'
  maxApplyCount: number
}

interface ApplyResult {
  jobId: string
  title: string
  company: string
  success: boolean
  errorType?: string
  errorMessage?: string
}

interface Props {
  resumes: Resume[]
  config: Config | null
  hasCredential: boolean
  onGoToSettings: () => void
  onComplete: () => void
}

export function BatchApplyPanel({ resumes, config, hasCredential, onGoToSettings, onComplete }: Props) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id ?? '')
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<ApplyResult[] | null>(null)
  const [summary, setSummary] = useState<{ applied: number; failed: number } | null>(null)
  const { data: credits } = useCreditsBalance()

  const currentCredits = credits ?? 0
  const hasEnoughCredits = currentCredits >= CREDIT_COSTS.AUTO_APPLY
  const isReady = config && hasCredential && hasEnoughCredits && resumes.length > 0

  const handleStart = async () => {
    if (!isReady) return
    setIsRunning(true)
    setResults(null)
    setSummary(null)

    try {
      const res = await fetch('/api/auto-apply/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId || undefined }),
      })
      const json = await res.json()

      if (!res.ok) {
        const errMsg: Record<string, string> = {
          search_config_missing: '請先完成搜尋設定',
          credentials_not_configured: '請先設定 104 帳號',
          insufficient_credits: '點數不足，請先購買點數',
          search_unavailable: '104 搜尋服務暫時無法使用，請稍後再試',
          no_saved_cover_letter: '找不到預存自薦信，請至 104 → 會員中心 → 自薦信管理新增',
        }
        toast.error(errMsg[json.error as string] ?? '投遞失敗，請稍後再試')
        return
      }

      const { applied, failed, results: applyResults } = json.data as {
        applied: number
        failed: number
        results: ApplyResult[]
      }
      setResults(applyResults)
      setSummary({ applied, failed })

      if (applied > 0) {
        toast.success(`成功投遞 ${applied} 筆職缺！`)
        onComplete()
      } else if (failed > 0) {
        toast.error(`所有職缺投遞失敗（${failed} 筆）`)
      } else {
        toast.info('沒有找到新的符合職缺')
      }
    } catch {
      toast.error('網路錯誤，請稍後再試')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Config summary */}
      {config && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium mb-2">目前搜尋設定</h3>
          <div className="space-y-1 text-sm">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-muted-foreground">關鍵字：</span>
              {config.keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">{kw}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">自薦信：</span>
              <span>{config.coverLetterMode === 'AI_GENERATED' ? 'AI 生成' : '104 預設'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">每次最多：</span>
              <span>{config.maxApplyCount} 筆</span>
            </div>
          </div>
        </div>
      )}

      {/* Main action card */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div>
          <h3 className="font-medium text-sm">開始自動投遞</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            系統將搜尋符合條件的 104 職缺並自動批次投遞，每筆成功投遞消耗 {CREDIT_COSTS.AUTO_APPLY} 點
          </p>
        </div>

        {/* Warnings */}
        {!config && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm border border-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>請先至「設定」分頁完成搜尋設定</span>
            <button onClick={onGoToSettings} className="ml-auto text-xs underline underline-offset-2">前往設定</button>
          </div>
        )}
        {!hasCredential && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm border border-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>請先至「設定」分頁設定 104 帳號</span>
            <button onClick={onGoToSettings} className="ml-auto text-xs underline underline-offset-2">前往設定</button>
          </div>
        )}
        {!hasEnoughCredits && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>點數不足（需至少 {CREDIT_COSTS.AUTO_APPLY} 點，目前 {currentCredits} 點）</span>
            <a href="/settings/credits" className="ml-auto text-xs underline underline-offset-2">購買點數</a>
          </div>
        )}

        {/* Resume selector */}
        {resumes.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">使用履歷</label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        )}

        {resumes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            尚無履歷，請先至「儀表板」建立或上傳一份履歷。
          </p>
        )}

        <div className="text-sm text-muted-foreground">
          目前點數：<span className="font-medium text-foreground">{currentCredits} 點</span>
        </div>

        <button
          className="w-full h-11 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isReady || isRunning}
          onClick={handleStart}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              投遞中，請耐心等候...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              開始自動投遞
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          失敗的投遞不扣點數。投遞過程約需數分鐘，請勿關閉頁面。
        </p>
      </div>

      {/* Results */}
      {summary && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium">投遞結果</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              成功 {summary.applied} 筆（消耗 {summary.applied * CREDIT_COSTS.AUTO_APPLY} 點）
            </div>
            {summary.failed > 0 && (
              <div className="flex items-center gap-1.5 text-red-600">
                <XCircle className="h-4 w-4" />
                失敗 {summary.failed} 筆
              </div>
            )}
          </div>

          {results && results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.jobId} className="flex items-start gap-2 text-sm p-2.5 rounded-md bg-muted/50">
                  {r.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-medium">{r.title}</span>
                    <span className="text-muted-foreground"> @ {r.company}</span>
                    {!r.success && r.errorMessage && (
                      <p className="text-xs text-red-600 mt-0.5">{r.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { StepIndicator } from '@/components/shared/StepIndicator'
import { LoadingOverlay } from '@/components/shared/LoadingOverlay'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { ResumeSelector } from './ResumeSelector'
import { WordCountSelector } from './WordCountSelector'
import { LanguageToggle } from './LanguageToggle'
import type { Language, WordCountOption } from '@/types/resume'
import { Loader2 } from 'lucide-react'

const STEPS = ['選擇履歷', '職缺描述', '生成設定']

export function CoverLetterBuilderForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const [resumeId, setResumeId] = useState('')
  const [resumeSummary, setResumeSummary] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [wordCount, setWordCount] = useState<WordCountOption>('MEDIUM')
  const [language, setLanguage] = useState<Language>('zh')

  const canProceed = () => {
    if (step === 0) return !!(resumeId || resumeSummary.trim()) && !!jobTitle.trim()
    if (step === 1) return !!jobDesc.trim()
    return true
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(resumeId ? { resumeId } : { resumeSummary }),
          jobTitle,
          jobDesc,
          wordCount,
          language,
        }),
      })

      if (res.status === 429) {
        setShowUpgrade(true)
        return
      }

      const json = await res.json()
      router.push(`/cover-letter/${json.data.coverLetterId}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {isGenerating && <LoadingOverlay message="AI 生成自薦信中，請稍候..." />}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <StepIndicator steps={STEPS} current={step} />

        <div className="mt-8 space-y-6">
          {/* Step 0: Resume source + job title */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold mb-3">選擇履歷（可選）</h2>
                <ResumeSelector value={resumeId} onChange={setResumeId} />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">或貼上摘要</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div>
                <label htmlFor="resumeSummary" className="block text-sm font-medium mb-1.5">
                  履歷摘要
                </label>
                <textarea
                  id="resumeSummary"
                  rows={4}
                  value={resumeSummary}
                  onChange={(e) => setResumeSummary(e.target.value)}
                  disabled={!!resumeId}
                  placeholder="貼上你的工作經歷摘要..."
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none disabled:opacity-40"
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium mb-1.5">
                  職缺名稱 <span className="text-destructive">*</span>
                </label>
                <input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="例：前端工程師"
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Step 1: Job description */}
          {step === 1 && (
            <div>
              <label htmlFor="jobDesc" className="block text-sm font-medium mb-1.5">
                職缺描述 <span className="text-destructive">*</span>
              </label>
              <textarea
                id="jobDesc"
                rows={10}
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="貼上職缺的完整描述，AI 將根據此內容客製化自薦信..."
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
              />
            </div>
          )}

          {/* Step 2: Settings + generate */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-semibold mb-4">字數</h3>
                <WordCountSelector value={wordCount} onChange={setWordCount} />
              </div>
              <div>
                <h3 className="text-base font-semibold mb-4">語言</h3>
                <LanguageToggle value={language} onChange={setLanguage} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-10">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-5 py-2 border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-primary outline-none"
          >
            上一步
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary outline-none"
            >
              下一步
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary outline-none"
            >
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
              AI 生成自薦信
            </button>
          )}
        </div>
      </div>
    </>
  )
}

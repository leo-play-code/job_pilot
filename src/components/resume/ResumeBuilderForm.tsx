'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { StepIndicator } from '@/components/shared/StepIndicator'
import { LoadingOverlay } from '@/components/shared/LoadingOverlay'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { PersonalInfoForm } from './PersonalInfoForm'
import { ExperienceForm } from './ExperienceForm'
import { EducationSkillsForm } from './EducationSkillsForm'
import { TemplateSelectorStep } from './TemplateSelectorStep'
import type { PersonalInfo, Experience, Education, Language, TemplateId } from '@/types/resume'

const STEPS = ['個人資料', '工作經歷', '學歷與技能', '選擇模板']

interface InitialData {
  content: {
    personalInfo: PersonalInfo
    experience: Experience[]
    education: Education[]
    skills: string[]
    achievements: string[]
    summary?: string
  }
  templateId: TemplateId
  language: Language
  resumeId?: string
}

interface ResumeBuilderFormProps {
  initialData?: InitialData | null
}

export function ResumeBuilderForm({ initialData }: ResumeBuilderFormProps) {
  const router = useRouter()
  const locale = useLocale()
  const [step, setStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(
    initialData?.content.personalInfo ?? { name: '', email: '' }
  )
  const [experience, setExperience] = useState<Experience[]>(
    initialData?.content.experience ?? []
  )
  const [education, setEducation] = useState<Education[]>(
    initialData?.content.education ?? []
  )
  const [skills, setSkills] = useState<string[]>(
    initialData?.content.skills ?? []
  )
  const [achievements, setAchievements] = useState<string[]>(
    initialData?.content.achievements ?? []
  )
  const [templateId, setTemplateId] = useState<TemplateId>(
    initialData?.templateId ?? 'modern'
  )
  const [language, setLanguage] = useState<Language>(
    initialData?.language ?? 'zh'
  )

  // Load parsed data from PDF upload flow
  useEffect(() => {
    if (initialData) return
    const stored = sessionStorage.getItem('parsed-resume')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (parsed.personalInfo) setPersonalInfo(parsed.personalInfo)
      if (parsed.experience) setExperience(parsed.experience)
      if (parsed.education) setEducation(parsed.education)
      if (parsed.skills) setSkills(parsed.skills)
      if (parsed.achievements) setAchievements(parsed.achievements)
    } catch {
      // ignore malformed data
    } finally {
      sessionStorage.removeItem('parsed-resume')
    }
  }, [initialData])

  const handleGenerate = async () => {
    setIsGenerating(true)
    const content = { personalInfo, experience, education, skills, achievements }

    try {
      let res: Response
      if (initialData?.resumeId) {
        res = await fetch(`/api/resume/${initialData.resumeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, templateId, language }),
        })
      } else {
        res = await fetch('/api/resume/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, templateId, language }),
        })
      }

      if (res.status === 429) {
        setShowUpgrade(true)
        return
      }

      const json = await res.json()
      const resumeId = json.data?.resumeId ?? initialData?.resumeId
      router.push(`/resume/${resumeId}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return !!personalInfo.name && !!personalInfo.email
    return true
  }

  return (
    <>
      {isGenerating && <LoadingOverlay message="AI 生成履歷中，請稍候..." />}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <StepIndicator steps={STEPS} current={step} />

        <div className="mt-8">
          {step === 0 && (
            <PersonalInfoForm data={personalInfo} onChange={setPersonalInfo} />
          )}
          {step === 1 && (
            <ExperienceForm data={experience} onChange={setExperience} />
          )}
          {step === 2 && (
            <EducationSkillsForm
              education={education}
              skills={skills}
              achievements={achievements}
              onEducationChange={setEducation}
              onSkillsChange={setSkills}
              onAchievementsChange={setAchievements}
            />
          )}
          {step === 3 && (
            <TemplateSelectorStep
              templateId={templateId}
              language={language}
              onTemplateChange={setTemplateId}
              onLanguageChange={setLanguage}
            />
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
              className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary outline-none"
            >
              {initialData?.resumeId ? '儲存更新' : 'AI 生成履歷'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

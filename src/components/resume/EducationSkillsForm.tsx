'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { Education } from '@/types/resume'

interface EducationSkillsFormProps {
  education: Education[]
  skills: string[]
  achievements: string[]
  onEducationChange: (data: Education[]) => void
  onSkillsChange: (data: string[]) => void
  onAchievementsChange: (data: string[]) => void
}

const emptyEdu = (): Education => ({
  school: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  gpa: '',
})

export function EducationSkillsForm({
  education,
  skills,
  achievements,
  onEducationChange,
  onSkillsChange,
  onAchievementsChange,
}: EducationSkillsFormProps) {
  const [skillInput, setSkillInput] = useState('')

  const updateEdu = (i: number, field: keyof Education, value: string) => {
    onEducationChange(education.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  const addSkill = () => {
    const val = skillInput.trim()
    if (val && !skills.includes(val)) {
      onSkillsChange([...skills, val])
    }
    setSkillInput('')
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill()
    }
  }

  const updateAchievement = (i: number, value: string) => {
    onAchievementsChange(achievements.map((a, idx) => idx === i ? value : a))
  }

  return (
    <div className="space-y-8">
      {/* Education */}
      <div>
        <h3 className="text-base font-semibold mb-4">學歷</h3>
        <div className="space-y-4">
          {education.map((edu, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">學歷 {i + 1}</span>
                <button
                  type="button"
                  onClick={() => onEducationChange(education.filter((_, idx) => idx !== i))}
                  aria-label={`刪除學歷 ${i + 1}`}
                  className="text-muted-foreground hover:text-destructive transition-colors focus-visible:ring-2 focus-visible:ring-destructive outline-none rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'school', label: '學校名稱' },
                  { key: 'degree', label: '學位' },
                  { key: 'field', label: '科系' },
                  { key: 'gpa', label: 'GPA（選填）' },
                  { key: 'startDate', label: '開始年份' },
                  { key: 'endDate', label: '結束年份' },
                ] as { key: keyof Education; label: string }[]).map(({ key, label }) => (
                  <div key={key}>
                    <label htmlFor={`edu-${key}-${i}`} className="block text-sm font-medium mb-1">{label}</label>
                    <input
                      id={`edu-${key}-${i}`}
                      value={edu[key] ?? ''}
                      onChange={(e) => updateEdu(i, key, e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onEducationChange([...education, emptyEdu()])}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
          >
            <Plus className="h-4 w-4" /> 新增學歷
          </button>
        </div>
      </div>

      {/* Skills */}
      <div>
        <h3 className="text-base font-semibold mb-4">技能</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1 bg-primary/10 text-primary text-sm px-2.5 py-1 rounded-full"
            >
              {skill}
              <button
                type="button"
                onClick={() => onSkillsChange(skills.filter((s) => s !== skill))}
                aria-label={`移除 ${skill}`}
                className="hover:opacity-70 focus-visible:ring-2 focus-visible:ring-primary outline-none rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="輸入技能後按 Enter（例：React, TypeScript）"
            className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="新增技能"
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary outline-none"
          >
            新增
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-base font-semibold mb-4">成就（選填）</h3>
        <div className="space-y-2">
          {achievements.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={a}
                onChange={(e) => updateAchievement(i, e.target.value)}
                placeholder="例：獲得年度最佳員工獎"
                className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`成就 ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => onAchievementsChange(achievements.filter((_, idx) => idx !== i))}
                aria-label="刪除此成就"
                className="text-muted-foreground hover:text-destructive transition-colors focus-visible:ring-2 focus-visible:ring-destructive outline-none rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onAchievementsChange([...achievements, ''])}
            className="flex items-center gap-1 text-xs text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary outline-none rounded"
          >
            <Plus className="h-3 w-3" /> 新增成就
          </button>
        </div>
      </div>
    </div>
  )
}

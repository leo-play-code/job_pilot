'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { Experience } from '@/types/resume'

interface ExperienceFormProps {
  data: Experience[]
  onChange: (data: Experience[]) => void
}

const emptyExp = (): Experience => ({
  company: '',
  title: '',
  startDate: '',
  endDate: '',
  current: false,
  bullets: [''],
})

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const update = (i: number, field: keyof Experience, value: unknown) => {
    const next = data.map((exp, idx) => idx === i ? { ...exp, [field]: value } : exp)
    onChange(next)
  }

  const updateBullet = (expIdx: number, bulletIdx: number, value: string) => {
    const next = data.map((exp, i) => {
      if (i !== expIdx) return exp
      const bullets = exp.bullets.map((b, j) => j === bulletIdx ? value : b)
      return { ...exp, bullets }
    })
    onChange(next)
  }

  const addBullet = (expIdx: number) => {
    const next = data.map((exp, i) =>
      i === expIdx ? { ...exp, bullets: [...exp.bullets, ''] } : exp
    )
    onChange(next)
  }

  const removeBullet = (expIdx: number, bulletIdx: number) => {
    const next = data.map((exp, i) => {
      if (i !== expIdx) return exp
      return { ...exp, bullets: exp.bullets.filter((_, j) => j !== bulletIdx) }
    })
    onChange(next)
  }

  return (
    <div className="space-y-6">
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          尚未新增工作經歷，可直接跳過由 AI 填寫
        </p>
      )}

      {data.map((exp, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">工作經歷 {i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(data.filter((_, idx) => idx !== i))}
              aria-label={`刪除工作經歷 ${i + 1}`}
              className="text-muted-foreground hover:text-destructive hover:scale-110 active:scale-90 transition-all focus-visible:ring-2 focus-visible:ring-destructive outline-none rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`company-${i}`} className="block text-sm font-medium mb-1">公司名稱</label>
              <input
                id={`company-${i}`}
                value={exp.company}
                onChange={(e) => update(i, 'company', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div>
              <label htmlFor={`title-${i}`} className="block text-sm font-medium mb-1">職稱</label>
              <input
                id={`title-${i}`}
                value={exp.title}
                onChange={(e) => update(i, 'title', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div>
              <label htmlFor={`startDate-${i}`} className="block text-sm font-medium mb-1">開始日期</label>
              <input
                id={`startDate-${i}`}
                placeholder="2022-01"
                value={exp.startDate}
                onChange={(e) => update(i, 'startDate', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div>
              <label htmlFor={`endDate-${i}`} className="block text-sm font-medium mb-1">結束日期</label>
              <input
                id={`endDate-${i}`}
                placeholder="2024-06"
                value={exp.endDate ?? ''}
                disabled={exp.current}
                onChange={(e) => update(i, 'endDate', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
              <label className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => update(i, 'current', e.target.checked)}
                  className="rounded"
                />
                目前在職
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">工作內容（每條一行）</p>
            {exp.bullets.map((bullet, j) => (
              <div key={j} className="flex gap-2 mb-2">
                <input
                  value={bullet}
                  onChange={(e) => updateBullet(i, j, e.target.value)}
                  placeholder="描述你的主要職責或成就"
                  className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`工作內容 ${j + 1}`}
                />
                {exp.bullets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBullet(i, j)}
                    aria-label="刪除這條"
                    className="text-muted-foreground hover:text-destructive transition-colors outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addBullet(i)}
              className="flex items-center gap-1 text-xs text-primary hover:underline hover:scale-105 active:scale-95 mt-1 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none rounded"
            >
              <Plus className="h-3 w-3" /> 新增一條
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...data, emptyExp()])}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary hover:scale-[1.01] active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
      >
        <Plus className="h-4 w-4" /> 新增工作經歷
      </button>
    </div>
  )
}

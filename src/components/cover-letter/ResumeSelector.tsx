'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResumeOption {
  id: string
  title: string
}

interface ResumeSelectorProps {
  value: string
  onChange: (id: string) => void
}

export function ResumeSelector({ value, onChange }: ResumeSelectorProps) {
  const [resumes, setResumes] = useState<ResumeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/resume')
      .then((r) => r.json())
      .then((json) => {
        setResumes(json.data ?? [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">載入履歷列表失敗</p>
  }

  if (resumes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        尚無履歷，請先建立一份履歷
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {resumes.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onChange(r.id)}
          className={cn(
            'w-full flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none',
            value === r.id
              ? 'border-primary bg-primary/5 scale-[1.01] shadow-sm'
              : 'border-muted hover:border-primary/50 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99]'
          )}
        >
          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{r.title}</span>
        </button>
      ))}
    </div>
  )
}

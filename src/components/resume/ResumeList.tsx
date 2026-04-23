'use client'

import type { Resume } from '@prisma/client'
import { Link } from '@/i18n/navigation'

interface ResumeListProps {
  resumes: Resume[]
}

export function ResumeList({ resumes }: ResumeListProps) {
  if (resumes.length === 0) {
    return <p className="text-muted-foreground text-sm">尚無履歷，立即建立第一份。</p>
  }

  return (
    <ul className="space-y-3">
      {resumes.map((r) => (
        <li key={r.id}>
          <Link
            href={`/resume/${r.id}`}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString('zh-TW')}
              </p>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{r.templateId}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

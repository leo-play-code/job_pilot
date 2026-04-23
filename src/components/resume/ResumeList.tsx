'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface ResumeItem {
  id: string
  title: string
  templateId: string
  createdAt: string
}

interface ResumeListProps {
  resumes: ResumeItem[]
}

export function ResumeList({ resumes }: ResumeListProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  if (resumes.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noResumes')}</p>
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
                {new Date(r.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-US')}
              </p>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{r.templateId}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

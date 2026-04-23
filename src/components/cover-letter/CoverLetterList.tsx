'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface CoverLetterItem {
  id: string
  jobTitle: string
  wordCount: string
  createdAt: string
}

interface CoverLetterListProps {
  coverLetters: CoverLetterItem[]
}

export function CoverLetterList({ coverLetters }: CoverLetterListProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  if (coverLetters.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noCoverLetters')}</p>
  }

  return (
    <ul className="space-y-3">
      {coverLetters.map((cl) => (
        <li key={cl.id}>
          <Link
            href={`/cover-letter/${cl.id}`}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <div>
              <p className="font-medium">{cl.jobTitle}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(cl.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-US')}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{cl.wordCount}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

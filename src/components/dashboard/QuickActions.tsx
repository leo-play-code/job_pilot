'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { FileText, Upload, Mail } from 'lucide-react'

export function QuickActions() {
  const t = useTranslations('dashboard')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
      <Link
        href="/resume/new"
        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
      >
        <FileText className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="font-medium text-sm">{t('newResume')}</p>
          <p className="text-xs text-muted-foreground">{t('newResumeDesc')}</p>
        </div>
      </Link>
      <Link
        href="/resume/upload"
        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
      >
        <Upload className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="font-medium text-sm">{t('uploadResume')}</p>
          <p className="text-xs text-muted-foreground">{t('uploadResumeDesc')}</p>
        </div>
      </Link>
      <Link
        href="/cover-letter/new"
        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
      >
        <Mail className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="font-medium text-sm">{t('newCoverLetter')}</p>
          <p className="text-xs text-muted-foreground">{t('newCoverLetterDesc')}</p>
        </div>
      </Link>
    </div>
  )
}

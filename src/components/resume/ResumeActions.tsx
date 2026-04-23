'use client'

import { Link } from '@/i18n/navigation'
import { Download, Pencil } from 'lucide-react'

interface ResumeActionsProps {
  resumeId: string
}

export function ResumeActions({ resumeId }: ResumeActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/resume/new?edit=${resumeId}`}
        className="flex items-center gap-1.5 px-4 py-2 border rounded-md text-sm hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
      >
        <Pencil className="h-4 w-4" />
        編輯
      </Link>
      <a
        href={`/api/pdf/download/${resumeId}`}
        download
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary outline-none"
      >
        <Download className="h-4 w-4" />
        下載 PDF
      </a>
    </div>
  )
}

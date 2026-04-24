'use client'

import { useTranslations } from 'next-intl'

type DialogTitleKey =
  | 'clearAllResumesTitle'
  | 'clearAllCoverLettersTitle'
  | 'deleteSelectedResumesTitle'
  | 'deleteSelectedCoverLettersTitle'

interface ClearAllDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
  titleKey: DialogTitleKey
}

export function ClearAllDialog({ open, onClose, onConfirm, isPending, titleKey }: ClearAllDialogProps) {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  if (!open) return null

  const isDeleteSelected = titleKey.startsWith('deleteSelected')
  const warningKey = isDeleteSelected ? 'deleteSelectedWarning' : 'clearAllWarning'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-background rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">{t(titleKey)}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t(warningKey)}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
          >
            {tc('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md bg-destructive text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {t('clearAllConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

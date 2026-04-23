'use client'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold mb-2">已達今日上限</h2>
        <p className="text-muted-foreground mb-4">
          免費方案每日 3 次 AI 操作，升級 PRO 方案以無限使用。
        </p>
        {/* TODO: Stripe checkout button (Phase 2) */}
        <button onClick={onClose} className="w-full border rounded-md py-2 text-sm">
          暫時關閉
        </button>
      </div>
    </div>
  )
}

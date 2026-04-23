'use client'

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'AI 生成中...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
      <div className="bg-background rounded-lg p-6 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

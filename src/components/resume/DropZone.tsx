'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useRouter } from '@/i18n/navigation'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { LoadingOverlay } from '@/components/shared/LoadingOverlay'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { cn } from '@/lib/utils'

const MAX_SIZE = 5 * 1024 * 1024

export function DropZone() {
  const router = useRouter()
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return

    setError('')
    setIsParsing(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', 'zh')

    try {
      const res = await fetch('/api/pdf/parse', { method: 'POST', body: formData })

      if (res.status === 429) {
        setShowUpgrade(true)
        return
      }
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? '解析失敗，請確認 PDF 格式')
        return
      }

      const { data } = await res.json()
      sessionStorage.setItem('parsed-resume', JSON.stringify(data.content))
      router.push('/resume/new')
    } catch {
      setError('上傳失敗，請稍後再試')
    } finally {
      setIsParsing(false)
    }
  }, [router])

  const onDropRejected = useCallback((files: FileRejection[]) => {
    const code = files[0]?.errors[0]?.code
    if (code === 'file-too-large') {
      setError('檔案超過 5MB 限制')
    } else if (code === 'file-invalid-type') {
      setError('僅支援 PDF 格式')
    } else {
      setError('檔案無效')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: isParsing,
  })

  return (
    <>
      {isParsing && <LoadingOverlay message="AI 解析 PDF 中，請稍候..." />}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary',
          isParsing && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} aria-label="上傳 PDF 履歷" />

        <div className="flex flex-col items-center gap-4">
          {acceptedFiles.length > 0 ? (
            <>
              <FileText className="h-10 w-10 text-primary" />
              <p className="text-sm font-medium">{acceptedFiles[0].name}</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium mb-1">
                  {isDragActive ? '放開以上傳' : '拖曳 PDF 至此，或點擊選取'}
                </p>
                <p className="text-sm text-muted-foreground">最大 5MB，僅支援 PDF</p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm mt-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </>
  )
}

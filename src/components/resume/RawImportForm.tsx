'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_SIZE = 5 * 1024 * 1024

type UploadState = 'idle' | 'uploading' | 'error'

export function RawImportForm() {
  const t = useTranslations('resume.rawImport')
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  const [state, setState] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setTitle(f.name.replace(/\.pdf$/i, ''))
    setErrorMsg('')
    setState('idle')
  }, [])

  const onDropRejected = useCallback((files: FileRejection[]) => {
    const code = files[0]?.errors[0]?.code
    if (code === 'file-too-large') {
      setErrorMsg('檔案超過 5MB 限制')
    } else if (code === 'file-invalid-type') {
      setErrorMsg('僅支援 PDF 格式')
    } else {
      setErrorMsg('檔案無效')
    }
    setState('error')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: state === 'uploading',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setState('uploading')
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)
    if (title.trim()) formData.append('title', title.trim())
    formData.append('language', language)

    try {
      const res = await fetch('/api/resume/import-raw', { method: 'POST', body: formData })
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        setErrorMsg(json.error ?? '匯入失敗，請稍後再試')
        setState('error')
        return
      }
      router.push('/dashboard')
    } catch {
      setErrorMsg('上傳失敗，請稍後再試')
      setState('error')
    }
  }

  const isUploading = state === 'uploading'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* DropZone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary',
          isUploading && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} aria-label="上傳 PDF 履歷" />
        <div className="flex flex-col items-center gap-3">
          {file ? (
            <>
              <FileText className="h-9 w-9 text-primary" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">點擊或拖曳以更換檔案</p>
            </>
          ) : (
            <>
              <Upload className="h-9 w-9 text-muted-foreground" />
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

      {/* Error */}
      {(state === 'error' || errorMsg) && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Title input */}
      <div className="space-y-1.5">
        <label htmlFor="raw-import-title" className="text-sm font-medium">
          {t('titleLabel')}
        </label>
        <input
          id="raw-import-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t('titleLabel')}
          disabled={isUploading}
          className="w-full px-3 py-2 border rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Language radio */}
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">語言</legend>
        <div className="flex gap-4">
          {(['zh', 'en'] as const).map(lang => (
            <label key={lang} className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input
                type="radio"
                name="raw-import-language"
                value={lang}
                checked={language === lang}
                onChange={() => setLanguage(lang)}
                disabled={isUploading}
                className="accent-primary"
              />
              {lang === 'zh' ? '中文' : 'English'}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || isUploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus-visible:ring-2 focus-visible:ring-primary outline-none"
      >
        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('saveButton')}
      </button>
    </form>
  )
}

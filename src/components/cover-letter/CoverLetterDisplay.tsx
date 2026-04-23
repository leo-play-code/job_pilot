'use client'

import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'

interface CoverLetterDisplayProps {
  content: string
  jobTitle: string
}

export function CoverLetterDisplay({ content, jobTitle }: CoverLetterDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover-letter-${jobTitle.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
          aria-label="複製自薦信"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              已複製！
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              複製
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary outline-none"
          aria-label="下載 .txt 檔"
        >
          <Download className="h-4 w-4" />
          下載 .txt
        </button>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
          {content}
        </pre>
      </div>
    </div>
  )
}

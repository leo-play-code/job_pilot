'use client'

import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResumeIframePreviewProps {
  html: string
  className?: string
}

export function ResumeIframePreview({ html, className }: ResumeIframePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width
        if (containerWidth > 0) {
          setScale(containerWidth / 794)
        }
      }
    })

    observer.observe(container)

    // Set initial scale
    const initialWidth = container.getBoundingClientRect().width
    if (initialWidth > 0) {
      setScale(initialWidth / 794)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn('shadow-xl rounded-sm', className)}
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: `${1123 * scale}px`,
      }}
    >
      {/* Skeleton loading state */}
      {loading && (
        <div
          className="absolute inset-0 bg-white animate-pulse"
          aria-hidden="true"
        >
          <div className="p-8 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-px bg-gray-200 w-full mt-4" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-6" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-4/5" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-6" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-6" />
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-14" />
              <div className="h-6 bg-gray-200 rounded w-18" />
            </div>
          </div>
        </div>
      )}

      <iframe
        width="794"
        height="1123"
        style={{
          transform: `scale(${scale}) translateX(-50%)`,
          transformOrigin: 'top left',
          position: 'absolute',
          left: '50%',
          border: 'none',
          display: 'block',
          opacity: loading ? 0 : 1,
          transition: 'opacity 300ms ease',
        }}
        srcDoc={html}
        sandbox="allow-same-origin"
        title="resume preview"
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}

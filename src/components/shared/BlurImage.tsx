'use client'
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// 8×8px 灰色漸層 shimmer（base64 PNG）
const SHIMMER_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAJElEQVQI12NgYGD4z8BQDwAEhgF/hY2NjQwMDAwMDAwMDEwAASQABgD9BQAAAAASUVORK5CYII='

interface BlurImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  className?: string
  priority?: boolean
}

export function BlurImage({ src, alt, width, height, fill, sizes, className, priority }: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={SHIMMER_DATA_URL}
      onLoad={() => setIsLoaded(true)}
      className={cn(
        'transition-all duration-300 ease-in-out',
        isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-105',
        className
      )}
    />
  )
}

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Mock next/image — render as a plain <img> so RTL can query it
// ---------------------------------------------------------------------------

vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, className, onLoad, fill, width, height, ...rest }: {
    src: string
    alt: string
    className?: string
    onLoad?: () => void
    fill?: boolean
    width?: number
    height?: number
    [key: string]: unknown
  }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={onLoad}
        data-fill={fill ? 'true' : undefined}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        {...rest}
      />
    )
  }),
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { BlurImage } from '@/components/shared/BlurImage'

// ---------------------------------------------------------------------------
// [perf] Unit — BlurImage loaded state
// ---------------------------------------------------------------------------

describe('BlurImage', () => {
  it('renders with blur-xl class initially (not loaded)', () => {
    const { container } = render(
      <BlurImage src="/test.jpg" alt="test" width={100} height={100} />,
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.className).toContain('blur-xl')
  })

  it('switches to blur-0 scale-100 after onLoad fires', () => {
    const { container } = render(
      <BlurImage src="/test.jpg" alt="test" width={100} height={100} />,
    )

    const img = container.querySelector('img')!

    // Before load: has blur-xl
    expect(img.className).toContain('blur-xl')

    // Simulate the image finishing loading
    fireEvent.load(img)

    // After load: blur-0 and scale-100 must be present, blur-xl must be gone
    expect(img.className).not.toContain('blur-xl')
    expect(img.className).toContain('blur-0')
    expect(img.className).toContain('scale-100')
  })

  it('renders in fill mode without throwing width/height conflict', () => {
    // fill mode: width/height must not be passed to <img> at the same time as fill
    expect(() => {
      const { container } = render(
        <BlurImage src="/test.jpg" alt="fill test" fill />,
      )
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
    }).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// [perf] Regression — Supabase image hostname allowed in next.config.ts
// ---------------------------------------------------------------------------

describe('next.config.ts remotePatterns', () => {
  it('contains *.supabase.co hostname entry', () => {
    const configPath = path.resolve(__dirname, '../../next.config.ts')
    const source = fs.readFileSync(configPath, 'utf-8')
    expect(source).toContain('*.supabase.co')
  })

  it('contains *.supabase.in hostname entry', () => {
    const configPath = path.resolve(__dirname, '../../next.config.ts')
    const source = fs.readFileSync(configPath, 'utf-8')
    expect(source).toContain('*.supabase.in')
  })
})

// ---------------------------------------------------------------------------
// [perf] Regression — Admin templates page uses BlurImage, not next/image directly
// ---------------------------------------------------------------------------

describe('Admin templates page source', () => {
  const pagePath = path.resolve(
    __dirname,
    '../app/[locale]/admin/templates/page.tsx',
  )

  it('imports BlurImage component', () => {
    const source = fs.readFileSync(pagePath, 'utf-8')
    expect(source).toContain('BlurImage')
  })

  it('does not import Image directly from next/image', () => {
    const source = fs.readFileSync(pagePath, 'utf-8')
    // Accept either no import at all, or only type imports from next/image
    // The page must NOT do: import Image from 'next/image'
    const hasDirectImageImport = /import\s+Image\s+from\s+['"]next\/image['"]/.test(source)
    expect(hasDirectImageImport).toBe(false)
  })
})

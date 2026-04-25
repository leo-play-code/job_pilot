import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mocks — must be hoisted before component import
// ---------------------------------------------------------------------------

vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, className, width, height, fill, ...rest }: {
    src: string
    alt: string
    className?: string
    width?: number
    height?: number
    fill?: boolean
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      src={src}
      alt={alt}
      className={className}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      data-fill={fill ? 'true' : undefined}
      {...rest}
    />
  )),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('lucide-react', () => ({
  Download: () => <span data-testid="icon-download" />,
  Loader2: ({ className }: { className?: string }) => (
    <span data-testid="icon-loader2" className={className} />
  ),
  Pencil: () => <span data-testid="icon-pencil" />,
  Trash2: () => <span data-testid="icon-trash2" />,
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { ResumeActions } from '@/components/resume/ResumeActions'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchOk(blob = new Blob(['%PDF'], { type: 'application/pdf' })) {
  return vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(blob),
  })
}

function makeFetchFail() {
  return vi.fn().mockResolvedValue({ ok: false })
}

// ---------------------------------------------------------------------------
// [ux-feedback] Regression — PDF 下載 loading state
// ---------------------------------------------------------------------------

describe('ResumeActions — PDF download loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Stub URL helpers used in handleDownloadPdf
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('初始狀態：下載 PDF 按鈕存在且不 disabled', () => {
    vi.stubGlobal('fetch', makeFetchOk())

    const { getAllByRole } = render(<ResumeActions resumeId="resume-1" />)
    // The download PDF button is the first <button> (edit is a link)
    const buttons = getAllByRole('button')
    // Find the download button by checking it is not disabled initially
    const downloadBtn = buttons.find(
      (b) => !(b as HTMLButtonElement).disabled && b.querySelector('[data-testid="icon-download"]'),
    )
    expect(downloadBtn).toBeDefined()
    expect(downloadBtn).not.toBeDisabled()
  })

  it('點擊後：按鈕立即進入 disabled 狀態（fetch 尚未 resolve）', async () => {
    // fetch never resolves during this test assertion window
    let resolveFetch!: (v: unknown) => void
    const pendingFetch = new Promise((resolve) => { resolveFetch = resolve })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingFetch))

    const { getAllByRole } = render(<ResumeActions resumeId="resume-1" />)
    const downloadBtn = getAllByRole('button').find(
      (b) => b.querySelector('[data-testid="icon-download"]'),
    )!

    expect(downloadBtn).not.toBeDisabled()

    fireEvent.click(downloadBtn)

    // After click, before fetch resolves → button must be disabled
    await waitFor(() => {
      expect(downloadBtn).toBeDisabled()
    })

    // Cleanup: resolve the pending fetch so no dangling promises
    resolveFetch({ ok: false })
  })

  it('fetch 成功 resolve 後：按鈕恢復 not-disabled', async () => {
    // Spy on document.createElement so the anchor click does not navigate
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {})
      }
      return el
    })

    vi.stubGlobal('fetch', makeFetchOk())

    const { getAllByRole } = render(<ResumeActions resumeId="resume-1" />)
    const downloadBtn = getAllByRole('button').find(
      (b) => b.querySelector('[data-testid="icon-download"]'),
    )!

    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(downloadBtn).not.toBeDisabled()
    })

    vi.restoreAllMocks()
  })
})

// ---------------------------------------------------------------------------
// [ux-feedback] Regression — PDF 下載錯誤 toast
// ---------------------------------------------------------------------------

describe('ResumeActions — PDF download error toast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('fetch 回傳 500 時，toast.error 應被呼叫一次', async () => {
    vi.stubGlobal('fetch', makeFetchFail())

    const { getAllByRole } = render(<ResumeActions resumeId="resume-err" />)
    const downloadBtn = getAllByRole('button').find(
      (b) => b.querySelector('[data-testid="icon-download"]'),
    )!

    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1)
    })
  })
})

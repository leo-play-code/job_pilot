import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    coverLetter: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    template: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GET as getResumes } from '@/app/api/resume/route'
import { GET as getCoverLetters } from '@/app/api/cover-letter/route'
import { GET as getTemplates } from '@/app/api/templates/route'
import { Pagination } from '@/components/shared/Pagination'

// ---------------------------------------------------------------------------
// [pagination] Unit — Pagination 元件 Smart Ellipsis
// ---------------------------------------------------------------------------

describe('Pagination component — Smart Ellipsis', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when totalPages === 0', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} onPageChange={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows pages 1-7 without ellipsis when totalPages <= 7', () => {
    const { getAllByRole } = render(
      <Pagination currentPage={3} totalPages={5} onPageChange={() => {}} />,
    )
    const buttons = getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label')?.startsWith('Page'),
    )
    expect(buttons).toHaveLength(5)
    expect(buttons.map((b) => b.textContent)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('currentPage=5, totalPages=10 → [1, ..., 4, 5, 6, ..., 10]', () => {
    const { getAllByRole, container } = render(
      <Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />,
    )
    const pageButtons = getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label')?.startsWith('Page'),
    )
    const pageNums = pageButtons.map((b) => Number(b.textContent))
    expect(pageNums).toContain(1)
    expect(pageNums).toContain(4)
    expect(pageNums).toContain(5)
    expect(pageNums).toContain(6)
    expect(pageNums).toContain(10)
    // ellipsis present
    expect(container.textContent).toContain('…')
  })

  it('currentPage=1, totalPages=10 → shows 1 and 10, ellipsis in between', () => {
    const { getAllByRole, container } = render(
      <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />,
    )
    const pageButtons = getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label')?.startsWith('Page'),
    )
    const pageNums = pageButtons.map((b) => Number(b.textContent))
    expect(pageNums).toContain(1)
    expect(pageNums).toContain(10)
    expect(container.textContent).toContain('…')
    // page 1 is current
    const page1 = pageButtons.find((b) => b.textContent === '1')
    expect(page1?.getAttribute('aria-current')).toBe('page')
  })

  it('currentPage=10, totalPages=10 → shows 1 and 10, ellipsis in between', () => {
    const { getAllByRole, container } = render(
      <Pagination currentPage={10} totalPages={10} onPageChange={() => {}} />,
    )
    const pageButtons = getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label')?.startsWith('Page'),
    )
    const pageNums = pageButtons.map((b) => Number(b.textContent))
    expect(pageNums).toContain(1)
    expect(pageNums).toContain(10)
    expect(container.textContent).toContain('…')
    const page10 = pageButtons.find((b) => b.textContent === '10')
    expect(page10?.getAttribute('aria-current')).toBe('page')
  })
})

// ---------------------------------------------------------------------------
// [pagination] Unit — Pagination 點擊頁碼
// ---------------------------------------------------------------------------

describe('Pagination component — click behaviour', () => {
  it('onPageChange(3) called when clicking page 3', () => {
    const onPageChange = vi.fn()
    const { getAllByRole } = render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    )
    const page3 = getAllByRole('button').find((b) => b.getAttribute('aria-label') === 'Page 3')
    fireEvent.click(page3!)
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('prev button disabled on page 1', () => {
    const { getByLabelText } = render(
      <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />,
    )
    expect(getByLabelText('Previous page')).toBeDisabled()
  })

  it('next button disabled on last page', () => {
    const { getByLabelText } = render(
      <Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />,
    )
    expect(getByLabelText('Next page')).toBeDisabled()
  })

  it('prev button calls onPageChange(currentPage - 1)', () => {
    const onPageChange = vi.fn()
    const { getByLabelText } = render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    )
    fireEvent.click(getByLabelText('Previous page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('next button calls onPageChange(currentPage + 1)', () => {
    const onPageChange = vi.fn()
    const { getByLabelText } = render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    )
    fireEvent.click(getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })
})

// ---------------------------------------------------------------------------
// Helpers for API tests
// ---------------------------------------------------------------------------

const USER_SESSION = { user: { id: 'user-1' } }

function makeResume(i: number) {
  return { id: `res-${i}`, title: `Resume ${i}`, createdAt: new Date() }
}

function makeCoverLetter(i: number) {
  return { id: `cl-${i}`, jobTitle: `Job ${i}`, createdAt: new Date() }
}

function makeTemplate(i: number) {
  return { id: `tpl-${i}`, name: `Template ${i}`, status: 'active' }
}

// ---------------------------------------------------------------------------
// [pagination] Integration — GET /api/resume?page=1&limit=6
// ---------------------------------------------------------------------------

describe('GET /api/resume — pagination', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated resumes with total and totalPages', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never)
    vi.mocked(prisma.resume.findMany).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => makeResume(i + 1)) as never,
    )
    vi.mocked(prisma.resume.count).mockResolvedValue(8)

    const req = new Request('http://localhost/api/resume?page=1&limit=6')
    const res = await getResumes(req as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.resumes).toHaveLength(6)
    expect(body.data.total).toBe(8)
    expect(body.data.totalPages).toBe(2)
    expect(body.data.page).toBe(1)
  })

  it('page=2 returns remaining 2 resumes when total is 8', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never)
    vi.mocked(prisma.resume.findMany).mockResolvedValue(
      Array.from({ length: 2 }, (_, i) => makeResume(i + 7)) as never,
    )
    vi.mocked(prisma.resume.count).mockResolvedValue(8)

    const req = new Request('http://localhost/api/resume?page=2&limit=6')
    const res = await getResumes(req as never)
    const body = await res.json()

    expect(body.data.resumes).toHaveLength(2)
    expect(body.data.page).toBe(2)
    expect(body.data.totalPages).toBe(2)
    expect(prisma.resume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 6, take: 6 }),
    )
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const req = new Request('http://localhost/api/resume?page=1&limit=6')
    const res = await getResumes(req as never)
    expect(res.status).toBe(401)
  })

  it('no pagination params → returns flat array (backward compat)', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never)
    vi.mocked(prisma.resume.findMany).mockResolvedValue(
      Array.from({ length: 3 }, (_, i) => makeResume(i + 1)) as never,
    )

    const req = new Request('http://localhost/api/resume')
    const res = await getResumes(req as never)
    const body = await res.json()

    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// [pagination] Integration — GET /api/cover-letter?page=1&limit=6
// ---------------------------------------------------------------------------

describe('GET /api/cover-letter — pagination', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated cover letters', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never)
    vi.mocked(prisma.coverLetter.findMany).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => makeCoverLetter(i + 1)) as never,
    )
    vi.mocked(prisma.coverLetter.count).mockResolvedValue(7)

    const req = new Request('http://localhost/api/cover-letter?page=1&limit=6')
    const res = await getCoverLetters(req as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.coverLetters).toHaveLength(6)
    expect(body.data.total).toBe(7)
    expect(body.data.totalPages).toBe(2)
  })

  it('page=2 → skip=6, take=6', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never)
    vi.mocked(prisma.coverLetter.findMany).mockResolvedValue(
      [makeCoverLetter(7)] as never,
    )
    vi.mocked(prisma.coverLetter.count).mockResolvedValue(7)

    const req = new Request('http://localhost/api/cover-letter?page=2&limit=6')
    await getCoverLetters(req as never)

    expect(prisma.coverLetter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 6, take: 6 }),
    )
  })
})

// ---------------------------------------------------------------------------
// [pagination] Integration — GET /api/templates?page=1&limit=6
// ---------------------------------------------------------------------------

describe('GET /api/templates — pagination', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated active templates', async () => {
    vi.mocked(prisma.template.findMany).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => makeTemplate(i + 1)) as never,
    )
    vi.mocked(prisma.template.count).mockResolvedValue(8)

    const req = new Request('http://localhost/api/templates?page=1&limit=6')
    const res = await getTemplates(req as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.templates).toHaveLength(6)
    expect(body.data.total).toBe(8)
    expect(body.data.totalPages).toBe(2)
    expect(body.data.page).toBe(1)
  })

  it('only queries status=active templates', async () => {
    vi.mocked(prisma.template.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.template.count).mockResolvedValue(0)

    const req = new Request('http://localhost/api/templates?page=1&limit=6')
    await getTemplates(req as never)

    expect(prisma.template.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'active' } }),
    )
  })

  it('no params → returns flat array (backward compat)', async () => {
    vi.mocked(prisma.template.findMany).mockResolvedValue(
      Array.from({ length: 3 }, (_, i) => makeTemplate(i + 1)) as never,
    )

    const req = new Request('http://localhost/api/templates')
    const res = await getTemplates(req as never)
    const body = await res.json()

    expect(Array.isArray(body.data)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// [pagination] Regression — Dashboard ResumeList 換頁
// ---------------------------------------------------------------------------

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: Record<string, unknown>) => {
    if (key === 'selectedCount') return `Selected ${opts?.n}`
    return key
  },
  useLocale: () => 'zh',
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('@/components/dashboard/ClearAllDialog', () => ({
  ClearAllDialog: () => null,
}))

import { ResumeList } from '@/components/resume/ResumeList'

function makeResumeItem(i: number) {
  return {
    id: `r-${i}`,
    title: `Resume ${i}`,
    templateId: 'modern',
    createdAt: new Date().toISOString(),
    rawPdfUrl: null,
  }
}

describe('ResumeList — pagination', () => {
  it('shows only 6 items on first page when 9 resumes provided', () => {
    const resumes = Array.from({ length: 9 }, (_, i) => makeResumeItem(i + 1))
    const { getAllByRole, queryByText } = render(<ResumeList resumes={resumes} />)
    // Only 6 visible links (not 9)
    const links = getAllByRole('link')
    expect(links).toHaveLength(6)
    // Page 1 item visible, page 2 item not
    expect(queryByText('Resume 1')).toBeTruthy()
    expect(queryByText('Resume 7')).toBeNull()
  })

  it('Pagination component is rendered when totalPages > 1', () => {
    const resumes = Array.from({ length: 9 }, (_, i) => makeResumeItem(i + 1))
    const { getByLabelText } = render(<ResumeList resumes={resumes} />)
    expect(getByLabelText('Next page')).toBeTruthy()
  })

  it('clicking page 2 shows items 7-9', () => {
    const resumes = Array.from({ length: 9 }, (_, i) => makeResumeItem(i + 1))
    const { getByLabelText, queryByText } = render(<ResumeList resumes={resumes} />)
    fireEvent.click(getByLabelText('Next page'))
    expect(queryByText('Resume 7')).toBeTruthy()
    expect(queryByText('Resume 1')).toBeNull()
  })

  it('Edit Mode hides Pagination and shows all items', () => {
    const resumes = Array.from({ length: 9 }, (_, i) => makeResumeItem(i + 1))
    const { getByLabelText, queryByLabelText, getAllByRole } = render(
      <ResumeList resumes={resumes} />,
    )
    // Enter edit mode
    fireEvent.click(getByLabelText('editMode'))
    // Pagination prev/next not in DOM
    expect(queryByLabelText('Previous page')).toBeNull()
    expect(queryByLabelText('Next page')).toBeNull()
    // All 9 items visible (in edit mode, rendered as divs)
    const items = getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label') === 'select' || b.getAttribute('aria-label') === 'deselect',
    )
    expect(items).toHaveLength(9)
  })

  it('Pagination not rendered when <= 6 resumes', () => {
    const resumes = Array.from({ length: 4 }, (_, i) => makeResumeItem(i + 1))
    const { queryByLabelText } = render(<ResumeList resumes={resumes} />)
    expect(queryByLabelText('Previous page')).toBeNull()
    expect(queryByLabelText('Next page')).toBeNull()
  })
})

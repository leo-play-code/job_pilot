import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      deleteMany: vi.fn(),
    },
    coverLetter: {
      deleteMany: vi.fn(),
    },
  },
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { DELETE as deleteAllResumes } from '@/app/api/resume/route'
import { DELETE as deleteAllCoverLetters } from '@/app/api/cover-letter/route'

describe('DELETE /api/resume (clear all)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await deleteAllResumes()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('deletes all resumes for the current user and returns deletedCount', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.resume.deleteMany).mockResolvedValue({ count: 3 })

    const res = await deleteAllResumes()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.deletedCount).toBe(3)
    expect(prisma.resume.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    })
  })

  it('only deletes resumes belonging to the current user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-42' } } as never)
    vi.mocked(prisma.resume.deleteMany).mockResolvedValue({ count: 1 })

    await deleteAllResumes()
    expect(prisma.resume.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-42' },
    })
  })
})

describe('DELETE /api/cover-letter (clear all)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await deleteAllCoverLetters()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('deletes all cover letters for the current user and returns deletedCount', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(prisma.coverLetter.deleteMany).mockResolvedValue({ count: 2 })

    const res = await deleteAllCoverLetters()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.deletedCount).toBe(2)
    expect(prisma.coverLetter.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    })
  })

  it('only deletes cover letters belonging to the current user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-99' } } as never)
    vi.mocked(prisma.coverLetter.deleteMany).mockResolvedValue({ count: 0 })

    await deleteAllCoverLetters()
    expect(prisma.coverLetter.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-99' },
    })
  })
})

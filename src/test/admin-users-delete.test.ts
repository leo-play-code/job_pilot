import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    resume: {
      deleteMany: vi.fn(),
    },
    coverLetter: {
      deleteMany: vi.fn(),
    },
    usageLog: {
      deleteMany: vi.fn(),
    },
    account: {
      deleteMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { DELETE as deleteUser } from '@/app/api/admin/users/[id]/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

process.env.ADMIN_EMAIL = 'admin@test.com'

const ADMIN_SESSION = { user: { email: 'admin@test.com' } }
const NON_ADMIN_SESSION = { user: { email: 'other@test.com' } }

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const mockTarget = { id: 'user-1', email: 'victim@test.com' }

// ---------------------------------------------------------------------------
// [admin-users] Integration — DELETE /api/admin/users/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/admin/users/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@test.com'
    // Default: transaction succeeds
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never)
  })

  it('returns 403 when not admin', async () => {
    vi.mocked(auth).mockResolvedValue(NON_ADMIN_SESSION as never)

    const req = new Request('http://localhost/api/admin/users/user-1', { method: 'DELETE' })
    const res = await deleteUser(req, makeParams('user-1'))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns 404 when user does not exist', async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const req = new Request('http://localhost/api/admin/users/nonexistent', { method: 'DELETE' })
    const res = await deleteUser(req, makeParams('nonexistent'))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('User not found')
  })

  it('returns 400 when trying to delete own account', async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'admin-id',
      email: 'admin@test.com',
    } as never)

    const req = new Request('http://localhost/api/admin/users/admin-id', { method: 'DELETE' })
    const res = await deleteUser(req, makeParams('admin-id'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Cannot delete your own account')
  })

  it('returns 200 and triggers $transaction with all cascade deletes', async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockTarget as never)
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never)

    const req = new Request('http://localhost/api/admin/users/user-1', { method: 'DELETE' })
    const res = await deleteUser(req, makeParams('user-1'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.ok).toBe(true)
    expect(body.data.deletedEmail).toBe('victim@test.com')
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })

  it('$transaction includes deleteMany for all related tables', async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockTarget as never)

    let capturedOps: unknown[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.$transaction).mockImplementation(async (ops: any) => {
      capturedOps = ops
    })

    // Setup individual mocks to not throw
    vi.mocked(prisma.usageLog.deleteMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(prisma.coverLetter.deleteMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(prisma.resume.deleteMany).mockResolvedValue({ count: 2 } as never)
    vi.mocked(prisma.account.deleteMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(prisma.user.delete).mockResolvedValue(mockTarget as never)

    const req = new Request('http://localhost/api/admin/users/user-1', { method: 'DELETE' })
    await deleteUser(req, makeParams('user-1'))

    // Transaction should contain 6 operations
    expect(capturedOps).toHaveLength(6)
  })
})

---
name: backend-dev
description: >
  Professional backend API development skill. Use this skill whenever the user asks to:
  build REST or tRPC API routes; implement authentication/authorization; write server-side
  business logic; integrate with third-party services; handle file uploads; set up middleware;
  write backend unit or integration tests; or receives a "backend task" handed off from a
  database or frontend developer. Also triggers for keywords like "後端", "API", "endpoint",
  "route handler", "auth", "middleware", "server", "tRPC", "REST". Always read this skill
  before writing any backend or API code.
---

# Backend Development Skill

You are a senior backend engineer. Read this entire document before writing any API code.

---

## Tech Stack (Default)

| Layer | Choice |
|---|---|
| Framework | **Next.js Route Handlers** (App Router) or **tRPC** |
| ORM | **Prisma** (read database-dev skill for schema) |
| Auth | **NextAuth.js v5** |
| Validation | **Zod** |
| Error handling | Custom `ApiError` class |
| Testing | **Vitest** |

---

## API Design Principles

### 1. REST Endpoint Naming

```
GET    /api/users          → list users
POST   /api/users          → create user
GET    /api/users/[id]     → get one user
PATCH  /api/users/[id]     → partial update
DELETE /api/users/[id]     → delete user

GET    /api/users/[id]/posts → nested resource
```

Always use nouns, never verbs in URLs. Use PATCH for partial updates, PUT for full replacement.

### 2. Standard Response Format

Every endpoint returns this shape:

```typescript
// Success
{ data: T, meta?: { total: number, page: number, pageSize: number } }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

```typescript
// lib/api-response.ts
export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta && { meta }) })
}

export function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status })
}
```

### 3. Input Validation with Zod

Always validate before hitting the database:

```typescript
// lib/validations/user.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
```

```typescript
// app/api/users/route.ts
import { createUserSchema } from '@/lib/validations/user'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', 'Invalid input', 422)
  }

  const user = await prisma.user.create({ data: parsed.data })
  return successResponse(user, undefined)
}
```

### 4. Authentication Pattern

```typescript
// lib/auth.ts — check session in every protected route
import { auth } from '@/auth'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
  }
  return session.user
}

// Usage in route handler
export async function GET(request: NextRequest) {
  const user = await requireAuth()
  // proceed with authenticated user
}
```

### 5. Error Handling

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message)
  }
}

// Wrap route handlers
export function withErrorHandler(
  handler: (req: NextRequest, ctx: unknown) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: unknown) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.code, error.message, error.status)
      }
      console.error('Unhandled error:', error)
      return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500)
    }
  }
}

// Usage
export const GET = withErrorHandler(async (request) => {
  // your handler — throw ApiError freely
})
```

---

## Route Handler Template

```typescript
// app/api/[resource]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { withErrorHandler, ApiError } from '@/lib/api-error'
import { successResponse, errorResponse } from '@/lib/api-response'
import { createResourceSchema } from '@/lib/validations/resource'

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requireAuth()

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = 20

  const [items, total] = await prisma.$transaction([
    prisma.resource.findMany({
      where: { deletedAt: null },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.resource.count({ where: { deletedAt: null } }),
  ])

  return successResponse(items, { total, page, pageSize })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const currentUser = await requireAuth()
  const body = await request.json()
  const parsed = createResourceSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', 'Invalid input', 422)
  }

  const item = await prisma.resource.create({
    data: { ...parsed.data, createdById: currentUser.id },
  })

  return successResponse(item)
})
```

---

## Pagination Convention

```typescript
// Always paginate list endpoints
interface PaginationParams {
  page: number    // 1-based
  pageSize: number // max 100
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
```

---

## Backend Testing Pattern

```typescript
// __tests__/api/users.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/users/route'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({ prisma: { user: { findMany: vi.fn() } } }))
vi.mock('@/lib/auth', () => ({ requireAuth: vi.fn().mockResolvedValue({ id: 'user-1' }) }))

describe('GET /api/users', () => {
  it('returns paginated users', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: '1', name: 'Alice' }])

    const request = new Request('http://localhost/api/users?page=1')
    const response = await GET(request as any)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
  })
})
```

---

## Backend → Frontend Handoff Format

When completing a backend task, always output:

```markdown
## Backend Handoff → Frontend

### New/Changed Endpoints

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | /api/users | Yes | List users, supports ?page= |
| POST | /api/users | Yes (ADMIN) | Create user |

### Request/Response Examples

**POST /api/users**
Request body:
```json
{ "email": "user@example.com", "name": "Alice", "role": "USER" }
```
Success (201):
```json
{ "data": { "id": "clxxx", "email": "...", "name": "...", "createdAt": "..." } }
```
Error (422):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input" } }
```

### Notes for Frontend
- All list endpoints paginate with `?page=N` (default page size: 20)
- Auth errors return 401 — redirect to /login
```

---

## Reference Files

- `references/auth-patterns.md` — NextAuth.js setup and session patterns
- `references/trpc-patterns.md` — tRPC alternative to REST route handlers
- `references/testing.md` — Backend integration test patterns

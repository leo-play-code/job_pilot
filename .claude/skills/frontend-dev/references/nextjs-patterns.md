# Next.js App Router Patterns

## Route Structure

```
app/
├── layout.tsx          # Root layout (html, body)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI for this segment
├── error.tsx           # Error boundary for this segment
├── not-found.tsx       # 404 page
└── dashboard/
    ├── layout.tsx      # Dashboard layout (sidebar etc.)
    ├── page.tsx        # /dashboard
    └── users/
        ├── page.tsx    # /dashboard/users
        └── [id]/
            └── page.tsx  # /dashboard/users/[id]
```

## Server vs Client Components

```tsx
// Server Component (default) — can fetch data, no interactivity
// app/users/page.tsx
export default async function UsersPage() {
  const users = await fetchUsers() // direct DB or API call
  return <UserList users={users} />
}

// Client Component — for interactivity, hooks, browser APIs
'use client'
import { useState } from 'react'

export function UserCard({ user }: { user: User }) {
  const [expanded, setExpanded] = useState(false)
  // ...
}
```

Rule: Push `'use client'` as far down the tree as possible.

## Route Handlers (API Routes)

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const users = await db.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}

// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await db.user.findUnique({ where: { id: params.id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}
```

## Metadata

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | App Name', default: 'App Name' },
  description: 'App description',
}

// app/users/page.tsx
export const metadata: Metadata = {
  title: 'Users', // becomes "Users | App Name"
}
```

## Loading & Error UI

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}

// app/dashboard/error.tsx
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Environment Variables

```bash
# .env.local
DATABASE_URL="..."
NEXT_PUBLIC_API_URL="..."  # NEXT_PUBLIC_ prefix = exposed to browser
```

```tsx
// Server only
process.env.DATABASE_URL

// Client accessible
process.env.NEXT_PUBLIC_API_URL
```

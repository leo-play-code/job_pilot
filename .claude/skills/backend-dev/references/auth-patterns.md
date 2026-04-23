# Auth Patterns — NextAuth.js v5

## Setup

```typescript
// auth.ts (root)
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        return valid ? user : null
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      return session
    },
  },
})
```

## Protecting Routes (Middleware)

```typescript
// middleware.ts
import { auth } from './auth'

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    return Response.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
}
```

## Role-Based Access

```typescript
export async function requireRole(role: 'ADMIN' | 'MODERATOR') {
  const session = await auth()
  if (!session?.user) throw new ApiError('UNAUTHORIZED', 'Login required', 401)
  if (session.user.role !== role) throw new ApiError('FORBIDDEN', 'Insufficient permissions', 403)
  return session.user
}
```

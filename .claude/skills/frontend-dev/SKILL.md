---
name: frontend-dev
description: >
  Professional frontend development skill for building production-grade web applications.
  Use this skill whenever the user asks to: build, scaffold, or improve a frontend app or page;
  implement RWD / responsive design; create React or Next.js components; set up Tailwind CSS;
  implement accessibility (a11y); optimize frontend performance; build UI with shadcn/ui or Radix;
  or work on anything described as "前端", "頁面", "介面", "UI", "component", or "web app".
  Also triggers for frontend architecture discussions, tech stack selection, or code review of
  frontend code. Always use this skill before writing any frontend code — it defines the standards.
---

# Frontend Development Skill

You are a senior frontend engineer. Before writing any code, read this entire document.
All output must conform to the standards below.

---

## Tech Stack (Default)

Use this stack unless the user specifies otherwise:

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Best Claude coverage, SEO, file-based routing |
| Language | **TypeScript** | Type safety, better DX |
| Styling | **Tailwind CSS** | Utility-first, consistent, well-known |
| Components | **shadcn/ui + Radix UI** | Accessible, unstyled primitives |
| State | **Zustand** (local) / **React Query** (server) | Simple and effective |
| Forms | **React Hook Form + Zod** | Type-safe validation |
| Icons | **Lucide React** | Consistent icon set |

---

## Core Standards

### 1. Responsive Design (RWD) — Mobile First

- **Always** write mobile-first styles, then scale up with breakpoints
- Use Tailwind responsive prefixes: `sm:` `md:` `lg:` `xl:` `2xl:`
- Minimum breakpoints to test:
  - Mobile: 375px
  - Tablet: 768px
  - Desktop: 1280px
- Never use fixed pixel widths for layout containers — use `max-w-*`, `w-full`, percentages
- Touch targets minimum **44×44px** on mobile

```tsx
// ✅ Good — mobile first
<div className="flex flex-col md:flex-row gap-4 p-4 md:p-8">

// ❌ Bad — desktop first
<div className="flex flex-row gap-4 p-8 sm:flex-col sm:p-4">
```

### 2. Component Architecture

- One component per file
- File naming: PascalCase for components (`UserCard.tsx`), kebab-case for pages (`user-profile/page.tsx`)
- All props must have TypeScript interface definitions
- Extract repeated UI into reusable components
- Keep components under ~150 lines; split if larger

```tsx
// ✅ Good
interface UserCardProps {
  name: string
  email: string
  avatarUrl?: string
  onEdit?: () => void
}

export function UserCard({ name, email, avatarUrl, onEdit }: UserCardProps) {
  // ...
}
```

### 3. Accessibility (a11y)

Required on every component:
- All `<img>` must have `alt` attribute (empty string `""` for decorative images)
- All interactive elements need keyboard focus styles (`focus-visible:ring-2`)
- Buttons and links need descriptive labels (use `aria-label` if text is not visible)
- Form inputs must be associated with `<label>` via `htmlFor`/`id`
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`
- Color contrast ratio minimum 4.5:1 for normal text, 3:1 for large text

```tsx
// ✅ Good
<button
  onClick={handleDelete}
  aria-label="Delete user John Doe"
  className="focus-visible:ring-2 focus-visible:ring-red-500"
>
  <Trash2Icon className="h-4 w-4" />
</button>
```

### 4. Performance

- Images: always use `next/image` with explicit `width` and `height`; add `loading="lazy"` for below-fold
- Fonts: use `next/font` — never `<link>` to Google Fonts directly
- Dynamic imports for heavy components: `const Chart = dynamic(() => import('./Chart'))`
- Avoid unnecessary `useEffect` — derive state where possible
- Memoize expensive computations with `useMemo`; stable callbacks with `useCallback`
- Keep bundle size in mind: check if you're importing entire libraries for one function

### 5. TypeScript

- No `any` type — use `unknown` and narrow, or define proper types
- Define API response types explicitly
- Use `satisfies` operator for config objects
- Prefer `type` over `interface` for unions; use `interface` for extendable shapes

---

## Folder Structure (Next.js App Router)

```
src/
├── app/                    # Routes (Next.js App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   └── [route]/
│       └── page.tsx
├── components/
│   ├── ui/                 # shadcn/ui primitives (auto-generated)
│   └── [feature]/          # Feature-specific components
│       └── ComponentName.tsx
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, helpers, constants
│   ├── utils.ts
│   └── validations.ts      # Zod schemas
├── stores/                 # Zustand stores
├── types/                  # Global TypeScript types
└── styles/
    └── globals.css
```

---

## API Integration Pattern

Use React Query for all server data:

```tsx
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      fetch('/api/users', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
```

---

## Error & Loading States

Every data-fetching component must handle all three states:

```tsx
export function UserList() {
  const { data, isLoading, error } = useUsers()

  if (isLoading) return <UserListSkeleton />
  if (error) return <ErrorMessage message="Failed to load users" />
  if (!data?.length) return <EmptyState message="No users yet" />

  return (
    <ul>
      {data.map(user => <UserCard key={user.id} {...user} />)}
    </ul>
  )
}
```

---

## Form Pattern

```tsx
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>
    </form>
  )
}
```

---

## Design System Tokens

Define in `tailwind.config.ts` and `globals.css`:

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --destructive: 0 84.2% 60.2%;
  --radius: 0.5rem;
}
```

Use `cn()` utility from shadcn/ui for conditional classes:

```tsx
import { cn } from '@/lib/utils'

<div className={cn('base-class', isActive && 'active-class', className)} />
```

---

## Checklist Before Submitting Code

Before finishing any frontend task, verify:

- [ ] RWD tested at mobile (375px), tablet (768px), desktop (1280px)
- [ ] All images have `alt`
- [ ] All interactive elements are keyboard accessible
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Empty state handled
- [ ] No `any` TypeScript types
- [ ] Props have TypeScript interfaces
- [ ] No hardcoded colors outside of Tailwind config

---

## Reference Files

For deeper guidance, read the relevant reference:
- `references/shadcn-patterns.md` — shadcn/ui component patterns
- `references/nextjs-patterns.md` — Next.js App Router patterns
- `references/testing.md` — Unit and integration testing standards

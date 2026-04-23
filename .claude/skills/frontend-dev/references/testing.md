# Frontend Testing Standards

## Stack

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

## Unit Test — Pure Functions

```ts
// lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './utils'

describe('formatCurrency', () => {
  it('formats positive numbers', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00')
  })
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
})
```

## Component Test

```tsx
// components/UserCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserCard } from './UserCard'

describe('UserCard', () => {
  const mockUser = { id: '1', name: 'Alice', email: 'alice@example.com' }

  it('renders user info', () => {
    render(<UserCard user={mockUser} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn()
    render(<UserCard user={mockUser} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledOnce()
  })
})
```

## Hook Test

```tsx
// hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

it('increments count', () => {
  const { result } = renderHook(() => useCounter())
  act(() => result.current.increment())
  expect(result.current.count).toBe(1)
})
```

## Mocking API Calls

```tsx
import { vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  fetchUsers: vi.fn().mockResolvedValue([
    { id: '1', name: 'Alice' }
  ])
}))
```

## What to Test (Priority Order)

1. **Business logic** in `lib/` — pure functions, validations, transforms
2. **Form validation** — Zod schemas, error messages
3. **Critical user flows** — login, checkout, form submit
4. **Component rendering** — key content appears, error/loading states
5. **Skip** — styling, exact layout, third-party component internals

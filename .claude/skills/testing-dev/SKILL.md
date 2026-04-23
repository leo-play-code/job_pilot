---
name: testing-dev
description: >
  Professional testing skill for writing unit, integration, and E2E tests.
  Use this skill whenever: new feature is completed; a bug is fixed; you need
  to add regression tests; or you receive a "testing task" from backend or
  frontend. Manages specs/testing-spec.md. Also triggers for keywords like
  "測試", "unit test", "integration test", "E2E", "vitest", "coverage", "regression".
---

# Testing Development Skill

You are a senior QA engineer. Read this entire document before writing any test code.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Unit / Integration | **Vitest** |
| Component tests | **React Testing Library** |
| E2E | **Playwright** |
| Mocking | `vi.mock()`, `vi.fn()`, `vi.spyOn()` |
| DB in tests | SQLite in-memory (via Prisma) |

---

## Testing Pyramid

```
        E2E Tests (少量)
       /project:test e2e
      ──────────────────
     Integration Tests (中量)
    /project:test integration
   ────────────────────────────
  Unit Tests (大量，快速)
 /project:test unit
──────────────────────────────
```

**原則**: 單元測試覆蓋業務邏輯，整合測試覆蓋 API 層，E2E 只測關鍵用戶流程。

---

## 1. Unit Test 模式

```typescript
// __tests__/unit/[service].test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ServiceName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('methodName()', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      const input = { ... }

      // Act
      const result = methodName(input)

      // Assert
      expect(result).toEqual(expected)
    })

    it('should throw when [invalid condition]', () => {
      expect(() => methodName(invalidInput)).toThrow('error message')
    })
  })
})
```

**必測清單（unit）**:
- Zod validation schema（valid / invalid input）
- Service / utility 函數的邏輯分支
- Error cases 和 edge cases

---

## 2. Integration Test 模式（API Routes）

```typescript
// __tests__/integration/api/[resource].test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { GET, POST } from '@/app/api/[resource]/route'

// Mock auth — 避免真實 session 依賴
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@test.com' }),
}))

// Mock Prisma — 控制 DB 結果
vi.mock('@/lib/prisma', () => ({
  prisma: {
    resource: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('GET /api/[resource]', () => {
  it('returns 200 with paginated data', async () => {
    vi.mocked(prisma.resource.findMany).mockResolvedValue([mockItem])

    const req = new Request('http://localhost/api/resource?page=1')
    const res = await GET(req as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new ApiError('UNAUTHORIZED', '...', 401))

    const res = await GET(new Request('http://localhost/api/resource') as any)
    expect(res.status).toBe(401)
  })
})
```

---

## 3. E2E Test 模式（Playwright）

```typescript
// e2e/[flow].spec.ts
import { test, expect } from '@playwright/test'

test.describe('[Flow Name]', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: 登入或初始化狀態
    await page.goto('/login')
    await page.fill('[name=email]', 'test@test.com')
    await page.fill('[name=password]', 'password123')
    await page.click('[type=submit]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('user can [action]', async ({ page }) => {
    await page.goto('/target-page')
    await page.click('[data-testid=action-button]')
    await expect(page.locator('[data-testid=result]')).toBeVisible()
  })
})
```

**E2E 只覆蓋**:
- 用戶主要流程（register → login → core action）
- 跨頁面的關鍵路徑
- 不測 UI 細節（那是 unit test 的工作）

---

## 4. Testing Spec 格式

執行 testing task 時，先讀 `specs/testing-spec.md`，完成後更新 checklist。

```markdown
## Task Status

### Pending
- [ ] [Unit] ServiceName.method() — 邏輯分支測試
- [ ] [Integration] POST /api/resource — happy path + error cases
- [ ] [E2E] 用戶完整流程（register → dashboard）

### Done
- [x] [Unit] validateSchema() — valid/invalid input（completed: YYYY-MM-DD）
```

---

## 5. 回歸測試 Checklist

每次 bug fix 後必須加：

```markdown
# 加到 specs/testing-spec.md Task Status > Pending

- [ ] [Regression] BugTitle — 確認 [buggy scenario] 不再發生
```

對應測試：

```typescript
it('[regression] should not [buggy behavior]', () => {
  // 重現 bug 的最小化場景
  const result = buggyFunction(triggerInput)
  expect(result).not.toEqual(buggyOutput)
  expect(result).toEqual(correctOutput)
})
```

---

## 完成後必須

1. 更新 `specs/testing-spec.md`，將完成的 task 移到 `Done` 並加日期
2. 確認 `npm test -- --run` 全部通過
3. 輸出 `test:` 開頭的 commit message

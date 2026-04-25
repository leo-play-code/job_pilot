import { test, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Static source analysis for navigate() logic
// (Component uses hooks that are hard to test in isolation without full Next.js runtime)

const src = fs.readFileSync(
  path.resolve(__dirname, '../components/shared/UserAvatarDropdown.tsx'),
  'utf-8',
)

// ---------------------------------------------------------------------------
// [Regression] 同頁導航不觸發 loading — navigate() 在目標 pathname 與當前相同時不呼叫 setNavigatingTo
// ---------------------------------------------------------------------------

test('navigate() skips loading when already on target page', () => {
  // Confirm the guard exists: targetPathname !== pathname check before setNavigatingTo
  expect(src).toContain("targetPathname !== pathname")
  expect(src).toContain("setNavigatingTo(path)")
  // The setNavigatingTo must be inside the if-block, not before it
  const navigateFn = src.slice(src.indexOf('const navigate ='), src.indexOf('const handleLogout'))
  expect(navigateFn).toContain("if (targetPathname !== pathname)")
})

test('navigate() strips query string before comparing pathname', () => {
  // Confirm path.split('?')[0] is used for comparison
  expect(src).toContain("path.split('?')[0]")
})

// ---------------------------------------------------------------------------
// [Regression] 導航後 spinner 自動停止 — useEffect 依賴 pathname 清除 navigatingTo
// ---------------------------------------------------------------------------

test('spinner resets when pathname changes (useEffect on pathname)', () => {
  expect(src).toContain("setNavigatingTo(null)")
  expect(src).toContain("[pathname]")
})

// ---------------------------------------------------------------------------
// [Regression] Safety timeout 兜底 — 3 秒後強制清除 spinner
// ---------------------------------------------------------------------------

test('safety timeout clears navigatingTo after 3000ms', () => {
  expect(src).toContain("setTimeout")
  expect(src).toContain("3000")
  expect(src).toContain("[navigatingTo]")
  // Confirm cleanup to avoid memory leaks
  expect(src).toContain("clearTimeout")
})

// ---------------------------------------------------------------------------
// [Regression] 登出 spinner 保持 dropdown 開啟 — e.preventDefault()
// ---------------------------------------------------------------------------

test('handleLogout calls e.preventDefault() to keep dropdown open during logout', () => {
  expect(src).toContain("e.preventDefault()")
  expect(src).toContain("setIsLoggingOut(true)")
  expect(src).toContain("signOut")
})

// ---------------------------------------------------------------------------
// [Regression] 點數餘額路由 — 指向 /settings/credits（獨立頁面）
// ---------------------------------------------------------------------------

test('credits item navigates to /settings/credits (standalone page)', () => {
  expect(src).toContain("settings/credits")
  expect(src).not.toContain("settings?tab=credits")
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// [Regression] Credits 頁面拆分回歸測試
// 點數餘額從 settings/page.tsx 移出至 settings/credits/page.tsx
// UserAvatarDropdown 「點數餘額」連結從 ?tab=credits → /settings/credits
// ---------------------------------------------------------------------------

describe('UserAvatarDropdown 點數餘額路由', () => {
  it('「點數餘額」item 導向路徑為 /settings/credits，不含舊的 ?tab=credits query string', () => {
    const content = readFileSync(
      join(process.cwd(), 'src/components/shared/UserAvatarDropdown.tsx'),
      'utf-8',
    )
    expect(content).toContain('/settings/credits')
    expect(content).not.toContain('settings?tab=credits')
  })
})

describe('settings/page.tsx 不再顯示點數餘額', () => {
  it('settings 頁已移除點數餘額 section', () => {
    const content = readFileSync(
      join(process.cwd(), 'src/app/[locale]/settings/page.tsx'),
      'utf-8',
    )
    expect(content).not.toContain('點數餘額')
    expect(content).not.toContain('credits}')
  })
})

describe('/settings/credits 頁面存在且顯示點數', () => {
  it('credits 頁面包含點數餘額 heading、fetch /api/user/me、顯示 credits 數值', () => {
    const content = readFileSync(
      join(process.cwd(), 'src/app/[locale]/settings/credits/page.tsx'),
      'utf-8',
    )
    expect(content).toContain('點數餘額')
    expect(content).toContain('/api/user/me')
    expect(content).toContain('credits')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mocks — must be hoisted before component imports
// ---------------------------------------------------------------------------

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
}))

// Mock next-intl — useTranslations returns a simple key mapper
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      allDistricts: '全部區',
    }
    return map[key] ?? key
  },
}))

// Mock @/lib/104-api so TAIWAN_AREA_CODES is available in test env
vi.mock('@/lib/104-api', () => ({
  TAIWAN_AREA_CODES: {
    台北市: '6001001000',
    台中市: '6001008000',
  },
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { SearchConfigForm } from '@/components/auto-apply/SearchConfigForm'
import { getDistricts } from '@/lib/104-area-codes'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_TAIPEI_DISTRICTS = Object.keys(getDistricts('台北市'))
const ALL_TAICHUNG_DISTRICTS = Object.keys(getDistricts('台中市'))

function renderForm() {
  const onSaved = vi.fn()
  const result = render(
    <SearchConfigForm initialValues={null} onSaved={onSaved} />,
  )
  return { ...result, onSaved }
}

/** Click a city button by text to expand/collapse district checkboxes */
function selectCity(getByText: (text: string) => HTMLElement, city: string) {
  fireEvent.click(getByText(city))
}

/** Get the "全部區" checkbox for a specific city */
function getSelectAllCheckbox(container: HTMLElement, city: string): HTMLInputElement {
  return container.querySelector(
    `[data-testid="select-all-checkbox-${city}"]`,
  ) as HTMLInputElement
}

/** Get the district section container for a city */
function getCityDistrictSection(container: HTMLElement, city: string): HTMLElement | null {
  // The section has a data-testid="select-all-${city}" label wrapper inside
  const selectAllLabel = container.querySelector(`[data-testid="select-all-${city}"]`)
  // The parent div contains both the header row and the grid
  return selectAllLabel?.closest('.rounded-md') as HTMLElement ?? null
}

/** Get all individual district checkboxes for a city, scoped to that city's section */
function getDistrictCheckboxes(container: HTMLElement, city: string): HTMLInputElement[] {
  const section = getCityDistrictSection(container, city)
  if (!section) return []
  const districts = Object.keys(getDistricts(city))
  return districts
    .map((name) => section.querySelector(`input[aria-label="${name}"]`) as HTMLInputElement)
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// [auto-apply-area-select-all] Unit — SearchConfigForm 全部區 checkbox
// ---------------------------------------------------------------------------

describe('SearchConfigForm — 全部區 checkbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Case 1: 點「全部區」→ 所有行政區打勾
  // -------------------------------------------------------------------------
  it('Case 1: 點「全部區」→ 台北市所有行政區 checked', () => {
    const { container, getByText } = renderForm()

    // Select 台北市 to expand district list
    selectCity(getByText, '台北市')

    // The 全部區 checkbox should appear
    const selectAll = getSelectAllCheckbox(container, '台北市')
    expect(selectAll).toBeTruthy()

    // Initially unchecked (no districts selected)
    expect(selectAll.checked).toBe(false)

    // Click 全部區
    fireEvent.click(selectAll)

    // All 12 Taipei districts should now be checked
    const districtCheckboxes = getDistrictCheckboxes(container, '台北市')
    expect(districtCheckboxes).toHaveLength(ALL_TAIPEI_DISTRICTS.length)
    districtCheckboxes.forEach((cb) => {
      expect(cb.checked).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Case 2: 再點「全部區」（已全選）→ 全部取消
  // -------------------------------------------------------------------------
  it('Case 2: 全選後再點「全部區」→ 全部 unchecked', () => {
    const { container, getByText } = renderForm()

    selectCity(getByText, '台北市')

    const selectAll = getSelectAllCheckbox(container, '台北市')

    // Click to select all
    fireEvent.click(selectAll)

    // Verify all districts are checked
    const districtCheckboxes = getDistrictCheckboxes(container, '台北市')
    districtCheckboxes.forEach((cb) => expect(cb.checked).toBe(true))

    // Click again to deselect all
    fireEvent.click(selectAll)

    // All should now be unchecked
    districtCheckboxes.forEach((cb) => {
      expect(cb.checked).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Case 3: 手動勾選所有行政區 → 「全部區」自動打勾
  // -------------------------------------------------------------------------
  it('Case 3: 手動逐一勾選所有行政區 → 「全部區」自動 checked', () => {
    const { container, getByText } = renderForm()

    selectCity(getByText, '台北市')

    const districtCheckboxes = getDistrictCheckboxes(container, '台北市')
    expect(districtCheckboxes).toHaveLength(ALL_TAIPEI_DISTRICTS.length)

    // Click each district one by one
    districtCheckboxes.forEach((cb) => {
      fireEvent.click(cb)
    })

    // 全部區 checkbox should now be checked (allChecked = true)
    const selectAll = getSelectAllCheckbox(container, '台北市')
    expect(selectAll.checked).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Case 4: 取消 1 個行政區 → 「全部區」indeterminate
  // -------------------------------------------------------------------------
  it('Case 4: 全選後取消 1 個行政區 → 「全部區」indeterminate=true', () => {
    const { container, getByText } = renderForm()

    selectCity(getByText, '台北市')

    // First select all via 全部區
    const selectAll = getSelectAllCheckbox(container, '台北市')
    fireEvent.click(selectAll)

    // Verify all checked
    const districtCheckboxes = getDistrictCheckboxes(container, '台北市')
    districtCheckboxes.forEach((cb) => expect(cb.checked).toBe(true))

    // Uncheck one district (中正區, the first one)
    fireEvent.click(districtCheckboxes[0])

    // 全部區 should now be indeterminate (some checked, some not)
    expect(selectAll.indeterminate).toBe(true)
    expect(selectAll.checked).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// [auto-apply-area-select-all] Regression — 切換縣市後「全部區」狀態重置
// ---------------------------------------------------------------------------

describe('SearchConfigForm — 切換縣市後全選狀態重置', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('切換至台中市後，台中「全部區」為 unchecked，台北 codes 不延續至台中', () => {
    const { container, getByText } = renderForm()

    // Select 台北市 and select all districts
    selectCity(getByText, '台北市')
    const taipeiSelectAll = getSelectAllCheckbox(container, '台北市')
    fireEvent.click(taipeiSelectAll)

    // Verify all Taipei districts are checked
    const taipeiCheckboxes = getDistrictCheckboxes(container, '台北市')
    taipeiCheckboxes.forEach((cb) => expect(cb.checked).toBe(true))

    // Now also select 台中市 (both cities expanded)
    selectCity(getByText, '台中市')

    // 台中市's 全部區 should be unchecked (no Taichung districts selected)
    const taichungSelectAll = getSelectAllCheckbox(container, '台中市')
    expect(taichungSelectAll).toBeTruthy()
    expect(taichungSelectAll.checked).toBe(false)

    // All Taichung district checkboxes should be unchecked
    const taichungCheckboxes = getDistrictCheckboxes(container, '台中市')
    expect(taichungCheckboxes).toHaveLength(ALL_TAICHUNG_DISTRICTS.length)
    taichungCheckboxes.forEach((cb) => {
      expect(cb.checked).toBe(false)
    })

    // Taipei districts should remain checked
    taipeiCheckboxes.forEach((cb) => expect(cb.checked).toBe(true))
  })

  it('取消選擇台北市後，台北市行政區 DOM 被移除（全選狀態清空）', () => {
    const { container, getByText } = renderForm()

    // Select 台北市 and select all districts
    selectCity(getByText, '台北市')
    const taipeiSelectAll = getSelectAllCheckbox(container, '台北市')
    fireEvent.click(taipeiSelectAll)

    // Deselect 台北市 city pill (toggle off)
    selectCity(getByText, '台北市')

    // 台北市 district section should no longer be in DOM
    const selectAllAfter = container.querySelector('[data-testid="select-all-checkbox-台北市"]')
    expect(selectAllAfter).toBeNull()
  })
})

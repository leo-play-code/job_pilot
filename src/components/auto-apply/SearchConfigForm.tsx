'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { TAIWAN_AREA_CODES } from '@/lib/104-api'
import { TAIWAN_DISTRICT_CODES, getDistricts } from '@/lib/104-area-codes'

const TAIWAN_CITIES = Object.keys(TAIWAN_DISTRICT_CODES)

const JOB_TYPES = [
  { value: '1', label: '全職' },
  { value: '2', label: '兼職' },
  { value: '3', label: '派遣' },
  { value: '4', label: '實習' },
]

// valueAsNumber converts empty input to NaN; preprocess it to undefined before Zod validates
const toOptionalInt = z.preprocess(
  (v) =>
    v === '' || v === null || v === undefined || (typeof v === 'number' && isNaN(v as number))
      ? undefined
      : v,
  z.number().int().min(0).optional(),
)

const schema = z.object({
  salaryMin: toOptionalInt,
  salaryMax: toOptionalInt,
  coverLetterMode: z.enum(['AI_GENERATED', 'PLATFORM_DEFAULT']),
  wordCount: z.enum(['SHORT', 'MEDIUM', 'LONG']),
  maxApplyCount: z.number().int().min(1).max(20),
})
type FormValues = z.infer<typeof schema>

interface ConfigValues {
  keywords: string[]
  locationCodes: string[]
  subLocationCodes: string[]
  salaryMin?: number
  salaryMax?: number
  jobTypes: string[]
  industries: string[]
  coverLetterMode: 'AI_GENERATED' | 'PLATFORM_DEFAULT'
  wordCount: 'SHORT' | 'MEDIUM' | 'LONG'
  coverLetterIndex: number
  maxApplyCount: number
}

interface Props {
  initialValues: ConfigValues | null
  onSaved: (config: ConfigValues) => void
}

/** Build initial selectedDistrictCodes from persisted subLocationCodes */
function resolveInitialDistrictCodes(subLocationCodes: string[]): string[] {
  // Only keep codes that actually exist in TAIWAN_DISTRICT_CODES
  const allCodes = new Set(
    Object.values(TAIWAN_DISTRICT_CODES).flatMap((d) => Object.values(d)),
  )
  return subLocationCodes.filter((c) => allCodes.has(c))
}

/** Reverse-map locationCodes back to city names */
function resolveInitialCities(locationCodes: string[]): string[] {
  return locationCodes.map(
    (code) => Object.entries(TAIWAN_AREA_CODES).find(([, c]) => c === code)?.[0] ?? code,
  )
}

export function SearchConfigForm({ initialValues, onSaved }: Props) {
  const t = useTranslations('autoApply')
  // Refs for indeterminate state on "select all" checkboxes, keyed by city name
  const selectAllRefsMap = useRef<Record<string, HTMLInputElement | null>>({})
  const [keywords, setKeywords] = useState<string[]>(initialValues?.keywords ?? [])
  const [kwInput, setKwInput] = useState('')

  // Two-layer location state
  const [selectedCities, setSelectedCities] = useState<string[]>(() => {
    if (initialValues?.subLocationCodes?.length) {
      // Derive selected cities from sub-location codes
      const citySet = new Set<string>()
      for (const [city, districts] of Object.entries(TAIWAN_DISTRICT_CODES)) {
        for (const code of Object.values(districts)) {
          if (initialValues.subLocationCodes.includes(code)) citySet.add(city)
        }
      }
      return Array.from(citySet)
    }
    return resolveInitialCities(initialValues?.locationCodes ?? [])
  })

  // selectedDistrictCodes stores 10-digit 104 area codes (unique per district)
  const [selectedDistrictCodes, setSelectedDistrictCodes] = useState<string[]>(
    resolveInitialDistrictCodes(initialValues?.subLocationCodes ?? []),
  )

  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(initialValues?.jobTypes ?? [])
  const [coverLetterMode, setCoverLetterMode] = useState<'AI_GENERATED' | 'PLATFORM_DEFAULT'>(
    initialValues?.coverLetterMode ?? 'AI_GENERATED',
  )
  const [wordCount, setWordCount] = useState<'SHORT' | 'MEDIUM' | 'LONG'>(
    initialValues?.wordCount ?? 'MEDIUM',
  )
  const [coverLetterIndex, setCoverLetterIndex] = useState<number>(
    initialValues?.coverLetterIndex ?? 1,
  )

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      salaryMin: initialValues?.salaryMin ?? undefined,
      salaryMax: initialValues?.salaryMax ?? undefined,
      coverLetterMode: initialValues?.coverLetterMode ?? 'AI_GENERATED',
      wordCount: initialValues?.wordCount ?? 'MEDIUM',
      maxApplyCount: initialValues?.maxApplyCount ?? 10,
    },
  })

  const addKeyword = () => {
    const kw = kwInput.trim()
    if (kw && !keywords.includes(kw) && keywords.length < 10) {
      setKeywords((prev) => [...prev, kw])
      setKwInput('')
    }
  }

  const toggleCity = (city: string) => {
    setSelectedCities((prev) => {
      const next = prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
      // Remove district codes that belong to the deselected city
      if (!next.includes(city)) {
        const cityDistrictCodes = new Set(Object.values(getDistricts(city)))
        setSelectedDistrictCodes((codes) => codes.filter((c) => !cityDistrictCodes.has(c)))
      }
      return next
    })
  }

  const toggleDistrictCode = (code: string) => {
    setSelectedDistrictCodes((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code],
    )
  }

  const toggleJobType = (type: string) => {
    setSelectedJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const onSubmit = async (data: FormValues) => {
    if (keywords.length === 0) {
      toast.error('請至少輸入一個關鍵字')
      return
    }

    // Build location codes based on whether districts are selected
    let locationCodes: string[] = []
    let subLocationCodes: string[] = []

    if (selectedDistrictCodes.length > 0) {
      // Use district codes directly
      subLocationCodes = [...selectedDistrictCodes]
      locationCodes = []
    } else {
      subLocationCodes = []
      locationCodes = selectedCities.map((city) => TAIWAN_AREA_CODES[city] ?? city)
    }

    const payload: ConfigValues = {
      keywords,
      locationCodes,
      subLocationCodes,
      salaryMin: data.salaryMin ?? undefined,
      salaryMax: data.salaryMax ?? undefined,
      jobTypes: selectedJobTypes,
      industries: [],
      coverLetterMode,
      wordCount,
      coverLetterIndex,
      maxApplyCount: data.maxApplyCount,
    }

    const res = await fetch('/api/job-search/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      toast.error('儲存設定失敗')
      return
    }
    toast.success('搜尋設定已儲存')
    onSaved(payload)
  }

  const toggleClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
      active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'border-border hover:bg-muted'
    }`

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-medium text-sm">搜尋設定</h3>
        <p className="text-xs text-muted-foreground mt-0.5">設定職缺搜尋條件與投遞偏好</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Keywords */}
        <div className="space-y-2">
          <label className="text-sm font-medium">搜尋關鍵字</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="例：前端工程師、React（按 Enter 新增）"
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              新增
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {kw}
                  <button
                    type="button"
                    onClick={() => setKeywords((prev) => prev.filter((k) => k !== kw))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Location — two-layer */}
        <div className="space-y-2">
          <label className="text-sm font-medium">工作地點（可多選）</label>
          {/* Layer 1: city pills */}
          <div className="flex flex-wrap gap-1.5">
            {TAIWAN_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => toggleCity(city)}
                className={toggleClass(selectedCities.includes(city))}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Layer 2: district checkboxes for each selected city */}
          {selectedCities.length > 0 && (
            <div className="mt-2 space-y-3 pl-1">
              {selectedCities.map((city) => {
                const districts = getDistricts(city)
                const districtEntries = Object.entries(districts) // [name, code][]
                const districtCodes = Object.values(districts)
                const checkedCount = districtCodes.filter((c) => selectedDistrictCodes.includes(c)).length
                const allChecked = checkedCount === districtCodes.length
                const someChecked = checkedCount > 0 && checkedCount < districtCodes.length

                const toggleAllDistricts = () => {
                  if (allChecked) {
                    // Deselect all districts for this city
                    const cityCodesSet = new Set(districtCodes)
                    setSelectedDistrictCodes((prev) => prev.filter((c) => !cityCodesSet.has(c)))
                  } else {
                    // Select all districts for this city
                    setSelectedDistrictCodes((prev) => {
                      const cityCodesSet = new Set(districtCodes)
                      const existing = prev.filter((c) => !cityCodesSet.has(c))
                      return [...existing, ...districtCodes]
                    })
                  }
                }

                return (
                  <div key={city} className="rounded-md border border-dashed border-border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-medium text-muted-foreground">{city} 行政區</p>
                      <label
                        data-testid={`select-all-${city}`}
                        className="flex items-center gap-1 text-xs cursor-pointer text-muted-foreground hover:text-foreground ml-auto"
                      >
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => {
                            selectAllRefsMap.current[city] = el
                            if (el) el.indeterminate = someChecked && !allChecked
                          }}
                          onChange={toggleAllDistricts}
                          aria-label={`${t('allDistricts')} ${city}`}
                          className="h-3 w-3 accent-primary"
                          data-testid={`select-all-checkbox-${city}`}
                        />
                        {t('allDistricts')}
                      </label>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-1.5">
                      {districtEntries.map(([name, code]) => {
                        const checked = selectedDistrictCodes.includes(code)
                        return (
                          <label
                            key={code}
                            className={`flex items-center gap-1.5 text-xs cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                              checked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDistrictCode(code)}
                              aria-label={name}
                              className="h-3 w-3 accent-primary"
                            />
                            {name}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {selectedDistrictCodes.length > 0 && (
            <p className="text-xs text-muted-foreground">
              已選行政區：{selectedDistrictCodes.map((code) => {
                for (const [, districts] of Object.entries(TAIWAN_DISTRICT_CODES)) {
                  for (const [name, c] of Object.entries(districts)) {
                    if (c === code) return name
                  }
                }
                return code
              }).join('、')}
            </p>
          )}
        </div>

        {/* Salary */}
        <div className="space-y-2">
          <label className="text-sm font-medium">月薪範圍（元，可不填）</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="最低月薪"
              className="w-36 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('salaryMin', { valueAsNumber: true })}
            />
            <span className="text-muted-foreground text-sm">—</span>
            <input
              type="number"
              placeholder="最高月薪"
              className="w-36 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('salaryMax', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Job Types */}
        <div className="space-y-2">
          <label className="text-sm font-medium">工作類型</label>
          <div className="flex gap-2">
            {JOB_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleJobType(t.value)}
                className={toggleClass(selectedJobTypes.includes(t.value))}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cover Letter Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium">自薦信方式</label>
          <div className="flex gap-3">
            {[
              { value: 'AI_GENERATED' as const, label: 'AI 生成自薦信' },
              { value: 'PLATFORM_DEFAULT' as const, label: '104 預設自薦信' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCoverLetterMode(opt.value)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm border transition-colors ${
                  coverLetterMode === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Cover letter index selector — only when PLATFORM_DEFAULT */}
          {coverLetterMode === 'PLATFORM_DEFAULT' && (
            <div className="mt-2 space-y-1.5">
              <label className="text-xs text-muted-foreground">使用第幾份預存自薦信</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCoverLetterIndex(i)}
                    className={`w-9 h-9 rounded-md text-sm border transition-colors ${
                      coverLetterIndex === i
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                請先至 104 → 會員中心 → 自薦信管理，確認已儲存對應的自薦信
              </p>
            </div>
          )}
        </div>

        {/* Word Count (AI only) */}
        {coverLetterMode === 'AI_GENERATED' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">自薦信字數</label>
            <select
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value as 'SHORT' | 'MEDIUM' | 'LONG')}
              className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="SHORT">簡短（150字）</option>
              <option value="MEDIUM">適中（300字）</option>
              <option value="LONG">詳細（500字）</option>
            </select>
          </div>
        )}

        {/* Max Apply Count */}
        <div className="space-y-2">
          <label className="text-sm font-medium">每次最多投遞數量（上限 20）</label>
          <input
            type="number"
            min={1}
            max={20}
            className="w-24 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('maxApplyCount', { valueAsNumber: true })}
          />
          {errors.maxApplyCount && (
            <p className="text-xs text-destructive">{errors.maxApplyCount.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isSubmitting ? '儲存中...' : '儲存設定'}
        </button>
      </form>
    </div>
  )
}

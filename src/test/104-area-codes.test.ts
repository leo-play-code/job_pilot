import { describe, it, expect } from 'vitest'
import { TAIWAN_DISTRICT_CODES, getCities, getDistricts } from '@/lib/104-area-codes'

describe('104-area-codes', () => {
  it('getCities() returns non-empty array', () => {
    const cities = getCities()
    expect(cities.length).toBeGreaterThan(0)
  })

  it('每個縣市都有至少一個行政區', () => {
    const cities = getCities()
    for (const city of cities) {
      const districts = getDistricts(city)
      expect(Object.keys(districts).length).toBeGreaterThan(0)
    }
  })

  it('所有 area code 格式為 10 位數字字串', () => {
    for (const [, districts] of Object.entries(TAIWAN_DISTRICT_CODES)) {
      for (const [, code] of Object.entries(districts)) {
        expect(code).toMatch(/^\d{10}$/)
      }
    }
  })

  it('getDistricts 對不存在的縣市回傳空物件', () => {
    expect(getDistricts('不存在的縣')).toEqual({})
  })

  it('台北市有12個行政區', () => {
    const districts = getDistricts('台北市')
    expect(Object.keys(districts).length).toBe(12)
  })

  it('台北市大安區有正確 area code', () => {
    const districts = getDistricts('台北市')
    expect(districts['大安區']).toBeDefined()
    expect(districts['大安區']).toMatch(/^\d{10}$/)
  })
})

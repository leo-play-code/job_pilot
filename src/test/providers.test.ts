import { test, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// [ux-feedback] Regression — Providers 包含 NextTopLoader + Toaster
// ---------------------------------------------------------------------------

test('Providers.tsx contains NextTopLoader', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, '../components/shared/Providers.tsx'),
    'utf-8',
  )
  expect(content).toContain('NextTopLoader')
})

test('Providers.tsx contains Toaster from sonner', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, '../components/shared/Providers.tsx'),
    'utf-8',
  )
  expect(content).toContain('Toaster')
  expect(content).toContain('sonner')
})

// ---------------------------------------------------------------------------
// [Regression] AWS S3 模板縮圖域名允許
// ---------------------------------------------------------------------------

test('next.config.ts allows *.s3.amazonaws.com', () => {
  const content = fs.readFileSync(path.resolve('next.config.ts'), 'utf-8')
  expect(content).toContain('*.s3.amazonaws.com')
})

test('next.config.ts allows *.s3.*.amazonaws.com (with region)', () => {
  const content = fs.readFileSync(path.resolve('next.config.ts'), 'utf-8')
  expect(content).toContain('*.s3.*.amazonaws.com')
})

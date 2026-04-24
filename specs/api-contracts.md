# API Contracts

## 基本規範

- Base path：`/api`
- Auth：NextAuth session cookie（`getServerSession`），未登入回傳 `401`
- Response 格式：`{ data: T }` 成功 / `{ error: string }` 失敗
- 限流超過：`429 { error: "daily_limit_reached" }`
- 所有 body 用 JSON，Content-Type: application/json（除 multipart 上傳）

## 路由清單

| Method | Path | Auth | 說明 |
|---|---|---|---|
| POST | /api/auth/register | public | Email 註冊 |
| GET | /api/usage/today | required | 今日已用次數 |
| POST | /api/resume/generate | required | AI 生成履歷（消耗 1 次）|
| GET | /api/resume | required | 列出用戶所有履歷 |
| GET | /api/resume/:id | required | 取得單筆履歷 |
| PATCH | /api/resume/:id | required | 更新履歷（不消耗次數）|
| DELETE | /api/resume/:id | required | 刪除履歷 |
| POST | /api/pdf/parse | required | 上傳 PDF 解析（消耗 1 次，multipart）|
| GET | /api/pdf/download/:id | required | 下載履歷 PDF（Puppeteer）|
| POST | /api/cover-letter/generate | required | AI 生成自薦信（消耗 1 次）|
| GET | /api/cover-letter | required | 列出用戶所有自薦信 |
| GET | /api/cover-letter/:id | required | 取得單筆自薦信 |
| DELETE | /api/cover-letter/:id | required | 刪除自薦信 |
| DELETE | /api/resume | required | 刪除當前用戶所有履歷 |
| DELETE | /api/cover-letter | required | 刪除當前用戶所有自薦信 |
| GET | /api/templates | public | 列出 active 模板（用戶選擇用）|
| GET | /api/admin/templates | admin | 列出全部模板（含 draft）|
| POST | /api/admin/templates | admin | 手動建立模板（JSON CSS）|
| PATCH | /api/admin/templates/:id | admin | 更新模板（含 status 發佈）|
| DELETE | /api/admin/templates/:id | admin | 刪除模板 |
| POST | /api/admin/templates/:id/thumbnail | admin | 重新產生 S3 縮圖 |
| POST | /api/admin/templates/import | admin | **上傳 PNG/PDF → AI 分析 → 建立 draft 模板** |

## 關鍵 Request / Response

```
POST /api/resume/generate
  body: { content: ResumeContent, templateId: string, language: "zh"|"en" }
  200:  { data: { resumeId: string, content: ResumeContent } }

POST /api/pdf/parse
  body: multipart/form-data (file: PDF, max 5MB)
  200:  { data: { content: ResumeContent } }

POST /api/cover-letter/generate
  body: { resumeId?: string, resumeSummary?: string,
          jobTitle: string, jobDesc: string,
          wordCount: "SHORT"|"MEDIUM"|"LONG", language: "zh"|"en" }
  200:  { data: { coverLetterId: string, content: string } }

GET /api/usage/today
  200:  { data: { used: number, limit: 10 } }

DELETE /api/resume
  Auth: required
  body: (none)
  200:  { data: { deletedCount: number } }
  Business logic:
  - 驗證 session
  - deleteMany Resume where userId = current user
  - 回傳刪除筆數

DELETE /api/cover-letter
  Auth: required
  body: (none)
  200:  { data: { deletedCount: number } }
  Business logic:
  - 驗證 session
  - deleteMany CoverLetter where userId = current user
  - 回傳刪除筆數

POST /api/admin/templates/import
  Auth: admin only (session.user.email === ADMIN_EMAIL)
  body: multipart/form-data
    - file: PNG (max 5MB) | PDF (max 10MB)
  200: { data: { templateId: string, analysis: TemplateAiAnalysis, htmlDefinition: TemplateDefinition } }
  422: { error: 'invalid_file_type' }
  503: { error: 'vision_api_unavailable' }
  Business logic:
  1. 驗證 admin 身份
  2. 驗證 file type（image/png, image/jpeg, application/pdf）
  3. PDF → 截取第一頁為 PNG（Puppeteer screenshot）
  4. 將圖片 base64 → 送 Claude Vision API 分析
  5. 解析回傳的 JSON（layout, colors, css, sectionOrder）
  6. 上傳原始圖到 S3 (templates/references/{id}.png)
  7. 建立 Template 記錄 status='draft', aiAnalysis 存分析結果
  8. 回傳 templateId + analysis + 建議 htmlDefinition（供 Admin 在前端調整）
  注意：draft 模板不出現在 /api/templates 用戶列表，須 admin 發佈後才生效

PATCH /api/admin/templates/:id
  body: { name?, description?, category?, sortOrder?, htmlDefinition?, status?, isActive? }
  status='active' 時同步設 isActive=true（向後兼容）
```

## Task Status

### Done

| Task | 說明 | 完成日期 |
|---|---|---|
| [x] Task 1 | `src/lib/template-vision.ts` — Claude Vision API 分析模板圖片 | 2026-04-24 |
| [x] Task 2 | `pdfFirstPageToPng()` — PDF 首頁轉 PNG（Puppeteer）| 2026-04-24 |
| [x] Task 3 | `POST /api/admin/templates/import` — 上傳圖片 → Vision 分析 → 建立 draft 模板 | 2026-04-24 |
| [x] Task 4 | `PATCH /api/admin/templates/[id]` — 加入 status 欄位，status↔isActive 同步 | 2026-04-24 |
| [x] Task 5 | `GET /api/admin/templates` — response 已含 status（findMany 不限 select） | 2026-04-24 |
| [x] Task 6 | `GET /api/templates` — 改為 `status: 'active'` 篩選，排除 draft 模板 | 2026-04-24 |

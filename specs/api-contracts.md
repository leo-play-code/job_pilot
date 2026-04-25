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
| GET | /api/resume/:id/preview-html | required | 取得履歷完整 HTML（iframe 預覽用）|
| GET | /api/templates | public | 列出 active 模板（用戶選擇用）|
| GET | /api/admin/resumes | admin | 列出所有用戶履歷（分頁、搜尋）|
| DELETE | /api/admin/resumes/:id | admin | 刪除任意履歷 |
| GET | /api/admin/cover-letters | admin | 列出所有自薦信（分頁、搜尋）|
| DELETE | /api/admin/cover-letters/:id | admin | 刪除任意自薦信 |
| GET | /api/admin/usage-logs | admin | 列出使用記錄（唯讀、可依 action/date/search/userId 篩選）|
| GET | /api/admin/templates | admin | 列出全部模板（含 draft）|
| POST | /api/admin/templates | admin | 手動建立模板（JSON CSS）|
| PATCH | /api/admin/templates/:id | admin | 更新模板（含 status 發佈）|
| DELETE | /api/admin/templates/:id | admin | 刪除模板 |
| POST | /api/admin/templates/:id/thumbnail | admin | 重新產生 S3 縮圖 |
| POST | /api/admin/templates/import | admin | **上傳 PNG/PDF → AI 分析 → 建立 draft 模板** |
| POST | /api/resume/import-raw | required | 上傳 PDF → 不做 AI → 存 S3 + rawText → 建立 Resume |
| GET | /api/resume/:id/raw-pdf | required | 取得原始 PDF S3 下載連結 |
| POST | /api/stripe/create-checkout-session | required | 建立 Stripe Checkout Session → 回傳 checkoutUrl |
| POST | /api/stripe/create-portal-session | required | 建立 Stripe Customer Portal Session → 回傳 portalUrl |
| POST | /api/stripe/webhook | public (Stripe signature) | 接收 Stripe webhook 事件，更新 user plan |
| GET | /api/user/subscription | required | 取得當前訂閱狀態（plan, currentPeriodEnd）|

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

GET /api/resume/:id/preview-html
  Auth: required (user 必須擁有此 resume)
  Response: { data: { html: string } }
  Business logic:
  1. 驗證 session，findFirst { id, userId }（擁有者驗證）
  2. 取 templateId → BUILTIN_TEMPLATE_DEFINITIONS[templateId] 或 prisma.template.findUnique
  3. 呼叫 buildResumeHtml(content, definition, language, layoutOverride?.sectionOrder)
  4. 回傳 { data: { html } }
  Note: draft/DB 自定模板的 CSS 完整套用，不 fallback

PATCH /api/admin/templates/:id
  body: { name?, description?, category?, sortOrder?, htmlDefinition?, status?, isActive? }
  status='active' 時同步設 isActive=true（向後兼容）
```

## Stripe Endpoints 詳細規格

```
POST /api/stripe/create-checkout-session
  Auth: required
  Body: (none)
  200: { data: { checkoutUrl: string } }
  Business logic:
  1. 驗證 session
  2. 若 user.stripeCustomerId 為空 → stripe.customers.create({ email, name }) → 更新 DB
  3. stripe.checkout.sessions.create({
       customer: stripeCustomerId,
       line_items: [{ price: STRIPE_PRICE_ID_MONTHLY, quantity: 1 }],
       mode: 'subscription',
       success_url: `${NEXT_PUBLIC_APP_URL}/[locale]/settings/billing?success=true`,
       cancel_url: `${NEXT_PUBLIC_APP_URL}/[locale]/settings/billing?canceled=true`,
     })
  4. 回傳 checkoutUrl

POST /api/stripe/create-portal-session
  Auth: required
  Body: (none)
  200: { data: { portalUrl: string } }
  Business logic:
  1. 驗證 session
  2. 確認 user.stripeCustomerId 存在（否則 400）
  3. stripe.billingPortal.sessions.create({
       customer: stripeCustomerId,
       return_url: `${NEXT_PUBLIC_APP_URL}/[locale]/settings/billing`,
     })
  4. 回傳 portalUrl

POST /api/stripe/webhook
  Auth: 無（用 stripe.webhooks.constructEvent 驗簽名）
  Headers: stripe-signature
  Body: raw string（必須 rawBody，不能 JSON.parse）
  200: { received: true }
  Events 處理：
  - checkout.session.completed
      → findUser by customer ID
      → 從 session 取 subscription ID
      → 取 subscription 的 current_period_end
      → 更新 User: plan=PRO, stripeSubscriptionId, stripePriceId, stripeCurrentPeriodEnd
  - customer.subscription.updated
      → 更新 stripeCurrentPeriodEnd、stripePriceId
      → 若 status='active' 確保 plan=PRO
  - customer.subscription.deleted
      → 更新 User: plan=FREE, stripeSubscriptionId=null, stripeCurrentPeriodEnd=null
  - invoice.payment_failed
      → （目前 log 即可，不降級）

GET /api/user/subscription
  Auth: required
  200: { data: { plan: 'FREE'|'PRO', currentPeriodEnd: string|null, hasActiveSubscription: boolean } }
  Business logic: findUnique user by session → 回傳 plan + stripeCurrentPeriodEnd
```

## Task Status

### Pending

- [x] **[pagination] Backend: 修改 `GET /api/resume`** ✅ 2026-04-25 — 加 `?page=1&limit=6` query params；response 改為 `{ data: { resumes: Resume[], total: number, page: number, totalPages: number } }`；skip=(page-1)*limit, take=limit；無 page param 時維持回傳全部（向後兼容）
- [x] **[pagination] Backend: 修改 `GET /api/cover-letter`** ✅ 2026-04-25 — 同上，加分頁支援；response 改為 `{ data: { coverLetters: CoverLetter[], total: number, page: number, totalPages: number } }`
- [x] **[pagination] Backend: 修改 `GET /api/templates`** ✅ 2026-04-25 — 加 `?page=1&limit=6`；response 改為 `{ data: { templates: Template[], total: number, page: number, totalPages: number } }`；`status='active'` 篩選保留
- [x] **[admin-users] Backend: `DELETE /api/admin/users/:id`** ✅ 2026-04-25 — admin only；transaction 依序刪除 UsageLog → CoverLetter → Resume → Account → Session → User；不允許刪除自己（400）；找不到 → 404；回傳 `{ data: { ok: true, deletedEmail: string } }`
- [x] **[usage-logs-search] Backend: 修改 `GET /api/admin/usage-logs`** ✅ 2026-04-25 — 加 `?search=` query param；對 `user.email` 做 case-insensitive CONTAINS 篩選；與現有 `action`、`date`、`userId` params 並存；無 search 時行為不變

### Done

| Task | 說明 | 完成日期 |
|---|---|---|
| [x] [stripe-subscription] Backend: `POST /api/stripe/create-checkout-session` | 建立/取得 Stripe Customer → 建立 Checkout Session → 回傳 checkoutUrl | 2026-04-25 |
| [x] [stripe-subscription] Backend: `POST /api/stripe/create-portal-session` | Stripe Customer Portal → 回傳 portalUrl | 2026-04-25 |
| [x] [stripe-subscription] Backend: `POST /api/stripe/webhook` | raw body 驗簽 → 處理 checkout.session.completed / subscription.updated / subscription.deleted | 2026-04-25 |
| [x] [stripe-subscription] Backend: `GET /api/user/subscription` | 回傳 plan + currentPeriodEnd + hasActiveSubscription | 2026-04-25 |
| [x] [stripe-subscription] Backend: 修改 `GET /api/usage/today` | PRO 用戶回傳 `{ used: 0, limit: null, unlimited: true }` | 2026-04-25 |
| [x] [stripe-subscription] Backend: 修改 `checkDailyLimit()` | PRO 用戶直接放行，不計算次數 | 2026-04-25 |
| [x] [raw-import] Backend: `POST /api/resume/import-raw` | 上傳 PDF → pdf-parse 提取 rawText → S3 上傳（fallback 空字串）→ 建立 Resume，不寫 UsageLog | 2026-04-24 |
| [x] [raw-import] Backend: `GET /api/resume/:id/raw-pdf` | 驗證擁有者 → rawPdfUrl 為空回 404 → 回傳 S3 URL | 2026-04-24 |
| [x] [raw-import] Backend: 修改 `POST /api/cover-letter/generate` | content.rawText 存在時以 rawText 作為 resume context，否則使用結構化 content | 2026-04-24 |
| [x] [resume-preview] Backend: `GET /api/resume/:id/preview-html` ✅ | 驗證擁有者 → 取 template definition → buildResumeHtml → 回傳 html string | 2026-04-24 |
| [x] Task 1 | `src/lib/template-vision.ts` — Claude Vision API 分析模板圖片 | 2026-04-24 |
| [x] Task 2 | `pdfFirstPageToPng()` — PDF 首頁轉 PNG（Puppeteer）| 2026-04-24 |
| [x] Task 3 | `POST /api/admin/templates/import` — 上傳圖片 → Vision 分析 → 建立 draft 模板 | 2026-04-24 |
| [x] Task 4 | `PATCH /api/admin/templates/[id]` — 加入 status 欄位，status↔isActive 同步 | 2026-04-24 |
| [x] Task 5 | `GET /api/admin/templates` — response 已含 status（findMany 不限 select） | 2026-04-24 |
| [x] Task 6 | `GET /api/templates` — 改為 `status: 'active'` 篩選，排除 draft 模板 | 2026-04-24 |
| [x] [admin-db] Backend: `GET /api/admin/resumes` | admin only；返回所有用戶履歷列表（id, title, userId, userEmail, templateId, language, rawPdfUrl, createdAt）；支援 query: search, page, userId；50 筆/頁 | 2026-04-25 |
| [x] [admin-db] Backend: `DELETE /api/admin/resumes/:id` | admin only；刪除指定履歷，關聯 CoverLetter.resumeId 設為 null；回傳 `{ data: { ok: true } }` | 2026-04-25 |
| [x] [admin-db] Backend: `GET /api/admin/cover-letters` | admin only；返回所有自薦信（id, jobTitle, userId, userEmail, wordCount, language, createdAt）；支援 query: search, page, userId | 2026-04-25 |
| [x] [admin-db] Backend: `DELETE /api/admin/cover-letters/:id` | admin only；刪除指定自薦信；回傳 `{ data: { ok: true } }` | 2026-04-25 |
| [x] [admin-db] Backend: `GET /api/admin/usage-logs` | admin only；返回使用記錄（id, userId, userEmail, action, date, createdAt）；支援 query: action, date, userId, page；純唯讀 | 2026-04-25 |

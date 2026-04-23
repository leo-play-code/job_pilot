# Feature Spec — JobPilot MVP

---

## Feature 1: 用戶認證（Auth）

**User Story**
As a visitor, I want to register and login so that my resumes are saved and usage is tracked.

**UI Flow**
1. 用戶點擊「開始使用」→ 導向 `/[locale]/login`
2. 選擇 Google 登入 或 Email/Password
3. 首次使用 Email → 導向 `/register` 填寫名稱與密碼
4. 登入成功 → 導向 `/dashboard`
5. Error: Email 已存在 → "此 Email 已註冊，請直接登入"

---

### 🗄️ Database Tasks

```
New Tables:
- User: id, name, email, emailVerified, image, plan(FREE), stripeCustomerId?, createdAt, updatedAt
- Account: NextAuth OAuth accounts table
- Session: NextAuth sessions table

Migration name: init_auth_schema
```

---

### ⚙️ Backend Tasks

```
NextAuth.js 設定 (src/auth.ts):
- Provider: GoogleProvider (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
- Provider: CredentialsProvider (email + bcrypt password)
- Adapter: PrismaAdapter
- Callbacks: session callback 帶入 user.id + user.plan

New Endpoints (NextAuth handles):
- GET/POST /api/auth/[...nextauth]

Custom:
- POST /api/auth/register
  Auth: public
  Body: { name, email, password }
  Response: { success: boolean }
  Logic:
  - 驗證 email 格式
  - 檢查 email 是否已存在
  - bcrypt hash password
  - 建立 User record
```

---

### 🖥️ Frontend Tasks

```
New Pages:
- LoginPage at /[locale]/login
  Shows: Google 登入按鈕、Email/Password 表單
  Actions: signIn("google"), signIn("credentials")
  States: loading spinner, error toast

- RegisterPage at /[locale]/register
  Shows: name, email, password, confirm password 欄位
  Actions: POST /api/auth/register → redirect to login
  States: loading, validation errors

- DashboardPage at /[locale]/dashboard
  Shows: 用戶的履歷列表、自薦信列表、今日剩餘次數
  Actions: 新增履歷、上傳 PDF、新增自薦信
  API calls: GET /api/resume, GET /api/cover-letter, GET /api/usage
```

---

### ✅ Acceptance Criteria

- [ ] Google OAuth 登入成功後建立 User record
- [ ] Email 登入密碼錯誤顯示明確錯誤訊息
- [ ] 未登入訪問 /dashboard 自動導向 /login
- [ ] 登入後顯示用戶名稱與頭像

---

## Feature 2: 從零建立履歷

**User Story**
As a logged-in user, I want to input my experience and choose a template so that I can generate a professional resume.

**UI Flow**
1. 用戶進入 `/resume/new`
2. Step 1：填寫個人資訊（姓名、Email、電話、LinkedIn）
3. Step 2：填寫工作經歷（可新增多筆）
4. Step 3：填寫學歷、技能、成就
5. Step 4：選擇模板（Modern / Professional / Creative）與語言（中/英）
6. 按下「AI 生成」→ 呼叫 API → 顯示 loading（約 5-10 秒）
7. 顯示預覽頁，可編輯細節
8. 按「下載 PDF」→ 取得 PDF 檔案
9. Error: 今日次數已用完 → 顯示升級 Modal

---

### 🗄️ Database Tasks

```
New Tables:
- Resume: id, userId, title, content(Json), templateId, language, createdAt, updatedAt
- UsageLog: id, userId, action, date(String "YYYY-MM-DD"), createdAt

New Indexes:
- Resume.userId (查詢用戶所有履歷)
- UsageLog.[userId, date] (每日計數查詢)

Migration name: add_resume_and_usage_log
```

---

### ⚙️ Backend Tasks

```
New Endpoints:

- POST /api/resume/generate
  Auth: required
  Body: { content: ResumeContent, templateId: string, language: "zh"|"en" }
  Response: { data: { resumeId: string, content: ResumeContent } }
  Logic:
  - 檢查今日 UsageLog count < 3（否則 429）
  - 呼叫 Claude API，以用戶輸入為基礎強化履歷內容
    (潤飾 bullets、summary，不改變事實)
  - 儲存 Resume record
  - 新增 UsageLog { action: GENERATE_RESUME, date: today }
  - 回傳履歷 id 與強化後 content

- GET /api/resume
  Auth: required
  Response: { data: Resume[] }
  Logic: 查詢當前用戶所有履歷，最新在前

- GET /api/resume/:id
  Auth: required (只能讀自己的)
  Response: { data: Resume }

- PATCH /api/resume/:id
  Auth: required
  Body: Partial<{ title, content, templateId, language }>
  Response: { data: Resume }
  Logic: 更新履歷，不消耗使用次數

- DELETE /api/resume/:id
  Auth: required
  Response: { success: true }

- GET /api/usage/today
  Auth: required
  Response: { data: { used: number, limit: number } }
  Logic: count UsageLog where userId=me AND date=today
```

---

### 🖥️ Frontend Tasks

```
New Pages/Components:

- ResumeBuilderPage at /[locale]/resume/new
  Multi-step form (4 steps)，使用 React Hook Form + Zod 驗證
  Step indicator 顯示目前進度
  最後一步顯示模板預覽縮圖

- TemplateSelector component
  Shows: 3 個模板縮圖卡片（Modern, Professional, Creative）
  Actions: 點選高亮，傳入父元件
  
- ResumePreviewPage at /[locale]/resume/[id]
  Shows: 根據 templateId 渲染對應 HTML 模板，填入 content 資料
  Actions:
    - 「編輯」→ 回到 builder 帶入資料
    - 「下載 PDF」→ GET /api/pdf/resume/:id
  States: loading skeleton, error state

- UsageBadge component (顯示在 dashboard header)
  Shows: "今日剩餘 X/3 次"
  API calls: GET /api/usage/today

- UpgradeModal component
  顯示條件：API 回傳 429
  Shows: 升級 PRO 說明（Phase 2 Stripe）
```

---

### ✅ Acceptance Criteria

- [ ] 四步驟表單可前後切換，資料不遺失
- [ ] 每步驟有 Zod 驗證，錯誤即時顯示
- [ ] AI 生成時顯示 loading state（按鈕 disabled + spinner）
- [ ] 預覽頁正確套用選擇的模板
- [ ] 每日第 4 次操作觸發 UpgradeModal
- [ ] 履歷儲存後出現在 dashboard 列表

---

## Feature 3: 上傳 PDF 建立履歷

**User Story**
As a user, I want to upload my existing resume PDF so that AI can parse and reformat it with a new template.

**UI Flow**
1. 用戶進入 `/resume/upload`
2. 拖曳或點選上傳 PDF（最大 5MB）
3. 按下「解析」→ API 回傳結構化資料（消耗 1 次）
4. 顯示已填入資料的 Step 2-4 表單，用戶可編輯確認
5. 選擇模板 → 按「生成履歷」（不再消耗次數）
6. 導向預覽頁
7. Error: 非 PDF / 超過 5MB → 顯示提示

---

### 🗄️ Database Tasks

```
無額外 table，共用 Resume 和 UsageLog
```

---

### ⚙️ Backend Tasks

```
New Endpoints:

- POST /api/pdf/parse
  Auth: required
  Request: multipart/form-data (file: PDF)
  Response: { data: { content: ResumeContent } }
  Logic:
  - 驗證 file type = application/pdf
  - 驗證 file size <= 5MB
  - 檢查今日 UsageLog count < 3（否則 429）
  - 用 pdf-parse 提取文字
  - 呼叫 Claude API，將純文字轉換為 ResumeContent JSON
  - 新增 UsageLog { action: PARSE_PDF, date: today }
  - 回傳結構化 content（不儲存 Resume，等用戶確認後再存）

- POST /api/pdf/download/:resumeId
  Auth: required（只能下載自己的）
  Response: application/pdf binary
  Logic:
  - 讀取 Resume record
  - 用 Puppeteer 渲染對應模板 HTML
  - 注入 ResumeContent 資料
  - 輸出 PDF buffer
  - 設定 Content-Disposition: attachment
```

---

### 🖥️ Frontend Tasks

```
New Pages/Components:

- UploadResumePage at /[locale]/resume/upload
  Shows: 拖曳上傳區（react-dropzone）
  Accepts: .pdf only, max 5MB
  Actions: 上傳 → POST /api/pdf/parse → 填入 ResumeBuilderForm
  States:
    - idle: 拖曳區 + 說明文字
    - uploading: 進度條
    - parsing: "AI 解析中..." spinner
    - error: "僅支援 PDF，最大 5MB"
    - success: 自動帶入 builder 表單

- ResumeBuilderForm（共用 Feature 2 的表單）
  新增 prop: initialData?: ResumeContent（從 PDF 解析帶入）
```

---

### ✅ Acceptance Criteria

- [ ] 只接受 PDF，其他格式顯示錯誤
- [ ] 超過 5MB 顯示錯誤，不送出 API
- [ ] 解析結果正確填入表單各欄位
- [ ] 用戶可在表單中修改解析結果
- [ ] 下載 PDF 正確對應選擇的模板

---

## Feature 4: 自薦信生成

**User Story**
As a user, I want to generate a cover letter based on my resume and a job description so that I can apply more effectively.

**UI Flow**
1. 用戶進入 `/cover-letter/new`
2. Step 1：選擇已存在履歷（下拉選單）或貼上履歷摘要
3. Step 2：填寫職缺標題與職缺說明（貼上 JD）
4. Step 3：選擇字數（短 ~150 / 中 ~300 / 長 ~500）與語言（中/英）
5. 按「生成自薦信」→ loading（約 5 秒）
6. 顯示生成結果，可複製或下載 .txt / .docx
7. Error: 今日次數用完 → UpgradeModal

---

### 🗄️ Database Tasks

```
New Tables:
- CoverLetter: id, userId, resumeId?, jobTitle, jobDesc(Text), content(Text),
               wordCount(SHORT|MEDIUM|LONG), language, createdAt, updatedAt

New Indexes:
- CoverLetter.userId

Migration name: add_cover_letter
```

---

### ⚙️ Backend Tasks

```
New Endpoints:

- POST /api/cover-letter/generate
  Auth: required
  Body: {
    resumeId?: string,
    resumeSummary?: string,  // 如果沒有選履歷，直接貼文字
    jobTitle: string,
    jobDesc: string,
    wordCount: "SHORT"|"MEDIUM"|"LONG",
    language: "zh"|"en"
  }
  Response: { data: { coverLetterId: string, content: string } }
  Logic:
  - 驗證 resumeId 或 resumeSummary 至少一個存在
  - 檢查今日 UsageLog count < 3（否則 429）
  - 若有 resumeId，查詢 Resume content
  - 呼叫 Claude API 生成自薦信
  - 儲存 CoverLetter record
  - 新增 UsageLog { action: GENERATE_COVER_LETTER, date: today }
  - 回傳 content

- GET /api/cover-letter
  Auth: required
  Response: { data: CoverLetter[] }

- GET /api/cover-letter/:id
  Auth: required
  Response: { data: CoverLetter }

- DELETE /api/cover-letter/:id
  Auth: required
  Response: { success: true }
```

---

### 🖥️ Frontend Tasks

```
New Pages/Components:

- CoverLetterBuilderPage at /[locale]/cover-letter/new
  Step 1: ResumeSelector（下拉選已儲存履歷）或 textarea 貼摘要
  Step 2: jobTitle input + jobDesc textarea（支援貼上 JD）
  Step 3: WordCountSelector（3 個選項卡片）+ LanguageToggle

- CoverLetterResultPage at /[locale]/cover-letter/[id]
  Shows: 生成的自薦信文字，格式化顯示
  Actions:
    - 複製到剪貼簿
    - 下載 .txt
    - 重新生成（消耗 1 次）
  States: loading, success, error

- WordCountSelector component
  Shows: 3 個卡片 (短/中/長)，附說明字數
```

---

### ✅ Acceptance Criteria

- [ ] 可選擇現有履歷或直接貼文字
- [ ] 三種字數選項，生成結果字數誤差在 ±20% 內
- [ ] 中文 / 英文版本切換正確
- [ ] 生成結果可複製到剪貼簿（顯示 toast 確認）
- [ ] 自薦信儲存後出現在 dashboard 列表

---

## Feature 5: i18n（中 / 英）

### ⚙️ Backend Tasks
```
無需後端變更，language 欄位已在 Resume / CoverLetter 儲存
```

### 🖥️ Frontend Tasks
```
- next-intl 設定，支援 /zh 和 /en 路由前綴
- messages/zh.json + messages/en.json 涵蓋所有 UI 字串
- LanguageSwitcher component (在 header 右上角)
- middleware.ts 根據 Accept-Language header 預設語系
```

### ✅ Acceptance Criteria
- [ ] 切換語系後整個 UI 立即更新
- [ ] 履歷與自薦信語系獨立設定（UI 語系 ≠ 內容語系）
- [ ] URL 包含 locale 前綴（/zh/dashboard, /en/dashboard）

---

## 🔁 全域實作順序

1. **DB** (`database-dev`)
   - Prisma schema（User, Account, Session, Resume, CoverLetter, UsageLog）
   - Migration + seed

2. **Auth** (`backend-dev`)
   - NextAuth.js 設定
   - POST /api/auth/register

3. **Usage 中介層** (`backend-dev`)
   - `lib/usage.ts` — checkDailyLimit() + recordUsage()
   - GET /api/usage/today

4. **Resume API** (`backend-dev`)
   - POST /api/resume/generate（Claude AI）
   - GET/PATCH/DELETE /api/resume, /api/resume/:id

5. **PDF API** (`backend-dev`)
   - POST /api/pdf/parse（pdf-parse + Claude AI）
   - POST /api/pdf/download/:id（Puppeteer）

6. **Cover Letter API** (`backend-dev`)
   - POST /api/cover-letter/generate（Claude AI）
   - GET/DELETE /api/cover-letter, /api/cover-letter/:id

7. **Frontend — Auth 頁面** (`frontend-dev`)

8. **Frontend — Resume Builder** (`frontend-dev`)

9. **Frontend — PDF Upload** (`frontend-dev`)

10. **Frontend — Cover Letter Builder** (`frontend-dev`)

11. **Frontend — Dashboard** (`frontend-dev`)

12. **i18n** (`frontend-dev`)
    - messages/zh.json + messages/en.json
    - LanguageSwitcher

---

## 待 Phase 2

- Stripe 訂閱（PRO plan，移除每日限制）
- 更多模板
- 履歷 ATS 評分功能

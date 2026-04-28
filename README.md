<div align="right">

**Language / 語言**　[English](#english) ｜ [中文](#中文)

</div>

---

<a name="english"></a>

# JobPilot

> AI-powered resume & cover letter generator — helps job seekers produce professional documents in minutes.

**Tech Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · Supabase (PostgreSQL) · NextAuth.js v5 · OpenAI GPT-4o-mini · Anthropic Claude Vision · AWS S3 · Paddle · Puppeteer · next-intl

---

## Features

| Feature | Description |
|---|---|
| **Resume Builder** | Build from scratch or import an existing PDF; AI enhances your content; choose from multiple templates; download as PDF |
| **Cover Letter Generator** | Paste a job description + choose a resume → AI writes a tailored letter in seconds |
| **Auto-Apply (104.com)** | Automates batch job applications on the 104 job platform using your stored credentials |
| **Template System** | Admins upload a design image → Claude Vision analyzes the layout → editable HTML/CSS template |
| **Subscription & Credits** | Free tier (10 AI ops/day) · Pro monthly plan · One-time credit packs (via Paddle) |
| **Multi-language** | Chinese (zh) & English (en), switchable without page reload |
| **Admin Dashboard** | Manage users, resumes, cover letters, usage logs, and templates |

---

## How to Use

### 1. Register & Log In

Go to `/register` to create an account with email + password, or click **Sign in with Google** on `/login`.

After logging in you land on the **Dashboard** at `/dashboard`. It shows all your resumes and cover letters, plus your remaining daily AI operations.

---

### 2. Create a Resume

**Option A — Build from scratch**

1. Click **New Resume** on the dashboard
2. Fill in the 4-step form:
   - **Step 1 Personal Info** — name, title, email, phone, location, summary
   - **Step 2 Experience** — add job entries; click **AI Enhance** to polish each description
   - **Step 3 Education & Skills** — schools, degrees, skill tags
   - **Step 4 Template** — pick a template; the right panel shows a live A4 preview
3. Click **Save** — the resume appears in your dashboard

**Option B — Import a PDF**

1. Click **Upload Resume** on the dashboard
2. Upload your existing PDF
3. Choose **AI Parse** (extracts & structures the content) or **Raw Import** (stores the PDF as-is)
4. After parsing, review and edit in the same 4-step form

**Download as PDF**

Open any resume → click **Download PDF**. Puppeteer renders the HTML template server-side and returns a printable PDF.

---

### 3. Generate a Cover Letter

1. Click **New Cover Letter** on the dashboard
2. Select which resume to base it on
3. Paste the job posting text into the **Job Description** field
4. Choose a word count (short / medium / long)
5. Click **Generate** — the AI writes a tailored cover letter in seconds
6. Edit the result inline, then click **Save**

---

### 4. Auto-Apply on 104.com

> This feature automates job applications on [104.com.tw](https://www.104.com.tw). Only use it with your own account.

1. Go to **Auto-Apply** in the sidebar
2. Enter your 104.com login credentials — they are encrypted with AES-256-GCM before being stored
3. Set your job search preferences (keywords, location, job type)
4. Click **Capture Session** — the server launches a headless browser to log in and capture your session
5. Review the matched job list, select roles to apply to, then click **Batch Apply**
6. View application history in the **History** tab

---

### 5. Manage Templates (Admin only)

1. Log in with the admin email (`ADMIN_EMAIL`)
2. Go to `/admin/templates`
3. **Import a design** — upload a PNG/PDF screenshot → Claude Vision analyzes the layout and generates HTML/CSS → edit the CSS in the editor → save
4. **Activate / Deactivate** templates — only active templates appear in the resume builder
5. **Create from scratch** — use the JSON editor to define the template structure directly

---

### 6. Billing & Credits

- **Free plan** — 10 AI operations per day (resets at midnight UTC)
- **Pro plan** — unlimited operations, access to all templates. Subscribe at `/settings/billing` via Paddle
- **Credit packs** — one-time top-ups at `/settings/credits` (Starter · Job Seeker · Power)

---

## Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project (PostgreSQL)
- An [AWS S3](https://aws.amazon.com/s3/) bucket
- [Google Cloud Console](https://console.cloud.google.com) OAuth credentials
- [OpenAI](https://platform.openai.com) API key
- [Anthropic](https://console.anthropic.com) API key (for admin template import)
- [Paddle](https://sandbox-vendors.paddle.com) Sandbox account

---

## Local Development

### 1. Clone & Install

```bash
git clone <repo-url>
cd job-pilot
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` — see [Environment Variables](#environment-variables) below for every field.

### 3. Database Setup

```bash
# Push schema to Supabase (first time or after schema changes)
npm run db:push

# Seed default templates and admin account
npm run db:seed
```

### 4. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run type-check` | TypeScript check, no emit |
| `npm test -- --run` | Run all tests once |
| `npm run db:push` | Sync Prisma schema → Supabase (no migration history) |
| `npm run db:migrate` | Create a migration file + apply |
| `npm run db:studio` | Open Prisma Studio (GUI for DB) |
| `npm run db:seed` | Seed default data |

---

## Environment Variables

### Database (Supabase)

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

- `DATABASE_URL` — **Transaction pooler** URL (port `6543`) for runtime queries
- `DIRECT_URL` — **Session pooler** or direct URL (port `5432`) for migrations

> Both URLs: Supabase Dashboard → **Settings → Database → Connection string**.

---

### NextAuth

```env
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` locally; your Vercel URL in production

---

### Google OAuth

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

See [Google OAuth Setup](#google-oauth-setup) below.

---

### AI APIs

```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

- `OPENAI_API_KEY` — resume AI-enhance and cover letter generation (GPT-4o-mini / GPT-4o)
- `ANTHROPIC_API_KEY` — admin-only, Claude Vision for template design image import

---

### AWS S3

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET="job-pilot-assets"
# AWS_CLOUDFRONT_URL="https://xxxxx.cloudfront.net"  # optional CDN prefix
```

- `AWS_CLOUDFRONT_URL` — optional; if set, all S3 asset URLs are served through this CDN domain

See [AWS S3 Setup](#aws-s3-setup) below.

---

### Admin

```env
ADMIN_EMAIL="your-admin@email.com"
```

The account with this email gets `role: ADMIN` after `npm run db:seed`.

---

### Security & Encryption

```env
CREDENTIAL_ENCRYPTION_KEY="<64-character hex string>"
```

- AES-256-GCM key used to encrypt 104.com credentials stored in the database
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### Paddle (Payments)

```env
PADDLE_API_KEY=""
PADDLE_WEBHOOK_SECRET=""
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=""
PADDLE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Credit Pack Price IDs (one-time payments)
PADDLE_CREDIT_PACK_STARTER_PRICE_ID=""
PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID=""
PADDLE_CREDIT_PACK_POWER_PRICE_ID=""
```

| Variable | Description |
|---|---|
| `PADDLE_API_KEY` | Server-side API key from Paddle Dashboard → Developer Tools → Authentication |
| `PADDLE_WEBHOOK_SECRET` | Webhook signature secret for verifying Paddle event payloads |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Client-side token for embedding the Paddle checkout overlay |
| `PADDLE_PRICE_ID_MONTHLY` | Price ID for the Pro monthly subscription |
| `NEXT_PUBLIC_APP_URL` | Public URL of your app — used in Paddle checkout redirect URLs |
| `PADDLE_CREDIT_PACK_STARTER_PRICE_ID` | Price ID for the Starter credit pack (one-time) |
| `PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID` | Price ID for the Job Seeker credit pack (one-time) |
| `PADDLE_CREDIT_PACK_POWER_PRICE_ID` | Price ID for the Power credit pack (one-time) |

See [Paddle Setup](#paddle-setup) below.

---

### Development Overrides (optional)

```env
PUPPETEER_HEADLESS="false"
```

Set to `"false"` to make the browser window visible during PDF generation or Auto-Apply session capture. Useful for local debugging.

---

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region, set a strong database password
3. After the project is ready, go to **Settings → Database**
4. Copy the **Transaction pooler** connection string → `DATABASE_URL` (port `6543`)
5. Copy the **Session pooler** connection string → `DIRECT_URL` (port `5432`)
6. RLS (Row Level Security) is **not required** — Prisma handles all DB access from the backend

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create **OAuth 2.0 Client ID** → Application type: **Web application**
3. Add Authorized Redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://<your-vercel-domain>/api/auth/callback/google`
4. Copy **Client ID** → `GOOGLE_CLIENT_ID`
5. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## AWS S3 Setup

1. Create an S3 bucket (e.g. `job-pilot-assets`)
2. **Block all public access** — serve files via CloudFront or signed URLs
3. Create an **IAM user** with programmatic access and attach this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::job-pilot-assets/*"
    }
  ]
}
```

4. Copy the IAM user's **Access Key ID** and **Secret Access Key** into `.env.local`
5. (Optional) Set up a **CloudFront distribution** pointing to the bucket → fill `AWS_CLOUDFRONT_URL`

---

## Paddle Setup

This project uses **Paddle Sandbox** for development. Switch to Live keys before production.

1. Sign in to [Paddle Sandbox](https://sandbox-vendors.paddle.com)
2. Go to **Developer Tools → Authentication** → copy the **API key** → `PADDLE_API_KEY`
3. Go to **Developer Tools → Client-side token** → copy → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
4. Create products and prices:
   - **Pro Monthly** subscription → copy Price ID → `PADDLE_PRICE_ID_MONTHLY`
   - **Starter Credit Pack** (one-time) → `PADDLE_CREDIT_PACK_STARTER_PRICE_ID`
   - **Job Seeker Credit Pack** (one-time) → `PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID`
   - **Power Credit Pack** (one-time) → `PADDLE_CREDIT_PACK_POWER_PRICE_ID`
5. Go to **Developer Tools → Notifications** → add a webhook endpoint:
   - Local: use [ngrok](https://ngrok.com) → `https://<ngrok-url>/api/webhooks/paddle`
   - Production: `https://<your-vercel-domain>/api/webhooks/paddle`
   - Copy the **secret key** → `PADDLE_WEBHOOK_SECRET`

---

## Vercel Deployment

### 1. Import Project

In [Vercel Dashboard](https://vercel.com) → **Add New Project** → import from GitHub.

### 2. Environment Variables

In Vercel → **Settings → Environment Variables**, add all variables from `.env.local` with these overrides:

| Variable | Production Value |
|---|---|
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>` |
| `NEXTAUTH_SECRET` | Same value as local (or regenerate) |

### 3. Build Environment Variable

Add under **Settings → Environment Variables** with scope set to **Build** only:

| Variable | Value |
|---|---|
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `true` |

> **Note:** PDF generation requires **Vercel Pro plan** (250 MB function limit). The Hobby plan (50 MB) is too small for the Chromium binary.

### 4. Build Command

Vercel auto-detects Next.js. The build command is already set in `package.json`:

```
prisma generate && next build
```

### 5. Initialize Database After First Deploy

```bash
npm run db:push
npm run db:seed
```

Run these against your production Supabase instance.

---

## Admin Account

1. Register using the email set in `ADMIN_EMAIL`
2. Run `npm run db:seed` — this marks that email as `role: ADMIN` in the database
3. Access `/admin/dashboard` to manage users, resumes, cover letters, and usage logs

> Admin can delete any user (cascade deletes all their data) except their own account.

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # All pages (zh/en i18n routing)
│   │   ├── dashboard/     # Resume & cover letter lists
│   │   ├── resume/        # Resume builder & preview
│   │   ├── cover-letter/  # Cover letter generator
│   │   ├── pricing/       # Plan comparison
│   │   ├── settings/      # Billing & credits
│   │   ├── auto-apply/    # 104.com automation
│   │   └── admin/         # Admin dashboard & templates
│   └── api/               # API routes
├── components/            # Shared UI components
├── lib/                   # Server utilities (pdf, s3, ai, prisma, encryption)
├── messages/              # i18n strings (zh.json, en.json)
└── types/                 # TypeScript types
prisma/
└── schema.prisma          # Database schema
```

---

<div align="right"><a href="#english">↑ Back to top</a></div>

---
---

<a name="中文"></a>

# JobPilot（中文）

> AI 驅動的履歷與求職信生成器 — 幫助求職者在幾分鐘內產出專業文件。

**技術棧：** Next.js 15 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · Supabase (PostgreSQL) · NextAuth.js v5 · OpenAI GPT-4o-mini · Anthropic Claude Vision · AWS S3 · Paddle · Puppeteer · next-intl

---

## 功能特色

| 功能 | 說明 |
|---|---|
| **履歷建立器** | 從零開始或匯入現有 PDF；AI 強化內容；多種模板選擇；下載為 PDF |
| **求職信生成器** | 貼上職缺描述 + 選擇履歷 → AI 在幾秒內生成客製化求職信 |
| **自動投遞（104.com）** | 使用已儲存的帳號憑證，在 104 人力銀行批次自動投遞職缺 |
| **模板系統** | 管理員上傳設計圖 → Claude Vision 分析版型 → 產出可編輯的 HTML/CSS 模板 |
| **訂閱與點數** | 免費方案（每日 10 次 AI 操作）· Pro 月訂閱 · 一次性點數包（透過 Paddle）|
| **多語言** | 中文（zh）與英文（en），無需重新整理即可切換 |
| **管理後台** | 管理使用者、履歷、求職信、使用記錄與模板 |

---

## 使用教學

### 1. 註冊與登入

前往 `/register` 以 Email + 密碼建立帳號，或在 `/login` 點擊 **以 Google 登入**。

登入後會進入 **儀表板**（`/dashboard`），顯示所有履歷與求職信，以及今日剩餘 AI 操作次數。

---

### 2. 建立履歷

**方法 A — 從零開始**

1. 在儀表板點擊 **新增履歷**
2. 填寫 4 步驟表單：
   - **步驟 1 個人資訊** — 姓名、職稱、Email、電話、所在地、自我介紹
   - **步驟 2 工作經驗** — 新增職位；點擊 **AI 強化** 潤色每段描述
   - **步驟 3 學歷與技能** — 學校、學位、技能標籤
   - **步驟 4 模板** — 選擇模板；右側面板即時顯示 A4 預覽
3. 點擊 **儲存** — 履歷出現在儀表板

**方法 B — 匯入 PDF**

1. 在儀表板點擊 **上傳履歷**
2. 上傳現有 PDF 檔案
3. 選擇 **AI 解析**（提取並結構化內容）或 **直接匯入**（原檔儲存）
4. 解析完成後，在相同的 4 步驟表單中審閱並編輯

**下載 PDF**

開啟任何履歷 → 點擊 **下載 PDF**。Puppeteer 在伺服器端渲染 HTML 模板並回傳可列印的 PDF。

---

### 3. 生成求職信

1. 在儀表板點擊 **新增求職信**
2. 選擇要作為基礎的履歷
3. 在 **職缺描述** 欄位貼上職缺內容
4. 選擇字數（短篇 / 中篇 / 長篇）
5. 點擊 **生成** — AI 在幾秒內完成客製化求職信
6. 直接在線上編輯結果，然後點擊 **儲存**

---

### 4. 104.com 自動投遞

> 此功能自動化 [104.com.tw](https://www.104.com.tw) 的求職申請流程，請僅使用您自己的帳號。

1. 在側邊欄前往 **自動投遞**
2. 輸入您的 104.com 登入憑證 — 儲存前會以 AES-256-GCM 加密
3. 設定求職偏好（關鍵字、地區、工作類型）
4. 點擊 **擷取 Session** — 伺服器啟動無頭瀏覽器登入並擷取 Session
5. 審閱符合的職缺列表，選擇要投遞的職位，點擊 **批次投遞**
6. 在 **歷史記錄** 分頁查看投遞記錄

---

### 5. 模板管理（僅限管理員）

1. 以管理員 Email（`ADMIN_EMAIL`）登入
2. 前往 `/admin/templates`
3. **匯入設計** — 上傳 PNG/PDF 截圖 → Claude Vision 分析版型並生成 HTML/CSS → 在編輯器中調整 CSS → 儲存
4. **啟用 / 停用** 模板 — 僅啟用的模板會出現在履歷建立器中
5. **從零建立** — 使用 JSON 編輯器直接定義模板結構

---

### 6. 計費與點數

- **免費方案** — 每日 10 次 AI 操作（每天 UTC 午夜重置）
- **Pro 方案** — 無限次操作，存取所有模板。在 `/settings/billing` 透過 Paddle 訂閱
- **點數包** — 在 `/settings/credits` 一次性購買（Starter · Job Seeker · Power）

---

## 環境需求

- Node.js 20+
- npm 10+
- 一個 [Supabase](https://supabase.com) 專案（PostgreSQL）
- 一個 [AWS S3](https://aws.amazon.com/s3/) Bucket
- [Google Cloud Console](https://console.cloud.google.com) OAuth 憑證
- [OpenAI](https://platform.openai.com) API Key
- [Anthropic](https://console.anthropic.com) API Key（用於管理員模板匯入）
- [Paddle](https://sandbox-vendors.paddle.com) Sandbox 帳號

---

## 本地開發

### 1. Clone 並安裝

```bash
git clone <repo-url>
cd job-pilot
npm install
```

### 2. 環境變數

```bash
cp .env.example .env.local
```

填寫 `.env.local` — 完整欄位說明見下方[環境變數](#環境變數)章節。

### 3. 資料庫設定

```bash
# 將 schema 推送到 Supabase（第一次或 schema 變更後）
npm run db:push

# 植入預設模板與管理員帳號
npm run db:seed
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

### 常用指令

| 指令 | 說明 |
|---|---|
| `npm run dev` | 啟動開發伺服器（localhost:3000） |
| `npm run build` | 正式環境建置（先執行 `prisma generate`） |
| `npm run type-check` | TypeScript 型別檢查（不輸出） |
| `npm test -- --run` | 執行所有測試（單次） |
| `npm run db:push` | 同步 Prisma schema → Supabase（無 migration 記錄） |
| `npm run db:migrate` | 建立 migration 檔案並套用 |
| `npm run db:studio` | 開啟 Prisma Studio（資料庫 GUI） |
| `npm run db:seed` | 植入預設資料 |

---

## 環境變數

### 資料庫（Supabase）

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

- `DATABASE_URL` — 使用 **Transaction pooler** URL（連接埠 `6543`）用於執行期查詢
- `DIRECT_URL` — 使用 **Session pooler** 或直接 URL（連接埠 `5432`）用於 migration

> 兩個 URL 均在：Supabase Dashboard → **Settings → Database → Connection string**。

---

### NextAuth

```env
NEXTAUTH_SECRET="<執行: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

- `NEXTAUTH_SECRET` — 以 `openssl rand -base64 32` 生成任意長字串
- `NEXTAUTH_URL` — 本機為 `http://localhost:3000`；正式環境填 Vercel 網址

---

### Google OAuth

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

設定步驟見下方 [Google OAuth 設定](#google-oauth-設定)。

---

### AI API

```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

- `OPENAI_API_KEY` — 用於履歷 AI 強化與求職信生成（GPT-4o-mini / GPT-4o）
- `ANTHROPIC_API_KEY` — 僅限管理員，Claude Vision 分析模板設計圖時使用

---

### AWS S3

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET="job-pilot-assets"
# AWS_CLOUDFRONT_URL="https://xxxxx.cloudfront.net"  # 選填 CDN 前綴
```

- `AWS_CLOUDFRONT_URL` — 選填；設定後所有 S3 資源 URL 改由此 CDN 網域提供

設定步驟見下方 [AWS S3 設定](#aws-s3-設定)。

---

### 管理員

```env
ADMIN_EMAIL="your-admin@email.com"
```

執行 `npm run db:seed` 後，此 Email 對應帳號的 `role` 會被設為 `ADMIN`，可存取 `/admin/dashboard` 與 `/admin/templates`。

---

### 安全性與加密

```env
CREDENTIAL_ENCRYPTION_KEY="<64 字元十六進位字串>"
```

- AES-256-GCM 金鑰，用於加密儲存在資料庫中的 104.com 帳號憑證
- 生成方式：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### Paddle（付款）

```env
PADDLE_API_KEY=""
PADDLE_WEBHOOK_SECRET=""
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=""
PADDLE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 點數包價格 ID（一次性付款）
PADDLE_CREDIT_PACK_STARTER_PRICE_ID=""
PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID=""
PADDLE_CREDIT_PACK_POWER_PRICE_ID=""
```

| 變數 | 說明 |
|---|---|
| `PADDLE_API_KEY` | 伺服器端 API Key（Paddle Dashboard → Developer Tools → Authentication） |
| `PADDLE_WEBHOOK_SECRET` | 驗證 Paddle 事件 payload 的 Webhook 簽章密鑰 |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | 嵌入 Paddle 結帳視窗的用戶端 Token |
| `PADDLE_PRICE_ID_MONTHLY` | Pro 月訂閱的 Price ID |
| `NEXT_PUBLIC_APP_URL` | 應用程式的公開 URL，用於 Paddle 結帳重導向 |
| `PADDLE_CREDIT_PACK_STARTER_PRICE_ID` | Starter 點數包的 Price ID（一次性） |
| `PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID` | Job Seeker 點數包的 Price ID（一次性） |
| `PADDLE_CREDIT_PACK_POWER_PRICE_ID` | Power 點數包的 Price ID（一次性） |

設定步驟見下方 [Paddle 設定](#paddle-設定)。

---

### 開發覆寫（選填）

```env
PUPPETEER_HEADLESS="false"
```

設為 `"false"` 可在 PDF 生成或 Auto-Apply Session 擷取時顯示瀏覽器視窗，方便本地除錯。

---

## Supabase 設定

1. 前往 [supabase.com](https://supabase.com) → **New project**
2. 選擇地區，設定強密碼
3. 專案就緒後，前往 **Settings → Database**
4. 複製 **Transaction pooler** 連線字串 → `DATABASE_URL`（連接埠 `6543`）
5. 複製 **Session pooler** 連線字串 → `DIRECT_URL`（連接埠 `5432`）
6. 不需要啟用 RLS（Row Level Security）— Prisma 從後端統一處理所有 DB 存取

---

## Google OAuth 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. 建立 **OAuth 2.0 Client ID** → 應用程式類型：**Web application**
3. 新增授權重導向 URI：
   - 本機：`http://localhost:3000/api/auth/callback/google`
   - 正式環境：`https://<your-vercel-domain>/api/auth/callback/google`
4. 複製 **Client ID** → `GOOGLE_CLIENT_ID`
5. 複製 **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## AWS S3 設定

1. 建立 S3 Bucket（例如 `job-pilot-assets`）
2. **封鎖所有公開存取** — 透過 CloudFront 或 Signed URL 提供檔案
3. 建立具有程式化存取權限的 **IAM 使用者**，並附加以下政策：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::job-pilot-assets/*"
    }
  ]
}
```

4. 將 IAM 使用者的 **Access Key ID** 與 **Secret Access Key** 填入 `.env.local`
5. （選填）建立指向 Bucket 的 **CloudFront distribution** → 填入 `AWS_CLOUDFRONT_URL`

---

## Paddle 設定

本專案開發階段使用 **Paddle Sandbox**，上線前請換成 Live 金鑰。

1. 登入 [Paddle Sandbox](https://sandbox-vendors.paddle.com)
2. 前往 **Developer Tools → Authentication** → 複製 **API key** → `PADDLE_API_KEY`
3. 前往 **Developer Tools → Client-side token** → 複製 → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
4. 建立產品與價格：
   - **Pro Monthly** 訂閱 → 複製 Price ID → `PADDLE_PRICE_ID_MONTHLY`
   - **Starter Credit Pack**（一次性）→ `PADDLE_CREDIT_PACK_STARTER_PRICE_ID`
   - **Job Seeker Credit Pack**（一次性）→ `PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID`
   - **Power Credit Pack**（一次性）→ `PADDLE_CREDIT_PACK_POWER_PRICE_ID`
5. 前往 **Developer Tools → Notifications** → 新增 Webhook 端點：
   - 本機：使用 [ngrok](https://ngrok.com) → `https://<ngrok-url>/api/webhooks/paddle`
   - 正式環境：`https://<your-vercel-domain>/api/webhooks/paddle`
   - 複製 **secret key** → `PADDLE_WEBHOOK_SECRET`

---

## Vercel 部署

### 1. 匯入專案

在 [Vercel Dashboard](https://vercel.com) → **Add New Project** → 從 GitHub 匯入。

### 2. 環境變數

在 Vercel → **Settings → Environment Variables**，加入 `.env.local` 所有變數，並覆寫以下項目：

| 變數 | 正式環境值 |
|---|---|
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>` |
| `NEXTAUTH_SECRET` | 與本機相同值（或重新生成） |

### 3. 建置環境變數

在 **Settings → Environment Variables** 新增以下項目，Scope 設為 **Build** only：

| 變數 | 值 |
|---|---|
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `true` |

> **注意：** PDF 生成需要 **Vercel Pro 方案**（250 MB 函式限制）。Hobby 方案（50 MB）對於 Chromium 二進位檔來說空間不足。

### 4. 建置指令

Vercel 自動偵測 Next.js，建置指令已在 `package.json` 中設定：

```
prisma generate && next build
```

無需更動。

### 5. 首次部署後初始化資料庫

```bash
npm run db:push
npm run db:seed
```

針對正式環境 Supabase 執行（先將本機 `.env.local` 的 `DATABASE_URL` / `DIRECT_URL` 指向正式環境，或透過 Vercel 整合終端機執行）。

---

## 管理員帳號

1. 使用 `ADMIN_EMAIL` 設定的 Email 進行註冊
2. 執行 `npm run db:seed` — 將該 Email 對應帳號在資料庫中標記為 `role: ADMIN`
3. 存取 `/admin/dashboard` 管理使用者、履歷、求職信與使用記錄

> 管理員可刪除任何使用者（級聯刪除所有相關資料），但無法刪除自己的帳號。

---

## 專案結構

```
src/
├── app/
│   ├── [locale]/          # 所有頁面（zh/en i18n 路由）
│   │   ├── dashboard/     # 履歷與求職信列表
│   │   ├── resume/        # 履歷建立器與預覽
│   │   ├── cover-letter/  # 求職信生成器
│   │   ├── pricing/       # 方案比較
│   │   ├── settings/      # 計費與點數
│   │   ├── auto-apply/    # 104.com 自動化
│   │   └── admin/         # 管理後台與模板
│   └── api/               # API 路由
├── components/            # 共用 UI 元件
├── lib/                   # 伺服器工具（pdf, s3, ai, prisma, encryption）
├── messages/              # i18n 字串（zh.json, en.json）
└── types/                 # TypeScript 型別定義
prisma/
└── schema.prisma          # 資料庫 Schema
```

---

<div align="right"><a href="#中文">↑ 回到頂部</a></div>

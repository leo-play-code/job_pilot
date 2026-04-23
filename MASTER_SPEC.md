# MASTER_SPEC.md

> 所有 Claude session 必須在開始任務前讀取這個文件。

---

## 專案概覽

**名稱**：JobPilot
**描述**：AI 驅動的履歷與自薦信產生器。用戶填寫個人經歷表單或上傳舊履歷，AI 自動產出結構化履歷；針對特定職缺（貼文字或貼 URL），AI 產出高度匹配的自薦信。支援英文、繁中、簡中三語，三種模板可選，線上點擊編輯後可下載 PDF。透過 Email OTP 驗證識別用戶，每天 3 次免費，超限提示 Stripe 付費升級。目標市場為英語用戶（丟 Reddit 驗證），UI 支援中英雙語切換。
**目前階段**：MVP Phase 1 — 開發中

---

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Next.js 15 (App Router)、TypeScript、Tailwind CSS、shadcn/ui |
| 國際化 | next-intl（EN / ZH-TW / ZH-CN） |
| 後端 | Next.js Route Handlers、Zod validation |
| 資料庫 | PostgreSQL via Prisma ORM（Railway 托管） |
| AI | Claude API（claude-sonnet-4-6） |
| PDF | @sparticuz/chromium + puppeteer-core（Vercel 相容） |
| 檔案上傳 | Vercel Blob（舊履歷 PDF/Word 暫存） |
| 郵件 | Resend（OTP 驗證信） |
| 付費 | Stripe（MVP 後加入） |
| 測試 | Vitest、Testing Library |
| 部署 | Vercel（前端 + API）、Railway（PostgreSQL） |

---

## 使用者角色

- **訪客（Guest）**：未驗證 Email，可瀏覽首頁、查看模板範例，但不能生成
- **免費用戶（Free User）**：Email OTP 驗證後，每天可生成 3 次（履歷 + 自薦信合計）
- **付費用戶（Paid User）**：Stripe 訂閱後，每天無限次生成（MVP 後實作）

---

## MVP 功能範圍

### 包含（Phase 1）

1. **履歷生成** — 用戶填寫結構化表單（工作經歷、技能、學歷）OR 上傳舊履歷（PDF/Word），AI（Claude）產出完整履歷
2. **自薦信生成** — 貼上職缺描述文字 OR 貼職缺 URL（後端抓取），AI 根據履歷產出客製化自薦信
3. **三種模板** — ATS-friendly（通過 ATS 掃描）/ Minimalist（極簡排版）/ Creative（少量配色）
4. **段落點擊編輯** — 任何段落點擊即可 inline 修改文字
5. **PDF 下載** — Puppeteer headless 渲染後提供 PDF 下載
6. **多語言輸出** — 指定 EN / 繁中 / 簡中 生成內容
7. **中英雙語 UI** — 介面切換 EN / ZH-TW（next-intl）
8. **Email OTP 限流** — 每天 3 次免費；超限顯示 Stripe 付費提示（Stripe 實作留 stub）

### 不包含（下一版）

- 用戶帳號 / 登入 / 歷史記錄
- Stripe 實際金流串接
- LinkedIn 匯入
- 求職追蹤看板
- 社群登入（Google/GitHub）
- 自訂模板 / 上傳照片

---

## 資料模型

```
EmailOTP
  - email          String
  - otp            String (6 digits, hashed)
  - expires_at     DateTime
  - verified       Boolean

UsageLog
  - email          String
  - date           Date (UTC)
  - count          Int   (max 3 for free tier)

(履歷 / 自薦信資料在 MVP 中為 ephemeral，存於 client sessionStorage，不持久化)
```

---

## 核心流程

### 履歷生成流程
```
用戶進入 /resume
  → 選擇輸入方式（表單 / 上傳舊履歷）
  → 填寫或解析資料
  → 選擇語言 + 模板
  → 點擊「Generate」
    → 觸發 Email OTP 驗證（若未驗證）
    → 後端檢查 UsageLog（≤3 次）
    → 呼叫 Claude API 生成履歷
    → 回傳結構化 JSON → 前端渲染
  → 點擊段落可 inline 編輯
  → 點擊「Download PDF」→ Puppeteer 產 PDF
```

### 自薦信生成流程
```
用戶進入 /cover-letter（需先有履歷資料）
  → 輸入職缺：貼文字 OR 貼 URL
    → URL 模式：後端 fetch + 解析 JD 文字
  → 點擊「Generate」→ 同上驗證 + 限流邏輯
  → Claude 根據履歷 + JD 產出自薦信
  → 同樣可 inline 編輯 + PDF 下載
```

---

## API 規範

- Base path：`/api/`
- 認證：Email OTP session（存於 server-side cookie，使用 iron-session 或 next-auth credentials）
- 成功回應：`{ data: T }`
- 錯誤回應：`{ error: { code: string, message: string } }`
- Rate limit 錯誤碼：`DAILY_LIMIT_EXCEEDED`

### 主要 Route Handlers

| Method | Path | 說明 |
|---|---|---|
| POST | `/api/auth/send-otp` | 發送 OTP 到 Email |
| POST | `/api/auth/verify-otp` | 驗證 OTP，設置 session |
| POST | `/api/resume/parse` | 上傳舊履歷 → 解析回 JSON |
| POST | `/api/resume/generate` | 表單資料 + 設定 → Claude 生成履歷 |
| POST | `/api/cover-letter/scrape` | URL → 抓取 JD 文字 |
| POST | `/api/cover-letter/generate` | 履歷 + JD → Claude 生成自薦信 |
| POST | `/api/pdf/generate` | 履歷/自薦信 HTML → PDF Buffer |

---

## Claude API 使用規範

- 模型：`claude-sonnet-4-6`
- 所有 prompt 使用 structured output（JSON mode）
- 履歷生成 prompt 語言跟隨用戶選擇（EN / ZH-TW / ZH-CN）
- System prompt 定義輸出 JSON schema，確保前端可直接渲染
- 串流回應（streaming）：生成時顯示 loading skeleton，不使用 stream（MVP 簡化）

---

## 環境變數

```bash
# Database
DATABASE_URL=                    # PostgreSQL connection string (Railway)

# Claude AI
ANTHROPIC_API_KEY=               # Claude API key

# Email (OTP)
RESEND_API_KEY=                  # Resend API key
FROM_EMAIL=noreply@jobpilot.app  # 寄件人

# Session
SESSION_SECRET=                  # iron-session 加密 secret（32 chars+）

# Vercel Blob（舊履歷上傳）
BLOB_READ_WRITE_TOKEN=           # Vercel Blob token

# Stripe（留 stub，MVP 後填入）
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=             # e.g. https://jobpilot.app
```

---

## 專案結構

```
job_pilot/
├── src/
│   ├── app/
│   │   ├── [locale]/              # next-intl locale routing
│   │   │   ├── page.tsx           # 首頁 Landing
│   │   │   ├── resume/
│   │   │   │   └── page.tsx       # 履歷生成頁
│   │   │   └── cover-letter/
│   │   │       └── page.tsx       # 自薦信生成頁
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── send-otp/route.ts
│   │       │   └── verify-otp/route.ts
│   │       ├── resume/
│   │       │   ├── parse/route.ts
│   │       │   └── generate/route.ts
│   │       ├── cover-letter/
│   │       │   ├── scrape/route.ts
│   │       │   └── generate/route.ts
│   │       └── pdf/
│   │           └── generate/route.ts
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── resume/
│   │   │   ├── ResumeForm.tsx
│   │   │   ├── ResumePreview.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   └── InlineEditor.tsx
│   │   ├── cover-letter/
│   │   │   ├── CoverLetterForm.tsx
│   │   │   └── CoverLetterPreview.tsx
│   │   └── auth/
│   │       └── OtpModal.tsx
│   ├── lib/
│   │   ├── claude.ts              # Claude API client
│   │   ├── pdf.ts                 # Puppeteer PDF generation
│   │   ├── scraper.ts             # URL → JD text
│   │   ├── resume-parser.ts       # PDF/Word → JSON
│   │   ├── session.ts             # iron-session config
│   │   ├── usage.ts               # Rate limit logic
│   │   └── email.ts               # Resend OTP
│   ├── prompts/
│   │   ├── resume.ts              # Resume generation prompts
│   │   └── cover-letter.ts        # Cover letter prompts
│   ├── types/
│   │   ├── resume.ts              # Resume data types
│   │   └── cover-letter.ts
│   ├── i18n/
│   │   ├── messages/
│   │   │   ├── en.json
│   │   │   ├── zh-TW.json
│   │   │   └── zh-CN.json
│   │   └── routing.ts
│   └── test/
│       └── setup.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── templates/                 # 模板預覽圖
├── MASTER_SPEC.md
├── .env.example
└── .claude/
    └── CLAUDE.md
```

---

## 完成定義（Definition of Done）

一個功能算完成，必須：
- [ ] 通過 TypeScript 型別檢查（`npm run type-check`）
- [ ] 通過所有 unit / integration test（`npm test -- --run`）
- [ ] 手機（375px）和桌面（1280px）都正常顯示（RWD）
- [ ] 錯誤狀態有處理（API 失敗、網路錯誤、超出限流）
- [ ] 已 commit（conventional commits 格式）

---

## 版本記錄

| 版本 | 內容 | 狀態 |
|---|---|---|
| v1.0.0 | MVP：履歷生成、自薦信、3模板、PDF下載、Email OTP限流、中英雙語UI | 開發中 |
| v1.1.0 | Stripe 金流、用戶歷史記錄 | 計畫中 |
| v1.2.0 | LinkedIn 匯入、求職追蹤看板 | 計畫中 |

---

## 給新 Claude Session 的 Handoff 模板

```
## Context for This Session

Read MASTER_SPEC.md first before doing anything.

Project: JobPilot — AI resume & cover letter generator
Current branch: [branch name]
Current task: [describe the task]
Relevant files: [list files this session will touch]

Skills to apply:
- [database-dev / backend-dev / frontend-dev / feature-spec / debug-triage]
```

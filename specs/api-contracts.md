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
```

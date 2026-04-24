# Data Models

## Entity 關係

- User 1 → Many Resume
- User 1 → Many CoverLetter
- User 1 → Many UsageLog
- User 1 → Many Account (NextAuth OAuth)
- User 1 → Many Session (NextAuth)
- Resume 1 → Many CoverLetter (optional)

## Entities

```
User          id, name, email, emailVerified, image, plan, stripeCustomerId?, createdAt, updatedAt
Account       id, userId, provider, providerAccountId, tokens...  (NextAuth)
Session       id, sessionToken, userId, expires                   (NextAuth)
Resume        id, userId, title, content(Json), templateId, language, createdAt, updatedAt
CoverLetter   id, userId, resumeId?, jobTitle, jobDesc, content, wordCount, language, createdAt, updatedAt
UsageLog      id, userId, action, date(String "YYYY-MM-DD"), createdAt
```

## ResumeContent JSON 結構

```typescript
interface ResumeContent {
  personalInfo: { name, email, phone?, location?, linkedin?, website? }
  summary?: string
  experience: { company, title, startDate, endDate?, current, bullets[] }[]
  education:  { school, degree, field?, startDate, endDate?, gpa? }[]
  skills: string[]
  achievements?: string[]
}
```

## Enums

```prisma
enum Plan        { FREE, PRO }
enum WordCount   { SHORT, MEDIUM, LONG }   // ~150 / ~300 / ~500 words
enum UsageAction { GENERATE_RESUME, PARSE_PDF, GENERATE_COVER_LETTER }
```

## Template Model（已存在欄位 + 新增）

```
Template  id, name, description, category, thumbnailUrl?, referencePdfUrl?,
          referenceImageUrl?,   ← NEW: 上傳的 PNG 原始圖 S3 URL
          htmlDefinition(Json), ← { css, layout, sectionOrder }
          aiAnalysis(Json?),    ← NEW: Vision API 回傳的原始分析結果
          status,               ← NEW: 'draft' | 'active' | 'inactive'
          isActive(Boolean),    ← 保留向後兼容（status=active 時 isActive=true）
          sortOrder, createdAt, updatedAt
```

### TemplateDefinition JSON（htmlDefinition 欄位結構）

```typescript
interface TemplateDefinition {
  css: string               // 完整 CSS 字串，供 Puppeteer 渲染
  layout: 'single' | 'split'
  sectionOrder?: string[]   // ['summary','experience','education','skills','achievements']
}
```

### TemplateAiAnalysis JSON（aiAnalysis 欄位結構）

```typescript
interface TemplateAiAnalysis {
  layout: 'single' | 'split'
  primaryColor: string      // hex, e.g. "#1a2744"
  secondaryColor: string    // hex
  fontFamily: 'serif' | 'sans-serif'
  detectedSections: string[]
  confidence: number        // 0-1, AI 分析信心度
  rawPromptResponse: string // Claude 原始回覆（debug 用）
}
```

### Template Status Flow

```
上傳圖片 → AI 分析 → status='draft'（不顯示給用戶）
Admin 配置完成 → 點「發佈」→ status='active'（用戶可選）
Admin 停用 → status='inactive'
```

---

## 欄位命名規範

- ID 欄位：`id` (cuid)
- 外鍵：`{entity}Id`（camelCase）
- 時間：`createdAt`, `updatedAt`（Prisma @default(now()) / @updatedAt）
- 語系：`language` 存 `"zh"` 或 `"en"`
- 日期（UsageLog）：`date` 存 `"YYYY-MM-DD"` 字串，便於每日計數 group

---

## Task Status

### Pending

### Done

- [x] [template-import] DB: Template 新增 referenceImageUrl、aiAnalysis、status 欄位；migration ✅ 2026-04-24

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

## 欄位命名規範

- ID 欄位：`id` (cuid)
- 外鍵：`{entity}Id`（camelCase）
- 時間：`createdAt`, `updatedAt`（Prisma @default(now()) / @updatedAt）
- 語系：`language` 存 `"zh"` 或 `"en"`
- 日期（UsageLog）：`date` 存 `"YYYY-MM-DD"` 字串，便於每日計數 group

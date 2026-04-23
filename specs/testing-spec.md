# Testing Spec

## 測試策略

| 層級 | 工具 | 範圍 |
|---|---|---|
| Unit | Vitest | lib 函式、utility、schema 驗證 |
| Integration | Vitest + fetch mock | API route handlers |
| E2E | （Phase 2，Playwright）| 關鍵使用者流程 |

---

## 現有測試

| 檔案 | 測試項目 |
|---|---|
| `src/test/usage.test.ts` | `checkDailyLimit`、`recordUsage`、limit reset 邏輯 |

---

## Task Status

### Pending

- [ ] [Regression] Prisma CLI env 載入 — 確認 `npm run db:push / db:migrate / db:studio` 在只有 `.env.local` 的情況下不再出現 `DIRECT_URL not found`
- [ ] [Regression] Header 使用者頭像 — Google 登入後 Header 應顯示 Google 大頭貼；Email 註冊登入後應顯示預設 UserCircle icon；未登入不顯示頭像
- [ ] [Regression] Next.js 15 async params — Google OAuth callback 後不應出現 `params should be awaited` runtime error；`/[locale]` layout、`/api/cover-letter/[id]` GET/DELETE 皆需正常運作

- [ ] **[refactor/openai] Unit — `src/lib/ai.ts` enhanceResume()**
  Mock OpenAI client，呼叫 `enhanceResume('raw text', 'zh')`，驗證：
  - 呼叫 `chat.completions.create` 一次
  - system message 包含 ResumeContent schema 說明
  - 正確 parse JSON response → 回傳 ResumeContent

- [ ] **[refactor/openai] Unit — `src/lib/ai.ts` generateCoverLetter()**
  Mock OpenAI client，驗證：
  - 呼叫 `chat.completions.create` 一次
  - user message 包含 jobTitle、jobDesc、resumeText
  - 回傳純字串（非 JSON）

- [ ] **[refactor/openai] Integration — POST /api/resume/generate**
  Mock `src/lib/ai.ts` 的 `enhanceResume`，發送合法 body，驗證：
  - 回傳 200 `{ data: { resumeId, content } }`
  - resume 已寫入 DB
  - usage log 已新增一筆 GENERATE_RESUME

- [ ] **[refactor/openai] Integration — POST /api/cover-letter/generate**
  Mock `generateCoverLetter`，驗證：
  - 回傳 200 `{ data: { coverLetterId, content } }`
  - 429 when daily limit exceeded

### Done

- [x] `src/test/usage.test.ts` — checkDailyLimit / recordUsage / daily reset
- [x] `src/lib/ai.ts` 替換為 OpenAI gpt-4o-mini（type-check + existing tests pass）

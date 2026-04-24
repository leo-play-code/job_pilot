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

- [ ] [Regression] 詳細頁刪除履歷 — `/resume/[id]` 頁點「刪除」→ 確認 → 呼叫 DELETE API → 導向 `/dashboard`；取消後留在頁面
- [ ] [Regression] 詳細頁刪除自薦信 — `/cover-letter/[id]` 頁點「刪除」→ 確認 → 呼叫 DELETE API → 導向 `/dashboard`；取消後留在頁面
- [ ] [Regression] Dashboard 刪除履歷 — 點垃圾桶 → 確認 → 呼叫 `DELETE /api/resume/:id` → 項目從列表消失，不重載頁面；取消不刪除；API 失敗顯示錯誤文字
- [ ] [Regression] Dashboard 刪除自薦信 — 同上，呼叫 `DELETE /api/cover-letter/:id`
- [ ] [Regression] Dashboard 卡片緊湊 — ResumeList / CoverLetterList 的每個 item 高度明顯小於原 `p-4` 版本；兩欄仍對稱
- [ ] [Regression] 自薦信字數區分 — 選 SHORT(150)/MEDIUM(300)/LONG(500) 生成的自薦信長度應明顯不同，不再出現 300 與 500 字結果幾乎相同的情況；驗證 `MAX_TOKENS_MAP` 各值（450/900/1500）正確傳入 OpenAI API 的 `max_tokens`
- [ ] [Regression] Prisma CLI env 載入 — 確認 `npm run db:push / db:migrate / db:studio` 在只有 `.env.local` 的情況下不再出現 `DIRECT_URL not found`
- [ ] [Regression] Header 使用者頭像 — Google 登入後 Header 應顯示 Google 大頭貼；Email 註冊登入後應顯示預設 UserCircle icon；未登入不顯示頭像
- [ ] [Regression] Next.js 15 async params — Google OAuth callback 後不應出現 `params should be awaited` runtime error；`/[locale]` layout、`/api/cover-letter/[id]` GET/DELETE 皆需正常運作
- [ ] [Regression] Landing page session 感知 — 已登入用戶回到主頁應只看到「立即體驗」→ Dashboard；未登入才顯示「立即開始」和「登入」
- [ ] [Regression] LanguageSwitcher — 點 EN 後整頁切換為英文、點 中文 後切回中文；不需刷頁，URL 的 locale segment 同步更新
- [ ] [Regression] Dashboard i18n 完整性 — 切換到 EN 後，「My Documents」/「Resumes」/「Cover Letters」/「No resumes yet」/「uses remaining today」等所有 dashboard 字串應為英文，不應出現任何中文硬字串
- [ ] [Regression] 語言切換 URL 正確性 — 從 `/en/dashboard` 點「中文」應得到 `/zh/dashboard`，從 `/zh/dashboard` 點「EN」應得到 `/en/dashboard`，不應出現 `/zh/en/dashboard` 雙 locale 404 URL
- [ ] [Regression] 未登入 locale 感知跳轉 — 未登入訪問 `/en/dashboard`（或任何 `en` locale 受保護頁面）應被重導到 `/en/login`，而非 `/zh/login`

- [ ] [Regression] PDF 上傳 AI quota 耗盡 — 確認上傳 PDF 時 AI 呼叫失敗（503 ai_unavailable）不再回傳 500；前端應顯示可讀錯誤訊息而非空白失敗

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

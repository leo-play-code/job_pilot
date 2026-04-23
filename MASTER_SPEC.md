# MASTER_SPEC.md — JobPilot

AI 驅動的履歷與自薦信生成工具，讓求職者快速產出專業文件。

---

## 技術棧

| 層 | 技術 |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| 樣式 | Tailwind CSS + shadcn/ui |
| 資料庫 | PostgreSQL (Supabase) + Prisma ORM |
| Auth | NextAuth.js v5 (Email + Google OAuth) |
| AI | OpenAI API — gpt-4o-mini |
| PDF 生成 | Puppeteer (後端渲染) |
| PDF 解析 | pdf-parse |
| i18n | next-intl (zh / en) |
| 付款 | Stripe (Phase 2) |
| 部署 | Vercel |
| 測試 | Vitest + React Testing Library |

---

## 用戶角色

| 角色 | 說明 |
|---|---|
| Guest | 未登入，只能瀏覽 Landing Page |
| Free User | 已登入，每日 3 次 AI 操作 |
| Pro User | 已訂閱，無使用限制（Phase 2） |

---

## 核心功能（MVP）

1. **Email + Google 登入 / 註冊**
2. **從零建立履歷**：4 步驟表單 → AI 潤飾內容 → 選模板 → 下載 PDF
3. **上傳 PDF 建立履歷**：解析現有履歷 → 用戶確認編輯 → 套模板生成
4. **自薦信生成**：選履歷 + 貼職缺 JD → 選字數（短/中/長）→ 生成
5. **每日使用限制**：Free 用戶 3 次（生成履歷、解析 PDF、生成自薦信共用）
6. **中英雙語**：UI 與內容分開設定語系，Header 右上角可即時切換，所有頁面文字須完整覆蓋 `zh.json` / `en.json`

---

## Definition of Done

- [ ] 所有功能可在 Vercel Preview URL 操作
- [ ] `npm run type-check` 無錯誤
- [ ] `npm test -- --run` 全部通過
- [ ] 中英文 UI 完整，無遺漏翻譯字串（`zh.json` 與 `en.json` 的 key 一一對應）
- [ ] 語言切換後整頁即時更新（不需刷新）
- [ ] Free 用戶第 4 次操作觸發升級提示
- [ ] PDF 下載內容與預覽一致

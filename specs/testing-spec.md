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
| `src/test/clear-all.test.ts` | `DELETE /api/resume`、`DELETE /api/cover-letter` 清除全部 |
| `src/test/raw-import.test.ts` | `POST /api/resume/import-raw`、`GET /api/resume/:id/raw-pdf`、cover letter rawText context |

---

## Task Status

### Pending

- [x] [auto-apply-area] Unit — `src/lib/104-area-codes.ts`：驗證每個縣市都有對應行政區、area code 格式為 10 位數字字串（completed: 2026-04-26）
- [x] [auto-apply-area] Integration — `POST /api/job-search/config`：subLocationCodes + coverLetterIndex 儲存正確；`POST /api/auto-apply/batch`：有 subLocationCodes 時 area 參數使用 subLocationCodes 而非 locationCodes（completed: 2026-04-26）
- [ ] [auto-apply-apply] Unit — `applyTo104Job()` coverLetterIndex 邏輯：mock Puppeteer page，驗證 PLATFORM_DEFAULT 時有嘗試點載入自薦信按鈕

- [ ] [Regression] SearchConfigForm 薪資範圍留空可儲存 — 薪資最低 / 最高欄位皆不填寫時，點「儲存設定」不應觸發 Zod validation error；表單應成功提交，payload 中 salaryMin / salaryMax 為 undefined
- [ ] [Regression] POST /api/job-search/config 多縣市全選行政區可儲存 — 選取 3 個以上縣市並勾選「全部區」（subLocationCodes 超過 50 個）時，POST config 應回傳 200；確認後端 schema 上限為 500
- [ ] [Regression] search104Jobs 非 JSON 回應拋出清晰錯誤 — mock fetch 回傳 200 OK 但 Content-Type: text/html；確認 search104Jobs 拋出含 "non-JSON" 的 Error 而非 SyntaxError；batch route 應回傳 503 而非 500
- [ ] [Regression] search104Jobs 改用 Puppeteer 成功取得 JSON — mock Puppeteer page.waitForResponse 回傳含 `{ data: { list: [] } }` 的 response；確認 search104Jobs 回傳正確結構，不再因 bot 偵測拿到 HTML
- [ ] [Regression] 104-api.ts 無 Puppeteer import — 確認 `src/lib/104-api.ts` 不含任何 `puppeteer` import；client component 引用 `TAIWAN_AREA_CODES` 不會觸發 `Module not found: Can't resolve 'fs'` build error
- [x] [Regression] batch route 登入優先於搜尋 — mock `login104`、`search104JobsWithPage`、`applyJobWithPage`；確認呼叫順序為 login → search → apply；login 失敗時回傳 400 `invalid_credentials`，不進入搜尋階段；搜尋返回空陣列時回傳 200 `message: '未找到符合條件的職缺'`（completed: 2026-04-26）
- [x] [Regression] login104 改為兩步驟登入（signin.104.com.tw）— `/member/login/` 不存在；新策略：goto `https://login.104.com.tw/login`（跳轉到 signin.104.com.tw）→ 填 `#identity`（帳號/Email）→ 點「下一步」→ 等 `input[type="password"]:not([name="fakeInput"])` 出現 → 填密碼 → 再點「下一步」→ 等 URL 離開 signin/login domain（completed: 2026-04-26）
- [ ] [Regression] login104 兩步驟完整登入流程 — mock `page.goto`、`page.waitForSelector`、`page.waitForFunction`、`page.click`、`page.type`；確認 goto URL 為 `https://login.104.com.tw/login`；確認 `#identity` 填入 email；確認填入 password 到 `input[type="password"]:not([name="fakeInput"])`；確認 `page.keyboard.press('Enter')` 被呼叫兩次（步驟一送出帳號、步驟二送出密碼）
- [ ] [Regression] login104 密碼步驟 Enter 送出 — 填完密碼後不呼叫 btn?.click()（避免靜默失敗）；確認使用 `keyboard.press('Enter')` 提交；login 失敗不應 silently no-op，應拋出 timeout error 讓 caller 捕捉
- [ ] [Regression] verify104Session 用 URL 判斷而非 DOM selector — mock `page.goto` 回傳；確認導覽至 `pda.104.com.tw/applyRecord`；URL 含 `signin.104` 時回傳 false；URL 為 pda.104 時回傳 true；不應使用 `page.$` 查找 DOM 元素
- [ ] [Regression] search104JobsWithPage 不依賴 UI selector 直接取得搜尋結果 — mock `page.goto` 立即 resolve、mock `page.waitForResponse` 回傳含 `{ data: { list: [], totalPage: 1 } }` 的 JSON response；確認 `page.waitForSelector` **未被呼叫**（舊的 `.nav-search-btn` 流程已移除）；確認 `page.click` **未被呼叫**；確認 `waitForResponse` 在 `page.goto` 之前設定以避免 race condition；確認函式回傳正確 JSON 結構
- [ ] [Regression] search104JobsWithPage 非 JSON 回應拋出清晰錯誤 — mock `waitForResponse` 回傳 content-type: text/html；確認 `search104JobsWithPage` 拋出含 "non-JSON" 的 Error；batch route 第 1 頁失敗回傳 503 `search_unavailable`
- [ ] [Regression] batch route 多頁搜尋 — mock `search104JobsWithPage` 第 1 頁回 20 筆 totalPage=3；確認 `search104JobsWithPage` 被呼叫多次（至少 2 次）直到 newListings >= maxApplyCount

- [x] [auto-apply-area-select-all] Unit — `SearchConfigForm` 全部區 checkbox：render 台北市行政區列表（12 個 district）；點「全部區」→ 所有 12 個 checkbox checked；再點「全部區」→ 全部 unchecked；手動勾選全部 12 個 → 「全部區」自動 checked；取消 1 個 → 「全部區」indeterminate ✅ 2026-04-26
- [x] [auto-apply-area-select-all] Regression — 切換縣市後「全部區」狀態重置：先選台北市並勾選「全部區」→ 切換至台中市 → 「全部區」應為 unchecked（台中市行政區均未選）✅ 2026-04-26

- [x] [stripe-subscription] Unit — `checkDailyLimit()` PRO bypass：plan=PRO 時直接回傳 `{ allowed: true }`，不查 UsageLog（completed: 2026-04-25）
- [x] [stripe-subscription] Integration — `POST /api/stripe/webhook` checkout.session.completed：mock Stripe `constructEvent`，payload 含 customer + subscription → 驗 DB user.plan=PRO、stripeSubscriptionId 已寫入（completed: 2026-04-25）
- [x] [stripe-subscription] Integration — `POST /api/stripe/webhook` customer.subscription.deleted：驗 DB user.plan=FREE、stripeSubscriptionId=null（completed: 2026-04-25）
- [x] [stripe-subscription] Integration — `GET /api/user/subscription`：Free 用戶回 `{ plan:'FREE', hasActiveSubscription:false }`；Pro 用戶回 `{ plan:'PRO', hasActiveSubscription:true, currentPeriodEnd: <ISO string> }`（completed: 2026-04-25）
- [x] [stripe-subscription] Integration — `POST /api/stripe/create-checkout-session`：未登入 → 401；已登入 → 呼叫 Stripe mock → 回傳 checkoutUrl（completed: 2026-04-25）

- [x] [Regression] AWS S3 模板縮圖域名允許 — 確認 `next.config.ts` 的 `remotePatterns` 含 `*.s3.amazonaws.com` 和 `*.s3.*.amazonaws.com`；訪問 `job-pilot-assets.s3.ap-northeast-1.amazonaws.com` 圖片 URL 不拋出 `hostname not configured` 錯誤（completed: 2026-04-25）
- [x] **[ux-feedback] Unit — `LoadingButton` 元件**：render `<LoadingButton isLoading={false}>`，驗證按鈕可點擊；`isLoading={true}` 時按鈕 disabled、className 含 `animate-spin`（Loader2）（completed: 2026-04-25）
- [x] **[ux-feedback] Regression — PDF 下載 loading state**：`ResumeActions` render，mock `fetch` 延遲回傳 200 blob；點「下載 PDF」後按鈕應立刻進入 disabled 狀態；fetch resolve 後 disabled 解除（completed: 2026-04-25）
- [x] **[ux-feedback] Regression — PDF 下載錯誤 toast**：mock `fetch` 回傳 500；點「下載 PDF」後應呼叫 `toast.error()`（mock sonner）（completed: 2026-04-25）
- [x] **[ux-feedback] Regression — Providers 包含 NextTopLoader + Toaster**：讀取 `src/components/shared/Providers.tsx` 原始碼，驗證包含 `NextTopLoader` 和 `Toaster`（completed: 2026-04-25）
- [x] **[perf] Unit — `BlurImage` loaded 狀態**：render `<BlurImage src="..." alt="..."/>`，驗證初始 className 含 `blur`；模擬 `onLoad` 後 className 不含 `blur`，含 `scale-100`（completed: 2026-04-25）
- [x] **[perf] Regression — Admin templates 縮圖 blur-up**：`/admin/templates` 有 thumbnailUrl 的模板卡片，DOM 中 `<img>` 出現時應有 blur className；`next/image` 不報 `hostname not allowed`（completed: 2026-04-25）
- [x] **[perf] Regression — Supabase 圖片域名允許**：`next.config.ts` 的 `remotePatterns` 含 `*.supabase.co`；訪問 S3 圖片 URL 不出現 Next.js image 域名錯誤（completed: 2026-04-25）
- [x] **[admin-db] Integration — `GET /api/admin/resumes`** — admin session；DB 有 2 筆不同用戶的 Resume；驗證回傳 `{ data: { resumes: [...], total: 2 } }`；resume 物件含 userEmail；非 admin → 403；search query 只回符合 title 的記錄（completed: 2026-04-25）
- [x] **[admin-db] Integration — `DELETE /api/admin/resumes/:id`** — admin session；刪除後 DB 筆數 -1；相關 CoverLetter.resumeId 設為 null；非 admin → 403；不存在 id → 404（completed: 2026-04-25）
- [x] **[admin-db] Integration — `GET /api/admin/cover-letters`** — admin session；DB 有 2 筆；驗證回傳含 userEmail；非 admin → 403（completed: 2026-04-25）
- [x] **[admin-db] Integration — `DELETE /api/admin/cover-letters/:id`** — admin session；刪除後 DB 筆數 -1；非 admin → 403（completed: 2026-04-25）
- [x] **[admin-db] Integration — `GET /api/admin/usage-logs`** — admin session；DB 有 3 筆 log；驗證回傳含 userEmail + action；action query 篩選只回對應 action；非 admin → 403（completed: 2026-04-25）
- [x] **[pagination] Unit — `Pagination` 元件 Smart Ellipsis** ✅ 2026-04-25 — totalPages=10, currentPage=5 → [1, ..., 4, 5, 6, ..., 10]；totalPages=1 → return null
- [x] **[pagination] Unit — `Pagination` 點擊頁碼** ✅ 2026-04-25 — 點第 3 頁 → `onPageChange(3)` 被呼叫；prev/next disabled 狀態驗證
- [x] **[pagination] Integration — `GET /api/resume?page=1&limit=6`** ✅ 2026-04-25 — DB 有 8 筆；page=1 回 6，total=8，totalPages=2；page=2 skip=6
- [x] **[pagination] Integration — `GET /api/cover-letter?page=1&limit=6`** ✅ 2026-04-25 — 同上邏輯；backward compat 驗證
- [x] **[pagination] Integration — `GET /api/templates?page=1&limit=6`** ✅ 2026-04-25 — DB 有 8 筆 active 模板；status=active 篩選驗證；backward compat 驗證
- [x] **[pagination] Regression — Dashboard ResumeList 換頁** ✅ 2026-04-25 — 9 resumes；初始 6 筆；Next page → 3 筆；page 2 顯示 Resume 7
- [x] **[pagination] Regression — ResumeList Edit Mode 隱藏 Pagination** ✅ 2026-04-25 — Edit Mode → Pagination 消失、全部 9 個 checkbox 顯示
- [ ] **[pagination] Regression — AdminTemplatesPage 換頁** — render 頁面 with 9 個 mock templates；初始只渲染 6 個；Next page → 顯示第 7-9 個；切換 statusFilter → page 重置為 1
- [x] **[admin-users] Integration — `DELETE /api/admin/users/:id`** ✅ 2026-04-25 — admin session；DB 有 user + 2 resumes + 1 cover letter + 1 usage log；刪除後驗 user 不存在、resumes 全刪、cover letters 全刪、usage logs 全刪；回傳 `{ data: { ok: true, deletedEmail } }`；非 admin → 403；刪自己 → 400；不存在 id → 404
- [ ] **[admin-users] Regression — AdminDashboardPage 刪除按鈕** — admin 自己的列「刪除」按鈕應為 disabled；其他使用者的「刪除」按鈕 enabled；點擊後 confirm → 呼叫 DELETE API → 從 filtered 列表移除
- [ ] [Regression] UserAvatarDropdown 點擊不出現黑色 focus ring — trigger 按鈕 className 必須只有 `outline-none`，不含 `focus-visible:ring-2`；點擊後不顯示任何外框
- [ ] [Regression] UserAvatarDropdown 同頁導航不觸發 spinner — 點選當前所在頁面的選單項目時，`navigate()` 應跳過 `setNavigatingTo`（目標 pathname === 當前 pathname），spinner 不出現
- [ ] [Regression] UserAvatarDropdown Safety timeout 兜底 — `navigatingTo` 非 null 時，3000ms 後自動 `setNavigatingTo(null)`，避免 spinner 永久卡住
- [ ] [Regression] UserAvatarDropdown 導航後 spinner 自動停止 — 點選導航 item 後 spinner 啟動；pathname 變更後（useEffect 偵測）spinner 應重置為 null，不再永久旋轉
- [ ] [Regression] UserAvatarDropdown 登出 loading — 點「登出」後 dropdown 保持開啟、顯示「登出中…」spinner；`signOut()` 被呼叫；`isLoggingOut=true` 期間 trigger 按鈕 disabled
- [ ] [Regression] UserAvatarDropdown 導航 item loading — 點「個人設定」後該 item icon 切換為 Loader2；trigger ChevronDown 切換為 Loader2
- [x] [Regression] UserAvatarDropdown 點數餘額路由 — 「點數餘額」item 導向路徑為 `/settings/credits`，不再與「個人設定」（/settings）重複，且不含 `?tab=credits` query string（completed: 2026-04-25）
- [x] [Regression] settings 頁不再顯示點數餘額 — `settings/page.tsx` DOM 中不得包含 Coins icon 或「點數餘額」heading；只顯示「個人資料」與「帳單與訂閱」兩個 section（completed: 2026-04-25）
- [x] [Regression] `/settings/credits` 頁顯示點數 — 頁面正確 fetch `/api/user/me` 並顯示 `credits` 數字；格式「N 點」（completed: 2026-04-25）
- [ ] **[usage-logs-search] Integration — `GET /api/admin/usage-logs?search=`** — admin session；DB 有 2 筆不同 email 的 log；`?search=alice` 只回 alice 的記錄；`?search=` 空字串回全部；非 admin → 403
- [ ] [Regression] Google 登出再登入不應 AdapterError — 確認 Google OAuth callback 不拋出 `The column users.stripeCustomerId does not exist`；DB 需含 paddleCustomerId 等 Paddle 欄位且 Prisma client 已同步；重現條件：migration `20260425000001_migrate_stripe_to_paddle` 未套用或 `prisma generate` 未執行

- [ ] [Regression] Paddle buy-credits 使用正確的 Price ID — 確認 `PADDLE_CREDIT_PACK_*_PRICE_ID` 環境變數的值以 `pri_` 開頭（Price ID），而非 `pro_`（Product ID）；呼叫 `POST /api/paddle/buy-credits` 傳入合法 packId 應回傳 `{ data: { transactionId: string } }`，不得拋出 Paddle `bad_request` 錯誤

- [ ] [Regression] Paddle checkout successUrl 跟隨當前環境 — 確認 `paddle.Checkout.open()` 的 `successUrl` 使用 `window.location.origin`，不得硬編碼 `NEXT_PUBLIC_APP_URL`；本地開發時 successUrl 應為 `http://localhost:3000/zh/pricing?credits_success=true`，不得跳轉至 Vercel 網域

- [ ] [Regression] 點數購買後主動驗證補發 — 確認 `GET /zh/pricing?credits_success=true&txn=<id>` 頁面載入後自動呼叫 `POST /api/paddle/verify-transaction`；mock Paddle API 回傳 completed transaction，驗 DB credits 增加正確點數；同一 txn 重複呼叫不得重複加點（idempotency）

- [ ] [Regression] verify-transaction 安全性 — 確認 `POST /api/paddle/verify-transaction` 未登入 → 401；transaction 的 customData.userId 與登入者不符 → 403；transaction status 非 completed → 400

- [ ] [Regression] CreditsBadge 點數連結不重複 locale 前綴 — 在 `/zh` 頁面點擊右上角點數 badge，URL 應為 `/zh/settings/credits`，不得出現 `/zh/zh/settings/credits`；確認 Header 的 Link 使用 `href="/settings/credits"`（無手動 locale 前綴）

- [ ] [Regression] UserAvatarDropdown 導航路徑不重複 locale — 點選「點數餘額」後 URL 為 `/zh/settings/credits`；點選「個人設定」後 URL 為 `/zh/settings`；確認所有 navigate() 呼叫已改用 `@/i18n/navigation` router，路徑不含手動 locale 前綴

- [ ] [Regression] Header 點數 badge 與 /settings/credits 頁同步 — admin 在後台修改用戶點數後，用戶進入 /settings/credits 頁應顯示最新值；右上角 CreditsBadge 應在同次頁面訪問後立即顯示相同數字，不得出現兩邊不一致的情況（確認 `useCreditsBalance` staleTime=0 且兩個地方共用同一 React Query cache key）

- [ ] [credits-live-update] Unit — `useCreditsBalance` hook：mock fetch，驗回傳 credits 數字；fetch 非 200 時回傳 null；queryKey 為 `['credits', 'balance']`
- [ ] [credits-live-update] Integration — Paddle checkout.completed 後點數即時更新：mock `paddle.Checkout.open` 觸發 eventCallback；驗 `invalidateQueries` 被呼叫；驗 verify-transaction API 被 POST；驗 badge 最終顯示新點數
- [ ] [Regression] CreditsBadge 跨頁導航後即時更新 — 初始顯示 0 點數，模擬 pathname 改變後，badge 應重新 fetch 並顯示 120；API 回 401/500 時 badge 應保持隱藏（不顯示 0）
- [ ] [Regression] 點數購買後 CreditsBadge 即時更新 — 購買後 `checkout.completed` 事件觸發，`verify-transaction` 成功時直接以回傳的 `credits` 更新 React Query cache；verify 失敗時輪詢 `/api/credits/balance` 每 2 秒直到 `newCredits > snapshot`；badge 顯示數字不再需要手動刷新頁面
- [ ] [Regression] 點數購買期間 beforeunload 阻擋 — `paddle.Checkout.open` 後 `beforeunload` listener 掛上，關閉視窗會出現離開確認；`checkout.closed`（取消）移除阻擋；`checkout.completed` 後阻擋持續到 credits 確認更新才解除

- [ ] [Regression] Admin 使用者列表初始載入顯示點數 — `GET /api/admin/users` 回傳的每個 user 物件必須包含 `credits` 欄位；確認不需要觸發 plan 更新即可看到所有用戶的點數數字

- [ ] [Regression] CreditsBadge 30 秒輪詢自動更新 — `useCreditsBalance` 的 `refetchInterval` 為 30000；mock `fetch` 第一次回 50、第二次回 80；等待 30 秒後 badge 自動顯示 80，不需要任何用戶操作
- [ ] [Regression] Admin 改自己點數後 badge 立即更新 — 在 AdminDashboardPage 中，當 `patchUser(currentUserId, { credits: 999 })` 成功後，`queryClient.invalidateQueries` 應立即被呼叫（queryKey = CREDITS_QUERY_KEY）；badge 不需等 30 秒輪詢即顯示新點數
- [ ] [Regression] PRO 訂閱購買使用 overlay 而非整頁跳轉 — `handleCheckout` 呼叫 `paddle.Checkout.open({ transactionId })`，`window.location.href` 不再被呼叫；完成後輪詢 `GET /api/user/subscription` 直到 `plan=PRO`；不得出現 `?_ptxn=` 根路徑跳轉
- [ ] [Regression] subscription.created webhook 無 customData 仍升級 PRO — mock Paddle webhook `subscription.created` 事件，`customData` 為 null、`customerId = 'ctm_existing'`；DB 有 user 的 `paddleCustomerId = 'ctm_existing'`；驗 `prisma.user.update` 被呼叫且 `data.plan = 'PRO'`
- [ ] [Regression] transaction.completed 訂閱付款更新 plan — mock `transaction.completed` 事件，`customData = { userId: 'u1' }`、`subscriptionId = 'sub_123'`；驗 `prisma.user.update` 被呼叫且 `data.plan = 'PRO'` 且 `paddleSubscriptionId = 'sub_123'`
- [ ] [Regression] verify-subscription 不依賴 webhook 直接升級 PRO — mock `paddle.transactions.get` 回傳 completed 且含 `subscriptionId`；mock `paddle.subscriptions.get` 回傳 billing period；驗 `prisma.user.update` 被呼叫且 `plan = 'PRO'`；回傳 200 `{ data: { plan: 'PRO', hasActiveSubscription: true } }`
- [ ] [Regression] verify-subscription 安全性 — 未登入 → 401；`customData.userId` ≠ 當前 user → 403；`transaction.status !== 'completed'` → 400；`subscriptionId` 為空 → 400
- [ ] [Regression] PRO 購買後 plan 即時更新（不依賴 webhook）— `checkout.completed` 後呼叫 `verify-subscription`；mock Paddle API 回傳含 subscriptionId 的 completed transaction；驗 `setSubscription` 以 `plan='PRO'` 更新；pricing 頁顯示「目前方案」而非「升級」按鈕
- [ ] [Regression] PRO 升級後 session 即時刷新 — `verify-subscription` 成功後呼叫 `updateSession()`；JWT callback 的 `trigger === 'update'` 分支從 DB 重讀 `plan`；UserAvatarDropdown 立即顯示 Pro badge（amber）而非 FREE；不需要重新登入或刷新頁面
- [ ] [Regression] UserAvatarDropdown plan badge 來自 session — session.user.plan = 'PRO' 時 dropdown 顯示 amber badge「Pro」；plan = 'FREE' 時顯示 muted 灰色 'FREE' 並顯示「升級 Pro」選項
- [ ] [Regression] UserAvatarDropdown 顯示 live plan（不依賴 stale JWT）— mock `GET /api/user/subscription` 回傳 `plan='PRO'`；即使 `session.user.plan='FREE'`，dropdown 應顯示 amber Pro badge 且不顯示「升級 Pro」選項
- [ ] [Regression] JWT 自動同步 DB plan — 模擬 user 已登入（JWT plan='FREE'），DB 更新 plan='PRO'，接著觸發 JWT 刷新（`update()` 或 session refetch）；驗 JWT callback 的 `else if (token.id)` 分支從 DB 讀取 plan='PRO'；session.user.plan 變成 'PRO'
- [ ] [Regression] LanguageSwitcher 不允許重複點擊當前語言 — 已在中文頁面時，「中文」按鈕應為 disabled 且 cursor-default；已在英文頁面時，「EN」按鈕應為 disabled；點擊 disabled 按鈕不觸發任何導航

- [ ] [Regression] Pricing 頁已登入用戶點「繼續免費使用」不應跳轉登入 — 已登入 Free 用戶進入 /pricing，Free Card CTA 應顯示「目前方案」disabled 按鈕，點擊不跳轉至 /login；subscription 資料載入前應顯示 skeleton 而非 login link

- [ ] [Regression] 原始 PDF 履歷排版保留 — 確認 raw import 上傳 PDF 後，詳細頁顯示的是嵌入 PDF iframe（`RawPdfView`）而非純文字 `RawTextView`；`rawPdfUrl` 非空時 `ResumeEditorClient` 必須優先渲染 `RawPdfView`

- [ ] [Regression] Prisma client rawPdfUrl 欄位缺失 — 確認 `prisma.resume.findMany()` 的 `select` 包含 `rawPdfUrl: true` 時不拋出 `PrismaClientValidationError`；新增欄位後必須執行 `npx prisma generate` 才能讓 client types 同步

- [ ] [Regression] credits 欄位 Prisma runtime 同步 — 確認 `GET /api/user/me` 在 `prisma.user.findUnique()` select `credits: true` 時不拋出 `PrismaClientValidationError`；觸發條件：`prisma db push` 時 dev server 持有 DLL 鎖導致 module cache 未更新，重啟 dev server 後必須恢復正常

- [ ] [Regression] Stripe 欄位 Prisma Client 同步 — 確認 `GET /api/user/subscription` 在 select `stripeCurrentPeriodEnd` 時不拋出 `PrismaClientValidationError`；修復方法：停止 dev server → `npx prisma generate` → 重啟 dev server

- [ ] [Regression] settings 頁 API 錯誤處理 — 確認 `GET /api/user/me` 回傳非 200 時，settings 頁不拋出 `Unexpected end of JSON input`；`fetch` 必須在 `.json()` 前先檢查 `r.ok`

- [ ] **[raw-import] E2E — 完整匯入流程（pending，不實作）**
  登入 → /resume/upload → 切 "直接匯入" tab → 上傳 PDF → 填標題 → 儲存
  → dashboard 出現「原始」badge → 進詳細頁看到「下載原始 PDF」按鈕
  → 點擊成功下載

- [x] [resume-preview] Integration — `GET /api/resume/:id/preview-html` ✅ 2026-04-25
  已登入 user，DB 有 1 筆 Resume（built-in modern 模板），呼叫 endpoint，驗證：
  - 回傳 200 `{ data: { html: string } }`
  - html 包含 resume 的 personalInfo.name
  - html 包含 `<style>` 標籤（CSS 已注入）
  - 對非擁有者回傳 403
  - 對 DB 自定模板（custom templateId）正確套用該模板的 CSS

- [ ] [resume-preview] E2E — Resume 全版面預覽
  登入 → Dashboard → 點開履歷 → 預設看到 iframe 預覽（不是空白或 Tailwind 元件）→
  iframe 高度 ≈ 1123 * scale；點「編輯版面」進入 edit → 修改文字 → 儲存 → 自動切回預覽 → 名字更新顯示

- [ ] [Regression] AI 模板生成 500 — 確認 `POST /api/admin/templates/generate` 在 GPT-4o 回傳接近 4096 token 的回應時不再因 JSON truncation 拋出 SyntaxError；兩批次並行呼叫皆成功並合併結果
- [ ] [Regression] AI 模板生成「no valid templates」— 確認 `generateTemplateCSS` 不再因 CSS 中的雙引號 font-family 破壞 JSON 格式而全數失敗；改用 raw text 輸出後，至少 8/10 個模板 css 字串長度 > 80 chars

- [ ] 詳細頁刪除履歷 — `/resume/[id]` 頁點「刪除」→ 確認 → 呼叫 DELETE API → 導向 `/dashboard`；取消後留在頁面
- [ ] [Regression] 詳細頁刪除自薦信 — `/cover-letter/[id]` 頁點「刪除」→ 確認 → 呼叫 DELETE API → 導向 `/dashboard`；取消後留在頁面
- [ ] [Regression] Dashboard 刪除履歷 — 點垃圾桶 → 確認 → 呼叫 `DELETE /api/resume/:id` → 項目從列表消失，不重載頁面；取消不刪除；API 失敗顯示錯誤文字
- [ ] [Regression] Dashboard 刪除自薦信 — 同上，呼叫 `DELETE /api/cover-letter/:id`
- [ ] [Regression] Dashboard 卡片緊湊 — ResumeList / CoverLetterList 的每個 item 高度明顯小於原 `p-4` 版本；兩欄仍對稱
- [ ] [Regression] 自薦信字數區分 — 選 SHORT(150)/MEDIUM(300)/LONG(500) 生成的自薦信長度應明顯不同，不再出現 300 與 500 字結果幾乎相同的情況；驗證 `MAX_TOKENS_MAP` 各值（450/900/1500）正確傳入 OpenAI API 的 `max_tokens`
- [ ] [Regression] Admin 新增模板導向 — 在 `/zh/admin/templates` 點「新增模板」不再 404，應正確導向 `/zh/admin/templates/new`；確認使用 `@/i18n/navigation` 的 Link/useRouter 而非 `next/link`
- [ ] [Regression] 模板匯入精靈即時預覽 — Step 2 預覽應使用 `<iframe srcdoc>` 注入 AI 生成 CSS，不得使用 `ResumeRenderer`（Tailwind template）；上傳相同圖片後左右欄的配色和版型應明顯相似
- [ ] [Regression] 模板匯入精靈主色 picker — 拖動 color picker 後 `<iframe>` 預覽中的 sidebar/header 顏色應即時更新；只有原 primaryColor 被替換，其他 hex（文字色、邊框色）不受影響

- [x] **[template-import] Unit — `src/lib/template-vision.ts` analyzeTemplateImage()** ✅ 2026-04-25
  Mock OpenAI client（實際使用 OpenAI gpt-4o），傳入 PNG Buffer，驗證：
  - 呼叫 `chat.completions.create` 一次，model 包含 gpt-4o
  - content 中有 `image_url` type block（base64 encoded）
  - 正確 parse JSON 回傳 `{ layout, primaryColor, css, detectedSections }`
  - Vision API 失敗時 throw `TemplateVisionError`

- [ ] **[template-import] Unit — PDF 轉 PNG 工具**
  傳入合法 PDF Buffer，驗證：
  - 回傳 Buffer（PNG 格式）
  - 尺寸為 794×1123（A4 比例）

- [x] **[template-import] Integration — POST /api/admin/templates/import（PNG 上傳）** ✅ 2026-04-25
  Mock `analyzeTemplateImage`，以 multipart 上傳 PNG，驗證：
  - 非 admin 回傳 403
  - 合法 PNG → 200，回傳 `{ templateId, analysis, htmlDefinition }`
  - DB 新增 Template 記錄，status='draft', isActive=false
  - S3 上傳被呼叫（mock `uploadToS3`）

- [ ] **[template-import] Integration — POST /api/admin/templates/import（PDF 上傳）**
  Mock PDF 轉 PNG + `analyzeTemplateImage`，驗證：
  - PDF 正確觸發 Puppeteer 截圖流程
  - 最終回傳與 PNG 流程相同結果

- [x] **[template-import] Integration — PATCH /api/admin/templates/:id（status 發佈）** ✅ 2026-04-25
  draft Template 存在，PATCH `{ status: 'active' }`，驗證：
  - DB 中 status='active', isActive=true
  - 回傳 200 `{ data: updatedTemplate }`

- [ ] **[template-import] E2E — 完整匯入流程**
  Admin 登入 → `/admin/templates/import` → 上傳 PNG → 等待分析 → 看到左圖右預覽 →
  拖曳調整區塊順序 → 填寫名稱/分類 → 點「發佈」→ 導向 `/admin/templates` →
  新模板出現在列表（非草稿）→ 用戶建立履歷時可在 TemplateSelector 看到新模板
- [ ] [Regression] Prisma CLI env 載入 — 確認 `npm run db:push / db:migrate / db:studio` 在只有 `.env.local` 的情況下不再出現 `DIRECT_URL not found`
- [ ] [Regression] Header 使用者頭像 — Google 登入後 Header 應顯示 Google 大頭貼；Email 註冊登入後應顯示預設 UserCircle icon；未登入不顯示頭像
- [ ] [Regression] Next.js 15 async params — Google OAuth callback 後不應出現 `params should be awaited` runtime error；`/[locale]` layout、`/api/cover-letter/[id]` GET/DELETE 皆需正常運作
- [ ] [Regression] Landing page session 感知 — 已登入用戶回到主頁應只看到「立即體驗」→ Dashboard；未登入才顯示「立即開始」和「登入」
- [ ] [Regression] LanguageSwitcher — 點 EN 後整頁切換為英文、點 中文 後切回中文；不需刷頁，URL 的 locale segment 同步更新
- [ ] [Regression] Dashboard i18n 完整性 — 切換到 EN 後，「My Documents」/「Resumes」/「Cover Letters」/「No resumes yet」/「uses remaining today」等所有 dashboard 字串應為英文，不應出現任何中文硬字串
- [ ] [Regression] 語言切換 URL 正確性 — 從 `/en/dashboard` 點「中文」應得到 `/zh/dashboard`，從 `/zh/dashboard` 點「EN」應得到 `/en/dashboard`，不應出現 `/zh/en/dashboard` 雙 locale 404 URL
- [ ] [Regression] 未登入 locale 感知跳轉 — 未登入訪問 `/en/dashboard`（或任何 `en` locale 受保護頁面）應被重導到 `/en/login`，而非 `/zh/login`

- [ ] [Regression] PDF 上傳 AI quota 耗盡 — 確認上傳 PDF 時 AI 呼叫失敗（503 ai_unavailable）不再回傳 500；前端應顯示可讀錯誤訊息而非空白失敗

- [x] **[refactor/openai] Unit — `src/lib/ai.ts` enhanceResume()** ✅ 2026-04-25
  Mock OpenAI client，呼叫 `enhanceResume('raw text', 'zh')`，驗證：
  - 呼叫 `chat.completions.create` 一次
  - system message 包含 ResumeContent schema 說明
  - 正確 parse JSON response → 回傳 ResumeContent

- [x] **[refactor/openai] Unit — `src/lib/ai.ts` generateCoverLetter()** ✅ 2026-04-25
  Mock OpenAI client，驗證：
  - 呼叫 `chat.completions.create` 一次
  - user message 包含 jobTitle、jobDesc、resumeText
  - 回傳純字串（非 JSON）

- [x] **[refactor/openai] Integration — POST /api/resume/generate** ✅ 2026-04-25
  Mock `src/lib/ai.ts` 的 `enhanceResume`，發送合法 body，驗證：
  - 回傳 200 `{ data: { resumeId, content } }`
  - resume 已寫入 DB
  - usage log 已新增一筆 GENERATE_RESUME

- [x] **[refactor/openai] Integration — POST /api/cover-letter/generate** ✅ 2026-04-25
  Mock `generateCoverLetter`，驗證：
  - 回傳 200 `{ data: { coverLetterId, content } }`
  - 429 when daily limit exceeded

- [x] **[clear-all] Integration — DELETE /api/resume（清除所有履歷）** ✅ 2026-04-24
  已登入 user，DB 有 2 筆 Resume，呼叫 `DELETE /api/resume`，驗證：
  - 回傳 200 `{ data: { deletedCount: 2 } }`
  - DB 中該 user 的 Resume 歸零（其他 user 不受影響）
  - 未登入回傳 401

- [x] **[clear-all] Integration — DELETE /api/cover-letter（清除所有自薦信）** ✅ 2026-04-24
  已登入 user，DB 有 3 筆 CoverLetter，呼叫 `DELETE /api/cover-letter`，驗證：
  - 回傳 200 `{ data: { deletedCount: 3 } }`
  - DB 中該 user 的 CoverLetter 歸零（其他 user 不受影響）
  - 未登入回傳 401

- [x] **[edit-mode] Regression — 進入 / 退出 Edit Mode** ✅ 2026-04-24
  列表有資料 → Pencil icon 顯示 → 點擊 → 進入 edit mode（checkbox 出現、action bar 出現）→
  點「取消」→ 退出 edit mode（checkbox 消失、action bar 消失、selection 清空）

- [ ] **[edit-mode] Regression — 勾選 / 取消勾選**
  edit mode 中：點擊 item checkbox → checked；再點 → unchecked；
  「刪除所選」按鈕在 n=0 時 disabled，n≥1 時 enabled，顯示正確數量

- [ ] **[edit-mode] Regression — 全選**
  點「全選」→ 所有 item checked；再點「全選」→ 全部 unchecked

- [ ] **[edit-mode] Regression — 刪除所選履歷**
  勾選 2 筆 → 點「刪除所選」→ ClearAllDialog 出現 → 確認 →
  並行呼叫 `DELETE /api/resume/:id` ×2 → 2 筆從列表消失，未選中項目保留；
  取消 → dialog 關閉，列表不變

- [ ] **[edit-mode] Regression — 刪除所選自薦信**
  同上，呼叫 `DELETE /api/cover-letter/:id`

- [ ] **[edit-mode] Regression — 清除全部（在 edit mode 中）**
  edit mode 中點「清除全部」→ ClearAllDialog → 確認 → 呼叫 `DELETE /api/resume` →
  列表清空，自動退出 edit mode

- [ ] **[edit-mode] Regression — 刪除所選後若列表清空自動退出 edit mode**
  全選後刪除 → 列表變空 → 自動退出 edit mode，不顯示 action bar

- [ ] **[edit-mode] Regression — Pencil icon 僅在有資料時顯示**
  空列表時 Pencil icon 不渲染（edit mode 無意義）

- [ ] **[edit-mode] Regression — i18n edit mode**
  切換到 EN 後，「Edit」/「Cancel」/「Select All」/「Delete Selected」/「Clear All」皆為英文

- [ ] **[template-preview] Regression — 三個模板縮圖可識別**
  TemplateSelector 中：Modern 卡片顯示單欄 SVG；Professional 顯示雙欄 SVG；Creative 顯示左側色塊 SVG；
  灰色佔位方塊不再出現（`bg-muted h-24` 元素不存在）

### Done

- [x] `src/test/usage.test.ts` — checkDailyLimit / recordUsage / daily reset
- [x] `src/lib/ai.ts` 替換為 OpenAI gpt-4o-mini（type-check + existing tests pass）
- [x] **[raw-import] Integration — `POST /api/resume/import-raw`** ✅ 2026-04-24
  上傳合法 PDF → 驗證：回傳 200 `{ data: { resumeId, title } }`；prisma.resume.create 被呼叫一次；content.rawText 非空字串；rawPdfUrl 欄位存在（string，可為空字串）；未呼叫 prisma.usageLog.create
- [x] **[raw-import] Integration — `GET /api/resume/:id/raw-pdf`** ✅ 2026-04-24
  Resume 有 rawPdfUrl → 回傳 200 `{ data: { url } }`；rawPdfUrl 為空字串 → 404；rawPdfUrl 為 null → 404；非擁有者 → 404
- [x] **[raw-import] Unit — cover letter generation 用 rawText 作 context** ✅ 2026-04-24
  Mock prisma.resume.findFirst 回傳含 content.rawText 的 resume；驗證送給 generateCoverLetter 的 resumeContent 為 rawText 字串全文，而非結構化物件

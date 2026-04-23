掃描專案目前狀態：
- 讀取 `prisma/schema.prisma` 取得最新 model
- 掃描 `src/app/api/` 取得最新路由
- 掃描 `src/app/` 取得最新頁面結構

對比並更新：
- `specs/data-models.md` → 同步最新 model 和關係
- `specs/api-contracts.md` → 同步最新路由清單
- `specs/frontend-spec.md` → 同步最新頁面清單

## Breaking Change 偵測

比對 spec 與實際代碼，偵測是否有以下 breaking changes：
- 刪除或重命名了 DB 欄位 / table
- 刪除或重命名了 API endpoint
- 修改了 API request/response 結構

如果偵測到 breaking change：
1. 更新 `MASTER_SPEC.md`，記錄變更：
   - 在文件頂部加入 `<!-- Updated: [日期] — [變更原因] -->`
   - 更新相關的 Data Models 或 Core Features 區塊
2. 在輸出中標記 `⚠️ Breaking Change` 並說明影響

## Task Status 同步

掃描各 spec 的 `## Task Status` 區塊，將代碼中已實作的功能對應的 Pending task 移到 Done：
- 如果 model 已在 prisma/schema.prisma 中存在 → 對應 data-models.md task 標為 Done
- 如果路由已在 src/app/api/ 中存在 → 對應 api-contracts.md task 標為 Done
- 如果頁面已在 src/app/ 中存在 → 對應 frontend-spec.md task 標為 Done

完成後列出：
1. 每個檔案改了什麼
2. 是否有 breaking change（若有，說明影響範圍）
3. Task Status 有哪些從 Pending 移到 Done

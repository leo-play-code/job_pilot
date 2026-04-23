掃描專案目前狀態：
- 讀取 `prisma/schema.prisma` 取得最新 model
- 掃描 `src/app/api/` 取得最新路由
- 掃描 `src/app/` 取得最新頁面結構

對比並更新：
- `specs/data-models.md` → 同步最新 model 和關係
- `specs/api-contracts.md` → 同步最新路由清單
- `specs/frontend-spec.md` → 同步最新頁面清單

不需要動 MASTER_SPEC.md。
完成後列出每個檔案改了什麼。

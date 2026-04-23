讀取以下檔案：
- `MASTER_SPEC.md`
- `specs/data-models.md`
- `specs/api-contracts.md`
- `specs/frontend-spec.md`
- `.claude/skills/feature-spec/SKILL.md`

我想新增以下功能：
$ARGUMENTS

請執行：
1. 確認這個功能符合 MASTER_SPEC.md 的 MVP 範圍
2. 產出完整的 feature spec（DB / 後端 / 前端 任務拆分）
3. 更新對應的小 spec 檔案：
   - 有新 model → 更新 specs/data-models.md
   - 有新路由 → 更新 specs/api-contracts.md
   - 有新頁面或元件 → 更新 specs/frontend-spec.md
4. 把功能摘要更新回 MASTER_SPEC.md 的 Core Features 區塊
5. 輸出給我下一步要下的指令，例如：
   「接下來請執行 /project:db 實作 XXX」

讀取 `.claude/skills/orchestrator/SKILL.md`。

## 執行前準備

依序讀取以下 spec 文件，找出各層的 `## Task Status` 區塊中所有 `Pending` 和 `In Progress` tasks：
- `specs/data-models.md`
- `specs/api-contracts.md`
- `specs/frontend-spec.md`
- `specs/testing-spec.md`

如果某個 spec 文件不存在，跳過該層。

## 執行

按照 orchestrator skill 定義的順序，使用 **Agent tool** 依序 spawn 各層 subagent：

1. **DB layer** — 如果 data-models.md 有 pending tasks
   - Spawn agent，讀取 `specs/data-models.md` 和 `.claude/skills/database-dev/SKILL.md`
   - 執行所有 pending tasks
   - 完成後更新 data-models.md 的 Task Status checkboxes

2. **Backend layer** — 如果 api-contracts.md 有 pending tasks
   - Spawn agent，讀取 `specs/api-contracts.md` 和 `.claude/skills/backend-dev/SKILL.md`
   - 提供 DB handoff 摘要（從上一步取得）
   - 完成後更新 api-contracts.md 的 Task Status checkboxes

3. **Frontend layer** — 如果 frontend-spec.md 有 pending tasks
   - Spawn agent，讀取 `specs/frontend-spec.md` 和 `.claude/skills/frontend-dev/SKILL.md`
   - 提供 Backend handoff 摘要
   - 完成後更新 frontend-spec.md 的 Task Status checkboxes

4. **Testing layer** — 如果 testing-spec.md 有 pending tasks
   - Spawn agent，讀取 `specs/testing-spec.md` 和 `.claude/skills/testing-dev/SKILL.md`
   - 完成後更新 testing-spec.md 的 Task Status checkboxes

## 完成後

- 輸出各層的執行結果表格（狀態、完成 tasks 數量）
- 如果有 blocked items，列出原因
- 提示：「執行 /project:git 提交本次變更」

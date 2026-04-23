讀取以下檔案：
- `MASTER_SPEC.md`
- `specs/data-models.md`
- `specs/api-contracts.md`
- `specs/frontend-spec.md`
- `specs/testing-spec.md`
- `.claude/skills/feature-spec/SKILL.md`

我想新增以下功能：
$ARGUMENTS

請執行：
1. 確認這個功能符合 MASTER_SPEC.md 的 MVP 範圍
2. 產出完整的 feature spec（DB / 後端 / 前端 / 測試 任務拆分）
3. 更新對應的小 spec 檔案，在 `## Task Status > Pending` 加入新 tasks：
   - 有新 model → 更新 specs/data-models.md
   - 有新路由 → 更新 specs/api-contracts.md
   - 有新頁面或元件 → 更新 specs/frontend-spec.md
   - 所有新功能 → 更新 specs/testing-spec.md（加入對應的 unit / integration / E2E tests）
4. 把功能摘要更新回 MASTER_SPEC.md 的 Core Features 區塊
5. 完成後提示：「Spec 已更新，執行 /project:exec 開始自動執行」

## Task Status 格式

如果 spec 文件還沒有 `## Task Status` 區塊，在文件尾部加入：

```markdown
---
## Task Status

### Pending
- [ ] [新 task 描述]

### Done
```

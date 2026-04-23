---
name: orchestrator
description: >
  Orchestration skill for coordinating multi-layer execution. Use this skill
  when running /project:exec or /project:modify — it determines the correct
  execution order based on layer dependencies, spawns subagents using the
  Agent tool, and updates spec checkboxes as each layer completes. Also
  handles breaking-change detection and MASTER_SPEC sync.
---

# Orchestrator Skill

你是這個專案的執行協調員。你的職責是**按正確順序啟動各層 subagent，並追蹤每層的完成狀態**。

---

## 執行順序原則

```
DB layer (prisma schema / migration)
    ↓ (backend 依賴 DB schema)
Backend layer (API routes)
    ↓ (frontend 依賴 API)
Frontend layer  ←→  Testing layer (可並行)
    ↓
Git commit
```

**規則**:
- DB 必須最先，因為 backend 需要正確的 Prisma client
- Backend 在 DB 之後，因為 frontend 需要真實的 API 合約
- Frontend 和 Testing setup 可以並行（互不依賴）
- 如果某層沒有 pending tasks → 跳過該層

---

## 決定是否跳過某層

讀取各 spec 的 `## Task Status` 區塊：

```
specs/data-models.md     → 有 Pending task → 執行 DB layer
specs/api-contracts.md   → 有 Pending task → 執行 Backend layer
specs/frontend-spec.md   → 有 Pending task → 執行 Frontend layer
specs/testing-spec.md    → 有 Pending task → 執行 Testing layer
```

沒有 pending tasks 的層直接跳過，輸出 `[SKIP] X layer — no pending tasks`。

---

## 執行每層的方式

使用 **Agent tool** spawn 各層 subagent，並在 prompt 中提供：
1. 該層的 spec 文件路徑
2. 對應的 SKILL.md 路徑
3. 明確的任務清單（從 spec Task Status 複製）
4. 上一層的 handoff 內容（如果有）

### DB Agent Prompt 範本
```
讀取 specs/data-models.md 和 .claude/skills/database-dev/SKILL.md。
執行以下 pending tasks：
[從 data-models.md Task Status 複製 pending 清單]
完成後更新 specs/data-models.md 的 Task Status，將完成的 task 改為 [x]，加上日期。
輸出 DB → Backend Handoff 摘要。
```

### Backend Agent Prompt 範本
```
讀取 specs/api-contracts.md 和 .claude/skills/backend-dev/SKILL.md。
DB Handoff 摘要：[前一層的 handoff 輸出]
執行以下 pending tasks：
[從 api-contracts.md Task Status 複製 pending 清單]
完成後更新 specs/api-contracts.md 的 Task Status。
輸出 Backend → Frontend Handoff 摘要。
```

### Frontend Agent Prompt 範本
```
讀取 specs/frontend-spec.md 和 .claude/skills/frontend-dev/SKILL.md。
Backend Handoff 摘要：[前一層的 handoff 輸出]
執行以下 pending tasks：
[從 frontend-spec.md Task Status 複製 pending 清單]
完成後更新 specs/frontend-spec.md 的 Task Status。
```

### Testing Agent Prompt 範本
```
讀取 specs/testing-spec.md 和 .claude/skills/testing-dev/SKILL.md。
執行以下 pending tasks：
[從 testing-spec.md Task Status 複製 pending 清單]
完成後更新 specs/testing-spec.md 的 Task Status。
```

---

## 失敗處理

如果某層 agent 失敗或無法完成：

1. 將該 task 留在 `Pending`
2. 在 spec 的 `## Blocked` 區塊寫入：
   ```markdown
   ## Blocked
   - [task 名稱] — [失敗原因] — 需要先解決 [依賴]
   ```
3. 繼續執行**不依賴**該層的其他層（例如 Backend 失敗 → Frontend 跳過，但 Testing unit tests 仍可執行）
4. 最終報告哪些層完成、哪些被 blocked

---

## Breaking Change 偵測

在 `/project:modify` 流程中，掃描變更內容是否包含：

| 變更類型 | 是否 Breaking |
|---------|-------------|
| 刪除/重命名 DB 欄位 | ✅ Breaking |
| 刪除/重命名 API endpoint | ✅ Breaking |
| 修改 API request/response 結構 | ✅ Breaking |
| 新增 DB 欄位（可 null 或有 default） | ❌ Non-breaking |
| 新增 API endpoint | ❌ Non-breaking |
| 新增 UI 元件 | ❌ Non-breaking |

**Breaking change → 更新 MASTER_SPEC.md**:
- 更新 Data Models 區塊
- 更新 Core Features 區塊（如功能語義改變）
- 在檔案頂部加入變更記錄：`<!-- Updated: YYYY-MM-DD — [reason] -->`

---

## 完成後輸出格式

```markdown
## 執行結果

| 層 | 狀態 | 完成 tasks |
|----|------|-----------|
| DB | ✅ Done | 3/3 tasks |
| Backend | ✅ Done | 5/5 tasks |
| Frontend | ✅ Done | 4/4 tasks |
| Testing | ⚠️ Blocked | 2/3 tasks — [blocked reason] |

### 下一步
- [ ] 解決 Testing layer 的 blocked issue：[說明]
- [ ] 執行 /project:git 提交本次變更
```

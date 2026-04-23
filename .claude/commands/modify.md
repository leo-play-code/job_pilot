讀取 `.claude/skills/orchestrator/SKILL.md`。

我想修改以下內容：
$ARGUMENTS

## 步驟

### 1. 分析影響層

讀取以下文件了解現有設計：
- `specs/data-models.md`
- `specs/api-contracts.md`
- `specs/frontend-spec.md`
- `specs/testing-spec.md`
- `MASTER_SPEC.md`（只在變更可能影響整體架構時讀取）

根據變更描述，判斷每一層是否受影響：
- **DB layer**：有新 table、新欄位、修改現有欄位、刪除欄位？
- **Backend layer**：有新 API、修改現有 API、刪除 API？
- **Frontend layer**：有新頁面、修改現有 UI、新元件？
- **Testing layer**：現有測試是否需要更新？需要新增測試案例？

### 2. 偵測 Breaking Change

依照 orchestrator skill 的 breaking change 清單檢查。
如果是 breaking change → 更新 `MASTER_SPEC.md`，記錄變更原因。

### 3. 更新受影響的 Spec 文件

在每個受影響的 spec 文件的 `## Task Status` 區塊加入新的 pending tasks：

```markdown
### Pending
- [ ] [新 task 描述] — 因應 [變更名稱]
```

如果 spec 文件還沒有 `## Task Status` 區塊，在文件尾部加入：

```markdown
---
## Task Status

### Pending
- [ ] [task 描述]

### Done
```

### 4. 輸出影響摘要

列出：
- 受影響的層和原因
- 是否有 breaking change
- 每個 spec 新增了哪些 tasks
- 優先執行順序

### 5. 觸發執行

詢問：「是否立即執行？輸入『是』自動執行 /project:exec，或手動分層執行。」

如果用戶確認 → 執行 exec 流程（依照 orchestrator skill 的順序 spawn agents）。

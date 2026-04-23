讀取以下檔案：
- `specs/data-models.md`
- `specs/api-contracts.md`
- `specs/testing-spec.md`
- `.claude/skills/debug-triage/SKILL.md`

以下是問題描述：
$ARGUMENTS

請執行：
1. 診斷 bug 屬於哪一層（DB / 後端 / 前端）
2. 產出各層的 Fix Task
3. 修復 bug
4. 修復完成後，在 `specs/testing-spec.md` 的 `## Task Status > Pending` 加入回歸測試 task：

```markdown
- [ ] [Regression] [Bug 標題] — 確認 [觸發條件] 不再發生
```

5. 每個 Fix Task 結尾告訴我要下什麼指令來修它，例如：
   「修前端請執行 /project:frontend 修復 XXX」

## 注意

如果這個 bug 反映了整體設計上的問題（例如 API 合約不清楚、DB schema 設計缺陷），同時：
- 更新對應的 spec 文件
- 判斷是否需要更新 MASTER_SPEC.md（屬於 breaking change 的情況）

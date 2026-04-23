# CLAUDE.md — 專案全局指令

這個檔案會在每次 Claude Code session 啟動時自動被讀取。

---

## 你是誰

你是這個專案的全端工程師。每次開始任務前，你必須：

1. 只有在以下情況才讀 `MASTER_SPEC.md`：
   - 開新功能（feature-spec）
   - 初始化專案（project-init）
   - 你不確定這個任務的技術棧或邊界
   - 用戶明確說「參考 spec」
   其他情況（純前端、純後端修改、bug fix、commit）**不需要讀**
2. 根據任務類型，讀取 `.claude/skills/` 下對應的 SKILL.md
3. 嚴格按照 skill 的規範執行

---

## Skill 對應表

| 任務類型 | 讀取的 Skill |
|---|---|
| 開新專案、初始化 | `.claude/skills/project-init/SKILL.md` |
| 加新功能、需求分析 | `.claude/skills/feature-spec/SKILL.md` |
| 資料庫、schema、migration | `.claude/skills/database-dev/SKILL.md` |
| 後端 API、route handler | `.claude/skills/backend-dev/SKILL.md` |
| 前端、UI、component | `.claude/skills/frontend-dev/SKILL.md` |
| Bug、error、壞掉 | `.claude/skills/debug-triage/SKILL.md` |
| Commit、push、release | `.claude/skills/git-workflow/SKILL.md` |
| 單元/整合/E2E 測試 | `.claude/skills/testing-dev/SKILL.md` |
| 執行所有層、自動分工、修改路由 | `.claude/skills/orchestrator/SKILL.md` |

---

## 標準 Workflow

```
討論需求 → /project:plan → 確認所有 spec
說「開始執行」 → /project:exec → 自動 DB → Backend → Frontend → Testing
修改功能 → /project:modify [描述] → 自動分析影響層 → 路由到正確 subagent
Bug 修復 → /project:bug [描述] → 修復後自動更新 testing-spec
```

---

## 每次完成任務後必須

- 執行 `npm run type-check` 確認無 TypeScript 錯誤
- 執行 `npm test -- --run` 確認測試通過
- 輸出一條符合 conventional commits 格式的 commit message

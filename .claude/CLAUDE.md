# CLAUDE.md — 專案全局指令

這個檔案會在每次 Claude Code session 啟動時自動被讀取。

---

## 你是誰

你是這個專案的全端工程師。每次開始任務前，你必須：

1. 讀取 `MASTER_SPEC.md`（如果存在）了解專案背景
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

---

## 每次完成任務後必須

- 執行 `npm run type-check` 確認無 TypeScript 錯誤
- 執行 `npm test -- --run` 確認測試通過
- 輸出一條符合 conventional commits 格式的 commit message

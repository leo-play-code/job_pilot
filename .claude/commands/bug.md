讀取以下檔案：
- `specs/data-models.md`
- `specs/api-contracts.md`
- `.claude/skills/debug-triage/SKILL.md`

以下是問題描述：
$ARGUMENTS

請執行：
1. 診斷 bug 屬於哪一層（DB / 後端 / 前端）
2. 產出各層的 Fix Task
3. 每個 Fix Task 結尾告訴我要下什麼指令來修它，例如：
   「修前端請執行 /project:frontend 修復 XXX」

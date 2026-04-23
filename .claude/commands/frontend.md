讀取以下檔案：
- `specs/frontend-spec.md`
- `.claude/skills/frontend-dev/SKILL.md`

不需要讀 MASTER_SPEC.md。

根據 specs/frontend-spec.md 的內容，判斷目前哪些頁面或元件還沒有實作或需要更新：
- 掃描 `src/app/` 目錄，找出已經存在的頁面
- 掃描 `src/components/` 目錄，找出已經存在的元件
- 找出 spec 裡有但程式碼裡還沒有的頁面或元件
- 只實作差異的部分，不重複做已經存在的

完成後：
- 確認 RWD、loading/error/empty state 都處理好
- 輸出 commit message

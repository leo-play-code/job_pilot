讀取以下檔案：
- `specs/api-contracts.md`
- `.claude/skills/backend-dev/SKILL.md`

不需要讀 MASTER_SPEC.md。

根據 specs/api-contracts.md 的內容，判斷目前哪些 API 還沒有實作或需要更新：
- 掃描 `src/app/api/` 目錄，找出已經存在的 route handler
- 找出 spec 裡有但程式碼裡還沒有的 endpoint
- 只實作差異的部分，不重複做已經存在的

完成後：
- 輸出 Backend Handoff 給前端的摘要（endpoint、request/response 格式）
- 輸出 commit message

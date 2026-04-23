讀取以下檔案：
- `specs/data-models.md`
- `.claude/skills/database-dev/SKILL.md`

不需要讀 MASTER_SPEC.md。

根據 specs/data-models.md 的內容，判斷目前哪些 model 還沒有實作或需要更新：
- 對比 `prisma/schema.prisma` 現有內容
- 找出 spec 裡有但 schema 裡沒有的 model 或欄位
- 只實作差異的部分，不重複做已經存在的

完成後：
- 輸出更新後的 schema.prisma
- 輸出 migration 名稱
- 輸出 DB Handoff 給後端的摘要

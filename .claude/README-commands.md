# Claude Commands 使用說明

把 `.claude/commands/` 整個資料夾放進你的專案根目錄。

---

## 指令清單

| 指令 | 時機 | 說明 |
|---|---|---|
| `/project:plan` | 討論完 idea 後 | 產出 MASTER_SPEC.md 和所有小 spec |
| `/project:init` | spec 準備好後 | 初始化專案骨架 |
| `/project:db 實作XXX` | 要做資料庫 | 讀 data-models.md + database skill |
| `/project:backend 實作XXX` | 要做後端 API | 讀 api-contracts.md + backend skill |
| `/project:frontend 實作XXX` | 要做前端 | 讀 frontend-spec.md + frontend skill |
| `/project:feature 我想加XXX功能` | 加新功能 | 分析、拆任務、更新所有 spec |
| `/project:bug 描述問題` | 有 bug | 診斷 + 產出各層 Fix Task |
| `/project:sync-spec` | 開發一段時間後 | 把實際程式碼同步回 spec |

---

## 完整開發流程

```
1. 跟 Claude 討論想法
         ↓
2. /project:plan
         ↓
3. /project:init
         ↓
4. /project:db 實作所有 model
         ↓
5. /project:backend 實作所有 API
         ↓
6. /project:frontend 實作所有頁面
         ↓
7. 需要新功能 → /project:feature 功能描述
         ↓
8. 有 bug → /project:bug 問題描述
         ↓
9. 定期執行 /project:sync-spec
```

---

## 注意事項

- `/project:db`、`/project:backend`、`/project:frontend` 後面一定要加描述
  - ✅ `/project:db 實作 User、Post、Tag 三個 model`
  - ❌ `/project:db`（沒有描述會不知道要做什麼）

- `/project:feature` 後面描述越詳細越好
  - ✅ `/project:feature 我想加購物車功能，用戶可以加入商品、調整數量、結帳`
  - ❌ `/project:feature 購物車`

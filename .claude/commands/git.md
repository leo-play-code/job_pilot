請依照以下步驟智慧判斷並完成 git 上傳：

## 第一步：判斷是否已有 GitHub Remote

執行 `git remote -v`，檢查是否有設定 remote origin。

---

### 情況 A：沒有 remote（全新本地專案）

1. 執行 `basename $(pwd)` 取得當前資料夾名稱作為專案名稱
2. 執行 `git init`（如果還不是 git 專案）
3. 執行 `gh repo create <資料夾名稱> --public --source=. --push`
4. 告訴我：「已在 GitHub 建立新 repo：<專案名稱>，並完成首次 push」
5. 結束，不需要再執行後續步驟

---

### 情況 B：已有 remote（正常開發中的專案）

1. 執行 `git diff HEAD` 與 `git status`，完整分析這次所有變更（新增、修改、刪除）
2. 如果沒有任何變更，告訴我「目前沒有任何變更需要 commit」然後結束
3. 根據變更內容，用繁體中文自動產生 commit message：
   - 第一行：簡短摘要（50字以內），例如「新增使用者登入功能」
   - 空一行
   - 條列每個主要變更的說明
4. 執行 `git add .`
5. 執行 `git commit -m "<自動產生的 commit message>"`
6. 執行 `git push`
7. 完成後顯示：
   - ✅ Push 成功
   - 📝 Commit message 內容
   - 🔗 GitHub repo 網址

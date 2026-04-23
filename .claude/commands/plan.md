你是這個專案的架構師。

我們剛討論完專案想法，請根據對話內容執行以下步驟，不需要詢問確認，直接產出所有檔案。

## 步驟

1. 產出 `MASTER_SPEC.md`（放在專案根目錄）
內容只包含：
- 專案名稱與一句話描述
- 技術棧表格
- 用戶角色
- 核心功能清單（MVP 範圍）
- Definition of Done
不要放 API 路由、資料庫細節、元件清單，這些放小 spec。

2. 產出 `specs/data-models.md`
內容只包含：
- Entity 清單與關係（User 1→Many Post 這種格式）
- 欄位命名規範
- 重要的 enum 值

3. 產出 `specs/api-contracts.md`
內容只包含：
- API 基本規範（base path、auth 方式、response format、pagination）
- 路由清單表格（Method、Path、Auth、說明）

4. 產出 `specs/frontend-spec.md`
內容只包含：
- 頁面清單與對應路由
- 每個頁面需要的主要元件
- 共用元件清單

## 規範
- 每個小 spec 控制在 40 行以內
- 用繁體中文寫說明，程式碼用英文
- 完成後列出產出的所有檔案路徑

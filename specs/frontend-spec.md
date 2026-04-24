# Frontend Spec

## 頁面清單

| 頁面 | 路由 | 說明 |
|---|---|---|
| Landing | `/` | 產品介紹，CTA 按鈕導向登入 |
| Login | `/[locale]/login` | Email + Google 登入 |
| Register | `/[locale]/register` | Email 註冊 |
| Dashboard | `/[locale]/dashboard` | 履歷 & 自薦信列表，今日剩餘次數 |
| Resume Builder | `/[locale]/resume/new` | 4 步驟建立履歷 |
| Resume Upload | `/[locale]/resume/upload` | 上傳 PDF，解析後進入 Builder |
| Resume Preview | `/[locale]/resume/[id]` | 預覽、編輯、下載 PDF |
| Cover Letter Builder | `/[locale]/cover-letter/new` | 3 步驟生成自薦信 |
| Cover Letter Result | `/[locale]/cover-letter/[id]` | 查看、複製、下載自薦信 |

## 每頁主要元件

```
Dashboard           → ResumeList (compact + delete), CoverLetterList (compact + delete), UsageBadge, QuickActions
Resume Builder      → StepIndicator, PersonalInfoForm, ExperienceForm,
                      EducationSkillsForm, TemplateSelectorStep
Resume Upload       → DropZone, ParseLoadingState (→ Builder with initialData)
Resume Preview      → ResumeRenderer(templateId), DownloadButton, EditButton
Cover Letter Builder→ ResumeSelector, JobDescForm, WordCountSelector, LanguageToggle
Cover Letter Result → CoverLetterDisplay, CopyButton, DownloadTxtButton
```

## 共用元件

| 元件 | 說明 |
|---|---|
| `TemplateSelector` | 3 個模板縮圖卡片（modern / professional / creative）|
| `UsageBadge` | 顯示今日剩餘次數，從 /api/usage/today 取值 |
| `UpgradeModal` | API 回 429 時觸發，說明 PRO 方案 |
| `LanguageSwitcher` | Header 右上角，切換 /zh ↔ /en |
| `LoadingOverlay` | AI 生成中的 spinner + 說明文字 |
| `StepIndicator` | 多步驟表單的進度條 |

## i18n 規範（所有新頁面 / 元件必須遵守）

### 架構
- 路由格式：`/[locale]/...`，locale 為 `zh`（預設）或 `en`
- 語言切換：Header 右上角 `LanguageSwitcher`，使用 `router.replace(pathname, { locale })` 即時切換，不刷頁
- 翻譯檔：`src/messages/zh.json` 與 `src/messages/en.json`，key 必須完全對應

### 開發規範
| 元件類型 | 使用方式 |
|---|---|
| Server Component（page.tsx） | `getTranslations('namespace')` from `next-intl/server` |
| Client Component（'use client'） | `useTranslations('namespace')` from `next-intl` |
| 動態文字（含變數） | `t('key', { variable: value })` |
| 連結 | 使用 `Link` from `@/i18n/navigation`（自動帶 locale） |
| Router / Pathname | 使用 `useRouter` / `usePathname` from `@/i18n/navigation` |

### 每次新增功能的 i18n checklist
- [ ] `zh.json` 新增所有 UI 文字（key / value）
- [ ] `en.json` 新增對應的英文翻譯（key 必須與 zh.json 完全一致）
- [ ] 沒有任何 hardcoded 中文或英文字串（全部走 `t('key')`）
- [ ] 語言切換後頁面正確顯示對應語言

---

## Dashboard 文件列表規範

### ResumeList / CoverLetterList 設計原則（Edit Mode UX）
- 緊湊列表：`px-3 py-2 space-y-1.5`（非大卡片）
- 兩欄對稱：Dashboard 保持 `lg:grid-cols-2`，左履歷右自薦信
- 樂觀更新：刪除成功後從 local state 移除，不重載頁面
- 錯誤處理：API 失敗顯示 `dashboard.deleteError` 文字於列表頂部
- i18n：所有按鈕文字走 `t('key')`，無 hardcoded 字串

### Edit Mode 互動規範
**正常模式（Normal mode）**
- 每個 item 為可點擊的連結卡片，點擊導向詳細頁
- Section 標題列右側有 **Pencil（SquarePen）icon 按鈕**，hover 顯示
- 無個別 hover 垃圾桶（移除舊設計）

**進入 Edit Mode**
- 點擊 Pencil icon → 該 section 進入 edit mode（另一 section 不受影響）
- Section 標題右側出現：`[取消]`（exit edit mode）
- 每個 item 左側出現 **checkbox**（圓形，checked 時藍色填滿）
- item 連結卡片變為不可點擊（cursor-default，取消 Link 跳轉行為）
- 底部 action bar 出現（固定於 list 下方）：
  - `[全選]` checkbox + 已選數量文字（`已選 {n} 項`）
  - `[刪除所選]` 按鈕（灰色，n=0 時 disabled）
  - `[清除全部]` 按鈕（紅色）

**刪除所選（Delete Selected）**
- 條件：至少選 1 項才可點擊
- 點擊 → ClearAllDialog（`deleteSelectedTitle`）
- 確認後：並行呼叫 `DELETE /api/resume/:id`（或 cover-letter）for each selected id
- 成功：從 local state 移除，清空 selection，若列表清空則退出 edit mode

**清除全部（Clear All）**
- 點擊 → ClearAllDialog（`clearAllResumesTitle` / `clearAllCoverLettersTitle`）
- 確認後：呼叫 `DELETE /api/resume`（或 `DELETE /api/cover-letter`）
- 成功：清空 local state，退出 edit mode

**退出 Edit Mode**
- 點「取消」按鈕 → 清空 selection，回到 Normal mode

### ClearAllDialog 元件（已實作，沿用）
```
ClearAllDialog (client component) at src/components/dashboard/ClearAllDialog.tsx
  Props: open, onClose, onConfirm, isPending, titleKey
  自訂 overlay（fixed inset-0）
  loading 狀態：確認按鈕顯示 spinner + 禁用
  新增支援的 titleKey: 'deleteSelectedResumesTitle' | 'deleteSelectedCoverLettersTitle'
```

### i18n 新增 key
```
dashboard.editMode         = "編輯" / "Edit"
dashboard.exitEditMode     = "取消" / "Cancel"
dashboard.selectAll        = "全選" / "Select All"
dashboard.selectedCount    = "已選 {n} 項" / "{n} selected"
dashboard.deleteSelected   = "刪除所選" / "Delete Selected"
dashboard.deleteSelectedResumesTitle    = "刪除所選履歷？" / "Delete Selected Resumes?"
dashboard.deleteSelectedCoverLettersTitle = "刪除所選自薦信？" / "Delete Selected Cover Letters?"
```

---

## 模板清單（MVP）

| templateId | 名稱 | 特色 |
|---|---|---|
| `modern` | Modern | 單欄、簡潔留白、適合科技業 |
| `professional` | Professional | 雙欄、傳統正式、適合金融/法律 |
| `creative` | Creative | 左側色塊、有個性、適合設計/行銷 |

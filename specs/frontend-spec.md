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

## 模板選擇器預覽圖規範（TemplateSelector）

### 需求
- 現有卡片預覽區 `w-full h-24 bg-muted rounded` 為純灰色佔位，無法區分版型
- 改為各模板專屬的 SVG 排版縮圖，讓用戶一眼看出版型差異

### 三個模板的 SVG 結構

**Modern（單欄）**
```
┌────────────────────────────────────┐
│  ███████████████  (name bar)       │
│  ─────────────── (divider)         │
│  ████  (section heading)           │
│  ██████████████ (text line)        │
│  █████████      (text line short)  │
│  ████  (section heading)           │
│  ████████████████████ (text line)  │
│  ███████████          (text line)  │
└────────────────────────────────────┘
```

**Professional（雙欄）**
```
┌──────────────────────────────────────┐
│ ████████████████████ (name - full)   │
│ ┌──────────┬────────────────────────┐│
│ │ ███ tags │ ████ (experience head) ││
│ │ ██       │ ████████████ (text)    ││
│ │ ██       │ ████████ (text)        ││
│ │ ███ (edu)│ ████ (another section) ││
│ │ ████████ │ ██████████████ (text)  ││
│ └──────────┴────────────────────────┘│
└──────────────────────────────────────┘
```

**Creative（左側色塊）**
```
┌──────────────────────────────────────┐
│ ███(dark│████████████████████████    │
│ sidebar)│ (name + section lines)     │
│         │ ██████████████ (line)      │
│         │ ████████ (line)            │
│         │ ████ (head)                │
│         │ ████████████████ (line)    │
└──────────────────────────────────────┘
```

### 實作方式
- 各模板預覽以 **inline SVG** 實作，嵌入 `TemplateSelector.tsx`
- SVG viewBox 統一為 `0 0 160 100`，顏色用 `currentColor` / 固定灰階，不依賴主題
- 已選中狀態：SVG 主色（heading bar、sidebar）從灰色變為 `hsl(var(--primary) / 0.6)` 以呼應選取框線
- 每個模板 SVG 抽為獨立的 function component（`ModernPreview` / `ProfessionalPreview` / `CreativePreview`），放在同一個檔案中

---

## Admin 模板匯入精靈（Template Import Wizard）

### 頁面路由
`/[locale]/admin/templates/import`

### 流程（3 步驟）

**Step 1 — 上傳圖片**
- DropZone：接受 PNG / JPG / PDF（max 5MB PNG, max 10MB PDF）
- 選擇後顯示圖片預覽（`<img>`）
- 點「開始分析」→ LoadingOverlay（「AI 正在分析版型設計…」）
- 呼叫 `POST /api/admin/templates/import`（multipart）

**Step 2 — 分析結果 + 互動調整**

版面：**左欄原始設計圖** | **右欄即時 ResumeRenderer 預覽**（sample data + AI 生成 CSS）

調整面板（右側下方）：
- 版型切換：single / split（Radio）
- 主色：color picker（改 CSS 的 hex，即時更新預覽）
- 區塊順序：dnd-kit 拖曳（重用 `SortableSectionItem`）
- CSS 進階編輯：可展開 textarea，顯示 AI 生成 CSS，手動微調後即時 apply

**Step 3 — 命名 & 發佈**
- 模板名稱（input, required）
- 描述（input, required）
- 分類（select: tech / finance / creative / other）
- 點「發佈」→ `PATCH /api/admin/templates/:id?` with `{ status: 'active' }` → 背景觸發縮圖生成 → 導向 `/admin/templates`

### 新增元件

| 元件 | 位置 | 說明 |
|---|---|---|
| `TemplateImportWizard` | `src/components/admin/TemplateImportWizard.tsx` | 3-step 精靈容器 |
| `TemplateUploadStep` | `src/components/admin/TemplateUploadStep.tsx` | DropZone + 分析觸發 |
| `TemplateConfigStep` | `src/components/admin/TemplateConfigStep.tsx` | 左圖右預覽 + 調整面板 |
| `TemplatePublishStep` | `src/components/admin/TemplatePublishStep.tsx` | 命名 + 分類 + 發佈 |

### Admin 模板列表更新
- `/admin/templates` 新增「📥 匯入模板」按鈕，連結 `/admin/templates/import`
- `status='draft'` 的模板顯示「草稿」badge（半透明），不出現在用戶端

---
## Task Status

### Pending
- [ ] [template-import] DB: Template 新增 `referenceImageUrl String?`、`aiAnalysis Json?`、`status String @default("active")` 欄位；執行 migration
- [ ] [template-import] Backend: `src/lib/template-vision.ts` — Claude Vision API 分析圖片，回傳 `{ layout, primaryColor, css, sectionOrder, confidence }`
- [ ] [template-import] Backend: PDF 首頁轉 PNG 工具（Puppeteer 截第一頁）
- [ ] [template-import] Backend: `POST /api/admin/templates/import` — 接收圖片 → Vision 分析 → 上傳原圖 S3 → 建 draft Template
- [ ] [template-import] Backend: `PATCH /api/admin/templates/:id` 支援 `status` 欄位（'active' 時同步 `isActive=true`）
### Done
- [x] **[template-preview] 替換 TemplateSelector 灰色佔位為版型 SVG 縮圖** ✅ 2026-04-24
  `src/components/resume/TemplateSelector.tsx` 中各模板以 inline SVG 縮圖取代灰色佔位；
  選中狀態 SVG 主色高亮（primary blue）
- [x] **[template-import] Frontend: `/admin/templates/import` 頁面（3-step wizard）** ✅ 2026-04-24
  `src/app/[locale]/admin/templates/import/page.tsx` — 3 步驟精靈，全部整合在單一檔案
- [x] **[template-import] Frontend: `TemplateUploadStep` — DropZone (PNG/JPG/PDF) + 送 import API + loading** ✅ 2026-04-24
  Step 1：拖曳/點擊 DropZone、圖片預覽、loading 狀態（約 15-30 秒提示）、錯誤處理
- [x] **[template-import] Frontend: `TemplateConfigStep` — 左原圖右 ResumeRenderer 預覽，dnd-kit 排序，color picker，CSS textarea** ✅ 2026-04-24
  Step 2：左欄原圖、右欄 ResumeRenderer 即時預覽（scale 0.4）、color picker（即時替換 CSS hex）、layout radio、dnd-kit 拖曳排序、可摺疊 CSS textarea
- [x] **[template-import] Frontend: `TemplatePublishStep` — 命名/分類，PATCH status='active'，觸發縮圖** ✅ 2026-04-24
  Step 3：名稱/描述/分類 input、PATCH API with htmlDefinition、fire-and-forget 縮圖、導向 /admin/templates
- [x] **[template-import] Frontend: `/admin/templates` 列表加「匯入模板」按鈕 + 草稿 badge** ✅ 2026-04-24
  `src/app/[locale]/admin/templates/page.tsx`：加 Upload icon「匯入模板」按鈕（Link → /admin/templates/import）；Template 介面加 `status` 欄位；draft → 橙色 badge、inactive → 灰色 overlay

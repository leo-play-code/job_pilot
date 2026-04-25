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
| Pricing | `/[locale]/pricing` | 方案比較頁（Free vs Pro），含訂閱 CTA |
| Settings / Billing | `/[locale]/settings/billing` | 訂閱狀態、管理帳單（Portal）、成功/取消提示 |

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

## Resume 全版面 HTML/CSS 預覽

### 需求
- 目前 `ResumeRenderer` 用 hardcoded Tailwind 近似版型，DB 自定模板 CSS 從不套用
- 改為 `<iframe srcdoc>` 注入真實 `buildResumeHtml()` 輸出，與 PDF 完全一致

### 頁面行為（`/resume/[id]`）

**預覽模式（Preview mode，預設）**
- 顯示 `ResumeIframePreview`：iframe 以 A4 尺寸（794×1123px）縮放至容器寬
- iframe 載入中顯示骨架 loading
- 浮動按鈕只有「編輯版面」

**編輯模式（Edit mode）**
- 點「編輯版面」進入（現有行為保留）
- 左側仍用 `ResumeRenderer`（輕量 React state 驅動即時更新）
- 右側 edit panel 不變
- 儲存後：fetch `/api/resume/:id/preview-html` → 更新 iframe HTML → 自動回到預覽模式

### 新增元件

| 元件 | 位置 | 說明 |
|---|---|---|
| `ResumeIframePreview` | `src/components/resume/ResumeIframePreview.tsx` | `<iframe srcdoc>` 容器，CSS scale 縮放，loading state |

### 修改元件

| 元件 | 變更 |
|---|---|
| `ResumeEditorClient` | 加 `initialHtml: string` prop；加 `viewMode`（preview/edit）state；儲存後 fetch 新 HTML 並切回 preview |
| `ResumeDetailPage` (page.tsx) | Server-side 生成 `initialHtml`（fetch template def + buildResumeHtml），pass 給 ResumeEditorClient |

### Responsive 縮放規則
- iframe 固定 794px 寬（A4），外層 `div` 設 `overflow: hidden`
- `transform: scale(containerWidth / 794)` via `ResizeObserver`
- 外層高度 = `1123 * scale`（避免空白 overflow）

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
---

## 原始履歷匯入（Raw Import）

### 頁面修改：`/[locale]/resume/upload`

現有上傳頁新增雙選項 tab：

| Tab | 說明 |
|---|---|
| AI 解析優化（現有）| pdf-parse + AI 潤飾 → Builder 4 步驟 |
| 直接匯入（保留原文）| 僅 pdf-parse → 不優化 → 直接存 |

**直接匯入 UI 流程：**
1. DropZone 上傳 PDF（max 5MB）
2. 顯示 `RawImportForm`：標題輸入（預填檔名）+ 語言選擇
3. 點「儲存」→ 呼叫 `POST /api/resume/import-raw`
4. 成功 → redirect `/[locale]/dashboard`（toast: 「履歷已匯入」）

### 新增元件

```
RawImportForm at src/components/resume/RawImportForm.tsx
  Shows: 上傳進度、標題 input、語言 radio（zh/en）、儲存按鈕
  API calls: POST /api/resume/import-raw
  States: idle / uploading / success / error
```

### 修改元件

```
Resume Preview page at /resume/[id]（ResumeEditorClient + page.tsx）
  Add: 若 resume.rawPdfUrl 存在，ResumeActions 顯示「下載原始 PDF」按鈕
       點擊 → 呼叫 GET /api/resume/:id/raw-pdf → 開啟 S3 URL 下載
  Add: 若 content.rawText 存在但 experience.length === 0，
       preview 區域顯示 RawTextView（格式化顯示 rawText，非 iframe 模板渲染）

Dashboard ResumeList（src/components/dashboard/ResumeList.tsx 或同位置）
  Add: 若 resume.rawPdfUrl 存在，卡片顯示「原始」灰色 badge

RawTextView at src/components/resume/RawTextView.tsx（新元件）
  Shows: rawText 以 pre 或 whitespace-pre-wrap 顯示，模擬文件質感
  Actions: 無（純顯示）
```

### i18n 新增 key
```
resume.rawImport.tabLabel       = "直接匯入（保留原文）" / "Import As-Is"
resume.rawImport.titleLabel     = "履歷標題" / "Resume Title"
resume.rawImport.saveButton     = "儲存" / "Save"
resume.rawImport.successToast   = "履歷已匯入" / "Resume imported"
resume.rawImport.rawBadge       = "原始" / "Raw"
resume.rawImport.downloadOriginal = "下載原始 PDF" / "Download Original PDF"
```

---

---

## Stripe 訂閱前端規格

### 新頁面：`/[locale]/pricing`

**版面**：兩欄方案卡片（Free vs Pro）

| 區塊 | Free | Pro |
|---|---|---|
| 價格 | $0 / 月 | $19.99 / 月 |
| 每日 AI 次數 | 10 次 | 無限 |
| 模板選擇 | 全部 | 全部 |
| 下載 PDF | ✓ | ✓ |
| 優先支援 | — | ✓ |
| CTA 按鈕 | 「繼續免費使用」（disabled if logged in） | 「立即訂閱」→ POST checkout |

**CTA 行為**：
- 未登入 → redirect `/[locale]/login?redirect=/pricing`
- 已登入 Free → POST `/api/stripe/create-checkout-session` → `router.push(checkoutUrl)`（full page redirect，因為是 Stripe hosted page）
- 已登入 Pro → 顯示「已訂閱」badge，CTA 改為「管理訂閱」→ POST `/api/stripe/create-portal-session` → redirect portalUrl

**元件**：
```
PricingPage at /[locale]/pricing
  PlanCard × 2 (Free, Pro)
  States: loading（spinner on CTA button）/ error（toast）

PlanCard (client component)
  Props: plan, price, features[], isCurrentPlan, onSubscribe
  Highlighted (ring-2 ring-primary) when plan === 'PRO'
```

---

### 新頁面：`/[locale]/settings/billing`

**版面**：
- 顯示目前方案（Free / Pro）
- Pro 用戶：顯示「訂閱到期日：{date}」+ 「管理訂閱」按鈕 → portal
- Free 用戶：顯示「升級 Pro — $19.99/月」按鈕 → checkout
- URL 帶 `?success=true` 時：顯示綠色 Banner「訂閱成功！歡迎使用 Pro！」
- URL 帶 `?canceled=true` 時：顯示黃色 Banner「訂閱已取消，隨時可重新訂閱」

**元件**：
```
BillingPage at /[locale]/settings/billing (client component)
  API calls: GET /api/user/subscription
  States: loading / error / free / pro
  Sub-components:
    SubscriptionStatusCard  — 顯示 plan + period end
    BillingActionButton     — 依 plan 顯示 checkout 或 portal 按鈕
    SuccessBanner / CanceledBanner — query param 觸發
```

---

### 修改元件

```
UpgradeModal (src/components/shared/UpgradeModal.tsx)
  現有：API 回 429 時觸發
  修改：「升級 Pro」按鈕改為呼叫 POST /api/stripe/create-checkout-session
       → redirect Stripe Checkout（取代原本的 alert/placeholder）
  States: idle / loading（spinner）/ error（toast）

UsageBadge (src/components/shared/UsageBadge.tsx)
  現有：顯示今日剩餘次數
  修改：若 plan=PRO 顯示金色「Pro ∞」badge，隱藏次數計數

Header (src/components/shared/Header.tsx)
  修改：已登入 Pro 用戶顯示「Pro」小 badge 於 avatar 旁
       已登入 Free 用戶在 user menu 加入「升級 Pro ✨」連結 → /pricing
```

---

### i18n 新增 key（Stripe / Billing）

```
pricing.title              = "選擇方案" / "Choose Your Plan"
pricing.free.name          = "免費版" / "Free"
pricing.free.price         = "$0 / 月" / "$0 / month"
pricing.free.cta           = "繼續免費使用" / "Continue for Free"
pricing.pro.name           = "Pro"
pricing.pro.price          = "$19.99 / 月" / "$19.99 / month"
pricing.pro.cta            = "立即訂閱" / "Subscribe Now"
pricing.pro.currentPlan    = "目前方案" / "Current Plan"
pricing.pro.manage         = "管理訂閱" / "Manage Subscription"
pricing.features.unlimited = "無限 AI 使用次數" / "Unlimited AI usage"
pricing.features.limit10   = "每日 10 次 AI 使用" / "10 AI uses per day"
pricing.features.templates = "全部模板" / "All templates"
pricing.features.pdf       = "PDF 下載" / "PDF download"
pricing.features.priority  = "優先客戶支援" / "Priority support"

billing.title              = "訂閱管理" / "Billing"
billing.currentPlan        = "目前方案" / "Current Plan"
billing.planFree           = "免費版" / "Free"
billing.planPro            = "Pro 專業版" / "Pro"
billing.periodEnd          = "下次續費 / 到期日" / "Next billing / Expiry"
billing.subscribeCta       = "升級 Pro — $19.99/月" / "Upgrade to Pro — $19.99/month"
billing.portalCta          = "管理訂閱" / "Manage Subscription"
billing.successBanner      = "訂閱成功！歡迎使用 Pro！" / "Subscription successful! Welcome to Pro!"
billing.canceledBanner     = "訂閱已取消，隨時可重新訂閱。" / "Subscription canceled. You can resubscribe anytime."

upgrade.title              = "升級到 Pro" / "Upgrade to Pro"
upgrade.description        = "您已達到今日 AI 使用上限。升級 Pro 享無限使用！" / "You've reached your daily AI limit. Upgrade to Pro for unlimited usage!"
upgrade.cta                = "立即訂閱 $19.99/月" / "Subscribe for $19.99/month"

header.upgradePro          = "升級 Pro ✨" / "Upgrade to Pro ✨"
```

## Task Status

### Pending

_(no pending tasks)_

### Done
- [x] **[stripe-subscription] Frontend: `/[locale]/pricing` 頁面** ✅ 2026-04-25
  `src/app/[locale]/pricing/page.tsx` — 兩欄 Free vs Pro 方案卡片；CTA 依 auth 狀態呈現（未登入 → /login、Free → checkout API → Stripe redirect、Pro → portal API）；loading skeleton；ring-2 ring-primary highlight on Pro card
- [x] **[stripe-subscription] Frontend: `/[locale]/settings/billing` 頁面** ✅ 2026-04-25
  `src/app/[locale]/settings/billing/page.tsx` — 訂閱狀態卡片（plan + periodEnd）；Free → checkout、Pro → portal；`?success=true` 綠色 banner、`?canceled=true` 黃色 banner；Suspense boundary for useSearchParams
- [x] **[stripe-subscription] Frontend: 修改 `UpgradeModal`** ✅ 2026-04-25
  `src/components/shared/UpgradeModal.tsx` — 升級按鈕改呼叫 POST /api/stripe/create-checkout-session → window.location.href；loading spinner + disabled；error inline 提示；使用 upgrade.* i18n keys
- [x] **[stripe-subscription] Frontend: 修改 `UsageBadge`** ✅ 2026-04-25
  `src/components/shared/UsageBadge.tsx` — unlimited:true 時顯示金色「Pro ∞」badge（amber）；否則維持現有剩餘次數顯示
- [x] **[stripe-subscription] Frontend: 修改 `Header`（UserAvatarDropdown）** ✅ 2026-04-25
  `src/components/shared/UserAvatarDropdown.tsx` — Free 用戶 dropdown 加「升級 Pro ✨」選項（router.push /pricing）；Pro 用戶 avatar 右下角顯示小 amber「Pro」badge；帳單連結修正為 /settings/billing；使用 header.upgradePro i18n key
- [x] **[stripe-subscription] Frontend: i18n — zh.json / en.json 新增 pricing / billing / upgrade / header key** ✅ 2026-04-25
  `src/messages/zh.json` + `src/messages/en.json` — 新增 pricing.*（14 keys）、billing.*（8 keys）、upgrade.*（3 keys）、header.upgradePro
- [x] **[raw-import] Frontend: 修改 `/resume/upload` 加入雙選項 tab（AI 解析 / 直接匯入）** ✅ 2026-04-24
  `src/app/[locale]/resume/upload/page.tsx` + `src/components/resume/UploadTabsClient.tsx` — 雙 tab UI（AI 解析優化 / 直接匯入），預設 AI tab，切換後顯示對應表單
- [x] **[raw-import] Frontend: `RawImportForm` 元件** ✅ 2026-04-24
  `src/components/resume/RawImportForm.tsx` — DropZone（PDF max 5MB）+ 標題 input（預填檔名）+ 語言 radio（zh/en）+ 儲存按鈕；States: idle / uploading（spinner）/ error；成功後 redirect /dashboard
- [x] **[raw-import] Frontend: `RawTextView` 元件** ✅ 2026-04-24
  `src/components/resume/RawTextView.tsx` — rawText 以 `<pre>` whitespace-pre-wrap 純顯示，A4 質感白色 div；ResumeEditorClient 在 rawText 存在且 experience 為空時自動切換顯示
- [x] **[raw-import] Frontend: Resume Preview page 加「下載原始 PDF」按鈕** ✅ 2026-04-24
  `src/components/resume/ResumeActions.tsx` — 新增 `rawPdfUrl` prop；非空時顯示下載按鈕；呼叫 GET /api/resume/:id/raw-pdf 取 presigned URL 後 window.open；`src/app/[locale]/resume/[id]/page.tsx` 傳遞 `resume.rawPdfUrl`
- [x] **[raw-import] Frontend: Dashboard 卡片加「原始」badge** ✅ 2026-04-24
  `src/components/resume/ResumeList.tsx` — ResumeItem interface 加 rawPdfUrl；rawPdfUrl 非空時顯示灰色「原始」badge；dashboard page 的 Prisma select 加入 rawPdfUrl 欄位
- [x] **[raw-import] i18n: zh.json / en.json 新增 raw import 相關 key** ✅ 2026-04-24
  `resume.rawImport.*` 7 個 key 完整新增於 zh.json / en.json
- [x] **[resume-preview] Frontend: `ResumeIframePreview` component** ✅ 2026-04-24
  `src/components/resume/ResumeIframePreview.tsx` — `<iframe srcdoc>` 以 CSS transform scale 縮放至容器寬；ResizeObserver 計算 scale；onLoad opacity transition；skeleton loading state；shadow-xl paper 質感
- [x] **[resume-preview] Frontend: 修改 `ResumeEditorClient`** ✅ 2026-04-24
  加 `initialHtml` prop、`previewHtml` state、`viewMode`（preview/edit）state；儲存後 fetch `/api/resume/:id/preview-html` 更新 iframe 並自動切回 preview；浮動 action bar 依 viewMode 顯示不同按鈕（預覽/儲存/取消/編輯版面）
- [x] **[resume-preview] Frontend: 修改 `ResumeDetailPage` (page.tsx)** ✅ 2026-04-24
  server-side 解析 template definition（built-in → DB → fallback modern）；呼叫 `buildResumeHtml()` 生成 `initialHtml`；傳給 `ResumeEditorClient`
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

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

### ResumeList / CoverLetterList 設計原則
- 緊湊列表：`px-3 py-2 space-y-1.5`（非大卡片）
- 兩欄對稱：Dashboard 保持 `lg:grid-cols-2`，左履歷右自薦信
- 刪除互動：垃圾桶 icon（Trash2）hover 顯示，點擊後在 item 行內展開「刪除 / 取消」確認
- 樂觀更新：刪除成功後從 local state 移除，不重載頁面
- 錯誤處理：API 失敗顯示 `dashboard.deleteError` 文字於列表頂部
- i18n：刪除/取消按鈕文字來自 `common.delete` / `common.cancel`

---

## 模板清單（MVP）

| templateId | 名稱 | 特色 |
|---|---|---|
| `modern` | Modern | 單欄、簡潔留白、適合科技業 |
| `professional` | Professional | 雙欄、傳統正式、適合金融/法律 |
| `creative` | Creative | 左側色塊、有個性、適合設計/行銷 |

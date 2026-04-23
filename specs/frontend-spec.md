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
Dashboard           → ResumeList, CoverLetterList, UsageBadge, QuickActions
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

## 模板清單（MVP）

| templateId | 名稱 | 特色 |
|---|---|---|
| `modern` | Modern | 單欄、簡潔留白、適合科技業 |
| `professional` | Professional | 雙欄、傳統正式、適合金融/法律 |
| `creative` | Creative | 左側色塊、有個性、適合設計/行銷 |

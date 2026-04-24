'use client'

import { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Upload, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import type { ResumeContent } from '@/types/resume'

// ─── Sample content (client-safe hardcoded version) ──────────────────────────

const WIZARD_SAMPLE_CONTENT: ResumeContent = {
  personalInfo: {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '+1 (555) 000-0000',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexj',
  },
  summary:
    'Experienced software engineer with 5+ years building scalable web applications and leading cross-functional teams.',
  experience: [
    {
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      startDate: '2021-01',
      endDate: '2024-01',
      current: false,
      bullets: [
        'Led development of core platform features serving 1M+ users',
        'Reduced API latency by 40% through caching optimizations',
        'Mentored 4 junior engineers and ran weekly code reviews',
      ],
    },
    {
      company: 'Startup Inc',
      title: 'Software Engineer',
      startDate: '2019-06',
      endDate: '2020-12',
      current: false,
      bullets: [
        'Built real-time dashboard processing 50K events/sec',
        'Shipped mobile-responsive redesign increasing conversion 25%',
      ],
    },
  ],
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      field: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-06',
      gpa: '3.8',
    },
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
  achievements: ['Best Engineer Award 2023', 'Speaker at React Conf 2022'],
}

// ─── Client-side HTML builder (mirrors pdf.ts buildResumeHtml) ───────────────

function buildPreviewHtml(
  content: ResumeContent,
  definition: { css: string; layout: 'single' | 'split'; sectionOrder?: string[] },
): string {
  const { personalInfo: p, summary, experience, education, skills, achievements } = content
  const { css, layout } = definition
  const isSplit = layout === 'split'
  const order = definition.sectionOrder ?? ['summary', 'experience', 'education', 'skills', 'achievements']
  const L = { present: 'Present', skills: 'Skills', exp: 'Experience', edu: 'Education', summary: 'Summary', achieve: 'Achievements' }

  const sections: Record<string, string> = {
    summary: summary ? `<h2>${L.summary}</h2><p style="font-size:13px;margin:4px 0">${summary}</p>` : '',
    experience: experience.length ? `<h2>${L.exp}</h2>${experience.map(e => `
      <div style="margin-bottom:10px">
        <div class="job-title">${e.title}</div>
        <div class="company">${e.company} · ${e.startDate} – ${e.current ? L.present : (e.endDate ?? '')}</div>
        <ul>${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>`).join('')}` : '',
    education: education.length ? `<h2>${L.edu}</h2>${education.map(e => `
      <div style="margin-bottom:8px">
        <div class="job-title">${e.school}</div>
        <div class="company">${e.degree}${e.field ? `, ${e.field}` : ''} · ${e.startDate} – ${e.endDate ?? ''}</div>
      </div>`).join('')}` : '',
    skills: skills.length ? `<h2>${L.skills}</h2><div class="skills">${skills.map(s => `<span class="skill">${s}</span>`).join('')}</div>` : '',
    achievements: achievements?.length ? `<h2>${L.achieve}</h2><ul>${achievements.map(a => `<li>${a}</li>`).join('')}</ul>` : '',
  }

  if (isSplit) {
    const sidebarHtml = `
      <div class="sidebar">
        <h1>${p.name}</h1>
        <div class="contact">${p.email}${p.phone ? `<br>${p.phone}` : ''}${p.location ? `<br>${p.location}` : ''}${p.linkedin ? `<br>${p.linkedin}` : ''}</div>
        <h2>${L.skills}</h2>${skills.map(s => `<div class="skill">• ${s}</div>`).join('')}
        ${achievements?.length ? `<h2>${L.achieve}</h2>${achievements.map(a => `<div class="skill">• ${a}</div>`).join('')}` : ''}
        <h2>${L.edu}</h2>${education.map(e => `<div style="margin-bottom:8px"><div style="font-weight:bold;font-size:12px">${e.school}</div><div style="font-size:11px;opacity:.8">${e.degree}</div></div>`).join('')}
      </div>`
    const mainSections = order.filter(s => !['skills', 'education', 'achievements'].includes(s))
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${sidebarHtml}<div class="main">${mainSections.map(s => sections[s] ?? '').join('')}</div></body></html>`
  }

  const header = `<div style="margin-bottom:16px"><h1>${p.name}</h1><div class="contact">${[p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(' | ')}</div></div>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="main">${header}${order.map(s => sections[s] ?? '').join('')}</div></body></html>`
}

// ─── iframe preview component ─────────────────────────────────────────────────

function CssPreviewFrame({ css, layout, content, sectionOrder }: {
  css: string
  layout: 'single' | 'split'
  content: ResumeContent
  sectionOrder: string[]
}) {
  const html = buildPreviewHtml(content, { css, layout, sectionOrder })
  return (
    <iframe
      srcDoc={html}
      sandbox="allow-same-origin"
      style={{ width: '794px', height: '600px', border: 'none', transformOrigin: 'top left', transform: 'scale(0.42)' }}
      title="模板預覽"
    />
  )
}

// ─── Section labels ───────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  summary: '個人摘要',
  experience: '工作經歷',
  education: '教育背景',
  skills: '技能',
  achievements: '成就',
}

const DEFAULT_SECTIONS = ['summary', 'experience', 'education', 'skills', 'achievements']

// ─── Analysis result type ─────────────────────────────────────────────────────

interface AnalysisResult {
  templateId: string
  analysis: {
    layout: 'single' | 'split'
    primaryColor: string
    secondaryColor: string
    fontFamily: 'serif' | 'sans-serif'
    detectedSections: string[]
    confidence: number
    css: string
  }
  htmlDefinition: {
    css: string
    layout: 'single' | 'split'
    sectionOrder: string[]
  }
}

// ─── Sortable section item ────────────────────────────────────────────────────

function SortableSectionItem({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-white text-sm select-none ${
        isDragging ? 'shadow-lg z-50' : 'shadow-sm'
      } border-gray-200 text-gray-700`}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="flex-1">{SECTION_LABELS[id] ?? id}</span>
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ['上傳設計圖', '分析 & 調整', '命名 & 發佈']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const isActive = num === step
        const isDone = num < step
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isDone ? '✓' : num}
            </div>
            <span
              className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
            >
              {label}
            </span>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main wizard page ─────────────────────────────────────────────────────────

export default function TemplateImportPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState(1)

  // Step 1 state
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2 state (from API response)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [currentLayout, setCurrentLayout] = useState<'single' | 'split'>('single')
  const [currentCss, setCurrentCss] = useState<string>('')
  const [currentColor, setCurrentColor] = useState<string>('#1a2744')
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTIONS)
  const [cssOpen, setCssOpen] = useState(false)

  // Step 3 state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('tech')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── File selection ──────────────────────────────────────────────────────────

  function handleFileSelect(selectedFile: File) {
    const isPdf = selectedFile.type === 'application/pdf'
    const isImage =
      selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg'

    if (!isPdf && !isImage) {
      setUploadError('請上傳 PNG、JPG 或 PDF 檔案')
      return
    }

    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setUploadError(isPdf ? 'PDF 最大 10MB' : '圖片最大 5MB')
      return
    }

    setUploadError(null)
    setFile(selectedFile)
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(selectedFile))
    } else {
      setPreviewUrl(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) handleFileSelect(selected)
  }

  // ── Step 1 → analyze ───────────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!file) return
    setAnalyzing(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/templates/import', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 422) {
        setUploadError('不支援的檔案類型')
        return
      }
      if (res.status === 503) {
        setUploadError('Vision API 暫時無法使用，請稍後再試')
        return
      }
      if (!res.ok) {
        setUploadError('分析失敗，請重試')
        return
      }

      const json = await res.json()
      const data: AnalysisResult = json.data

      setResult(data)
      setCurrentLayout(data.htmlDefinition.layout)
      setCurrentCss(data.htmlDefinition.css)
      setCurrentColor(data.analysis.primaryColor)
      setSectionOrder(
        data.analysis.detectedSections.length > 0
          ? data.analysis.detectedSections
          : DEFAULT_SECTIONS,
      )
      setStep(2)
    } catch {
      setUploadError('網路錯誤，請重試')
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Step 2: color change → update CSS ────────────────────────────────────

  const handleColorChange = useCallback(
    (newColor: string) => {
      // Only replace the current primary color, preserving other hex values (text, borders, etc.)
      const updated = currentCss.replaceAll(currentColor, newColor)
      setCurrentColor(newColor)
      setCurrentCss(updated)
    },
    [currentCss, currentColor],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSectionOrder(prev => {
        const oldIdx = prev.indexOf(String(active.id))
        const newIdx = prev.indexOf(String(over.id))
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  // ── Step 3: publish ────────────────────────────────────────────────────────

  async function handlePublish() {
    if (!result || !name.trim() || !description.trim()) return
    setPublishing(true)
    setPublishError(null)

    try {
      const res = await fetch(`/api/admin/templates/${result.templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          status: 'active',
          htmlDefinition: {
            css: currentCss,
            layout: currentLayout,
            sectionOrder,
          },
        }),
      })

      if (!res.ok) {
        setPublishError('發佈失敗，請重試')
        return
      }

      // Fire-and-forget thumbnail generation
      fetch(`/api/admin/templates/${result.templateId}/thumbnail`, {
        method: 'POST',
      }).catch(() => {})

      router.push('/admin/templates')
    } catch {
      setPublishError('網路錯誤，請重試')
    } finally {
      setPublishing(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">匯入模板</h1>
          <p className="text-gray-500 text-sm mt-1">上傳設計圖，AI 自動分析並生成版型</p>
        </div>

        <StepIndicator step={step} />

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">上傳設計圖</h2>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="hidden"
                onChange={handleInputChange}
              />
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">拖曳或點擊上傳</p>
              <p className="text-gray-400 text-sm mt-1">接受 PNG、JPG（最大 5MB）或 PDF（最大 10MB）</p>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="設計圖預覽"
                  className="w-full object-contain max-h-64"
                />
              </div>
            )}

            {/* PDF file name display */}
            {file && !previewUrl && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600 font-medium">{file.name}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            )}

            {uploadError && (
              <p className="mt-3 text-sm text-red-600">{uploadError}</p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 正在分析版型設計，約需 15-30 秒...
                </>
              ) : (
                '開始 AI 分析'
              )}
            </button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: original design */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  原始設計圖
                </p>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="原始設計"
                    className="w-full rounded-lg object-contain border border-gray-100"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-100 text-gray-400 text-sm">
                    PDF 檔案（無預覽）
                  </div>
                )}
              </div>

              {/* Right: live preview + adjustment panel */}
              <div className="space-y-4">
                {/* Live resume preview */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 overflow-hidden">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    即時預覽
                  </p>
                  <div style={{ height: '252px', overflow: 'hidden' }}>
                    <CssPreviewFrame
                      css={currentCss}
                      layout={currentLayout}
                      content={WIZARD_SAMPLE_CONTENT}
                      sectionOrder={sectionOrder}
                    />
                  </div>
                </div>

                {/* Adjustment panel */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    版型調整
                  </p>

                  {/* Primary color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      主色
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={e => handleColorChange(e.target.value)}
                        className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
                      />
                      <span className="text-sm text-gray-500 font-mono">{currentColor}</span>
                    </div>
                  </div>

                  {/* Layout */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      版型
                    </label>
                    <div className="flex gap-3">
                      {(['single', 'split'] as const).map(layout => (
                        <label key={layout} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="layout"
                            value={layout}
                            checked={currentLayout === layout}
                            onChange={() => setCurrentLayout(layout)}
                            className="accent-primary"
                          />
                          <span className="text-sm text-gray-700">
                            {layout === 'single' ? '單欄 (Single)' : '雙欄 (Split/Sidebar)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Section order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      區塊順序
                    </label>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {sectionOrder.map(id => (
                            <SortableSectionItem key={id} id={id} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>

                  {/* Advanced CSS editor */}
                  <details open={cssOpen} onToggle={e => setCssOpen((e.target as HTMLDetailsElement).open)}>
                    <summary className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                      CSS 進階編輯 {cssOpen ? '▲' : '▼'}
                    </summary>
                    <textarea
                      value={currentCss}
                      onChange={e => setCurrentCss(e.target.value)}
                      rows={10}
                      spellCheck={false}
                      className="mt-2 w-full font-mono text-xs border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                      placeholder="/* AI 生成的 CSS */"
                    />
                  </details>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                下一步
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">命名 & 發佈</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  模板名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Executive Blue"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  描述 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="適合哪種職業..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  分類
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                >
                  <option value="tech">科技 (Tech)</option>
                  <option value="finance">金融 (Finance)</option>
                  <option value="creative">創意 (Creative)</option>
                  <option value="other">其他 (Other)</option>
                </select>
              </div>
            </div>

            {publishError && (
              <p className="mt-4 text-sm text-red-600">{publishError}</p>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !name.trim() || !description.trim()}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    發佈中...
                  </>
                ) : (
                  '發佈模板'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

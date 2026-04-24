'use client'

import { useState, useCallback, useRef } from 'react'
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
import { GripVertical, LayoutGrid, Check, X, Pencil } from 'lucide-react'
import { ResumeRenderer, DEFAULT_SECTION_ORDER } from './ResumeRenderer'
import type { ResumeContent, LayoutOverride } from '@/types/resume'

// ─── Section label map ────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  summary: '個人摘要',
  experience: '工作經歷',
  education: '教育背景',
  skills: '技能',
  achievements: '成就',
}

// ─── Sortable section item (in the reorder panel) ────────────────────────────

function SortableSectionItem({ id, isActive }: { id: string; isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
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
      } ${isActive ? 'border-primary/30 text-gray-900' : 'border-gray-200 text-gray-400'}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="flex-1">{SECTION_LABELS[id] ?? id}</span>
      {!isActive && <span className="text-xs text-gray-300">(空)</span>}
    </div>
  )
}

// ─── Inline editable text ─────────────────────────────────────────────────────

interface InlineEditProps {
  value: string
  onSave: (val: string) => void
  multiline?: boolean
  className?: string
}

function InlineEdit({ value, onSave, multiline = false, className = '' }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  function startEdit() {
    setDraft(value)
    setEditing(true)
    setTimeout(() => ref.current?.focus(), 0)
  }

  function commit() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setEditing(false); setDraft(value) }
    if (e.key === 'Enter' && !multiline) commit()
  }

  if (editing) {
    const sharedProps = {
      ref: ref as React.RefObject<HTMLTextAreaElement & HTMLInputElement>,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKeyDown,
      className: `w-full bg-blue-50 border border-blue-300 rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-blue-400 ${className}`,
    }
    return multiline
      ? <textarea {...sharedProps} rows={3} />
      : <input {...sharedProps} type="text" />
  }

  return (
    <span
      className={`group/edit relative cursor-text hover:bg-blue-50 hover:outline hover:outline-1 hover:outline-blue-200 rounded px-0.5 transition-colors ${className}`}
      onClick={startEdit}
      title="點擊編輯"
    >
      {value || <span className="text-gray-300 italic">（空白）</span>}
      <Pencil className="w-3 h-3 ml-1 text-blue-400 opacity-0 group-hover/edit:opacity-100 transition-opacity inline-block align-middle" />
    </span>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

interface ResumeEditorClientProps {
  resumeId: string
  initialContent: ResumeContent
  templateId: string
  initialLayoutOverride: LayoutOverride | null
}

export function ResumeEditorClient({
  resumeId,
  initialContent,
  templateId,
  initialLayoutOverride,
}: ResumeEditorClientProps) {
  const defaultOrder = initialLayoutOverride?.sectionOrder ?? DEFAULT_SECTION_ORDER
  const [isEditing, setIsEditing] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder)
  const [content, setContent] = useState<ResumeContent>(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSectionOrder(prev => {
        const oldIdx = prev.indexOf(String(active.id))
        const newIdx = prev.indexOf(String(over.id))
        return arrayMove(prev, oldIdx, newIdx)
      })
      setDirty(true)
    }
  }

  const updateContent = useCallback(<K extends keyof ResumeContent>(
    key: K,
    value: ResumeContent[K],
  ) => {
    setContent(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }, [])

  function updateBullet(expIdx: number, bulletIdx: number, value: string) {
    const exp = [...content.experience]
    exp[expIdx] = { ...exp[expIdx], bullets: exp[expIdx].bullets.map((b, i) => i === bulletIdx ? value : b) }
    updateContent('experience', exp)
  }

  function updateExpField(expIdx: number, field: 'company' | 'title', value: string) {
    const exp = [...content.experience]
    exp[expIdx] = { ...exp[expIdx], [field]: value }
    updateContent('experience', exp)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/resume/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content as unknown as Record<string, unknown>,
          layoutOverride: { sectionOrder },
        }),
      })
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setSectionOrder(defaultOrder)
    setContent(initialContent)
    setDirty(false)
    setIsEditing(false)
  }

  // Determine which sections have content (for the reorder panel)
  const activeSections = new Set([
    ...(content.summary ? ['summary'] : []),
    ...(content.experience.length ? ['experience'] : []),
    ...(content.education.length ? ['education'] : []),
    ...(content.skills.length ? ['skills'] : []),
    ...((content.achievements?.length) ? ['achievements'] : []),
  ])

  return (
    <div className="flex gap-6">
      {/* ── Resume preview ── */}
      <div className="flex-1 min-w-0 overflow-x-auto">
        <ResumeRenderer
          content={content}
          templateId={templateId}
          sectionOrder={sectionOrder}
        />
      </div>

      {/* ── Edit panel ── */}
      {isEditing && (
        <div className="w-56 shrink-0 space-y-4">
          {/* Section reorder */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">區塊順序</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sectionOrder.map(id => (
                    <SortableSectionItem key={id} id={id} isActive={activeSections.has(id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Quick text edit panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">快速編輯</p>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">姓名</p>
              <InlineEdit
                value={content.personalInfo.name}
                onSave={v => updateContent('personalInfo', { ...content.personalInfo, name: v })}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">摘要</p>
              <InlineEdit
                value={content.summary ?? ''}
                onSave={v => updateContent('summary', v)}
                multiline
              />
            </div>

            {content.experience.slice(0, 2).map((exp, i) => (
              <div key={i} className="space-y-1.5 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">工作 {i + 1}</p>
                <InlineEdit
                  value={exp.company}
                  onSave={v => updateExpField(i, 'company', v)}
                />
                <InlineEdit
                  value={exp.title}
                  onSave={v => updateExpField(i, 'title', v)}
                />
                {exp.bullets.slice(0, 2).map((b, j) => (
                  <InlineEdit
                    key={j}
                    value={b}
                    onSave={v => updateBullet(i, j, v)}
                    multiline
                    className="text-xs"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Floating action bar ── */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white border border-gray-200 rounded-full shadow-lg px-3 py-2">
        {isEditing ? (
          <>
            {dirty && (
              <span className="text-xs text-amber-600 mr-1">未儲存</span>
            )}
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 已儲存
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
            <button
              onClick={handleCancel}
              className="text-xs px-2 py-1.5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            編輯版面
          </button>
        )}
      </div>
    </div>
  )
}

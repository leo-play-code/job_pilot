'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { BlurImage } from '@/components/shared/BlurImage'
import { PlusCircle, RefreshCw, Trash2, ToggleLeft, ToggleRight, Upload, Sparkles, CheckCircle } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  thumbnailUrl: string | null
  isActive: boolean
  status: string
  sortOrder: number
  createdAt: string
}

type StatusFilter = 'all' | 'draft' | 'active' | 'inactive'

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  async function fetchTemplates() {
    setLoading(true)
    const res = await fetch('/api/admin/templates')
    const json = await res.json()
    setTemplates(json.data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  async function toggleActive(template: Template) {
    setActionId(template.id)
    await fetch(`/api/admin/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !template.isActive }),
    })
    await fetchTemplates()
    setActionId(null)
  }

  async function regenerateThumbnail(id: string) {
    setActionId(id)
    await fetch(`/api/admin/templates/${id}/thumbnail`, { method: 'POST' })
    await fetchTemplates()
    setActionId(null)
  }

  async function deleteTemplate(id: string) {
    if (!confirm('確定要刪除此模板？')) return
    setActionId(id)
    await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' })
    await fetchTemplates()
    setActionId(null)
  }

  async function publishTemplate(id: string) {
    setActionId(id)
    await fetch(`/api/admin/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', isActive: true }),
    })
    await fetchTemplates()
    setActionId(null)
  }

  async function generateWithAI() {
    setGenerating(true)
    setGenerateMsg(null)
    try {
      const res = await fetch('/api/admin/templates/generate', { method: 'POST' })
      const json = await res.json() as { generated?: number; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')
      setGenerateMsg(`成功生成 ${json.generated} 個草稿模板，請審核後發布`)
      await fetchTemplates()
      setStatusFilter('draft')
    } catch (err) {
      setGenerateMsg(`生成失敗：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setGenerating(false)
    }
  }

  const filteredTemplates = templates.filter((t) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'draft') return t.status === 'draft'
    if (statusFilter === 'active') return t.status === 'active' || (t.isActive && t.status !== 'draft' && t.status !== 'inactive')
    if (statusFilter === 'inactive') return t.status === 'inactive' || (!t.isActive && t.status !== 'draft')
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
            <p className="text-gray-500 text-sm mt-1">共 {templates.length} 個模板</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generateWithAI}
              disabled={generating}
              className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'AI 生成中…' : 'AI 生成模板'}
            </button>
            <Link
              href="/admin/templates/import"
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              匯入模板
            </Link>
            <Link
              href="/admin/templates/new"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="w-4 h-4" />
              新增模板
            </Link>
          </div>
        </div>

        {generateMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${generateMsg.startsWith('成功') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {generateMsg}
          </div>
        )}

        <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
          {(['all', 'draft', 'active', 'inactive'] as StatusFilter[]).map((f) => {
            const labels: Record<StatusFilter, string> = { all: '全部', draft: '草稿', active: '啟用', inactive: '停用' }
            const counts: Record<StatusFilter, number> = {
              all: templates.length,
              draft: templates.filter((t) => t.status === 'draft').length,
              active: templates.filter((t) => t.status === 'active' || (t.isActive && t.status !== 'draft' && t.status !== 'inactive')).length,
              inactive: templates.filter((t) => t.status === 'inactive' || (!t.isActive && t.status !== 'draft')).length,
            }
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${statusFilter === f ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {labels[f]}
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{counts[f]}</span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                {t.thumbnailUrl ? (
                  <BlurImage
                    src={t.thumbnailUrl}
                    alt={t.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover object-top"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">無縮圖</span>
                )}
                {t.status === 'draft' && (
                  <div className="absolute inset-0 bg-orange-500/20 flex items-start justify-end p-2">
                    <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      草稿
                    </span>
                  </div>
                )}
                {(t.status === 'inactive' || (!t.status && !t.isActive)) && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="text-gray-500 font-medium text-sm">已停用</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <span className="shrink-0 text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">{t.category}</span>
                </div>
                <p className="text-gray-500 text-xs mb-2 line-clamp-2">{t.description}</p>
                <p className="text-gray-400 text-xs mb-3 font-mono">ID: {t.id}</p>

                <div className="flex gap-2 flex-wrap">
                  {t.status === 'draft' ? (
                    <button
                      className="flex items-center gap-1 text-xs border border-green-300 text-green-700 rounded-md px-2.5 py-1.5 hover:bg-green-50 disabled:opacity-50 transition-colors"
                      disabled={actionId === t.id}
                      onClick={() => publishTemplate(t.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      發布
                    </button>
                  ) : (
                    <button
                      className="flex items-center gap-1 text-xs border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      disabled={actionId === t.id}
                      onClick={() => toggleActive(t)}
                    >
                      {t.isActive
                        ? <><ToggleRight className="w-3.5 h-3.5" />停用</>
                        : <><ToggleLeft className="w-3.5 h-3.5" />啟用</>
                      }
                    </button>
                  )}
                  <button
                    className="flex items-center gap-1 text-xs border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    disabled={actionId === t.id}
                    onClick={() => regenerateThumbnail(t.id)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    更新縮圖
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs border border-red-200 text-red-600 rounded-md px-2.5 py-1.5 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    disabled={actionId === t.id}
                    onClick={() => deleteTemplate(t.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">{statusFilter === 'draft' ? '沒有草稿模板' : '尚無模板'}</p>
            <p className="text-sm mt-2">
              {statusFilter === 'draft'
                ? '點擊「AI 生成模板」自動產出草稿'
                : '執行 seed script、手動新增，或使用 AI 生成模板'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

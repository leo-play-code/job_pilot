'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { PlusCircle, RefreshCw, Trash2, ToggleLeft, ToggleRight, Upload } from 'lucide-react'

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

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
            <p className="text-gray-500 text-sm mt-1">共 {templates.length} 個模板</p>
          </div>
          <div className="flex items-center gap-3">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                {t.thumbnailUrl ? (
                  <Image
                    src={t.thumbnailUrl}
                    alt={t.name}
                    fill
                    className="object-cover object-top"
                    unoptimized
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

        {templates.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">尚無模板</p>
            <p className="text-sm mt-2">執行 seed script 或手動新增模板</p>
          </div>
        )}
      </div>
    </div>
  )
}

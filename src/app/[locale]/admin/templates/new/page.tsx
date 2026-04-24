'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_CSS = `body{font-family:'Helvetica Neue',sans-serif;color:#222;margin:0}
h1{font-size:26px;margin:0}
.contact{color:#666;font-size:13px;margin-top:4px}
h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px}
.job-title{font-weight:bold}
.company{color:#555;font-size:13px}
ul{margin:4px 0;padding-left:18px}
li{font-size:13px;margin-bottom:2px}
.skills{display:flex;flex-wrap:wrap;gap:6px}
.skill{background:#f0f0f0;padding:2px 8px;border-radius:3px;font-size:12px}`

type Category = 'tech' | 'finance' | 'creative' | 'other'
type Layout = 'single' | 'split'

export default function NewTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('tech')
  const [sortOrder, setSortOrder] = useState(0)
  const [layout, setLayout] = useState<Layout>('single')
  const [css, setCss] = useState(DEFAULT_CSS)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        category,
        sortOrder: Number(sortOrder),
        htmlDefinition: {
          css,
          layout,
          sectionOrder: ['summary', 'experience', 'education', 'skills', 'achievements'],
        },
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? '建立失敗')
      setLoading(false)
      return
    }

    router.push('/admin/templates')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">新增模板</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">模板名稱</label>
              <input
                required
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="e.g. Minimal Clean"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">排序</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSortOrder(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">描述</label>
            <input
              required
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              placeholder="適合哪種職業、風格特色..."
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">分類</label>
              <select
                value={category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as Category)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="tech">科技 (Tech)</option>
                <option value="finance">金融 (Finance)</option>
                <option value="creative">設計 (Creative)</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">版型</label>
              <select
                value={layout}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLayout(e.target.value as Layout)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="single">單欄 (Single Column)</option>
                <option value="split">雙欄 (Split/Sidebar)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">CSS 樣式</label>
            <textarea
              required
              value={css}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCss(e.target.value)}
              rows={12}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs font-mono resize-y outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="貼上模板的 CSS 定義..."
            />
            <p className="text-xs text-gray-400">
              使用 .sidebar, .main, h1, h2, .contact, .job-title, .company, .skill 等 class 名稱
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? '建立中...' : '建立模板'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

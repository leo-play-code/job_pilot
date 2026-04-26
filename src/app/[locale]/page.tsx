import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { FileText, Upload, Zap, Search, Bot, Send } from 'lucide-react'
import { auth } from '@/auth'
import { HeroDemo } from '@/components/landing/HeroDemo'

export default async function LandingPage() {
  const t = await getTranslations('landing')
  const session = await auth()
  const isLoggedIn = !!session

  return (
    <>
      {/* Hero */}
      <section className="min-h-[calc(100vh-3.5rem)] flex items-center px-4 py-16">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy + CTA */}
          <div className="flex flex-col items-start">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 leading-tight">
              {t('title')}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
                >
                  立即體驗
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
                  >
                    {t('cta')}
                  </Link>
                  <Link
                    href="/login"
                    className="border px-8 py-3 rounded-lg font-medium hover:bg-muted hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
                  >
                    登入
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right: animated demo */}
          <div className="flex items-center justify-center lg:justify-end">
            <HeroDemo />
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="border-t py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">三步驟，完成求職文件</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold">填寫基本資料</h3>
              <p className="text-sm text-muted-foreground">輸入工作經歷、學歷與技能，或直接上傳現有 PDF 履歷</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold">AI 智能優化</h3>
              <p className="text-sm text-muted-foreground">AI 自動強化履歷措辭，生成針對職缺的自薦信</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold">下載即用</h3>
              <p className="text-sm text-muted-foreground">選擇專業模板，一鍵下載 PDF，立即投遞</p>
            </div>
          </div>
        </div>
      </section>

      {/* Auto Apply Feature Section */}
      <section className="border-t py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700 mb-4">
              即將推出 Coming Soon
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">104 自動投遞</h2>
            <p className="text-muted-foreground max-w-lg text-sm md:text-base">
              設定好搜尋條件，AI 自動搜尋符合職缺並批次投遞，一覺醒來履歷已送出數十份
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">智能搜尋職缺</h3>
              <p className="text-sm text-muted-foreground">依關鍵字、地區、薪資範圍自動搜尋 104 平台最新職缺，篩選符合條件的機會</p>
            </div>
            <div className="rounded-xl border bg-card p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">AI 客製自薦信</h3>
              <p className="text-sm text-muted-foreground">針對每個職缺自動生成個性化自薦信，或選用 104 預設自薦信，大幅提升錄取率</p>
            </div>
            <div className="rounded-xl border bg-card p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">全自動批次投遞</h3>
              <p className="text-sm text-muted-foreground">無需人工操作，系統自動登入帳號完成投遞，並回報每筆結果與消耗點數明細</p>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/auto-apply"
              className="inline-flex items-center gap-2 border px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <Send className="h-4 w-4" />
              搶先了解自動投遞
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

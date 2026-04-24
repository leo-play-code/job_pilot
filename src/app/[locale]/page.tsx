import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { FileText, Upload, Zap } from 'lucide-react'
import { auth } from '@/auth'

export default async function LandingPage() {
  const t = await getTranslations('landing')
  const session = await auth()
  const isLoggedIn = !!session

  return (
    <>
      {/* Hero */}
      <section className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
    </>
  )
}

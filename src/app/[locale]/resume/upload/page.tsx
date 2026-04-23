import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DropZone } from '@/components/resume/DropZone'

export default async function ResumeUploadPage() {
  const session = await auth()
  if (!session) redirect('/zh/login')

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <h1 className="text-2xl font-bold mb-2">上傳履歷 PDF</h1>
      <p className="text-muted-foreground text-sm mb-8">
        AI 自動解析你的 PDF 履歷，一鍵匯入到履歷建立器
      </p>
      <DropZone />
    </div>
  )
}

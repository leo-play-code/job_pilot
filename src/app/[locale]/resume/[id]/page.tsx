import { auth } from '@/auth'
import { redirect } from 'next/navigation'

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const session = await auth()
  if (!session) redirect('/zh/login')

  const { id } = await params

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">履歷預覽</h1>
      {/* TODO: ResumeRenderer, DownloadButton, EditButton — id: {id} */}
    </main>
  )
}

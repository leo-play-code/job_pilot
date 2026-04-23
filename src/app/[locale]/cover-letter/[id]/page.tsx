import { auth } from '@/auth'
import { redirect } from 'next/navigation'

interface CoverLetterDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CoverLetterDetailPage({ params }: CoverLetterDetailPageProps) {
  const session = await auth()
  if (!session) redirect('/zh/login')

  const { id } = await params

  return (
    <main className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">自薦信</h1>
      {/* TODO: CoverLetterDisplay, CopyButton, DownloadTxtButton — id: {id} */}
    </main>
  )
}

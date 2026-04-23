import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function ResumeNewPage() {
  const session = await auth()
  if (!session) redirect('/zh/login')

  return (
    <main className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">建立新履歷</h1>
      {/* TODO: ResumeBuilderForm (multi-step) */}
    </main>
  )
}

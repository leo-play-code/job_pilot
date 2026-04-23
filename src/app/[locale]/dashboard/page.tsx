import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/zh/login')

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">我的文件</h1>
      {/* TODO: ResumeList, CoverLetterList, UsageBadge, QuickActions */}
    </main>
  )
}

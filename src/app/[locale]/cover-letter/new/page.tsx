import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CoverLetterBuilderForm } from '@/components/cover-letter/CoverLetterBuilderForm'

export default async function CoverLetterNewPage() {
  const session = await auth()
  if (!session) redirect('/zh/login')

  return <CoverLetterBuilderForm />
}

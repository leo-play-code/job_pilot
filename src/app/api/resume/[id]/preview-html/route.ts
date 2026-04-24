import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { buildResumeHtml, BUILTIN_TEMPLATE_DEFINITIONS } from '@/lib/pdf'
import type { ResumeContent, TemplateDefinition } from '@/types/resume'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // 2. Ownership check — find resume belonging to this user
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!resume) {
    // Check if the resume exists at all to distinguish 403 vs 404
    const exists = await prisma.resume.findUnique({ where: { id }, select: { id: true } })
    if (exists) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 3. Resolve template definition
  let definition: TemplateDefinition | undefined =
    BUILTIN_TEMPLATE_DEFINITIONS[resume.templateId]

  if (!definition) {
    const dbTemplate = await prisma.template.findUnique({
      where: { id: resume.templateId },
    })
    if (dbTemplate?.htmlDefinition) {
      definition = dbTemplate.htmlDefinition as unknown as TemplateDefinition
    }
  }

  // Fallback to built-in 'modern' if still unresolved
  if (!definition) {
    definition = BUILTIN_TEMPLATE_DEFINITIONS.modern
  }

  // 4. Build HTML
  const content = resume.content as unknown as ResumeContent
  const layoutOverride = resume.layoutOverride as { sectionOrder?: string[] } | null
  const html = buildResumeHtml(
    content,
    definition,
    resume.language as 'zh' | 'en',
    layoutOverride?.sectionOrder,
  )

  // 5. Return
  return NextResponse.json({ data: { html } })
}

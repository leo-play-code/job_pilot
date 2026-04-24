import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { runTemplateGenerationAgent } from '@/lib/template-agent'
import { generateTemplateThumbnail } from '@/lib/thumbnail'
import { uploadToS3, getS3Key } from '@/lib/s3'

function isAdmin(email?: string | null) {
  return email === process.env.ADMIN_EMAIL
}

export async function POST() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const results = await runTemplateGenerationAgent()

    if (results.length === 0) {
      return NextResponse.json({ error: 'Agent produced no valid templates — check server logs for details' }, { status: 500 })
    }

    const created = await Promise.all(
      results.map(async ({ brief, css, layout }) => {
        const sectionOrder = layout === 'split'
          ? ['summary', 'experience']
          : ['summary', 'experience', 'education', 'skills', 'achievements']

        const template = await prisma.template.create({
          data: {
            name: brief.name,
            description: brief.description,
            category: brief.category,
            status: 'draft',
            isActive: false,
            htmlDefinition: { css, layout, sectionOrder } as object,
          },
        })

        generateTemplateThumbnail({ css, layout, sectionOrder })
          .then(async (png) => {
            if (!process.env.AWS_S3_BUCKET) return
            const key = getS3Key('template-thumbnail', template.id)
            const url = await uploadToS3(key, png, 'image/png')
            await prisma.template.update({ where: { id: template.id }, data: { thumbnailUrl: url } })
          })
          .catch((err) => console.error(`[templates/generate] thumbnail failed for ${template.id}:`, err))

        return template
      }),
    )

    return NextResponse.json({ generated: created.length, templateIds: created.map((t) => t.id) }, { status: 201 })
  } catch (err) {
    console.error('[templates/generate] Agent failed:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Template generation failed: ${message}` }, { status: 500 })
  }
}

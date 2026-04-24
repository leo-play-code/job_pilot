/**
 * Seed the 3 built-in resume templates into the database.
 * Run with: npx ts-node --project tsconfig.json prisma/seed-templates.ts
 *
 * Requires DATABASE_URL / DIRECT_URL env vars (from .env.local).
 * If AWS_S3_BUCKET is set, also generates and uploads thumbnails.
 */
import { PrismaClient } from '@prisma/client'
import { BUILTIN_TEMPLATE_DEFINITIONS } from '../src/lib/pdf'
import { generateTemplateThumbnail } from '../src/lib/thumbnail'
import { uploadToS3, getS3Key } from '../src/lib/s3'

const prisma = new PrismaClient()

const TEMPLATE_META: Array<{
  id: string
  name: string
  description: string
  category: string
  sortOrder: number
}> = [
  {
    id: 'modern',
    name: 'Modern',
    description: '單欄、簡潔留白，適合科技業',
    category: 'tech',
    sortOrder: 0,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: '雙欄、傳統正式，適合金融/法律',
    category: 'finance',
    sortOrder: 1,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: '左側色塊、有個性，適合設計/行銷',
    category: 'creative',
    sortOrder: 2,
  },
]

async function main() {
  console.log('Seeding templates...')

  for (const meta of TEMPLATE_META) {
    const definition = BUILTIN_TEMPLATE_DEFINITIONS[meta.id]

    let thumbnailUrl: string | undefined

    if (process.env.AWS_S3_BUCKET) {
      console.log(`  Generating thumbnail for ${meta.id}...`)
      try {
        const png = await generateTemplateThumbnail(definition)
        const key = getS3Key('template-thumbnail', meta.id)
        thumbnailUrl = await uploadToS3(key, png, 'image/png')
        console.log(`  Uploaded thumbnail: ${thumbnailUrl}`)
      } catch (err) {
        console.warn(`  Thumbnail failed for ${meta.id}:`, err)
      }
    }

    await prisma.template.upsert({
      where: { id: meta.id },
      create: {
        id: meta.id,
        name: meta.name,
        description: meta.description,
        category: meta.category,
        sortOrder: meta.sortOrder,
        htmlDefinition: definition as object,
        thumbnailUrl,
        isActive: true,
      },
      update: {
        name: meta.name,
        description: meta.description,
        category: meta.category,
        sortOrder: meta.sortOrder,
        htmlDefinition: definition as object,
        ...(thumbnailUrl && { thumbnailUrl }),
      },
    })

    console.log(`  ✓ ${meta.name} (${meta.id})`)
  }

  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

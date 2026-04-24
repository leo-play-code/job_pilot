/**
 * Seed the 3 built-in resume templates into the database.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx prisma/seed-templates.ts
 *
 * If AWS_S3_BUCKET is set, also generates and uploads thumbnails.
 * Requires DATABASE_URL / DIRECT_URL env vars.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Template CSS (inlined to avoid @/ alias issues) ─────────────────────────

const BUILTIN_CSS = {
  modern: `body{font-family:'Helvetica Neue',sans-serif;color:#222;margin:0} h1{font-size:26px;margin:0} .contact{color:#666;font-size:13px;margin-top:4px} h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px} .job-title{font-weight:bold} .company{color:#555;font-size:13px} ul{margin:4px 0;padding-left:18px} li{font-size:13px;margin-bottom:2px} .skills{display:flex;flex-wrap:wrap;gap:6px} .skill{background:#f0f0f0;padding:2px 8px;border-radius:3px;font-size:12px}`,
  professional: `body{font-family:Georgia,serif;color:#111;margin:0;display:grid;grid-template-columns:1fr 2fr;gap:0} .sidebar{background:#1a2744;color:#fff;padding:20px;min-height:100vh} .main{padding:20px} h1{font-size:22px;margin:0;color:#fff} .contact{font-size:12px;margin-top:6px;opacity:.8} h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#1a2744;border-bottom:2px solid #1a2744;padding-bottom:3px;margin-top:18px} .sidebar h2{color:#fff;border-color:#fff} ul{margin:4px 0;padding-left:16px} li{font-size:12px;margin-bottom:3px} .skill{font-size:12px;margin-bottom:3px}`,
  creative: `body{font-family:'Arial',sans-serif;color:#333;margin:0;display:grid;grid-template-columns:220px 1fr} .sidebar{background:#4f46e5;color:#fff;padding:24px} .main{padding:24px} h1{font-size:24px;margin:0} .contact{font-size:12px;margin-top:6px;opacity:.9} h2{font-size:13px;text-transform:uppercase;letter-spacing:2px;margin-top:20px;padding-bottom:4px;border-bottom:2px solid currentColor} .sidebar h2{color:#fff} .main h2{color:#4f46e5} ul{margin:4px 0;padding-left:16px} li{font-size:13px;margin-bottom:3px} .skill{font-size:12px;margin-bottom:4px}`,
}

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: '單欄、簡潔留白，適合科技業',
    category: 'tech',
    sortOrder: 0,
    htmlDefinition: {
      css: BUILTIN_CSS.modern,
      layout: 'single',
      sectionOrder: ['summary', 'experience', 'education', 'skills', 'achievements'],
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: '雙欄、傳統正式，適合金融/法律',
    category: 'finance',
    sortOrder: 1,
    htmlDefinition: {
      css: BUILTIN_CSS.professional,
      layout: 'split',
      sectionOrder: ['summary', 'experience', 'achievements'],
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    description: '左側色塊、有個性，適合設計/行銷',
    category: 'creative',
    sortOrder: 2,
    htmlDefinition: {
      css: BUILTIN_CSS.creative,
      layout: 'split',
      sectionOrder: ['summary', 'experience', 'achievements'],
    },
  },
]

async function main() {
  console.log('Seeding templates...')

  for (const t of TEMPLATES) {
    const { id, name, description, category, sortOrder, htmlDefinition } = t

    await prisma.template.upsert({
      where: { id },
      create: { id, name, description, category, sortOrder, htmlDefinition, isActive: true },
      update: { name, description, category, sortOrder, htmlDefinition },
    })

    console.log(`  ✓ ${name} (${id})`)
  }

  console.log('\nDone. Run the app and go to /admin/templates to generate thumbnails.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import type { ResumeContent, TemplateDefinition } from '@/types/resume'

export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const result = await pdfParse(buffer)
  return result.text
}

// CSS for the 3 built-in templates
const BUILTIN_CSS: Record<string, string> = {
  modern: `body{font-family:'Helvetica Neue',sans-serif;color:#222;margin:0} h1{font-size:26px;margin:0} .contact{color:#666;font-size:13px;margin-top:4px} h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px} .job-title{font-weight:bold} .company{color:#555;font-size:13px} ul{margin:4px 0;padding-left:18px} li{font-size:13px;margin-bottom:2px} .skills{display:flex;flex-wrap:wrap;gap:6px} .skill{background:#f0f0f0;padding:2px 8px;border-radius:3px;font-size:12px}`,
  professional: `body{font-family:Georgia,serif;color:#111;margin:0;display:grid;grid-template-columns:1fr 2fr;gap:0} .sidebar{background:#1a2744;color:#fff;padding:20px;min-height:100vh} .main{padding:20px} h1{font-size:22px;margin:0;color:#fff} .contact{font-size:12px;margin-top:6px;opacity:.8} h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#1a2744;border-bottom:2px solid #1a2744;padding-bottom:3px;margin-top:18px} .sidebar h2{color:#fff;border-color:#fff} ul{margin:4px 0;padding-left:16px} li{font-size:12px;margin-bottom:3px} .skill{font-size:12px;margin-bottom:3px}`,
  creative: `body{font-family:'Arial',sans-serif;color:#333;margin:0;display:grid;grid-template-columns:220px 1fr} .sidebar{background:#4f46e5;color:#fff;padding:24px} .main{padding:24px} h1{font-size:24px;margin:0} .contact{font-size:12px;margin-top:6px;opacity:.9} h2{font-size:13px;text-transform:uppercase;letter-spacing:2px;margin-top:20px;padding-bottom:4px;border-bottom:2px solid currentColor} .sidebar h2{color:#fff} .main h2{color:#4f46e5} ul{margin:4px 0;padding-left:16px} li{font-size:13px;margin-bottom:3px} .skill{font-size:12px;margin-bottom:4px}`,
}

export const BUILTIN_TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
  modern: {
    css: BUILTIN_CSS.modern,
    layout: 'single',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'achievements'],
  },
  professional: {
    css: BUILTIN_CSS.professional,
    layout: 'split',
    sectionOrder: ['summary', 'experience', 'achievements'],
  },
  creative: {
    css: BUILTIN_CSS.creative,
    layout: 'split',
    sectionOrder: ['summary', 'experience', 'achievements'],
  },
}

export function buildResumeHtml(
  content: ResumeContent,
  definition: TemplateDefinition,
  language: 'zh' | 'en',
  sectionOrder?: string[],
): string {
  const { personalInfo, summary, experience, education, skills, achievements } = content
  const L = language === 'zh'
    ? { present: '至今', skills: '技能', exp: '工作經歷', edu: '學歷', summary: '個人摘要', achieve: '成就' }
    : { present: 'Present', skills: 'Skills', exp: 'Experience', edu: 'Education', summary: 'Summary', achieve: 'Achievements' }

  const { css, layout } = definition
  const isSplit = layout === 'split'
  const order = sectionOrder ?? definition.sectionOrder ?? ['summary', 'experience', 'education', 'skills', 'achievements']

  const sections: Record<string, string> = {
    summary: summary
      ? `<h2>${L.summary}</h2><p style="font-size:13px;margin:4px 0">${summary}</p>`
      : '',
    experience: experience.length
      ? `<h2>${L.exp}</h2>${experience.map(e => `
          <div style="margin-bottom:10px">
            <div class="job-title">${e.title}</div>
            <div class="company">${e.company} · ${e.startDate} – ${e.current ? L.present : (e.endDate ?? '')}</div>
            <ul>${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
          </div>`).join('')}`
      : '',
    education: education.length
      ? `<h2>${L.edu}</h2>${education.map(e => `
          <div style="margin-bottom:8px">
            <div class="job-title">${e.school}</div>
            <div class="company">${e.degree}${e.field ? `, ${e.field}` : ''} · ${e.startDate} – ${e.endDate ?? ''}</div>
          </div>`).join('')}`
      : '',
    skills: skills.length
      ? `<h2>${L.skills}</h2><div class="skills">${skills.map(s => `<span class="skill">${s}</span>`).join('')}</div>`
      : '',
    achievements: achievements?.length
      ? `<h2>${L.achieve}</h2><ul>${achievements.map(a => `<li>${a}</li>`).join('')}</ul>`
      : '',
  }

  if (isSplit) {
    // Split templates: sidebar has name/contact + skills + education
    const sidebarHtml = `
      <div class="sidebar">
        <h1>${personalInfo.name}</h1>
        <div class="contact">
          ${personalInfo.email}<br>
          ${personalInfo.phone ? `${personalInfo.phone}<br>` : ''}
          ${personalInfo.location ?? ''}
          ${personalInfo.linkedin ? `<br>${personalInfo.linkedin}` : ''}
          ${personalInfo.website ? `<br>${personalInfo.website}` : ''}
        </div>
        <h2>${L.skills}</h2>
        ${skills.map(s => `<div class="skill">• ${s}</div>`).join('')}
        ${achievements?.length ? `<h2>${L.achieve}</h2>${achievements.map(a => `<div class="skill">• ${a}</div>`).join('')}` : ''}
        <h2>${L.edu}</h2>
        ${education.map(e => `
          <div style="margin-bottom:8px">
            <div style="font-weight:bold;font-size:12px">${e.school}</div>
            <div style="font-size:11px;opacity:.8">${e.degree}${e.field ? `, ${e.field}` : ''}</div>
          </div>`).join('')}
      </div>`

    const mainSections = order.filter(s => !['skills', 'education', 'achievements'].includes(s))
    const mainHtml = mainSections.map(s => sections[s] ?? '').join('')

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${sidebarHtml}<div class="main">${mainHtml}</div></body></html>`
  }

  // Single column: header + ordered sections
  const headerHtml = `
    <div style="margin-bottom:16px">
      <h1>${personalInfo.name}</h1>
      <div class="contact">
        ${[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.website].filter(Boolean).join(' | ')}
      </div>
    </div>`

  const mainHtml = order.map(s => sections[s] ?? '').join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="main">${headerHtml}${mainHtml}</div></body></html>`
}

export async function generateResumePdf(params: {
  content: ResumeContent
  templateId: string
  language: 'zh' | 'en'
  layoutOverride?: { sectionOrder?: string[] }
}): Promise<Buffer> {
  const { content, templateId, language, layoutOverride } = params

  let definition: TemplateDefinition | undefined = BUILTIN_TEMPLATE_DEFINITIONS[templateId]

  // For DB-managed custom templates, fall back to fetching from DB
  if (!definition) {
    try {
      const { prisma } = await import('./prisma')
      const template = await prisma.template.findUnique({ where: { id: templateId } })
      if (template) definition = template.htmlDefinition as unknown as TemplateDefinition
    } catch {
      // ignore DB errors, use default
    }
    definition ??= BUILTIN_TEMPLATE_DEFINITIONS.modern
  }

  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    const html = buildResumeHtml(content, definition, language, layoutOverride?.sectionOrder)
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

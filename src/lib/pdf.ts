import type { ResumeContent, TemplateId } from '@/types/resume'

export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const result = await pdfParse(buffer)
  return result.text
}

export async function generateResumePdf(params: {
  content: ResumeContent
  templateId: TemplateId
  language: 'zh' | 'en'
}): Promise<Buffer> {
  const { content, templateId, language } = params
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })

  try {
    const page = await browser.newPage()
    const html = buildResumeHtml(content, templateId, language)
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

function buildResumeHtml(content: ResumeContent, templateId: TemplateId, language: 'zh' | 'en'): string {
  const { personalInfo, summary, experience, education, skills, achievements } = content
  const dateLabel = language === 'zh' ? { present: '至今', skills: '技能', exp: '工作經歷', edu: '學歷', summary: '個人摘要', achieve: '成就' } : { present: 'Present', skills: 'Skills', exp: 'Experience', edu: 'Education', summary: 'Summary', achieve: 'Achievements' }

  const styles: Record<TemplateId, string> = {
    modern: `body{font-family:'Helvetica Neue',sans-serif;color:#222;margin:0} h1{font-size:26px;margin:0} .contact{color:#666;font-size:13px;margin-top:4px} h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px} .job-title{font-weight:bold} .company{color:#555;font-size:13px} ul{margin:4px 0;padding-left:18px} li{font-size:13px;margin-bottom:2px} .skills{display:flex;flex-wrap:wrap;gap:6px} .skill{background:#f0f0f0;padding:2px 8px;border-radius:3px;font-size:12px}`,
    professional: `body{font-family:Georgia,serif;color:#111;margin:0;display:grid;grid-template-columns:1fr 2fr;gap:0} .sidebar{background:#1a2744;color:#fff;padding:20px;min-height:100vh} .main{padding:20px} h1{font-size:22px;margin:0;color:#fff} .contact{font-size:12px;margin-top:6px;opacity:.8} h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#1a2744;border-bottom:2px solid #1a2744;padding-bottom:3px;margin-top:18px} .sidebar h2{color:#fff;border-color:#fff} ul{margin:4px 0;padding-left:16px} li{font-size:12px;margin-bottom:3px} .skill{font-size:12px;margin-bottom:3px}`,
    creative: `body{font-family:'Arial',sans-serif;color:#333;margin:0;display:grid;grid-template-columns:220px 1fr} .sidebar{background:#e84393;color:#fff;padding:24px} .main{padding:24px} h1{font-size:24px;margin:0} .contact{font-size:12px;margin-top:6px;opacity:.9} h2{font-size:13px;text-transform:uppercase;letter-spacing:2px;margin-top:20px;padding-bottom:4px;border-bottom:2px solid currentColor} .sidebar h2{color:#fff} .main h2{color:#e84393} ul{margin:4px 0;padding-left:16px} li{font-size:13px;margin-bottom:3px} .skill{font-size:12px;margin-bottom:4px}`,
  }

  const isSplit = templateId === 'professional' || templateId === 'creative'

  const sidebarContent = isSplit ? `
    <div class="sidebar">
      <h1>${personalInfo.name}</h1>
      <div class="contact">
        ${personalInfo.email}<br>
        ${personalInfo.phone ?? ''}${personalInfo.phone && personalInfo.location ? '<br>' : ''}
        ${personalInfo.location ?? ''}
        ${personalInfo.linkedin ? `<br>${personalInfo.linkedin}` : ''}
        ${personalInfo.website ? `<br>${personalInfo.website}` : ''}
      </div>
      <h2>${dateLabel.skills}</h2>
      ${skills.map(s => `<div class="skill">• ${s}</div>`).join('')}
      ${achievements?.length ? `<h2>${dateLabel.achieve}</h2>${achievements.map(a => `<div class="skill">• ${a}</div>`).join('')}` : ''}
    </div>` : ''

  const mainContent = `
    ${!isSplit ? `
    <div style="margin-bottom:16px">
      <h1>${personalInfo.name}</h1>
      <div class="contact">
        ${[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.website].filter(Boolean).join(' | ')}
      </div>
    </div>` : ''}
    ${summary ? `<h2>${dateLabel.summary}</h2><p style="font-size:13px;margin:4px 0">${summary}</p>` : ''}
    <h2>${dateLabel.exp}</h2>
    ${experience.map(e => `
      <div style="margin-bottom:10px">
        <div class="job-title">${e.title}</div>
        <div class="company">${e.company} · ${e.startDate} – ${e.current ? dateLabel.present : (e.endDate ?? '')}</div>
        <ul>${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>`).join('')}
    <h2>${dateLabel.edu}</h2>
    ${education.map(e => `
      <div style="margin-bottom:8px">
        <div class="job-title">${e.school}</div>
        <div class="company">${e.degree}${e.field ? `, ${e.field}` : ''} · ${e.startDate} – ${e.endDate ?? ''}</div>
      </div>`).join('')}
    ${!isSplit ? `<h2>${dateLabel.skills}</h2><div class="skills">${skills.map(s => `<span class="skill">${s}</span>`).join('')}</div>` : ''}`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${styles[templateId]}</style></head><body>${sidebarContent}<div class="main">${mainContent}</div></body></html>`
}

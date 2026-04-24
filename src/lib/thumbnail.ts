import type { ResumeContent, TemplateDefinition } from '@/types/resume'
import { buildResumeHtml } from './pdf'

const SAMPLE_CONTENT: ResumeContent = {
  personalInfo: {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '+1 (555) 000-0000',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexj',
  },
  summary: 'Experienced software engineer with 5+ years building scalable web applications and leading cross-functional teams.',
  experience: [
    {
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      startDate: '2021-01',
      endDate: '2024-01',
      current: false,
      bullets: [
        'Led development of core platform features serving 1M+ users',
        'Reduced API latency by 40% through caching optimizations',
        'Mentored 4 junior engineers and ran weekly code reviews',
      ],
    },
    {
      company: 'Startup Inc',
      title: 'Software Engineer',
      startDate: '2019-06',
      endDate: '2020-12',
      current: false,
      bullets: [
        'Built real-time dashboard processing 50K events/sec',
        'Shipped mobile-responsive redesign increasing conversion 25%',
      ],
    },
  ],
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      field: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-06',
      gpa: '3.8',
    },
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
  achievements: ['Best Engineer Award 2023', 'Speaker at React Conf 2022'],
}

export async function generateTemplateThumbnail(definition: TemplateDefinition): Promise<Buffer> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
    const html = buildResumeHtml(SAMPLE_CONTENT, definition, 'en')
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 794, height: 1123 },
    })
    return Buffer.from(screenshot)
  } finally {
    await browser.close()
  }
}

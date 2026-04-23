import type { ResumeContent, TemplateId } from '@/types/resume'

export async function parsePdf(buffer: Buffer): Promise<string> {
  // TODO: implement with pdf-parse
  throw new Error('Not implemented')
}

export async function generateResumePdf(params: {
  content: ResumeContent
  templateId: TemplateId
  language: 'zh' | 'en'
}): Promise<Buffer> {
  // TODO: implement with Puppeteer
  throw new Error('Not implemented')
}

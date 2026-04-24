import OpenAI from 'openai'

export interface TemplateAiAnalysis {
  layout: 'single' | 'split'
  primaryColor: string
  secondaryColor: string
  fontFamily: 'serif' | 'sans-serif'
  detectedSections: string[]
  confidence: number
  css: string
}

export class TemplateVisionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'TemplateVisionError'
  }
}

const PROMPT = `You are a resume template designer. Analyze this resume template image and return a JSON object.

Required fields:
{
  "layout": "single" | "split",
  "primaryColor": "#rrggbb",
  "secondaryColor": "#rrggbb",
  "fontFamily": "serif" | "sans-serif",
  "detectedSections": ["summary","experience","education","skills","achievements"],
  "confidence": 0.95,
  "css": "body{...} h1{...} ..."
}

CSS rules:
- Use only these class names: body h1 h2 .contact .sidebar .main .job-title .company .skill .skills ul li
- For split layout: .sidebar gets the sidebar background color, .main gets white/light background
- Keep CSS as a single compact line (no literal newlines)
- Reference style for split: body{font-family:Georgia,serif;color:#111;margin:0;display:grid;grid-template-columns:1fr 2fr} .sidebar{background:#1a2744;color:#fff;padding:20px;min-height:100vh} .main{padding:20px} h1{font-size:22px;margin:0;color:#fff} h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid currentColor;padding-bottom:3px;margin-top:18px} .sidebar h2{color:#fff} ul{margin:4px 0;padding-left:16px} li{font-size:12px;margin-bottom:3px}
- Reference style for single: body{font-family:'Helvetica Neue',sans-serif;color:#222;margin:0} h1{font-size:26px;margin:0} .contact{color:#666;font-size:13px;margin-top:4px} h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px} .job-title{font-weight:bold} .company{color:#555;font-size:13px} ul{margin:4px 0;padding-left:18px} li{font-size:13px;margin-bottom:2px} .skills{display:flex;flex-wrap:wrap;gap:6px} .skill{background:#f0f0f0;padding:2px 8px;border-radius:3px;font-size:12px}

Rules:
- detectedSections must only use: summary experience education skills achievements
- Return ONLY the JSON object, no markdown fences`

export async function analyzeTemplateImage(
  imageBuffer: Buffer,
  mimeType: 'image/png' | 'image/jpeg',
): Promise<TemplateAiAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const base64 = imageBuffer.toString('base64')

  let responseText: string
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
          { type: 'text', text: PROMPT },
        ],
      }],
    })
    responseText = response.choices[0].message.content ?? ''
  } catch (err) {
    throw new TemplateVisionError('Vision API request failed', err)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(responseText)
  } catch (err) {
    throw new TemplateVisionError(`Failed to parse Vision API response: ${responseText.slice(0, 200)}`, err)
  }

  const a = parsed as Record<string, unknown>

  if (
    !['single', 'split'].includes(a.layout as string) ||
    typeof a.primaryColor !== 'string' ||
    typeof a.secondaryColor !== 'string' ||
    !['serif', 'sans-serif'].includes(a.fontFamily as string) ||
    !Array.isArray(a.detectedSections) ||
    typeof a.confidence !== 'number' ||
    typeof a.css !== 'string'
  ) {
    throw new TemplateVisionError(`Incomplete Vision API response: ${responseText.slice(0, 200)}`)
  }

  const VALID_SECTIONS = ['summary', 'experience', 'education', 'skills', 'achievements']

  return {
    layout: a.layout as 'single' | 'split',
    primaryColor: a.primaryColor as string,
    secondaryColor: a.secondaryColor as string,
    fontFamily: a.fontFamily as 'serif' | 'sans-serif',
    detectedSections: (a.detectedSections as unknown[])
      .filter((s): s is string => typeof s === 'string')
      .filter(s => VALID_SECTIONS.includes(s)),
    confidence: a.confidence as number,
    css: a.css as string,
  }
}

export async function pdfFirstPageToPng(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfParse = (await import('pdf-parse')).default
  try {
    await pdfParse(pdfBuffer)
  } catch {
    throw new Error('invalid_pdf: 提供的檔案不是有效的 PDF')
  }

  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
    const base64Pdf = pdfBuffer.toString('base64')

    try {
      await page.goto(`data:application/pdf;base64,${base64Pdf}`, { waitUntil: 'networkidle0', timeout: 15000 })
    } catch {
      throw new Error('pdf_rendering_failed: 請直接上傳 PNG 圖片')
    }

    const screenshot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 794, height: 1123 } })
    return Buffer.from(screenshot)
  } finally {
    await browser.close()
  }
}

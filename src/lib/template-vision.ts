import Anthropic from '@anthropic-ai/sdk'

export interface TemplateAiAnalysis {
  layout: 'single' | 'split'
  primaryColor: string      // hex, e.g. "#1a2744"
  secondaryColor: string    // hex
  fontFamily: 'serif' | 'sans-serif'
  detectedSections: string[]
  confidence: number        // 0-1
  css: string               // 完整 CSS 字串，與現有 BUILTIN_CSS 格式相同
}

export class TemplateVisionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'TemplateVisionError'
  }
}

export async function analyzeTemplateImage(
  imageBuffer: Buffer,
  mimeType: 'image/png' | 'image/jpeg',
): Promise<TemplateAiAnalysis> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const base64Image = imageBuffer.toString('base64')

  const prompt = `You are a resume template designer. Analyze this resume template image and return a JSON object with the following fields:

{
  "layout": "single" | "split",           // "split" if there's a sidebar/two-column, "single" if one-column
  "primaryColor": "#rrggbb",              // main accent/header/sidebar background hex color
  "secondaryColor": "#rrggbb",            // secondary accent hex color
  "fontFamily": "serif" | "sans-serif",   // dominant font style
  "detectedSections": ["summary", "experience", "education", "skills", "achievements"],  // only the sections visible in the image, use these exact English lowercase names
  "confidence": 0.95,                     // your confidence in the analysis, 0 to 1
  "css": "body{...} h1{...} ..."          // complete CSS string compatible with these class names: body, h1, h2, .contact, .sidebar, .main, .job-title, .company, .skill, .skills, ul, li. For split layout include .sidebar and .main. Keep it compact (no newlines), use the same style as: body{font-family:Georgia,serif;color:#111;margin:0;display:grid;grid-template-columns:1fr 2fr;gap:0} .sidebar{background:#1a2744;color:#fff;padding:20px;min-height:100vh} .main{padding:20px} h1{font-size:22px;margin:0;color:#fff} .contact{font-size:12px;margin-top:6px;opacity:.8} h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#1a2744;border-bottom:2px solid #1a2744;padding-bottom:3px;margin-top:18px} .sidebar h2{color:#fff;border-color:#fff} ul{margin:4px 0;padding-left:16px} li{font-size:12px;margin-bottom:3px} .skill{font-size:12px;margin-bottom:3px}
}

Rules:
1. Return ONLY the JSON object, no markdown code fences, no explanation.
2. The CSS must be a single-line compact string (no literal newlines inside the string value).
3. Match the template's actual colors, font style, and layout as closely as possible.
4. detectedSections must only include: summary, experience, education, skills, achievements.`

  let responseText: string
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new TemplateVisionError('No text response from Vision API')
    }
    responseText = textBlock.text
  } catch (err) {
    if (err instanceof TemplateVisionError) throw err
    throw new TemplateVisionError('Vision API request failed', err)
  }

  // Strip potential markdown fences if model adds them anyway
  const cleaned = responseText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    throw new TemplateVisionError(
      `Failed to parse Vision API response as JSON: ${cleaned.slice(0, 200)}`,
      err,
    )
  }

  const analysis = parsed as Record<string, unknown>

  // Validate required fields
  if (
    typeof analysis.layout !== 'string' ||
    !['single', 'split'].includes(analysis.layout) ||
    typeof analysis.primaryColor !== 'string' ||
    typeof analysis.secondaryColor !== 'string' ||
    typeof analysis.fontFamily !== 'string' ||
    !['serif', 'sans-serif'].includes(analysis.fontFamily as string) ||
    !Array.isArray(analysis.detectedSections) ||
    typeof analysis.confidence !== 'number' ||
    typeof analysis.css !== 'string'
  ) {
    throw new TemplateVisionError(
      `Vision API returned incomplete or invalid JSON fields: ${cleaned.slice(0, 200)}`,
    )
  }

  return {
    layout: analysis.layout as 'single' | 'split',
    primaryColor: analysis.primaryColor as string,
    secondaryColor: analysis.secondaryColor as string,
    fontFamily: analysis.fontFamily as 'serif' | 'sans-serif',
    detectedSections: (analysis.detectedSections as unknown[])
      .filter((s): s is string => typeof s === 'string')
      .filter((s) => ['summary', 'experience', 'education', 'skills', 'achievements'].includes(s)),
    confidence: analysis.confidence as number,
    css: analysis.css as string,
  }
}

/**
 * Attempt to render the first page of a PDF as a PNG using Puppeteer.
 * Puppeteer's PDF rendering in headless mode is browser-dependent and often
 * unavailable. If it fails, we throw a friendly error asking the user to
 * upload a PNG directly.
 */
export async function pdfFirstPageToPng(pdfBuffer: Buffer): Promise<Buffer> {
  // Validate it's actually a PDF
  const pdfParse = (await import('pdf-parse')).default
  try {
    await pdfParse(pdfBuffer)
  } catch {
    throw new Error('invalid_pdf: 提供的檔案不是有效的 PDF')
  }

  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })

    const base64Pdf = pdfBuffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`

    try {
      await page.goto(dataUrl, { waitUntil: 'networkidle0', timeout: 15000 })
    } catch {
      throw new Error('pdf_rendering_failed: 請直接上傳 PNG 圖片')
    }

    // Check if the page actually rendered something (PDF plugins may not work in headless)
    const hasContent = await page.evaluate(() => {
      return document.body.innerHTML.length > 0
    })

    if (!hasContent) {
      throw new Error('pdf_rendering_failed: 請直接上傳 PNG 圖片')
    }

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 794, height: 1123 },
    })
    return Buffer.from(screenshot)
  } finally {
    await browser.close()
  }
}

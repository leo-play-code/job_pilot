import Anthropic from '@anthropic-ai/sdk'
import type { ResumeContent } from '@/types/resume'
import { WORD_COUNT_MAP } from '@/types/resume'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

const RESUME_SYSTEM_PROMPT = `You are a professional resume writer. When given raw resume text or a partial resume, you output a structured JSON object matching the ResumeContent schema exactly. Output only valid JSON with no markdown fences.

ResumeContent schema:
{
  "personalInfo": { "name": string, "email": string, "phone"?: string, "location"?: string, "linkedin"?: string, "website"?: string },
  "summary"?: string,
  "experience": [{ "company": string, "title": string, "startDate": string, "endDate"?: string, "current": boolean, "bullets": string[] }],
  "education": [{ "school": string, "degree": string, "field"?: string, "startDate": string, "endDate"?: string, "gpa"?: string }],
  "skills": string[],
  "achievements"?: string[]
}`

export async function enhanceResume(
  rawInput: string,
  language: 'zh' | 'en',
): Promise<ResumeContent> {
  const langInstruction = language === 'zh'
    ? 'Write all text fields in Traditional Chinese (繁體中文).'
    : 'Write all text fields in English.'

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: RESUME_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `${langInstruction}\n\nEnhance and structure the following resume content:\n\n${rawInput}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(text) as ResumeContent
}

const COVER_LETTER_SYSTEM_PROMPT = `You are a professional cover letter writer. Write compelling, personalized cover letters. Output only the cover letter text with no extra commentary.`

export async function generateCoverLetter(params: {
  resumeContent: ResumeContent | string
  jobTitle: string
  jobDesc: string
  wordCount: 'SHORT' | 'MEDIUM' | 'LONG'
  language: 'zh' | 'en'
}): Promise<string> {
  const { resumeContent, jobTitle, jobDesc, wordCount, language } = params
  const targetWords = WORD_COUNT_MAP[wordCount]
  const langInstruction = language === 'zh'
    ? `Write in Traditional Chinese (繁體中文). Target approximately ${targetWords} Chinese characters.`
    : `Write in English. Target approximately ${targetWords} words.`

  const resumeText = typeof resumeContent === 'string'
    ? resumeContent
    : JSON.stringify(resumeContent, null, 2)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: COVER_LETTER_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `${langInstruction}\n\nJob Title: ${jobTitle}\nJob Description: ${jobDesc}\n\nApplicant Resume:\n${resumeText}\n\nWrite a cover letter for this position.`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export { client, MODEL }

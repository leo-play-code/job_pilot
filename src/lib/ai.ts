import Anthropic from '@anthropic-ai/sdk'
import type { ResumeContent } from '@/types/resume'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

export async function enhanceResume(
  rawInput: string,
  language: 'zh' | 'en',
): Promise<ResumeContent> {
  // TODO: implement
  throw new Error('Not implemented')
}

export async function generateCoverLetter(params: {
  resumeContent: ResumeContent | string
  jobTitle: string
  jobDesc: string
  wordCount: 'SHORT' | 'MEDIUM' | 'LONG'
  language: 'zh' | 'en'
}): Promise<string> {
  // TODO: implement
  throw new Error('Not implemented')
}

export { client, MODEL }

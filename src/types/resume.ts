export interface PersonalInfo {
  name: string
  email: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
}

export interface Experience {
  company: string
  title: string
  startDate: string
  endDate?: string
  current: boolean
  bullets: string[]
}

export interface Education {
  school: string
  degree: string
  field?: string
  startDate: string
  endDate?: string
  gpa?: string
}

export interface ResumeContent {
  personalInfo: PersonalInfo
  summary?: string
  experience: Experience[]
  education: Education[]
  skills: string[]
  achievements?: string[]
}

export type TemplateId = 'modern' | 'professional' | 'creative'
export type Language = 'zh' | 'en'
export type WordCountOption = 'SHORT' | 'MEDIUM' | 'LONG'

export const WORD_COUNT_MAP: Record<WordCountOption, number> = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
}

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: 'modern', name: 'Modern', description: '單欄、簡潔留白，適合科技業' },
  { id: 'professional', name: 'Professional', description: '雙欄、傳統正式，適合金融/法律' },
  { id: 'creative', name: 'Creative', description: '左側色塊、有個性，適合設計/行銷' },
]

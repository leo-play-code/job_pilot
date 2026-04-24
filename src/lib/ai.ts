import OpenAI from 'openai'
import type { ResumeContent } from '@/types/resume'
import { WORD_COUNT_MAP } from '@/types/resume'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = 'gpt-4o-mini'

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

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: RESUME_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${langInstruction}\n\nEnhance and structure the following resume content:\n\n${rawInput}`,
      },
    ],
  })

  const text = response.choices[0].message.content ?? '{}'
  return JSON.parse(text) as ResumeContent
}

type JobCategory = 'engineering' | 'marketing' | 'design' | 'sales' | 'finance' | 'product' | 'operations' | 'general'

function detectJobCategory(jobTitle: string, jobDesc: string): JobCategory {
  const text = `${jobTitle} ${jobDesc}`.toLowerCase()
  const patterns: [JobCategory, RegExp][] = [
    ['engineering', /engineer|developer|devops|sre|backend|frontend|fullstack|工程師|前端|後端|全端|架構師|architect|software|程式|data scientist|ml |資料工程/],
    ['marketing', /marketing|行銷|seo|social media|社群|brand|品牌|growth|成長|content|內容|廣告|ads|campaign/],
    ['design', /design|設計|ui\/ux|\bux\b|\bui\b|visual|視覺|平面|motion|figma|product design/],
    ['sales', /\bsales\b|業務|\bbd\b|business development|account manager|客戶經理/],
    ['finance', /finance|財務|accounting|會計|\bcfo\b|financial analyst|investment|投資|audit|稽核/],
    ['product', /product manager|\bpm\b|產品經理|product owner|\bpo\b|產品.*經理|roadmap/],
    ['operations', /operation|營運|行政|customer success|客戶成功|\bhr\b|人資|人力資源|客服|customer service/],
  ]
  for (const [category, pattern] of patterns) {
    if (pattern.test(text)) return category
  }
  return 'general'
}

const CATEGORY_SYSTEM_PROMPTS: Record<JobCategory, string> = {
  engineering: `You are an expert cover letter writer specializing in tech roles (software engineers, backend/frontend/full-stack, DevOps, data engineers, etc.).

Tone: Professional, precise, results-oriented. Technical without being jargon-heavy.

Structure:
1. Opening — a hook showing genuine interest in the specific technical challenge or product this company is building
2. Technical fit — map 2–3 of the applicant's strongest skills/projects directly to the job requirements
3. Quantified impact — include specific metrics (latency, scale, uptime, delivery speed) from their experience
4. Team fit — brief note on collaboration style or learning mindset
5. CTA — confident close

Rules: Lead with impact, not job titles. Cherry-pick the most relevant technologies — don't list everything. Include one concrete technical achievement. Never write "passionate about technology" or "fast learner".`,

  marketing: `You are an expert cover letter writer specializing in marketing roles (digital marketing, growth, content, brand, SEO, social media).

Tone: Engaging, creative, yet data-informed. The letter itself should demonstrate writing skill and brand awareness.

Structure:
1. Opening — a compelling observation about the company's brand, product, or campaign; show you've done your research
2. Campaign/growth record — 1–2 initiatives with real numbers (CTR, ROAS, follower growth, organic traffic)
3. Creative + analytical balance — show you can both ideate and measure
4. Brand fit — connect your marketing philosophy to their audience or positioning
5. CTA — invite conversation with energy and confidence

Rules: Tone IS part of the application — make it memorable. Always include at least one metric. Show understanding of their target audience. Avoid vague claims like "creative thinker" without evidence.`,

  design: `You are an expert cover letter writer specializing in design roles (UI/UX, product design, visual design, motion design).

Tone: Thoughtful, user-centric, and creative. Demonstrate design thinking in the letter's own structure.

Structure:
1. Opening — frame a user problem or design observation that connects to the company's product
2. Design process — describe your approach (research → ideation → prototype → test) with a specific project
3. Impact — a measurable outcome (task completion time, NPS, conversion rate)
4. Collaboration — how you work with engineers, PMs, and stakeholders
5. CTA — express desire to create meaningful experiences at this company

Rules: Focus on the WHY behind design decisions, not just tools. Show you understand both aesthetics and usability. Don't lead with "I use Figma".`,

  sales: `You are an expert cover letter writer specializing in sales and business development roles (AEs, SDRs, BD managers, account managers).

Tone: Confident, direct, relationship-focused, achievement-driven. Energy and conviction must come through.

Structure:
1. Opening — bold hook: a deal won, a relationship built, or a market opportunity spotted
2. Track record — quota achievement, revenue generated, or deals closed with specific numbers
3. Approach — briefly describe your sales methodology and what makes client relationships sticky
4. Product fit — show genuine belief in what they're selling; explain why you'd sell THIS product
5. CTA — strong and direct; ask for the conversation

Rules: Numbers are non-negotiable. Show conviction in the product. Be confident but not arrogant. No corporate filler like "synergy" or "value-add".`,

  finance: `You are an expert cover letter writer specializing in finance roles (financial analysts, accountants, investment analysts, auditors).

Tone: Precise, professional, and analytical. Rigor and accuracy should show through the writing itself.

Structure:
1. Opening — connect your financial expertise to the company's specific needs or industry
2. Technical expertise — relevant skills (financial modeling, IFRS/GAAP, valuation, budgeting, compliance)
3. Analytical impact — a specific example where your analysis drove a business decision or cost savings
4. Reliability — briefly convey commitment to accuracy and ethical standards
5. CTA — professional and measured

Rules: Precision is paramount — no vague language. Include specific financial tools or methodologies. Show understanding of regulatory context if relevant.`,

  product: `You are an expert cover letter writer specializing in product management roles (PMs, product owners, growth PMs).

Tone: Strategic, user-obsessed, and cross-functional. Show you think in systems and user journeys.

Structure:
1. Opening — frame a product insight or user problem that connects to the company's product; show product sense
2. Shipped impact — a specific feature or product decision with measurable outcome (DAU, retention, revenue)
3. Process — how you prioritize, align stakeholders, and work with engineering/design
4. Vision fit — why THIS product, why now; show genuine empathy for their users
5. CTA — invite a product discussion

Rules: Always connect user needs to business outcomes. Show decision-making under ambiguity. Ground everything in impact, not process. Demonstrate both strategic thinking AND execution.`,

  operations: `You are an expert cover letter writer specializing in operations, HR, and administrative roles.

Tone: Organized, reliable, and process-oriented. Show efficiency and calm under complexity.

Structure:
1. Opening — frame a coordination challenge you solved or a process you improved
2. Operational impact — specific improvements (reduced processing time, improved SLA, scaled a process)
3. Cross-team coordination — how you enable others to work more effectively
4. Adaptability — brief note on handling ambiguity and competing priorities
5. CTA — position yourself as someone who makes the team run smoother

Rules: Show system-thinking — connect individual tasks to larger goals. Include at least one process improvement with results. Never claim "organized" or "good communicator" without evidence.`,

  general: `You are an expert cover letter writer. Write a compelling, personalized cover letter.

Tone: Professional, authentic, and tailored to this specific role and company.

Structure:
1. Opening — a specific hook showing genuine interest in this company and role; not generic enthusiasm
2. Experience fit — 2–3 specific experiences that directly address the job requirements
3. Unique value — what you bring that other candidates likely don't
4. Company fit — reference their product, values, or market position to show research
5. CTA — clear, confident close

Rules: Every paragraph must connect to the specific job. Include at least one concrete achievement with a result. Never open with "I am writing to apply for...". Make the hiring manager want to meet you.`,
}

const MAX_TOKENS_MAP: Record<'SHORT' | 'MEDIUM' | 'LONG', number> = {
  SHORT: 700,   // target 150 chars, buffer to finish sentence gracefully (~2× target)
  MEDIUM: 1100, // target 300 chars, buffer to finish sentence gracefully (~1.8× target)
  LONG: 2048,   // must stay high — problem is AI stops too early, not too late
}

export async function generateCoverLetter(params: {
  resumeContent: ResumeContent | string
  jobTitle: string
  jobDesc: string
  wordCount: 'SHORT' | 'MEDIUM' | 'LONG'
  language: 'zh' | 'en'
}): Promise<string> {
  const { resumeContent, jobTitle, jobDesc, wordCount, language } = params
  const targetWords = WORD_COUNT_MAP[wordCount]
  const maxTokens = MAX_TOKENS_MAP[wordCount]
  const lengthDirective: Record<'SHORT' | 'MEDIUM' | 'LONG', { zh: string; en: string }> = {
    SHORT: {
      zh: `字數：嚴格控制在 ${targetWords} 字以內。寫完就停，不要補充、不要延伸。`,
      en: `Length: strictly under ${targetWords} words. Stop as soon as you've made your point — no filler.`,
    },
    MEDIUM: {
      zh: `字數：目標 ${targetWords} 字（±10%）。`,
      en: `Length: target ${targetWords} words (±10%).`,
    },
    LONG: {
      zh: `字數：必須達到 ${targetWords} 字以上。這是一封詳細的自薦信，請充分展開每個論點——加入具體情境、數字、專案細節。不要因為覺得「夠了」就提早收尾，寫滿 ${targetWords} 字。`,
      en: `Length: you MUST reach at least ${targetWords} words. This is a detailed cover letter — fully develop each point with specific context, numbers, and project detail. Do not stop early because it "feels complete". Write until you hit ${targetWords} words.`,
    },
  }
  const ld = lengthDirective[wordCount]
  const langInstruction = language === 'zh'
    ? `Write in Traditional Chinese (繁體中文). ${ld.zh}

Tone for Chinese: Write like a modern professional email — direct, confident, and natural. NOT a formal business letter.
- Do NOT use archaic phrases: 敬祝商祺、謹啟、尊敬的、貴公司、敬啟者
- Do NOT use stiff openings like "您好，我是..."
- End with one simple sentence like "期待有機會進一步交流，謝謝。" — nothing more
- The overall feel should be: a sharp colleague reaching out, not an applicant begging`
    : `Write in English. ${ld.en}

Tone: Confident and direct — like a peer reaching out, not an applicant pleading. No "I am writing to express my interest", no "Thank you for your consideration". End with one clear, forward-leaning sentence.`

  const resumeText = typeof resumeContent === 'string'
    ? resumeContent
    : JSON.stringify(resumeContent, null, 2)

  const jobCategory = detectJobCategory(jobTitle, jobDesc)
  const systemPrompt = CATEGORY_SYSTEM_PROMPTS[jobCategory]

  const userMessage = `${langInstruction}

Job Title: ${jobTitle}
Job Description:
${jobDesc}

Applicant's Resume:
${resumeText}

Instructions:
1. Read the job description and extract the top 3–5 things this employer actually cares about
2. For each requirement, find the EXACT matching experience or skill in the resume — use real project names, real numbers, real technologies from the resume
3. CRITICAL: Do NOT mention any skill, tool, or technology that is not explicitly present in the resume. Never fabricate or assume.
4. Write the cover letter: open strong, map resume evidence to job needs, close with one confident sentence
5. Output only the letter body — no greeting header, no date, no subject line, no placeholder brackets like [Company], no formal closing salutations`

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })

  return response.choices[0].message.content ?? ''
}

export { client, MODEL }

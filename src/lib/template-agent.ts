import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = 'gpt-4o'

export interface DesignBrief {
  archetypeId: string
  name: string
  description: string
  category: 'tech' | 'finance' | 'creative' | 'other'
  layout: 'single' | 'split'
  primaryColor: string
  accentColor: string
  sidebarColor: string | null
  textColor: string
  backgroundColor: string
  fontStack: string
  designNotes: string
}

export interface TemplateAgentResult {
  brief: DesignBrief
  css: string
  layout: 'single' | 'split'
}

interface ArchetypeSpec {
  id: string
  layout: 'single' | 'split'
  category: 'tech' | 'finance' | 'creative' | 'other'
  style: string
}

const DESIGN_ARCHETYPES: ArchetypeSpec[] = [
  { id: 'tech-minimal',     layout: 'single', category: 'tech',     style: 'minimal sans-serif, blue-gray palette (#334155 primary), generous whitespace, modern startup feel' },
  { id: 'tech-dark',        layout: 'split',  category: 'tech',     style: 'dark sidebar (#0f172a slate), cyan accent (#06b6d4), bold typography, senior engineer / hacker aesthetic' },
  { id: 'finance-navy',     layout: 'split',  category: 'finance',  style: 'deep navy sidebar (#1a3461), Georgia serif, formal authoritative, traditional banking / Big4 style' },
  { id: 'finance-slate',    layout: 'single', category: 'finance',  style: 'slate gray palette (#374151), conservative dense layout, structured and precise, CPA / analyst style' },
  { id: 'creative-violet',  layout: 'split',  category: 'creative', style: 'violet sidebar (#6d28d9), bold geometric headings, artistic personality, UI/UX designer portfolio-adjacent' },
  { id: 'creative-coral',   layout: 'single', category: 'creative', style: 'coral accent (#e55039), warm off-white background (#fdf8f6), playful rounded skill chips, personal brand feel' },
  { id: 'marketing-teal',   layout: 'split',  category: 'other',    style: 'teal sidebar (#0f766e), energetic fresh modern, growth marketer / brand strategist vibes' },
  { id: 'product-modern',   layout: 'single', category: 'tech',     style: 'indigo accent (#4338ca), clean section dividers, strategic and pragmatic, product manager style' },
  { id: 'consulting-earth', layout: 'split',  category: 'finance',  style: 'warm brown sidebar (#7c2d12), earth tones, classic prestige look, McKinsey/BCG/Bain consulting inspired' },
  { id: 'general-elegant',  layout: 'single', category: 'other',    style: 'gold accent (#b45309) on near-black charcoal (#1c1c1e), Georgia serif headings, executive gravitas' },
]

const DESIGN_DIRECTOR_SYSTEM = `You are a senior resume template art director with expertise in typography, color theory, and professional document design. Your designs must be:
- ATS-compatible (clean, parseable, no complex decorative layouts)
- Visually distinctive and beautiful
- Print-ready on A4 white paper
- Industry-appropriate for the target audience

For each archetype, create a detailed design brief following the style description exactly. Choose colors with excellent contrast (WCAG AA minimum, AAA preferred for body text).

Return a JSON object with this exact shape:
{
  "briefs": [
    {
      "archetypeId": "copy from input",
      "name": "Creative 2-3 word template name (e.g. Midnight Tech, Coastal Finance)",
      "description": "One professional sentence describing the target user",
      "primaryColor": "#hex — main accent for headings, borders, highlights",
      "accentColor": "#hex — secondary accent for skills, tags, decorative elements",
      "sidebarColor": "#hex for split sidebar background, or null for single layout",
      "textColor": "#hex — primary body text, must have high contrast on backgroundColor",
      "backgroundColor": "#hex — page/main area background (white or near-white for print)",
      "fontStack": "valid CSS font-family using web-safe fonts only (Georgia, Arial, Helvetica, 'Times New Roman', or combinations)",
      "designNotes": "3-5 specific CSS styling tips, e.g. use 3px left border on h2, skill chips use outline not fill, add letter-spacing to h2"
    }
  ]
}`

const CSS_CODER_SYSTEM = `You are a CSS engineer specializing in resume templates rendered by Puppeteer to A4 PDF (794px wide, 15mm print margins, white background).

You will write CSS for this EXACT HTML structure — no other HTML elements exist:

SINGLE LAYOUT:
<body>
  <div class="main">
    <h1>Full Name</h1>
    <div class="contact">email | phone | city | linkedin</div>
    <h2>Summary</h2><p style="font-size:13px;margin:4px 0">Summary text</p>
    <h2>Experience</h2>
    <div style="margin-bottom:10px">
      <div class="job-title">Senior Engineer</div>
      <div class="company">Company · Jan 2022 – Present</div>
      <ul><li>Achievement bullet</li></ul>
    </div>
    <h2>Education</h2>
    <div style="margin-bottom:8px">
      <div class="job-title">University Name</div>
      <div class="company">B.S. Computer Science · 2018 – 2022</div>
    </div>
    <h2>Skills</h2>
    <div class="skills"><span class="skill">React</span><span class="skill">TypeScript</span></div>
    <h2>Achievements</h2>
    <ul><li>Award or achievement</li></ul>
  </div>
</body>

SPLIT LAYOUT:
<body>
  <div class="sidebar">
    <h1>Full Name</h1>
    <div class="contact">email<br>phone<br>city</div>
    <h2>Skills</h2>
    <div class="skill">React</div><div class="skill">TypeScript</div>
    <h2>Education</h2>
    <div style="margin-bottom:8px">
      <div style="font-weight:bold;font-size:12px">University</div>
      <div style="font-size:11px;opacity:.8">B.S. Computer Science</div>
    </div>
  </div>
  <div class="main">
    <h2>Summary</h2><p style="font-size:13px;margin:4px 0">text</p>
    <h2>Experience</h2>
    <div style="margin-bottom:10px">
      <div class="job-title">Senior Engineer</div>
      <div class="company">Company · Jan 2022 – Present</div>
      <ul><li>Achievement</li></ul>
    </div>
  </div>
</body>

ALLOWED SELECTORS ONLY — use no others:
body, .main, .sidebar, h1, h2, .contact, .job-title, .company, ul, li, p, .skills, .skill, .sidebar h2, .main h2

STRICT RULES:
1. Output ONLY the raw CSS string — no JSON, no markdown, no code fences, no explanation
2. Single line, no newlines inside the CSS
3. SPLIT layout: body MUST have display:grid and grid-template-columns (sidebar 200–260px, e.g. 240px 1fr)
4. SPLIT layout: .skill is a block div — do NOT add display:flex; use padding:3px 0
5. SINGLE layout: .skills must have display:flex;flex-wrap:wrap;gap:6px
6. Minimum font-size: 11px; minimum line-height: 1.4
7. h1 font-size: 22–28px; h2 font-size: 13–16px
8. NO overflow:hidden, fixed heights, page-break rules
9. Padding for .main and .sidebar: 16–24px
10. Use single quotes for font names (e.g. font-family:'Helvetica Neue',Arial,sans-serif)

REFERENCE EXAMPLES (adapt style only):
Single: body{font-family:'Helvetica Neue',Arial,sans-serif;color:#222;margin:0}.main{padding:24px}h1{font-size:26px;margin:0}.contact{color:#666;font-size:13px;margin-top:4px}h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px}.job-title{font-weight:bold}.company{color:#555;font-size:13px}ul{margin:4px 0;padding-left:18px}li{font-size:13px;margin-bottom:2px}.skills{display:flex;flex-wrap:wrap;gap:6px}.skill{background:#f0f0f0;padding:2px 8px;border-radius:3px;font-size:12px}
Split: body{font-family:Georgia,serif;color:#111;margin:0;display:grid;grid-template-columns:220px 1fr}.sidebar{background:#1a2744;color:#fff;padding:20px;min-height:100vh}.main{padding:20px}h1{font-size:22px;margin:0}.contact{font-size:12px;margin-top:6px;opacity:.8}h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;padding-bottom:3px;margin-top:18px}.sidebar h2{color:#fff;border-bottom:1px solid rgba(255,255,255,0.3)}.main h2{color:#1a2744;border-bottom:2px solid #1a2744}.job-title{font-weight:bold;font-size:13px}.company{color:#555;font-size:12px}ul{margin:4px 0;padding-left:16px}li{font-size:12px;margin-bottom:3px}.skill{font-size:12px;margin-bottom:4px}`

async function generateDesignBriefsBatch(archetypes: ArchetypeSpec[]): Promise<DesignBrief[]> {
  const archetypeList = archetypes
    .map(a => `  { "id": "${a.id}", "layout": "${a.layout}", "style": "${a.style}" }`)
    .join(',\n')

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: DESIGN_DIRECTOR_SYSTEM },
      {
        role: 'user',
        content: `Create design briefs for these ${archetypes.length} resume template archetypes:\n[\n${archetypeList}\n]\n\nReturn { "briefs": [ ...exactly ${archetypes.length} objects... ] }`,
      },
    ],
  })

  const raw = response.choices[0].message.content ?? '{"briefs":[]}'
  let json: { briefs: DesignBrief[] }
  try {
    json = JSON.parse(raw) as { briefs: DesignBrief[] }
  } catch (err) {
    console.error('[template-agent] Stage 1 JSON parse failed. finish_reason:', response.choices[0].finish_reason, 'raw length:', raw.length, err)
    return []
  }

  const rawBriefs = json.briefs ?? []
  if (rawBriefs.length === 0) {
    console.warn('[template-agent] Stage 1 returned 0 briefs. JSON keys:', Object.keys(json), 'finish_reason:', response.choices[0].finish_reason)
  }
  return rawBriefs.map((brief) => {
    const archetype = archetypes.find((a) => a.id === brief.archetypeId)
    return {
      ...brief,
      category: archetype?.category ?? 'other',
      layout: archetype?.layout ?? 'single',
    }
  })
}

async function generateDesignBriefs(): Promise<DesignBrief[]> {
  // Split into two batches of 5 to stay well within the GPT-4o 4096-token output limit.
  // A single call for 10 briefs risks hitting the limit and producing truncated JSON.
  const mid = Math.ceil(DESIGN_ARCHETYPES.length / 2)
  const [batchA, batchB] = await Promise.all([
    generateDesignBriefsBatch(DESIGN_ARCHETYPES.slice(0, mid)),
    generateDesignBriefsBatch(DESIGN_ARCHETYPES.slice(mid)),
  ])
  return [...batchA, ...batchB]
}

async function generateTemplateCSS(brief: DesignBrief): Promise<{ css: string; layout: 'single' | 'split' }> {
  // Do NOT use response_format: json_object here. CSS strings contain double quotes (font-family:"X")
  // which causes JSON parse failures even when the model tries to produce valid JSON.
  // Instead, ask for raw CSS text directly — the layout is already known from brief.layout.
  let response
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: CSS_CODER_SYSTEM },
        {
          role: 'user',
          content: `Generate CSS for layout: ${brief.layout}\n\nDesign brief:\n${JSON.stringify(brief, null, 2)}\n\nOutput ONLY the raw CSS string. No JSON, no markdown, no explanation.`,
        },
      ],
    })
  } catch (err) {
    console.error(`[template-agent] Stage 2 API call failed for ${brief.archetypeId}:`, err)
    throw err
  }

  const raw = (response.choices[0].message.content ?? '').trim()
  // Strip any markdown code fences the model might accidentally add
  const css = raw
    .replace(/^```(?:css)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/\n/g, ' ')
    .trim()

  if (css.length < 80) {
    console.warn(`[template-agent] CSS suspiciously short for ${brief.archetypeId} (${css.length} chars). finish_reason: ${response.choices[0].finish_reason}`)
  }

  return { css, layout: brief.layout }
}

export async function runTemplateGenerationAgent(): Promise<TemplateAgentResult[]> {
  const briefs = await generateDesignBriefs()
  console.log(`[template-agent] Stage 1 complete: ${briefs.length} design briefs`)

  if (briefs.length === 0) return []

  const settled = await Promise.allSettled(
    briefs.map(async (brief) => {
      const { css, layout } = await generateTemplateCSS(brief)
      return { brief, css, layout } satisfies TemplateAgentResult
    }),
  )

  const rejected = settled.filter((r) => r.status === 'rejected')
  if (rejected.length > 0) {
    console.error(`[template-agent] Stage 2: ${rejected.length}/${settled.length} CSS calls failed`)
    rejected.forEach((r) => {
      if (r.status === 'rejected') console.error('  reason:', r.reason)
    })
  }

  const valid = settled
    .filter((r): r is PromiseFulfilledResult<TemplateAgentResult> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((r) => r.css.trim().length > 80)

  console.log(`[template-agent] Stage 2 complete: ${valid.length}/${briefs.length} valid templates`)
  return valid
}

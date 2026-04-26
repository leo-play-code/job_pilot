---
name: saas-morph-demo
description: Generate a production-grade React + framer-motion "morph animation" component for a SaaS product, given a screenshot and a feature description. The output is an EMBEDDABLE component (not a full page) that the user can drop into any section of their existing site. It shows a single piece of input data smoothly transforming through multiple output formats using shared element transitions (layoutId) — the kind of signature animation seen on Linear, Vercel, and Raycast. Use this skill whenever the user asks to build a hero animation, signature animation, morph demo, layoutId animation, shared element transition, "Linear-style" or "Vercel-style" UI animation, or wants to turn their SaaS product page screenshot into an interactive landing-page demo. Also trigger on phrases like "make my product look like Linear's homepage", "I want a hero animation", "build me a morphing demo", "turn this product into an animated showcase", or any request that references the JobPilot morph demo this skill is based on.
---

# SaaS Morph Demo Generator

This skill builds an embeddable React component that transforms one piece of input data through 4–5 visually distinct output layouts using framer-motion's `layoutId` (shared element transitions). The result is a single `.jsx` file the user drops into their React project — it renders inside any parent `<div>` and doesn't take over the page.

## When this skill applies

The morph pattern works when the product can be told as **"one input → many transformations"** or **"raw state → refined states → outcome"**. Examples:

- Resume/job tools: profile data → resume templates → cover letter → submitted
- Email/messaging tools: rough draft → polished tones → personalized variants → sent
- Design tools: sketch → mockup → variants → exported
- Note/knowledge tools: messy notes → organized → summarized → published
- Coding tools: prompt → generated code → tests → deployed

The pattern works less well when the product is fundamentally about navigation, dashboards with many independent panels, or non-document workflows. If forced, it produces a confusing demo. When the fit is poor, say so plainly and suggest a different demo style (screen recording with motion overlays, before/after split, scroll-driven reveals).

## Workflow

Follow these steps in order. Don't skip the interview step — guessing the product's value prop produces bland demos.

### Step 1 — Read the inputs

The user provides one or more product screenshots and a feature description. Look at the screenshots carefully and identify:

- **Product name** (from logos, browser tabs, headers)
- **Color identity** (dominant brand colors visible in the UI)
- **UI density and style** (minimal/dense, playful/serious, light/dark)
- **Core nouns** — what does the product manage? (resumes, emails, designs, tickets, leads…)
- **Core verbs** — what does it do to those nouns? (generate, send, transform, analyze, automate…)
- **Persona signals** — who is the target user, based on language and examples shown?

Record these before designing stages. They constrain everything that follows.

### Step 2 — Decide if the morph fits

Ask yourself: can this product's value be told as a single piece of data flowing through transformations? If yes, proceed. If no, tell the user honestly and offer alternatives. Don't force a morph onto a product that doesn't have this shape — it'll feel arbitrary.

### Step 3 — Interview to fill gaps

Use the `ask_user_input_v0` tool (or plain questions if it's unavailable) to confirm the things that aren't clear from the screenshots. Typical gaps:

- **Primary persona for the demo** — whose data should the demo show? A name, role, and 2–3 attributes that feel authentic to the product's audience.
- **Most important feature to highlight** — which transformation is the "wow"?
- **Aesthetic direction** — let the user pick from concrete options (editorial cream, modern dark, soft pastel, brutalist mono, etc.) rather than asking abstractly.
- **Stage labels** — what should each step be called in the user's own product language?

Prefer presenting 2–4 concrete options over asking open-ended questions. Users decide faster on a multiple choice than on a blank prompt.

### Step 4 — Design the 5 stages

Sketch out 5 stages before writing any code. A stage needs:

- A **role in the narrative** — input / variant A / variant B / different document / outcome
- **Distinct dimensions** — different stages should have visibly different card sizes (a profile card and a submitted-state card shouldn't be the same width). The dimension change is part of the wow.
- **Layout difference** — not just different colors of the same layout. Move the avatar. Change column count. Switch from list to grid.
- **Shared elements** — at least 3 elements (typically: name/title, avatar, one or two repeated entities like skills/tags) must persist across most stages with `layoutId` so they morph rather than fade.

Two principles that strongly improve perceived quality:

- **At least one stage must be non-prose.** A bullet list, a table, a grid, or a form-like layout. If all 5 stages are paragraphs of text in slightly different shapes, the demo feels static. The dramatic visual shift between prose and a structured layout is one of the most satisfying moments.
- **Close the loop in the final stage.** The shared entities introduced in stage 0 (skills / entities / tags / whatever they are) should reappear in stage 4, ideally collected as tags or chips, in a new visual form. This makes the morph feel narratively complete instead of just stopping.

For detailed templates by product category, read `references/stage-design.md`.

### Step 5 — Pick visual identity

Commit to one direction. Examples that have worked:

- **Editorial cream** — `#FAF7F0` paper bg, Fraunces serif display, Geist sans body, Geist Mono for labels. Restrained accents in emerald and amber. (This is the JobPilot template's default.)
- **Modern dark** — `#0A0A0A` bg, Geist for everything, single bright accent (#3B82F6 or similar). Subtle inner glows.
- **Soft pastel** — Off-white bg, generous padding, rounded everything, single warm accent.
- **Editorial classic** — Cream bg, only serif fonts, narrow margins, ink-on-paper aesthetic.

Match the aesthetic to the product's audience — a job tool for engineers reads differently from a design tool for creatives. **Avoid Inter and generic SaaS purple gradients.** They make the demo look like every other AI-generated component.

For typography pairings and color palettes, read `references/visual-identity.md`.

### Step 6 — Customize the template

Read `assets/template.jsx`. It's a complete, working **embeddable** morph demo (the JobPilot version). It is NOT a full page — it renders inside a parent `<div>` and respects whatever surrounding layout the user has.

Architecture:

- `TransitionContext` broadcasts spring/fade settings driven by a speed control (so 0.5x / 1x / 1.5x / 2x all work cleanly)
- Shared morphing elements (`Avatar`, `Name`, `Title`, `Skill`) with `layoutId`s
- 5 `Stage*` components, each returning a `motion.div` with `layoutId="card"` so the card itself morphs dimensions
- The default export is a `MorphDemo` component that accepts `autoplay`, `defaultSpeed`, `showTabs`, `showControls`, `className`, `style` props
- Fonts auto-load via `useFonts()` — only injected once per page

Customize these regions (search for `// CUSTOMIZE:` markers):

| Region | What to change |
|---|---|
| Lucide icon imports | Swap to icons that fit the product (Pencil, Send, Zap, etc.) |
| `COLOR` object | The visual identity palette |
| `D` (data object) | The persona's name, title, attributes, and 3–5 "shared entities" |
| `STAGES` array | 5 stage IDs and labels in the user's product language |
| `FONT_HREF` | The Google Fonts URL — match the typography pairing chosen |
| Each `Stage*` component | The actual layout of each stage |

**Keep these untouched** unless the user specifically asks:
- The `TransitionContext` plumbing
- The speed control logic
- The auto-cycle `useEffect`
- The `MorphDemo` props API and the default export structure
- The fact that it's a contained component — do NOT add page-level `<header>`, full-screen background, or `min-height: 100vh`

### Step 7 — Output the file

Write the customized component to `/mnt/user-data/outputs/<ProductName>MorphDemo.jsx` and present it with the `present_files` tool. Then in chat, briefly cover:

- **Install instructions** — `npm install framer-motion lucide-react`
- **The 5 stages** in one line each, so the user can verify the narrative
- **A 3–5 line usage snippet** showing how to embed in their site, e.g.:

```jsx
import MorphDemo from './YourProductMorphDemo';

<section className="bg-amber-50 py-20">
  <div className="max-w-3xl mx-auto px-6">
    <MorphDemo />
  </div>
</section>
```

Do NOT walk through the code line by line. The user can read the file. Keep the chat reply concise.

## Things that go wrong (avoid these)

- **Generic stages**: "Step 1 / Step 2 / Step 3" labels are a tell that the narrative is weak. Stages should have product-specific names.
- **No real morph**: If two stages don't share `layoutId` elements, they don't actually morph — they cross-fade. Make sure shared elements persist across stages.
- **Same layout, different colors**: Stages must differ structurally, not just visually.
- **All-prose stages**: If every stage is just paragraphs in different shapes, the demo feels static. At least one stage should be visibly non-prose (bullets, table, grid, form).
- **No closure**: If shared entities appear in stage 0 and never return, the demo feels like it just stops. Re-collect them in stage 4 as tags, chips, or a summary.
- **Wall-of-text persona bio**: Keep persona attributes short and concrete. "6 years building backend systems" not "passionate engineer with diverse experience".
- **Forgetting the speed control**: It's part of the template's value — leave it in unless the user explicitly says no.
- **Inter font**: It's the AI-generated-component giveaway. Use something with character.
- **Producing a full page instead of an embeddable component**: The output is a component the user puts inside a `<section>` on their existing site. No `<h1>`, no `min-height: 100vh`, no full-screen background. The parent application handles all surrounding chrome.
- **Skipping the interview**: Even when you think you understand the product from the screenshot, confirm the persona and aesthetic. Customers know their audience better than Claude does.

## Reference files

- `references/stage-design.md` — Detailed 5-stage decomposition templates for common SaaS categories (resume tools, email tools, design tools, code tools, content tools).
- `references/visual-identity.md` — Curated typography pairings and color palettes that avoid the AI-slop look.
- `assets/template.jsx` — The working JobPilot template with `// CUSTOMIZE:` markers.

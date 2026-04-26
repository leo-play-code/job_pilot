# Stage Design Templates

How to decompose a SaaS product into a 5-stage morph narrative. Pick the closest pattern below as a starting point, then customize.

## The general shape

Every working morph demo has this rhythm:

1. **Stage 1 — Input / raw state.** A compact card showing the "before" data. Small dimensions. The persona is established here.
2. **Stages 2–4 — Transformations.** Different ways the same data can be presented, used, or transformed. Card grows and changes structure.
3. **Stage 5 — Outcome.** The completion state. Compact again, often with a success indicator. Communicates value delivered.

The card dimensions should follow a curve: small → medium → medium → large → small. This breathing pattern keeps the eye engaged.

## Pattern A — "Same data, multiple formats"

Best for tools that take one input and produce multiple polished outputs.

**Examples**: Resume builders, document generators, email composers with tone variants, image upscalers with styles, social-post generators across platforms.

**Stages**:
1. **Profile / Input** — compact card with the user's raw data (name, role, key attributes)
2. **Format A** — polished version in style A (e.g., "Modern" template)
3. **Format B** — same data, style B (e.g., "Classic" template)
4. **Format C** — different output type entirely (e.g., cover letter from the same data)
5. **Outcome** — the action completed (sent, exported, published)

**Shared elements** (use `layoutId` for these): name, avatar/icon, 2–3 attribute tags.

**Reference implementation**: This is exactly the JobPilot template.

## Pattern B — "Rough → refined → variants"

Best for creative tools that take messy input and clean it up.

**Examples**: Design tools, writing assistants, code formatters, photo editors, slide generators.

**Stages**:
1. **Raw input** — visibly messy: handwritten notes, rough sketch, draft text with strikethroughs
2. **Cleaned up** — same content, structured and refined
3. **Variant A** — alternative styling/treatment of the cleaned version
4. **Variant B** — another alternative
5. **Exported / shared** — final state with destination indicator

**Shared elements**: the core content (a title or central object), 2–3 entities that persist.

**Wow moment**: stage 1 → 2, where mess becomes order. Make it visceral. Crooked text straightens. Messy strokes snap to grid.

## Pattern C — "One question, many answers"

Best for AI-powered tools that produce multiple suggestions or completions.

**Examples**: Brainstorming tools, name generators, AI assistants with multiple response modes, recommendation engines.

**Stages**:
1. **The prompt** — a single question/input card
2. **Answer A** — first response option
3. **Answer B** — second response option, structurally different
4. **Comparison** — answers shown side-by-side or in a unified view
5. **Selected / used** — the chosen answer in its destination context

**Shared elements**: the prompt text, key entities that recur in answers.

## Pattern D — "Progressive enrichment"

Best for tools that take a small seed and progressively layer information.

**Examples**: CRM enrichment, research assistants, due-diligence tools, contact data tools, lead scoring.

**Stages**:
1. **Seed** — minimal input (just an email, just a company name)
2. **Identified** — basic match (name, photo, title pulled in)
3. **Enriched** — fuller profile (history, related entities, signals)
4. **Analyzed** — insights or scoring derived from the data
5. **Actioned** — output: a recommendation, an outreach draft, a routing decision

**Shared elements**: the seed identifier (email/domain) plus name and avatar once identified.

**Wow moment**: stage 2 → 3, the moment a sparse card fills with structured data.

## Pattern E — "Workflow stages"

Best for products that have a sequence of states a user moves through.

**Examples**: Onboarding flows, kanban-style trackers, application/booking processes, deployment pipelines.

**Stages**:
Each stage = a state in the workflow. The same record morphs through statuses, gaining metadata at each step.

This pattern has weaker visual variety than A–D because the layouts tend to look similar. If using it, make sure each stage adds substantial new visual elements (not just status changes), otherwise the demo feels static.

## Choosing shared elements

The morph effect lives or dies on which elements have `layoutId`. Rules of thumb:

- **3–5 shared elements is the sweet spot.** Fewer and it looks like a slideshow; more and the morphs become chaotic.
- **Pick elements that change position dramatically.** An avatar that goes from center-large to top-left-small is satisfying. An avatar that stays in the same place is invisible.
- **Pick elements whose styling changes.** A name that's a serif h1 in one stage and a sans-serif label in another draws the eye to the morph.
- **Don't share decorative elements.** Backgrounds, dividers, section headers should NOT have layoutIds — they're stage-specific scenery.

## Persona design

A bad persona is the second-biggest reason demos feel flat (after generic stages). Some rules:

- **Specific is more compelling than impressive.** "Senior Python Engineer at TechCorp" beats "Award-winning software architect with 10+ years of Fortune 500 experience".
- **Match the persona to the product's actual buyer.** A B2B sales tool's demo should show an account exec, not a CEO.
- **Use 2–3 attributes max in the input card.** Anything more clutters stage 1 and reduces the contrast with later, fuller stages.
- **Names should feel locale-appropriate.** A Taiwanese product can use Chinese or English names — pick based on the product's primary market.

## Stage label patterns

Stage labels are the small monospace tags above each stage. They guide the viewer through the narrative.

Patterns that work:
- **`01 · Profile`** — numbered + descriptive (technical feel)
- **`Step 1 of 5`** — explicit progression (consumer feel)
- **`Input`** / **`Generate`** / **`Refine`** — verb-based (active feel)

Patterns to avoid:
- Generic "Step 1 / Step 2" without descriptors
- Marketing-speak like "Magic happens" or "AI-powered transformation"
- Inconsistent label structures across stages

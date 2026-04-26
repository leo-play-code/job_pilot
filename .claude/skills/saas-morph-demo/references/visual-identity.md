# Visual Identity Reference

Curated typography pairings and color palettes for morph demos. These are starting points — adjust to fit the product's actual brand.

## Why this matters

Default AI-generated UI looks identical across products: Inter font, white background, purple gradient accent. The morph demo's whole purpose is to make a product feel distinctive. The visual identity is doing 50% of that work.

Pick a coherent direction and commit. Don't mix styles.

## Typography pairings

All fonts are available on Google Fonts. Import via the `<style>` tag in the template.

### 1. Editorial cream (default)

```
Display: Fraunces
Body: Geist
Mono: Geist Mono
```

Feel: Slightly refined, document-like, trustworthy. Good for: career tools, content tools, B2B documents, anything that benefits from a "considered" tone.

### 2. Modern technical

```
Display: Geist (semibold)
Body: Geist
Mono: Geist Mono / JetBrains Mono
```

Feel: Clean, no-nonsense, developer-friendly. Good for: developer tools, API products, infrastructure.

### 3. Soft warm

```
Display: Instrument Serif
Body: Inter Tight
Mono: JetBrains Mono
```

Feel: Approachable, human, slightly playful. Good for: consumer products, wellness, education.

### 4. Brutalist mono

```
Display: JetBrains Mono (bold)
Body: JetBrains Mono
Mono: JetBrains Mono
```

Feel: Raw, technical, opinionated. Good for: dev tools with personality, indie-flavored products. Use sparingly — it's polarizing.

### 5. Editorial classic

```
Display: Fraunces (bold)
Body: Fraunces (regular)
Mono: IBM Plex Mono
```

Feel: Print magazine, literary. Good for: writing tools, publications, archival/research products.

### 6. Cyber clean

```
Display: Space Grotesk
Body: Space Grotesk
Mono: Space Mono
```

Feel: Slightly futuristic, neutral, clean. Good for: AI products, analytics, fintech.

**Note**: Space Grotesk is overused in the AI-generated UI space. Use only if it genuinely fits — if the product has any other character, pick something else.

### Avoid

- **Inter as display** — generic, screams "AI-generated component"
- **Roboto / Arial / system-ui** — defaults that signal lack of intention
- **Pacifico / Lobster / decorative scripts** — date the demo immediately
- **Mixing 3+ font families** — looks chaotic

## Color palettes

Each palette gives you `paper` (background), `card` (surface), `ink` (primary text), `body`, `mute`, `faint`, `line` (border), and 1–2 `accent` colors.

### 1. Editorial cream (default)

```js
paper: '#FAF7F0',
card: '#FFFFFF',
ink: '#0A0A0A',
body: '#404040',
mute: '#737373',
faint: '#A8A29E',
line: '#EAE6DC',
accent1: '#15803D',  // emerald — for success/AI
accent2: '#B45309',  // amber — for highlights
```

Pairs with: Editorial cream typography. JobPilot's default.

### 2. Slate dark

```js
paper: '#0A0A0F',
card: '#15151D',
ink: '#FAFAFA',
body: '#D4D4D8',
mute: '#A1A1AA',
faint: '#52525B',
line: '#27272A',
accent1: '#3B82F6',  // blue
accent2: '#A855F7',  // purple — use sparingly
```

Pairs with: Modern technical. Avoid using both accent1 AND accent2 prominently — pick one.

### 3. Off-white minimal

```js
paper: '#FAFAFA',
card: '#FFFFFF',
ink: '#171717',
body: '#404040',
mute: '#737373',
faint: '#A3A3A3',
line: '#E5E5E5',
accent1: '#000000',  // pure black accent (rare, distinctive)
accent2: '#DC2626',  // red — for critical actions
```

Pairs with: Modern technical or Soft warm.

### 4. Warm pastel

```js
paper: '#FFF8F0',
card: '#FFFFFF',
ink: '#1F1B14',
body: '#5C5247',
mute: '#8B7E6F',
faint: '#B8AC9C',
line: '#EDE3D3',
accent1: '#C2410C',  // warm orange
accent2: '#15803D',  // emerald
```

Pairs with: Soft warm. Good for consumer products.

### 5. Pure black & white

```js
paper: '#FFFFFF',
card: '#FFFFFF',
ink: '#000000',
body: '#262626',
mute: '#737373',
faint: '#A3A3A3',
line: '#000000',  // 1px black borders, brutalist style
accent1: '#000000',
```

Pairs with: Brutalist mono. Use thicker borders (2–3px) and larger type. Polarizing — only use when the product has strong opinions.

### 6. Sage tech

```js
paper: '#F8FAF8',
card: '#FFFFFF',
ink: '#0F1614',
body: '#3A4541',
mute: '#6B7670',
faint: '#9CA8A2',
line: '#E1E9E4',
accent1: '#0F766E',  // deep teal
accent2: '#B45309',
```

Pairs with: Cyber clean. Good for analytics, environmental, healthcare products.

### Avoid

- **Purple-on-white gradient hero** — the AI-slop signature
- **Neon accents on pure black** — overused in dev tools, hard to read
- **More than 2 accent colors** — looks decorative rather than designed
- **Random Tailwind colors** without coherent palette

## Combining typography + palette

Default pairings that work:

| Typography | Palette |
|---|---|
| Editorial cream | Editorial cream OR Warm pastel |
| Modern technical | Slate dark OR Off-white minimal |
| Soft warm | Warm pastel OR Off-white minimal |
| Brutalist mono | Pure black & white |
| Editorial classic | Editorial cream |
| Cyber clean | Sage tech OR Slate dark |

When in doubt, default to **Editorial cream + Editorial cream**. It's distinctive without being polarizing, and most products benefit from looking a bit more "considered" than the typical SaaS.

## Spacing & shadows

Don't overthink shadows. The template's defaults work:

```css
box-shadow: 0 1px 2px rgba(10,10,10,0.03), 0 12px 32px rgba(10,10,10,0.05);
```

Two-layer shadows feel more refined than single shadows. Adjust opacity for darker palettes (use `rgba(0,0,0,0.4)` ranges instead).

For padding, the template uses generous breathing room (`32px` to `48px` card padding). Resist the urge to tighten — generous space is part of the editorial feel.

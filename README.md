# JobPilot

AI-powered resume and cover letter generator. Helps job seekers create professional documents in minutes.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · Supabase (PostgreSQL) · NextAuth.js v5 · OpenAI GPT-4o-mini · Anthropic Claude Vision · AWS S3 · Paddle · Puppeteer

---

## Features

- **Resume Builder** — Build from scratch or import an existing PDF; AI enhances your content; choose from multiple templates; download as PDF
- **Cover Letter Generator** — Paste a job description + choose a resume → AI writes a tailored letter in seconds
- **Auto-Apply (104.com)** — Automates batch job applications on the 104 job platform using your stored credentials
- **Template System** — Admins upload a design image → Claude Vision analyzes the layout → editable HTML/CSS template
- **Subscription & Credits** — Free tier (10 AI ops/day) · Pro monthly plan · One-time credit packs (via Paddle)
- **Multi-language** — Chinese (zh) & English (en), switchable without page reload
- **Admin Dashboard** — Manage users, resumes, cover letters, usage logs, and templates

---

## How to Use

### 1. Register & Log In

Go to `/register` to create an account with email + password, or click **Sign in with Google** on `/login`.

After logging in you land on the **Dashboard** at `/dashboard`. It shows all your resumes and cover letters, plus your remaining daily AI operations.

---

### 2. Create a Resume

**Option A — Build from scratch**

1. Click **New Resume** on the dashboard
2. Fill in the 4-step form:
   - **Step 1 Personal Info** — name, title, email, phone, location, summary
   - **Step 2 Experience** — add job entries; click **AI Enhance** to polish each description
   - **Step 3 Education & Skills** — schools, degrees, skill tags
   - **Step 4 Template** — pick a template; the right panel shows a live A4 preview
3. Click **Save** — the resume appears in your dashboard

**Option B — Import a PDF**

1. Click **Upload Resume** on the dashboard
2. Upload your existing PDF
3. Choose **AI Parse** (extracts & structures the content) or **Raw Import** (stores the PDF as-is)
4. After parsing, review and edit in the same 4-step form

**Download as PDF**

Open any resume → click **Download PDF**. Puppeteer renders the HTML template server-side and returns a printable PDF.

---

### 3. Generate a Cover Letter

1. Click **New Cover Letter** on the dashboard
2. Select which resume to base it on
3. Paste the job posting text into the **Job Description** field
4. Choose a word count (short / medium / long)
5. Click **Generate** — the AI writes a tailored cover letter in seconds
6. Edit the result inline, then click **Save**

---

### 4. Auto-Apply on 104.com

> This feature automates job applications on [104.com.tw](https://www.104.com.tw). Only use it with your own account.

1. Go to **Auto-Apply** in the sidebar
2. Enter your 104.com login credentials — they are encrypted with AES-256-GCM before being stored
3. Set your job search preferences (keywords, location, job type)
4. Click **Capture Session** — the server launches a headless browser to log in and capture your session
5. Review the matched job list, select roles to apply to, then click **Batch Apply**
6. View application history in the **History** tab

---

### 5. Manage Templates (Admin only)

1. Log in with the admin email (`ADMIN_EMAIL`)
2. Go to `/admin/templates`
3. **Import a design** — upload a PNG/PDF screenshot → Claude Vision analyzes the layout and generates HTML/CSS → edit the CSS in the editor → save
4. **Activate / Deactivate** templates — only active templates appear in the resume builder
5. **Create from scratch** — use the JSON editor to define the template structure directly

---

### 6. Billing & Credits

- **Free plan** — 10 AI operations per day (resets at midnight UTC). Covers resume AI-enhance, PDF parsing, and cover letter generation.
- **Pro plan** — unlimited operations, access to all templates. Subscribe at `/settings/billing` via Paddle.
- **Credit packs** — one-time top-ups at `/settings/credits` (Starter · Job Seeker · Power). Credits are deducted per AI operation.

---

## Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project (PostgreSQL)
- An [AWS S3](https://aws.amazon.com/s3/) bucket
- [Google Cloud Console](https://console.cloud.google.com) OAuth credentials
- [OpenAI](https://platform.openai.com) API key
- [Anthropic](https://console.anthropic.com) API key (for admin template import)
- [Paddle](https://sandbox-vendors.paddle.com) Sandbox account

---

## Local Development

### 1. Clone & Install

```bash
git clone <repo-url>
cd job-pilot
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` — see [Environment Variables](#environment-variables) below for every field.

### 3. Database Setup

```bash
# Push schema to Supabase (first time or after schema changes)
npm run db:push

# Seed default templates and admin account
npm run db:seed
```

### 4. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run type-check` | TypeScript check, no emit |
| `npm test -- --run` | Run all tests once |
| `npm run db:push` | Sync Prisma schema → Supabase (no migration history) |
| `npm run db:migrate` | Create a migration file + apply |
| `npm run db:studio` | Open Prisma Studio (GUI for DB) |
| `npm run db:seed` | Seed default data |

---

## Environment Variables

### Database (Supabase)

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

- `DATABASE_URL` — use the **Transaction pooler** URL (port **6543**) for runtime queries
- `DIRECT_URL` — use the **Session pooler** or direct URL (port **5432**) for migrations

> Both URLs are in Supabase Dashboard → **Settings → Database → Connection string**.

---

### NextAuth

```env
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

- `NEXTAUTH_SECRET` — any long random string; generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` locally; your Vercel URL in production

---

### Google OAuth

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

See [Google OAuth Setup](#google-oauth-setup) below.

---

### AI APIs

```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

- `OPENAI_API_KEY` — used for resume AI-enhance and cover letter generation (GPT-4o-mini / GPT-4o)
- `ANTHROPIC_API_KEY` — used by admins only, for Claude Vision analysis when importing template design images

---

### AWS S3

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET="job-pilot-assets"
# AWS_CLOUDFRONT_URL="https://xxxxx.cloudfront.net"  # optional CDN prefix
```

- `AWS_CLOUDFRONT_URL` — optional; if set, all S3 asset URLs are served through this CDN domain instead of the default S3 URL

See [AWS S3 Setup](#aws-s3-setup) below.

---

### Admin

```env
ADMIN_EMAIL="your-admin@email.com"
```

The account with this email gets `role: ADMIN` after `npm run db:seed`. Gives access to `/admin/dashboard` and `/admin/templates`.

---

### Security & Encryption

```env
CREDENTIAL_ENCRYPTION_KEY="<64-character hex string>"
```

- `CREDENTIAL_ENCRYPTION_KEY` — AES-256-GCM key used to encrypt 104.com platform credentials stored in the database. **Required** if you use the Auto-Apply feature.
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### Paddle (Payments)

```env
PADDLE_API_KEY=""
PADDLE_WEBHOOK_SECRET=""
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=""
PADDLE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Credit Pack Price IDs (one-time payments)
PADDLE_CREDIT_PACK_STARTER_PRICE_ID=""
PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID=""
PADDLE_CREDIT_PACK_POWER_PRICE_ID=""
```

| Variable | Description |
|---|---|
| `PADDLE_API_KEY` | Server-side API key from Paddle Dashboard → Developer Tools → Authentication |
| `PADDLE_WEBHOOK_SECRET` | Webhook signature secret for verifying Paddle event payloads |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Client-side token for embedding the Paddle checkout overlay |
| `PADDLE_PRICE_ID_MONTHLY` | Price ID for the Pro monthly subscription |
| `NEXT_PUBLIC_APP_URL` | Public URL of your app — used in Paddle checkout redirect URLs |
| `PADDLE_CREDIT_PACK_STARTER_PRICE_ID` | Price ID for the Starter credit pack (one-time) |
| `PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID` | Price ID for the Job Seeker credit pack (one-time) |
| `PADDLE_CREDIT_PACK_POWER_PRICE_ID` | Price ID for the Power credit pack (one-time) |

See [Paddle Setup](#paddle-setup) below.

---

### Development Overrides (optional)

```env
PUPPETEER_HEADLESS="false"
```

- `PUPPETEER_HEADLESS` — set to `"false"` to make the browser window visible during PDF generation or Auto-Apply session capture. Useful for debugging locally. Omit (or leave unset) for normal headless behavior.

---

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region, set a strong database password
3. After the project is ready, go to **Settings → Database**
4. Copy the **Transaction pooler** connection string → `DATABASE_URL` (port `6543`)
5. Copy the **Session pooler** connection string → `DIRECT_URL` (port `5432`)
6. RLS (Row Level Security) is **not required** — Prisma handles all DB access from the backend

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create **OAuth 2.0 Client ID** → Application type: **Web application**
3. Add Authorized Redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://<your-vercel-domain>/api/auth/callback/google`
4. Copy **Client ID** → `GOOGLE_CLIENT_ID`
5. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## AWS S3 Setup

1. Create an S3 bucket (e.g. `job-pilot-assets`)
2. **Block all public access** — serve files via CloudFront or signed URLs
3. Create an **IAM user** with programmatic access and attach this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::job-pilot-assets/*"
    }
  ]
}
```

4. Copy the IAM user's **Access Key ID** and **Secret Access Key** into `.env.local`
5. (Optional) Set up a **CloudFront distribution** pointing to the bucket → fill `AWS_CLOUDFRONT_URL`

---

## Paddle Setup

This project uses **Paddle Sandbox** for development. Switch to Live keys before production.

1. Sign in to [Paddle Sandbox](https://sandbox-vendors.paddle.com)
2. Go to **Developer Tools → Authentication** → copy the **API key** → `PADDLE_API_KEY`
3. Go to **Developer Tools → Client-side token** → copy → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
4. Create products and prices:
   - **Pro Monthly** subscription → copy Price ID → `PADDLE_PRICE_ID_MONTHLY`
   - **Starter Credit Pack** (one-time) → `PADDLE_CREDIT_PACK_STARTER_PRICE_ID`
   - **Job Seeker Credit Pack** (one-time) → `PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID`
   - **Power Credit Pack** (one-time) → `PADDLE_CREDIT_PACK_POWER_PRICE_ID`
5. Go to **Developer Tools → Notifications** → add a webhook endpoint:
   - Local: use [ngrok](https://ngrok.com) → `https://<ngrok-url>/api/webhooks/paddle`
   - Production: `https://<your-vercel-domain>/api/webhooks/paddle`
   - Copy the **secret key** → `PADDLE_WEBHOOK_SECRET`

---

## Vercel Deployment

### 1. Import Project

In [Vercel Dashboard](https://vercel.com) → **Add New Project** → import from GitHub.

### 2. Environment Variables

In Vercel → **Settings → Environment Variables**, add all variables from `.env.local` with these overrides:

| Variable | Production Value |
|---|---|
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>` |
| `NEXTAUTH_SECRET` | Same value as local (or regenerate) |

### 3. Build Environment Variable

Add this under **Settings → Environment Variables** with scope set to **Build** only:

| Variable | Value |
|---|---|
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `true` |

This prevents Puppeteer from bundling Chromium during build. At runtime, Vercel uses `@sparticuz/chromium` instead.

> **Note:** PDF generation requires **Vercel Pro plan** (250 MB function limit). The Hobby plan (50 MB) is too small for the Chromium binary.

### 4. Build Command

Vercel auto-detects Next.js. The build command is already set in `package.json`:

```
prisma generate && next build
```

No changes needed.

### 5. Initialize Database After First Deploy

```bash
npm run db:push
npm run db:seed
```

Run these against your production Supabase instance (update `DATABASE_URL` / `DIRECT_URL` in your local `.env.local` to point to production first, or run from Vercel's integrated terminal).

---

## Admin Account

1. Register using the email set in `ADMIN_EMAIL`
2. Run `npm run db:seed` — this marks that email as `role: ADMIN` in the database
3. Access `/admin/dashboard` to manage users, resumes, cover letters, and usage logs

> Admin can delete any user (cascade deletes all their data) except their own account.

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # All pages (zh/en i18n routing)
│   │   ├── dashboard/     # Resume & cover letter lists
│   │   ├── resume/        # Resume builder & preview
│   │   ├── cover-letter/  # Cover letter generator
│   │   ├── pricing/       # Plan comparison
│   │   ├── settings/      # Billing & credits
│   │   ├── auto-apply/    # 104.com automation
│   │   └── admin/         # Admin dashboard & templates
│   └── api/               # API routes
├── components/            # Shared UI components
├── lib/                   # Server utilities (pdf, s3, ai, prisma, encryption)
├── messages/              # i18n strings (zh.json, en.json)
└── types/                 # TypeScript types
prisma/
└── schema.prisma          # Database schema
```

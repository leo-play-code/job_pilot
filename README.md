# JobPilot

AI-powered resume and cover letter generator. Helps job seekers create professional documents in minutes.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · Supabase (PostgreSQL) · NextAuth.js v5 · OpenAI GPT-4o-mini · Anthropic Claude Vision · AWS S3 · Paddle · Puppeteer

---

## Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project
- An [AWS S3](https://aws.amazon.com/s3/) bucket
- [Google Cloud Console](https://console.cloud.google.com) OAuth credentials
- [OpenAI](https://platform.openai.com) API key
- [Anthropic](https://console.anthropic.com) API key
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

Fill in `.env.local` — see [Environment Variables](#environment-variables) below for each field.

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

### NextAuth

```env
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

- `NEXTAUTH_SECRET` — any long random string; generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` locally; your Vercel URL in production

### Google OAuth

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

See [Google OAuth Setup](#google-oauth-setup) below.

### OpenAI

```env
OPENAI_API_KEY="sk-..."
```

Used for resume content generation and cover letter generation (GPT-4o-mini).

### Anthropic

```env
ANTHROPIC_API_KEY="sk-ant-..."
```

Used for Claude Vision — analyzing template design images uploaded by Admin.

### AWS S3

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET="job-pilot-assets"
# AWS_CLOUDFRONT_URL="https://xxxxx.cloudfront.net"  # optional CDN
```

See [AWS S3 Setup](#aws-s3-setup) below.

### Admin

```env
ADMIN_EMAIL="your-admin@email.com"
```

The account with this email will have admin access to `/admin/dashboard` after seeding.

### Paddle (Sandbox)

```env
PADDLE_API_KEY=""
PADDLE_WEBHOOK_SECRET=""
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=""
PADDLE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Credit Pack Price IDs
PADDLE_CREDIT_PACK_STARTER_PRICE_ID=""
PADDLE_CREDIT_PACK_JOBSEEKER_PRICE_ID=""
PADDLE_CREDIT_PACK_POWER_PRICE_ID=""
```

See [Paddle Setup](#paddle-setup) below.

---

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region, set a strong database password
3. After the project is ready, go to **Settings → Database**
4. Copy the **Transaction pooler** connection string → `DATABASE_URL` (change port to `6543`)
5. Copy the **Session pooler** connection string → `DIRECT_URL` (port `5432`)
6. Enable **Row Level Security (RLS)** is not required — Prisma manages all DB access via the backend
7. For image storage (template thumbnails), go to **Storage → New bucket** → name it `templates`, set to **Public**

### Supabase Storage CORS (for local dev)

In Supabase Dashboard → **Storage → Policies**, allow your localhost origin if you see CORS errors.

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
2. Set **Block Public Access** settings — recommended: block all public access, serve via CloudFront or signed URLs
3. Create an **IAM user** with programmatic access and attach a policy:

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

In Vercel project → **Settings → Environment Variables**, add all variables from `.env.local` with these changes:

| Variable | Production Value |
|---|---|
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>` |
| `NEXTAUTH_SECRET` | Same value as local (or regenerate) |

All other variables (Supabase, Google OAuth, OpenAI, Anthropic, AWS, Paddle) use the same values as local.

### 3. Vercel Build Environment Variables

Add these in Vercel → **Settings → Environment Variables** (scope: **Build** only):

| Variable | Value |
|---|---|
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `true` |

This prevents Puppeteer from downloading its bundled Chromium during build — Vercel uses `@sparticuz/chromium` instead at runtime.

> **Note:** PDF generation requires **Vercel Pro plan** (250MB function limit). Hobby plan (50MB) is too small for the Chromium binary.

### 4. Build Command

Vercel auto-detects Next.js. The build command is already set in `package.json`:

```
prisma generate && next build
```

No changes needed.

### 5. Run Migration After Deploy

After the first successful deploy, run migrations against your production Supabase:

```bash
npm run db:push
npm run db:seed
```

> Make sure your local `.env.local` points to the production Supabase DB when running this, or run directly from Vercel's terminal if available.

---

---

## Admin Account

1. Register an account using the email set in `ADMIN_EMAIL`
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
│   │   ├── settings/      # Billing & account settings
│   │   └── admin/         # Admin dashboard
│   └── api/               # API routes
├── components/            # Shared UI components
├── lib/                   # Server utilities (pdf, s3, ai, prisma)
├── messages/              # i18n strings (zh.json, en.json)
└── types/                 # TypeScript types
prisma/
└── schema.prisma          # Database schema
```

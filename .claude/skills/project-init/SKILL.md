---
name: project-init
description: >
  Project initialization skill. Use this skill whenever: the user wants to start a new project
  from scratch; asks how to set up a new codebase; says "開新專案", "initialize", "scaffold",
  "setup project", "從零開始", "新專案", "create project", "project structure", or wants to
  establish the foundational structure before any feature development begins.
  This skill produces the complete initial project setup: repo structure, dependencies,
  environment config, CI, and a MASTER_SPEC.md that all subsequent Claude sessions will use.
  Always use this skill at the very beginning of a new project.
---

# Project Initialization Skill

You are a senior full-stack architect starting a new project. Your job is to produce everything needed before a single feature is built.

---

## What This Skill Produces

1. **MASTER_SPEC.md** — The single source of truth all Claude sessions will reference
2. **Project scaffold commands** — Exact commands to run
3. **Environment setup** — `.env.example`, config files
4. **Git initialization** — Initial commit structure
5. **CI setup** — GitHub Actions for automated testing

---

## Step 1: Gather Project Requirements

Ask (or extract from conversation):
- Project name and one-line description
- Core features (list the 3-5 main things it does)
- Who are the users? Any roles (admin, user, guest)?
- Any external integrations? (payments, email, storage, third-party APIs)
- Deployment target? (Vercel, Railway, self-hosted)
- Timeline / MVP scope?

---

## Step 2: Generate MASTER_SPEC.md

This file lives in the project root. Every Claude session must read it first.

```markdown
# MASTER_SPEC.md

## Project Overview
**Name**: [Project Name]
**Description**: [One paragraph — what it does and who it's for]
**Status**: In Development — MVP Phase 1

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Route Handlers, Zod validation |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v5 |
| Storage | [Cloudflare R2 / AWS S3 / local] |
| Deployment | [Vercel / Railway] |
| Testing | Vitest, Testing Library |

---

## User Roles
- **[Role 1]**: [what they can do]
- **[Role 2]**: [what they can do]

---

## Core Features (MVP Scope)
1. [Feature 1] — [brief description]
2. [Feature 2] — [brief description]
3. [Feature 3] — [brief description]

**Out of scope for MVP**: [list things explicitly excluded]

---

## Data Models (High Level)
[List main entities and key relationships]
- User has many Posts
- Post belongs to User, has many Tags
- etc.

---

## API Conventions
- Base path: `/api/`
- Auth: session-based (NextAuth)
- Response format: `{ data: T }` or `{ error: { code, message } }`
- Pagination: `?page=N` (pageSize: 20)
- Dates: ISO 8601 strings

---

## Environment Variables
[List all required env vars and what they're for]
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — NextAuth signing secret
- `NEXTAUTH_URL` — App base URL

---

## Project Structure
[Paste the folder structure]

---

## Definition of Done
A feature is complete when:
- [ ] Unit tests written and passing
- [ ] TypeScript has no errors
- [ ] Lint passes
- [ ] Mobile responsive
- [ ] Error states handled
- [ ] Committed with conventional commit message
```

---

## Step 3: Scaffold Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest [project-name] \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd [project-name]

# 2. Install core dependencies
npm install prisma @prisma/client
npm install next-auth@beta @auth/prisma-adapter
npm install zod react-hook-form @hookform/resolvers
npm install @tanstack/react-query
npm install zustand
npm install lucide-react

# 3. Install shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input card dialog table form toast

# 4. Install dev dependencies
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
npm install -D husky lint-staged

# 5. Initialize Prisma
npx prisma init

# 6. Initialize Git
git init
git add .
git commit -m "chore: initialize project with Next.js, Prisma, NextAuth"

# 7. Create develop branch
git checkout -b develop
```

---

## Step 4: Essential Config Files

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

### src/test/setup.ts
```typescript
import '@testing-library/jest-dom'
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "pre-commit": "npm run lint && npm run type-check && npm run test:run"
  }
}
```

### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:run
```

---

## Step 5: Handoff Message to All Future Sessions

At the end of every project-init, produce this message for the user to paste into new sessions:

```
## Context for This Session

Read MASTER_SPEC.md first before doing anything.

Current branch: [branch name]
Current task: [describe the task]
Relevant files: [list files this session will touch]

Skills to apply:
- [database-dev / backend-dev / frontend-dev / feature-spec]
```

---
name: git-workflow
description: >
  Git workflow skill for managing commits, branches, pull requests, and releases in a team
  or solo project. Use this skill whenever: the user wants to commit or push code; asks about
  branching strategy; wants to create a PR; needs to tag a release; asks "怎麼commit", "怎麼push",
  "upload to git", "上傳到github", "branch", "merge", "release", "版本", or any git-related action.
  Produces ready-to-run git commands and enforces conventional commits format.
  Always use this skill before generating any git commands.
---

# Git Workflow Skill

You are a senior DevOps engineer. Produce exact git commands the user can run, and enforce clean commit history.

---

## Branch Strategy (Git Flow Simplified)

```
main          ← production, always deployable
└── develop   ← integration branch, all features merge here
    ├── feature/[name]   ← new features
    ├── fix/[name]       ← bug fixes
    ├── chore/[name]     ← setup, deps, config
    └── release/[version] ← release prep (bump version, changelog)
```

Rules:
- **Never commit directly to `main`**
- Feature branches off `develop`, merge back to `develop`
- Only `develop` merges into `main` (via PR) for releases
- Hotfixes branch off `main`, merge to both `main` AND `develop`

---

## Conventional Commits Format

```
<type>(<scope>): <繁體中文簡短描述>

[選填：繁體中文說明，條列主要變更]

[選填：footer]
```

規則：
- **type 和 scope 用英文**（見下方列表）
- **描述、body 全部用繁體中文**
- Windows 環境需確保 git 已設定 UTF-8 編碼（見下方「編碼設定」）

Types:
- `feat`: new feature
- `fix`: bug fix
- `chore`: setup, deps, tooling (no production code change)
- `docs`: documentation only
- `refactor`: code change that neither fixes a bug nor adds feature
- `test`: adding or fixing tests
- `style`: formatting only (no logic change)
- `perf`: performance improvement

Examples:
```
feat(auth): 新增 Google OAuth 登入功能
fix(dashboard): 修正載入時 session.user.role 為 undefined 的錯誤
chore: 設定 Prisma 與 PostgreSQL 連線
test(api/users): 為 GET /api/users 新增單元測試
refactor(jobs): 將職缺列表邏輯拆分為獨立 hook
```

---

## 編碼設定（Windows 防亂碼）

首次使用前執行一次：
```bash
git config --global core.quotepath false
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
```

---

## Standard Workflows

### Starting a New Feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/[feature-name]
# e.g. git checkout -b feature/user-avatar-upload
```

### Committing Work

```bash
# Stage specific files (preferred over git add .)
git add src/app/api/users/route.ts src/lib/validations/user.ts

# Or stage all changed files
git add .

# Commit with conventional format
git commit -m "feat(users): add avatar upload endpoint"

# If more detail needed
git commit -m "feat(users): add avatar upload endpoint

- Validates file type (jpg/png only) and size (max 5MB)
- Uploads to Cloudflare R2
- Updates user.avatarUrl in DB"
```

### Pushing and Creating PR

```bash
git push origin feature/user-avatar-upload

# Then on GitHub/GitLab: open PR from feature/... → develop
# PR title should match commit convention: "feat(users): add avatar upload endpoint"
```

### Merging Develop → Main (Release)

```bash
git checkout main
git pull origin main
git merge --no-ff develop -m "release: v1.2.0"
git tag -a v1.2.0 -m "Release v1.2.0 — avatar upload, dashboard fixes"
git push origin main --tags
```

### Hotfix on Production

```bash
git checkout main
git checkout -b fix/critical-auth-bypass
# fix the bug
git add .
git commit -m "fix(auth): prevent session bypass on expired token"
git checkout main
git merge --no-ff fix/critical-auth-bypass
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main --tags

# Also merge hotfix into develop
git checkout develop
git merge fix/critical-auth-bypass
git push origin develop
```

---

## .gitignore (Next.js + Prisma)

```gitignore
# Dependencies
node_modules/

# Next.js
.next/
out/

# Environment
.env
.env.local
.env.production

# Prisma
prisma/*.db
prisma/*.db-journal

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

---

## Commit Checklist (Before Every Commit)

- [ ] Tests pass: `npm test`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No lint errors: `npm run lint`
- [ ] `.env` is NOT staged (check `git status`)
- [ ] Commit message follows conventional format

---

## Automated Check Setup

Add to `package.json`:
```json
{
  "scripts": {
    "pre-commit": "npm run lint && npm run type-check && npm test -- --run"
  }
}
```

Or use `husky` for automatic pre-commit hooks:
```bash
npm install -D husky lint-staged
npx husky init
echo "npm run pre-commit" > .husky/pre-commit
```

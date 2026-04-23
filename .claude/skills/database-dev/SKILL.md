---
name: database-dev
description: >
  Professional database design and development skill. Use this skill whenever the user asks to:
  design or review database schema; write Prisma schema or migrations; design tables, relations,
  indexes; work with PostgreSQL, MySQL, SQLite; handle seed data; optimize queries; or receives
  a "DB task" handed off from a backend or frontend developer. Also triggers for keywords like
  "資料庫", "schema", "migration", "table design", "relation", "index", "seed", "foreign key",
  "ERD". Always read this skill before touching any database-related files.
---

# Database Development Skill

You are a senior database architect. Read this entire document before writing any schema or migration.

---

## Tech Stack (Default)

| Layer | Choice |
|---|---|
| ORM | **Prisma** |
| Database | **PostgreSQL** (production) / SQLite (local dev) |
| Migration | Prisma Migrate |
| Seed | Prisma seed script (TypeScript) |

---

## Schema Design Principles

### 1. Naming Conventions

```prisma
// Models: PascalCase singular
model UserProfile { ... }

// Fields: camelCase
firstName   String
createdAt   DateTime

// Tables map to: snake_case plural (set via @@map)
model UserProfile {
  @@map("user_profiles")
}
```

### 2. Every Model Must Have

```prisma
model Example {
  id        String   @id @default(cuid())   // cuid() preferred over uuid() for readability
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ... your fields
}
```

### 3. Relations

```prisma
// One-to-Many
model User {
  id    String  @id @default(cuid())
  posts Post[]
}

model Post {
  id       String @id @default(cuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

// Many-to-Many (explicit join table for extra fields)
model PostTag {
  postId    String
  tagId     String
  post      Post   @relation(fields: [postId], references: [id])
  tag       Tag    @relation(fields: [tagId], references: [id])
  createdAt DateTime @default(now())

  @@id([postId, tagId])
  @@map("post_tags")
}
```

### 4. Indexes

Add indexes for any field that will be:
- Filtered in WHERE clauses
- Sorted in ORDER BY
- Used in JOIN conditions

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique            // auto-indexed
  role  Role   @default(USER)

  @@index([role])                 // manual index for filter queries
  @@index([createdAt])            // for date-range queries
}
```

### 5. Soft Delete Pattern

```prisma
model Post {
  id        String    @id @default(cuid())
  deletedAt DateTime?             // null = active, timestamp = deleted

  @@index([deletedAt])
}
```

### 6. Enums

```prisma
enum Role {
  USER
  ADMIN
  MODERATOR
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

---

## Migration Workflow

```bash
# 1. Edit schema.prisma
# 2. Create migration
npx prisma migrate dev --name describe_what_changed

# 3. Review generated SQL in prisma/migrations/
# 4. Apply in production
npx prisma migrate deploy

# Reset (dev only — destroys data)
npx prisma migrate reset
```

**Never** manually edit migration files after they've been committed.

---

## Seed Script Pattern

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Upsert so seed is idempotent (safe to run multiple times)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  console.log('Seeded:', { admin })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## DB Task Output Format

When completing a database task, always output:

1. **Updated `schema.prisma`** — full file, not just diff
2. **Migration name** — descriptive snake_case (e.g., `add_user_profile_table`)
3. **Seed data** — if new tables are added
4. **Handoff note for backend** — list of new/changed models and their fields

### Handoff Note Template

```markdown
## DB Handoff → Backend

### New/Changed Models
- `UserProfile` — added fields: bio, avatarUrl, websiteUrl
- `Post` — added field: viewCount (Int, default 0)

### New Relations
- User 1→Many UserProfile (onDelete: Cascade)

### New Indexes
- Post.authorId (for author's posts query)
- Post.publishedAt (for date sorting)

### Breaking Changes
- None / [describe if any column renamed or removed]
```

---

## Reference Files

- `references/query-patterns.md` — Common Prisma query patterns
- `references/performance.md` — Index strategy and N+1 prevention

## 開始前必讀

✅ 讀 `specs/data-models.md`
❌ 不讀 MASTER_SPEC.md（除非需要新增 Entity）

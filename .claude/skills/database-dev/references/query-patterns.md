# Common Prisma Query Patterns

## Basic CRUD

```typescript
// Create
const user = await prisma.user.create({
  data: { email: 'user@example.com', name: 'Alice' },
})

// Read one
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: true },
})

// Read many with filter + pagination
const posts = await prisma.post.findMany({
  where: {
    authorId: userId,
    deletedAt: null,          // soft delete filter
    publishedAt: { not: null },
  },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
  select: {                   // select only needed fields
    id: true,
    title: true,
    createdAt: true,
    author: { select: { name: true } },
  },
})

// Update
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: 'New Name' },
})

// Soft delete
const deleted = await prisma.post.update({
  where: { id: postId },
  data: { deletedAt: new Date() },
})

// Hard delete
await prisma.user.delete({ where: { id: userId } })
```

## Transactions

```typescript
// Use transactions for operations that must succeed or fail together
const result = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData })
  await tx.inventory.update({
    where: { productId: orderData.productId },
    data: { quantity: { decrement: orderData.quantity } },
  })
  return order
})
```

## Aggregations

```typescript
const stats = await prisma.order.aggregate({
  _sum: { total: true },
  _count: { id: true },
  _avg: { total: true },
  where: { status: 'DELIVERED' },
})
```

## Prevent N+1 Queries

```typescript
// ❌ N+1 — runs 1 query for posts + N queries for each author
const posts = await prisma.post.findMany()
for (const post of posts) {
  const author = await prisma.user.findUnique({ where: { id: post.authorId } })
}

// ✅ Single query with include
const posts = await prisma.post.findMany({
  include: { author: true },
})
```

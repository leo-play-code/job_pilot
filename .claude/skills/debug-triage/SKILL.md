---
name: debug-triage
description: >
  Bug triage and diagnosis skill. Use this skill whenever: something is broken or not working;
  there's an error message or unexpected behavior; a test is failing; the user says "壞掉了",
  "有bug", "error", "出錯", "不work", "跑不起來", "失敗", "怎麼辦", or pastes an error log /
  stack trace. This skill diagnoses the root cause, classifies it by layer (DB / backend /
  frontend), and produces a ready-to-hand-off fix task for the correct specialist Claude session.
  Always use this skill before attempting any fix — triage first, fix second.
---

# Debug Triage Skill

You are a senior debugging specialist. Your job is NOT to fix code directly — it is to diagnose the problem, identify which layer owns it, and produce a precise fix task that can be handed to the correct specialist session.

---

## Step 1: Collect the Evidence

If not already provided, ask for:
- The exact error message or stack trace
- Which action triggered the error (what did the user click / what API was called)
- What the expected behavior was vs what actually happened
- Recent changes (what was done just before it broke)

If all of this is present, proceed to Step 2.

---

## Step 2: Classify the Bug Layer

Use this decision tree:

```
Error is in browser console (TypeError, undefined, cannot read property...)
  → FRONTEND bug

Error is in terminal / server logs (500, unhandled rejection, Prisma error...)
  → BACKEND bug

Error mentions: "relation does not exist", "column not found", "foreign key violation",
  "unique constraint", migration failed...
  → DATABASE bug

Error mentions: auth, 401, 403, session, token expired...
  → BACKEND (Auth) bug

Test is failing (unit test, integration test)...
  → identify which layer the test covers → assign to that layer
  
Multiple layers involved (e.g. frontend gets 500 from backend which has a DB error)...
  → start from DATABASE upward
```

---

## Step 3: Root Cause Analysis

For each error type, look for:

### Frontend Errors
- `Cannot read properties of undefined` → data not loaded yet, missing null check
- `useEffect` infinite loop → missing or wrong dependency array
- Hydration error → server/client mismatch, usually date formatting or random values
- Type error → TypeScript mismatch, API response shape changed
- 401 in fetch → auth token not being sent, session expired

### Backend Errors
- `500 Internal Server Error` → unhandled exception, check server logs for actual error
- `400 / 422` → validation schema mismatch between frontend request and backend Zod schema
- `404` → route path mismatch, check URL and HTTP method
- `401 / 403` → auth middleware blocking, check session / role check
- Prisma `RecordNotFound` → `findUnique` returned null, not handled
- Prisma `UniqueConstraintViolation` → duplicate data, needs conflict handling

### Database Errors
- `relation does not exist` → migration not run, or wrong DB connected
- `column does not exist` → schema updated but migration not applied
- `foreign key constraint` → trying to delete parent record with children (need cascade or soft delete)
- `null value in column violates not-null constraint` → new required field, seed or migration needed

---

## Step 4: Produce the Fix Task

Output in this exact format, then **immediately proceed to Step 5**:

---

### 🐛 Bug Report

**Symptom**: [What the user sees]
**Layer**: [FRONTEND / BACKEND / DATABASE / BACKEND-AUTH]
**Root Cause**: [Your diagnosis in 1-2 sentences]
**Confidence**: [High / Medium / Low — and why if not High]

---

### 🔧 Fix Task → [Layer] Session

**File(s) to change**: `path/to/file.ts`

**What to change**:
[Precise description — enough for a Claude session to fix without asking questions]

Example:
- In `app/api/users/[id]/route.ts`, the `findUnique` call is not handling the `null` case. Add a null check after the query: if user is null, return `errorResponse('NOT_FOUND', 'User not found', 404)`.

**Test to verify fix**:
[Describe what to do to confirm it's fixed — click X, run `npm test`, check Y]

---

**If multiple layers are involved**, produce one Fix Task block per layer, ordered from DB → Backend → Frontend.

---

## Step 5: Execute the Fix — DO NOT STOP AT THE REPORT

After producing the Fix Task report, you MUST actually fix the code yourself. Do not just report and wait.

**Execution rules:**
- If the bug is FRONTEND → read `.claude/skills/frontend-dev/SKILL.md` and fix the file(s) listed in the Fix Task
- If the bug is BACKEND → read `.claude/skills/backend-dev/SKILL.md` and fix the file(s) listed
- If the bug is DATABASE → read `.claude/skills/database-dev/SKILL.md` and fix the migration/schema
- If multiple layers → fix DB first, then Backend, then Frontend — in sequence

After applying the fix:
1. Run `npm run type-check` and fix any TypeScript errors introduced
2. Run the relevant tests
3. Confirm the fix resolves the original symptom

**You are NOT done until the code is actually changed.** The Fix Task report is a planning step, not the final output.

---

## Step 6: After Fix — Regression Check

After the fix is applied, remind the relevant session to:
- Run the existing unit tests for the changed file
- Add a new test case that covers the bug scenario (so it never regresses)
- Commit with message format: `fix: [short description of what was broken]`

---

## Example Triage

**User says**: "登入之後點 Dashboard 就白屏，console 說 `Cannot read properties of undefined (reading 'role')`"

**Output**:

### 🐛 Bug Report
**Symptom**: White screen on Dashboard after login, frontend crash
**Layer**: FRONTEND
**Root Cause**: The Dashboard component accesses `session.user.role` before the session is loaded. The `role` field is undefined during the loading state.
**Confidence**: High

### 🔧 Fix Task → Frontend Session

**File to change**: `app/dashboard/page.tsx`

**What to change**:
The component renders before `session` is available. Add a loading guard at the top of the component:
```tsx
if (status === 'loading') return <DashboardSkeleton />
if (!session?.user?.role) return null
```
Also add optional chaining everywhere `session.user.role` is accessed.

**Test to verify**: Log in, navigate to /dashboard — should load without crash. Check with slow network (DevTools → Network → Slow 3G) to confirm loading state shows correctly.

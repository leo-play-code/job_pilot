---
name: feature-spec
description: >
  Feature specification skill for breaking down new features into database, backend, and frontend
  tasks. Use this skill whenever: a user describes a new feature they want to add; the frontend
  needs new data that doesn't exist yet; a UI requirement implies backend or database changes;
  or the user asks "what do I need to build for X?". Also triggers when the user says things like
  "我想加一個功能", "新增功能", "這個功能需要什麼", "反推需求", "幫我拆分任務", "what do I need
  for this feature", or describes any user-facing feature without a clear backend spec yet.
  Output is a structured task list ready to hand off to database-dev, backend-dev, and frontend-dev.
---

# Feature Specification Skill

You are a senior full-stack architect. When a user describes a feature, your job is to decompose it into concrete, handoff-ready tasks for each layer.

---

## Step 1: Understand the Feature

Ask clarifying questions if any of these are unclear:
- What does the user see / do? (UI flow)
- Who can access this? (auth / role requirements)
- What data is created, read, updated, or deleted?
- Any edge cases or error states to handle?

If the user gives enough context, skip to Step 2 directly.

---

## Step 2: Produce the Feature Spec

Output a structured spec in this exact format:

---

### Feature: [Feature Name]

**User Story**
As a [role], I want to [action] so that [benefit].

**UI Flow**
1. User goes to [page]
2. User does [action]
3. System shows [result]
4. [Error case]: System shows [error message]

---

#### 🗄️ Database Tasks (→ hand to database-dev)

List every schema change needed:

```
New Tables:
- [TableName]: [field: type, field: type, ...]
  Relations: [TableName] belongs to [OtherTable] via [foreignKey]

Modified Tables:
- [TableName]: add field [fieldName: type]

New Indexes:
- [TableName].[fieldName] (reason: [why this query needs it])

Migration name: add_[descriptive_name]
```

---

#### ⚙️ Backend Tasks (→ hand to backend-dev)

List every API endpoint needed:

```
New Endpoints:
- [METHOD] /api/[path]
  Auth: [required / public / role: ADMIN]
  Request body: { field: type, ... }
  Response: { field: type, ... }
  Business logic: [bullet list of what it does]

Modified Endpoints:
- [METHOD] /api/[path]: add [field] to response
```

---

#### 🖥️ Frontend Tasks (→ hand to frontend-dev)

List every UI piece needed:

```
New Pages/Components:
- [ComponentName] at [route or location]
  Shows: [what data is displayed]
  Actions: [buttons/forms the user interacts with]
  API calls: [which endpoints it uses]
  States: loading / error / empty / success

Modified Components:
- [ComponentName]: add [UI element]
```

---

#### ✅ Acceptance Criteria

Checklist of things that must be true for the feature to be "done":
- [ ] [Specific, testable criterion]
- [ ] [Another criterion]
- [ ] Error states handled (network failure, validation failure)
- [ ] Mobile responsive
- [ ] Authenticated routes protected

---

#### 🔁 Implementation Order

1. Database: create migration and schema
2. Backend: implement endpoints (depends on DB)
3. Frontend: implement UI (depends on API endpoints)
4. Integration test: [describe what to test end-to-end]

---

## Example Output

### Feature: User Avatar Upload

**User Story**
As a user, I want to upload a profile photo so that other users can recognize me.

**UI Flow**
1. User goes to /settings/profile
2. User clicks "Change Avatar" → file picker opens
3. User selects an image (jpg/png, max 5MB)
4. System uploads and shows preview
5. Error: file too large → "Image must be under 5MB"

---

#### 🗄️ Database Tasks

```
Modified Tables:
- User: add field avatarUrl (String?, nullable)

Migration name: add_avatar_url_to_user
```

---

#### ⚙️ Backend Tasks

```
New Endpoints:
- POST /api/users/avatar
  Auth: required
  Request: multipart/form-data with file field
  Response: { data: { avatarUrl: string } }
  Business logic:
  - Validate file type (jpg/png only)
  - Validate file size (max 5MB)
  - Upload to storage (S3 / Cloudflare R2)
  - Update user.avatarUrl in DB
  - Return new avatarUrl
```

---

#### 🖥️ Frontend Tasks

```
Modified Components:
- ProfileForm at /settings/profile
  Add: AvatarUpload component
  Shows: current avatar or placeholder
  Actions: click to open file picker, preview before confirm
  API calls: POST /api/users/avatar
  States:
    - idle: shows current avatar + "Change" button
    - uploading: spinner overlay
    - error: toast "Upload failed"
    - success: shows new avatar
```

---

#### ✅ Acceptance Criteria

- [ ] Only jpg/png accepted (other types show error)
- [ ] Files over 5MB rejected with clear message
- [ ] New avatar appears immediately after upload
- [ ] Avatar persists across page refresh
- [ ] Works on mobile (touch to open file picker)

---

#### 🔁 Implementation Order

1. DB: add `avatarUrl` to User → run migration
2. Backend: implement POST /api/users/avatar with file validation + storage
3. Frontend: add AvatarUpload component to ProfileForm
4. Test: upload jpg, upload png, try oversized file, try wrong type

---

## Output Rules

- Always produce all four sections (DB / Backend / Frontend / Acceptance)
- Be specific — "add a button" is not enough; say what it does and what API it calls
- If a layer has no changes, write "No changes needed" rather than omitting the section
- Mark which tasks can be done in parallel vs which depend on prior steps
- Keep it short enough that a developer can start immediately without asking questions

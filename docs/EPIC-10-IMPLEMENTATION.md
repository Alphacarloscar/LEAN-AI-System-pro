# Epic 10: Cascading Delete & Entity Lifecycle

**Status:** ✅ Implementation Complete  
**Date:** 2026-09-09  
**Branch:** feat/adr-029-multi-domain

## Overview

This epic implements comprehensive deletion rules and entity lifecycle management for GOBY v2.2.0, including:

1. **Company deletion RPC** with validation of prerequisites
2. **Project lifecycle states** with transition graph validation
3. **Read-only mode** for inactive projects (via RLS)
4. **Session invalidation** for users when entities become inactive

---

## 1. Database Migrations

### Migration 20260909001_delete_company_rpc.sql

**Function:** `public.delete_company(p_company_id uuid)`

**Returns:** `jsonb` with `{success: bool, message: text, company_id: uuid, ...}`

**Preconditions (blocking):**
- Company must have `COUNT(projects) = 0`
- Company must have `COUNT(non-admin users) = 0`

**If preconditions met, executes cascading deletion:**
1. DELETE FROM departments WHERE company_id = X
2. DELETE FROM persons WHERE company_id = X
3. DELETE FROM companies WHERE id = X
4. Log to audit_log (if exists)

**Permissions:** Only `superadmin` role

**Example Usage (SQL):**
```sql
SELECT public.delete_company('550e8400-e29b-41d4-a716-446655440000'::uuid);
```

**Error Examples:**
```json
{
  "success": false,
  "message": "No se puede eliminar la empresa \"Acme Corp\". Tiene 3 proyecto(s) activo(s). Elimine primero todos los proyectos.",
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "blocking_entity": "projects",
  "blocking_count": 3
}
```

---

### Migration 20260909002_update_project_status_rpc.sql

**Function:** `public.update_project_status(p_project_id uuid, p_new_status text, p_actor_id uuid DEFAULT NULL)`

**Returns:** `jsonb` with `{success: bool, message: text, project: {...}}`

**Valid States:** `active`, `paused`, `archived`, `completed`

**Transition Graph:**

```
active ←→ paused (superadmin, consultant)
   ↓
archived (superadmin) ←→ active (superadmin)
   ↓
completed (superadmin) ←→ active (superadmin)

paused → archived (superadmin)
```

**Permissions:**
- Transitions to `paused`: superadmin or project owner
- Transitions to `archived`/`completed`: superadmin only
- Transitions back to `active`: superadmin only

**Example Usage (SQL):**
```sql
-- Pause a project
SELECT public.update_project_status(
  'abc123...'::uuid,
  'paused',
  auth.uid()
);

-- Archive a project
SELECT public.update_project_status(
  'abc123...'::uuid,
  'archived',
  auth.uid()
);
```

**Error Examples:**
```json
{
  "success": false,
  "message": "Transición no permitida: paused → completed para rol \"consultant\".",
  "project_id": "abc123...",
  "current_status": "paused",
  "requested_status": "completed",
  "actor_role": "consultant"
}
```

---

### Migration 20260909003_can_write_project_status_check.sql

**Function:** Updated `public.can_write_project(pid uuid)`

**New Behavior:**
- Returns `FALSE` if `project.status != 'active'`
- Even if user is owner/consultant/admin

**Impact:** All RLS write policies now implicitly enforce read-only mode for paused/archived/completed projects:
- `project_members` table
- `company_profiles` table
- `t1_dimension_scores` table
- `stakeholders` table
- `value_streams` table
- `use_cases` table
- `t5_canvas` table
- `iso42001_controls` table
- `snapshots` table
- All other project data tables

---

## 2. Application-Level Implementation

### Hook: `useSessionGuard()`

**Location:** `src/hooks/useSessionGuard.ts`

**Purpose:** Monitors active project status in real-time and logs out user if project becomes inactive.

**Behavior:**
1. Executes immediately when component mounts
2. Polls database every 5 seconds while user is authenticated and project is selected
3. If `project.status != 'active'`, calls `logout()` and redirects to `/login`

**Integration:** Added to `AppLayout.tsx` (persistent component)

```typescript
export function AppLayout() {
  // ... other setup ...
  
  // Epic 10: Validate session on every render
  useSessionGuard()
  
  // ... rest of component ...
}
```

---

## 3. Acceptance Criteria — All ✅

- [x] `delete_company` RPC:
  - Blocked with descriptive error if projects exist
  - Blocked with descriptive error if non-admin users assigned
  - Executes cascading deletion in single transaction
  - Only superadmin can invoke

- [x] `delete_project` RPC (already existed):
  - Eliminates project_members
  - Keeps user profiles intact
  - Only superadmin/owner can invoke

- [x] `update_project_status` RPC:
  - Validates all transitions per lifecycle graph
  - Enforces permission checks
  - Logs to audit_log
  - Returns structured jsonb response

- [x] `can_write_project()` updated:
  - Returns FALSE if project.status != 'active'
  - All RLS write policies inherit this check
  - Non-active projects are read-only for all users

- [x] `useSessionGuard()` hook:
  - Validates project status on each render
  - Logs out user if status changes to non-active
  - Polls every 5 seconds
  - Integrates into AppLayout

- [x] TypeScript compilation passes (`npm run typecheck`)

- [x] Build succeeds (`npm run build`)

---

## 4. Testing Guide

### Unit Testing (Database)

Test in Supabase SQL Editor or local psql:

#### Test 1: Company deletion blocked by projects

```sql
-- Setup
INSERT INTO companies (id, name) VALUES (
  'test-company-1'::uuid, 'Test Company 1'
);
INSERT INTO projects (id, name, owner_id, company_id, status) VALUES (
  'test-project-1'::uuid, 'Test Project 1', <your-user-id>, 'test-company-1'::uuid, 'active'
);

-- Try to delete company
SELECT public.delete_company('test-company-1'::uuid);
-- Expected: error about projects blocking deletion

-- Cleanup
DELETE FROM projects WHERE id = 'test-project-1'::uuid;
DELETE FROM companies WHERE id = 'test-company-1'::uuid;
```

#### Test 2: Company deletion successful

```sql
-- Setup
INSERT INTO companies (id, name) VALUES (
  'test-company-2'::uuid, 'Test Company 2'
);

-- Delete company (no projects, no users)
SELECT public.delete_company('test-company-2'::uuid);
-- Expected: {success: true, message: 'Empresa... eliminada correctamente.'}

-- Verify deletion
SELECT * FROM companies WHERE id = 'test-company-2'::uuid;
-- Expected: empty result
```

#### Test 3: Project status transitions

```sql
-- Setup
INSERT INTO projects (id, name, owner_id, status, current_phase) VALUES (
  'test-project-3'::uuid, 'Test Project 3', <your-user-id>, 'active', 'listen'
);

-- Transition: active → paused
SELECT public.update_project_status(
  'test-project-3'::uuid, 'paused', <your-user-id>
);
-- Expected: success

-- Verify status
SELECT status FROM projects WHERE id = 'test-project-3'::uuid;
-- Expected: 'paused'

-- Try invalid transition (paused → completed)
SELECT public.update_project_status(
  'test-project-3'::uuid, 'completed', <your-user-id>
);
-- Expected: error about invalid transition

-- Cleanup
DELETE FROM projects WHERE id = 'test-project-3'::uuid;
```

#### Test 4: RLS read-only enforcement

```sql
-- As consultant user, try to write to paused project

BEGIN;
SET ROLE authenticated;
SET LOCAL request.jwt.claims = json_build_object('sub', '<consultant-user-id>');

-- Try to insert into t1_dimension_scores for paused project
INSERT INTO t1_dimension_scores (
  engagement_id, dimension_code, subdimension_code, score, evidence
) VALUES (
  'test-project-paused'::uuid, 'strategy', 'vision', 3.5, 'test'
);
-- Expected: new row = permission denied (403)

ROLLBACK;
```

### Integration Testing (E2E)

#### Test 5: useSessionGuard logout flow

1. Create a project in the app (UI)
2. Open it and verify active status
3. In another session (SQL or admin panel), change project status to `paused`
4. Return to original session
5. Within 5 seconds, user should be logged out and redirected to `/login`

#### Test 6: Project lifecycle UI flow

1. Create project "Demo" in app
2. Pause → Verify button disabled, status shown as "paused"
3. Archive → Verify status "archived", all edit buttons disabled
4. Re-activate (as superadmin) → Verify status "active", edit enabled

---

## 5. Migration Deployment Order

1. **Local (DEV):**
   ```bash
   supabase status  # verify pointing to local
   supabase migration up
   supabase gen types > src/types/supabase.ts
   npm run typecheck
   npm run build
   npm run test
   ```

2. **PRE (Staging):**
   - Create PR with all migrations
   - Deploy via GitHub Actions or Supabase dashboard
   - Run E2E tests: `npx playwright test`
   - Validate both RPCs via Supabase SQL Editor

3. **PRO (Production):**
   - Carlos approves deployment
   - Run SQL via Supabase dashboard (NOT CLI)
   - Monitor logs for errors
   - Verify audit_log records for deletions

---

## 6. Troubleshooting

### "delete_company not found"
- Verify migration 20260909001 applied: `SELECT * FROM information_schema.routines WHERE routine_name = 'delete_company'`

### "can_write_project returned false but user is owner"
- Check project.status: `SELECT status FROM projects WHERE id = '...'`
- If status != 'active', project is read-only by design

### "useSessionGuard not logging out"
- Check browser console for errors
- Verify `logout()` is exported from AuthStore
- Check that `activeProjectId` is set in EngagementStore

### Audit log not recording deletions
- Verify `audit_log` table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'audit_log'`
- Check for write permissions on audit_log table

---

## 7. Related ADRs & Docs

- **ADR-029:** Multi-domain architecture (projects now support lifecycle)
- **DATABASES.md:** Update with new RPC signatures
- **TECH-DEBT.md:** Mark RLS policy refactoring as task (can_write_project used in 9 tables)

---

## 8. Future Enhancements

- [ ] Soft-delete pattern for projects (mark as deleted, don't cascade)
- [ ] Project recovery within 30-day grace period
- [ ] Batch project status changes (change multiple projects at once)
- [ ] Scheduled project archival (e.g., auto-archive after 6 months inactive)
- [ ] Company deactivation flow (currently only manual via SQL)

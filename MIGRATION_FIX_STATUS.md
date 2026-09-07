# Migration Fix Status — create_project RPC Ambiguity

**Date:** 2026-09-05  
**Status:** ⚠️ PARTIAL (Needs manual completion)

---

## Summary

The database consolidation audit identified a critical RPC ambiguity issue: multiple versions of `create_project()` coexisting in the database, causing PostgreSQL to fail when trying to determine which overload to use.

**Root cause:** Three migrations created different versions of `create_project()` with different parameter sets:
1. Migration 20260602: `create_project(uuid, text, text)`
2. Migration 20260825001: `create_project(uuid, text, uuid, text)` 
3. Migration 20260827004: `create_project(uuid, text, uuid, text, text, text, text, text, text)` ← Latest (correct)

PostgreSQL `CREATE OR REPLACE FUNCTION` only replaces if parameter lists are **identical**. Since these differ, all 3 now coexist → **ambiguity error**.

---

## What Was Done

✅ **Created cleanup migration:** `supabase/migrations/20260905_cleanup_create_project_duplicates.sql`
- Drops the two old overloads (v1 and v2)
- Keeps only the latest version (v3) with all extended fields

✅ **Fixed migration naming conflicts:**
- Renamed conflicting 20260903_* migrations to have unique _1, _2, _3, _5 suffixes
- Resolved schema_migrations version collision issue

✅ **Fixed encoding issue:**
- Corrected `20260903_5_app_labels_overrides.sql` malformed SQL

---

## What Needs to Be Done (Manual Steps)

### Option 1: Fresh Dev Environment (Recommended)
```bash
cd /path/to/LEAN-AI-System-pro

# Stop Supabase
supabase stop

# Remove old Docker volume
docker volume rm LEAN-AI-System-pro_supabase_data_postgres

# Start fresh
supabase start

# This will apply migrations cleanly from scratch
supabase db reset
```

### Option 2: Direct Database Cleanup (If DB Already Running)
Log into Supabase Studio (http://127.0.0.1:54323) and run this SQL directly:

```sql
-- Verify current state
SELECT proname, pg_get_function_identity_arguments(oid) as signature
FROM pg_proc
WHERE proname = 'create_project' AND pronamespace = 'public'::regnamespace
ORDER BY proname, pg_get_function_identity_arguments(oid);

-- Drop old overloads
DROP FUNCTION IF EXISTS public.create_project(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_project(uuid, text, uuid, text) CASCADE;

-- Verify final state (should be 1 row with 9 parameters)
SELECT proname, pg_get_function_identity_arguments(oid) as signature
FROM pg_proc
WHERE proname = 'create_project' AND pronamespace = 'public'::regnamespace;
```

### Option 3: Apply Migration Manually
```bash
cd /path/to/LEAN-AI-System-pro

# With Supabase running:
supabase migration up

# (Or copy-paste contents of supabase/migrations/20260905_cleanup_create_project_duplicates.sql
#  into Supabase SQL Editor and execute)
```

---

## Verification

After applying the cleanup, verify with this query:

```sql
-- Should return exactly 1 row with 9 parameters
SELECT COUNT(*) as function_count, 
       pg_get_function_identity_arguments(oid) as signature
FROM pg_proc
WHERE proname = 'create_project' AND pronamespace = 'public'::regnamespace
GROUP BY pg_get_function_identity_arguments(oid);

-- Expected result:
-- function_count | signature
-- ---|---
-- 1 | p_company_id uuid, p_name text, p_domain_id uuid, p_phase text, p_objetivo_principal text, p_restricciones text, p_horizonte_valor text, p_ecosistema_tecnologico text, p_fricciones_oportunidades text
```

Then test the RPC call:
```bash
npm run typecheck
npm run test
npx playwright test
```

---

## Migration Renames Completed

| Original Name | New Name | Reason |
|---|---|---|
| 20260903_add_text_columns.sql | 20260903_1_add_text_columns.sql | Resolved version collision |
| 20260903_fill_application_texts_defaults.sql | 20260903_2_fill_application_texts_defaults.sql | Resolved version collision |
| 20260903_rls_application_texts.sql | 20260903_3_rls_application_texts.sql | Resolved version collision |
| 20260903_app_labels_overrides.sql | 20260903_5_app_labels_overrides.sql | Resolved version collision |

---

## Files Changed

✅ `supabase/migrations/20260905_cleanup_create_project_duplicates.sql` — Created  
✅ `supabase/migrations/20260903_1_add_text_columns.sql` — Renamed  
✅ `supabase/migrations/20260903_2_fill_application_texts_defaults.sql` — Renamed  
✅ `supabase/migrations/20260903_3_rls_application_texts.sql` — Renamed  
✅ `supabase/migrations/20260903_5_app_labels_overrides.sql` — Fixed + Renamed  

---

## Next Steps

1. **Choose cleanup option** (1, 2, or 3 above)
2. **Execute the cleanup**
3. **Run verification query**
4. **Test application** (`npm run test`, `npx playwright test`)
5. **Commit changes** with migration cleanup documentation

---

## Prevention for Future

To prevent this issue from recurring:

1. **Use unique timestamps** for each migration (not date-only, include time)
2. **Document evolution** of RPC functions with version history
3. **Use ALTER** instead of CREATE when modifying existing RPC signatures:
   ```sql
   -- Correct approach:
   CREATE OR REPLACE FUNCTION public.create_project(
     p_company_id uuid DEFAULT NULL,
     p_name text DEFAULT NULL,
     p_domain_id uuid DEFAULT NULL,
     p_phase text DEFAULT 'listen',
     p_objetivo_principal text DEFAULT NULL,
     p_restricciones text DEFAULT NULL,
     p_horizonte_valor text DEFAULT NULL,
     p_ecosistema_tecnologico text DEFAULT NULL,
     p_fricciones_oportunidades text DEFAULT NULL
   ) RETURNS SETOF public.projects AS $$
     -- implementation
   $$ LANGUAGE sql SECURITY DEFINER;
   ```

4. **Use consolidated schema.sql** for new installs (no need for multiple migrations)

---

## Status Summary

| Component | Status | Action |
|-----------|--------|--------|
| Migration created | ✅ | 20260905 cleanup ready |
| Version conflicts fixed | ✅ | Renamed _1, _2, _3, _5 |
| SQL encoding fixed | ✅ | app_labels_overrides corrected |
| Database cleanup | ⚠️ PENDING | User must execute manual cleanup |
| Tests verification | ⏳ PENDING | After DB cleanup |
| E2E tests | ⏳ PENDING | After DB cleanup |

---

## Questions?

Refer to:
- **FIX_CREATE_PROJECT_RPC.md** — Detailed RPC fix guide
- **CONSOLIDATION_REPORT.md** — Schema consolidation details
- **AUDIT_FINAL_SUMMARY.md** — Complete audit findings


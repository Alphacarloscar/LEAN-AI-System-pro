# Fix: create_project RPC Function Ambiguity Error

**Error:** 
```
Could not choose the best candidate function between:
  public.create_project(p_company_id => uuid, p_name => text, p_phase => text)
  public.create_project(p_company_id => uuid, p_name => text, p_domain_id => uuid, p_phase => text)
  public.create_project(p_company_id => uuid, p_name => text, p_domain_id => uuid, p_phase => text, ...)
```

**Root Cause:**
Multiple versions of `create_project()` were created via different migrations:
- `20260602_create_project_rpc.sql` → v1: (company_id, name, phase)
- `20260825001_create_project_rpc_add_domain_id.sql` → v2: (company_id, name, domain_id, phase)
- `20260827004_create_project_rpc_extended_fields.sql` → v3: (company_id, name, domain_id, phase, objetivo, restricciones, ...)

PostgreSQL's `CREATE OR REPLACE FUNCTION` only replaces if the parameter list is **identical**. Since these have different parameters, all 3 versions now coexist, causing ambiguity.

---

## 🔧 Solution

### Step 1: Apply the cleanup migration

The migration `20260905_cleanup_create_project_duplicates.sql` has been created to remove the duplicate versions.

**For DEV environment (local):**
```bash
cd /path/to/LEAN-AI-System-pro
supabase migration up
# OR
supabase db reset
```

**For PRE/PRO environments (via Supabase SQL Editor):**
1. Go to Supabase Dashboard → SQL Editor
2. Open and run: `supabase/migrations/20260905_cleanup_create_project_duplicates.sql`
3. Copy the entire file content and execute it

### Step 2: Verify the fix

Run this query to confirm only one version remains:

```sql
SELECT proname,
       array_agg(pg_get_function_identity_arguments(oid)) as params
FROM pg_proc
WHERE proname = 'create_project' AND pronamespace = 'public'::regnamespace
GROUP BY proname;
```

Expected output: 1 row with the full parameter list (9 parameters).

### Step 3: Test the RPC call

```bash
# In browser console or via any client:
const { data, error } = await supabase.rpc('create_project', {
  p_name: 'Test Project',
  p_company_id: 'xxx-xxx-xxx',
  p_domain_id: 'yyy-yyy-yyy',
  p_phase: 'listen',
  p_objetivo_principal: null,
  p_restricciones: null,
  p_horizonte_valor: null,
  p_ecosistema_tecnologico: null,
  p_fricciones_oportunidades: null,
})

if (error) console.error('Error:', error)
else console.log('Success:', data)
```

---

## 📋 Migration Details

**File:** `supabase/migrations/20260905_cleanup_create_project_duplicates.sql`

**What it does:**
1. `DROP FUNCTION IF EXISTS public.create_project(uuid, text, text)` — removes v1
2. `DROP FUNCTION IF EXISTS public.create_project(uuid, text, uuid, text)` — removes v2
3. Keeps v3 (the latest with all extended fields)

**Why it's safe:**
- Only removes old signatures, not the final one
- `IF EXISTS` prevents errors if functions already dropped
- The client code already sends all 9 parameters, so v3 is what it expects

---

## 🛠️ How to Prevent This in the Future

**Problem:** When evolving an RPC function, `CREATE OR REPLACE` fails silently and creates overloads instead.

**Solution:** Use `CREATE OR REPLACE FUNCTION` with **all parameters explicitly**, and document the evolution:

```sql
-- Migration: 20260905_*
-- Evolution history:
--   v1 (20260602): (company_id, name, phase)
--   v2 (20260825001): + domain_id
--   v3 (20260827004): + objetivo, restricciones, horizonte, ecosistema, fricciones
--   v4 (20260905_cleanup): DROP v1 & v2, keep v3

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
)
RETURNS SETOF public.projects
AS $$
  -- implementation...
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## ✅ Verification Checklist

After applying the migration:

- [ ] Migration 20260905 applied to DEV
- [ ] Verify query shows only 1 create_project function
- [ ] Test RPC call from frontend (no ambiguity error)
- [ ] Create a new project via AdminView / Projects page (succeeds)
- [ ] Migration 20260905 applied to PRE
- [ ] Migration 20260905 applied to PRO
- [ ] All environments tested

---

## 📝 Related Migrations

This fix is related to the consolidated schema consolidation. The `supabase/schema.sql` file now includes only the final version of create_project, preventing this issue on fresh installs.

If you regenerate `schema.sql` via `scripts/consolidate-schema.sh`, migration 20260905 will ensure consistency.

---

**Status:** ✅ Ready to apply  
**Environments affected:** DEV, PRE, PRO  
**Risk level:** Low (only removes old function signatures)  
**Rollback:** Not needed (no data changes)


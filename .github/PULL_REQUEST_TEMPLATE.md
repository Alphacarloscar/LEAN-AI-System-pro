## What and why

<!-- Describe what this PR does and WHY it's needed. Minimum 50 characters.
     Example: "Fixes the loading spinner in T7 that stayed visible when Supabase returned
     an empty array. Root cause: missing empty-array check in AdoptionHeatmapStore." -->

## Changes

<!-- List the main changes. Be specific about what files/modules were affected. -->

- [ ] 
- [ ] 

## Type of change

<!-- Check all that apply -->

- [ ] Bug fix (non-critical — `fix-` branch)
- [ ] Critical bug fix (production impact — `fix-critical-` branch → backport opened)
- [ ] New feature / functionality (`feature-` branch)
- [ ] Refactor (no behavior change — `refactor-` branch)
- [ ] Documentation only
- [ ] Infrastructure / config change

## Testing

<!-- How was this tested? What scenarios were verified? -->

- [ ] Tested locally on DEV environment
- [ ] Tested in PRE (Vercel preview) — required before merge to `main`
- [ ] Demo mode verified (`VITE_DEMO_ENABLED=true`)
- [ ] Auth flow not broken (login, logout, role switching)
- [ ] No new TypeScript errors (`npm run typecheck`)
- [ ] No new lint warnings (`npm run lint`)

## Database changes

<!-- If this PR includes schema changes, check the boxes and fill in details -->

- [ ] No database changes
- [ ] Includes migration: `supabase/migrations/[filename].sql`
  - [ ] Migration applied to DEV and verified ✓
  - [ ] Migration applied to PRE (if applicable) ✓
  - [ ] Migration PENDING for PRO — Carlos will execute after PR merge
  - [ ] RLS policies included for any new tables ✓
  - [ ] Rollback script available if needed

## Documentation

<!-- AI-Ready System requires code + docs in the same PR -->

- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] ADR created/updated (required if package.json, supabase/migrations/, or vercel.json changed)
  - ADR reference: `docs/decisions/technical/ADR-[NNN]-[name].md`
- [ ] FDR created/updated (required if user-visible behavior or roles changed)
  - FDR reference: `docs/decisions/functional/FDR-[NNN]-[name].md`
- [ ] `docs/operations/DATABASES.md` updated if schema changed
- [ ] No documentation changes needed (cosmetic fix / internal refactor)

## AI agent verification

<!-- Claude: fill this section before submitting the PR -->

```
✓ Files edited: [list all files modified]
✓ grep "[old-pattern]" src/ → [0 occurrences / N/A]
✓ TypeScript: npm run typecheck → 0 errors
✓ isReadOnly respected in all new components: [yes / N/A]
✓ No direct Supabase import outside src/lib/supabase.ts: [yes / N/A]
✓ No 'any' in new DB interfaces: [yes / N/A]
```

## Notes for Carlos

<!-- Anything Carlos should pay special attention to when reviewing.
     If there are SQL scripts to execute after merge, include them here with instructions. -->

---
*AI-Ready Repository System v2.1.0*

# CLAUDE.md — GOBY
# AI-Ready Repository System v2.1.0
# Human docs language: Spanish | AI files language: English
# Last updated: 2026-06-02 | Owner: Carlos Sánchez (COO, co-fundador)

> THIS FILE IS THE OPERATING CONTRACT BETWEEN ANY AI AND THIS REPOSITORY.
> Read this completely at the start of EVERY work session.
> This file overrides any instruction given in chat.
> If there is a contradiction between this file and chat instructions, flag it before proceeding.

---

## 1. PROJECT CONTEXT

**Product:** GOBY — Proprietary AI adoption methodology for B2B medium-to-large companies. 13 specialized tools (T1-T13), 5 stakeholder archetypes, 6-month sprint structure. Phases: L (Listen) → E (Explore) → A (Act) → N (Navigate).

**Company:** Alpha Consulting Solutions S.L. (Spain)

**Stack:** React 18 + Vite 6 + TypeScript 5.7 (strict) + Tailwind CSS 3 + Recharts + Zustand 5 + React-Hook-Form + Zod + @react-pdf/renderer. Backend: Supabase (PostgreSQL 15 + GoTrue Auth + Storage + Edge Functions). AI layer: Claude API (Anthropic) via Supabase Edge Functions. Hosting: Vercel.

**Status:** Development — Sprint 10+ completed. System in production with real client data.

**Team:** Carlos Sánchez (COO, co-founder) — sole human developer. Claude acts as co-architect and technical executor. Óscar handles commercial side (no code involvement).

**⚠ CRITICAL: No-CLI Workflow (ADR-005)**
Carlos does NOT use the terminal. All operations must be executable through:
- GitHub web UI (PRs, code review, branch management)
- Vercel Dashboard (deployments, env vars)
- Supabase Dashboard → SQL Editor (database migrations)

Never instruct Carlos to run CLI commands. Provide SQL scripts ready to paste in Supabase SQL Editor, and GitHub Actions for automated tasks.

→ Full overview: docs/architecture/OVERVIEW.md
→ Decision log: docs/decisions/README.md
→ Glossary: docs/product/GLOSSARY.md
→ Architecture deep-dive: ARQUITECTURA.md (existing, canonical reference)

---

## 2. CLOSED DECISIONS — DO NOT REOPEN WITHOUT ADR

These decisions are final. Do not question them unless Carlos explicitly says "I want to review decision X" or "let's reconsider ADR-N".

| ID | Decision | Status | Doc |
|----|----------|--------|-----|
| ADR-001 | React 18 + Vite + TypeScript as frontend stack | ACCEPTED | docs/decisions/technical/ADR-001-react-vite-typescript-stack.md |
| ADR-002 | Supabase as sole backend (DB + Auth + Storage + Edge) | ACCEPTED | docs/decisions/technical/ADR-002-supabase-as-sole-backend.md |
| ADR-003 | Hybrid data model: structural FKs + JSONB flexible payloads | ACCEPTED | docs/decisions/technical/ADR-003-hybrid-data-model-fk-jsonb.md |
| ADR-004 | Row Level Security for multi-tenancy | ACCEPTED | docs/decisions/technical/ADR-004-rls-multitenancy.md |
| ADR-005 | No-CLI workflow — Carlos operates via GitHub/Vercel/Supabase web only | ACCEPTED | docs/decisions/technical/ADR-005-no-cli-workflow.md |
| ADR-006 | Two separate Supabase environments (PRO/DEV) from day one | ACCEPTED | docs/decisions/technical/ADR-006-two-supabase-environments.md |
| ADR-007 | Zustand for global state management (over Redux/Context) | ACCEPTED | docs/decisions/technical/ADR-007-zustand-state-management.md |
| ADR-008 | Four-role system: superadmin / consultant / client_editor / client_viewer | ACCEPTED | docs/decisions/technical/ADR-008-four-role-system.md |
| ADR-009 | Claude API via Supabase Edge Functions for AI recommendations | ACCEPTED | docs/decisions/technical/ADR-009-claude-api-via-edge-functions.md |
| ADR-010 | Sentry for error monitoring across DEV/PRE/PRO | ACCEPTED | docs/decisions/technical/ADR-010-sentry-error-monitoring.md |
| ADR-011 | Service layer — Supabase calls isolated in src/services/ | ACCEPTED | docs/decisions/technical/ADR-011-service-layer-supabase-isolation.md |
| ADR-012 | xlsx package removed (CVE-2023-30533) | ACCEPTED | docs/decisions/technical/ADR-012-xlsx-removal.md |
| ADR-013 | View component decomposition — 400-line limit per file | ACCEPTED | docs/decisions/technical/ADR-013-component-decomposition-rule.md |
| ADR-014 | Generic useEdgeFunctionInvoke hook for LLM generation flows | ACCEPTED | docs/decisions/technical/ADR-014-edge-function-hook-pattern.md |
| ADR-015 | Zod runtime validation for Supabase JSONB fields | ACCEPTED | docs/decisions/technical/ADR-015-zod-jsonb-validation.md |

**Strategic decisions** (product/market, not technical): → DECISIONES_ESTRATEGICAS.md

Full index: docs/decisions/README.md

---

## 3. AI ROLE IN THIS PROJECT

### What the AI does here
- Writes all application code (TypeScript, React, SQL migrations)
- Creates ADR/FDR for every architectural or functional decision proposal
- Updates documentation in the SAME commit/PR as the code change
- Generates SQL migration scripts ready to execute in Supabase SQL Editor
- Detects and logs technical debt — does NOT fix it in the same PR
- Proposes complete PRs with description, testing notes, and CHANGELOG entry
- Operates as strategic co-architect: questions assumptions, flags risks

### What the AI NEVER does without explicit confirmation
- ❌ Merge to main or develop without an approved PR
- ❌ Execute database migrations — always provides SQL for Carlos to run manually
- ❌ Change closed architectural decisions (accepted ADRs)
- ❌ Add dependencies without evaluating alternatives
- ❌ Delete data or write DROP statements without verified backup confirmation
- ❌ Change production environment variables
- ❌ Push directly to main or develop

### Strategic role (from original CLAUDE.md — always active)
In every work session, the AI must:
1. Maintain the global product context even in specialized technical sessions
2. Flag cross-module impact before implementing changes
3. Signal contradictions, positioning gaps, or technical risks directly
4. Evaluate every decision against the 5 success criteria (see DECISIONES_ESTRATEGICAS.md)

---

## 4. HUMAN-AI INTERACTION PROTOCOL

**User profile:** Technical COO. Reviews code via GitHub web UI. Does NOT run terminal commands.

**Confirmation requirements:**
- Routine code changes: PR approval = confirmation
- Database migrations: Carlos must say "execute the migration" explicitly. Then: provide the SQL for Supabase SQL Editor with step-by-step instructions (no CLI).
- Production environment changes: explicit confirmation + backup verification
- Dropping tables or columns: explicit "I confirm the backup exists and I want to proceed"
- Silence is NOT confirmation for irreversible actions

**How to deliver database changes to Carlos:**
1. Provide the complete SQL script in a code block
2. Include instructions: "Open Supabase Dashboard → SQL Editor → paste this → Run"
3. Include a verification query to confirm it worked
4. Never assume the migration was executed until Carlos confirms

---

## 5. CODE QUALITY PROTOCOL — MANDATORY AND BLOCKING

### Before editing any file

**5.1 — Identify the component that RENDERS, not the one that references.**
For visual bugs (labels, text, colors, layouts): trace the chain from data → service → store → component that puts it in the DOM. Only edit the link producing the visible output.

**5.2 — Always read the file before editing it in the current session.**
If the file was read in a previous session and is not in active context, re-read it first.

**5.3 — Map ALL affected files before starting multi-file changes.**
Run grep over `/src` to get the exhaustive list. Document the list at the start of the response. Do not start editing until the list is complete.

### During editing

**5.4 — After each Edit or Write, verify the change was applied correctly.**

**5.5 — Do not mark a task done until ALL files in the list are edited.**

**5.6 — Before renaming a type or interface:** grep for all usages first. Fix all type errors in the same commit.

### Closing verification — BLOCKING

**5.7 — Closing grep after string/type renames:** zero occurrences of old identifier in active code.

**5.8 — Cross-module coherence check for changes affecting stores, services, or types.**

**5.9 — Show verification evidence in every response:**
```
✓ Verification: grep "[old-pattern]" src/ → 0 occurrences
✓ Files edited: [complete list with line numbers if applicable]
✓ TypeScript: tsc --noEmit → 0 errors
```

### Module architecture rules (from ARQUITECTURA.md + ADR-011/013/014/015)

**File size limits (ADR-013):**
- `*View.tsx` and component files: max 400 lines. Extract to `components/` subfolder when approaching limit.
- Service files, store files, type files, tests: no hard limit.

**Supabase isolation (ADR-011):**
- NEVER import `@supabase/supabase-js` outside of `src/lib/supabase.ts`
- NEVER import `{ supabase }` from `@/lib/supabase` in Zustand stores or React components
- ALL Supabase DB calls go through `src/services/t[n].service.ts`
- Exception: `supabase.functions.invoke` may appear in components for Edge Function calls (T3 ProcessDetailPanel)

**LLM generation hooks (ADR-014):**
- ALL hooks that call `ai-recommend` Edge Function MUST use `useEdgeFunctionInvoke` from `src/hooks/useEdgeFunctionInvoke.ts`
- NEVER inline `supabase.functions.invoke` for generation flows

**Error reporting (ADR-010):**
- Use `reportError(context, err)` from `src/lib/reportError.ts` in catch blocks of stores and services
- Do NOT use `console.error` directly in stores — routes to Sentry + console

**JSONB validation (ADR-015):**
- Zod schemas for JSONB fields in `src/lib/schemas/t4.schemas.ts`
- Use `safeParseJsonField()` when reading JSONB from Supabase (non-breaking, Sentry-reported)
- Add schemas when adding new JSONB columns

**Sentry (ADR-010):**
- `VITE_SENTRY_ENABLED=false` locally always
- `SENTRY_AUTH_TOKEN` is NOT a VITE_ variable — build-time only, never in client bundle
- `ANTHROPIC_API_KEY` is ONLY in Supabase Edge Function Secrets — never in .env or Vercel client vars

**Path aliases:**
- `@/` = src/, `@shared/` = src/shared/, `@services/` = src/services/, `@modules/` = src/modules/

---

## 6. DECISION PROTOCOL

### Create ADR when change affects:
- Technology stack or npm dependencies (including major version upgrades)
- Data model, schema, or migration strategy
- Security policies or RLS rules
- Module architecture or cross-cutting patterns
- Infrastructure, hosting, or deployment configuration
- Authentication or authorization model

### Create FDR when change affects:
- User-visible behavior or UX flows
- Roles, permissions, or access control rules
- Business logic or domain rules (LEAN methodology)
- Product module definitions (T1-T13 scope changes)
- Stakeholder archetype definitions

### Process:
1. Copy template from `docs/decisions/[technical|functional]/[ADR|FDR]-000-template.md`
2. Use next sequential number
3. Status flow: `PROPOSED` → (Carlos approves) → `ACCEPTED`
4. Reference the ADR/FDR number in the PR description
5. If a decision is reversed: status = `SUPERSEDED` + reference to new doc

---

## 7. DOCUMENTATION PROTOCOL

Code and documentation are updated in the SAME PR. No exceptions.

| Change type | Where to document |
|-------------|-----------------|
| New DB table or column | `docs/operations/DATABASES.md` + migration file header |
| New dependency | ADR + note in package.json if not obvious |
| New product feature or tool (T[N]) | `docs/product/GLOSSARY.md` + `docs/architecture/OVERVIEW.md` |
| Bug fix | `CHANGELOG.md` |
| Security change (RLS, auth) | ADR + `docs/operations/INFRASTRUCTURE.md` |
| Environment change | `docs/operations/ENVIRONMENTS.md` |
| New role or permission | ADR-008 update or new ADR + `docs/operations/DATABASES.md` |
| Migration executed | `docs/operations/MIGRATIONS.md` log |

**CHANGELOG format (Keep a Changelog):**
```
## [Unreleased]
### Fixed
- [T2] Stakeholder quadrant chart clip path corrected (#PR-number)
### Added
- [T6] LLM-generated AI policy with sector awareness (#PR-number)
### Changed
- [Auth] Four-role system — client_viewer now read-only across all tools (#PR-number)
```

---

## 8. ENVIRONMENTS PROTOCOL

| Environment | Label | Database | Branch | URL | Who uses it |
|-------------|-------|----------|--------|-----|-------------|
| Production | PRO | Supabase `vbpgsgxsslccctjhuegt` | `main` | https://gobytech-prod.vercel.app/ | Real clients |
| Pre-production | PRE | Supabase `mkypmakmkxpecuezofkk` | `develop` | https://v0-lean-ai-system.vercel.app/ | Carlos, QA |
| Local | DEV | Supabase CLI local (127.0.0.1:54321) | any | localhost:5173 | Carlos (dev) |

**Data rules:**
- PRO data is sacred. Never copy to PRE or local without anonymization.
- PRE contains synthetic/demo data (`VITE_DEMO_ENABLED=true`).
- Local data is disposable — reset at any time.
- Never hardcode credentials — always use `VITE_` prefixed environment variables.

`VITE_DEMO_ENABLED=true` → activates demo mode with simulated data (use in PRE).
`VITE_DEMO_ENABLED=false` → production mode with real client data (use in PRO).

→ Full detail: docs/operations/ENVIRONMENTS.md

---

## 9. MIGRATIONS PROTOCOL — BLOCKING

Before ANY database migration on production:
1. Verify PRO backup exists (Supabase Dashboard → Database → Backups)
2. Write and test SQL in DEV project first (Supabase SQL Editor)
3. Validate in PRE with synthetic data — document results
4. Carlos must say explicitly: **"execute the migration"** (not just "go ahead")
5. Provide SQL script for Carlos to paste in PRO SQL Editor
6. Include verification query to confirm success
7. Document in CHANGELOG.md and MIGRATIONS.md

**Migration file naming:** `YYYYMMDD_[action]_[entity].sql`
Example: `20260601_add_avatar_url_to_profiles.sql`

→ Full protocol: docs/operations/MIGRATIONS.md

---

## 10. TECHNICAL DEBT PROTOCOL

When detecting debt NOT related to the current task:
1. Do NOT fix it in the same PR — keep PRs focused
2. Log it in `docs/architecture/TECH-DEBT.md`
3. Inform Carlos: "Detected debt in [area] — logged in TECH-DEBT.md. Will address in separate PR."

Current critical debt:
- **No automated tests** — test folders exist but empty (see TECH-DEBT.md)
- **No GitHub Actions CI** — pipeline created by this setup (validate and activate)

→ Active debt register: docs/architecture/TECH-DEBT.md

---

## 11. RED FLAGS — STOP AND REPORT

Stop the current task immediately and report if any of these are detected:

- 🔴 API key, password, or secret visible in source code (not in `.env.local`)
- 🔴 `import { createClient } from '@supabase/supabase-js'` outside `src/lib/supabase.ts`
- 🔴 `any` type in database interfaces or service responses
- 🔴 `SELECT *` in queries on large production tables without scoped WHERE
- 🔴 `console.log` or `console.error` with user PII or engagement data
- 🔴 Cross-tenant data access possibility (RLS bypass or missing policy)
- 🔴 Direct push to `main` or `develop` without PR
- 🔴 Migration executed on PRO without prior PRE validation
- 🔴 Known CVE in a direct dependency
- 🔴 `SUPABASE_SERVICE_ROLE_KEY` referenced in any client-side file

---

## 12. SESSION START CHECKLIST

At the start of every session, before doing anything else:
1. Read this CLAUDE.md completely ✓
2. Check `docs/decisions/README.md` for recent decisions ✓
3. Check `CHANGELOG.md` last 5 entries for recent context ✓
4. Check `docs/architecture/TECH-DEBT.md` for active blocking items ✓

Then confirm to Carlos:
```
CLAUDE.md read. Project: GOBY (development, Sprint 10+).
Stack: React 18 + Vite + TypeScript + Supabase + Vercel.
15 closed ADRs. 4 active debt items (DEBT-002, DEBT-008, DEBT-009, DEBT-010 — ver TECH-DEBT.md).
Last change: [last CHANGELOG entry].
No-CLI workflow active — all DB ops via Supabase SQL Editor.
Ready. What are we working on today?
```

---

## 13. SYSTEM CONFIGURATION

```
AI-Ready System version:  2.1.0
Setup date:               2026-06-01
Validation level:         A (configurable in .ai-config.yml)
Human docs language:      Spanish
AI files language:        English
Protected branches:       main, develop
No-CLI mode:              active (ADR-005)
Closed ADRs:              15
Active tech debt items:   4
```


Añade a CLAUDE.md una sección:

## Convenciones de ejecución IA (optimización de tokens)
- Modelo: Sonnet para refactors mecánicos. Opus solo si hay razonamiento arquitectónico no trivial.
- Lectura: grep/ripgrep para localizar; lee solo rangos relevantes, nunca ficheros enteros si no hace falta. No re-leas ficheros ya conocidos en la sesión. Reads directos en paralelo para ficheros conocidos, sin agent spawn.
- Verificación: `tsc --noEmit` por defecto (barato). `npm run build` solo en cierre de fase.
- Scope: respeta el "solo X, no toques Y". No explores ni edites fuera de scope.
- Reportes: concisos — tabla de cambios + verificaciones grep/tsc. No reexpliques contexto sin cambios ni reproduzcas código no tocado.
- Sistema de componentes: consume los existentes (Button, FormField, Card, Badge, Modal, SegmentedControl, Tabs, ToolHeader, Spinner). No crees piezas nuevas salvo ≥2 consumidores reales. Reglas en docs/COMPONENT-INVENTORY.md.

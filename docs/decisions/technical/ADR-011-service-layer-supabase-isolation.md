# ADR-011: Service layer — Supabase calls isolated in src/services/

**Status:** ACCEPTED
**Date:** 2026-06-02
**Proposed by:** Claude (P1-2 refactor session)
**Approved by:** Carlos Sánchez — 2026-06-02
**Supersedes:** —

---

## Context

During Sprint 9, T6, T7, and T8 Zustand stores directly called `supabase.rpc('save_tool_output', ...)` inline. This created:
1. **Testability problems** — unit tests for stores had to mock the full Supabase client
2. **Duplication** — identical `TOOL_CODE`, `PAYLOAD_VERSION`, `STALE_DAYS`, and `staleAfterISO()` logic was copy-pasted across three stores
3. **Violation of the existing pattern** — T1-T4 stores already used `src/services/` correctly; T6-T8 were inconsistent

CLAUDE.md section 5 already stated: "Data access only through `src/services/` — never import Supabase directly in components". Stores are closer to components than to services in this rule's intent.

## Decision

All Supabase calls live exclusively in `src/services/`. Zustand stores import service functions and call them — they never import `@supabase/supabase-js` or `src/lib/supabase.ts` directly.

The prohibition is enforced at the import level:
```
NEVER add `import { createClient } from '@supabase/supabase-js'` outside src/lib/supabase.ts
NEVER add `import { supabase } from '@/lib/supabase'` in Zustand stores or React components
```

Service files created as part of P1-2:
- `src/services/t6.service.ts` — `savePolicyOutput()`
- `src/services/t7.service.ts` — `saveChangePlanOutput()`
- `src/services/t8.service.ts` — `saveCommunicationOutput()`

Exception: T3 `ProcessDetailPanel` calls `supabase.functions.invoke` for the AI opportunity personalization flow. This is acceptable because the call is via the Edge Function client, not the DB client, and is contained within a single component. Future refactor target: extract to `src/services/t3.service.ts`.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Service layer pattern** | Testable, consistent, single responsibility | More files | Chosen — already used by T1-T4 |
| Inline in store | Less files | Untestable, duplicated logic | Rejected |
| Repository pattern (classes) | OOP familiarity | Over-engineering for this codebase | Rejected |

## Consequences

### Positive
- `src/services/` is the single place to grep for all DB access
- Stores are now pure state machines — easier to test
- 3 service files cover T6/T7/T8 persistence (identical `save_tool_output` RPC pattern)

### Negative / Trade-offs accepted
- T3 `ProcessDetailPanel` still has an inline Edge Function call (tech debt, documented in TECH-DEBT.md)

### Constraints introduced
- Any future T[N] that persists to Supabase must create a `src/services/t[n].service.ts` file first
- PR reviews must check for `import { supabase }` in stores — immediate rejection if found

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

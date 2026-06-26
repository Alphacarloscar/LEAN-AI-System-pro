# ADR-015: Zod runtime validation for Supabase JSONB fields

**Status:** ACCEPTED
**Date:** 2026-06-02
**Proposed by:** Claude (P2-6 refactor session)
**Approved by:** Carlos Sánchez — 2026-06-02

---

## Context

The `use_cases` table stores several complex objects as JSONB columns: `economics`, `go_no_go`, `stakeholder_scores`, `ai_act_classification`. In TypeScript these were cast directly via `as T` — no runtime check.

The risk: a SQL migration that changes the shape of one of these JSONB fields (e.g., renaming a key, changing a type) would silently break the UI without TypeScript catching it at compile time. The type system only validates at build time; JSONB arrives at runtime as `unknown`.

The codebase already uses Zod (`^3.23.8`) for form validation. Extending it to the DB boundary adds no new dependency.

## Decision

Create `src/lib/schemas/t4.schemas.ts` with Zod schemas for the four main JSONB fields. In `t4.service.ts`'s `rowToUseCase()`, replace direct `as T` casts with `safeParseJsonField()`:

```typescript
// Before (silent cast):
economics: castOpt<UseCase['economics']>(row.economics)

// After (validated, Sentry-reported on drift):
economics: safeParseJsonField(UseCaseEconomicsSchema, row.economics, 'economics')
```

`safeParseJsonField()` uses `.safeParse()` — it does NOT throw on invalid data. Instead it:
1. Returns the validated value on success
2. On failure: calls `reportError()` to log to Sentry, then falls back to the raw value cast as `T`

This is non-breaking: the UI still renders even if a new schema drift is detected; the error surfaces in Sentry for diagnosis.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Zod safeParse + Sentry** | Non-breaking, runtime safety | Needs schema maintenance | Chosen |
| Zod parse (throws) | Strict | Breaking — crashes UI on any drift | Too strict for prod |
| No validation (status quo) | Zero code | Silent failures | Unacceptable |
| Custom hand-written validators | No extra dep | More code, same maintenance | Rejected |

## Consequences

### Positive
- JSONB shape drift surfaces in Sentry before users notice broken UI
- Schemas serve as executable documentation of the DB contract
- Zod inferred types (`UseCaseEconomicsType`, etc.) can replace the manual interfaces in the future

### Negative / Trade-offs accepted
- Schemas must be kept in sync with TypeScript interfaces (two sources of truth for now)
- `scope` enum in `AIActClassificationSchema` must be updated if `AIActScope` union changes

### Constraints introduced
- When adding new JSONB columns to `use_cases`, add a corresponding Zod schema to `t4.schemas.ts`
- `roadmap`, `t1_context`, `t2_context` are still simple castOpt — add schemas if they grow in complexity

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

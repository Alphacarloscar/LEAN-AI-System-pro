# ADR-014: Generic useEdgeFunctionInvoke hook for LLM generation flows

**Status:** ACCEPTED
**Date:** 2026-06-02
**Proposed by:** Claude (P2-4 refactor session)
**Approved by:** Carlos Sánchez — 2026-06-02

---

## Context

Three hooks (`usePolicyGeneration`, `useChangePlanGeneration`, `useT8Generation`) each independently implemented:
- `isGenerating` / `error` state management
- Early return when `engagementId` is null
- `Promise.race([invoke, timeout])` with 60-90s timeouts
- Generic error handling (`fnError`, `result?.error`)
- `console.error` in catch blocks
- `setPersistence()` call after success/failure

This was 3× duplication of ~80 lines of identical infrastructure code, with only the `tool` name, validation logic, and store update varying between them.

## Decision

Extract `useEdgeFunctionInvoke<TContext, TResult>` in `src/hooks/useEdgeFunctionInvoke.ts`. The generic hook handles all infrastructure; specific hooks implement only their unique logic via callbacks:

```typescript
useEdgeFunctionInvoke({
  tool:                'tx_tool',
  timeoutMs:           90_000,
  noEngagementMessage: '...',
  validate:            (data) => { /* throw if invalid */ return typed },
  onSuccess:           (result, engagementId, context) => { /* store update */ },
  onPersistence:       (p) => { /* setPersistence call */ },
})
```

Each specific hook (`usePolicyGeneration`, etc.) is now ~50 lines of callbacks, down from ~120 lines of duplicated boilerplate.

## Consequences

### Positive
- Single source of truth for timeout, error handling, and `ai-recommend` invocation
- T6 also gains the 90s timeout it was missing (bug fix, not feature)
- `reportError()` is called in one place for all LLM errors
- New LLM generation hooks follow the same pattern with minimal code

### Negative / Trade-offs accepted
- Slightly more indirection for new developers reading specific hooks

### Constraints introduced
- New hooks that call `ai-recommend` MUST use `useEdgeFunctionInvoke`, not inline `supabase.functions.invoke`
- Timeout must be explicit in each hook (`timeoutMs` parameter) — no magic defaults hidden in the generic hook

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

# ADR-012: xlsx package removed (CVE-2023-30533)

**Status:** ACCEPTED
**Date:** 2026-06-02
**Proposed by:** Claude (P1-3 security audit)
**Approved by:** Carlos Sánchez — 2026-06-02

---

## Context

`xlsx@0.18.5` was present in `package.json` dependencies. A security audit (P1-3) found it listed as a critical CVE target (CVE-2023-30533 — prototype pollution). Investigation revealed the package had zero imports anywhere in the codebase (`src/**/*.ts`, `src/**/*.tsx`). It was a dead dependency that added 9 transitive packages (~1.2MB) to the bundle for no benefit.

## Decision

Remove `xlsx` from `package.json` entirely. No replacement needed — the feature it was presumably added for was never implemented.

If CSV/Excel export is needed in the future, evaluate `papaparse` (already installed for CSV) or `exceljs` (actively maintained, no known CVEs).

## Consequences

### Positive
- Eliminates CVE-2023-30533 (prototype pollution in xlsx)
- Removes 9 packages from the dependency tree
- Reduces bundle analysis surface

### Negative / Trade-offs accepted
- If Excel export was planned, it must be re-evaluated with a safe library

### Constraints introduced
- Do NOT re-add `xlsx@0.18.x` — it is abandoned and CVE-affected
- Alternative for future Excel export: `exceljs` or `papaparse` (CSV)

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

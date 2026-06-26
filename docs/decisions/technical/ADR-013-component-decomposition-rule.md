# ADR-013: View component decomposition — 400-line limit per file

**Status:** ACCEPTED
**Date:** 2026-06-02
**Proposed by:** Claude (P1-1, P2-1 refactor sessions)
**Approved by:** Carlos Sánchez — 2026-06-02

---

## Context

T4View.tsx reached 2,386 lines and T3View.tsx reached 1,202 lines. Both contained multiple visually independent components (charts, detail panels, badge components) defined inline as functions. This created:
- Impossible-to-test individual components (no exports)
- Slow AI context processing (large files = high token cost per edit)
- Poor maintainability (scroll-archaeology to find anything)
- Blocked reuse (e.g., `CategoryBadge` couldn't be used in T3 without copy-paste)

P1-1 decomposed T4View (2,386 → ~220 lines, 9 extracted components).
P2-1 decomposed T3View (1,202 → ~220 lines, 5 extracted components).

## Decision

**Rule**: No view file (`*View.tsx`) or component file exceeds 400 lines. When a file approaches this limit, extract the largest coherent visual unit into a `components/` subfolder.

**Where to extract**: Each module already has a `components/` subfolder (`src/modules/T[N]_*/components/`). New extracted components go there.

**Naming convention**:
- Badges/chips: `[Module]Badges.tsx` — export multiple small components + color constants
- Chart components: named after what they show (`HeroOpportunityMatrix`, `HeroCategoryDonut`)
- Panel/tab components: named after their UI role (`UseCaseDetailPanel`, `ProcessDetailPanel`)
- Modal components: `[Action]Modal.tsx`

**The 400-line limit does NOT apply to**: service files, store files, type definition files, or test files.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **400-line limit, extract to components/** | Testable, reusable, fast context | More files to navigate | Chosen |
| No limit | Fewer files | Unmaintainable at scale | Rejected |
| 200-line limit | More granular | Over-decomposition for TSX | Too strict |

## Consequences

### Positive
- Each component can be tested independently
- AI context windows are smaller and faster to process
- Components are reusable across modules

### Negative / Trade-offs accepted
- More files to navigate (mitigated by consistent `components/` folder structure)

### Constraints introduced
- PRs adding >400 lines to a `*View.tsx` file must include a decomposition plan or justification

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

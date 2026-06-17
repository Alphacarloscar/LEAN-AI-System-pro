# ADR-020: Plan Maestro de Estrategia UX/UI y Sistema de Diseño

**Status:** PROPOSED
**Date:** 2026-06-16
**Proposed by:** Carlos Sánchez - Alpha Consulting
**Approved by:** —
**Supersedes:** —
**Superseded by:** —

---

## Context

GOBY ha crecido de forma orgánica hasta T12. La UI acumula inconsistencias de spacing, color y accesibilidad que bloquean tres objetivos:

1. **Escalabilidad de marca**: paleta hardcoded impide multi-tenant / white-label.
2. **Accesibilidad WCAG 2.1 AA**: gráficos, formularios y navegación carecen de semántica correcta para lectores de pantalla.
3. **Densidad configurable**: paddings ad-hoc impiden adaptar la interfaz a distintas densidades de información.

Este ADR establece el plan maestro en fases. Cada fase puede encargarse a Claude Code como una PR independiente.

---

## Decisión

Implementar un plan de mejora UX/UI en 4 fases:

| Fase | Alcance | ADR derivado | Estado |
|------|---------|--------------|--------|
| 1 | Design System Charter: escala space, tokens CSS vars, densidad | ADR-021 | ACCEPTED |
| 2 | AppLayout piloto: sidebar, header, responsive grid | FDR-002 (reservado) | PENDING |
| 3 | Estándar de formularios: RHF + Zod + FormField unificado | ADR-022 | ACCEPTED |
| 4 | Accesibilidad transversal: WCAG 2.1 AA en charts, nav, modals | — | EN CURSO |

---

## Consequences

- Cada fase produce una PR con scope acotado y criterios verificables.
- Las fases 2-4 no bloquean la Fase 1 (paralelas en el backlog).
- El pipeline de CI valida `typecheck` + `npm run build` antes de merge.

---

## Constraints

- No migrar a Carbon ni Shadcn — coste de migración supera el beneficio.
- Recharts no soporta CSS vars en props SVG — `CHART_PALETTE` permanece como hex estático (documentado en ADR-021).
- Carlos opera vía Web UI; toda la ejecución es AI-assisted sin CLI local.

---

## Execution log

| Fecha | Acción | PR / Rama | Notas |
|-------|--------|-----------|-------|
| 2026-06-16 | Fase 1: Design System Charter aprobado | ADR-021 / `feat/ds-charter-css-vars` | Tokens, escala space, densidad |
| 2026-06-16 | Fase 2 piloto: chasis A11y AppLayout — skip-link, ARIA labels, `--header-h` | `feat/a11y-applayout-skip-link-aria` | DEBT-022 cerrado; DEBT-023 parcial (E2E pendiente) |
| 2026-06-16 | Prompt 3: ChartWrapper accesible — `ariaLabel` obligatoria + `dataTable` opcional | `refactor/ux-ui-adr020-consolidation` | DEBT-025 cerrado. `LeanBarChart` + `LeanRadarChart` actualizados. |
| 2026-06-16 | Prompt 4: `useUnsavedChanges` Zustand + confirm modal en EngagementSelector y AppSidebar | `refactor/ux-ui-adr020-consolidation` | Guard ante navegación/cambio de proyecto con cambios sin guardar. |
| 2026-06-16 | Prompt 5: T2/T3 migrados a react-hook-form + zodResolver (ADR-022) | `refactor/ux-ui-adr020-consolidation` | `t2.schemas.ts`, `t3.schemas.ts`, `@hookform/resolvers` añadida. DEBT-024 actualizado. |
| 2026-06-16 | Prompt 6: `ToastProvider` con cola FIFO limitada (máx. 3), duraciones por variante, `persistent` | `refactor/ux-ui-adr020-consolidation` | DEBT-027 parte 1 cerrado. |

---

## Estado real por prompt (backlog vivo)

Origen del backlog: `docs/sessions/2026-06-16_ux-ui-prompts-ia-code.md`.

| Prompt | Rama esperada | Estado real | Próxima acción |
|---|---|---|---|
| 1 — A11y AppLayout chassis | `feat/a11y-applayout-skip-link-aria` | ✅ Commiteado | Merge a `refactor/ux-ui-adr020-consolidation` |
| 2 — Design System Charter (ADR-021) | `feat/ds-charter-css-vars` | ✅ Commiteado | Ya integrado en consolidación |
| 3 — ChartWrapper a11y (DEBT-025) | `refactor/ux-ui-adr020-consolidation` | ✅ Commiteado | — |
| 4 — useUnsavedChanges + EngagementSelector | `refactor/ux-ui-adr020-consolidation` | ✅ Commiteado | — |
| 5 — RHF+Zod en T2/T3/T4 (ADR-022) | `refactor/ux-ui-adr020-consolidation` | ✅ Commiteado | — |
| 6 — ToastProvider con cola limitada | `refactor/ux-ui-adr020-consolidation` | ✅ Commiteado | — |
| 7 — Sidebar responsive + tablas mobile (DEBT-026) | `refactor/ux-ui-adr020-consolidation` | ❌ No iniciado | Re-ejecutar Prompt 7 |
| 8 — StreamingIndicator para LLM | `refactor/ux-ui-adr020-consolidation` | ❌ No iniciado | Re-ejecutar Prompt 8 |
| 9 — FDR-003 T4 estados vs tabs | `refactor/ux-ui-adr020-consolidation` | ❌ No iniciado | Re-ejecutar Prompt 9 |

**Resumen:** 6 de 9 prompts ejecutados y commiteados. 3 pendientes.

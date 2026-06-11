# Lint Backlog — GOBY

Generated: 2026-06-08  
ESLint version: 9.x (flat config)  
Baseline: `npm run lint` → exit 0, **31 warnings**, 0 errors

> Estas advertencias son código legado identificado en el PR `fix/ci-unblock`.
> No bloquean CI. Abordarse en PRs dedicados, nunca mezclados con features.

---

## Resumen por regla

| Regla | Warnings | Prioridad |
|-------|----------|-----------|
| `react-hooks/exhaustive-deps` | ~~18~~ **0** ✅ | Resuelto 2026-06-08 |
| `react-refresh/only-export-components` | ~~13~~ **0** ✅ | Resuelto 2026-06-09 |
| **Total** | **0** | |

---

## Detalle: `react-hooks/exhaustive-deps` (0 warnings — RESUELTO)

Triage completado en `chore/exhaustive-deps` (2026-06-08). 2 bugs reales corregidos; 14 supresiones justificadas con comentario explicativo.

| # | Archivo | Dep omitida | Clasificación | Resolución |
|---|---------|------------|---------------|------------|
| 1 | `src/hooks/useRecommendations.ts` | `setCache` en `useCallback` | No existía en producción — `setCache` ya estaba en el array | Sin cambio (falso positivo en backlog) |
| 2 | `src/modules/Admin/AdminView.tsx` | `navigate` en `useEffect` | Intencionado — `navigate` es estable por spec react-router | suppress + comentario |
| 3 | `src/modules/T10_AIValueDashboard/T10View.tsx` | acciones en `useEffect` mount-only | Intencionado — stable Zustand actions | suppress + comentario |
| 4 | `src/modules/T10_AIValueDashboard/T10View.tsx` | `AI_CAT_META` en `useMemo` | **Bug real** — constante definida en body del componente creaba nueva referencia cada render | **fix**: movida a scope de módulo |
| 5 | `src/modules/T12_ISOAssessment/T12View.tsx` | `syncT12` en `useEffect` | Intencionado — stable Zustand action | suppress + comentario |
| 6 | `src/modules/T1_MaturityRadar/T1View.tsx` | `activeDimensions` en 2 `useMemo` | **Bug real** — `?? []` creaba nuevo array en cada render si key inexistente | **fix**: `activeDimensions` envuelta en `useMemo([intervieweeStates, activeId])` |
| 7 | `src/modules/T5_AITaxonomyCanvas/T5View.tsx` | `syncT5` en `useEffect` | Intencionado — stable Zustand action | suppress + comentario |
| 8 | `src/modules/T6_RiskGovernance/T6View.tsx` | `syncT6` en `useEffect` | Intencionado — stable Zustand action | suppress + comentario |
| 9 | `src/modules/T7_AdoptionHeatmap/T7View.tsx` | `loadT2`, `stakeholders.length` | Intencionado — mount-only, guard interno cubre idempotencia | suppress + comentario |
| 10 | `src/modules/T7_AdoptionHeatmap/T7View.tsx` | `syncT7` en `useEffect` | Intencionado — stable Zustand action | suppress + comentario |
| 11 | `src/modules/T8_CommunicationMap/T8View.tsx` | `loadT2`, `stakeholders.length` | Intencionado — mismo patrón que T7 | suppress + comentario |
| 12 | `src/modules/T8_CommunicationMap/T8View.tsx` | `syncT8` en `useEffect` | Intencionado — stable Zustand action | suppress + comentario |
| 13 | `src/modules/T9_AIRoadmap/T9View.tsx` | `syncT9` en `useEffect` | Intencionado — stable Zustand action | suppress + comentario |
| 14 | `src/modules/T9_AIRoadmap/T9View.tsx` | `loadT4` en `useEffect` | Intencionado — stable Zustand action | suppress + comentario |
| 15 | `src/shared/components/EngagementSelector.tsx` | `companies.length`, `needsCompanySelector` | Intencionado — efecto solo al abrir form; añadirlos causaría re-fetch en cada dato | suppress + comentario |
| 16 | `src/shared/layouts/AppLayout.tsx` | `loadMyProjects`, `user` | Intencionado — `[user?.id]` evita re-fetch por cambio de referencia sin cambio de identidad | suppress + comentario |

---

## Detalle: `react-refresh/only-export-components` — ✅ RESUELTO 2026-06-09

Constantes/funciones/hooks movidos a ficheros hermanos `*.constants.ts` / `*.hooks.ts` / `*.context.ts`. Regla elevada a `error` en `eslint.config.js`.

| Archivo original | Fichero creado | Símbolos movidos |
|-----------------|----------------|-----------------|
| `src/modules/T1_MaturityRadar/index.tsx` | (eliminadas re-exportaciones de `./types` y `./constants`) | `resolveMaturityTier`, `computeDimensionScore`, `computeOverallScore`, `countScoredSubdimensions`, `MATURITY_TIER_CONFIG`, `DIMENSION_DEFINITIONS`, `DIMENSION_MAP`, `SUBDIMENSION_MAP`, `TOTAL_SUBDIMENSIONS` |
| `src/modules/T3_ValueStreamMap/components/T3Badges.tsx` | `T3Badges.constants.ts` | `CAT_HEX`, `CAT_ORDER` |
| `src/modules/T4_UseCasePriorityBoard/components/AIActClassificationModal.tsx` | `AIActClassificationModal.constants.ts` | `AIACT_RISK_CONFIG`, `AIACT_SCOPE_LABELS` |
| `src/modules/T4_UseCasePriorityBoard/components/T4Badges.tsx` | `T4Badges.constants.ts` | `priorityScoreColor`, `fmtEur` |
| `src/shared/components/charts/LeanBarChart.tsx` | `LeanBarChart.constants.ts` | `DEMO_KPI_DATA` |
| `src/shared/components/charts/LeanRadarChart.tsx` | `LeanRadarChart.constants.ts` | `DEMO_RADAR_DATA` |
| `src/shared/design-system/components/Toast.tsx` | `Toast.hooks.ts` | `useToast` |
| `src/shared/layouts/AppLayout.tsx` | `AppLayout.hooks.ts` | `useAppLayout`, `AppLayoutContext` |
| `src/shared/providers/ProjectRuntimeProvider.tsx` | `ProjectRuntimeProvider.context.ts` + `ProjectRuntimeProvider.hooks.ts` | `ProjectRuntimeContext`, `ProjectRuntime`, `DEFAULT_RUNTIME`, `useProjectRuntime` |
| `src/modules/CompanyProfile/components/CompanyProfileHelpers.tsx` | `CompanyProfileHelpers.constants.ts` | `FREQ_COLOR`, `IMPACT_COLOR` |
| `src/modules/T9_AIRoadmap/components/GanttRowItem.tsx` | `GanttRowItem.constants.ts` | `DS`, `AIGanttRow`, `FreeGanttRow`, `GanttRow`, `mapAIActRisk`, `RISK_META`, `barLeftPct`, `barWidthPct`, `milestoneLeftPct`, `T4_STATUS_META`, `FREE_STATUS_META` |

---

## Historial de resolución

| Fecha | Acción | Resultado |
|-------|--------|-----------|
| 2026-06-08 | PR `fix/ci-unblock` — 5 errores eliminados, config flat config establecida | Baseline 31 warnings, 0 errors |
| 2026-06-08 | `chore/exhaustive-deps` — triage 16 warnings exhaustive-deps: 2 fixes reales, 14 suppressions justificadas | 13 warnings restantes (solo `react-refresh/only-export-components`) |
| 2026-06-09 | `chore/react-refresh` — 13 warnings react-refresh eliminados (+ 2 extras detectados), constantes movidas a `*.constants.ts`, hooks a `*.hooks.ts`, contexto a `*.context.ts`, regla elevada a error | 0 warnings |

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
| `react-hooks/exhaustive-deps` | 18 | 🟡 Media — riesgo de stale closures en efectos de carga |
| `react-refresh/only-export-components` | 13 | 🟢 Baja — solo impacta HMR en dev, sin efecto en prod |
| **Total** | **31** | |

---

## Detalle: `react-hooks/exhaustive-deps` (18 warnings)

Deps omitidas en `useEffect`/`useCallback`/`useMemo`. Patrón habitual: funciones de store Zustand (stable references) declaradas fuera del array a propósito para evitar bucles infinitos. Requiere análisis caso por caso antes de añadir deps.

| Archivo | Línea | Detalle |
|---------|-------|---------|
| `src/hooks/useRecommendations.ts` | 120 | `setCache` falta en `useCallback` |
| `src/modules/Admin/AdminView.tsx` | 634 | `navigate` falta en `useEffect` |
| `src/modules/T10_AIValueDashboard/T10View.tsx` | 85 | `loadProfile`, `loadT1-T4`, `syncT12`, `syncT9` |
| `src/modules/T10_AIValueDashboard/T10View.tsx` | 196 | `AI_CAT_META` falta en `useMemo` |
| `src/modules/T12_ISOAssessment/T12View.tsx` | 301 | `syncT12` falta en `useEffect` |
| `src/modules/T1_MaturityRadar/T1View.tsx` | 269 | `activeDimensions` debería estar en su propio `useMemo` (2 ocurrencias) |
| `src/modules/T5_AITaxonomyCanvas/T5View.tsx` | 40 | `syncT5` falta en `useEffect` |
| `src/modules/T6_RiskGovernance/T6View.tsx` | 657 | `syncT6` falta en `useEffect` |
| `src/modules/T7_AdoptionHeatmap/T7View.tsx` | 59 | `loadT2`, `stakeholders.length` |
| `src/modules/T7_AdoptionHeatmap/T7View.tsx` | 90 | `syncT7` falta en `useEffect` |
| `src/modules/T8_CommunicationMap/T8View.tsx` | 61 | `loadT2`, `stakeholders.length` |
| `src/modules/T8_CommunicationMap/T8View.tsx` | 65 | `syncT8` falta en `useEffect` |
| `src/modules/T9_AIRoadmap/T9View.tsx` | 503 | `syncT9` falta en `useEffect` |
| `src/modules/T9_AIRoadmap/T9View.tsx` | 509 | `loadT4` falta en `useEffect` |
| `src/shared/components/EngagementSelector.tsx` | 112 | `companies.length`, `needsCompanySelector` |
| `src/shared/layouts/AppLayout.tsx` | 226 | `loadMyProjects`, `user` |

**Acción recomendada:** PR dedicado `fix/exhaustive-deps`. Para funciones de store Zustand estables, usar `useCallback` con deps vacías en el store o añadir `// eslint-disable-next-line` con comentario explicativo.

---

## Detalle: `react-refresh/only-export-components` (13 warnings)

Ficheros que exportan constantes/funciones junto a componentes. Solo impacta la velocidad de HMR en desarrollo — sin efecto en producción.

| Archivo | Líneas |
|---------|--------|
| `src/modules/T1_MaturityRadar/index.tsx` | 4, 5 (4 ocurrencias) |
| `src/modules/T3_ValueStreamMap/components/T3Badges.tsx` | 7, 16 |
| `src/modules/T4_UseCasePriorityBoard/components/AIActClassificationModal.tsx` | 15 |
| `src/modules/T4_UseCasePriorityBoard/components/T4Badges.tsx` | 46, 52 |
| `src/shared/components/charts/LeanBarChart.tsx` | 220 |
| `src/shared/components/charts/LeanRadarChart.tsx` | 149 |
| `src/shared/design-system/components/Toast.tsx` | 105 |
| `src/shared/layouts/AppLayout.tsx` | 41 |
| `src/shared/providers/ProjectRuntimeProvider.tsx` | 107 |

**Acción recomendada:** Mover constantes/helpers a ficheros `*.constants.ts` o `*.utils.ts` separados. Bajo impacto — abordar en sprint de limpieza.

---

## Historial de resolución

| Fecha | Acción | Resultado |
|-------|--------|-----------|
| 2026-06-08 | PR `fix/ci-unblock` — 5 errores eliminados, config flat config establecida | Baseline 31 warnings, 0 errors |

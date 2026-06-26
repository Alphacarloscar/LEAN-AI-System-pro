# ADR-021: Design System Charter — Escala space, tokens CSS vars, densidad configurable

**Status:** ACCEPTED
**Date:** 2026-06-16
**Proposed by:** Carlos Sánchez - Alpha Consulting
**Approved by:** Carlos Sánchez - Alpha Consulting
**Supersedes:** —
**Superseded by:** —

---

## Context

ADR-020 Fase 1 encarga formalizar un **Design System Charter** que endurezca el sistema de diseño actual (Tailwind + tokens custom) sin migrar a Carbon ni Shadcn. Los problemas concretos que motivan este ADR:

1. **Spacing ad-hoc**: componentes usan `px-[14px]`, `gap-[18px]`, `h-[57px]` sin escala sistemática. Cada PR introduce valores nuevos. Imposible aplicar densidad configurable sin una escala base fija.
2. **Hex inline en componentes**: `AppSidebar`, `EngagementSelector`, `AlphaLogo`, `ErrorBoundary`, `PersistenceBanner` y otros contienen literales `#C8860A`, `#2A2822`, `#D4D0C8` directamente en JSX. Si la paleta cambia (ej. marca blanca multi-tenant), hay que hacer grep + sed en 15+ ficheros.
3. **`CHART_PALETTE` duplicado**: los colores del sistema de diseño están declarados dos veces: en `tailwind.config.ts` (fuente de verdad) y en `ChartWrapper.tsx` (objeto hex estático para Recharts). Cualquier cambio de paleta requiere actualizar ambos manualmente.
4. **Sin densidad configurable**: tablas, formularios y cards usan paddings hardcoded. La densidad `compact / default / comfortable` de ADR-020 no puede implementarse sin una capa de tokens de densidad.

### Restricción de Recharts

Recharts (v2/v3) resuelve colores en el momento de la construcción del SVG. No soporta `var(--color-gold)` como valor de `stroke` o `fill` en sus props — el SVG resultante contiene el valor CSS var como string literal, que los navegadores no resuelven en atributos SVG de presentación. Por tanto:

- **`CHART_PALETTE` permanece como objeto hex estático** en `ChartWrapper.tsx`. Es la fuente de verdad para todos los componentes Recharts.
- El helper `token()` de este ADR es para componentes no-chart (formularios, badges, cards, indicadores inline).
- La duplicidad `tailwind.config.ts` ↔ `CHART_PALETTE` se acepta como coste operativo conocido. Mitigación: `CHART_PALETTE` tiene comentarios `// era X` y referencias al token de Tailwind para facilitar sincronización manual en reviews.

---

## Decision

### a) Escala space-* custom en tailwind.config.ts

Escala `extend.spacing` con los 7 valores canónicos alineados con la rejilla 4px de Carbon 2x:

| Token | px |
|---|---|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-12` | 48 px |

**Regla vinculante:** ningún componente del DS ni vista T* puede usar `px-[N]`, `gap-[N]`, `h-[N]` con valores arbitrarios fuera de esta escala. Excepción documentada: valores derivados de medición de DOM (ej. `--header-h` calculado por `useLayoutEffect`).

### b) Tokens de color en CSS variables

Variables declaradas en `src/index.css`, bloque `:root` (light) y `html.dark` (dark). Mantenimiento: equivalencia 1:1 con `tailwind.config.ts` — si un hex cambia en Tailwind, debe actualizarse también en las CSS vars.

| CSS var | Light | Dark |
|---|---|---|
| `--color-gold` | `#C8860A` | `#C8860A` |
| `--color-navy` | `#2A2822` | `#2A2822` |
| `--color-warm-950` | `#16140F` | `#16140F` |
| `--color-warm-900` | `#22201C` | `#22201C` |
| `--color-warm-100` | `#C4C0B8` | `#C4C0B8` |
| `--color-surface` | `#F7F4EE` | `#22201C` |
| `--color-border` | `#D4D0C8` | `#3E3B35` |
| `--color-success` | `#86C7A8` | `#86C7A8` |
| `--color-danger` | `#D89090` | `#D89090` |
| `--color-warning` | `#E8C281` | `#E8C281` |
| `--color-info` | `#9BB5D9` | `#9BB5D9` |

### c) Helper token() en src/shared/design-system/tokens.ts

```ts
export function token(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`).trim()
}
```

Uso correcto (componentes no-chart):
```tsx
style={{ color: token('gold') }}
```

Uso incorrecto (Recharts props):
```tsx
// ❌ — Recharts no resuelve CSS vars en SVG presentation attributes
<Line stroke={token('navy')} />
// ✅ — usar CHART_PALETTE directamente
<Line stroke={CHART_PALETTE.navy} />
```

### d) Densidad configurable

Prop `density: 'compact' | 'default' | 'comfortable'` añadida a `Table`, `FormField`, `Card` del DS. Default = `'default'`. Mapeo de padding/height:

| Componente | compact | default | comfortable |
|---|---|---|---|
| Table row height | `h-8` (32px) | `h-10` (40px) | `h-12` (48px) |
| FormField padding | `py-1.5` (6px) | `py-2` (8px) | `py-3` (12px) |
| Card padding | `p-3` (12px) | `p-4` (16px) | `p-6` (24px) |

La prop `density` se implementa en cada componente cuando se refactoriza (PRs individuales). Este ADR establece los valores; no exige migración inmediata de todos los componentes.

### e) Prohibiciones

- **Prohibido** `#RRGGBB` inline en componentes del DS o vistas T*. Usar tokens Tailwind o `token()`.
- **Prohibido** spacing ad-hoc fuera de la escala `space-*`.
- **Prohibido** importar Shadcn (`@shadcn/ui`) ni IBM Carbon (`@carbon/react`) en `package.json`.
- **Permitida** excepción documentada en `CHART_PALETTE` (Recharts, restricción técnica justificada arriba).

---

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Migrar `CHART_PALETTE` a `token()` + `useMemo` | Elimina duplicidad | Recharts no resuelve CSS vars en SVG attrs. Rompe gráficos en producción. | Restricción técnica de Recharts confirmada |
| Usar `getComputedStyle` en build-time con Vite plugin | Eliminaría duplicidad sin runtime cost | Complejidad de build no justificada; el plugin no existe en el ecosistema Vite+Recharts | Coste/beneficio negativo |
| Mantener status quo (sin charter) | Cero esfuerzo | Deuda crece con cada PR; imposible densidad configurable ni theming | Curita no cura |

---

## Consequences

### Positive

- **Una fuente de verdad de color para componentes no-chart**: cambiar un token actualiza toda la UI excepto gráficos.
- **Escala de spacing verificable en PR review**: `git diff` con `px-[14px]` es un bloqueante automático.
- **Prepara theming multi-tenant**: CSS vars cambian en runtime con una clase en `<html>` — suficiente para marca blanca futura.
- **Densidad configurable sin rediseño**: `density="compact"` en una tabla reduce height de todas las filas.

### Negative / Trade-offs accepted

- **Duplicidad `tailwind.config.ts` ↔ `CHART_PALETTE` persiste**: acepta. Documentada y mitigada con comentarios de sincronización.
- **Migración de hex inline es incremental**: los componentes existentes no se migran en esta PR — quedan como DEBT-028. El charter aplica a componentes nuevos y a los que se toquen en PRs futuras.
- **`token()` tiene coste de `getComputedStyle` por llamada**: mínimo para componentes no-chart. No usar en render loops de Recharts.

### Constraints introduced

- `src/shared/design-system/tokens.ts` es la única vía para leer CSS vars de color desde JS/TSX.
- Todo componente nuevo del DS debe declarar `density` prop si tiene variaciones de padding/height.
- PR reviews deben rechazar hex inline y spacing ad-hoc fuera de escala.

---

## Referencias

- ADR-020 (Plan Maestro UX/UI — Fase 1 encarga este ADR)
- `tailwind.config.ts` — fuente de verdad de la paleta de colores GOBY
- `src/shared/components/charts/ChartWrapper.tsx` — `CHART_PALETTE` con restricción Recharts documentada
- DEBT-028 (hex inline pendientes de migrar — listados en este ADR)
- IBM Carbon Design System — rejilla 4px / 8px como referencia de escala

---

## DEBT-028 — Hex inline pendientes de migrar a tokens

Los siguientes ficheros contienen hex inline identificados en el audit de esta PR. No se migran aquí para mantener el scope. PR futura dedicada.

| Fichero | Hex detectados |
|---|---|
| `AppSidebar.tsx` | `#F0EDE8`, `#3E3B35`, `#2A2822`, `#D4D0C8`, `#6B6864`, `#C8860A`, `#9ca3af` |
| `AlphaLogo.tsx` | `#F0EDE8`, `#1C1A16`, `#64748b`, `#9ca3af` |
| `EngagementSelector.tsx` | `#C8860A`, `#B57609` |
| `ErrorBoundary.tsx` | `#C06060`, `#fff5f5`, `#f9f0f0`, `#666` |
| `PersistenceBanner.tsx` | `#C8860A`, `#B57609` |
| `SegmentedControl.tsx` | `#1C1A16`, `#FFFFFF` (función de contraste — justificado algorítmicamente) |

---

## Execution log

| Fecha | PR / Branch | Cambio |
|---|---|---|
| 2026-06-16 | feat/ds-charter-css-vars | ADR creado — charter aprobado, tokens CSS vars, escala space-*, CHART_PALETTE restante como excepción documentada |
| 2026-06-16 | refactor/ux-ui-adr020-consolidation | `ChartWrapper`: `ariaLabel` obligatoria + `dataTable` opcional. Cierra DEBT-025. `role="img"` en ResponsiveContainer. `LeanBarChart` y `LeanRadarChart` actualizados con `ariaLabel` descriptivo. |

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

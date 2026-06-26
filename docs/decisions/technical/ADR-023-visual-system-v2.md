# ADR-023 — Visual System V2: Obsidian Editorial

| Campo      | Valor                          |
|------------|-------------------------------|
| **Estado** | Aceptado                      |
| **Fecha**  | 2026-06-23                    |
| **Autor**  | Alpha Consulting / GOBY Team  |
| **Tags**   | design-system, ux, adr-021    |

---

## Contexto

La auditoría de paleta realizada en mayo-junio 2026 (documentada en `docs/architecture/VISUAL-SYSTEM-V2.md`) detectó 340+ usos de clases Tailwind frías (`gray-*`, `slate-*`) y de colores rainbow hardcodeados (`#3B82F6`, `#EC4899`, `#7C3AED`, etc.) distribuidos en 38 archivos a lo largo de los módulos T1–T12 y el panel Admin.

Los problemas identificados:

1. **Percepción ejecutiva**: la mezcla de azules, púrpuras y grises fríos rompía la cohesión visual de la paleta "Obsidian Editorial" (warm ink + gold accent) definida en el Sprint 0.
2. **Accesibilidad**: sin tokens semánticos, los cambios de contraste en dark mode eran inconsistentes.
3. **Mantenibilidad**: cada módulo usaba variantes de color propias, sin referencia a un sistema central.
4. **Regresión continua**: sin enforcement automático en ESLint, cualquier PR podía reintroducir clases prohibidas.

El ADR-021 (activo) define los tokens del Design System y prohíbe el uso directo de clases frías, pero no incluía mecanismo de enforcement en CI. Este ADR registra la decisión de migración completa y la activación del enforcement permanente.

---

## Decisión

### 5 reglas del Visual System V2

| # | Regla | Enforcement |
|---|-------|-------------|
| 1 | **Paleta warm-only**: `bg-gray-*` / `text-gray-*` / `border-gray-*` → equivalentes `warm-*`. Prohibido `slate-*`, colores rainbow Tailwind | ESLint `no-restricted-syntax` (className) |
| 2 | **Sombras moderadas**: máximo `shadow-md`. Prohibido `shadow-lg`, `shadow-xl`, `shadow-2xl` | ESLint `no-restricted-syntax` (className) |
| 3 | **Bordes redondeados**: máximo `rounded-xl`. Prohibido `rounded-2xl`, `rounded-3xl` | ESLint `no-restricted-syntax` (className) |
| 4 | **Iconos uniformes**: `strokeWidth={1.5}` en todos los iconos Lucide. Prohibido `strokeWidth={2}` | ESLint `no-restricted-syntax` (JSXAttribute) |
| 5 | **HEX centralizados**: colores HEX en JSX/TSX solo dentro de `chartTokens.ts` o `PDF_PALETTE`. Prohibido HEX inline en className o style en componentes de UI | Revisión manual + grep en CI |

### Migración realizada

- **T2 StakeholderMatrix**: burbujas quadrant → estilo plano con tokens, gray→warm en modales
- **T3 ValueStreamMap**: eliminado violet agéntica, tokenizados scatter/donut rings, slate→warm
- **T6 RiskGovernance**: rainbow AIACT completo → danger/warning/success/warm tokens; `PDF_PALETTE` centraliza HEX para react-pdf
- **Admin (AdminView, UsersTab, ProjectsTab)**: HEX inline → tokens `gold`/`gold-hover`, gray→warm, aria-label en selects
- **ESLint enforcement**: reglas `no-restricted-syntax` activas en `eslint.config.js` con override para `*PDF*.tsx` y `chartTokens.ts`

### Excepciones documentadas

- `*PDF*.tsx` y `policyPdfStyles.ts`: react-pdf no resuelve CSS vars en tiempo de render. Se permite paleta centralizada en `PDF_PALETTE` (objeto TypeScript con HEX literales sincronizados con el DS).
- `chartTokens.ts` y `constants.ts`: Recharts y SVG tampoco resuelven CSS vars. HEX literales permitidos exclusivamente dentro de estos archivos de configuración.

---

## Consecuencias positivas

- **Coherencia visual**: paleta Obsidian Editorial aplicada de forma uniforme en los 12 módulos T1–T12.
- **Percepción ejecutiva**: el dashboard T10 y los PDFs de T6 proyectan consistencia de marca sin distracciones cromáticas.
- **Accesibilidad**: tokens semánticos (`danger-*`, `warning-*`, `success-*`) garantizan coherencia de contraste en light y dark mode.
- **Enforcement permanente**: cualquier PR que introduzca clases prohibidas falla en ESLint, sin necesidad de revisión manual.
- **Mantenibilidad**: un único `chartTokens.ts` y el objeto `PDF_PALETTE` como puntos de verdad para HEX en contextos que no resuelven CSS vars.

---

## Consecuencias negativas

- **Esfuerzo de migración**: ~35h de ingeniería para auditar y migrar 340+ ocurrencias en 38 archivos. Ejecutado como refactor planificado (no urgencia P0).
- **Riesgo de regresión visual**: durante la migración, algunos componentes pueden haber perdido matiz de contraste en estados hover/focus. Requiere QA visual completo en light + dark mode por módulo.
- **Curva de aprendizaje**: contributors nuevos deben aprender la tabla de equivalencias warm-* y los tokens semánticos antes de modificar clases de color.

---

## Alternativas rechazadas

### 1. Mantener paleta rainbow

Mantener los colores existentes (`#3B82F6`, `#7C3AED`, etc.) y solo limpiar los `gray-*` más visibles.

**Rechazada**: la percepción de incoherencia cromática es el problema de raíz. Parchear solo gray-* sin unificar los colores funcionales (danger/warning/success) dejaría el sistema inconsistente.

### 2. Retocar solo los 3 módulos más visibles (T10, T6, T2)

Migración parcial priorizando los módulos que el cliente ve en las demos.

**Rechazada**: los módulos T3 y Admin son usados por consultores Alpha en cada engagement. Dejar deuda visible en T3 (61 HEX) comprometía la coherencia en sesiones de trabajo. La migración completa, aunque más costosa, cierra el ciclo sin deuda pendiente.

### 3. Crear un plugin Tailwind personalizado con alias de colores

Mapear `gray-*` → `warm-*` a nivel de configuración Tailwind para que ambas clases coexistan temporalmente.

**Rechazada**: retrasa la migración real, introduce confusión sobre cuál usar, y no resuelve los HEX hardcodeados ni los colores rainbow. El mapping directo clase-a-clase es más claro y el ESLint enforcement lo hace seguro.

---

## Referencias

- `docs/architecture/VISUAL-SYSTEM-V2.md` — Auditoría completa y tabla de equivalencias
- `src/shared/design-system/charts/chartTokens.ts` — HEX centralizados para SVG/Recharts
- `src/modules/T6_RiskGovernance/PolicyPDF.tsx` — `PDF_PALETTE` para react-pdf
- ADR-021 — Design System Enforcement (reglas base, precede a este ADR)
- `eslint.config.js` — Bloque ADR-021 con `no-restricted-syntax`

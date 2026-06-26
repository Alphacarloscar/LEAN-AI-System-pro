# Visual System V2 — Guía de referencia operativa

Last updated: 2026-06-26
Referenciado desde: [ADR-023](../decisions/technical/ADR-023-visual-system-v2.md)

> Documento de consulta rápida para developers. Si ESLint falla con un mensaje ADR-021,
> esta página contiene la tabla de equivalencias y las excepciones.

---

## A. Contexto

La auditoría de paleta de mayo-junio 2026 detectó 340+ usos de clases frías y colores rainbow
hardcodeados distribuidos en 38 archivos (T1–T12 + Admin + Auth + CompanyProfile).
La migración se ejecutó en la rama `refactor/ux-ui-adr020-consolidation` (16 commits).

---

## B. Tabla de equivalencias de clases

### B.1 Backgrounds

| Clase prohibida | Reemplazar por | Cuándo |
|----------------|----------------|--------|
| `bg-gray-50` | `bg-surface` o `bg-warm-50` | Fondos de pantalla / sección |
| `bg-gray-100` | `bg-warm-100` | Fondos de card secundarios |
| `bg-gray-200` | `bg-warm-200` | Fondos skeleton / dividers |
| `bg-gray-300` | `bg-warm-300` | Separadores visuales |
| `bg-gray-400` | `bg-warm-400` | — |
| `bg-gray-500` | `bg-warm-500` | — |
| `bg-gray-600` | `bg-warm-600` | — |
| `bg-gray-700` | `bg-warm-700` | Inputs dark mode |
| `bg-gray-800` | `bg-warm-800` | Cards dark mode |
| `bg-gray-900` | `bg-warm-900` | Fondos oscuros |
| `bg-slate-*` | `bg-warm-*` | Equivalente numérico |
| `bg-blue-*` | Token semántico (`bg-info/10`) o `bg-warm-*` | — |
| `bg-red-*` | `bg-danger/10` o `bg-danger-light` | Estados de error |
| `bg-green-*` | `bg-success/10` o `bg-success-light` | Estados de éxito |
| `bg-yellow-*` | `bg-warning/10` o `bg-warning-light` | Estados de advertencia |

### B.2 Textos

| Clase prohibida | Reemplazar por |
|----------------|----------------|
| `text-gray-400` | `text-text-subtle` o `text-warm-400` |
| `text-gray-500` | `text-text-muted` o `text-warm-500` |
| `text-gray-600` | `text-warm-600` |
| `text-gray-700` | `text-warm-700` o `text-lean-black` |
| `text-gray-900` | `text-lean-black` |
| `text-slate-*` | `text-warm-*` equivalente |
| `text-blue-*` | `text-info` |
| `text-red-*` | `text-danger` |
| `text-green-*` | `text-success` |

### B.3 Bordes

| Clase prohibida | Reemplazar por |
|----------------|----------------|
| `border-gray-*` | `border-border` (estándar) o `border-warm-*` |
| `border-slate-*` | `border-border` o `border-warm-*` |
| `divide-gray-*` | `divide-border` |

### B.4 Sombras

| Clase prohibida | Reemplazar por |
|----------------|----------------|
| `shadow-lg` | `shadow-md` |
| `shadow-xl` | `shadow-md` |
| `shadow-2xl` | `shadow-md` |

### B.5 Bordes redondeados

| Clase prohibida | Reemplazar por |
|----------------|----------------|
| `rounded-2xl` | `rounded-xl` |
| `rounded-3xl` | `rounded-xl` |

---

## C. Tokens semánticos disponibles

Definidos en `src/index.css` como CSS custom properties:

| Token CSS | Valor light | Uso |
|-----------|------------|-----|
| `--color-gold` | `#C8860A` | Acento de marca, KPIs destacados |
| `--color-navy` | `#2A2822` | Texto oscuro principal |
| `--color-success` | `#5FAF8A` | Estados positivos, indicadores OK |
| `--color-warning` | `#D4A85C` | Advertencias, estados amber |
| `--color-danger` | `#C06060` | Errores, riesgos altos |
| `--color-info` | `#9BB5D9` | Información, links |
| `--color-surface` | `#F7F4EE` | Fondo general de la app |
| `--color-border` | `rgba(42,40,34,0.12)` | Bordes estándar |

Clases Tailwind correspondientes (configuradas en `tailwind.config.ts`):
`bg-gold`, `text-gold`, `border-gold`, `bg-success`, `text-danger`, `bg-warning`, `bg-surface`, `border-border`, etc.

---

## D. Colores para gráficos Recharts

**Regla:** Recharts y SVG **no resuelven** CSS vars en props de datos (fill, stroke, color). Usar siempre `chartTokens.ts`.

```typescript
import { getThemeColor, DEPT_COLORS, ROGERS_SEGMENT_COLORS } from '@shared/design-system/charts/chartTokens'

// En componente Recharts:
<Bar fill={getThemeColor('success')} />
<Cell fill={DEPT_COLORS.it} />
```

**Paletas disponibles en `src/shared/design-system/charts/chartTokens.ts`:**

| Export | Uso |
|--------|-----|
| `getThemeColor(token)` | HEX desde token semántico (con fallback SSR) |
| `QUADRANT_COLORS` | T2 StakeholderMatrix — 4 cuadrantes |
| `T3_QUADRANT_COLORS` | T3 ValueStreamMap — ejes y labels del scatter |
| `T3_VALUE_BAR_COLORS` | T3 — barras de value contribution (alta/media/baja/nula) |
| `T3_VALUE_ACTIVE_BG` | T3 — fondos activos de las barras |
| `ROGERS_SEGMENT_COLORS` | T7/T10 — curva de Rogers (innovadores/early/rezagados) |
| `DOMAIN_COLORS` | T5/T10 — 6 dominios IA |
| `DEPT_COLORS` | T5/T7/T8/T10 — 10 departamentos |
| `DEPT_ADOPTION_COLORS` | T10 DeptBar — 3 segmentos adopción |
| `MONO_STATUS_COLORS` | Leyendas de 4 estados (gold→warm-200) |
| `CHART_SERIES_COLORS` | Series genéricas multi-chart (10 colores) |
| `getHeroColor(score?)` | Interpolación RGB warm-neutral→gold para KPIs |
| `getGoldRgb(alpha?)` | `rgb(200 134 10 / alpha)` para Recharts gradients |
| `getNavyRgb(alpha?)` | `rgb(42 40 34 / alpha)` para fondos dark |

---

## E. Excepciones documentadas

### E.1 Archivos PDF (`*PDF*.tsx`, `policyPdfStyles.ts`)

react-pdf no resuelve CSS vars en tiempo de render server-side. Se permiten HEX literales
centralizados en el objeto `PDF_PALETTE` dentro de `src/modules/T6_RiskGovernance/PolicyPDF.tsx`.

```typescript
// ✅ CORRECTO — HEX en PDF_PALETTE
const PDF_PALETTE = { gold: '#C8860A', danger: '#C06060', ... }
```

### E.2 `chartTokens.ts` y `constants.ts`

Recharts no resuelve CSS vars en props SVG. HEX literales permitidos exclusivamente
dentro de `src/shared/design-system/charts/chartTokens.ts`. Fuente de verdad única.

---

## F. Enforcement ESLint activo

Configurado en `eslint.config.js`, bloque `// ADR-021`:

| Regla | Selector | Mensaje |
|-------|----------|---------|
| Clases frías | `className` con `(bg\|text\|border)-(gray\|slate\|red\|blue\|...)` | "Usar tokens warm-* o semánticos" |
| Sombras excesivas | `className` con `shadow-(lg\|xl\|2xl)` | "Máximo shadow-md" |
| Bordes exagerados | `className` con `rounded-(2xl\|3xl)` | "Usar rounded-xl" |
| strokeWidth erróneo | `strokeWidth={2}` en JSX | "Usar strokeWidth={1.5}" |

**Overrides (no aplica la regla):**
- `src/**/*PDF*.tsx` — componentes react-pdf
- `src/**/*PDF*.ts` — estilos PDF
- `src/**/chartTokens.ts` — HEX canónicos para SVG

**Cómo verificar localmente:**
```bash
npm run lint
# o solo el bloque ADR-021:
npx eslint src --rule '{"no-restricted-syntax": "error"}'
```

---

## G. Archivos migrados en esta PR (38 archivos, 340+ ocurrencias)

| Módulo | Archivos | Cambios principales |
|--------|----------|---------------------|
| T1_MaturityRadar | 3 | `text-[10px]` → `text-xs`, `rounded-2xl` → `rounded-xl` |
| T2_StakeholderMatrix | 4 | Burbujas quadrant → tokens, gray→warm en modales |
| T3_ValueStreamMap | 6 | violet agéntica eliminado, scatter/donut rings tokenizados, slate→warm |
| T4_UseCasePriorityBoard | 3 | UseCaseDetailPanel, EconomicsTab — HEX → `getThemeColor()` |
| T5_AITaxonomyCanvas | 5 | PortfolioMatrix, DomainCard — DOMAIN_COLORS aplicado |
| T6_RiskGovernance | 4 | Rainbow AIACT → danger/warning/success; PDF_PALETTE creado |
| T7_AdoptionHeatmap | 3 | BellCurveTab — ROGERS_SEGMENT_COLORS |
| T8_CommunicationMap | 4 | ArchetypeMessages, Materials, Timeline |
| T9_AIRoadmap | 2 | GanttRowItem — tipografía normalizada |
| T10_AIValueDashboard | 5 | chartTokens integrado en 5 paneles, DashboardHeader eliminado |
| T11_OperatingRhythm | 2 | AdaptiveModeBadge, badges gray→warm |
| T12_ISOAssessment | 3 | ControlCard, constants.ts — semáforo danger/warning/success |
| Auth | 3 | LoginView, ResetPasswordView, UpdatePasswordView |
| Admin | 4 | AdminView, UsersTab, CompaniesTab, ProjectsTab |
| CompanyProfile | 4 | FrictionCard, EmpresaTab, ProyectoTab, index |
| shared/design-system | 2 | ChartWrapper, componentes base |
| App/main/index.css | 3 | Tokens CSS vars expandidos, escala tipográfica |

**Nuevos archivos creados:**
- `src/shared/design-system/charts/chartTokens.ts` — fuente de verdad HEX para Recharts
- `src/shared/design-system/charts/domainIcons.tsx` — mapa canónico Lucide por dominio IA
- `src/shared/components/UnsavedChangesModal.tsx` — modal guard de cambios sin guardar

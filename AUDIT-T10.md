# AUDIT-T10.md — Dashboard T10 UI Audit
> UI Auditor · Read-only · 2026-06-22
> Módulo: `src/modules/T10_AIValueDashboard/` · 21 archivos · 965 líneas totales

---

## 1. INVENTARIO DE ARCHIVOS

| Archivo | Líneas | Rol |
|---------|--------|-----|
| `T10View.tsx` | 314 | Vista principal — orquesta los 6 paneles |
| `index.ts` | 2 | Export barrel |
| `t10ContextBuilder.ts` | 120 | Helper — construye contexto para LLM |
| `demo-data.ts` | 112 | Helper — datos de demo/mock |
| `components/PanelCard.tsx` | 86 | **Base card compartida** — wrapper de los 6 KPI |
| `components/EmptyStates.tsx` | 92 | Componente — estados vacíos por panel |
| `components/DashboardHeader.tsx` | 61 | Componente — header del dashboard |
| `components/HeroMetric.tsx` | 31 | Helper — métrica principal de cada card |
| `components/DonutChart.tsx` | 37 | Helper — SVG donut chart |
| `components/StatusBar.tsx` | 21 | Helper — barra horizontal segmentada |
| `components/MetricChip.tsx` | 17 | Helper — chip de métrica secundaria |
| `components/ExpandedSection.tsx` | 9 | Helper — wrapper de animación expand |
| `components/DimBar.tsx` | 17 | Helper — barra de dimensión (T1) |
| `components/DeptBar.tsx` | 24 | Helper — barra de adopción por dept (T3) |
| `components/NavButton.tsx` | 22 | Helper — botón de navegación a tool |
| `components/panels/P1MaturityPanel.tsx` | 96 | Card KPI — T1 Readiness |
| `components/panels/P2PortfolioPanel.tsx` | 75 | Card KPI — T4 Portfolio IA ★ |
| `components/panels/P3AdoptionPanel.tsx` | 95 | Card KPI — T2+T7 Adopción |
| `components/panels/P4EcosystemPanel.tsx` | 83 | Card KPI — T3 Ecosistema |
| `components/panels/P5RiskPanel.tsx` | 106 | Card KPI — T6+T12 Riesgos |
| `components/panels/P6GovernancePanel.tsx` | 81 | Card KPI — T8+T9+T11 Gobierno |

**Dependencias externas de T10 en shared/:**
- `src/shared/design-system/components/Card.tsx` — base de `PanelCard`
- `src/shared/design-system/components/Badge.tsx` — tags de cada panel
- `src/shared/components/RecommendationPanel.tsx` — panel de IA en T10View

---

## 2. TABLA MAESTRA POR TARJETA KPI

### P1 — Madurez IA (T1 · AI Readiness)

| Campo | Valor |
|-------|-------|
| **Componente** | `P1MaturityPanel` — `src/modules/T10_AIValueDashboard/components/panels/P1MaturityPanel.tsx` |
| **Tag color** | `tagColor="warning"` → Badge `'warning'` → `bg-warning-light` `#FAF0D7` / `text-warning-dark` `#D4A85C` |
| **Barra DimBar** | `color="var(--color-gold)"` → `#C8860A` |
| **Barra IT (expand)** | `bg-gold` → `#C8860A` |
| **Barra Negocio (expand)** | `bg-info` → `#9BB5D9` |
| **Métrica IT (expand)** | `text-gold` → `#C8860A` |
| **Métrica Negocio (expand)** | `text-info-dark` → `#6A90C0` |
| **Badge tier (expand)** | Condicional: `avg < 2` → `warning`; `avg ≥ 2` → `info` |
| **¿Expandible?** | ✓ |
| **Contenido expand** | Comparativa IT vs Negocio con barras + porcentajes · Badge de tier de madurez · Nº de entrevistas · Dimensión más débil · Botón "Abrir T1 Assessment" |

---

### P2 — Portfolio IA ★ FEATURED (T4)

| Campo | Valor |
|-------|-------|
| **Componente** | `P2PortfolioPanel` — `src/modules/T10_AIValueDashboard/components/panels/P2PortfolioPanel.tsx` |
| **Tag color** | `tagColor="success"` → Badge `'success'` → `bg-success-light` `#D4EDE3` / `text-success-dark` `#5FAF8A` |
| **Borde superior destacado** | `featured=true` → `borderTop: '2px solid #C8860A'` (inline style, hardcodeado) |
| **MetricChip ahorro anual** | `valueColor="var(--color-success)"` → `#86C7A8` |
| **MetricChip ROI 3 años** | `valueColor="var(--color-gold)"` → `#C8860A` |
| **Segmentos StatusBar** | Activas: `#86C7A8` · Validando: `#E8C281` · Backlog: `#9BB5D9` · Paradas: `#C4C0B8` (todos HEX hardcodeados en T10View.tsx:242–247) |
| **ROI text (expand)** | `text-success-dark` → `#5FAF8A` |
| **Badges iniciativas (expand)** | `active` → `'success'` · otros → `'warning'` |
| **¿Expandible?** | ✓ |
| **Contenido expand** | Top 3 iniciativas con badge de estado + valor de inversión · ROI estimado · Botón T4 Portfolio |

---

### P3 — Adopción (T2 + T7)

| Campo | Valor |
|-------|-------|
| **Componente** | `P3AdoptionPanel` — `src/modules/T10_AIValueDashboard/components/panels/P3AdoptionPanel.tsx` |
| **Tag color** | `tagColor="info"` → Badge `'info'` → `bg-info-light` `#DDE8F5` / `text-info-dark` `#6A90C0` |
| **DeptBar segmento Innovadores** | `bg-success` → `#86C7A8` |
| **DeptBar segmento Early Majority** | `bg-info` → `#9BB5D9` |
| **DeptBar segmento Rezagados** | `bg-warm-100` → `#C4C0B8` |
| **Caja Shadow AI (border)** | `border-l-gold` → `#C8860A` |
| **Caja Shadow AI (icono + pct)** | `text-gold` → `#C8860A` |
| **Caja Shadow AI (barra fill)** | `bg-gold` → `#C8860A` |
| **Change score (expand)** | `text-info-dark` → `#6A90C0` |
| **¿Expandible?** | ✓ |
| **Contenido expand** | Change score y fase Rogers · Caja de alerta Shadow AI (si existe) · Botones T2 y T7 |

---

### P4 — Ecosistema IA (T3)

| Campo | Valor |
|-------|-------|
| **Componente** | `P4EcosystemPanel` — `src/modules/T10_AIValueDashboard/components/panels/P4EcosystemPanel.tsx` |
| **Tag color** | `tagColor="purple"` → **NO es variante de Badge** → inline style: `{ backgroundColor: '#EEEDFE', color: '#3C3489' }` (hardcodeado en PanelCard.tsx:17–19) |
| **Donut chart** | Colores dinámicos de `t3data.aiTypes`, mapeados desde `AI_CAT_META` (T10View.tsx:43–48): `automatizacion_inteligente` `#86C7A8` · `analitica_predictiva` `#9BB5D9` · `automatizacion_rpa` `#E8C281` · `asistente_ia` `#C8860A` — todos HEX hardcodeados |
| **Caja bottleneck (border)** | `border-l-[#7F77DD]` — **HEX arbitrario** sin token |
| **MetricChip opp crítica** | `valueColor="var(--color-danger-dark, #C06060)"` |
| **MetricChip opp alta** | `valueColor="var(--color-warning-dark, #D4A85C)"` |
| **¿Expandible?** | ✓ |
| **Contenido expand** | Procesos mapeados / total · Niveles de oportunidad (crítica vs alta) · Botón T3 |

---

### P5 — Riesgos (T6 + T12)

| Campo | Valor |
|-------|-------|
| **Componente** | `P5RiskPanel` — `src/modules/T10_AIValueDashboard/components/panels/P5RiskPanel.tsx` |
| **Tag color** | `tagColor="danger"` → Badge `'danger'` → `bg-danger-light` `#F5DEDE` / `text-danger-dark` `#C06060` |
| **Risk segments** | Alto: `#D85A30` · Medio: `#EF9F27` · Bajo: `#97C459` (HEX hardcodeados en T10View.tsx:250–254) |
| **Dot indicador alto** | `bg-danger` → `#D89090` · texto: `text-danger-dark` → `#C06060` |
| **Dot indicador medio** | `bg-warning` → `#E8C281` · texto: `text-warning-dark` → `#D4A85C` |
| **Dot indicador bajo** | `bg-success` → `#86C7A8` · texto: `text-success-dark` → `#5FAF8A` |
| **ISO barra fill** | `bg-gold` → `#C8860A` |
| **ISO label** | `text-gold` → `#C8860A` |
| **Shadow AI (icono + pct)** | `text-gold` condicional: si `pct > 0` gold, si no `text-text-muted` |
| **Shadow AI barra** | `bg-gold` → `#C8860A` |
| **¿Expandible?** | ✓ |
| **Contenido expand** | Tabla de resumen de riesgos (si hasData) · Métricas ISO 42001 · Detalle Shadow AI · Botones T6 y T12 |

---

### P6 — Gobierno (T8 · T9 · T11)

| Campo | Valor |
|-------|-------|
| **Componente** | `P6GovernancePanel` — `src/modules/T10_AIValueDashboard/components/panels/P6GovernancePanel.tsx` |
| **Tag color** | `tagColor="amber"` → Badge `'warning'` → `bg-warning-light` `#FAF0D7` / `text-warning-dark` `#D4A85C` |
| **Event level direction** | `var(--color-gold)` → `#C8860A` (estratégico) |
| **Event level program** | `var(--color-info)` → `#9BB5D9` (programa) |
| **Event level team** | `var(--color-success)` → `#86C7A8` (equipo) |
| **Fallback color evento** | `#C8860A` — hardcodeado (P6GovernancePanel:52) |
| **MetricChip casos GO** | `valueColor="var(--color-gold)"` → `#C8860A` |
| **MetricChip riesgo alto** | `valueColor="var(--color-danger-dark, #C06060)"` → `#C06060` |
| **¿Expandible?** | ✓ |
| **Contenido expand** | Lista de eventos de governance con indicador de nivel · MetricChip resumen (GO, candidatos, completados, riesgo) · Botones T11, T9, T8 |

---

## 3. COLOR ENCODING SEMÁNTICO

### 3.1 Función principal: `heroColor(score)` — `HeroMetric.tsx`

Decide el color del número grande de cada card en función del score:

```
score === null  → #C8860A  (gold — neutro, sin datos)
score < 30      → #C05035  (rojo oscuro custom)
30 ≤ score < 60 → #C8860A  (gold — warning)
score ≥ 60      → #2A7A52  (verde oscuro custom)
```

> **Problema:** `#C05035` y `#2A7A52` son HEX hardcodeados que **no corresponden a ningún token del sistema de diseño**. Son versiones más oscuras/saturadas de `danger` y `success` respectivamente, pero invisibles para el sistema de tokens.

---

### 3.2 Umbrales de riesgo — `T10View.tsx:212–214`

```
aiRisk > 60          → Alto  → color #D85A30
30 ≤ aiRisk ≤ 60     → Medio → color #EF9F27
aiRisk < 30          → Bajo  → color #97C459
```

> **Problema:** Estos tres colores (`#D85A30`, `#EF9F27`, `#97C459`) son distintos de los tokens `danger`/`warning`/`success` del sistema. La escala semántica tiene **dos paletas paralelas** de riesgo: una para texto/badges (tokens DS) y otra para los segmentos del donut (HEX custom).

---

### 3.3 Badge de tier de madurez — `P1MaturityPanel.tsx:82`

```
avg < 2   → Badge variant='warning'   (#FAF0D7 / #D4A85C)
avg ≥ 2   → Badge variant='info'      (#DDE8F5 / #6A90C0)
```

Umbral único: `2.0` sobre escala 0–4.

---

### 3.4 Fase Rogers — `T10View.tsx:169`

```
activePercent > 50  → 'Early Majority'
activePercent ≤ 50  → 'Early Adopters'
```

Solo texto; sin color encoding.

---

### 3.5 AI Category → Color — `T10View.tsx:43–48` (hardcoded)

```
automatizacion_inteligente → #86C7A8  (verde)
analitica_predictiva       → #9BB5D9  (azul)
automatizacion_rpa         → #E8C281  (ámbar)
asistente_ia               → #C8860A  (gold)
```

No hay utilidades de mapeo en `src/shared/`. Toda la lógica de color encoding **está embebida inline** en los componentes y en T10View.tsx.

---

## 4. ARQUITECTURA DE COMPONENTES — ¿BASE COMPARTIDA O AD-HOC?

### Respuesta: **Base compartida — `PanelCard.tsx`**

Los 6 KPI no son ad-hoc. Todos comparten la misma cadena de composición:

```
src/shared/design-system/components/Card.tsx
  └─ PanelCard.tsx (T10-specific base)
       ├─ Badge.tsx (DS)
       ├─ HeroMetric.tsx (T10-specific)
       ├─ ExpandedSection.tsx (T10-specific)
       └─ [children ad-hoc por panel]
            ├─ P1: DimBar
            ├─ P2: StatusBar + MetricChip
            ├─ P3: DeptBar + MetricChip
            ├─ P4: DonutChart + MetricChip
            ├─ P5: DonutChart + StatusBar + MetricChip
            └─ P6: MetricChip + event list
```

**`PanelCard` props relevantes para rediseño:**

| Prop | Tipo | Notas |
|------|------|-------|
| `featured` | `boolean` | Solo P2 — añade borde superior gold y fondo gradiente sutil |
| `tagColor` | `'warning' \| 'success' \| 'info' \| 'danger' \| 'purple' \| 'amber'` | `'purple'` y `'amber'` son especiales: no usan Badge variant sino inline style |
| `expanded` | `boolean` | Controlado desde T10View (solo uno abierto a la vez) |
| `animDelay` | `number` | Entrada escalonada — CSS animation delay |
| `heroSlot` | `ReactNode` | Slot para `HeroMetric` |

**Estado expandido (T10View.tsx):** un único `useState<string | null>` con toggle exclusivo. Solo un panel puede estar abierto simultáneamente.

---

## 5. HALLAZGOS

### H1 — Doble paleta de riesgo (inconsistencia semántica grave)

El sistema de diseño define `danger` (`#D89090`), `warning` (`#E8C281`), `success` (`#86C7A8`) para texto y badges. Pero el donut chart y los segmentos de riesgo usan `#D85A30`, `#EF9F27`, `#97C459` — colores distintos, más saturados, sin token. Una escala semántica rota en dos dialectos.

### H2 — `heroColor()` con HEX fuera del sistema

`#C05035` (rojo HeroMetric) y `#2A7A52` (verde HeroMetric) no existen en `tailwind.config.ts` ni en ningún CSS var. Son valores fantasma. Si la paleta cambia, estos quedan huérfanos.

### H3 — Tag `'purple'` y `'amber'` bypass el Badge DS

P4 y P6 no pueden usar el Badge de DS porque no existe variante `purple` ni `amber`. Resuelven con `PanelCard.TAG_INLINE_STYLE`, un objeto de override en el propio base component. El parche está dentro de la base, lo que acopla la base a los casos especiales de los hijos.

### H4 — `border-l-[#7F77DD]` sin token (P4 bottleneck box)

El borde lateral del cuadro de bottleneck usa un valor arbitrario `[#7F77DD]`. No hay token `purple` en el sistema. Relacionado con H3.

### H5 — 4 colores HEX hardcodeados en `t4Segments` (T10View.tsx:242–247)

Los segmentos del StatusBar de P2 usan `{ color: '#86C7A8' }` en lugar de `var(--color-success)`. Si el token `success` cambia en el design system, estos segmentos no se actualizan.

### H6 — Lógica de color encoding sin centralizar

No existe ninguna función utilitaria en `src/shared/` que mapee score → color. Cada componente (HeroMetric, P1, P5, T10View) embebe su propia lógica. Un cambio de umbral o de paleta requiere editar 5+ archivos.

### H7 — `AI_CAT_META` en T10View con HEX directos

El mapa de categorías AI → color está en el tope de `T10View.tsx` como constante local con HEX hardcodeados. Si se añade una nueva categoría de AI en el catálogo, hay que actualizar T10View manualmente.

---

## Resumen para rediseño

| Área | Estado | Acción recomendada |
|------|--------|-------------------|
| Base card compartida | ✓ Existe `PanelCard` | Mantener — es la palanca de cambio más rentable |
| Color encoding centralizado | ✗ Disperso en 5+ archivos | Extraer a `src/shared/utils/scoreColor.ts` |
| Paleta de riesgo | ✗ Dos dialectos | Unificar donut colors con tokens DS |
| HeroMetric colors | ✗ HEX fuera del sistema | Tokenizar `#C05035` → `danger-saturated`, `#2A7A52` → `success-saturated` |
| Tag purple/amber | ✗ Inline override en base | Añadir variantes al Badge DS o crear `TagBadge` separado |
| Expandir / colapsar | ✓ Un panel a la vez | Mantener patrón — considerar animación más pronunciada |
| Featured P2 | ✓ Flag en PanelCard | Mantener — diferenciador visual correcto |

---

*Auditoría realizada en modo solo-lectura. Ningún archivo fue modificado.*
*Scope: `src/modules/T10_AIValueDashboard/` — 21 archivos, 965 líneas.*

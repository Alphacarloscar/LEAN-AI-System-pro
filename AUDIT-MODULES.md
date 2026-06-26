# GOBY — UX Module Audit: Visual Density & Cognitive Load
**Fecha:** 2026-06-22 | **Rama:** `refactor/ux-ui-adr020-consolidation`  
**Auditor:** Claude Code · Senior UX Auditor (static analysis only — no code modified)  
**Scope:** src/modules/T1_* → T12_* (12 módulos, 105 archivos .tsx, ~13.862 líneas)

---

## LEYENDA DE FLAGS

| Flag | Significado |
|---|---|
| 🔴 | Violación crítica del Design System |
| 🟠 | Deuda visual alta — impacto en coherencia |
| 🟡 | Atención media — deuda acumulable |
| ⚫ | Patrón de anidamiento problemático (UX) |
| 📐 | Archivo >500 líneas (ADR-013 violation) |
| 🌈 | Rainbow fills saturados prohibidos |
| 💉 | HEX hardcodeados (fuera de token system) |
| 📌 | Inline styles con valores mágicos |
| 🔲 | Sombras pesadas prohibidas (shadow-lg/xl/2xl) |
| ❄️ | Paleta fría (gray/slate) sin undertone warm |

---

## TABLA MAESTRA

| Módulo | TSX / Líneas | Familias color | HEX | Inline styles | Rainbow bg | Gray/slate ❄️ | Cards | Badges | Icono uses | Gráficos | Sombras | Flags |
|--------|-------------|----------------|-----|---------------|------------|----------------|-------|--------|------------|----------|---------|-------|
| **T1** MaturityRadar | 9 / 1.808 | amber, gray, red | 23 | 8 | 3 | bg-gray × ≥6 files | 0 | 2 | 2 | SVG spider (custom) | shadow-sm ×3 | 💉🟠❄️ |
| **T2** StakeholderMatrix | 10 / 2.121 | amber, gray, red | 36 | 16 | 2 | bg-gray × ≥5 files | 0 | 4 | 18 | SVG custom quad chart | — | 💉🟠❄️📌 |
| **T3** ValueStreamMap | 12 / 2.234 | amber, gray, red | 61 | 21 | 2 | bg-gray × ≥6 files | 7 | 8 | 25 | SVG donut + scatter (custom) | shadow-sm ×3, **shadow-lg ×2** | 🔴💉❄️📌🔲⚫ |
| **T4** UseCasePriorityBoard | 14 / 2.746 | amber, gray, red | 24 | 26 | 2 | bg-gray × varios | 14 | 8 | 23 | SVG matrix (custom) | shadow-sm ×3, shadow-md ×1, shadow-lg ×1 | 📐🟠📌⚫🔲 |
| **T5** AITaxonomyCanvas | 9 / 1.269 | amber, blue, emerald, gray, slate | 16 | 29 | 3 (blue-900, emerald-900, slate) | bg-slate × 4 | 11 | 6 | 15 | CSS progress bars (custom) | **shadow-xl ×1**, shadow-sm ×1 | 🔴🌈❄️📌🔲 |
| **T6** RiskGovernance | 4 / 1.134 | amber, gray, orange, red | 14 | **77** | **6** | bg-gray × varios | 2 | 3 | 22 | — (PDF only) | shadow-sm ×1 | 🔴📌🌈 (PolicyPDF dom.) |
| **T7** AdoptionHeatmap | 7 / 1.074 | amber, gray, red, slate | 16 | 13 | 3 | bg-slate × varios | 8 | 3 | 5 | SVG bell curve (custom) | shadow-sm ×3 | 🟠💉❄️📌 |
| **T8** CommunicationMap | 6 / 755 | amber, emerald, gray, indigo, orange, red, slate | 11 | 3 | 4 | bg-slate × varios | 13 | 6 | 19 | CSS bars via state (custom) | — | 🔴🌈❄️ **sw=2 ×43** |
| **T9** AIRoadmap | 3 / 708 | gray (solo) | 1 | 20 | 0 | bg-gray × varios | 3 | 5 | 3 | Gantt (CSS grid, custom) | — | 🟠📌❄️ **focus:blue ×2** |
| **T10** AIValueDashboard | 18 / 1.269 | gray (solo Tailwind) | 34 | 19 | 0 | bg-gray × 34 HEX | 6 | 3 | 38 | SVG donut ×2, LeanRadarChart ×2, StatusBar, DeptBar, DimBar | shadow + shadow-sm + shadow-md + **shadow-lg ×1** | 🟠💉❄️🔲 |
| **T11** OperatingRhythm | 10 / 1.027 | amber, blue, emerald, gray, red | 11 | 23 | **14** | bg-gray × varios | 5 | 1 | 10 | LeanRadarChart ×1 | shadow-sm ×2, **shadow-xl ×1** | 🔴🌈📌🔲 |
| **T12** ISOAssessment | 3 / 517 | gray, green, violet | 2 | 10 | 1 | bg-gray × 11 | 2 | 0 | 2 | — | shadow-sm ×2, shadow-lg ×1 | 🟠🌈❄️ |

---

## RANKING DE PRIORIDAD DE REDISEÑO

| Prioridad | Módulo | Score de deuda¹ | Razón principal |
|---|---|---|---|
| 🔴 **1** | T6 RiskGovernance | 77+6 inline/rainbow | PolicyPDF con 67 inline styles; rainbow fills en tabs |
| 🔴 **2** | T8 CommunicationMap | 43 sw=2 violations | Icon map completo con strokeWidth=2 hardcodeado |
| 🔴 **3** | T11 OperatingRhythm | 14 rainbow + shadow-xl | AdaptiveModeBadge flooea 14 clases saturadas |
| 🔴 **4** | T5 AITaxonomyCanvas | shadow-xl + blue/slate | 5 familias de color; paleta fría + shadow-xl |
| 🟠 **5** | T3 ValueStreamMap | 61 HEX + shadow-lg | Módulo más HEX del sistema; paleta fría infiltrada |
| 🟠 **6** | T4 UseCasePriorityBoard | 26 inline + 1 archivo >500L | EconomicsTab supera ADR-013; tabs anidados |
| 🟡 **7** | T2 StakeholderMatrix | 36 HEX + 16 inline | Densidad media; sin errores graves |
| 🟡 **8** | T10 AIValueDashboard | 34 HEX + shadow-lg | 18 archivos bien distribuidos; HEX en charts |
| 🟡 **9** | T1 MaturityRadar | 23 HEX | Más limpio del sistema; SpiderChart con HEX necesarios |
| 🟡 **10** | T7 AdoptionHeatmap | 16 HEX + slate | Deuda moderada; bell curve custom bien construida |
| 🟡 **11** | T9 AIRoadmap | 20 inline + focus:blue | Gantt con colores via JS variable — justificable |
| 🟡 **12** | T12 ISOAssessment | violet + gray + shadow-lg | Módulo pequeño; violet no pertenece a la paleta |

¹ *Score orientativo: suma ponderada de HEX, inline styles, rainbow fills y violaciones de stroke.*

---

## ANÁLISIS DETALLADO POR MÓDULO

### T1 — MaturityRadar
**Qué hace:** Evaluación de madurez IA por dimensiones mediante entrevistas. Renderiza un radar chart SVG interactivo (`T1SpiderChart`) con 9 dimensiones, panel ejecutivo con texto generado por LLM, y un modal de nueva entrevista. Es el módulo de entrada al flujo de diagnóstico.

**Problema visual:** El radar chart usa 18 HEX hardcodeados directamente en la lógica de pintado SVG — `strokeWidth` y colores de área se calculan en JS puro, lo que es técnicamente inevitable pero implica que los tokens warm no se pueden aplicar sin refactorizar el renderer. La escala `gray-*` aparece en `DimensionCard` e `ITBizGapSection` para fondos de sección (14 ocurrencias de `bg-gray-*`), dando un tono frío que contrasta con la paleta ivory del sistema. Sin modales anidados ni tabs — estructura limpia.

**Prioridad de rediseño: Baja.** Acción puntual: reemplazar `bg-gray-*` por equivalentes `warm-*` en DimensionCard e ITBizGapSection. El SpiderChart requiere una refactorización mayor pero no es urgente.

---

### T2 — StakeholderMatrix
**Qué hace:** Mapeo de stakeholders en un cuadrante de influencia/adopción IA. Incluye un `StakeholderQuadrantChart` SVG custom con 4 sectores coloreados y jitter anti-solapamiento, un panel lateral de detalle, modal de entrevista (455 líneas — el mayor del módulo), y modal de importación desde T1. Visualiza arquetipos con colores semánticos.

**Problema visual:** 36 HEX hardcodeados de los cuales muchos son versiones soft de los tokens semánticos (`#FAF0D7`, `#D4EDE3`, `#F5DEDE`) que no tienen CSS var propia — se hardcodean porque `success-light`, `warning-light` y `danger-light` existen en `tailwind.config.ts` pero no como `--color-*` en index.css. El `StakeholderQuadrantChart` usa colores por cuadrante via JS, patrón aceptable pero sin mapear a tokens. 16 inline styles mayoritariamente para posicionamiento de nodos — justificable en chart, no en el panel lateral.

**Prioridad de rediseño: Media.** Acción: añadir CSS vars para `--color-success-light`, `--color-warning-light`, `--color-danger-light` en `:root` y sustituir los HEX soft. El cuadrante SVG es robusto y correcto.

---

### T3 — ValueStreamMap
**Qué hace:** Mapeo de procesos de negocio con categorización IA. Flujo wizard en 3 fases (Interview → ProcessForm → Result). Incluye dos visualizaciones custom: `HeroCategoryDonut` (SVG donut segmentado) y `HeroOpportunityMatrix` (scatter SVG con 4 cuadrantes de priorización). El `ProcessDetailPanel` tiene Tabs propios que se abren desde `T3View` — patrón de panel lateral con sub-navegación.

**Problema visual:** Con 61 HEX hardcodeados es el módulo más contaminado del sistema. Los valores incluyen `#E5E7EB` (gray-200 frío, ×8), `#94A3B8` (slate-400, ×6), `#9AAEC8` (sin token), y colores de cuadrante como `#5FAF8A`/`#D4A85C`/`#9AAEC8`/`#94A3B8` hardcodeados en el scatter chart. Las sombras `shadow-lg ×2` violan el límite de `shadow-md`. El panel lateral con Tabs propios crea un patrón de anidamiento implícito (T3View → ProcessDetailPanel → Tabs).

**Prioridad de rediseño: Alta.** El scatter matrix es el componente más visualmente rico del sistema y sus colores de cuadrante deben tokenizarse. Acción inmediata: eliminar `#E5E7EB`/`#94A3B8` y mapear a `warm-*`. El `shadow-lg` en `StagesTab` y `T3View` debe bajar a `shadow-sm`.

---

### T4 — UseCasePriorityBoard
**Qué hace:** Tablero de priorización de casos de uso IA con una `PriorityMatrix` 2×2 (Impact vs Feasibility), scoring multidimensional, clasificación por EU AI Act, economía del caso, y roadmap trimestral. Es el módulo más grande (14 archivos, 2.746 líneas). `EconomicsTab.tsx` supera las 500 líneas (545) — viola ADR-013.

**Problema visual:** `UseCaseDetailPanel` abre un Tabs propio dentro de un panel lateral que se dispara desde `T4View` — creando dos niveles de navegación simultáneos en pantalla sin jerarquía visual clara. 26 inline styles distribuidos en 8+ archivos; `EconomicsTab` usa principalmente clases `warm-*` (correcto) pero con `gray-200` y `gray-300` interpoladas. 14 `<Card>` references sugieren anidamiento elevado pero sin evidencia de Card > Card profundo. `AIActClassificationModal` importa y renderiza `<Modal>` dentro de un panel ya visible — posible confusión de profundidad modal.

**Prioridad de rediseño: Alta.** Acción: extraer EconomicsTab en sub-componentes (<300L cada uno). Revisar el patrón UseCaseDetailPanel + Tabs → considerar un drawer de pantalla completa en lugar de panel lateral con tabs internos.

---

### T5 — AITaxonomyCanvas
**Qué hace:** Canvas visual de dominos IA organizados en categorías (Automatización, Predicción, NLP, etc.). `PortfolioMatrix` (404 líneas, el componente más grande del módulo) muestra una matriz 2D de proyectos por madurez. 3 modales: `EditModal`, `DomainProjectsModal`, `DeptCategoryModal`. Barras de progreso CSS custom via `T5DimBars` (HEX desde constants).

**Problema visual:** Es el módulo con mayor diversidad de familias de color: amber, blue, emerald, gray, slate — 5 paletas distintas. `bg-blue-900` y `bg-emerald-900` en `DomainCard` son fills de fondo saturados sobre dark mode, violando §2.3 del Design System. `bg-slate-800` y `bg-slate-50` llevan la paleta fría. La `shadow-xl` en `PortfolioMatrix` es la violación de sombra más severa del módulo. `T5DimBars` hardcodea colores via `cfg.hex` desde constants — patrón intencionado para chart pero sin mapearse a chartTokens. 29 inline styles es la mayor densidad por tamaño de módulo (1.269 líneas / 29 = 1 inline cada 44 líneas).

**Prioridad de rediseño: Alta.** Acción: sustituir `bg-blue-900`/`bg-emerald-900` por `bg-warm-700`/`bg-warm-600` con border-left accent semántico. Bajar `shadow-xl` → `shadow-sm`. Eliminar `slate-*` completamente.

---

### T6 — RiskGovernance
**Qué hace:** Dashboard de riesgos IA con dos tabs: `RiskDashboardTab` (visualización de riesgos por categoría) y `PolicyTab` (generación de política de gobernanza). `PolicyPDF.tsx` (308 líneas) genera un PDF con estilos inline que se inyectan como HTML estático para export.

**Problema visual:** `PolicyPDF.tsx` concentra **67 inline styles** — el récord absoluto del sistema. Aunque los PDF requieren estilos inline (las clases Tailwind no se exportan), los colores hardcodeados incluyen `#166534` (green-800 fuera del sistema warm) y `#C8860A` sin usar `--color-gold`. `RiskDashboardTab` tiene 23 `strokeWidth=2` violations y 6 rainbow fills (`bg-amber-900`, `bg-orange-900`, `bg-red-600`). `PolicyTab` (419 líneas, el más largo del módulo) acumula 8 rainbow text-* y 4 border-palette-* fuera de sistema. El módulo tiene solo 4 archivos pero cada uno acumula deuda alta.

**Prioridad de rediseño: Crítica.** `RiskDashboardTab` es la pantalla que un consultor ve al revisar riesgos — si tiene `bg-amber-900` y `bg-red-600` como fondos de cards, rompe la regla 60-30-10 de forma visible. `PolicyPDF` es un caso especial (los inline son necesarios para PDF) pero los colores deben mapearse al sistema aunque sean inline.

---

### T7 — AdoptionHeatmap
**Qué hace:** Análisis de adopción IA siguiendo la curva de Rogers (Innovadores → Rezagados). Visualiza stakeholders posicionados sobre una campana de Gauss SVG custom (`BellCurveTab`). Incluye tarjetas de momentum, recomendaciones por departamento, y un plan de gestión del cambio.

**Problema visual:** `T7BellCurveTab` (307 líneas) usa una curva SVG custom con los colores de segmento definidos en `T7Constants.ts` — patrón similar a chartTokens pero fuera del sistema centralizado. `BELL_FILL`, `BELL_STROKE`, `SEG_BOUNDS` son constantes de color que deberían mapearse a tokens semánticos. La escala `slate-*` aparece en `T7View` para fondos de sección. `T7PlanPhaseCard` tiene `bg-amber-100` y `bg-amber-400` como fills directos. 13 inline styles con valores mágicos de posicionamiento. Módulo bien estructurado a nivel de componentes — sin anidamientos ni modales problemáticos.

**Prioridad de rediseño: Media.** Acción: centralizar colores de segmento de Rogers en `chartTokens.ts` o constants tokenizadas. Sustituir `bg-amber-100/400` por tinted surfaces con `/10` opacity. Eliminar `slate-*`.

---

### T8 — CommunicationMap
**Qué hace:** Mapa de comunicación IA por arquetipos y departamentos. `T8View` (278 líneas) orquesta 4 tabs: Timeline (cronograma de acciones), ArchetypeMessages (mensajes por arquetipo), DeptKit (kit por departamento), Materials. Usa un icon map (`TYPE_ICON_MAP`, `CHANNEL_ICON_MAP`) que mapea strings a componentes Lucide.

**Problema visual:** Es el módulo con mayor número de **violaciones de strokeWidth=2** del sistema: 43 ocurrencias. La causa es el `TYPE_ICON_MAP` en `T8TimelineTab.tsx` — un objeto literal de 14 iconos todos con `strokeWidth={2}`. Estos iconos se renderizan dentro de `<Badge>` chips, produciendo visualmente el "peso grueso" que el Design System prohíbe explícitamente. Las 4 familias de color (emerald, orange, red, indigo) aparecen como fills en estados de tipo de comunicación. 13 `<Card>` instances sugieren alta densidad visual en el timeline.

**Prioridad de rediseño: Crítica.** La corrección del icon map es un cambio de una línea por icono (43 ocurrencias → cambiar `strokeWidth={2}` a `strokeWidth={1.5}`) pero impacta toda la identidad visual del módulo. Es la corrección de mayor ROI visual del sistema.

---

### T9 — AIRoadmap
**Qué hace:** Roadmap de iniciativas IA en formato Gantt horizontal. `T9View` (352 líneas) gestiona el estado global y renderiza filas. `GanttRowItem` (207 líneas) dibuja cada fila del Gantt con posicionamiento CSS grid y colores por estado/fuente codificados en objetos `STATUS_META` y `SOURCE_META`.

**Problema visual:** Los colores del Gantt (`STATUS_META`, `SOURCE_META`) están definidos como objetos `{ bg, color }` con valores HEX que se aplican via `style={{ backgroundColor: sm.bg, color: sm.color }}` — patrón inevitable para un Gantt dinámico pero sin mapeo a tokens del sistema. Solo 1 HEX detectado directamente (los demás van via variable JS). Las 20 inline styles incluyen `gridTemplateColumns` hardcodeados (`'260px 1fr'`, `'repeat(12, 1fr)'`) — justificables para grid layout preciso. El bug de UX más claro: **2 ocurrencias de `focus:ring-blue-300`** en los inputs de `AddFreeItemForm` y `GanttRowItem` — focus azul en lugar del gold canónico. Módulo de familia de colores más limpia del sistema (solo `gray`).

**Prioridad de rediseño: Baja-Media.** Acción inmediata de bajo coste: cambiar `focus:ring-blue-300` → `focus:ring-gold/20`. Los colores de status del Gantt necesitan tokenizarse en un `ganttTokens.ts` análogo a `chartTokens.ts`.

---

### T10 — AIValueDashboard
**Qué hace:** Dashboard ejecutivo de valor IA. Es el módulo más grande en número de archivos (18 tsx): 1 view orquestador, 6 paneles (P1-P6 correspondientes a T1-T6), y 9 micro-componentes reutilizables (`DonutChart`, `DeptBar`, `DimBar`, `StatusBar`, `HeroMetric`, `MetricChip`, etc.). Cada panel consume datos agregados de los módulos anteriores. LeanRadarChart y DonutChart son SVG custom.

**Problema visual:** Los 34 HEX hardcodeados están principalmente en los paneles P2-P5 donde los colores semánticos se usan para pintar estados (verde adoption, rojo risk). Algunos valores son fuera del sistema: `#EF9F27` (amber variante), `#97C459` (green sin token), `#7F77DD` (indigo/violet sin token), `#3C3489` (indigo oscuro), `#D85A30` (naranja sin token). Estos sugieren que los paneles de T10 heredaron paletas ad-hoc de los módulos que representan. `shadow-lg` en el componente `PanelCard` es especialmente problemático pues afecta todos los 6 paneles. El gradiente detectado (`bg-gradient`) es el único en todo el sistema fuera de `tailwind.config.ts`.

**Prioridad de rediseño: Media.** La arquitectura es la más limpia del sistema (18 archivos bien segmentados, ninguno >314 líneas). La deuda es cromática: los colores off-token en paneles individuales. Acción: auditar P2-P5 para reemplazar los 7 HEX fuera de sistema. Bajar `shadow-lg` en PanelCard.

---

### T11 — OperatingRhythm
**Qué hace:** Modelo operativo de reuniones y ritmo de gobernanza IA. Visualiza un calendario de cadencia (`CadenciaTab`), mapa de decisiones (`DecisionesTab`), KPIs y objetivos. `AdaptiveModeBadge` es un componente que renderiza badges de estado con colores semánticos.

**Problema visual:** `AdaptiveModeBadge` (49 líneas) concentra **14 clases rainbow** — la mayor densidad por tamaño de archivo del sistema. Usa `bg-red-900/500/400/50`, `bg-emerald-900/500/400/50`, `bg-blue-900/500/400/50` como fondos directos para los modos "Crítico/Alerta/Normal/Estable". Es el ejemplo más puro de violación de §2.3 del Design System: flooding de fondo saturado en un componente badge. `shadow-xl` en `T11View` es la sombra más pesada de la pantalla principal. 23 inline styles en `ObjetivosTab` con posicionamiento y colores mezclados.

**Prioridad de rediseño: Crítica.** `AdaptiveModeBadge` debe reescribirse completamente: cambiar `bg-red-900` → `bg-surface` con `border-l-[3px] border-[var(--color-danger)]` + texto `text-[var(--color-danger)]`. Este único cambio eliminaría las 14 clases rainbow de raíz.

---

### T12 — ISOAssessment
**Qué hace:** Evaluación de controles ISO 27001 para gobernanza IA. `T12View` orquesta una sidebar de cláusulas (`ClauseSidebar`) con `ControlCard` para cada control evaluable. Módulo más pequeño del sistema (3 archivos, 517 líneas).

**Problema visual:** La familia de color `violet` (`text-violet-400/600`, `bg-violet-50/900`, `border-violet-200/800`) no pertenece a la paleta GOBY — es la única paleta de acento fría no-amber en uso como color estructural (se usa para marcar cláusulas de alta criticidad). `bg-gray-800` (×7) y `bg-gray-100` (×4) son las clases más repetidas. `bg-gray-100` en light mode es frío vs el ivory cálido del sistema. `shadow-lg` en `ClauseSidebar` viola el límite de `shadow-md`. Dado su tamaño reducido, es el módulo más rápido de depurar.

**Prioridad de rediseño: Baja.** Acción: reemplazar familia violet → `gold` para criticidad alta (mantiene coherencia con el acento único del sistema). Sustituir `bg-gray-100` → `bg-surface`. `shadow-lg` → `shadow-sm`.

---

## RESUMEN EJECUTIVO DE DEUDA VISUAL

### Top 3 acciones de mayor ROI visual

**1. T8 — Cambiar strokeWidth en TYPE_ICON_MAP (43 ocurrencias, 1 archivo, ~5 min)**  
Cambiar `strokeWidth={2}` → `strokeWidth={1.5}` en `T8TimelineTab.tsx` líneas 12-26 y 90-109. Impacto inmediato en todo el módulo de comunicación — el más visible para consultores.

**2. T11 — Reescribir AdaptiveModeBadge (14 rainbow fills, 49 líneas, ~20 min)**  
Reemplazar los 12 bg-* de color sólido por el patrón `bg-surface + border-l-accent`. Elimina el único componente que floodea fondos saturados en el sistema de forma sistemática.

**3. T9 — Corregir focus:ring-blue (2 ocurrencias, 2 archivos, ~2 min)**  
`focus:ring-blue-300` → `focus:ring-gold/20 focus:border-gold`. La corrección más barata del sistema con impacto directo en la coherencia de interacción.

### Distribución de la deuda

```
HEX hardcodeados totales en módulos T1-T12: ~217
inline styles totales:                       ~259  
strokeWidth=2 violations:                    ~96
rainbow bg-* fills:                          ~39
gray/slate (paleta fría) en Tailwind:        extendida — presente en 12/12 módulos
```

### Patrones sistémicos (no específicos de un módulo)

- **La paleta `gray-*` fría** es el patrón más extendido. Ningún módulo está libre de ella. El override en `src/index.css` solo actúa en `dark:` — en light mode, `bg-gray-100` pinta frío. Solución sistémica: un lint rule o codemod global `gray → warm equivalente`.
- **Los tokens semánticos `*-light` y `*-dark`** (`success-light`, `warning-dark`, etc.) existen en `tailwind.config.ts` pero no como CSS vars en `:root`. Esto fuerza a hardcodear los HEX equivalentes en charts y badges. Solución: ampliar `:root` con `--color-success-light`, `--color-warning-dark`, etc.
- **SVG custom charts** (T1, T2, T3, T7, T10) son inevitablemente HEX-heavy. Su deuda no es técnica — es de tokenización. La solución es extender `chartTokens.ts` para que cubra también los colores de categoría de T3 y los colores de segmento de Rogers de T7.

---

*Documento generado por análisis estático · Sin modificaciones al código · Próxima revisión tras sprint de design-debt.*

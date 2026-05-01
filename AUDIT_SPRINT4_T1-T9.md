# Audit Sprint 4 — L.E.A.N. AI System T1–T9
**Fecha:** 2026-05-01 | **Objetivo:** demo-ready en ~1.5 semanas

Severidades: 🔴 **BLOQUEANTE** (no salir a demo con esto) · 🟡 **IMPORTANTE** (visible y perjudica percepción) · ⚪ **COSMÉTICO** (pulir si queda tiempo)

---

## RESUMEN EJECUTIVO

| Categoría | 🔴 Bloqueante | 🟡 Importante | ⚪ Cosmético | Total |
|-----------|:---:|:---:|:---:|:---:|
| Visual    | 2   | 4   | 3   | 9   |
| UX        | 3   | 7   | 2   | 12  |
| Gráficos  | 1   | 5   | 2   | 8   |
| **Total** | **6** | **16** | **7** | **29** |

---

## 1. AUDIT VISUAL

### 🔴 V-01 — Logo placeholder visible en demo
**Archivo:** `src/shared/layouts/AppLayout.tsx` (líneas 54–63)
**Problema:** El header global muestra dos `LogoSlot` con borde discontinuo y texto "Logo Alpha" / "Logo Cliente". Esto es visible en TODAS las herramientas en todo momento.
**Impacto:** En el primer segundo de demo el cliente ve que el producto no está terminado.
**Fix:** Sustituir `LogoSlot` por la imagen del logo de Alpha Consulting. El slot del cliente puede quedarse vacío o con placeholder más discreto (sin borde discontinuo).

---

### 🔴 V-02 — Dark mode roto en T7 (colores no adaptan)
**Archivo:** `src/modules/T7_AdoptionHeatmap/T7View.tsx` (líneas 108–111, 340, 357–358, 373)
**Problema:** `DEPT_CFG.fill` son hex hardcoded (`#6366F1`, `#F97316`, `#10B981`) que se usan como `backgroundColor` en los dots SVG de la curva de Rogers. En dark mode el fondo de los dots sigue siendo el mismo — funciona visualmente, pero el texto blanco sobre `#F97316` (naranja brillante) es ilegible en algunos fondos. Más grave: los valores de grilla SVG (`stroke="#CBD5E1"`, `fill="#94A3B8"`) son colores light que en dark mode no contrastan.
**Fix:** Usar CSS variables `var(--navy)`, `var(--warning-soft)`, etc. en lugar de hex en los elementos SVG. Para los SVG que no admiten clases Tailwind, extraer el color del document CSS o añadir colores explícitos por tema.

---

### 🟡 V-03 — Hardcoded hex en T7 y T9 fuera del design system
**Archivos:** T7View líneas 92–96 (SEG_LABELS bg), T9View líneas 51–70 (RISK_META, STATUS_META, FREE_STATUS_META)
**Problema:** Ambas herramientas definen sus propios esquemas de color con valores hex literales (`#FCEBEB`, `#A32D2D`, `#EAF3DE`, etc.) que NO corresponden a los tokens del design system (`danger-light`, `danger-dark`, `success-light`). Resultado: los badges de T9 tienen tonos ligeramente distintos a los de T4/T6 que usan los tokens correctamente.
**Fix T7:** Sustituir `SEG_LABELS.bg` por clases Tailwind del sistema (`bg-info-light`, `bg-success-light`, `bg-warning-light`).
**Fix T9:** Reemplazar `RISK_META` y `T4_STATUS_META` locales por los `STATUS_CONFIG` y `AIACT_RISK_CONFIG` que ya existen en T4/T6 constants, o extraerlos a un shared constant.

---

### 🟡 V-04 — `rounded-3xl` en T3 fuera del token system
**Archivo:** `src/modules/T3_ValueStreamMap/T3View.tsx` (líneas 961, 988)
**Problema:** Los contenedores de los hero charts usan `rounded-3xl` (24px — Tailwind default) pero el design system solo define hasta `2xl` (20px). El resto del producto usa `rounded-2xl` para cards grandes.
**Fix:** Cambiar `rounded-3xl` → `rounded-2xl` en ambas líneas.

---

### 🟡 V-05 — Emojis como iconografía en T8 y T5
**Archivos:** T8View.tsx (líneas TYPE_CFG ~35, CHANNEL_CFG ~43), T5View.tsx (DeptCategoryModal empty state)
**Problema:** T8 usa emojis (`📢`, `🎓`, `🤝`, `⚡`, `✉️`, `🏢`) en todas sus tarjetas de acción y canales. T5 usa `🔍` en su empty state del modal. El resto del producto (T1–T4, T6, T7, T9) usa exclusivamente SVG inline para iconos.
**Impacto:** En un Mac retina los emojis se renderizan bien, pero el tamaño visual es inconsistente y el estilo choca con los SVG del resto.
**Fix:** Reemplazar los emojis en T8 TYPE_CFG y CHANNEL_CFG con SVG inline simples (no necesitan ser elaborados — 14px stroke icons). Para T5, sustituir `🔍` por el SVG ya usado en otros empty states del producto.

---

### 🟡 V-06 — Inconsistencia de `border-radius` entre herramientas
**Problema:** T9 usa `rounded-lg` (8px) para las filas del Gantt, T3 usa `rounded-3xl` (24px) para los hero charts, y el resto usa `rounded-xl` (12px) / `rounded-2xl` (20px) como patrón principal. El Gantt en T9 luce notablemente más "box-y" que el resto del producto.
**Fix:** T9 Gantt rows → mantener el aspecto compacto pero con `rounded` (8px es el valor DEFAULT del sistema, correcto para contextos compactos). Solo corregir T3 → ya cubierto en V-04.

---

### ⚪ V-07 — Botón PDF de T6 usa flecha de texto `↓` en lugar de SVG
**Archivo:** `src/modules/T6_RiskGovernance/T6View.tsx` (PolicyTab, línea ~114)
**Problema:** `↓ Descargar PDF` usa el carácter unicode `↓`. Todos los botones de acción con icono del producto usan SVG inline.
**Fix:** Reemplazar `↓` por el mismo SVG de download usado en otros contextos.

---

### ⚪ V-08 — `text-[10px]` y `text-[11px]` inconsistentes con la escala de fuente
**Problema:** El design system define `xs: 0.75rem (12px)` y `label: 0.8125rem (13px)` como los tamaños mínimos. Sin embargo, todas las herramientas usan extensivamente `text-[10px]`, `text-[9px]`, y `text-[8px]` como clases arbitrarias de Tailwind. Hay textos a 7px y 8px en SVG que son ilegibles a cualquier distancia.
**Acción:** No es un fix urgente para demo, pero documentar que la escala tipográfica del design system no está siendo respetada en los niveles más pequeños.

---

### ⚪ V-09 — `LogoSlot` de cliente en header — placeholder a debatir
**Archivo:** `AppLayout.tsx`
**Nota:** El logo slot del "cliente" es deliberadamente configurable. Para la demo, acordar si se muestra el logo del cliente real, vacío, o se oculta.

---

## 2. AUDIT UX

### 🔴 U-01 — Hilo conductor metodológico AUSENTE entre herramientas
**Aplica a:** T1–T9 (global)
**Problema:** El objetivo central de Sprint 4 es que el usuario "sepa dónde está en la metodología y cómo cada herramienta conecta con la siguiente". Actualmente:
- El header de cada tool muestra `[T1] · AI Readiness Assessment · Fase Listen · Semanas 1-3` → da contexto de fase, NO de progresión.
- El sidebar existe pero está **colapsado por defecto** y requiere un click para abrirse.
- No hay ningún elemento persistente que muestre `T1 → T2 → T3 | T4 → T5 → T6 | T7 → T8 → T9`.
- No hay indicador de "datos fluyen de T3 a T4" visible en ninguna herramienta.
**Impacto en demo:** Un CIO que navega libremente no tiene forma de entender el sistema sin que el consultor lo explique verbalmente. El producto no se demuestra solo.
**Fix propuesto:** En el header de cada herramienta, añadir una línea de progreso tipo "breadcrumb de metodología":
```
Listen ◉ T1 → T2 → T3 | Evaluate ○ T4 → T5 → T6 | Activate ○ T7 → T8 → T9
```
Con la tool activa destacada y las fases completadas marcadas. Puede ir entre el back-button y el título. Estimado: 2–3h de trabajo.

---

### 🔴 U-02 — T6: `window.print()` para PDF en demo es un bloqueante
**Archivo:** `src/modules/T6_RiskGovernance/T6View.tsx` (línea ~114)
**Problema:** El botón "Descargar PDF" de la Política IA llama a `window.print()`. Esto abre el diálogo de impresión del navegador. En una demo presencial con un cliente:
1. Se abre un cuadro de diálogo del sistema operativo.
2. El consultor tiene que cancelar o imprimir.
3. Rompe el flujo completamente.
**Fix:** Usar `html2canvas` + `jsPDF` (librería ligera) o la misma técnica del `@media print` CSS existente pero con un iframe oculto que se imprime silenciosamente. Alternativa rápida: ocultar el botón en demo y mostrar solo la preview del documento. Prioridad alta si este documento es parte del argumento de venta.

---

### 🔴 U-03 — T8: herramienta solo texto, sin jerarquía de entrada en demo
**Archivo:** `src/modules/T8_CommunicationMap/T8View.tsx`
**Problema:** T8 tiene 4 tabs: Timeline, Mensajes, Materiales, Kit. El usuario llega a T8 y ve una lista de ~14 acciones de comunicación generadas automáticamente, todas con el mismo peso visual. No hay jerarquía de "qué hacer primero" ni ningún elemento visual que diferencie alta prioridad de media. En una demo, el cliente ve un wall of text.
**Más grave:** La tab "Materiales" muestra templates de email con texto plano en un contenedor. En modo demo, esto parece incompleto.
**Fix urgente (mínimo viable para demo):** Añadir un KPI strip al top de T8 con 3 métricas: total de acciones, acciones de alta prioridad, fase actual. Añadir una visual timeline simple (línea horizontal con hitos Fase 1/2/3) antes de la lista de acciones. Ver U-07 para propuesta de chart.

---

### 🟡 U-04 — T1: acción principal requiere 2 clicks para llegar a crear contenido
**Archivo:** `src/modules/T1_MaturityRadar/T1View.tsx` (línea ~246)
**Problema:** El selector de entrevistados está **colapsado por defecto**. Para crear una nueva entrevista el usuario debe:
1. Click en el panel de entrevistados para expandirlo.
2. Click en "Nueva" (que además es un botón pequeño que compite con el "expand" del panel).
El botón "Nueva" dentro del panel expandido es el único punto de entrada para crear contenido. Si el usuario no expande el panel no lo encuentra.
**Fix:** Añadir botón "Nueva entrevista" directamente en el header de la herramienta (ya tiene espacio — T2 lo hace correctamente con `Nueva entrevista` en el header).

---

### 🟡 U-05 — T2: departamentos colapsados por defecto → primera vista vacía
**Archivo:** `src/modules/T2_StakeholderMatrix/T2View.tsx` (línea ~328, `expandedDepts = new Set()`)
**Problema:** `DepartmentMatrix` inicializa todos los departamentos colapsados. El usuario ve el resumen de arquetipos + filas colapsadas sin stakeholders visibles. Tiene que expandir cada departamento para ver el contenido.
**Fix rápido:** Cambiar el estado inicial para que el primer departamento esté expandido por defecto: `useState<Set<string>>(() => new Set([firstDept]))`. Para demo con datos precargados, expandir todos los departamentos por defecto.

---

### 🟡 U-06 — T3: `filterCat` existe en estado pero no tiene UI
**Archivo:** `src/modules/T3_ValueStreamMap/T3View.tsx` (línea ~843)
**Problema:** El estado `filterCat` existe y se aplica al `filtered` array, pero no hay ningún botón en la UI para activarlo. El usuario no puede filtrar por categoría IA — la funcionalidad existe pero es invisible. Los botones de fase sí funcionan.
**Fix:** Añadir una fila de filter chips de categoría IA junto a los filtros de fase existentes. O eliminar el estado `filterCat` del código si no va a ser expuesto en Sprint 4.

---

### 🟡 U-07 — T8: ausencia total de visualización de datos
**Archivo:** `src/modules/T8_CommunicationMap/T8View.tsx`
**Problema:** T8 es la única herramienta de T1–T9 sin ningún gráfico o visualización. Todo el contenido es texto generado automáticamente. Esto es especialmente llamativo en la tab "Timeline" que muestra acciones pero en formato lista.
**Propuesta (Sprint 4 scope según plan):** Añadir a Tab 1 una visual timeline horizontal de 6 meses con los hitos de comunicación agrupados por fase. No requiere Recharts — un SVG simple con 3 bandas de color (Fase 1/2/3) y puntos en las semanas clave. Estimado: 3–4h.

---

### 🟡 U-08 — T9: Q1/Q2 sin separadores visuales de grupo
**Archivo:** `src/modules/T9_AIRoadmap/T9View.tsx` (línea ~225)
**Problema:** El Gantt distingue Q1/Q2 solo con una línea vertical hairline `rgba(0,0,0,0.08)` en el 50% del gráfico. No hay cabecera de trimestre sobre las columnas de meses (Q1: M1-M3 / Q2: M4-M6). El usuario lee el Gantt sin saber qué mes está mirando.
**Fix:** Añadir una fila de cabecera fija sobre el área de barras con labels "Mes 1 / Mes 2 / Mes 3 / Mes 4 / Mes 5 / Mes 6" y encima "Q1 ────── / Q2 ──────". Estimado: 1–2h.

---

### 🟡 U-09 — T4: profundidad de interacción excesiva (4 niveles)
**Archivo:** `src/modules/T4_UseCasePriorityBoard/T4View.tsx`
**Problema:** Para llegar a la clasificación AI Act de un caso de uso el flujo es:
1. Click en card del caso (expande panel)
2. Tab "Regulatorio"
3. Click "Clasificar" → modal AI Act (4 preguntas MCQ)
4. Confirmar clasificación
El acceso a la economía del ROI es similar. Para una demo, el consultor tiene que navegar mucho para llegar a los datos más impactantes.
**Fix parcial:** Añadir en la card compacta del caso (zona 2) los badges de score + AI Act visibles sin expandir. Que el estado de alto riesgo sea visible sin abrir nada.

---

### 🟡 U-10 — Scatter charts sin tooltips (T3 y T4)
**Archivos:** T3View `HeroOpportunityMatrix`, T4View `PriorityMatrix`
**Problema:** Todos los dots del scatter son clickables pero no tienen tooltip en hover. En demo, mover el cursor sobre un punto no muestra qué proceso/caso es hasta que se hace click. Para un CIO que escanea visualmente el gráfico, no puede leer los datos sin interactuar.
**Fix:** Añadir `title` SVG o un tooltip CSS simple que muestre nombre + score al hacer hover sobre el dot. Implementación con SVG `<title>` es trivial (1 línea por dot). Tooltip visual requiere 30–60min.

---

### ⚪ U-11 — T3: botón "volver" es el carácter `←` (área de click mínima)
**Archivo:** `src/modules/T3_ValueStreamMap/T3View.tsx` (línea ~462)
**Problema:** T3 usa un `<button>` con solo el carácter `←` como back button. T1, T2, T4 usan el mismo patrón SVG + "Volver al dashboard". El área de click de `←` es ~10×20px.
**Fix:** Reemplazar por el mismo patrón de T1/T2 con SVG chevron + texto.

---

### ⚪ U-12 — T2: panel derecho "vacío" poco atractivo para demo
**Archivo:** `src/modules/T2_StakeholderMatrix/T2View.tsx` (línea ~790)
**Problema:** Cuando no hay stakeholder seleccionado, el panel derecho muestra solo un SVG de usuario + texto "Selecciona un stakeholder" con borde discontinuo. En demo con datos precargados, el primer stakeholder debería estar preseleccionado.
**Fix (demo):** En `T2View`, inicializar `activeStakeholder` con el primer stakeholder del store en lugar de `null`. Con datos de demo, el panel siempre tendrá contenido al entrar.

---

## 3. AUDIT DE GRÁFICOS

### 🔴 G-01 — Shared LeanRadarChart (Recharts) nunca se usa — dead code
**Archivo:** `src/shared/components/charts/LeanRadarChart.tsx`, `LeanBarChart.tsx`
**Problema:** Se crearon componentes Recharts compartidos pero T1 usa `T1SpiderChart` (SVG custom), y ninguna otra herramienta usa los shared charts. El código de Recharts existe en el bundle pero no aporta valor. Más importante: hay DOS implementaciones del radar (LeanRadarChart en Recharts y T1SpiderChart en SVG custom) con especificaciones distintas.
**Impacto:** No es un bloqueante para demo, pero aumenta el bundle size y genera confusión futura.
**Acción recomendada Sprint 4:** Confirmar que T1SpiderChart es el estándar. Si se necesita radar en otras herramientas, usar T1SpiderChart o abstraerlo como componente compartido. Marcar LeanRadarChart como deprecated.

---

### 🟡 G-02 — T2: bar chart de composición con proporciones desequilibradas
**Archivo:** `src/modules/T2_StakeholderMatrix/T2View.tsx` (`DepartmentOverviewChart`)
**Problema:** Las barras tienen `BW=16px` (ancho) con `GAP=34px` (espacio entre barras). La ratio gap/bar es 2:1 — visualmente las barras parecen líneas finas con mucho espacio vacío. No sigue las buenas prácticas de bar charts (ratio recomendado: ancho ≥ gap).
**Adicionalmente:** Los labels de departamento a 10px hacen wrap a 2 líneas, lo que puede desalinear el chart en strings largos.
**Psicología del dato:** Este chart muestra "cuántos stakeholders por departamento y de qué tipo" — un bar chart apilado es el tipo correcto, pero las proporciones visuales lo hacen parecer más pequeño e insignificante de lo que es.
**Fix:** Aumentar `BW` a `24–28px` y reducir `GAP` a `20–24px`. Con eso los pilares tienen presencia visual.

---

### 🟡 G-03 — T3: donut chart — posición radial del dot no es auto-explicativa
**Archivo:** `src/modules/T3_ValueStreamMap/T3View.tsx` (`HeroCategoryDonut`)
**Problema:** Los dots dentro del donut están posicionados radialmente según el `opportunityScore` del proceso (más al exterior = score más alto). Esta es una codificación de datos doble brillante, pero:
1. No hay ninguna indicación visual de que la posición radial significa algo.
2. No hay tooltip en los dots.
3. Sin leyenda que explique "radio = oportunidad".
**Psicología del dato:** El donut muestra distribución de categorías (correcto), pero la codificación radial secundaria es percibida como aleatoria si no se explica.
**Fix:** Añadir dentro del hueco del donut o en una nota de leyenda: "● posición = score oportunidad (0-4)". + Tooltip SVG `<title>` con nombre y score en cada dot.

---

### 🟡 G-04 — T3/T4: scatter charts sin tooltips (duplicado de U-10)
**Psicología del dato:** Los scatter charts (Opportunity Matrix T3, Priority Matrix T4) son el tipo correcto para mostrar distribución en dos dimensiones continuas. Pero sin tooltips son incompletos como herramienta de análisis. El usuario no puede identificar puntos sin hacer click.
**Fix:** Ver U-10.

---

### 🟡 G-05 — T7: bell curve segment backgrounds rotos en dark mode
**Archivo:** `src/modules/T7_AdoptionHeatmap/T7View.tsx` (`SEG_LABELS`)
**Problema:** Los backgrounds de los segmentos son `#EFF6FF` (azul pálido), `#F0FDF4` (verde pálido), `#FEFCE8` (amarillo pálido), `#FFF7ED` (naranja pálido) — todos colores pastel light-mode. En dark mode el fondo de la herramienta es `bg-gray-950`, y estos backgrounds se aplican a zonas del SVG y a tarjetas HTML. En dark mode los pastel claros contrastan fuertemente y son visualmente incorrectos.
**Fix:** Usar las clases Tailwind del sistema (`bg-info-light dark:bg-info-dark/20`, etc.) en lugar de hex hardcoded.

---

### 🟡 G-06 — T9: milestone dot con color `#E24B4A` fuera del sistema
**Archivo:** `src/modules/T9_AIRoadmap/T9View.tsx` (línea ~322)
**Problema:** El hito (milestone dot al final de cada barra Gantt) usa `background: '#E24B4A'` — un rojo que NO coincide con ningún token del design system. `danger.DEFAULT` es `#D89090`, y `danger-dark` es `#C06060`. El `#E24B4A` es un rojo más saturado/vibrante que visualmente destaca en exceso.
**Fix:** Usar `bg-danger-dark` o definir el color como `navy` (si el milestone es un hito de progreso, no de riesgo — semántica importante).

---

### ⚪ G-07 — T1: SpiderChart custom vs LeanRadarChart Recharts — coherencia futura
**Nota:** T1SpiderChart está bien construido (SVG custom, dark mode con MutationObserver, escala 0-4 correcta, target line en 3.5). No hay problema funcional. La nota es que si se necesita radar en T7 o T9 en el futuro, hay que decidir cuál es el estándar: el custom SVG o Recharts.

---

### ⚪ G-08 — T5: DeptAdoptionChart es una tabla HTML, no un chart
**Archivo:** `src/modules/T5_AITaxonomyCanvas/T5View.tsx` (`DepartmentAdoptionChart`)
**Problema:** La visualización "Adopción por departamento" es una `<table>` con dots de color para indicar si un departamento tiene actividad en un dominio. Funcionalmente correcto pero visualmente no diferenciado como "chart".
**Psicología del dato:** Para mostrar presencia/ausencia en una matriz bidimensional (depts × dominios), la tabla con dots es el tipo correcto (heatmap binario). No requiere cambio de tipo de chart.
**Mejora cosmética opcional:** Cambiar los dots vacíos de `border: 1.5px solid #CBD5E1` a algo con más contraste en dark mode.

---

## 4. PRIORIDADES PARA DEMO (orden de implementación sugerido)

### Bloque A — 1–2 días (bloqueantes)
1. **V-01** — Logo Alpha en header (30 min)
2. **U-01** — Hilo conductor: breadcrumb de metodología en headers (2–3h)
3. **U-03** — T8: KPI strip + visual timeline básica (3–4h)
4. **V-02** — T7 dark mode fix (1–2h)
5. **U-02** — T6 PDF: evaluar alternativa a window.print() (2–4h)

### Bloque B — 2–3 días (importantes, alto impacto en demo)
6. **U-10** — Tooltips en scatter charts T3/T4 (1–2h)
7. **U-08** — T9: cabeceras Q1/Q2 sobre el Gantt (1–2h)
8. **V-03** — T7/T9: mapear colores al design system (2–3h)
9. **U-05** — T2: primer departamento expandido por defecto (15 min)
10. **U-12** — T2: preseleccionar primer stakeholder en demo (30 min)
11. **U-04** — T1: botón "Nueva entrevista" en header (30 min)

### Bloque C — si queda tiempo (importantes pero no críticos para demo)
12. **G-02** — T2 bar chart proporciones (30 min)
13. **G-03** — T3 donut tooltip + leyenda radial (1h)
14. **V-05** — T8 emojis → SVG (1–2h)
15. **U-06** — T3 filtro categoría: exponer o eliminar estado muerto (30 min)
16. **V-04** — T3 rounded-3xl → rounded-2xl (5 min)

### Bloque D — cosmético, post-demo
17. V-07, V-08, V-09, U-09, U-11, G-06, G-07, G-08

---

## 5. PREGUNTA DE DEBATE SPRINT 4

**El hilo conductor (U-01) puede implementarse de dos formas:**

**Opción A — Breadcrumb en header de herramienta** (visualización estática de la posición en la metodología): bajo coste, siempre visible, pero no muestra el flujo de datos entre herramientas.

**Opción B — Banner de "datos disponibles desde Tx"** (ejemplo en T4: "Importando 8 procesos de T3", en T5: "Usando 12 casos de T4"): muestra el flujo de datos real y hace tangible la integración entre módulos.

La Opción A comunica "eres parte de un sistema". La Opción B demuestra que el sistema funciona de verdad.

**¿Cuál priorizar para demo? ¿O implementar ambas?**

---

*Generado por Claude · Sprint 4 · 2026-05-01*
*Basado en análisis directo del código fuente: 9.089 líneas en T1View–T9View + shared components.*

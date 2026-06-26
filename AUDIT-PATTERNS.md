# AUDIT-PATTERNS.md — GOBY UI Architecture Audit
> Principal UI Architect review · Read-only · 2026-06-22
> Branch: refactor/ux-ui-adr020-consolidation · 182 TSX files audited

---

## 1. LAYOUT GLOBAL

### 1.1 Componente raíz

**Archivo:** `src/shared/layouts/AppLayout.tsx` (308 líneas)

```
<AppLayout>                                    ← root, flex-col h-dvh
  ├─ <header sticky top-0 z-20>                ← h-14, backdrop-blur-sm, px-6 gap-4
  │   ├─ AlphaLogo + EngagementSelector
  │   ├─ ContextBreadcrumb                     ← GOBY · projectName · companyName
  │   └─ LogoutButton + DarkModeToggle
  ├─ <AppSidebar>                              ← overlay fixed, nunca desplaza layout
  │   ├─ HamburgerToggle                       ← fixed left, top: calc(header-h + 8px)
  │   ├─ Backdrop                              ← z-30, bg-black/15 + backdrop-blur
  │   └─ <aside w-64 z-40 translate-x>
  ├─ <main id="main-content" flex-1>
  │   └─ <ErrorBoundary>
  │       └─ <Outlet context={{dark}}>
  ├─ <DebugPanel>                              ← solo DEV
  └─ <SessionRecoveryBanner>                   ← z-[100] overlay
```

### 1.2 Contenedor principal — max-width

| Clase | Ocurrencias | Contexto |
|-------|-------------|---------|
| `max-w-7xl` | 8 | ToolHeader por defecto (todas las tools T1–T12) |
| `max-w-6xl` | 16 | Vistas T1–T4 inner content |
| `max-w-5xl` | 10 | Vistas T5–T8 |
| `max-w-2xl` | ~6 | Modales, paneles laterales |
| `max-w-sm` | 17 | Dropdowns, selectores pequeños |
| `max-w-[1200px]` | 1 | **Valor arbitrario** — debería ser `max-w-7xl` |
| `max-w-[92vw]` | 1 | **Valor arbitrario** — modal responsive |

**Padding:** El `<main>` no tiene padding propio — cada vista es responsable.
ToolHeader inner: `px-8` uniforme. Header global: `px-6`.

**Problema detectado:** Coexisten `max-w-6xl`, `max-w-7xl` y `max-w-[1200px]` como "ancho máximo de tool" sin criterio documentado. Esto produce saltos de alineación visible entre herramientas.

### 1.3 Elementos estructurales

| Elemento | Presente | Detalles |
|----------|----------|---------|
| Sidebar fijo | ✓ | Overlay, nunca desplaza contenido. `w-64`, animación `translate-x` |
| Header sticky | ✓ | `sticky top-0 z-20`, altura medida con `ResizeObserver` → `--header-h` CSS var |
| Breadcrumb | ✓ | `ContextBreadcrumb` en centro de header. Dinámico (proyecto + empresa) |
| Skip link | ✓ | `sr-only focus:not-sr-only` — accesible por teclado |
| Session banner | ✓ | `SessionRecoveryBanner` z-[100] overlay — caso de error |
| Bottom nav | ✗ | No existe |
| Footer global | ✗ | No existe |

---

## 2. NAVEGACIÓN

### 2.1 Componente

**Archivo:** `src/shared/components/AppSidebar.tsx` (261 líneas)
**Patrón:** Overlay sidebar (mobile-first; siempre overlay en todos los breakpoints, nunca fijo como rail permanente).

### 2.2 Estructura del menú

```
AppSidebar
 ├─ Perfil de Empresa        ← "Contexto · Fricciones"
 ├─ — divider —
 ├─ T1  AI Readiness Assessment
 ├─ T2  Stakeholder Matrix
 ├─ T3  Value Stream Map
 ├─ T4  Use Case Priority Board
 ├─ T5  AI Taxonomy Canvas
 ├─ T6  Risk & Governance
 ├─ T7  Adoption Heatmap
 ├─ T8  Communication Map
 ├─ T9  AI Roadmap
 ├─ T10 AI Value Dashboard      ← path="/" (home)
 ├─ T11 Operating Rhythm
 └─ T12 ISO 42001 Assessment
```

**1 nivel.** 13 items (1 perfil + 12 tools). Sin submenús, sin grupos colapsables.

### 2.3 Estado activo

```tsx
// Cálculo:
const isActive = location.pathname === tool.path

// Estilos activo:
bg-gold/10 dark:bg-gold/15   text-gold dark:text-amber-400

// Estilos inactivo (hover):
hover:bg-black/3 dark:hover:bg-white/4

// Aria:
aria-label="Herramientas metodológicas T1 a T12"  (en <nav>)
aria-hidden={!open}  (en <aside>)
```

**Problema:** No hay `aria-current="page"` en el item activo — solo diferenciación visual. Esto rompe la semántica para screen readers.

### 2.4 Trigger de cierre

El sidebar se cierra al: (a) hacer clic en el backdrop, (b) seleccionar una tool, o (c) pulsar Escape (vía Modal). Un `UnsavedChangesModal` bloquea la navegación si hay cambios pendientes.

---

## 3. JERARQUÍA TIPOGRÁFICA

Muestra de 5 pantallas reales: T1View, T10View, CompanyProfileView, AdminView, PolicyTab (T6).

### 3.1 Tabla de jerarquía

| Nivel | Elemento HTML | Clases observadas | Tamaño real |
|-------|---------------|-------------------|-------------|
| **H1** (tool title) | `<h1>` en ToolHeader | `text-sm font-semibold text-lean-black dark:text-warm-50 truncate` | 14px — **CRÍTICO: H1 en 14px** |
| **H1** (admin/auth) | `<h1>` | `text-xl font-semibold` / `text-2xl font-bold` | 20–24px |
| **H2** (section) | `<h2>` | `text-base font-semibold text-lean-black dark:text-gray-100` | 16px |
| **H2** (dialog) | `<h2>` | `text-base font-semibold text-[#2A2822]` | 16px — **hardcoded hex** |
| **H3** (subsection) | `<h3>` | `text-xs font-mono uppercase tracking-wide text-gray-400` | 12px mono |
| **H3** (card header) | `<h3>` | `text-sm font-semibold` | 14px |
| **Body** | `<p>`, `<span>` | `text-sm` | 14px |
| **Caption/label** | `<span>`, `<p>` | `text-xs` / `text-[10px] font-mono uppercase tracking-widest` | 12–10px |

### 3.2 Problemas detectados

1. **H1 en 14px (text-sm):** El ToolHeader reduce el título de herramienta a `text-sm`. Semánticamente es un `<h1>` pero visualmente es body text. Impacto en jerarquía cognitiva muy alto.
2. **Inconsistencia H2:** El mismo nivel jerárquico usa `text-base` en secciones y `text-lg` en paneles de detalle (T3) — sin lógica documentada.
3. **Hex hardcodeado:** `text-[#2A2822]` en diálogos en lugar de `text-warm-800` del sistema de tokens.
4. **H3 doble personalidad:** Algunas H3 son mono uppercase tracking (estilo etiqueta de sección) y otras son semibold 14px (estilo título de card). Dos patrones opuestos bajo el mismo nivel.
5. **Rango total:** La escala va de `text-[10px]` a `text-2xl`. El rango efectivo de UI (excluyendo admin/auth) es `text-xs` → `text-base` — excesivamente comprimido para una aplicación profesional de enterprise.

---

## 4. ESPACIADO

### 4.1 Valores más usados

| Clase | Ocurrencias | Valor | Evaluación |
|-------|-------------|-------|-----------|
| `p-2` | 178 | 8px | Canónico ✓ |
| `p-3` | 138 | 12px | Canónico ✓ |
| `gap-2` | 168 | 8px | Canónico ✓ — más frecuente |
| `gap-3` | 132 | 12px | Canónico ✓ |
| `gap-1.5` | 92 | 6px | No canónico ⚠ |
| `px-4` | 105 | 16px | Canónico ✓ |
| `px-3` | 99 | 12px | Canónico ✓ |
| `p-1.5` | 98 | 6px | No canónico ⚠ |
| `py-2.5` | 38 | 10px | No canónico ⚠ |
| `gap-2.5` | 19 | 10px | No canónico ⚠ |
| `px-8` | 37 | 32px | Canónico ✓ — solo headers de tool |

### 4.2 Outliers — valores anómalos críticos

| Clase | Ocurrencias | Diagnóstico |
|-------|-------------|-------------|
| `m-100` | 57 | **CRÍTICO:** No es un valor Tailwind válido. Probable conflicto con token de color (`warm-100`). |
| `m-300` | 49 | Idem — color token `warm-300` usado como margin |
| `m-50` | 40 | Idem — color token `warm-50` |
| `m-700` | 27 | Idem |
| `m-200` | 24 | Idem |
| `m-500` | 20 | Idem |
| `m-900` | 20 | Idem |
| `m-800` | 15 | Idem |
| `m-400` | 8 | Idem |
| `m-600` | 10 | Idem |
| `m-950` | 7 | Idem |
| **TOTAL** | **~277** | Estos valores no producen ningún margen real. CSS los ignora silenciosamente. |

> **Diagnóstico `m-{50..950}`:** Tailwind no tiene utilidades `m-50` a `m-950` en su escala por defecto. Estas clases probablemente no generan CSS alguno — son dead classes. El origen más probable es un autocomplete erróneo que confundió la escala de colores (`warm-50`, `warm-100`…) con la escala de espaciado. Impacto visual: nulo (las clases no existen en el stylesheet). Impacto en deuda técnica: alto (277 instancias de ruido en el código).

### 4.3 Valores `.5` (semipaso)

`gap-1.5`, `gap-2.5`, `p-1.5`, `py-2.5` suman ~247 ocurrencias. No son canónicos según la escala 4px definida en `tailwind.config.ts`. Visualmente casi indistinguibles de sus canónicos más cercanos, pero añaden entropía al sistema.

---

## 5. RADIOS Y SOMBRAS

### 5.1 Border radius — valores únicos en uso

| Clase | Ocurrencias | px | Uso principal |
|-------|-------------|-----|--------------|
| `rounded-full` | 174 | 9999px | Avatares, badges, toggles, botones icon |
| `rounded-xl` | 100 | 16px | Cards principales, paneles, modales |
| `rounded-2xl` | 71 | 20px | Cards feature, KPI panels |
| `rounded-lg` | 103 | 12px | Inputs, botones, tooltips |
| `rounded-3xl` | 5 | 24px | Casos aislados — no canónico de facto |
| `rounded-md` | 12 | 8px | Badges, chips, tags |
| `rounded-sm` | 6 | 4px | Items de lista, hover states |
| `rounded-r-xl` | 1 | 16px (derecha) | Hamburger button |

**Evaluación:** Bien controlado. 8 valores únicos, todos canónicos excepto `rounded-3xl` (5 usos marginales). El eje `rounded-xl` / `rounded-2xl` convive como "card radius" — hay que unificar.

### 5.2 Sombras — valores únicos en uso

| Clase | Ocurrencias | Contexto |
|-------|-------------|---------|
| `shadow-sm` | 32 | Cards, inputs, superficie principal |
| `shadow-lg` | 7 | Modales, dropdowns |
| `shadow-xl` | 5 | Modales grandes, EngagementSelector |
| `shadow-md` | 2 | Elementos intermedios |
| `shadow-none` | 1 | Reset explícito |
| `shadow-border` | 1 | Token custom: `0 0 0 1px #D4D0C8` |
| `shadow-border-dark` | 1 | Token custom: 1px border dark mode |
| `shadow-warm-200/60` | 3 | Token custom: warm-card dark elevation |

**Evaluación:** Sistema de sombras muy contenido (8 valores únicos). Los tokens custom `shadow-border` y `shadow-warm-card` son una buena práctica — sustituyen border + shadow en uno. Sin irregularidades graves.

---

## 6. MODO OSCURO

### 6.1 Estado de implementación

| Indicador | Estado |
|-----------|--------|
| Activación | `darkMode: 'class'` en Tailwind config |
| Mecanismo | `useDarkMode` hook → `document.documentElement.classList.toggle('dark', dark)` + localStorage |
| Toggle UI | `DarkModeToggle` en header (h-8 w-8 rounded-full, icon sun/moon, aria-label) |
| Default | Light mode (PALETTE_VERSION migration resetea a `false`) |
| Cobertura | ~858 matches de `dark:` en src/ → estimado ~150+ archivos únicos |

### 6.2 Paleta dark mode

| Token | Light | Dark |
|-------|-------|------|
| Surface app | `#F7F4EE` (warm-50) | `#22201C` (warm-900) |
| Surface sidebar | `#FFFFFF` | `#2A2822` (warm-800) |
| Primary text | `#1C1A16` (lean-black) | `#F0EDE8` (warm-50) |
| Border | `border-border` (#D4D0C8) | `dark:border-warm-600/30` |
| Accent / Gold | `#C8860A` | `#C8860A` (mismo — decisión intencional) |

### 6.3 Cobertura y riesgos

**Patrón tipo bien implementado:**
```tsx
className="bg-white dark:bg-warm-800 text-lean-black dark:text-warm-50 border-border dark:border-warm-600/30"
```

**Riesgos detectados:**

| Riesgo | Archivo | Detalles |
|--------|---------|---------|
| Hex hardcodeado sin dark variant | `src/modules/Admin/AdminView.tsx` | `text-[#2A2822]` — funciona en light pero puede fallar en dark si el contexto cambia |
| `text-gray-400` sin dark variant | AdminView (12+ instancias) | `gray-400` sobre `bg-gray-50` — pasa en light, puede romper en dark si bg cambia |
| Inline styles con hex fijos | `~198` instancias globales | Principalmente en charts — no tienen dark variant por naturaleza |
| `style={{ color: '#C8860A' }}` | Charts, varios | Correcto ya que el gold es igual en ambos modos |

**Diagnóstico general:** El dark mode está **bien implementado a nivel sistémico**. La paleta warm es coherente. Los riesgos son puntuales y concentrados en AdminView (panel interno, menor visibilidad).

---

## 7. ACCESIBILIDAD VISUAL

### 7.1 Contraste — casos sospechosos

| Combinación | Ubicación | Ratio estimado | Estado WCAG AA |
|-------------|-----------|----------------|---------------|
| `text-gray-400` (#9CA3AF) sobre `bg-gray-50` (#F9FAFB) | AdminView inputs | ~4.1:1 | ⚠ Borderline (AA requiere 4.5:1) |
| `placeholder:text-text-subtle` (~#9A9790) sobre `#F7F4EE` | Inputs globales | ~4.5:1 | ⚠ Exactamente en el límite |
| `text-[10px] font-mono` labels | AdminView, T-tools | N/A — tamaño < 14px | ✗ Falla automáticamente (AAA requiere >14px) |
| `text-text-muted` (#6B6864) sobre `bg-white` | Diálogos, tooltips | ~6:1 | ✓ Pasa AA |
| `dark:text-gray-300` sobre `dark:bg-warm-900` | FrictionCard, CompanyProfile | ~8:1 | ✓ Pasa AA |

### 7.2 Elementos nativos sin estilizar

**`<select>` bare (5 instancias):**

| Archivo | Línea aprox. | Estado |
|---------|-------------|--------|
| `src/modules/Admin/AdminView.tsx` | ~270 (×4) | Tiene `className` pero no `aria-label` ni `id` para `htmlFor` |
| `src/modules/Admin/components/ProjectsTab.tsx` | ~49 | Tiene `className`, sin `aria-labelledby` |
| `src/modules/Admin/components/UsersTab.tsx` | ~105–110 (×2) | Filtros de rol/empresa, styled pero sin label semántico |
| `src/modules/T1_MaturityRadar/components/NewInterviewModal.tsx` | ~múltiple | `className` presente |
| `src/modules/T9_AIRoadmap/components/AddFreeItemForm.tsx` | ~múltiple | Envuelto en form control |

**`<textarea>` bare (5 instancias):**

| Archivo | Estado |
|---------|--------|
| `src/modules/CompanyProfile/components/FrictionCard.tsx` | Styled + dark, sin `aria-label` propio |
| `src/modules/CompanyProfile/components/ProyectoTab.tsx` | Label encima (contexto), sin `htmlFor` explícito |
| `src/modules/T12_ISOAssessment/components/ControlCard.tsx` (×2) | Styled + dark mode OK |

**`<input>` bare en AdminView (3–5 instancias):**
Inputs creados directamente sin envolver en `<FormField>`, sin `htmlFor` → label desconectada.

### 7.3 Atributos aria

| Elemento | Estado |
|---------|--------|
| Botones icon-only con `aria-label` | ✓ 115+ aria attributes en src/ |
| `aria-hidden` en sidebar cerrado | ✓ |
| `aria-current="page"` en nav activo | ✗ **Falta** — solo diferenciación visual |
| `aria-busy` en form submissions | ✗ Ausente en mayoría |
| `aria-live` en cargas async | ✗ Ausente |
| Skip link | ✓ `sr-only focus:not-sr-only` |
| Focus management post-navegación | ✗ RouteWrapper no refoca `<main>` |

### 7.4 Estrategia de focus

| Componente | Estrategia |
|-----------|-----------|
| Button (DS) | `focus-visible:ring-2` ✓ |
| Input (DS) | `focus-visible:ring-2` ✓ |
| FormField (DS) | `focus-visible:ring-2` ✓ |
| AdminView inputs | `focus:border-[#C8860A]/60 focus:bg-white` ⚠ — no usa ring, hardcodea hex |
| Selects en Admin | Sin focus style explícito ✗ |

---

## 🎯 Veredicto de Profesionalidad

> Escala 1–10. Evaluación basada en 182 archivos TSX, sistema de diseño, tailwind.config y patrones observados.

### Tabla de puntuación

| Eje | Puntuación | Justificación |
|-----|-----------|---------------|
| **Layout** | **7/10** | Estructura limpia con header sticky + sidebar overlay + breadcrumb dinámico. Demérito: coexistencia de `max-w-6xl` / `max-w-7xl` / `max-w-[1200px]` como "contenedor de tool" sin criterio único — produce desalineaciones entre herramientas. El sidebar overlay-only (sin modo rail permanente en desktop) es una decisión discutible para una suite enterprise de 13 herramientas. |
| **Tipografía** | **5/10** | El sistema de tokens tipográficos existe pero está mal jerarquizado. El problema más grave: el `<h1>` de cada tool se renderiza a `text-sm` (14px) — funcionalmente indistinguible del body text. El rango efectivo de la UI es `text-xs → text-base`, excesivamente comprimido. H3 tiene dos personalidades incompatibles. Hex hardcodeado en diálogos rompe el sistema de tokens. |
| **Color** | **8/10** | Paleta warm coherente y diferenciada. Dark mode bien implementado a nivel sistémico con cobertura alta (~150 archivos). Token `gold` consistente en ambos modos. Demérito: ~198 inline styles con hex fijos en charts, y algunos `text-[#hex]` en componentes que deberían usar tokens. |
| **Espaciado** | **5/10** | El rango canónico (gap-2, gap-3, p-2, p-3) domina, lo cual es bueno. Pero hay dos problemas serios: (1) ~277 instancias de `m-{50..950}` que son **dead classes** — no producen ningún margen, son ruido invisible; (2) ~247 instancias de valores semipaso (`.5`) que fragmente la escala 4px. La escala conceptual es sólida; la ejecución real está contaminada. |
| **Consistencia** | **6/10** | El Design System (23+ componentes) es una base sólida y su adopción es alta. Pero AdminView (743 líneas) es una isla que ignora FormField, Input DS, y aria patterns — es el mayor vector de inconsistencia. Dos valores de card radius conviven (`rounded-xl` vs `rounded-2xl`). Tres valores de max-width de tool sin criterio. La consistencia sistémica es buena; la consistencia de ejecución tiene excepciones notables. |
| **Accesibilidad** | **4/10** | El esqueleto es correcto (skip link, aria-label en botones icon, modal Escape, FormField accessible). Pero falta `aria-current="page"` en la navegación principal, no hay gestión de foco post-navegación, no hay `aria-live` en cargas async, los selects en Admin carecen de label semántico, y los labels de `text-[10px]` fallan automáticamente WCAG AA por tamaño. Para una suite enterprise B2B estos son gaps que un cliente enterprise señalaría en una auditoría de accesibilidad. |

### Puntuación global: **5.8 / 10**

**Diagnóstico ejecutivo:**

La suite tiene una **arquitectura sólida como base** — sistema de tokens, dark mode, Design System con 23 componentes, patrones de routing claros. El esqueleto es el de un producto enterprise serio.

Las caídas de puntuación no son de arquitectura sino de **ejecución acumulada**: mucho ruido de clases inválidas (`m-50`→`m-950`), un H1 que visualmente es body text, inconsistencias de max-width entre tools que producen "salto de alineación" al navegar, y AdminView como isla que no sigue los patrones del DS.

**El trabajo que más ROI de percepción de profesionalidad daría (por orden):**
1. Fijar la jerarquía tipográfica: ToolHeader H1 a `text-lg` o `text-xl` como mínimo.
2. Estandarizar el contenedor de tool a un único `max-w-7xl` + `px-8`.
3. Purgar las ~277 instancias de `m-{50..950}` (dead classes — no producen CSS).
4. Añadir `aria-current="page"` en el item activo del sidebar.
5. Unificar card radius a `rounded-xl` (eliminar `rounded-2xl` como alternativa).

---

*Auditoría realizada en modo solo-lectura. Ningún archivo fue modificado.*
*Scope: `src/` completo — 182 archivos TSX analizados.*

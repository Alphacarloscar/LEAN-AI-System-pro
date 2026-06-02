# Design System Audit — L.E.A.N. AI System Enterprise
**Modo:** Audit | **Fecha:** 2026-05-21 | **Scope:** `src/` completo  
**Referencia:** ARQUITECTURA.md secciones D9 + §5 (Estructura del repositorio) + §7 (Sistema de diseño)

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Componentes planificados en ARQUITECTURA.md | ~12 atómicos + 4 layouts |
| Componentes compartidos implementados | **7** (0 atómicos, 7 de layout/app) |
| `src/shared/design-system/` | **Vacía** (carpeta creada, sin contenido) |
| Archivos con botones (nativo/ad-hoc) | **23 de 113** |
| Tokens hardcodeados (hex en src/) | **134** |
| Módulos T1-T12 con capa service | **4/12** (T1-T4) |
| Tercera ubicación de componentes encontrada | `src/components/` (RecommendationPanel) |
| **Puntuación global del DS** | **3.5 / 10** |

---

## 1. Cobertura de tokens

### 1.1 Tokens definidos en tailwind.config.ts

| Categoría | Tokens definidos | Estado |
|-----------|-----------------|--------|
| Colores — escala warm | 10 (warm-50 → warm-950) | ✅ Completo |
| Colores — acento gold | 2 (gold, gold-hover) | ⚠️ Falta gold-text accesible |
| Colores — superficie | 4 (surface, border, navy, ivory) | ⚠️ navy mal nombrado |
| Colores — pastel funcional | 4 (success-soft, warning-soft, danger-soft, info-soft) | ✅ Completo |
| Gradientes | 2 (navy-metallic, gold-metallic) | ⚠️ Hex interno en lugar de vars CSS |
| Tipografía | Inter, escala size, weight | ✅ Completo |
| Sombras semánticas | 4 (card, sidebar, modal, sm) | ✅ Completo |
| Border-radius | 6 niveles (none → full) | ✅ Completo |
| Z-index semánticos | 7 (base → toast) | ⚠️ Definidos, no usados |
| Animaciones | 3 (shimmer, fade-in, slide-up) | ✅ Completo |
| Espaciado | Tailwind estándar, sin tokens semánticos de módulo | ⚠️ Sin tokens de layout |
| Colores de fase | **Ninguno** — hardcodeados en AppSidebar | 🔴 Gap crítico |

### 1.2 Instancias de hardcode detectadas

| Tipo de hardcode | Instancias | Ejemplo |
|-----------------|------------|---------|
| `#` hex en className o style | ~92 | `style={{ color: '#C8860A' }}` |
| Array de hex en constante | 1 constante × 6 colores | `PHASE_COLORS = ['#2A2822', ...]` |
| Hex dentro de token (gradiente) | 6 hex en 2 gradientes | `linear-gradient(...#1B2A4E...)` |
| `gray-400` de Tailwind hardcoded (no del DS) | ~12 | `className="text-gray-400"` |
| `gray-*` fuera del sistema warm | ~24 | `text-gray-500`, `bg-gray-100` |
| **Total** | **~134** | — |

**Nota sobre gray-\*:** El DS usa escala `warm-*` como paleta de grises. El uso de `gray-*` de Tailwind rompe la coherencia térmica de la paleta — los grises Tailwind son fríos (azulados), los warm son cálidos. En fondos juntos, el contraste es visible.

---

## 2. Inventario de componentes: planificado vs. implementado

### 2.1 Componentes atómicos (según ARQUITECTURA.md §7 + §5)

> ARQUITECTURA.md: *"Construidos en `src/shared/design-system/components/`: Button, Input, Card, Badge, Alert… Validación: todos en Storybook antes de Sprint 1."*

| Componente | Planificado | Implementado | Ubicación actual | Estado |
|------------|-------------|--------------|-----------------|--------|
| `Button` | ✅ Sí | ❌ No | Inline en 23 ficheros | 🔴 Gap |
| `Input` / `FormField` | ✅ Sí | ❌ No | Inline en Auth, Admin, T1, T4 | 🔴 Gap |
| `Card` | ✅ Sí | ❌ No | Inline en todos los módulos | 🔴 Gap |
| `Badge` | ✅ Sí | ❌ No | `StatusBadge` inline en T4View | 🔴 Gap |
| `Alert` | ✅ Sí | ❌ No | Inline ad-hoc | 🔴 Gap |
| `Modal` | Implícito | Parcial | Ad-hoc en T1, sin role=dialog | 🟡 Gap |
| `Spinner` / `Loading` | Implícito | Parcial | Inline SVG en App.tsx, sin ARIA | 🟡 Gap |
| `Select` | — | Nativo HTML | — | 🟡 Sin estilo DS |

### 2.2 Componentes de layout y aplicación

| Componente | Implementado | Ubicación | Estado |
|------------|-------------|-----------|--------|
| `AppLayout` | ✅ Sí | `src/shared/layouts/` | 🟢 Bien |
| `AppSidebar` | ✅ Sí | `src/shared/components/` | 🟡 GOBY bug + hardcodes |
| `AlphaLogo` | ✅ Sí | `src/shared/components/` | 🔴 GOBY en login |
| `MetricHero` | ✅ Sí | `src/shared/components/` | 🟢 Modelo de referencia |
| `ErrorBoundary` | ✅ Sí | `src/shared/components/` | 🟡 Sin reporte externo |
| `EngagementSelector` | ✅ Sí | `src/shared/components/` | 🟢 Bien |
| `PhaseMiniMap` | ✅ Sí | `src/shared/components/` | 🟢 Bien |
| `PhaseRoadmap` | ✅ Sí | `src/shared/components/` | 🟢 Bien |
| `RecommendationPanel` | ✅ Sí | `src/components/` ⚠️ | 🔴 Ubicación incorrecta |

### 2.3 Componentes de módulo no extraídos

Componentes con alta probabilidad de reutilización que hoy viven inline en módulos específicos:

| Componente inline | Módulo actual | Candidato a compartido |
|-------------------|--------------|----------------------|
| `StatusBadge` | T4View.tsx | ✅ Alto |
| `CategoryBadge` | T4View.tsx | ✅ Alto |
| `ExecDashboard` | T4View.tsx | 🟡 Medio |
| `QuarterlyRoadmap` | T4View.tsx | 🟡 Medio |
| `PriorityMatrix` | T4View.tsx | 🟡 Medio |
| `T4ScoreBars` | T4View.tsx | 🟡 Medio |
| Sub-componentes chart wrappers | T1, T7, T10 | 🟡 Medio |

---

## 3. Consistencia de nombres

### 3.1 Nombres de tokens vs. uso real

| Token | Nombre en config | Semántica real | Problema |
|-------|-----------------|---------------|---------|
| `navy` | `#2A2822` | Charcoal warm, no azul | Nombre engañoso |
| `surface` | `#F7F4EE` | Superficie principal | ✅ Correcto |
| `border` | `#D4D0C8` | Borde estándar | ✅ Correcto |
| `warm-100` | `#C4C0B8` | 1.81:1 contraste | Trampa: parece usable en texto |
| `gold-hover` | `#D4940F` | Más claro que gold | Contraintuitivo: hover más claro |

### 3.2 Inconsistencias en nomenclatura de archivos de módulo

| Módulo | Store | Service | Types | Constants |
|--------|-------|---------|-------|-----------|
| T1 | `store.ts` | `service.ts` | `types.ts` | `constants.ts` |
| T2 | `store.ts` | `service.ts` | `types.ts` | `constants.ts` |
| T3 | `store.ts` | `service.ts` | `types.ts` | `constants.ts` |
| T4 | `store.ts` | `service.ts` | `types.ts` | `constants.ts` |
| T5–T12 | `store.ts` | **❌ Ausente** | `types.ts` | `constants.ts` |

Los 8 módulos T5-T12 llaman directamente a Supabase desde el store, rompiendo el patrón arquitectónico definido y violando la decisión implícita en D1: *"capa de servicios abstrae todas las llamadas a BBDD"*.

### 3.3 Inconsistencia de ubicación de componentes

Hay **tres ubicaciones** distintas para componentes en el proyecto, sin regla clara de dónde va cada uno:

```
src/
├── components/             ← RecommendationPanel (¿por qué aquí y no en shared?)
├── shared/
│   ├── components/         ← 7 componentes de app-level
│   └── design-system/      ← VACÍO (planificado, no construido)
└── modules/Tx/
    └── [componentes inline] ← sub-componentes de módulo
```

La intención arquitectónica de ARQUITECTURA.md era clara: `src/shared/design-system/components/` para atómicos. Lo que existe es una estructuración fragmentada que ningún nuevo colaborador entendería sin leer la documentación.

---

## 4. Evaluación de componentes existentes

| Componente | Tokens | Estados | Variantes | A11Y | Docs | Score |
|------------|--------|---------|-----------|------|------|-------|
| MetricHero | ✅ | ✅ skeleton | ✅ sm/md/lg/xl | ✅ | ⚠️ | 8/10 |
| AppSidebar | 🟡 hardcodes | ✅ | — | 🟡 | ⚠️ | 5/10 |
| AppLayout | ✅ | — | — | ✅ semántico | ⚠️ | 7/10 |
| AlphaLogo | ✅ | ✅ sizes | ✅ sm/md/lg | 🔴 GOBY | ⚠️ | 4/10 |
| ErrorBoundary | ✅ | ✅ | — | 🟡 | ⚠️ | 5/10 |
| RecommendationPanel | 🟡 hardcodes | 🟡 | — | 🔴 aria | ⚠️ | 4/10 |
| EngagementSelector | ✅ | ✅ | — | 🟡 | ⚠️ | 6/10 |
| PhaseMiniMap | 🟡 | ✅ | — | 🟡 | ⚠️ | 5/10 |
| PhaseRoadmap | 🟡 | ✅ | — | 🟡 | ⚠️ | 5/10 |

**Nota:** Todos los componentes tienen documentación inline mínima (sin README ni Storybook stories, a pesar de que Storybook está instalado con 6 paquetes de devDependencies).

---

## 5. Acciones prioritarias

### P1 — Correcciones inmediatas (sin sprint planificado)

1. **Mover RecommendationPanel** de `src/components/` a `src/shared/components/` — consistencia de estructura.
2. **Corregir GOBY** en AlphaLogo.tsx y AppSidebar.tsx — branding activo en producción.
3. **Añadir token `gold-text: '#9B6408'`** y aplicar en texto sobre fondos claros.
4. **Añadir tokens de fase** en tailwind.config.ts (PHASE_COLORS → `phase.1` … `phase.6`).
5. **Marcar `warm-100` como decorativo** con comentario en tailwind.config.ts.
6. **Renombrar `navy` → `obsidian`** o `brand-dark` con grep y replace en src/.

### P2 — Construir la librería de componentes atómicos (sprint dedicado)

Según ADR D-11 (ver documento separado). Orden de prioridad:

1. `<Button>` — resuelve 23 ficheros con botones ad-hoc
2. `<FormField>` — resuelve A11Y issue #15 (26 inputs sin label) y consistencia de formularios
3. `<Card>` — contenedor base usado en todos los módulos
4. `<Badge>` / `<StatusBadge>` — extraer de T4View
5. `<Modal>` — resuelve A11Y issue #11 y estandariza diálogos
6. `<PageHeader>` — garantiza entrada visual consistente en T1-T12
7. `<EmptyState>` — estado vacío por módulo

### P3 — Estandarizar capa de servicios en T5-T12

Crear `service.ts` en los 8 módulos siguiendo el patrón de T1-T4. Esto:
- Desacopla los stores de Supabase directamente (testabilidad futura)
- Completa el patrón arquitectónico definido en D1
- Permite añadir caché, retry logic y error handling centralizados

### P4 — Activar Storybook o eliminarlo

Decisión binaria: crear 1 story por componente atómico construido en P2 (opción recomendada), o desinstalar los 6 paquetes de Storybook de devDependencies. El estado actual — instalado pero sin stories — es la peor opción: overhead de instalación sin beneficio.

---

## Relación con otros documentos de la evaluación

| Hallazgo de este audit | Documento relacionado |
|------------------------|----------------------|
| 134 hardcodes | DESIGN-CRITIQUE.md §3 |
| Componentes sin aria-label | A11Y-AUDIT.md issues #11, #12, #13, #15 |
| Divergencia UserRole | ADR D-10 (ver documento) |
| Módulos T5-T12 sin service | 03-patrones.md §3 |
| Storybook instalado sin usar | 09-dependencias.md P3 |
| `design-system/` vacío | ARQUITECTURA.md §7 (deuda de Sprint 0.5) |

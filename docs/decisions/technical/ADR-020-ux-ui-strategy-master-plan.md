# ADR-020: Plan Maestro de Estrategia UX/UI y Sistema de Diseño

**Status:** PROPOSED
**Date:** 2026-06-16
**Proposed by:** Carlos Sánchez - Alpha Consulting
**Approved by:** [pendiente]
**Supersedes:** —
**Superseded by:** —

---

## Context

### Origen de la decisión

Se han ejecutado en paralelo dos análisis:

1. **Auditoría UI/UX de código** sobre la rama `feat/atomic-screen-independence`: 12 hallazgos críticos, 18 medios, 6 bajos. Áreas: Design System, Navegación, Micro-interacciones, Formularios, A11y & Responsividad.
2. **Benchmark de mercado** de plataformas de gobernanza de IA (Credo AI, Superwise/trust, Walled.ai, Collibra AI Governance, plantillas Zenith y Signal) y de sistemas de diseño empresarial (IBM Carbon, Material UI, Tailwind + Shadcn UI).

Las capturas de pantalla del producto en estado actual (38 screenshots, 2026-06-16) y la verificación contra el repo (`src/shared/layouts/AppLayout.tsx`, `AppSidebar.tsx`, `ToolHeader.tsx`, `ChartWrapper.tsx`, `package.json`) confirman los hallazgos críticos y obligan a corregir tres afirmaciones de la auditoría:

| Afirmación de la auditoría | Realidad verificada en el repo | Implicación |
|---|---|---|
| "No existe `react-hook-form` ni `zod` en `package.json`" | Ambos instalados: `react-hook-form ^7.54.0`, `zod ^3.23.8` — usados solo en `src/lib/schemas/t4.schemas.ts` (1/12 herramientas). `OVERVIEW.md` ya declara React-Hook-Form + Zod como estándar de formularios. | El problema es **infra-utilización**, no ausencia. La acción cambia de "instalar dependencias" a "adoptar el estándar declarado en las 11 vistas restantes". |
| "`AppLayout` no envuelve el contenido en `<main>`" | `<main>` existe (`AppLayout.tsx:265`). | Falta `id="main-content"` y skip-link `Saltar al contenido`, no falta el elemento. |
| "`AppSidebar` carece de `<nav>` semántico" | `<nav>` existe (`AppSidebar.tsx:120`) dentro de `<aside>`. | Faltan `aria-label="Navegación principal"` en `<aside>` y `aria-label="Herramientas T1–T12"` en `<nav>`. |

### Hallazgos críticos confirmados (12)

- **Doble sticky con altura acoplada**: `ToolHeader` tiene `sticky top-[57px] z-10` hardcoded (`ToolHeader.tsx:68`), pero `AppLayout` no fija altura — `py-3` + contenido produce ~57 px solo si nada crece. El `SessionRecoveryBanner` ya añade altura dinámica.
- **Sin botón de regreso universal**: `ToolHeader.onBack` es opcional. Vistas como `CompanyProfileView` y `AdminView` pueden quedar sin salida en mobile con sidebar cerrado.
- **EngagementSelector cambia contexto sin confirmación**: pérdida silenciosa de cambios no guardados en T1–T12.
- **Toast sin cola de prioridad**: `Toast.tsx` no tiene `ToastProvider` con límite. 3 toasts simultáneos se salen de viewport.
- **Llamadas LLM sin feedback progresivo**: `useEdgeFunctionInvoke` (ADR-014) puede tardar 5–30 s. `ToolLoadingScreen` bloquea toda la UI.
- **Validación de formularios ad-hoc en 11/12 vistas**: el estándar declarado (RHF + Zod) está infrautilizado. Cada vista valida con `useState` por campo, ratios `onChange`/`onBlur`/`onSubmit` inconsistentes.
- **LoginView sin librería de validación**: primera experiencia del usuario con validación manual, sin toggle de visibilidad de contraseña, sin validación de formato de email en tiempo real.
- **`AppSidebar` sin `aria-label` en `<aside>` ni en `<nav>`** (verificado).
- **`<main>` sin `id` ni skip-link** (verificado).
- **`ChartWrapper` sin `aria-label` ni `role="img"` ni tabla alternativa**: gráficos invisibles para lectores de pantalla.
- **`AppSidebar` con `w-64` fijo sin colapso en tablet** (768–1024 px ocupa 25–33% del ancho).
- **Tablas con `overflow-x-auto` sin column priority**: scroll horizontal en mobile, sin patrón "card list".

### Hallazgos visuales (capturas + market research)

- **Confusión semántica estados vs pestañas**: en T4 (`Use Case Priority Board`), los chips `Go / En piloto / Priorizado / Candidato / No-Go / Completado` (estados del caso) tienen el mismo peso visual que las pestañas reales `Scoring / Economía / Hoja de ruta / Contexto T1/T2 / AI Act`. El operador no distingue navegar de filtrar — viola el Principio de Menor Sorpresa identificado por el benchmark.
- **Estética actual es sobria** (corrige al market research): no hay saturación de emojis ni paleta caótica. La paleta `gold #C8860A` + `navy #1B2A4A` + `warm-950 #16140F` está alineada con el referente Mike Taylor (Dribbble) y Walled.ai. **No procede un rediseño visual de marca**; sí procede una **disciplina semántica** de componentes.
- **Wizard UI ya implementado correctamente** en T3 (`PASO 1 DE 3`) — usar como patrón canónico para T2 ("Iniciar entrevista") y futuros flujos.

### Restricciones operativas

- **ADR-005**: Carlos opera vía Web UI. Toda entrega es SQL crudo, snippets de código y guías GitHub web. No hay CLI.
- **ADR-011**: ninguna importación directa de Supabase en Views/Stores.
- **ADR-013**: View components ≤ 400 líneas.
- **ADR-014**: LLM via `useEdgeFunctionInvoke`.
- **Pipeline self-documenting** (CLAUDE.md): cada cambio debe documentarse en el mismo PR (OVERVIEW, DATABASES, TECH-DEBT, decisions/).
- **Sistema en producción** con clientes reales (`lean-ai.consultoriaalpha.com`) — el plan debe ser incremental, no big-bang.

---

## Decision

Adoptar un **Plan Maestro UX/UI en 3 fases secuenciadas** con pantalla piloto `AppLayout`, manteniendo el sistema de diseño actual (Tailwind + tokens custom) y **endureciéndolo** en lugar de migrar a Carbon o Shadcn. Cada fase tiene entregables verificables, criterios de aceptación y ADR/FDR propio.

### Fase 1 — Decisión estratégica de Sistema de Diseño (1 sesión)

**Entregable:** `ADR-021-design-system-strategy.md` cerrando la pregunta "¿Tailwind hardened vs Carbon vs híbrido?".

**Decisión propuesta a documentar en ADR-021:** mantener Tailwind + tokens custom (estado actual), formalizando un **Design System Charter** con:

- Escala `space-*` custom en `tailwind.config.ts` (4/8/12/16/24/32/48 px — alineada con Carbon 2x).
- Tokens de color exportados a CSS variables (`--color-gold`, `--color-navy`, …) consumibles por Recharts mediante helper `chartToken(name)` que lee `getComputedStyle(document.documentElement)`. Elimina la duplicidad `CHART_PALETTE` hardcoded.
- Tipografía Inter (mantenida) + monoespaciada `JetBrains Mono` opcional para badges de código T*/IDs (inspiración Signal).
- Densidad: tres niveles configurables (`compact / default / comfortable`) a nivel de tabla y formulario (inspiración Zenith).
- Reglas vinculantes: nada de hex inline en componentes; nada de spacing ad-hoc; nada de Shadcn ni Carbon importados.

**Razón de no migrar a Carbon:** ratio coste/beneficio negativo dado que (a) el DS actual cubre el 80% de necesidades, (b) Carbon impone una estética IBM Plex que choca con la identidad Alpha (gold/navy), (c) ADR-011/013/014 ya imponen disciplina arquitectónica suficiente. Carbon volvería a evaluarse si Alpha decide marca blanca multi-tenant.

**Razón de no migrar a Shadcn:** asume mantenimiento perpetuo del código de cada componente; el equipo no tiene capacidad para ese coste operativo en un sistema productivo.

### Fase 2 — Rediseño visual del chasis (pantalla piloto AppLayout)

**Pantalla piloto:** `AppLayout` (header + `<main>` + `AppSidebar` + `ToolHeader`).

**Justificación de la elección:** una sola PR sobre `AppLayout` cierra 5 de los 12 críticos (skip-link, aria-labels nav/main, doble sticky desacoplado, sidebar responsive, breadcrumb T*). Es el chasis que envuelve T1–T12 — no hay forma más eficiente de mover la aguja de A11y/navegación. El impacto visual es nulo en luz, pero medible en A11y y mobile.

**Entregables:**

1. **FDR-002**: comportamiento visible — skip-link, breadcrumb GOBY · proyecto · empresa · T*, confirmación al cambiar engagement, sidebar colapsado en `< 1024 px`.
2. **Refactor `AppLayout.tsx`** con:
   - `<a class="skip-link" href="#main-content">Saltar al contenido</a>` como primer hijo.
   - `<main id="main-content" tabIndex={-1}>`.
   - Header con altura medida vía CSS variable `--header-h` (no `top-[57px]` hardcoded).
3. **Refactor `AppSidebar.tsx`**: `<aside aria-label="Navegación principal">` y `<nav aria-label="Herramientas T1–T12">`. Breakpoint `lg:` para auto-colapso < 1024 px.
4. **Refactor `ToolHeader.tsx`**: `sticky top-[var(--header-h)]` en lugar de `top-[57px]`.
5. **`EngagementSelector`** con confirmación `<Modal>` si hay cambios sin guardar (hook `useUnsavedChanges`).

**Criterios de aceptación:**

- `axe-core` en Playwright reporta 0 errores A11y críticos en `/login`, `/`, `/t1/:id`, `/t4/:id`, `/company-profile`.
- Sin regresiones: `npm run typecheck` y `npm run test` en verde.
- Lighthouse A11y score ≥ 95 en las 5 rutas.
- Manual: tabulación desde URL bar llega a "Saltar al contenido" como primer foco; sidebar colapsa en viewport 1023 px.

### Fase 3 — Backlog de remediación priorizado

**Entregable:** `docs/sessions/2026-06-16-ux-backlog.md` con tabla de PRs ordenada por impacto/coste. Salidas paralelas:

- Items de deuda en `TECH-DEBT.md` (ver entradas DEBT-022 → DEBT-027 propuestas más abajo).
- 6 PRs concretos sobre vistas T*, con plantilla, asignación de ADR/FDR aplicable y mismo pipeline auto-documenting.

**Orden propuesto (por ratio impacto/coste):**

| # | PR | Cierra | Coste | ADR/FDR |
|---|---|---|---|---|
| 1 | `feat: skip-link + main id + nav aria-labels` | 5 críticos A11y | XS | ADR-020 (este), FDR-002 |
| 2 | `feat: design-system-charter + tokens CSS vars` | Spacing inconsistente, `CHART_PALETTE` duplicado | M | ADR-021 |
| 3 | `feat: ChartWrapper aria-label + tabla alternativa` | A11y de gráficos | S | ADR-021 |
| 4 | `refactor: useUnsavedChanges + confirm en EngagementSelector` | Pérdida de datos silenciosa | M | FDR-002 |
| 5 | `refactor: T2/T3/T4 con react-hook-form + zod` | 2 críticos + 4 medios de formularios | L | ADR-022 (formularios) |
| 6 | `feat: ToastProvider con cola limitada + variantes persistentes` | Críticos de feedback | S | — |
| 7 | `feat: sidebar responsive auto-collapse < lg` + tablas mobile-friendly | Críticos responsivos | M | — |
| 8 | `feat: StreamingIndicator para useEdgeFunctionInvoke` | Críticos LLM feedback | M | ADR-014 (extender) |
| 9 | `refactor: estados vs tabs — separación visual T4` | Confusión semántica del benchmark | S | FDR-003 |

CI Trigger (CLAUDE.md): cada PR debe llevar `feat:`, `refactor` o `[e2e]` en el título para que Playwright corra.

---

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| **Plan Maestro 3 fases con Tailwind hardened (ELEGIDA)** | Incremental, sin disrupción productiva, aprovecha DS existente (80% cubierto), respeta ADR-005/011/013. | No moderniza la estética hacia un estándar de mercado reconocible (IBM Carbon). | — (elegida) |
| Big-bang: rediseño completo con migración a IBM Carbon | Estándar de mercado, A11y de primer nivel out-of-the-box, componentes para tablas densas y data viz nativos. | Coste 8–12 semanas full-time. Rompe identidad Alpha (gold/navy). Curva de aprendizaje pronunciada. Sistema en producción. ROI no justifica en horizonte 12 meses. | Coste/beneficio negativo a 12 meses; reabrir si Alpha decide marca blanca multi-tenant. |
| Migrar a Shadcn UI + Radix | Velocidad de IA generativa (todos los modelos entienden Tailwind+Shadcn nativamente), accesibilidad básica de Radix, código propio en el repo. | El equipo se vuelve dueño perpetuo del código de cada componente: parches de seguridad, contraste WCAG, CVEs, todo manual. No escala para un sistema productivo con un único dev (Carlos). | Coste operativo perpetuo no asumible. |
| Solo cerrar críticos de A11y (sin Fase 1 ni Fase 3) | Mínimo esfuerzo, máximo impacto en compliance. | Deja la confusión estados/pestañas, los formularios ad-hoc y la dispersión de spacing/colores. Reactiva la deuda en 3–6 meses. | Curita, no cura. |

---

## Consequences

### Positive

- **Cierra 12 críticos en 9 PRs ordenados por impacto**, con la primera PR (skip-link + ARIA en AppLayout) cerrando 5 a coste XS.
- **Adopta el estándar declarado (RHF + Zod)** en lugar de instalar nuevas dependencias — coherencia con `OVERVIEW.md`.
- **Endurece el DS sin romperlo**: spacing scale, CSS vars de tokens, JetBrains Mono opcional, densidad configurable. Posibilita theming en runtime (preparación marca blanca).
- **Pantalla piloto AppLayout maximiza palanca**: una PR mueve la aguja en las 12 vistas hijas.
- **Cada fase respeta el pipeline self-documenting** y produce ADR/FDR propio. Trazabilidad completa.

### Negative / Trade-offs accepted

- **Estética no cambia visualmente** en Fase 2: el usuario no verá una "app nueva" tras la PR piloto; los cambios son semánticos/A11y. Comunicar internamente para gestionar expectativas.
- **Confusión semántica estados vs pestañas en T4** se posterga hasta el PR #9 — sigue siendo un riesgo de UX en el interim.
- **No se moderniza la estética hacia Carbon/Material**: la app sigue siendo "Alpha-branded" en lugar de "estándar de mercado". Asumido por valor de marca.
- **Coste de Fase 3 (PRs #2–#9)** no estimado en este ADR — cada uno requiere planning propio. Riesgo de scope creep si no se mantiene la disciplina de PR por item.

### Constraints introduced

- **Prohibido importar Shadcn ni Carbon** en `package.json` hasta nuevo ADR.
- **Prohibido hex inline en componentes**: todo color se importa desde tokens.
- **Prohibido spacing ad-hoc**: solo clases de la escala `space-*` definida en ADR-021.
- **Toda vista que cree o edite formularios** debe usar `react-hook-form + zod` (regla de PR review).
- **Toda vista nueva** debe pasar `axe-core` en Playwright sin errores críticos.
- **Toda visualización Recharts** debe llevar `aria-label` descriptivo y tabla alternativa accesible.

---

## Referencias

- Auditoría UI/UX del frontend (2026-06-16, rama `feat/atomic-screen-independence`)
- Benchmark de mercado: Credo AI, Superwise/trust, Walled.ai, Collibra AI Governance, plantillas Zenith y Signal
- IBM Carbon Design System (rejillas wide/condensed, formularios default/fluid)
- Edward Tufte — Data-Ink Ratio
- Capturas de pantalla GOBY 2026-06-16 (38 screenshots, `uploads/Pantallas GOBY.zip`)
- ADR-005 (Web UI only), ADR-011 (service layer), ADR-013 (component decomposition), ADR-014 (edge function hook), ADR-015 (Zod JSONB validation)
- `docs/architecture/OVERVIEW.md` — declara React-Hook-Form + Zod como estándar de formularios
- CLAUDE.md (v2.2.0) — pipeline auto-documenting

---

## Execution log

| PR | Branch | Fecha merge | Cierra | Notas |
|---|---|---|---|---|
| PR #1 — A11y chasis AppLayout | `feat/a11y-applayout-skip-link-aria` | 2026-MM-DD | DEBT-022 (Resuelto), DEBT-023 (Resuelto-parcial) | skip-link, `id="main-content"`, `aria-label` aside/nav, `--header-h` CSS var, `AlphaLogo` alt corregido |

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

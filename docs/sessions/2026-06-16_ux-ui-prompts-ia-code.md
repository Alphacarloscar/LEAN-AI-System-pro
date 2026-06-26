# Prompts ejecutables para IA-code — Plan Maestro UX/UI (ADR-020)

**Fecha:** 2026-06-16
**Origen:** ADR-020 (Plan Maestro UX/UI), DEBT-022 → DEBT-027
**Destinatario:** Claude Code / Cursor / Windsurf — sesión IA-code de Carlos
**Convención:** un prompt = una PR. Pegar tal cual, ejecutar, revisar el diff, abrir PR con el título indicado.

---

## Prompt 0 — Kickoff: carga de contexto (pegar al iniciar cualquier sesión)

```
Repo: GOBY (lean-ai-system) — Alpha Consulting. Antes de tocar código,
LEE estos ficheros en este orden y NO LEAS NADA MÁS hasta que te lo pida:

1. CLAUDE.md (rules de ejecución y ADRs)
2. docs/decisions/technical/ADR-020-ux-ui-strategy-master-plan.md
3. docs/architecture/TECH-DEBT.md (items DEBT-022 a DEBT-027)
4. docs/architecture/OVERVIEW.md (sección Stack y Module structure)

Reglas obligatorias en TODA respuesta:
- ADR-005: no propongas comandos CLI. Carlos opera por Web UI.
- ADR-011: ninguna importación directa de Supabase en Views o Stores.
- ADR-013: ninguna View > 400 líneas. Si la vista crece, extrae a subcarpeta.
- ADR-014: toda llamada LLM via useEdgeFunctionInvoke.
- Token-opt: usa grep/ripgrep para localizar; lee SOLO las líneas relevantes;
  nunca leas un fichero entero "por contexto".
- Reusa Button, FormField, Card, Badge, Modal, Tabs, Toast, Spinner del DS.
  No crees componentes nuevos salvo que tengan >=2 consumidores reales.
- Reporta SOLO la tabla de cambios + verificación (grep o tsc). NO repitas
  código no tocado.

Confirma que has leído los 4 ficheros listando las constraints más importantes
de cada uno en una línea. Después espera la siguiente instrucción.
```

---

## Prompt 1 — PR piloto: chasis A11y de AppLayout (cierra 5 críticos)

**Branch:** `feat/a11y-applayout-skip-link-aria`
**Modelo:** Sonnet (refactor mecánico)
**CI Trigger:** `feat:` (correr Playwright)
**Cierra:** DEBT-022, DEBT-023 (parcial)
**Estimación:** XS

```
Implementa la PR piloto de ADR-020 Fase 2 — chasis A11y de AppLayout.
Branch: feat/a11y-applayout-skip-link-aria

Tarea concreta, sin desviarte:

1. src/shared/layouts/AppLayout.tsx:
   - Añadir como PRIMER hijo de <div className="min-h-screen ...">:
     <a href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2
                   focus:left-2 focus:z-50 focus:px-4 focus:py-2
                   focus:bg-navy focus:text-white focus:rounded-md">
       Saltar al contenido principal
     </a>
   - <main> existente (línea ~265): añadir id="main-content" y tabIndex={-1}.
   - Header sticky: añadir useLayoutEffect que mida headerRef.current.offsetHeight
     y lo escriba en document.documentElement.style.setProperty('--header-h', `${h}px`).
     Recalcular en resize y cuando cambie sessionRecoveryState.

2. src/shared/components/AppSidebar.tsx:
   - <aside ...>: añadir aria-label="Navegación principal".
   - <nav className="flex-1 overflow-y-auto py-2">: añadir
     aria-label="Herramientas T1 a T12".
   - Sustituir el hardcoded top-[57px] (línea ~102) por top-[var(--header-h)]
     y h-[calc(100vh-var(--header-h))].

3. src/shared/design-system/components/ToolHeader.tsx:
   - Sustituir 'sticky top-[57px] z-10' (línea ~68) por
     'sticky top-[var(--header-h)] z-10'.

4. src/shared/components/AlphaLogo.tsx:
   - Verificar que el alt sea "GOBY — Alpha Consulting". Si está vacío o
     genérico, corregir.

Restricciones:
- NO modifiques estilos visuales fuera de los strictly necesarios.
- NO toques T1–T12 ni LoginView en esta PR.
- Si encuentras un componente sin aria-label que no esté en esta lista,
  añádelo a TECH-DEBT.md pero NO lo arregles aquí.

Criterios de aceptación:
- npm run typecheck → 0 errores.
- Manual (describe en el PR): Tab desde URL bar muestra primero
  "Saltar al contenido principal".
- Manual: con sidebar abierto, redimensionar a 1023 px no rompe layout
  (esto es preparación, el auto-collapse llega en PR #7).

Auto-documenting (mismo PR):
- TECH-DEBT.md: marcar DEBT-022 como Resuelto (2026-06-16). Marcar DEBT-023
  como Resuelto-parcial citando que ToolHeader ya consume --header-h.
- docs/decisions/technical/ADR-020-ux-ui-strategy-master-plan.md: añadir
  bloque "Execution log" al final con "PR #1 — feat/a11y-applayout-skip-link-aria
  → mergeada 2026-MM-DD".

Título de PR: feat: A11y de AppLayout — skip-link, ARIA labels, header-h var
```

---

## Prompt 2 — ADR-021: Design System Charter + tokens en CSS variables

**Branch:** `feat/ds-charter-css-vars`
**Modelo:** Opus (decisión arquitectónica + refactor amplio)
**CI Trigger:** `feat:`
**Cierra:** Spacing inconsistente, `CHART_PALETTE` duplicado
**Estimación:** M

```
Implementa la Fase 1 de ADR-020 — Design System Charter.

Branch: feat/ds-charter-css-vars

Antes de tocar código:
- Lee tailwind.config.ts entero (solo este puedes leerlo entero, es la fuente).
- grep -r "CHART_PALETTE" src/ — lista todos los consumidores.
- grep -rE "#[0-9A-Fa-f]{6}" src/shared/design-system/ src/shared/components/
  — lista hex inline en componentes (deben migrarse a tokens).

Tarea:

1. Redacta docs/decisions/technical/ADR-021-design-system-charter.md
   (usa template ADR-000). Decisiones a fijar:
   a) Escala space-* custom en tailwind: 1=4px, 2=8px, 3=12px, 4=16px,
      6=24px, 8=32px, 12=48px. PROHIBIDO usar px arbitrarios fuera de esta escala.
   b) Tokens de color en CSS variables en src/index.css :root (light) y
      html.dark (dark). Mantener equivalencia 1:1 con la paleta actual.
      Nombres: --color-gold, --color-navy, --color-warm-950, --color-warm-900,
      --color-warm-100, --color-success, --color-danger, --color-warning, --color-info.
   c) Helper src/shared/design-system/tokens.ts con
      export function token(name: string): string {
        return getComputedStyle(document.documentElement)
          .getPropertyValue(`--color-${name}`).trim()
      }
   d) Densidad configurable: prop `density: 'compact' | 'default' | 'comfortable'`
      en Table, FormField, Card. Default = 'default'. Mapea a paddings/heights.
   e) Prohibiciones: nada de hex inline en componentes; nada de Shadcn ni
      Carbon en package.json.

2. Implementa el charter:
   a) tailwind.config.ts: añadir extend.spacing con la escala. Borrar entradas
      ad-hoc si existen.
   b) src/index.css: añadir las CSS variables en :root y .dark.
   c) src/shared/design-system/tokens.ts: crear el helper.
   d) src/shared/components/charts/ChartWrapper.tsx: reescribir CHART_PALETTE
      para que use token('gold') etc. en lugar de hex literales. Mantener el
      export (compatibilidad con Recharts que necesita hex resueltos en
      tiempo de render — usar useMemo + token()).

3. NO migres todavía componentes que tienen hex inline — déjalos como deuda
   nueva DEBT-028 si encuentras alguno.

Restricciones:
- NO toques T1–T12 en esta PR.
- NO cambies el valor visual de ningún color (mismos hex, solo expuestos
  como CSS vars).
- Si la migración de CHART_PALETTE rompe Recharts (no soporta CSS vars en
  runtime), documenta el motivo en el ADR-021 y deja el helper token()
  igualmente para componentes no-chart.

Criterios de aceptación:
- npm run typecheck → 0 errores.
- npm run test → 0 fallos.
- Screenshot manual de T1, T7, T10: gráficos idénticos al estado anterior.

Auto-documenting:
- ADR-021 creado en estado ACCEPTED.
- docs/decisions/README.md: añadir fila ADR-021 en la tabla, actualizar
  "Próximo número disponible" a ADR-022.
- OVERVIEW.md: en la tabla Stack, cambiar la celda Styles a
  "Tailwind CSS 3 + Lucide React | Design system con tokens en CSS vars
  (ADR-020, ADR-021)".

Título de PR: feat: Design System Charter — escala space, tokens CSS vars, densidad (ADR-021)
```

---

## Prompt 3 — ChartWrapper accesible (aria-label + tabla alternativa)

**Branch:** `feat/a11y-chartwrapper-aria-table`
**Modelo:** Sonnet
**CI Trigger:** `feat:`
**Cierra:** DEBT-025
**Estimación:** S

```
Haz ChartWrapper accesible para lectores de pantalla.

Branch: feat/a11y-chartwrapper-aria-table

Antes de tocar código:
- Lee src/shared/components/charts/ChartWrapper.tsx
- grep -rl "ChartWrapper" src/views src/modules — lista todos los consumidores
  para entender qué datos pasan al gráfico.

Tarea:

1. src/shared/components/charts/ChartWrapper.tsx:
   - Añadir a ChartWrapperProps:
       ariaLabel:  string  // obligatoria
       dataTable?: ReactNode  // opcional pero fuertemente recomendada
   - Envolver ResponsiveContainer en:
       <div role="img" aria-label={ariaLabel}>
         <ResponsiveContainer .../>
       </div>
   - Si dataTable está presente, renderizar debajo:
       <details className="mt-2 text-xs text-text-muted">
         <summary className="cursor-pointer">Ver datos como tabla</summary>
         <div className="mt-2">{dataTable}</div>
       </details>

2. Actualiza TODOS los call-sites (lista del grep) para pasar ariaLabel.
   Construye ariaLabel descriptivo, p.ej.:
   - T1 radar: "Radar de madurez IA en 6 dimensiones para {empresa}"
   - T7 heatmap: "Heatmap de adopción por equipo y semana"
   - T10 dashboard: usar el title del wrapper si es lo bastante descriptivo

3. Para los 3 charts con mayor uso (T1, T7, T10), construye dataTable usando
   el componente <Table> del design system con los mismos datos que alimentan
   al gráfico.

Restricciones:
- NO cambies el aspecto visual del gráfico.
- NO añadas dependencias.

Criterios:
- npm run typecheck → 0 errores.
- TypeScript marca como error cualquier ChartWrapper sin ariaLabel
  (la prop es obligatoria).
- Manual: con un lector de pantalla, el gráfico se anuncia con el ariaLabel
  y el "Ver datos como tabla" es focuseable.

Auto-documenting:
- TECH-DEBT.md: marcar DEBT-025 como Resuelto (2026-MM-DD).
- ADR-020: añadir línea al "Execution log".

Título de PR: feat: ChartWrapper accesible — ariaLabel obligatoria + tabla alternativa
```

---

## Prompt 4 — useUnsavedChanges + confirmación en EngagementSelector

**Branch:** `refactor/unsaved-changes-engagement-selector`
**Modelo:** Sonnet
**CI Trigger:** `refactor`
**Cierra:** Crítico de "pérdida silenciosa al cambiar proyecto"
**Estimación:** M

```
Implementa protección contra pérdida de datos al cambiar engagement.

Branch: refactor/unsaved-changes-engagement-selector

Antes de tocar código:
- Lee src/shared/components/EngagementSelector.tsx
- grep -r "useEngagementStore" src/views src/modules
- grep -r "react-hook-form" src/lib/schemas (debería salir t4.schemas.ts)

Tarea:

1. Crear src/shared/hooks/useUnsavedChanges.ts:
   - Estado global ligero (Zustand store dedicado) con shape:
       { isDirty: boolean, source: string | null, setDirty: (source) => void,
         clearDirty: () => void }
   - Hook useUnsavedChanges() devuelve el estado y los setters.

2. En cada vista con formulario react-hook-form (hoy solo T4), llamar
   setDirty('T4') en formState.isDirty change, y clearDirty() en onSubmit
   success o onReset.

3. src/shared/components/EngagementSelector.tsx:
   - Antes de cambiar el active engagement, leer isDirty.
   - Si isDirty es true:
     - Abrir <Modal> del DS preguntando:
       "Tienes cambios sin guardar en {source}. ¿Cambiar de proyecto
        descartará los cambios. ¿Continuar?"
     - Botones: "Cancelar" (cierra modal) y "Descartar y continuar"
       (clearDirty + ejecuta el cambio).
   - Si isDirty es false: cambio directo (comportamiento actual).

4. Misma protección en AppSidebar al hacer goTo() de una T* distinta a la
   actual cuando isDirty === true.

Restricciones:
- Reusa Modal del DS, no crees uno nuevo.
- NO migres todavía formularios a RHF — esto se hace en Prompt 5/6.
- El hook debe funcionar incluso si solo T4 lo consume hoy.

Criterios:
- npm run typecheck → 0 errores.
- npm run test → 0 fallos. Añadir test unitario del store de useUnsavedChanges.
- Manual: en T4 modificar un campo → EngagementSelector → confirmación aparece.

Auto-documenting:
- TECH-DEBT.md: cerrar el medio "EngagementSelector cambia contexto sin
  confirmación" (DEBT-NNN nuevo si no existe).
- ADR-020: añadir línea al "Execution log".
- FDR-002 (crear si no existe): documentar el comportamiento visible.

Título de PR: refactor: useUnsavedChanges + confirmación al cambiar engagement
```

---

## Prompt 5 — ADR-022 + migración T2/T3/T4 a react-hook-form + zod

**Branch:** `refactor/forms-rhf-zod-t2-t3-t4`
**Modelo:** Opus (cross-file refactor con esquemas)
**CI Trigger:** `refactor`
**Cierra:** DEBT-024 (3/12 vistas)
**Estimación:** L

```
Migra T2, T3, T4 al estándar react-hook-form + zod, y documenta la regla.

Branch: refactor/forms-rhf-zod-t2-t3-t4

Antes de tocar código:
- Lee src/lib/schemas/t4.schemas.ts (es el patrón canónico).
- Lee LAS LÍNEAS DE FORMULARIO de src/views/T2View.tsx, T3View.tsx, T4View.tsx
  (grep "useState\|onSubmit\|onChange" — NO leas la vista completa).

Tarea:

1. Redacta docs/decisions/technical/ADR-022-forms-rhf-zod-standard.md
   (template ADR-000). Decisión:
   - Todo formulario nuevo o tocado en una PR debe usar
     useForm + zodResolver con schema en src/lib/schemas/t{N}.schemas.ts.
   - Errores se renderizan via prop errorText del FormField del DS.
   - Botones de submit deshabilitados con isSubmitting.
   - Hook useUnsavedChanges (ver Prompt 4) consume formState.isDirty.

2. Crea schemas:
   - src/lib/schemas/t2.schemas.ts: stakeholderSchema (Nombre min 2, Cargo
     min 2, Herramientas externas optional, Departamento enum).
   - src/lib/schemas/t3.schemas.ts: processSchema (Nombre proceso required,
     Departamento required, Responsable required, Descripción min 10,
     Fase de madurez enum 5 valores).
   - (t4 ya existe — verifica que está al día.)

3. Refactoriza cada vista:
   - useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) }).
   - Sustituye useState por register/control.
   - Pasa errors.<campo>?.message a errorText del FormField.
   - onSubmit con handleSubmit del RHF.
   - Botón submit: disabled={isSubmitting} y loading={isSubmitting}.

4. Mantén el ratio de validación: zodResolver valida onSubmit + onChange por
   defecto. NO añadas mode:'all' salvo que el UX lo pida (no en esta PR).

Restricciones:
- NO migres T1, T5–T12, LoginView en esta PR. Crear DEBT-024-bis con la
  lista pendiente.
- Si una vista supera 400 líneas tras el refactor, extrae el formulario a
  un componente hijo en una subcarpeta (ADR-013).
- Reusa FormField, Input, Textarea, Select del DS.

Criterios:
- npm run typecheck → 0 errores.
- npm run test → 0 fallos. Añade test unitario por schema (3 tests).
- Playwright: el flujo de creación de stakeholder, proceso y caso de uso
  sigue funcionando.

Auto-documenting:
- ADR-022 creado en estado ACCEPTED.
- decisions/README.md: añadir fila + "Próximo número disponible: ADR-023".
- TECH-DEBT.md: marcar DEBT-024 como En progreso (3/12 migradas), crear
  DEBT-024-bis listando vistas pendientes T1, T5–T12, LoginView.
- ADR-020 Execution log.

Título de PR: refactor: T2/T3/T4 a react-hook-form + zod (ADR-022)
```

---

## Prompt 6 — ToastProvider con cola limitada y variantes persistentes

**Branch:** `feat/toast-provider-queue`
**Modelo:** Sonnet
**CI Trigger:** `feat:`
**Cierra:** DEBT-027 (parte 1)
**Estimación:** S

```
Implementa ToastProvider con cola limitada y variantes persistentes.

Branch: feat/toast-provider-queue

Antes de tocar código:
- Lee src/shared/design-system/components/Toast.tsx
- grep -r "useToast\|showToast" src/ — lista call-sites

Tarea:

1. src/shared/design-system/components/Toast.tsx:
   - Convertir el hook useToast en provider + hook:
     - <ToastProvider> en src/App.tsx envolviendo el árbol.
     - Cola interna en estado local con máximo 3 toasts simultáneos.
     - Al añadir el 4º, descartar el más antiguo (FIFO).
   - Duraciones por variante:
       success: 3000, info: 4000, warning: 6000, danger: 8000.
   - Prop persistent?: boolean en showToast(). Si true, no auto-cierra
     y muestra botón X explícito.
   - Mantener role="alert" y aria-live="polite".

2. Posicionamiento responsive:
   - Mobile (< sm): top center, full width menos 16px.
   - Desktop (>= sm): bottom right como ahora.

Restricciones:
- NO rompas la API actual de showToast (success/error/warning/info).
- NO añadas dependencias.

Criterios:
- npm run typecheck → 0 errores.
- Test unitario: emitir 4 toasts, el primero se descarta automáticamente.
- Test unitario: persistent=true no auto-cierra.

Auto-documenting:
- TECH-DEBT.md: marcar DEBT-027 (parte 1) como Resuelto. Mantener DEBT-027
  parte 2 (StreamingIndicator) abierto.
- ADR-020 Execution log.

Título de PR: feat: ToastProvider con cola limitada y variantes persistentes
```

---

## Prompt 7 — Sidebar responsive auto-collapse + tablas mobile-friendly

**Branch:** `feat/sidebar-responsive-tables-mobile`
**Modelo:** Sonnet
**CI Trigger:** `feat:`
**Cierra:** DEBT-026 + crítico de tablas sin column priority
**Estimación:** M

```
Sidebar auto-colapsa en viewports < lg y tablas tienen patrón mobile.

Branch: feat/sidebar-responsive-tables-mobile

Antes de tocar código:
- Lee src/shared/components/AppSidebar.tsx
- Lee src/shared/design-system/components/Table.tsx

Tarea:

1. Hook src/shared/hooks/useMediaQuery.ts:
   - useMediaQuery(query: string): boolean
   - Usa window.matchMedia + listener.

2. src/shared/components/AppSidebar.tsx:
   - const isLg = useMediaQuery('(min-width: 1024px)')
   - En >= lg, el sidebar se renderiza inline (no fixed) y reserva su ancho
     en el grid del AppLayout.
   - En < lg, mantiene comportamiento actual (fixed + backdrop + toggle).
   - La altura ya no es h-[calc(100vh-57px)] sino h-[calc(100vh-var(--header-h))]
     (debería haberse hecho en Prompt 1; verifica).

3. AppLayout.tsx:
   - En >= lg, el <main> tiene margin-left igual al ancho del sidebar.
   - En < lg, no.

4. src/shared/design-system/components/Table.tsx:
   - Añadir prop columnPriority?: ('high' | 'medium' | 'low')[] alineado con
     el array de columnas.
   - En < md (640px), las columnas con priority 'low' se ocultan; con priority
     'medium' se muestran solo si caben.
   - Como alternativa al scroll horizontal, prop mobileView?:
     'scroll' | 'cards'. Si 'cards', en mobile la tabla se renderiza como
     lista vertical de Cards con label: value.

Restricciones:
- NO migres todavía las tablas T1–T12 al modo cards — eso es PR separada
  (DEBT-026-bis). Esta PR solo añade la capacidad.

Criterios:
- npm run typecheck → 0 errores.
- Manual: redimensionar 1500 → 1023 px → 640 px → 375 px sin layout broken.
- Playwright: snapshot visual de T1 a 1024 px y 640 px.

Auto-documenting:
- TECH-DEBT.md: marcar DEBT-026 como Resuelto. Crear DEBT-026-bis "Aplicar
  columnPriority en tablas T1–T12".
- ADR-020 Execution log.

Título de PR: feat: sidebar responsive + Table con columnPriority y mobileView
```

---

## Prompt 8 — StreamingIndicator para invocaciones LLM no bloqueantes

**Branch:** `feat/streaming-indicator-llm`
**Modelo:** Opus (toca ADR-014)
**CI Trigger:** `feat:`
**Cierra:** DEBT-027 (parte 2)
**Estimación:** M

```
StreamingIndicator inline para llamadas LLM sin bloquear la UI.

Branch: feat/streaming-indicator-llm

Antes de tocar código:
- Lee src/shared/hooks/useEdgeFunctionInvoke (o el path real — grep).
- Lee src/shared/components/ToolLoadingScreen.tsx
- grep -r "useEdgeFunctionInvoke" src/views src/modules

Tarea:

1. Componente src/shared/design-system/components/StreamingIndicator.tsx:
   - Props: { label?: string, variant?: 'inline' | 'card' }
   - Render: barra shimmer + Spinner + texto "Generando con IA…" o label.
   - Inline: una línea, alto 24 px. Card: ocupa el espacio del contenedor.
   - role="status" + aria-live="polite".

2. Refactor src/shared/hooks/useEdgeFunctionInvoke (extensión NO breaking):
   - Asegurar que el hook expone state: 'idle' | 'pending' | 'success' | 'error'.
   - Mantener la API actual; añadir lo que falte sin romper consumidores.

3. En las vistas que invoquen LLM (al menos T6 según OVERVIEW), sustituir
   ToolLoadingScreen por StreamingIndicator embebido en la sección que
   muestra el resultado. La UI alrededor (formulario, navegación) NO debe
   bloquearse.

4. Documenta en ADR-014 (apéndice) la fase observable y el patrón de uso
   con StreamingIndicator.

Restricciones:
- NO elimines ToolLoadingScreen — sigue siendo válido para cargas globales
  (carga inicial de una vista). Solo dejar de usarlo para LLM en sección.
- NO añadas dependencias.

Criterios:
- npm run typecheck → 0 errores.
- Manual: invocar T6 (LLM) y verificar que el formulario sigue interactivo
  durante la espera.

Auto-documenting:
- TECH-DEBT.md: marcar DEBT-027 (parte 2) como Resuelto. DEBT-027 cerrado.
- ADR-014: añadir apéndice "Observable phase + StreamingIndicator pattern".
- ADR-020 Execution log.

Título de PR: feat: StreamingIndicator inline para invocaciones LLM
```

---

## Prompt 9 — FDR-003: estados vs tabs — separación visual en T4

**Branch:** `refactor/t4-states-vs-tabs-separation`
**Modelo:** Sonnet
**CI Trigger:** `refactor`
**Cierra:** Confusión semántica detectada en el benchmark
**Estimación:** S

```
Separa visualmente "estados del caso" (Go/En piloto/...) de las pestañas
de navegación (Scoring/Economía/Hoja de ruta/...) en T4.

Branch: refactor/t4-states-vs-tabs-separation

Antes de tocar código:
- Lee SOLO la sección de cabecera de src/views/T4View.tsx (grep "Go\|En piloto\|
  Priorizado\|Candidato\|No-Go\|Completado\|Scoring\|Economía")
- Mira la captura screenshot de T4 en docs/sessions/2026-06-16_screenshots/
  (si no existe, salta este paso).

Diagnóstico previo (ADR-020):
- "Go / En piloto / Priorizado / Candidato / No-Go / Completado" son ESTADOS
  del caso de uso → componente SegmentedControl o chip group con label
  "Estado:" explícito a la izquierda.
- "Scoring / Economía / Hoja de ruta / Contexto T1/T2 / AI Act" son TABS de
  navegación lógica → componente Tabs del DS, con role="tablist" y
  separación visual clara (underline o bg-fill).

Tarea:

1. Redacta docs/decisions/functional/FDR-003-t4-states-vs-tabs.md.
   Documenta el cambio visible al usuario:
   - "Estado" pasa a ser un control con label izquierda y SegmentedControl
     pill, con color que indique el grupo (go/piloto = verde,
     candidato/priorizado = info, no-go = danger, completado = gold).
   - "Tabs" pasan a un Tabs primario con underline navy y aria-selected.

2. T4View.tsx (sección de cabecera SOLO):
   - Sustituye el grupo de pills de estado por <SegmentedControl> con label.
   - Sustituye el grupo de tabs por <Tabs> del DS.

Restricciones:
- NO toques el contenido de cada tab (Scoring, Economía, etc.).
- NO toques el resto de T4View.

Criterios:
- npm run typecheck → 0 errores.
- Manual: a primera vista, queda claro que Estado es un atributo del caso
  y Tabs es la navegación interna de la vista.

Auto-documenting:
- FDR-003 creado en estado ACCEPTED.
- decisions/README.md: añadir fila FDR-003.
- ADR-020 Execution log.

Título de PR: refactor: T4 — separación visual entre estados del caso y tabs (FDR-003)
```

---

## Resumen ejecutable

| # | Branch | Modelo | Coste | Cierra | Prereq |
|---|---|---|---|---|---|
| 0 | (contexto, no PR) | — | — | — | — |
| 1 | feat/a11y-applayout-skip-link-aria | Sonnet | XS | DEBT-022, DEBT-023* | — |
| 2 | feat/ds-charter-css-vars | Opus | M | ADR-021 | 1 |
| 3 | feat/a11y-chartwrapper-aria-table | Sonnet | S | DEBT-025 | 2 |
| 4 | refactor/unsaved-changes-engagement-selector | Sonnet | M | — | 1 |
| 5 | refactor/forms-rhf-zod-t2-t3-t4 | Opus | L | DEBT-024 (3/12), ADR-022 | 4 |
| 6 | feat/toast-provider-queue | Sonnet | S | DEBT-027 (1/2) | 1 |
| 7 | feat/sidebar-responsive-tables-mobile | Sonnet | M | DEBT-026 | 1, 2 |
| 8 | feat/streaming-indicator-llm | Opus | M | DEBT-027 (2/2) | 6 |
| 9 | refactor/t4-states-vs-tabs-separation | Sonnet | S | FDR-003 | 2 |

**Orden recomendado de ejecución:** 0 → 1 → 2 → 6 → 4 → 3 → 5 → 7 → 8 → 9.

**Reglas de uso:**
- Una PR por prompt. Nunca mezclar prompts en una sola PR.
- Si la IA-code pide leer ficheros no listados, redirige al Prompt 0.
- Revisa siempre el diff antes de mergear; CLAUDE.md prohíbe explorar fuera del scope.
- Tras cada merge, marca el item correspondiente en TECH-DEBT.md y añade
  línea al Execution log de ADR-020.

---
*GOBY — Plan Maestro UX/UI 2026-06-16 · ADR-020*

# Mega-prompt: ejecutar Prompts 3-9 de ADR-020 en una sola sesión

**Fecha:** 2026-06-16
**Origen:** ADR-020 (Plan Maestro UX/UI), Prompts 3-9 de `2026-06-16_ux-ui-prompts-ia-code.md`
**Destinatario:** Claude Code en VS Code (sesión IA-code con acceso CLI al repo)
**Rama destino:** `refactor/ux-ui-adr020-consolidation` (ya existe en remoto, contiene Prompts 1+2)
**Output esperado:** 7 commits secuenciales sobre la rama + 1 PR a develop

---

## Prompt único (pegar tal cual)

```
Repo: GOBY (lean-ai-system) — Alpha Consulting.
Estás en VS Code con acceso CLI completo.

═══════════════════════════════════════════════════════════════════
SETUP — ejecuta esto primero, sin desviarte
═══════════════════════════════════════════════════════════════════

1. Lee y resume en una línea cada uno (NO leas nada más por iniciativa propia):
   - CLAUDE.md
   - docs/decisions/technical/ADR-020-ux-ui-strategy-master-plan.md
   - docs/decisions/technical/ADR-021-design-system-charter.md
   - docs/architecture/TECH-DEBT.md (busca DEBT-022 a DEBT-027)
   - docs/architecture/OVERVIEW.md (sólo sección Stack)
   - docs/sessions/2026-06-16_ux-ui-prompts-ia-code.md (Prompts 3 a 9)

2. Estado git esperado al empezar:
   git fetch --all --prune
   git checkout refactor/ux-ui-adr020-consolidation
   git pull origin refactor/ux-ui-adr020-consolidation

3. Verifica que ya tiene los Prompts 1 y 2. Si NO los tiene, mergea:
   git merge --no-ff feat/a11y-applayout-skip-link-aria -m "merge: a11y AppLayout chassis (DEBT-022)"
   (el Prompt 2 ya debería estar en HEAD; si no, mergea también feat/ds-charter-css-vars)

4. Verifica que el árbol está limpio:
   git status   →   nothing to commit, working tree clean

Si algo falla en el SETUP, PARA y dime qué pasó.

═══════════════════════════════════════════════════════════════════
REGLAS OBLIGATORIAS en TODA la sesión
═══════════════════════════════════════════════════════════════════

- ADR-005: ningún comando que Carlos no pueda ejecutar (sin CLI propio). Las
  modificaciones aquí las haces tú vía CLI; el resto (merges PR-side) lo hará
  Carlos por GitHub.
- ADR-011: ninguna importación directa de @supabase/supabase-js en Views o
  Stores. Usa src/services/.
- ADR-013: ningún componente de view > 400 líneas. Extrae a subcarpeta si crece.
- ADR-014: toda llamada LLM via useEdgeFunctionInvoke.
- Token-opt: grep para localizar; lee SOLO líneas relevantes; nunca abras un
  fichero entero "por contexto".
- Reusa Button, FormField, Card, Badge, Modal, Tabs, Toast, Spinner del DS.
  No crees componentes nuevos salvo que tengan >=2 consumidores reales.
- UN PROMPT = UN COMMIT. No mezcles tareas en el mismo commit.
- Después de cada commit, actualiza:
  • docs/architecture/TECH-DEBT.md → marca el DEBT correspondiente como
    Resuelto (YYYY-MM-DD) o crea DEBT-NNN-bis si queda trabajo pendiente.
  • docs/decisions/technical/ADR-020-ux-ui-strategy-master-plan.md → añade
    fila al "Execution log" (NO al "Estado real por prompt"; eso lo
    actualizas al final).
  Estos cambios entran en el MISMO commit que la feature.

═══════════════════════════════════════════════════════════════════
TAREA 1 / 7 — Prompt 3 — ChartWrapper accesible
═══════════════════════════════════════════════════════════════════

Files a tocar:
  src/shared/components/charts/ChartWrapper.tsx
  Todos los call-sites (grep -rl "ChartWrapper" src/views src/modules)

Cambios:
  • ChartWrapperProps:
      ariaLabel:  string         // OBLIGATORIA (TS no opcional)
      dataTable?: ReactNode      // opcional pero recomendada
  • Envolver ResponsiveContainer en <div role="img" aria-label={ariaLabel}>.
  • Si dataTable presente: renderizar <details><summary>Ver datos como tabla
    </summary>{dataTable}</details>.
  • Actualizar TODOS los consumidores con ariaLabel descriptivo. Para T1, T7,
    T10 construye dataTable usando el componente <Table> del DS.

Verificación:
  npx tsc --noEmit       (debe pasar; los call-sites sin ariaLabel ahora son
                           errores de tipo)
  npm run test           (0 fallos)

Commit:
  git add .
  git commit -m "feat: ChartWrapper accesible — ariaLabel obligatoria + tabla alternativa (DEBT-025)"

Actualiza TECH-DEBT.md: DEBT-025 → Resuelto (2026-06-16).
Actualiza ADR-020 Execution log con una fila nueva.

═══════════════════════════════════════════════════════════════════
TAREA 2 / 7 — Prompt 4 — useUnsavedChanges + confirm en EngagementSelector
═══════════════════════════════════════════════════════════════════

Files a crear/tocar:
  src/shared/hooks/useUnsavedChanges.ts            (nuevo, store Zustand ligero)
  src/shared/components/EngagementSelector.tsx     (consumir hook)
  src/shared/components/AppSidebar.tsx             (consumir hook al goTo)
  src/views/T4View.tsx                              (llamar setDirty('T4') en
                                                    isDirty change; T4 ya
                                                    usa RHF según ADR-020)

Patrón:
  const useUnsavedChanges = create<UnsavedState>((set) => ({
    isDirty: false,
    source:  null,
    setDirty:   (src) => set({ isDirty: true,  source: src }),
    clearDirty: ()    => set({ isDirty: false, source: null }),
  }))

  En EngagementSelector y AppSidebar, antes de navegar:
    if (useUnsavedChanges.getState().isDirty) {
       abrir <Modal> del DS preguntando confirmación
       botones: "Cancelar" / "Descartar y continuar" (clearDirty + ejecuta)
    }

Reusa Modal del DS. No crees uno nuevo.

Verificación:
  npx tsc --noEmit
  npm run test
  Test unitario nuevo: src/__tests__/unit/hooks/useUnsavedChanges.test.ts

Commit:
  git commit -m "refactor: useUnsavedChanges + confirm al cambiar engagement"

Actualiza ADR-020 Execution log.

═══════════════════════════════════════════════════════════════════
TAREA 3 / 7 — Prompt 5 — RHF+Zod en T2/T3/T4 + ADR-022
═══════════════════════════════════════════════════════════════════

Pre-requisito:
  npm i -D @hookform/resolvers   (si no está ya)

Files a crear/tocar:
  docs/decisions/technical/ADR-022-forms-rhf-zod-standard.md   (nuevo)
  src/lib/schemas/t2.schemas.ts                                (nuevo)
  src/lib/schemas/t3.schemas.ts                                (nuevo)
  (t4.schemas.ts ya existe — verifica que está al día)
  Views: src/modules/T2_StakeholderMatrix/...
         src/modules/T3_ValueStreamMap/...
         src/modules/T4_UseCasePriorityBoard/...

ADR-022 (template ADR-000, estado ACCEPTED):
  Decisión: todo formulario nuevo o tocado en una PR usa useForm +
  zodResolver con schema en src/lib/schemas/t{N}.schemas.ts. Errores
  vía errorText de FormField. submit deshabilitado con isSubmitting.

Schemas:
  t2: stakeholderSchema (Nombre min 2, Cargo min 2, HerramientasExternas
      optional, Departamento enum 'finanzas'|'ventas'|...)
  t3: processSchema (NombreProceso required, Departamento required,
      Responsable required, Descripcion min 10, FaseMadurez enum
      'idea'|'validacion'|'piloto'|'estandarizacion'|'escalado')

Refactor de cada view:
  useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  Sustituye useState por register/control. errors.<campo>?.message →
  errorText. onSubmit con handleSubmit. Botón loading={isSubmitting}.

Si una view supera 400 líneas tras el refactor, extrae el formulario a
hijo en subcarpeta (ADR-013).

Verificación:
  npx tsc --noEmit
  npm run test       (añade 1 test por schema = 3 tests nuevos)

Commit:
  git commit -m "refactor: T2/T3/T4 a react-hook-form + zod (ADR-022)"

Actualiza:
  • docs/decisions/README.md (añadir fila ADR-022, próximo libre ADR-023)
  • TECH-DEBT.md: DEBT-024 → En progreso (3/12); crear DEBT-024-bis con T1,
    T5-T12, LoginView pendientes
  • ADR-020 Execution log

═══════════════════════════════════════════════════════════════════
TAREA 4 / 7 — Prompt 6 — ToastProvider con cola limitada
═══════════════════════════════════════════════════════════════════

Files a tocar:
  src/shared/design-system/components/Toast.tsx
  src/App.tsx   (montar <ToastProvider>)

Cambios:
  • Convertir useToast en provider + hook.
  • Cola interna en estado local, máximo 3 simultáneos. FIFO al llegar al 4º.
  • Duraciones por variante: success=3000, info=4000, warning=6000, danger=8000.
  • Prop persistent?: boolean → no auto-close + botón X explícito.
  • role="alert" + aria-live="polite" mantenidos.
  • Posicionamiento responsive: mobile (<sm) top center / desktop (>=sm) bottom right.
  • API showToast() mantiene firma actual (no breaking).

Verificación:
  npx tsc --noEmit
  npm run test       (2 tests nuevos: cola FIFO + persistent)

Commit:
  git commit -m "feat: ToastProvider con cola limitada y variantes persistentes"

Actualiza TECH-DEBT.md: DEBT-027 parte 1 → Resuelto. Parte 2 (StreamingIndicator)
sigue abierta. Actualiza ADR-020 Execution log.

═══════════════════════════════════════════════════════════════════
TAREA 5 / 7 — Prompt 7 — Sidebar responsive + Table columnPriority
═══════════════════════════════════════════════════════════════════

Files a crear/tocar:
  src/shared/hooks/useMediaQuery.ts                  (nuevo)
  src/shared/components/AppSidebar.tsx
  src/shared/layouts/AppLayout.tsx
  src/shared/design-system/components/Table.tsx

Cambios:
  • useMediaQuery(query: string): boolean   (matchMedia + listener).
  • AppSidebar: const isLg = useMediaQuery('(min-width: 1024px)').
    En >=lg renderiza inline (reserva ancho en grid del AppLayout).
    En <lg mantiene fixed + backdrop + toggle (comportamiento actual).
  • AppLayout: en >=lg <main> tiene margin-left del ancho del sidebar.
  • Table:
      añadir prop columnPriority?: ('high' | 'medium' | 'low')[]
      añadir prop mobileView?: 'scroll' | 'cards'
      En <md ocultar columnas 'low'; 'medium' solo si caben.
      Si mobileView='cards', en mobile renderiza como lista vertical de Cards.

NO migres todavía las tablas T1-T12 al modo cards (eso es PR separada
DEBT-026-bis). Esta tarea solo añade la capacidad.

Verificación:
  npx tsc --noEmit
  npm run test
  Manual: redimensionar 1500 → 1023 → 640 → 375 px sin layout broken.

Commit:
  git commit -m "feat: sidebar responsive + Table columnPriority/mobileView (DEBT-026)"

Actualiza TECH-DEBT.md: DEBT-026 → Resuelto. Crear DEBT-026-bis.
Actualiza ADR-020 Execution log.

═══════════════════════════════════════════════════════════════════
TAREA 6 / 7 — Prompt 8 — StreamingIndicator inline para LLM
═══════════════════════════════════════════════════════════════════

Files a crear/tocar:
  src/shared/design-system/components/StreamingIndicator.tsx   (nuevo)
  src/shared/hooks/useEdgeFunctionInvoke.ts                    (extender)
  src/modules/T6_RiskGovernance/.../PolicyTab.tsx              (consumir)
  docs/decisions/technical/ADR-014-edge-function-hook-pattern.md (apéndice A)

Cambios:
  • StreamingIndicator props: { label?: string, variant?: 'inline' | 'card' }
    Renderiza: shimmer bar + Spinner + texto "Generando con IA…" o label.
    Inline = una línea 24px. Card = ocupa el contenedor.
    role="status" + aria-live="polite".
  • useEdgeFunctionInvoke: exponer state: 'idle' | 'pending' | 'success' | 'error'
    (NON-BREAKING — mantener API actual, solo añadir state).
  • En T6 (al menos), sustituir ToolLoadingScreen por StreamingIndicator
    embebido EN LA SECCIÓN del resultado. La UI alrededor (formulario,
    navegación) NO debe bloquearse.
  • ADR-014: añadir Appendix A documentando la fase observable y el patrón
    StreamingIndicator. No reescribas el ADR; solo añade el apéndice al final.

NO elimines ToolLoadingScreen — sigue válido para cargas globales (carga
inicial de view).

Verificación:
  npx tsc --noEmit
  npm run test
  Manual: invocar T6 LLM → el formulario sigue interactivo durante la espera.

Commit:
  git commit -m "feat: StreamingIndicator inline para invocaciones LLM"

Actualiza TECH-DEBT.md: DEBT-027 parte 2 → Resuelto, DEBT-027 cerrado.
Actualiza ADR-020 Execution log.

═══════════════════════════════════════════════════════════════════
TAREA 7 / 7 — Prompt 9 — FDR-003 T4 estados vs tabs
═══════════════════════════════════════════════════════════════════

Files a tocar:
  docs/decisions/functional/FDR-003-t4-states-vs-tabs.md         (nuevo)
  src/modules/T4_UseCasePriorityBoard/.../UseCaseDetailPanel.tsx (cabecera)
  docs/decisions/README.md                                       (registrar FDR-003)

Cambios:
  • Solo la SECCIÓN DE CABECERA de UseCaseDetailPanel (grep "Go\|En piloto\|
    Priorizado\|Candidato\|No-Go\|Completado").
  • Pills manuales de estado → <SegmentedControl> con label izquierda
    "Estado:" y activeColor semántico (go/piloto=success,
    priorizado/candidato=info, no-go=danger, completado=gold).
  • Tabs pill (Scoring/Economía/Hoja de ruta/...) → <Tabs variant="underline">
    del DS con aria-selected.
  • FDR-003 (template FDR-000): documenta el cambio visible al usuario.

NO toques el contenido interno de cada tab. NO toques el resto de la view.

Verificación:
  npx tsc --noEmit
  Manual: queda claro visualmente que Estado = atributo del caso,
  Tabs = navegación interna.

Commit:
  git commit -m "refactor: T4 — separación visual estado vs tabs (FDR-003)"

Actualiza docs/decisions/README.md (fila FDR-003) y ADR-020 Execution log.

═══════════════════════════════════════════════════════════════════
CIERRE — verificación global y actualización de estado
═══════════════════════════════════════════════════════════════════

1. Verificación completa:
   npm ci
   npx tsc --noEmit                  → 0 errores
   npm run test                      → 0 fallos
   npm run build                     → exit 0
   npx playwright test               → todos verdes
   (si Playwright falla por dev server no levantado, levantarlo con npm run
    dev en otra terminal y reintentar)

2. Actualiza la tabla "Estado real por prompt" del ADR-020:
   Prompts 3-9 → ✅ Commiteado.

3. Push final:
   git push origin refactor/ux-ui-adr020-consolidation

4. Reporta:
   • Lista de los 7 commits (git log --oneline -7).
   • Cambios netos por fichero (git diff --stat develop..HEAD).
   • Cualquier DEBT nuevo creado.
   • Cualquier criterio de aceptación que no se haya cumplido (PARA en lugar
     de seguir si algo falla).

═══════════════════════════════════════════════════════════════════
NO HAGAS lo siguiente
═══════════════════════════════════════════════════════════════════

- NO abras un PR a develop. Eso lo hace Carlos por GitHub web.
- NO borres ninguna rama existente.
- NO mergees develop dentro de refactor/ux-ui-adr020-consolidation salvo
  que haya conflictos forzosos al pushear.
- NO modifiques ningún ADR existente (001-019, 021) salvo ADR-014 (apéndice A).
- NO añadas dependencias salvo @hookform/resolvers (Tarea 3).
- NO toques T1, T5-T12, LoginView para formularios — eso queda en DEBT-024-bis.
- NO migres tablas T1-T12 a mobileView='cards' — eso queda en DEBT-026-bis.

Empieza por el SETUP. Confirma que tienes el árbol limpio antes de iniciar
la Tarea 1. Después ejecuta de la 1 a la 7 en orden, sin saltarte ninguna.
```

---

## Estado esperado de las ramas tras la sesión

**Antes** (estado actual del repo):
```
develop
└── refactor/ux-ui-adr020-consolidation   (con Prompt 2 / DS Charter)
    └── feat/a11y-applayout-skip-link-aria (pendiente de merge — Prompt 1)
feat/ds-charter-css-vars   (mismo HEAD que refactor/ux-ui-adr020-consolidation)
```

**Después**:
```
develop
└── refactor/ux-ui-adr020-consolidation
    ├── (Prompt 2)  feat: Design System Charter — ADR-021
    ├── (Prompt 1)  feat: A11y AppLayout chassis — DEBT-022 [merge --no-ff]
    ├── (Prompt 3)  feat: ChartWrapper accesible — DEBT-025
    ├── (Prompt 4)  refactor: useUnsavedChanges + confirm engagement
    ├── (Prompt 5)  refactor: T2/T3/T4 a RHF+zod — ADR-022
    ├── (Prompt 6)  feat: ToastProvider con cola limitada
    ├── (Prompt 7)  feat: sidebar responsive + Table columnPriority
    ├── (Prompt 8)  feat: StreamingIndicator inline LLM
    └── (Prompt 9)  refactor: T4 estados vs tabs — FDR-003
```

**Ramas que pueden borrarse después del merge del PR**:
- `feat/a11y-applayout-skip-link-aria` (ya consolidada)
- `feat/ds-charter-css-vars` (ya consolidada)
- `refactor/ux-ui-adr020-consolidation` (después de mergear en develop)

**Lo que hará Carlos por GitHub web tras la sesión**:

1. Revisar PR `develop ← refactor/ux-ui-adr020-consolidation`.
2. Esperar checks `ci`, `validate-docs` y Playwright en verde.
3. Merge con **Create a merge commit** (no squash, queremos preservar la
   historia de los 9 commits).
4. Borrar las 3 ramas listadas arriba (botón "Delete branch" en GitHub).

---

## Si algo se tuerce a mitad de sesión

- **Conflicto en `ADR-020`**: deja la versión actual saneada (la del HEAD
  de la rama). Reaplica solo la nueva fila del Execution log.
- **Test falla en Tarea N**: PARA. Reporta el output. NO sigas a la Tarea N+1.
- **Lockfile EPERM en `npm i @hookform/resolvers`**: cierra Storybook,
  dev server, e IDE; reintenta. Si persiste, ejecuta PowerShell como
  Administrador.
- **`npm run build` rompe por timeout**: usa `npx tsc --noEmit` solo para
  verificar tipos en cada tarea; el `build` completo solo al cierre.

---
*GOBY · ADR-020 · Mega-prompt Fase 3-9 · 2026-06-16*

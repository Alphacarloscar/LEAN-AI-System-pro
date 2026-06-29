# Technical Debt Register — GOBY

Last updated: 2026-06-26
AI-Ready Repository System v2.1.0

> Registro activo de deuda técnica conocida. Cada item tiene severidad, impacto y plan de acción.
> Política: detectar en cualquier PR → logear aquí → abordar en PR separado y dedicado.
> NO mezclar deuda técnica con features en el mismo PR.

---

## Items Activos

### DEBT-002 — Branch protection pendiente de activar en GitHub
**Severidad:** 🟡 Media
**Detectado:** 2026-06-01 (AI-Ready Setup)
**Área:** GitHub → Settings → Branches
**Estado:** CI configurado (`ci.yml` + `validate-docs.yml` operativos). Pendiente: activar branch protection en GitHub (acción manual de Carlos).

**Descripción:**
Los workflows `.github/workflows/ci.yml` y `validate-docs.yml` están creados y operativos. Sin branch protection activa, los workflows se ejecutan pero no bloquean merges. Riesgo: PRs con TypeScript errors o sin CHANGELOG pueden mergearse a `main`/`develop`.

**Acción pendiente (manual — Carlos):**
1. Ir a GitHub → Settings → Branches
2. Añadir regla de protección para `main`:
   - Require PR before merging ✅
   - Status checks requeridos: `ci`, `validate-docs` ✅
   - Require 1 approval ✅
3. Añadir regla de protección para `develop`:
   - Status checks requeridos: `ci` ✅
4. Añadir GitHub Secrets si CI necesita variables de entorno:
   - `VITE_SUPABASE_URL` (para build checks)
   - `VITE_SUPABASE_ANON_KEY` (para build checks)

---

### DEBT-031 — Cabeceras de herramienta (ToolHeader) duplicadas en T1–T12
**Severidad:** 🟡 Media
**Detectado:** 2026-06-05 (Sprint 11, durante P1 — normalización de "Volver al dashboard")
**Área:** src/modules/T*/T*View.tsx (cabeceras), src/modules/CompanyProfile/CompanyProfileView.tsx
**Estado:** Pendiente — POST-DEMO (no abrir antes de las demos semana 9-jun-2026)

**Descripción:**
Cada herramienta T1–T12 reescribe a mano su cabecera: badge `T[N]`, título, `PhaseMiniMap`, breadcrumb y el botón de vuelta. La normalización del back button (P1, FDR-001, `BackToDashboard`) resolvió la variante más visible, pero el resto del patrón de cabecera sigue duplicado 12 veces con divergencias menores de spacing/markup. Es la causa raíz de la fragmentación que P1 atacó en su síntoma.

**Impacto:**
- Cualquier ajuste de cabecera (estilo, accesibilidad, breadcrumb) hay que replicarlo en 12 ficheros.
- Riesgo de reintroducir inconsistencias visuales herramienta a herramienta.
- Mayor superficie de regresión en cada cambio de UX transversal.

**Plan de acción:**
1. Extraer `<ToolHeader toolCode phase onBack? actions? />` en `src/shared/components/`, encapsulando badge + título + `PhaseMiniMap` + `BackToDashboard` + breadcrumb.
2. Migrar T1–T12 + CompanyProfile a `ToolHeader` en un PR dedicado.
3. Hacerlo **después** de DEBT-001 (tests) o, como mínimo, con smoke test visual por herramienta — sin red de seguridad automatizada, tocar 12 headers a la vez es alto riesgo de regresión (motivo de diferirlo respecto a las demos).

**Requiere ADR:** No (componente de presentación compartido, no decisión arquitectónica nueva). Sí requiere FDR si cambia el contenido/comportamiento visible de la cabecera.

**Relacionado:** FDR-001 (BackToDashboard), DEBT-001 (sin tests).

---

### DEBT-013 — Overrides CSS transitoria gray→warm en index.css
**Severidad:** 🟡 Media
**Detectado:** 2026-06-25 (dark mode audit)
**Área:** `src/index.css` líneas ~152–270
**Estado:** Pendiente

**Descripción:**
`index.css` contiene bloques de overrides que redirigen clases Tailwind `gray-*` a tokens `warm-*` para dark mode:
```css
html.dark .dark\:bg-gray-900  { background-color: #22201C; }
html.dark .dark\:text-gray-100 { color: #F0EDE8; }
/* etc. */
```
Estos overrides existen como red de seguridad para código migrado que pueda tener ocurrencias dispersas no revisadas.

**Impacto:** Deuda semántica — puede crear inconsistencias si el override no cubre un token específico.

**Plan de acción:**
1. Ejecutar `grep -r "dark:.*gray-" src/ --include="*.tsx"` periódicamente.
2. Cuando el grep retorne 0 resultados, eliminar los bloques de override en `index.css`.

---

### DEBT-014 — Tokens semánticos text-muted/text-subtle/surface sin variante dark automática en tailwind.config.ts
**Severidad:** 🟡 Media
**Detectado:** 2026-06-25 (dark mode audit)
**Área:** `tailwind.config.ts`
**Estado:** Pendiente

**Descripción:**
Los tokens `text-muted`, `text-subtle`, `surface`, `border` están definidos en `tailwind.config.ts` como strings planos. El dark mode de estos tokens se gestiona mediante overrides CSS globales en `index.css`. El resultado es correcto pero frágil: si alguien añade `dark:text-text-muted` esperando comportamiento Tailwind nativo, no funcionará.

**Plan de acción (diferido):**
Convertir tokens a `'text-muted': 'var(--color-text-muted)'` coordinando con ADR-021.

---

### DEBT-030 — Fuzz testing de schemas Zod (T2, T3, T4) — diferido post-merge
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-26
**Área:** `src/lib/schemas/t2.schemas.ts`, `t3.schemas.ts`, `t4.schemas.ts`
**Estado:** Pendiente — PR dedicada post-merge

**Descripción:**
Los schemas Zod de T2 (`stakeholderFormSchema`), T3 (`processFormSchema`) y T4 (`useCaseFormSchema`) son candidatos ideales para property-based testing con `fast-check`. Generando inputs aleatorios se detectarían edge cases de validación (strings muy largos, valores numéricos en límite, campos opcionales undefined vs null) que los tests deterministas no cubren.

**Plan de acción:**
1. `npm install --save-dev fast-check`
2. Crear `src/__tests__/schemas/fuzz-t2-t3-t4.test.ts` con `fc.assert` + `fc.property`
3. Conectar al pipeline CI existente (`npm run test`)

**Requiere ADR:** No.
**Relacionado:** ADR-022, DEBT-024.

---

### ~~DEBT-037~~ — t4.spec.ts usaba networkidle en vista con cold-start LLM ✅ (Resuelto — 2026-06-29)
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-29 (CI timeout 120s en test "el panel de scoring/detalle tiene los tabs esperados")
**Área:** `e2e/t4.spec.ts` — `beforeEach` + test línea 66
**Estado:** Resuelto en PR `fix(e2e): t4 scoring panel — anclar espera a elemento estable, no networkidle [e2e]`

**Causa raíz:**
`beforeEach` usaba `waitUntil: 'networkidle'`. T4 monta `UseCaseDetailPanel` que invoca la Edge Function `ai-recommend` en mount. En CI, el cold-start Deno (~60s) mantiene la request en vuelo → `networkidle` nunca se cumple → el test consume los 120s de budget antes de poder hacer aserciones.

**Solución:**
Sustituir `networkidle` por `domcontentloaded` + assert explícito de `page.getByText(/Use Case Priority Board/i)` con `timeout: 15_000`. Anclar el test :66 al mismo selector estable (`/dashboard ejecutivo/i`) que ya usan los tests :32 y :55. Timeout explícito `{ timeout: 5_000 }` en la aserción final para no consumir el budget global.

**Guideline E2E derivada:**
No usar `waitUntil: 'networkidle'` en vistas que disparan invocaciones LLM (Edge Functions ai-recommend, log-audit-event) en mount. Usar `domcontentloaded` + assert de elemento estable del ToolHeader o ExecDashboard. Ver sección "E2E patterns" en OVERVIEW.md.

---

### ~~DEBT-036~~ — audit.spec.ts tests 1 y 5 fallan por race condition afterEach vs response() ✅ (Resuelto — 2026-06-29)
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-29 (CI run #28380357417 — `Expected: 200 / Received: undefined`)
**Área:** `e2e/audit.spec.ts` — tests en líneas 195 y 365
**Estado:** Resuelto en PR `fix(e2e): audit watcher devuelve request+response separadas + warm-up [e2e]`

**Causa raíz (hipótesis A):**
`afterEach` navegaba a `/` antes de que `auditRequest.response()` recibiera la respuesta de la Edge Function. Playwright cancela conexiones en vuelo al navegar → `response()` devuelve `undefined`. El cold-start Deno (hasta 60s en CI) agravaba el problema.

**Solución:**
`prepareAuditWatcher` registra `waitForResponse` ANTES de la acción del usuario (junto con `waitForRequest`). La promise de respuesta queda viva independientemente de que `afterEach` navegue. El helper devuelve `{ request, response }` con `EDGE_FN_TIMEOUT = 90_000`. `beforeAll` warm-up con POST dummy a la Edge Function para evitar cold-start en el primer test.

---

### ~~DEBT-035~~ — supabase.functions no mockeado → ruido "audit.write TypeError" en CI ✅ (Resuelto — 2026-06-29)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-29 (~30 stderr por run en CI)
**Área:** `src/__tests__/services/*.test.ts`, `src/__tests__/auth/`, `src/__tests__/admin/`, `src/__tests__/unit/Engagement/`
**Estado:** Resuelto en PR `test: mockear supabase.functions en service unit tests (limpieza ruido audit)`

**Descripción:**
`auditClient.ts:37` llama `supabase.functions.invoke('log-audit-event', ...)` en un IIFE fire-and-forget. Los mocks de `vi.mock('@/lib/supabase')` en 13 test files no incluían `functions`, por lo que el IIFE lanzaba `TypeError: Cannot read properties of undefined (reading 'invoke')` o `Cannot destructure property 'error' of '(intermediate value)'`. Los tests pasaban (646/649) porque el error queda atrapado por el try/catch del IIFE, pero ensuciaba stderr de CI.

**Solución:**
Añadir `functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) }` en los 15 `vi.mock('@/lib/supabase')` afectados. El archivo `src/__tests__/__mocks__/supabase.ts` documenta el patrón canónico para futuros tests. Resultado: 0 `audit.write TypeError` en stderr.

---

### ~~DEBT-034~~ — auth.spec.ts usaba selector de clase CSS frágil post-ADR-021 ✅ (Resuelto — 2026-06-29)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-29 (migración tokens semánticos ADR-021)
**Área:** `e2e/auth.spec.ts:33`, `src/modules/Auth/LoginView.tsx:258`
**Estado:** Resuelto en PR `fix(e2e+a11y): role=alert en error de LoginView + selector E2E actualizado [e2e]`

**Descripción:**
`auth.spec.ts` seleccionaba el bloque de error de login con `.bg-red-50 .text-red-600`. La migración ADR-021 cambió esas clases a tokens semánticos (`bg-danger-light`, `text-danger-dark`), rompiendo el selector. Fix: añadir `role="alert"` al `<div>` de error en `LoginView.tsx` (mejora a11y) y usar `page.getByRole('alert')` en el spec — selector estable e independiente de tokens de color.

---

### ~~DEBT-033~~ — audit.spec.ts usaba waitForResponse para Edge Function con cold-start ✅ (Resuelto — 2026-06-29)
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-29 (timeouts recurrentes en CI ~27 casos)
**Área:** `e2e/audit.spec.ts` — helper `prepareAuditWatcher`
**Estado:** Resuelto en commit `01829a1` (rama develop local)

**Descripción:**
El helper original usaba `page.waitForResponse()` esperando la respuesta HTTP de la Edge Function `log-audit-event`. El cold-start de Deno + latencia Supabase Cloud superaba los 60s de timeout en CI, causando falsos negativos en toda la suite de auditoría.

**Solución aplicada:**
Reemplazar `waitForResponse` por `page.waitForRequest()` con filtro sobre `service_name` + `method_name` en el cuerpo POST. La Promise resuelve al **enviar** la request (no al recibir la respuesta), eliminando la dependencia de la latencia del servidor. Los tests que necesitan el status code llaman `auditRequest.response()` después, con timeout adicional explícito de 30s solo donde es imprescindible.

**Patrón canónico para Edge Functions con cold-start:**
```ts
// CORRECTO: resuelve al enviar — independiente del cold-start
const requestPromise = page.waitForRequest(
  (req) => EDGE_FN_PATTERN.test(req.url()) && req.method() === 'POST'
    && body.service_name === SERVICE && body.method_name === METHOD,
  { timeout: EDGE_FN_TIMEOUT },
)
// Si necesitas la respuesta: await (await requestPromise).response()
```

**Relacionado:** ADR-017 (Audit Logging Proxy).

---

### ~~DEBT-032~~ — Specs E2E navegan a rutas T1-T12 sin :engagementId ✅ (Resuelto — 2026-06-29)
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-29 (refactor v2.1.0 "atomic-screen-independence")
**Área:** `e2e/t1.spec.ts`, `t2.spec.ts`, `t4.spec.ts`, `t5.spec.ts`, `t6.spec.ts`, `t9.spec.ts`
**Estado:** Resuelto en PR `fix(e2e): añadir :engagementId a navegaciones t1/t2/t4/t5/t6/t9 [e2e]`

**Descripción:**
El refactor v2.1.0 (ADR-024) convirtió las rutas T1–T12 a `tN/:engagementId`. Los specs E2E seguían navegando a `/tN` sin el parámetro, lo que causaba redirección al fallback `/` (T10). El `<h1>` del ToolHeader nunca aparecía y ~27 tests caían por timeout.

**Solución aplicada:**
Sustituir `page.goto('/tN', ...)` por `page.goto(\`/tN/${LAB_PROJECT_ID}\`, ...)` en todos los specs afectados. El test paramétrico de ToolHeader en `t9.spec.ts` (líneas ~208-225) también parametrizado. Relacionado con ADR-024.

---

## Items Resueltos

> Los items tachados están completamente resueltos y se mantienen como registro histórico.

### ~~DEBT-001~~ — Tests automatizados ✅ (Resuelto parcialmente — 2026-06-02)
- **Vitest** configurado y funcionando: **507+ tests en 33 ficheros pasando** (medido 2026-06-11)
- **Playwright e2e**: **16 specs** en `e2e/` (architecture-guard + T1-T8 + fixtures)
- Servicios T1-T4, T6, T7, T8 cubiertos (service test files)
- Lógica de dominio T1/T4 cubierta (scoring, ROI, AI Act)
- **Pendiente (DEBT-009)**: algunos módulos sin cobertura — ver DEBT-009

### ~~DEBT-003~~ — Vistas monolíticas >1000 LOC ✅ (Resuelto P1+P2 — 2026-06-02; vistas restantes resueltas 2026-06-08)
- T4View: 2386 → ~220 líneas (9 componentes extraídos)
- T3View: 1202 → ~220 líneas (5 componentes extraídos)
- T8View: 1140 → **270 líneas** ✅ (medido 2026-06-08, < 400 ADR-013)
- T7View: 1097 → **257 líneas** ✅
- T10View: 1072 → **302 líneas** ✅
- T5View: 1049 → **134 líneas** ✅
- T11View: 1029 → **248 líneas** ✅ (`src/modules/T11_OperatingRhythm/T11View.tsx`)

### ~~DEBT-004~~ — Tipos duplicados en PolicyPDF.tsx ✅ (Resuelto P2-2 — 2026-06-02)
- `UseCase` y `Domain` locales reemplazados con imports de T4/T5 types

### ~~DEBT-005~~ — console.error en stores sin Sentry ✅ (Resuelto P2-5 — 2026-06-02)
- `reportError()` wrapper creado; T1 y T4 stores actualizados

### ~~DEBT-006~~ — xlsx CVE-2023-30533 ✅ (Resuelto P1-3 — 2026-06-02)
- Paquete eliminado (0 imports, dead dependency)

### ~~DEBT-007~~ — Vistas T5/T7/T8/T10/T11 monolíticas ✅ (Resuelto — 2026-06-08)
- T8View: 1140 → 270 líneas (`wc -l` 2026-06-08)
- T7View: 1097 → 257 líneas
- T10View: 1072 → 302 líneas
- T5View: 1049 → 134 líneas
- T11View: 1029 → 248 líneas (`src/modules/T11_OperatingRhythm/T11View.tsx`)
- Todas < 400 líneas — cumple ADR-013

### ~~DEBT-008~~ — T3 ProcessDetailPanel usa supabase directamente ✅ (Resuelto — 2026-06-09)
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-02 (ADR-011)
**Estado:** Resuelto (2026-06-09)

`ProcessDetailPanel.tsx` reemplazó `supabase.functions.invoke` inline por `useEdgeFunctionInvoke` (ADR-014). Eliminado import `@/lib/supabase` del componente.

### ~~DEBT-012~~ — T1View, T2View, T3View, CompanyProfileView acceden a Supabase directamente (viola ADR-011) ✅ (Resuelto — 2026-06-09)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-09 (PR fix/adr011-finish)
**Área:** `T1View.tsx`, `T2View.tsx`, `T3View.tsx`, `CompanyProfileView.tsx`
**Estado:** Resuelto (2026-06-09)

Cuatro vistas usaban `supabase.from('projects')` / `supabase.from('companies')` directamente.
Extraídas dos funciones nuevas en `projects.service.ts` (`getProjectCompanyId`, `getProjectWithCompany`)
y una en `companies.service.ts` (`updateCompanySettings`). Eliminados todos los imports de `@/lib/supabase`
en los cuatro ficheros. Añadida regla ESLint `no-restricted-imports` para impedir nuevas fugas en CI.

### ~~DEBT-011~~ — useDepartmentStore accede a Supabase directamente (viola ADR-011) ✅ (Resuelto — 2026-06-09)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-08 (PR obs/reportError)
**Área:** `src/modules/CompanyProfile/useDepartmentStore.ts`
**Estado:** Resuelto (2026-06-09)

Creado `src/services/department.service.ts` con `fetchDepartments`, `addDepartment`, `deleteDepartment`. Eliminado import `{ supabase }` de `useDepartmentStore`. Comportamiento observable idéntico.

### ~~DEBT-013~~ — Auth y Engagement stores importaban supabase directamente (ADR-011) ✅ (Resuelto — 2026-06-11)
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-11 (auditoría forense docs vs. código)
**Área:** `src/modules/Auth/store.ts`, `src/modules/Engagement/store.ts`
**Estado:** Resuelto (2026-06-11)

Creado `src/services/auth.service.ts` con `fetchProfile`, `getAuthUserCompanyId`, `getAuthSession`, `subscribeToAuthChanges`, `signInWithPassword`, `signOut`. Los dos stores eliminaron su import de `{ supabase }` y delegan en el servicio. Eliminados también `console.warn`/`console.debug` operativos en Engagement y CompanyProfile stores — sustituidos por `reportError`.

---

### ~~DEBT-014~~ — Auth views (Login/Reset/UpdatePassword) importan supabase directamente (ADR-011) ✅ (Resuelto — 2026-06-11)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-11 (auditoría forense + PR DEBT-013)
**Área:** `src/modules/Auth/LoginView.tsx`, `src/modules/Auth/ResetPasswordView.tsx`, `src/modules/Auth/UpdatePasswordView.tsx`
**Estado:** Resuelto (2026-06-11)

Añadidos `resetPasswordForEmail` y `updateAuthUser` a `auth.service.ts`. Los tres archivos de vista eliminaron `import { supabase }` y delegan en el servicio mediante `subscribeToAuthChanges`, `getAuthSession`, `resetPasswordForEmail` y `updateAuthUser`. `tsc --noEmit` → 0 errores.

---

### ~~DEBT-016~~ — T6View.tsx: `<Spinner>` usado sin importar ✅ (Resuelto — 2026-06-11)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-11 (tsc --noEmit)
**Área:** `src/modules/T6_RiskGovernance/T6View.tsx:133`
**Estado:** Resuelto (2026-06-11)

`Spinner` estaba referenciado en el JSX pero ausente del `import { Tabs, Badge, ToolHeader }` de `@shared/design-system/components`. Introducido en la refactorización de P2 (refactor-AI-SOS) cuando se añadió el loading shield. Resuelto añadiendo `Spinner` al import existente.

---

### ~~DEBT-017~~ — database.types.ts desincronizado: `tool_outputs` y `bulk_upsert_t1_scores` ausentes ✅ (Resuelto — 2026-06-11)
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-11 (tsc --noEmit)
**Área:** `src/types/database.types.ts`, `src/services/t1.service.ts`, `src/services/t5.service.ts`, `src/services/t6.service.ts`
**Estado:** Resuelto (2026-06-11)

El archivo de tipos se mantenía manualmente y había quedado desincronizado respecto al schema real de Supabase (verificado contra `npx supabase gen types --local`). Tres problemas resueltos en una sola sesión:
1. `tool_outputs` table no registrada → error en `t6.service.ts` `supabase.from('tool_outputs')`. Resuelto: añadidos `ToolOutputRow`, `ToolOutputInsert` y la entrada en `Database.Tables`.
2. `bulk_upsert_t1_scores` RPC no registrada → error en `t1.service.ts` `supabase.rpc(...)`. Resuelto: añadida en `Database.Functions`.
3. `T5CanvasInsert` excluía `updated_at` explícitamente → `RejectExcessProperties` de Supabase rechazaba el upsert. Resuelto: añadido `updated_at?: string` a `T5CanvasInsert` y simplificado el tipo del `row` en `t5.service.ts`. Además corregido cast inseguro `as Record<...>` → `as unknown as Record<...>` en `rowToCanvas()`.

---

### ~~DEBT-015~~ — e2e/auth.spec.ts falla: título del app desactualizado ✅ (Resuelto — 2026-06-11)
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-11 (ejecución Playwright)
**Área:** `e2e/auth.spec.ts:17`
**Estado:** Resuelto (2026-06-11)

La aserción `toHaveTitle(/L\.E\.A\.N\.|AI System/i)` usaba el nombre antiguo del producto. Corregido a `/GOBY/i`.

---

### DEBT-009 — 12/16 módulos sin tests
**Severidad:** 🟡 Media
**Detectado:** 2026-06-02 (P2 audit)
**Estado:** Pendiente

T5, T9, T10, T11, T12, Auth, Admin, CompanyProfile, Engagement no tienen tests. Prioridad: T6 hooks (usePolicyGeneration) y lógica del motor T11.

### ~~DEBT-010~~ — Zod schemas para JSONB de roadmap, t1_context, t2_context ✅ (Resuelto — 2026-06-09)
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-02 (ADR-015)
**Estado:** Resuelto (2026-06-09)

`rowToUseCase()` ahora usa `safeParseJsonField` con `RoadmapSchema`, `T1ContextSchema` y `T2ContextSchema` — schemas definidos en `src/lib/schemas/t4.schemas.ts`. Eliminados los 3 `castOpt` correspondientes. Tests en `src/__tests__/schemas/jsonb-schemas.test.ts` (20 casos).

---

### DEBT-018 — Casts temporales `as unknown as SupabaseClient` por database.types.ts no regenerado
**Severidad:** 🟡 Media
**Detectado:** 2026-06-15 (Sprint audit-logging)
**Caducidad estricta:** 2026-07-15
**Área:** `src/lib/audit/types.ts`, `src/lib/audit/auditClient.ts`, `src/services/auditLogs.service.ts`
**Estado:** Pendiente (las migraciones están ejecutadas en DEV; pendiente regenerar tipos)

**Descripción:**
Las migraciones del sistema de auditoría están aplicadas en DEV y los logs se insertan
correctamente en runtime. Sin embargo, `database.types.ts` aún no incluye las tablas
`audit_logs` y `audit_access_logs`, por lo que tres artefactos usan casts temporales:

1. `AuditLogInsert` en `src/lib/audit/types.ts` — interfaz manual que debería derivarse de
   `Database['public']['Tables']['audit_logs']['Insert']`.
2. `supabase as unknown as SupabaseClient` en `src/lib/audit/auditClient.ts` — elude el
   genérico de Database porque `audit_logs` no aparece en los tipos generados. Nota: este
   cast es actualmente inerte porque `auditClient.ts` ya no inserta directamente en la tabla
   sino que invoca la Edge Function `log-audit-event` vía `supabase.functions.invoke`.
3. `supabase as unknown as SupabaseClient` en `src/services/auditLogs.service.ts` — misma
   causa: `audit_logs` y `audit_access_logs` ausentes de `database.types.ts`.

**Impacto:**
Medio. El comportamiento en runtime es correcto. El riesgo es que un cambio de esquema en
`audit_logs` o `audit_access_logs` no lo detecte el compilador hasta que se regeneren los tipos.

**Plan de acción:**
1. Regenerar tipos con el schema DEV actual:
   `npx supabase gen types typescript --local > src/types/database.types.ts`
2. En `src/lib/audit/types.ts`: reemplazar `AuditLogInsert` por
   `export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']`.
3. En `src/lib/audit/auditClient.ts`: eliminar cast `as unknown as SupabaseClient`
   e import de `SupabaseClient` (ya son innecesarios al usar `supabase.functions.invoke`).
4. En `src/services/auditLogs.service.ts`: eliminar cast `as unknown as SupabaseClient`
   y la importación de `SupabaseClient`; usar `supabase` directamente. Registrar también
   `get_audit_logs` en `Database.Functions` para que `.rpc('get_audit_logs', ...)` esté tipado.
5. `npm run typecheck` → 0 errores.

**Requiere ADR:** No (solo sincronización de tipos generados).
**Relacionado:** ADR-017, ADR-018, ADR-019, DEBT-017.

---

### ~~DEBT-019~~ — Ventana de null en engagement_id / race condition correlation_id ✅ (Resuelto — 2026-06-15)
**Severidad:** 🟡 Media → Resuelto
**Detectado:** 2026-06-15 (revisión de gobierno de datos + análisis de concurrencia)
**Área:** `src/lib/audit/makeAuditable.ts`, `src/lib/audit/context.ts`
**Estado:** Resuelto (2026-06-15)

Dos problemas resueltos en un único PR:

**Problema 1 — Race condition en correlation_id (estado global)**
`withCorrelationId()` usaba `_correlationId` como estado de módulo. En `Promise.all()`
con dos flujos multi-step, el segundo flujo sobreescribía el ID del primero antes de
que el primero leyera el valor en su segundo método. El `finally` del primer flujo
borraba el ID del segundo.

Fix: eliminado `withCorrelationId`, `getCorrelationId`, `setCorrelationId`,
`clearCorrelationId` de `context.ts`. El `correlation_id` se pasa ahora como campo
de `defaultMetadata` al construir el proxy — cada instancia tiene su propio valor
en su closure. Imposible corrupción entre flujos paralelos.

Test específico de regresión: `src/__tests__/unit/audit/makeAuditable.test.ts`
describe block 6 — "race condition: flujos paralelos aislados".

**Problema 2 — engagement_id null tras refresh (DEBT-019 original)**
`makeAuditable.ts` ahora lee `activeEngagementId` de `localStorage` (clave
`lean-active-engagement`, formato Zustand persist) en call-time, no en creación del
proxy. El ID está disponible desde el primer render tras la hidratación síncrona de
Zustand, antes de cualquier llamada a servicio auditado.

Prioridad: `defaultMetadata.engagement_id` explícito > localStorage > omitido.

**Requiere ADR:** No. **Relacionado:** ADR-017, DEBT-018.

---

### ~~DEBT-020~~ — SHA-256 simple sobre email del archivo era reversible por diccionario ✅ (Resuelto — 2026-06-15)
**Severidad:** 🔴 Alta (GDPR/privacidad)
**Detectado:** 2026-06-15 (revisión de seguridad de pseudonimización en archivo frío)
**Área:** `supabase/migrations/20260615_003_audit_system.sql`
**Estado:** Resuelto (2026-06-15)

**Descripción:**
`purge_old_audit_logs()` usaba `encode(digest(al.user_email, 'sha256'), 'hex')` para pseudonimizar el email al archivar. SHA-256 sin sal es determinista y el espacio de emails de un tenant SaaS es pequeño y predecible: un atacante con una lista de usuarios conocidos puede calcular el hash offline y correlacionar registros del archivo frío (ataque de diccionario).

**Fix aplicado:**
Incluido en la migración consolidada `20260615_003_audit_system.sql`:
1. Función `public.hmac_email_hash(p_email text)` SECURITY DEFINER que aplica
   `encode(hmac(email, pepper, 'sha256'), 'hex')` leyendo `app.audit_pepper` del Vault.
2. `purge_old_audit_logs()` llama a `hmac_email_hash()` en lugar de `digest()`.
3. Si `app.audit_pepper` no está configurado, la función lanza excepción explícita — fallo
   ruidoso mejor que hash débil silencioso.

**Acción pendiente (manual — Carlos):**
Antes de ejecutar la migración en PRE/PRO:
1. Generar secreto: `SELECT encode(gen_random_bytes(32), 'hex');`
2. Guardarlo en Supabase Vault como `audit_pepper`.
3. Ejecutar: `ALTER DATABASE postgres SET app.audit_pepper = '<valor>';`
4. Ejecutar la migración en el SQL Editor.

**Requiere ADR:** No (refuerzo de control existente, no decisión arquitectónica nueva).
**Relacionado:** ADR-018 (retención), DEBT-018 (tipos no regenerados).

---

### DEBT-021 — context.ts vacío: limpiar o implementar
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-16 (auditoría de documentación)
**Caducidad:** 2026-09-15
**Área:** `src/lib/audit/context.ts`, `src/lib/audit/index.ts`
**Owner:** audit-system
**Estado:** Pendiente

**Descripción:**
`context.ts` está vacío. Fue diseñado como singleton de contexto de usuario client-side
(patrón `setAuditContextProvider` / `getAuditUserContext`), pero con la introducción de
la Edge Function `log-audit-event` como receptor del log, el contexto de usuario se
extrae server-side del JWT — el cliente ya no necesita inyectarlo.

El archivo sigue siendo re-exportado desde `index.ts` (`export * from './context'`), lo
que no causa errores pero es ruido arquitectónico: un módulo vacío en el barrel export.

**Impacto:**
Nulo en runtime. Confusión para futuros colaboradores que lean el barrel y encuentren
una referencia a un módulo sin contenido.

**Plan de acción:**
1. Eliminar `export * from './context'` de `src/lib/audit/index.ts`.
2. Eliminar o repurpursar `src/lib/audit/context.ts` (puede eliminarse completamente).
3. Verificar que ningún consumidor externo importa de `@/lib/audit` esperando
   `setAuditContextProvider` o `getAuditUserContext`.
4. `npm run typecheck` → 0 errores.

**Requiere ADR:** No.
**Relacionado:** DEBT-018, ADR-017.

---

---

### DEBT-024 — Migración de formularios a react-hook-form + Zod (ADR-022)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (ADR-020 Fase 3 / ADR-022)
**Área:** Todos los formularios de T1–T12 + LoginView
**Estado:** En progreso (4/12 migradas — T2, T3; T4-EconomicsTab 2026-06-18; T1-NewInterviewModal 2026-06-18)

**Descripción:**
ADR-022 establece `react-hook-form + zodResolver` como estándar para todos los formularios.
T2 (`StakeholderFormPhase`) y T3 (`ProcessFormPhase`) migrados en la PR de activación del ADR.

**Pendiente (DEBT-024-bis):** T1, T4–T12, LoginView.

**Impacto:** Formularios no migrados carecen de mensajes de error accesibles, `isSubmitting` y `isDirty`.

**Plan de acción:**
1. Por cada PR que toque un formulario no migrado, aplicar el patrón de ADR-022 en esa misma PR.
2. PR dedicada opcional para migración masiva del resto: ver DEBT-024-bis.

**Requiere ADR:** No (ADR-022 ya establece la regla).
**Relacionado:** ADR-022, DEBT-024-bis.

---

### ~~VIS-001~~ — Erradicación de emojis Unicode en JSX ✅ (Resuelto — 2026-06-17)
**Severidad:** 🟡 Media (sobriedad ejecutiva — ADR-021 / DESIGN-SYSTEM.md)
**Detectado:** 2026-06-17 (auditoría DESIGN-SYSTEM.md)
**Área:** `src/modules/` (T2, T3, T4, T5, T6, T7, T8, T10, T12) + `src/shared/components/ErrorBoundary.tsx`
**Estado:** Resuelto (2026-06-17)

**Descripción:**
31 archivos contenían emojis Unicode literales embebidos en JSX (🔥, ⚠️, 🚫, ✓, ✕, ◎, 🔴, ⬜, 👤, 📊, ⚡, 🚀, 💡, etc.). DESIGN-SYSTEM.md (ADR-021) los prohíbe explícitamente: _"emoji, playful micro-interactions — is categorically prohibited"_.

**Cambios aplicados:**
- **Empty states** `◎` (bullseye) → SVG inline (`circle + center dot`) en T2, T3, T4 (x3), T7.
- **Iconos semánticos** (⚠️ → `AlertTriangle`, 🚫 → `Ban`, ✓ → `Check`, ✕ → `X`, 🔥 → `Flame`, 💡 → `Lightbulb`, 🚀 → `Rocket`, ⚡ → `Zap`) — todos `size` ajustado a 12/14/16/20 según contexto y `strokeWidth={1.75}` uniforme.
- **Config objects** `icon: '🔴'` → `icon: 'alert-circle'` con mapa de renderizado en componentes consumidores (`RISK_ICON_MAP`, `DOMAIN_ICON_MAP`, `PHASE_ICON_MAP`, etc.) — T4 constants, T5 constants, T6 constants, T7 CHANGE_PLAN, T8 TYPE_CFG + CHANNEL_CFG.
- **Labels de Tabs** `'📄 Política IA'` → `icon: <FileText />` usando el prop `icon?: ReactNode` del componente Tabs existente.
- **Texto en templates de email** (`✅`, `⚠️`, `📅`, `💬` en strings literales) → ASCII equivalentes (`✓`, `!`, `→`).
- **ErrorBoundary** `❌ Error de renderizado` → texto limpio sin emoji.
- `T12/constants.ts`: `dot: '◎'` → `dot: '◔'` (caracter de círculo semáforo estándar, no emoji de color).

**Verificación:** `npm run typecheck` → 0 errores. Revisión manual de patrones residuales → 0 emojis en módulos cubiertos por DESIGN-SYSTEM.md.

**Requiere ADR:** No (cumplimiento de ADR-021 ya vigente).
**Relacionado:** ADR-021, DESIGN-SYSTEM.md.

---

### DEBT-024-bis — Lista de formularios pendientes de migrar a RHF+Zod
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-16
**Área:** T1, T4–T12, LoginView
**Estado:** Pendiente

| Vista / Componente | Formulario | Schema a crear |
|--------------------|------------|----------------|
| ~~T1-NewInterviewModal~~ | ~~NewInterviewModal.tsx~~ | ~~`NewInterviewModal.schema.ts`~~ ✅ 2026-06-18 |
| T1 | DimensionCard evidencias (textarea directo, sin submit) | n/a — patrón instant-save, no requiere RHF |
| ~~T4-EconomicsTab~~ | ~~EconomicsTab.tsx~~ | ~~`EconomicsTab.schema.ts`~~ ✅ 2026-06-18 |
| T4 | ScoringTabContent, AIActClassificationModal | `t4.schemas.ts` (pendiente) |
| T5 | Formulario de proceso / configuración | `t5.schemas.ts` |
| T6 | Formulario de herramientas | `t6.schemas.ts` |
| T7 | Formulario de datos | `t7.schemas.ts` |
| T8 | Formulario de configuración | `t8.schemas.ts` |
| T9 | Formulario de análisis | `t9.schemas.ts` |
| T10 | Formulario de roadmap | `t10.schemas.ts` |
| T11 | Formulario de métricas | `t11.schemas.ts` |
| T12 | Formulario de entrega | `t12.schemas.ts` |
| LoginView | Login + Reset Password | `auth.schemas.ts` |

**Requiere ADR:** No (ADR-022 ya establece la regla).
**Relacionado:** ADR-022, DEBT-024.

---

### ~~DEBT-025~~ — ChartWrapper sin accesibilidad: sin role ni ariaLabel ✅ (Resuelto — 2026-06-16)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (ADR-020 / sesión UX/UI)
**Área:** `src/shared/components/charts/ChartWrapper.tsx`
**Estado:** Resuelto (2026-06-16)

`ChartWrapper` envolvía el `ResponsiveContainer` sin ningún atributo de accesibilidad. Los lectores de pantalla encontraban el gráfico como contenido anónimo sin descripción.

**Fix aplicado (PR feat/a11y-chartwrapper-aria-table):**
1. `ariaLabel: string` añadida como prop **obligatoria** a `ChartWrapperProps` — TypeScript impide compilar cualquier `<ChartWrapper>` sin ella.
2. `ResponsiveContainer` envuelto en `<div role="img" aria-label={ariaLabel}>` — el gráfico se anuncia correctamente a lectores de pantalla.
3. `dataTable?: ReactNode` prop opcional: si se pasa, renderiza un `<details>` expandible con `<summary>Ver datos como tabla</summary>` para ofrecer los datos en formato tabular sin alterar el aspecto visual.

**Nota:** En la fecha de resolución, `LeanBarChart` y `LeanRadarChart` ya incluyen `ariaLabel` descriptivo en sus wrappers. La prop obligatoria garantiza accesibilidad en toda integración futura.

**Relacionado:** ADR-021 (Design System Charter).

---

### ~~DEBT-026~~ — Sidebar fixed cubre contenido en pantallas grandes, altura hardcoded ✅ (Resuelto — 2026-06-16)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (ADR-020 Fase 2)
**Área:** `src/shared/components/AppSidebar.tsx`, `src/shared/layouts/AppLayout.tsx`
**Estado:** Resuelto (2026-06-16)

**Fix aplicado:**
1. `useMediaQuery('(min-width: 1024px)')` — hook creado en `src/shared/hooks/useMediaQuery.ts`.
2. `AppSidebar` en `>= lg`: sidebar `fixed` + `mt-[var(--header-h,57px)]` siempre visible, sin toggle ni backdrop.
3. `AppSidebar` en `< lg`: comportamiento original — toggle + backdrop + `translate-x-full/0`.
4. `AppLayout.main`: añadido `ml-64` cuando `isLg`, sin margen en `< lg`.
5. Altura migrada a `h-[calc(100vh-var(--header-h,57px))]` en ambos modos.

**Relacionado:** ADR-020, DEBT-026-bis.

---

### DEBT-026-bis — Aplicar columnPriority en tablas T1–T12
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-16 (PR feat/sidebar-responsive-tables-mobile)
**Área:** Todos los `<Table>` en `src/modules/T*/` (T1–T12)
**Estado:** Pendiente

La PR que añadió `columnPriority` y `mobileView` al componente `Table` no migró las tablas T1–T12. En viewports `< 640 px` las tablas de T1–T12 requieren scroll horizontal sin prioridades declaradas.

**Plan de acción:**
Por cada tabla en T1–T12: añadir `columnPriority`, evaluar `mobileView="cards"` para tablas con > 5 columnas.

**Requiere ADR:** No.
**Relacionado:** DEBT-026, ADR-020.

---

### ~~DEBT-027 (parte 3)~~ — Gestión visual de errores asíncronos: sin ServiceErrorToast ni useServiceError ✅ (Resuelto — 2026-06-17)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-17 (ADR-020 PR #6 — DEBT-027 cierre completo)
**Área:** `src/shared/design-system/components/ServiceErrorToast.tsx`, `src/shared/hooks/useServiceError.ts`, `src/shared/design-system/components/Toast.tsx`
**Estado:** Resuelto (2026-06-17) — `refactor/ux-ui-adr020-consolidation`

**Fix aplicado:**
1. `Toast.tsx` — Portal via `createPortal(container, document.body)` para evitar conflictos de z-index con el chasis. Contenedor top respeta `var(--header-h, 56px)` medida por `ResizeObserver` en `AppLayout`.
2. `Toast.tsx` — variante `error` forzada a `persistent: true` automáticamente — requiere cierre manual explícito.
3. `Toast.tsx` — nueva firma `addNode(node: ReactNode): string` en el contexto permite inyectar JSX custom (ServiceErrorToast) en la cola FIFO.
4. `ServiceErrorToast.tsx` — componente con `border-l-4 border-l-danger`, icono `AlertCircle`, botón X de cierre, y badge `DBG` que expande panel `<pre>` con `error.message`, `hint`, `code`, `stack`.
5. `useServiceError.ts` — hook `notifyError(error, customMessage?)` que consume `addNode` del `ToastContext` — sin imports de Supabase (ADR-011 compliant).
6. Barrel `index.ts` — exporta `ServiceErrorToast` y `ServiceErrorToastProps`.

**Relacionado:** DEBT-027 parte 1, DEBT-027 parte 2, ADR-020, ADR-011.

---

### ~~DEBT-027 (parte 1)~~ — useToast sin provider global: cola no limitada ✅ (Resuelto — 2026-06-16)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (ADR-020 / sesión UX/UI)
**Área:** `src/shared/design-system/components/Toast.tsx`, `Toast.hooks.ts`
**Estado:** Parte 1 Resuelta (2026-06-16) · Parte 2 Pendiente (StreamingIndicator)

**Fix aplicado:**
1. `ToastProvider` con `ToastContext` — un único estado global en el árbol.
2. Cola FIFO con `MAX_TOASTS = 3`: al añadir el 4º, se descarta el más antiguo.
3. Duraciones por variante: `success 3 s · info 4 s · warning 6 s · error 8 s`.
4. Prop `persistent?: boolean` en `ShowToastOptions` — si `true`, no hay auto-cierre y el botón X es siempre visible.
5. Posicionamiento responsive: mobile `top-center`, desktop `bottom-right`.
6. `useToast()` lanza error claro si se usa fuera del provider.
7. `Toast.hooks.ts` convertido en re-export para backward compat.

**Relacionado:** ADR-020.

---

### ~~DEBT-027 (parte 2)~~ — StreamingIndicator inline para LLM ✅ (Resuelto — 2026-06-16)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (ADR-020 / sesión UX/UI)
**Área:** `src/shared/design-system/components/StreamingIndicator.tsx`
**Estado:** Resuelto (2026-06-16) — `refactor/ux-ui-adr020-consolidation`

**Fix aplicado:**
1. `StreamingIndicator` creado con props `label?` y `variant?: 'inline' | 'card'`. `role="status"` + `aria-live="polite"`.
2. `useEdgeFunctionInvoke` extendido con `state: 'idle' | 'pending' | 'success' | 'error'` — no-breaking.
3. T6 `PolicyTab`: `StreamingIndicator variant="inline"` insertado. El formulario y la navegación permanecen activos durante la espera.
4. `ToolLoadingScreen` conservado — sigue siendo válido para cargas de vista completa.
5. ADR-014: Appendix A añadido documentando la fase observable y el patrón `StreamingIndicator`.

**Relacionado:** DEBT-027 parte 1, ADR-014.

---

### DEBT-028 — Hex inline en componentes shared: pendiente migrar a token()
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (audit grep ADR-021)
**Área:** `AppSidebar.tsx`, `AlphaLogo.tsx`, `EngagementSelector.tsx`, `ErrorBoundary.tsx`, `PersistenceBanner.tsx`, `SegmentedControl.tsx`
**Estado:** Pendiente

**Descripción:**
El audit de hex inline previo a la implementación de ADR-021 detectó literales `#RRGGBB` hardcodeados en 6 componentes del área `src/shared/`. Detalle completo en la tabla de ADR-021 sección DEBT-028. El charter (ADR-021) prohíbe nuevos hex inline, pero la migración de los existentes se difiere para evitar scope creep en esta PR.

**Impacto:** Si la paleta de colores cambia (marca blanca multi-tenant), estos componentes no heredan el cambio automáticamente.

**Plan de acción:**
1. Por cada componente, sustituir hex inline por `token('nombre')` o clase Tailwind del token.
2. `SegmentedControl.tsx` tiene hex `#1C1A16`/`#FFFFFF` en una función de contraste algorítmica — mantener como excepción documentada o migrar a `token('lean-black')`.
3. PR dedicada: `refactor: migrar hex inline a tokens ADR-021 — shared components`.

**Requiere ADR:** No (ADR-021 ya establece la regla).
**Relacionado:** ADR-021, DEBT-022.

---

### DEBT-029 — useUnsavedGuard: chasis listo, vistas pendientes de suscribirse ✅ (Chasis — 2026-06-17)
**Severidad:** 🟡 Media
**Detectado:** 2026-06-17 (ADR-020 PR #4 — DEBT-024 parcial)
**Área:** `src/shared/hooks/useUnsavedGuard.ts` + vistas T1–T12
**Estado:** Chasis implementado (2026-06-17) — adopción en vistas pendiente

**Descripción:**
`EngagementSelector` y `AppSidebar` ya leen `useUnsavedChanges` para interceptar la navegación.
El store Zustand (`isDirty`, `setDirty`, `clearDirty`) existía, pero ninguna vista lo declaraba.
Se ha creado `useUnsavedGuard(isDirty: boolean, source?)` — hook de integración que las vistas
llaman con su booleano local de formulario sucio. El hook sincroniza el store global y limpia
al desmontar, garantizando que ningún módulo deja el flag activo al salir.

**Pendiente (DEBT-029):**
Por cada vista con formulario mutable (T1–T12, CompanyProfile, LoginView):
```tsx
// En la vista, una vez que el formulario tenga isDirty del estado local:
useUnsavedGuard(isDirty)   // solo una línea
```
Las vistas migradas a react-hook-form (ADR-022) exponen `formState.isDirty` directamente.
Las no migradas necesitan un flag local `useState<boolean>`.

**Impacto actual (sin adopción en vistas):** El modal aparece pero el flag nunca se activa —
la protección existe pero está inerte hasta que cada vista lo adopte.

**Plan de acción:**
1. Al migrar cada vista a RHF (DEBT-024), añadir `useUnsavedGuard(formState.isDirty)`.
2. Para vistas con estado Zustand mutable directo (ej. T1 setScore), derivar un `isDirty` local
   comparando la snapshot de carga con el estado actual del store.

**Requiere ADR:** No.
**Relacionado:** DEBT-024, DEBT-024-bis, ADR-020, ADR-022.

---

## Cómo añadir un item

Cuando detectes deuda técnica en un PR:

1. No la fixes en ese PR — mantén el PR enfocado
2. Añade un item a este fichero con el formato:

```markdown
### DEBT-NNN — [Título corto]
**Severidad:** 🔴 Alta | 🟡 Media | 🟢 Baja
**Detectado:** YYYY-MM-DD
**Área:** [ruta de fichero o módulo]
**Estado:** Pendiente | En progreso | Resuelto (YYYY-MM-DD)

**Descripción:** [qué es el problema]
**Impacto:** [qué puede salir mal si no se arregla]
**Plan de acción:** [pasos concretos]
**Requiere ADR:** Sí/No
```

3. Informa a Carlos: "Detecté deuda en [área] — logueada en TECH-DEBT.md como DEBT-NNN. La abordaremos en un PR separado."
4. Crea un GitHub Issue con label `tech-debt` si quieres trackear en el backlog.

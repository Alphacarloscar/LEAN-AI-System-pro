# Technical Debt Register — GOBY

Last updated: 2026-06-15
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

### DEBT-003 — Cabeceras de herramienta (ToolHeader) duplicadas en T1–T12
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

## Items Resueltos

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

## Items Activos

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

### DEBT-022 — A11y crítico: skip-link, ARIA labels y semántica de navegación
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-16 (Auditoría UI/UX + ADR-020)
**Área:** `src/shared/layouts/AppLayout.tsx`, `src/shared/components/AppSidebar.tsx`
**Estado:** Resuelto (2026-06-16) — PR `feat/a11y-applayout-skip-link-aria`

**Descripción:**
Cinco hallazgos críticos de A11y se concentran en el chasis de la app:
1. `<main>` existe (línea 265 de `AppLayout.tsx`) pero sin `id="main-content"` ni `tabIndex={-1}` — los lectores de pantalla no pueden saltar al contenido.
2. No hay link `Saltar al contenido principal` como primer elemento del DOM.
3. `<aside>` en `AppSidebar.tsx:100` sin `aria-label="Navegación principal"`.
4. `<nav>` en `AppSidebar.tsx:120` sin `aria-label="Herramientas T1–T12"`.
5. `AlphaLogo` sin garantía de `alt` descriptivo (verificar en `src/shared/components/AlphaLogo.tsx`).

**Impacto:** Bloqueante para WCAG 2.1 AA. Usuarios de NVDA/VoiceOver navegan ciegamente, deben recorrer todo el header y sidebar en cada cambio de ruta.

**Plan de acción:** Implementado como **PR #1 del backlog de ADR-020** (Fase 2, pantalla piloto AppLayout). Una sola PR cierra los 5 críticos. Estimación: XS.

**Requiere ADR:** No (ya cubierto por ADR-020).
**Relacionado:** ADR-020, FDR-002 (pendiente).

---

### DEBT-023 — Doble sticky con altura `top-[57px]` hardcoded en ToolHeader
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-16 (Auditoría UI/UX)
**Área:** `src/shared/design-system/components/ToolHeader.tsx:68`, `src/shared/layouts/AppLayout.tsx:234-259`
**Estado:** Resuelto-parcial (2026-06-16) — PR `feat/a11y-applayout-skip-link-aria`

**Descripción:**
`ToolHeader` usa `sticky top-[57px] z-10` pero `AppLayout` no fija la altura del header — depende de `py-3` + contenido. Si el header crece (banner de mantenimiento, `SessionRecoveryBanner`, breadcrumb que ocupe más alto), el `ToolHeader` se solapa con el header global. Frágil.

**Impacto:** Solape visual ya posible hoy si el `EngagementSelector` muestra un nombre de proyecto largo en mobile. Cualquier banner futuro lo rompe.

**Plan de acción:**
1. ✅ Medir la altura del header con `useLayoutEffect` y exponerla como CSS variable `--header-h` en `document.documentElement` (`AppLayout.tsx`).
2. ✅ En `ToolHeader.tsx`: cambiado `top-[57px]` por `top-[var(--header-h)]`.
3. ⏳ Test E2E en Playwright: verificar que `ToolHeader` no se solapa con `SessionRecoveryBanner` activo (pendiente PR de E2E).

**Pendiente:** El test E2E del punto 3 queda para la PR de cobertura E2E de A11y.
**Requiere ADR:** No (cubierto por ADR-020 Fase 2).
**Relacionado:** ADR-020.

---

### DEBT-024 — Formularios sin react-hook-form + zod en 11/12 vistas
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-16 (Auditoría UI/UX + ADR-020)
**Área:** `src/views/T1View.tsx`...`T12View.tsx`, `src/views/LoginView.tsx`
**Estado:** Pendiente

**Descripción:**
`react-hook-form ^7.54.0` y `zod ^3.23.8` están en `package.json` y `OVERVIEW.md` los declara como estándar de formularios, pero solo `src/lib/schemas/t4.schemas.ts` los usa. Las otras 11 herramientas + `LoginView` validan con `useState` por campo, ratios `onChange`/`onBlur`/`onSubmit` inconsistentes, mensajes de error hardcodeados, sin `dirty state` tracking, sin protección contra doble envío garantizada.

**Impacto:**
- UX inconsistente entre vistas (validación cuándo, mensajes cómo).
- LoginView con primera experiencia de usuario sin validación de email en tiempo real ni toggle de visibilidad de contraseña.
- Pérdida silenciosa de datos al cambiar engagement con formulario sucio.

**Plan de acción:**
1. Definir un schema Zod por vista en `src/lib/schemas/t{N}.schemas.ts` (siguiendo el patrón de `t4.schemas.ts`).
2. Migrar a `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`.
3. Habilitar `formState.isDirty` para `useUnsavedChanges` (ver DEBT-026).
4. Bloquear botón submit con `isSubmitting` para evitar doble envío.
5. PRs separadas por vista para mantener `< 400 líneas/PR` (ADR-013).

**Requiere ADR:** Sí (ADR-022 — Estándar de formularios con RHF+Zod, propuesto en ADR-020 Fase 3 #5).
**Relacionado:** ADR-020, ADR-015 (Zod JSONB validation).

---

### DEBT-025 — Gráficos Recharts sin alternativa textual accesible
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (Auditoría UI/UX)
**Área:** `src/shared/components/charts/ChartWrapper.tsx`, `LeanBarChart.tsx`, `LeanRadarChart.tsx`
**Estado:** Pendiente

**Descripción:**
`ChartWrapper` envuelve todos los gráficos pero no añade `aria-label`, `role="img"` ni tabla alternativa. El SVG de Recharts es completamente invisible para lectores de pantalla. T1 (radar de madurez), T7 (heatmap de adopción), T9 (Gantt), T10 (dashboard) todos afectados.

**Impacto:** Usuarios con lectores de pantalla no pueden leer ningún KPI ni tendencia.

**Plan de acción:**
1. Añadir props `ariaLabel: string` y `dataTable: ReactNode` a `ChartWrapperProps`.
2. Envolver el `ResponsiveContainer` en `<div role="img" aria-label={ariaLabel}>`.
3. Añadir `<details><summary>Ver datos como tabla</summary>{dataTable}</details>` debajo del gráfico para fallback accesible.
4. En cada vista que use el wrapper, pasar `ariaLabel` y construir la `dataTable` (puede ser `<Table>` del DS).

**Requiere ADR:** No (cubierto por ADR-020 Fase 3 #3).
**Relacionado:** ADR-020, ADR-021 (pendiente).

---

### DEBT-026 — Sidebar sin colapso responsive en viewports `< lg`
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (Auditoría UI/UX)
**Área:** `src/shared/components/AppSidebar.tsx:103`
**Estado:** Pendiente

**Descripción:**
`AppSidebar` usa `w-64` (256 px) fijo. En viewports 768–1024 px (iPad portrait, portátil 13"), el sidebar abierto ocupa 25–33% del ancho de contenido sin que se active un breakpoint de colapso automático.

**Impacto:** Tablas T1–T12 muy comprimidas en tablet, scroll horizontal masivo.

**Plan de acción:**
1. Añadir prop `defaultOpen: boolean` que sea `false` en `< lg` (1024 px) y `true` en `>= lg`.
2. Hook `useMediaQuery('(min-width: 1024px)')` para reaccionar al resize.
3. En `>= lg`, el sidebar se renderiza inline (no fixed), reservando su ancho en el grid.
4. En `< lg`, mantiene comportamiento actual (fixed + backdrop).

**Requiere ADR:** No (cubierto por ADR-020 Fase 3 #7).
**Relacionado:** ADR-020.

---

### DEBT-027 — Toast sin cola limitada y LLM sin feedback progresivo
**Severidad:** 🟡 Media
**Detectado:** 2026-06-16 (Auditoría UI/UX)
**Área:** `src/shared/design-system/components/Toast.tsx`, vistas T* con `useEdgeFunctionInvoke`
**Estado:** Pendiente

**Descripción:**
Dos defectos relacionados de feedback al usuario:
1. `Toast` no tiene `ToastProvider` con límite de slots ni descarte ordenado. 3 toasts simultáneos se apilan sin tope, pueden salirse de viewport en mobile. Duración fija 4000 ms insuficiente para `danger` con instrucciones.
2. Llamadas a Edge Functions LLM (ADR-014, `useEdgeFunctionInvoke`) tardan 5–30 s. `ToolLoadingScreen` bloquea toda la UI durante la espera. No hay `StreamingIndicator` ni barra de progreso indeterminada por sección.

**Impacto:** Usuario percibe la app como "colgada" durante invocaciones LLM. Confusión cuando se acumulan toasts simultáneos.

**Plan de acción:**
1. `ToastProvider` con cola máxima de 3, descarta el más antiguo al pasar el límite.
2. Variantes con duración custom: `danger` → 8000 ms, `success` → 3000 ms, `info` → 4000 ms; `persistent: true` opcional.
3. Componente `StreamingIndicator` reutilizable con shimmer + label "Generando con IA…" insertable en cualquier sección.
4. Refactor de `useEdgeFunctionInvoke` para exponer fase (`idle`/`pending`/`success`/`error`) y consumirla con `StreamingIndicator` inline en lugar de bloquear con `ToolLoadingScreen`.

**Requiere ADR:** No (cubierto por ADR-020 Fase 3 #6 y #8). ADR-014 se extiende con la fase observable.
**Relacionado:** ADR-014, ADR-020.

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

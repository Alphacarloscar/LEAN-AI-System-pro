# Technical Debt Register — GOBY

Last updated: 2026-06-09
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

## Items Resueltos

### ~~DEBT-001~~ — Tests automatizados ✅ (Resuelto parcialmente — 2026-06-02)
- **Vitest** configurado y funcionando: **281 tests en 20 ficheros pasando** (medido 2026-06-08)
- Servicios T1-T4, T6, T7, T8 cubiertos (7 service test files)
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

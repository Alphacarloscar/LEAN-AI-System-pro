# Sesión técnica — L.E.A.N. AI System
**Fecha:** 2026-05-25 | **Duración:** Sesión completa  
**Tipo:** Arquitectura + Seguridad + Auditoría de producto  
**Participante:** Carlos Sánchez (COO)

---

## Contexto de la sesión

Esta sesión es continuación de una auditoría técnica iniciada el 2026-05-21. Los documentos de la auditoría están en `docs/evaluations/2026-05-21_13-30/`. El resumen compactado de la sesión anterior está en el historial de Claude.

---

## Capítulo 1 — Seguridad: Edge Function `ai-recommend`

### Problema identificado

La Edge Function `supabase/functions/ai-recommend/index.ts` tenía cuatro vulnerabilidades:

1. **Sin autenticación JWT**: cualquier llamada con la anon key podía invocarla
2. **Sin validación de `tool`**: el `default: throw Error` devolvía 500 opaco
3. **CORS `*`**: cualquier origen podía invocar la función
4. **Sin límite de tamaño en `context`**: payload masivo posible (prompt injection)

### Preocupación del usuario

> "para las llamadas de IA me preocupa que se puedan llamar a anthropic para pedir modificaciones desde la propia aplicación"

### Fix implementado

**Archivo editado:** `supabase/functions/ai-recommend/index.ts`

#### Cambios aplicados

| Layer | Antes | Después |
|-------|-------|---------|
| Import | Solo `serve` | + `createClient` de `@supabase/supabase-js@2` |
| CORS origin | `'*'` hardcoded | `Deno.env.get('ALLOWED_ORIGIN') ?? '*'` |
| Auth | Ninguna | JWT validation via `supabase.auth.getUser(jwt)` → 401 si falla |
| Tool validation | `default: throw Error` → 500 | `VALID_TOOLS.has(tool)` → 400 explícito antes de llegar a Claude |
| Context size | Sin límite | `JSON.stringify(context).length > 50_000` → 400 |
| Logging | Sin trazabilidad | `console.info` con `tool`, `user.id`, `contextBytes` por llamada |

#### Código añadido en el handler

```typescript
// ── 1. Autenticación JWT ────────────────────────────────────
const authHeader = req.headers.get('Authorization')
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'No autorizado: token requerido' }), {
    status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)
const jwt = authHeader.replace('Bearer ', '')
const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)

if (authError || !user) {
  return new Response(JSON.stringify({ error: 'No autorizado: token inválido o expirado' }), {
    status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// ── 3. Validación de tool por enum ──────────────────────────
const VALID_TOOLS = new Set([
  't1', 't2', 't3_opportunities', 't4', 't5',
  't6', 't6_policy', 't7', 't7_plan',
  't8', 't8_comms', 't9', 't10', 't11',
])
if (!VALID_TOOLS.has(tool)) {
  return new Response(JSON.stringify({ error: `Tool no soportado: ${tool}` }), {
    status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// ── 4. Límite de tamaño del contexto ───────────────────────
const MAX_CONTEXT_BYTES = 50_000
const contextBytes = JSON.stringify(context).length
if (contextBytes > MAX_CONTEXT_BYTES) {
  return new Response(JSON.stringify({ error: 'Contexto demasiado grande (máx. 50 KB)' }), {
    status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
```

#### Variables de entorno requeridas (añadir en Supabase Secrets)

```
ALLOWED_ORIGIN = https://[tu-dominio].vercel.app
```
> `SUPABASE_URL` y `SUPABASE_ANON_KEY` son auto-inyectadas por el runtime de Supabase.

#### Impacto en el frontend

`supabase.functions.invoke()` ya envía `Authorization: Bearer <access_token>` automáticamente cuando el usuario está autenticado. **Cero cambios necesarios en `useRecommendations.ts`.**

#### Vectores cerrados

- Llamada externa con solo la anon key → 401
- Tool inventado → 400 con log del `user.id`
- Payload masivo de prompt injection → 400 si supera 50 KB
- Origen externo en producción → configurar `ALLOWED_ORIGIN`

#### Lo que NO cubre (aceptado como riesgo bajo)

Prompt injection a través de campos legítimos: un usuario autenticado podría incluir texto adversarial en campos como "sector de empresa". Riesgo bajo porque: (a) system prompts hardcodeados y restrictivos, (b) solo usuarios Alpha autenticados acceden, (c) output siempre pasa por `JSON.parse()`.

---

## Capítulo 2 — Análisis de la primera pantalla

### La ruta `/` siempre renderiza `T10View`

```tsx
// App.tsx línea 211
<Route index element={<T10RouteView />} />
```

### El flag `isDemoEnabled`

```ts
// src/lib/config.ts
export const isDemoEnabled: boolean =
  import.meta.env.VITE_DEMO_ENABLED !== 'false'
// Sin VITE_DEMO_ENABLED definido → true por defecto
```

`.env.local` no tiene `VITE_DEMO_ENABLED` → **`isDemoEnabled = true` en local y en Vercel** salvo que se añada explícitamente.

### Dos modos de datos completamente distintos

#### Modo demo (`isDemoEnabled = true`) — **Estado actual**

```ts
// T10View.tsx línea 675-680
const d      = T10_DEMO                              // ← objeto estático hardcodeado
const t4data = isDemoEnabled ? d.t4     : liveT4
const t2data = isDemoEnabled ? d.t2t7   : liveT2
const t3data = isDemoEnabled ? d.t3t5   : liveT3
const p5data = isDemoEnabled ? d.t6t12  : liveP5
const p6data = isDemoEnabled ? d.t8t9t11 : liveP6
```

```ts
// T10View.tsx línea 331 — NO llama a Supabase en demo
useEffect(() => {
  if (!engagementId || isDemoEnabled) return  // ← early return
  loadT1(engagementId)
  ...
}, [engagementId])
```

**Cero llamadas a Supabase. Todos los datos son estáticos.**

#### Fuentes de datos en modo demo

| Zona | Dato visible | Fuente real | Archivo |
|------|-------------|-------------|---------|
| Header | "Conecta Professional Services" | `vendorSprawlScenario.company.name` | `src/data/demo/scenarios/vendor-sprawl.ts` |
| Header | Sector + empleados | `vendorSprawlScenario.company.industry/employees` | `vendor-sprawl.ts` |
| Header centro | Índice IA 1.6/4.0 | Media de `vendorSprawlScenario.t1Radar` | `vendor-sprawl.ts` |
| Header derecha | "Sprint 3 / 6 · Mayo 2026" | **Hardcodeado en JSX** (T10View.tsx línea 722) | — |
| P1 | 4 barras de dimensión | `vendorSprawlScenario.t1Radar` (Estrategia 2.0, Datos 1.8, Tecnología 1.9, Talento 2.4, Procesos 0.9, Gobernanza 0.4) | `vendor-sprawl.ts` |
| P2 | 8 iniciativas, €259K, ROI 2.4x | `T10_DEMO.t4` | `demo-data.ts` |
| P3 | 47 stakeholders, 38% adoptando | `T10_DEMO.t2t7` | `demo-data.ts` |
| P4 | 12 procesos, bottleneck "Calidad de datos" | `T10_DEMO.t3t5` | `demo-data.ts` |
| P5 | 11 riesgos, ISO 52% | `T10_DEMO.t6t12` | `demo-data.ts` |
| P6 | 3 iniciativas en GO, próximos eventos | `T10_DEMO.t8t9t11` | `demo-data.ts` |

#### Modo producción (`isDemoEnabled = false`)

T10 dispara 7 llamadas a Supabase en su propio `useEffect`:
```ts
loadT1(engagementId)      // → t1_dimension_scores
loadT2(engagementId)      // → stakeholders
loadT3(engagementId)      // → value_streams
loadT4(engagementId)      // → use_cases
loadProfile(engagementId) // → company_profiles + frictions
syncT12(engagementId)     // → localStorage
syncT9(engagementId)      // → localStorage
```

**T10 siempre funciona porque se auto-carga todo.** Es el único módulo que no sufre el bug de caché.

### Problemas identificados

**Problema 1 — Archivos de escenario borrados localmente (no comprometidos)**

Los 5 archivos `src/data/demo/scenarios/*.ts` aparecen en `git status` como `D` (deleted, unstaged). El deploy en Vercel funciona porque fue antes del borrado. Un nuevo `npm run dev` o `git push` fallaría.

**Problema 2 — "Sprint 3 / 6 · Mayo 2026" hardcodeado**

```tsx
// T10View.tsx línea 721-724
<span>Sprint 3 / 6</span>   // hardcodeado
<p>Mayo 2026</p>             // hardcodeado
```

Cualquier cliente real verá "Mayo 2026" sin importar en qué punto esté su engagement.

---

## Capítulo 3 — Mapa completo de acciones por página

### Elementos globales — Header + Sidebar

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Logo Alpha → navega a `/` | 🧭 Navegación | Todos |
| Selector de proyecto (dropdown) | 🖥️ UI | Todos |
| Seleccionar proyecto existente | 🖥️ `EngagementStore.selectEngagement(id)` | Todos |
| Nuevo proyecto (crear) | 🗄️ `supabase.rpc('create_project')` → `projects` + `project_members` | Todos autenticados |
| Botón dark mode | 💾 localStorage `useDarkMode` | Todos |
| Botón logout | 🗄️ `supabase.auth.signOut()` | Todos |
| Navegación T1–T12 + CompanyProfile | 🧭 Navegación | Todos |

---

### Auth — Login (`/login`)

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Botón "Iniciar sesión" | 🗄️ `supabase.auth.signInWithPassword()` | Anónimos |
| Botón "Enviar enlace recuperación" | 🗄️ `supabase.auth.resetPasswordForEmail()` | Anónimos |

### Auth — Reset Password (`/reset-password`)

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Botón "Cambiar contraseña" | 🗄️ `supabase.auth.updateUser({ password })` | Recovery flow |

---

### T10 — AI Value Dashboard Home (`/`)

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Selector escenario demo (solo si `isDemoEnabled`) | 🖥️ `DemoContext.setPattern()` | Todos |
| Click paneles P1-P6 (accordion) | 🖥️ Local | Todos |
| Botones "Abrir T1→T6" | 🧭 Navegación | Todos |
| RecommendationPanel | 🤖 `ai-recommend` tool=`t10` | Autenticados |

---

### CompanyProfile (`/company-profile`)

> Tablas: `company_profiles` + `frictions`

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Todos los inputs del formulario | 🖥️ Estado local hasta guardar | `consultant`, `client_editor` |
| Añadir / eliminar fricciones | 🖥️ Array local | `consultant`, `client_editor` |
| **Botón "Guardar y volver"** | 🗄️ `company_profiles` UPSERT + `frictions` DELETE + INSERT | `consultant`, `client_editor` |

---

### T1 — AI Maturity Radar (`/t1`)

> Tabla: `t1_dimension_scores`

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Crear entrevistado (modal) | 🗄️ `t1_dimension_scores` UPSERT (subdimensiones en blanco) | `consultant`, `client_editor` |
| Eliminar entrevistado | 🗄️ `t1_dimension_scores` DELETE by `interviewee_id` | `consultant`, `client_editor` |
| Slider score subdimensión | 🗄️ `t1_dimension_scores` UPSERT debounce 800ms | `consultant`, `client_editor` |
| Textarea evidencia | 🗄️ `t1_dimension_scores` UPSERT debounce 1200ms | `consultant`, `client_editor` |
| Toggle ver criterios | 🖥️ Local | Todos |
| RecommendationPanel | 🤖 `ai-recommend` tool=`t1` | Autenticados |

---

### T2 — Stakeholder Matrix (`/t2`)

> Tabla: `stakeholders`

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Crear stakeholder (modal) | 🗄️ `stakeholders` INSERT | `consultant`, `client_editor` |
| Importar desde T1 (bulk) | 🗄️ `stakeholders` INSERT bulk | `consultant`, `client_editor` |
| Editar arquetipo (5 opciones) | 🗄️ `stakeholders` UPDATE `archetype` | `consultant`, `client_editor` |
| Editar resistencia | 🗄️ `stakeholders` UPDATE `resistance` | `consultant`, `client_editor` |
| Sliders Influencia / Adopción / Apertura | 🗄️ `stakeholders` UPDATE `interview` JSONB | `consultant`, `client_editor` |
| Textarea notas | 🗄️ `stakeholders` UPDATE `notes` | `consultant`, `client_editor` |
| Input herramientas no oficiales | 🗄️ `stakeholders` UPDATE `unofficial_tools` | `consultant`, `client_editor` |
| Eliminar stakeholder | 🗄️ `stakeholders` DELETE | `consultant`, `client_editor` |
| Click en SVG cuadrante | 🖥️ Selección local | Todos |
| RecommendationPanel | 🤖 `ai-recommend` tool=`t2` | Autenticados |

---

### T3 — Value Stream Map (`/t3`)

> Tabla: `value_streams`

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Crear proceso | 🗄️ `value_streams` INSERT | `consultant`, `client_editor` |
| Editar nombre, departamento, categoría IA, fase, nivel oportunidad | 🗄️ `value_streams` UPDATE | `consultant`, `client_editor` |
| Guardar entrevista del proceso | 🗄️ `value_streams` UPDATE `interview` JSONB | `consultant`, `client_editor` |
| Tab Etapas (añadir/editar) | 🗄️ `value_streams` UPDATE `stages` JSONB | `consultant`, `client_editor` |
| Tab Oportunidades (añadir/eliminar) | 🗄️ `value_streams` UPDATE `opportunities` JSONB | `consultant`, `client_editor` |
| Eliminar proceso | 🗄️ `value_streams` DELETE | `consultant`, `client_editor` |
| Botón "Generar oportunidades IA" | 🤖 `ai-recommend` tool=`t3_opportunities` (llamada directa T3View.tsx:609) | Autenticados |
| RecommendationPanel | 🤖 `ai-recommend` tool=`t3_opportunities` | Autenticados |

---

### T4 — Use Case Priority Board (`/t4`)

> Tabla: `use_cases`

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Importar desde T3 (bulk) | 🗄️ `use_cases` INSERT bulk | `consultant`, `client_editor` |
| Crear caso de uso | 🗄️ `use_cases` INSERT | `consultant`, `client_editor` |
| Guardar scoring (4 sliders) | 🗄️ `use_cases` UPDATE `scores` JSONB | `consultant`, `client_editor` |
| Guardar economía (5 inputs) | 🗄️ `use_cases` UPDATE `economics` JSONB | `consultant`, `client_editor` |
| Asignar a roadmap (quarter) | 🗄️ `use_cases` UPDATE `roadmap` | `consultant`, `client_editor` |
| Clasificación AI Act (cuestionario) | 🗄️ `use_cases` UPDATE `ai_act_classification` | `consultant`, `client_editor` |
| Decisión GO / NO-GO | 🗄️ `use_cases` UPDATE `go_no_go` + `status` | `consultant` (sin guard explícito) |
| Cambiar estado (6 estados) | 🗄️ `use_cases` UPDATE `status` | `consultant`, `client_editor` |
| RecommendationPanel | 🤖 `ai-recommend` tool=`t4` | Autenticados |

---

### T5 — AI Taxonomy Canvas (`/t5`)

> **⚠️ Sin Supabase. Solo localStorage.**

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Sliders Business Value / Technical / Org Readiness | 💾 `t5-store` localStorage | `consultant`, `client_editor` |
| Guardar evaluación de dominio | 💾 `t5-store` localStorage | `consultant`, `client_editor` |
| Ver casos de uso relacionados | 🖥️ Lee `useT4Store()` | Todos |
| RecommendationPanel | 🤖 `ai-recommend` tool=`t5` | Autenticados |

---

### T6 — Risk & Governance (`/t6`)

> **⚠️ Sin Supabase. Solo localStorage + Edge Function para política.**

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Toggle estado de control ISO (14 controles) | 💾 `t6-store` localStorage | `consultant`, `client_editor` |
| Textarea notas del control | 💾 `t6-store` localStorage | `consultant`, `client_editor` |
| **Botón "Generar política con IA"** | 🤖 `ai-recommend` tool=`t6_policy` vía `usePolicyGeneration` | `consultant` |
| **Botón "Descargar Policy PDF"** | 🖥️ `jsPDF` — generación local | Todos |

---

### T7 — Adoption Heatmap (`/t7`)

> **⚠️ Sin Supabase. Solo localStorage + Edge Function para plan.**

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Click en celda heatmap | 🖥️ Local | Todos |
| **Botón "Generar plan de cambio con IA"** | 🤖 `ai-recommend` tool=`t7_plan` vía `useChangePlanGeneration` | `consultant` |
| Botón "Limpiar plan" | 💾 `t7-store.clearGeneratedPlan()` | `consultant` |

---

### T8 — Communication Map (`/t8`)

> **⚠️ Sin Supabase. Solo localStorage + Edge Function para comunicaciones.**

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Selector arquetipo / canal | 🖥️ Local | Todos |
| **Botón "Generar plan de comunicación con IA"** | 🤖 `ai-recommend` tool=`t8_comms` vía `useT8Generation` | `consultant` |
| Botón "Limpiar contenido" | 💾 `t8-store.clearGeneratedContent()` | `consultant` |

---

### T9 — AI Roadmap (`/t9`)

> **⚠️ Sin Supabase. Solo localStorage.** (Pendiente Sprint 4 → tabla `roadmap_items`)

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Añadir iniciativa libre | 💾 `t9-store.addFreeItem()` localStorage | `consultant`, `client_editor` |
| Editar iniciativa libre | 💾 `t9-store.updateFreeItem()` localStorage | `consultant`, `client_editor` |
| Eliminar iniciativa libre | 💾 `t9-store.removeFreeItem()` localStorage | `consultant`, `client_editor` |
| Reposicionar caso T4 (override) | 💾 `t9-store.setOverride()` localStorage | `consultant`, `client_editor` |
| RecommendationPanel | 🤖 `ai-recommend` tool=`t9` | Autenticados |

---

### T11 — Operating Rhythm (`/t11`)

> **Sin persistencia identificada en el código.**

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Click en evento de gobernanza | 🖥️ Local | Todos |
| Toggle nivel (direction / program / team) | 🖥️ Local | Todos |
| **Botón "Exportar PDF"** | 🖥️ `jsPDF` — generación local | Todos |
| RecommendationPanel | 🤖 `ai-recommend` tool=`t11` | Autenticados |

---

### T12 — ISO 42001 Assessment (`/t12`)

> **⚠️ Sin Supabase. Solo localStorage.** (Pendiente Sprint 6)

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Toggle estado de control (25 controles, 4 estados) | 💾 `t12-store` localStorage | `consultant`, `client_editor` |
| Textarea evidencia + nota revisión | 💾 `t12-store` localStorage | `consultant`, `client_editor` |
| **Botón "Importar desde T6"** | 💾 Lee `t6-store`, escribe `t12-store` localStorage | `consultant`, `client_editor` |
| Botón "Reset todos" | 💾 `t12-store.resetAll()` localStorage | `consultant` |
| **Botón "Exportar informe ISO PDF"** | 🖥️ `jsPDF` — generación local | Todos |

---

### Admin (`/admin`)

> **Guard explícito:** único módulo con control de acceso en frontend.
> ```tsx
> // AdminView.tsx línea 501
> if (user && user.role !== 'superadmin') navigate('/', { replace: true })
> ```

| Elemento | Endpoint | Usuarios |
|----------|----------|----------|
| Tab Empresas — Crear empresa | 🗄️ `companies` INSERT | `superadmin` |
| Tab Usuarios — Invitar usuario | ⚠️ **MOCK** — solo `console.log()` (pendiente Sprint 10) | `superadmin` |
| Tab Proyectos — Crear proyecto | 🗄️ `supabase.rpc('create_project')` | `superadmin` |
| Filtro lista usuarios | 🖥️ Local | `superadmin` |

---

## Resumen de persistencia por módulo

| Módulo | Supabase | localStorage | Edge Function IA |
|--------|----------|-------------|-----------------|
| T1 | ✅ `t1_dimension_scores` | — | ✅ `t1` |
| T2 | ✅ `stakeholders` | — | ✅ `t2` |
| T3 | ✅ `value_streams` | — | ✅ `t3_opportunities` (×2) |
| T4 | ✅ `use_cases` | — | ✅ `t4` |
| T5 | ❌ | ✅ `t5-store` | ✅ `t5` |
| T6 | ❌ | ✅ `t6-store` | ✅ `t6_policy` |
| T7 | ❌ | ✅ `t7-store` | ✅ `t7_plan` |
| T8 | ❌ | ✅ `t8-store` | ✅ `t8_comms` |
| T9 | ❌ | ✅ `t9-store` | ✅ `t9` |
| T10 | ❌ (solo lee) | — | ✅ `t10` |
| T11 | ❌ | — | ✅ `t11` |
| T12 | ❌ | ✅ `t12-store` | — |
| CompanyProfile | ✅ `company_profiles` + `frictions` | — | — |
| Engagement | ✅ `projects` + `project_members` | ✅ `lean-active-engagement` | — |

---

## Resumen de control de acceso

| Rol | Acceso real |
|-----|------------|
| `superadmin` | Único con acceso a `/admin`. Guard explícito en AdminView. |
| `consultant` | Acceso completo a T1-T12 + CompanyProfile. Sin guards frontend. |
| `client_editor` | Mismo acceso de edición en frontend. Restricciones reales vía **RLS Supabase**. |
| `client_viewer` | Sin guards frontend que oculten botones. Control vía RLS: UPSERTs fallan con 403. T10 muestra banner "solo lectura" si el proyecto es de otro usuario. |

**Implicación crítica:** La seguridad real del sistema reside en las **99 políticas RLS de Supabase (migration 008)**, no en el código React. Si RLS falla, cualquier usuario autenticado puede escribir datos de otro cliente.

---

## Pendientes identificados en la sesión

### Inmediato

| # | Acción | Archivo | Esfuerzo |
|---|--------|---------|----------|
| 1 | ✅ Añadir JWT auth + VALID_TOOLS + context size a Edge Function | `supabase/functions/ai-recommend/index.ts` | **HECHO** |
| 2 | Añadir `ALLOWED_ORIGIN=https://[dominio].vercel.app` en Supabase Secrets | Supabase Dashboard | 2 min |
| 3 | Resolver archivos de escenario borrados sin commit (5 archivos `D`) | `src/data/demo/scenarios/*.ts` | Decisión: restaurar o hacer commit del borrado |

### Próximo sprint

| # | Acción |
|---|--------|
| 4 | Implementar fix `loadedForEngagement` en stores T1, T2, T3, T4 (bug de caché diagnosticado) |
| 5 | Reemplazar "Sprint 3 / 6 · Mayo 2026" hardcodeado en T10View por datos del proyecto activo |
| 6 | Migrar T5, T6, T7, T8, T9, T12 de localStorage a Supabase |
| 7 | Implementar inviteUser real en Admin (Edge Function con service role key) |

---

## Fix de caché pendiente de implementar (diseño)

Problema: los stores T1, T2, T3, T4 solo tienen guard `isLoading` (concurrencia), no "ya cargado para este engagement". T2/T3/T4 fallan en hard-reload directo porque dependen de que T10 haya sido visitado primero.

**Fix propuesto (`loadedForEngagement`):**

```typescript
// Añadir al state de T2Store (y T1, T3, T4):
loadedForEngagement: string | null  // null = nunca cargado / falló

// Guard actualizado en load():
load: async (engagementId) => {
  if (get().loadedForEngagement === engagementId) return  // ya en memoria
  if (get().isLoading) return                              // concurrencia
  set({ isLoading: true, lastError: null })
  try {
    const stakeholders = await fetchStakeholders(engagementId)
    set({ stakeholders, isLoading: false, loadedForEngagement: engagementId })
  } catch (err) {
    console.error('[T2Store] load:', err)
    set({ isLoading: false, loadedForEngagement: null })  // null = reintentable
  }
},

// En reset():
reset: () => set({ stakeholders: [], isLoading: false, lastError: null, loadedForEngagement: null })
```

| Escenario | Comportamiento |
|-----------|---------------|
| Hard reload en T2 | `loadedForEngagement = null` → siempre fetcha ✓ |
| Navegar T10 → T2 | `loadedForEngagement = "abc-123"` → usa memoria ✓ |
| Cambiar engagement | Nuevo ID ≠ almacenado → fetcha ✓ |
| Load fallido | Queda `null` → reintentable ✓ |

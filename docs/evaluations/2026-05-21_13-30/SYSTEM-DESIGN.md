# System Design Review — L.E.A.N. AI System Enterprise
**Modo:** Evaluación de arquitectura existente + diseño de componentes faltantes  
**Fecha:** 2026-05-21 | **Stack:** React 18 + Vite 6 + TypeScript 5.7 + Supabase + Vercel

---

## 1. Arquitectura actual

### 1.1 Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐  │
│  │ React 18    │  │  Módulos T1-T12 (herramientas LEAN)       │  │
│  │ + Vite 6    │  │  ┌────────┐ ┌────────┐ ┌────────────┐    │  │
│  │ + TS 5.7    │  │  │ View   │ │ Store  │ │ Service *  │    │  │
│  │ + Tailwind  │  │  │ (TSX)  │ │(Zustand│ │(Supabase)  │    │  │
│  │             │  │  └────────┘ └────────┘ └────────────┘    │  │
│  │ Zustand 5   │  │  * Solo T1-T4 tienen service.ts           │  │
│  │ (state mgmt)│  └──────────────────────────────────────────┘  │
│  │             │                                                  │
│  │ react-router│  ┌──────────────────────────────────────────┐  │
│  │ + zod       │  │  Shared components (7 implementados)      │  │
│  │ + react-hook│  │  design-system/ (VACÍO — deuda Sprint 0.5)│  │
│  │   -form     │  └──────────────────────────────────────────┘  │
│  └─────────────┘                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / Supabase JS SDK
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    SUPABASE (Backend)                            │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ PostgreSQL  │  │ GoTrue Auth  │  │ Edge Functions (Deno)│   │
│  │ + RLS (99   │  │ + JWT tokens │  │ · ai-recommend       │   │
│  │   políticas)│  │              │  │ (Claude API)         │   │
│  │             │  └──────────────┘  └──────────────────────┘   │
│  │ 8 migrations│                                                 │
│  │ (manual,    │  ┌──────────────┐  ┌──────────────────────┐   │
│  │ sin CLI)    │  │ PostgREST    │  │ Supabase Storage     │   │
│  └─────────────┘  │ (REST auto)  │  │ (archivos/exports)   │   │
│                   └──────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                           │ Git push → deploy automático
┌──────────────────────────▼──────────────────────────────────────┐
│               VERCEL (Hosting / CDN)                            │
│  main → producción  |  PRs → preview deployments               │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Flujo de datos (ejemplo T1 — Maturity Radar)

```
Usuario → T1View.tsx
  → useT1Store (Zustand)
    → [si datos no cargados] T1Service.loadData(engagementId)
      → supabase.from('t1_scores').select(...)
        → RLS verifica: ¿usuario tiene acceso al engagement?
          → responde con datos
      → store actualiza state
    → View re-renderiza con datos
  → Usuario modifica slider
    → store.setScore(dimension, value)
      → debounce 800ms
      → T1Service.upsertScore(...)
        → supabase.from('t1_scores').upsert(...)
```

---

## 2. Evaluación de la arquitectura

### 2.1 Lo que está bien diseñado

**Multi-tenancy via RLS.** 99 políticas de Row Level Security garantizan aislamiento de datos a nivel de BD, no de aplicación. Es la forma correcta de hacerlo en PostgreSQL — la alternativa (filtros en la capa de aplicación) sería propensa a bugs de filtrado.

**Patrón módulo (T1-T4).** La separación `View / Store / Service / Types / Constants / index` por módulo es una arquitectura de features correcta. Cada módulo es autónomo, fácil de razonar, y el Store como única fuente de verdad del módulo está bien ejecutado.

**Lazy loading de módulos.** La configuración de Vite con chunks separados (vendor, supabase, charts, ui, forms, state) implica que el usuario no descarga todos los 12 módulos al cargar la app — solo el chunk del módulo que visita.

**Edge Functions para LLM.** `ai-recommend` como Edge Function de Supabase es el patrón correcto: la API key de Claude vive en el servidor (variables de entorno de Supabase), no en el cliente. **El problema es que .env.example define VITE_CLAUDE_API_KEY como alternativa de frontend para producción — esto es contradictorio con la Edge Function.**

### 2.2 Gaps arquitectónicos

**Gap 1 — Capa de servicio incompleta (T5-T12)**

T1-T4 tienen service.ts que abstrae las llamadas a Supabase. T5-T12 llaman directamente al cliente de Supabase desde el store. Esto crea dos consecuencias:
- Los stores de T5-T12 tienen lógica de acceso a datos mezclada con lógica de estado
- Si Supabase cambia su API o se migra a otro backend, T5-T12 requieren cambios en stores (no en un servicio centralizado)

**Gap 2 — Sin capa de caché**

Cada navegación entre módulos dispara un fetch a Supabase. No hay caché de queries en cliente más allá del estado de Zustand (que se pierde al recargar). Para un producto enterprise donde los datos de un engagement cambian poco en una sesión de trabajo, esto genera latencia innecesaria.

**Gap 3 — Sin manejo de estado de red**

Los stores tienen `loading: boolean` y `error: string | null`, pero no hay estado de `stale`, `refetching`, ni retry automático. Si una query falla, el usuario ve un error y debe recargar manualmente.

**Gap 4 — Migraciones manuales sin CLI**

Las 8 migraciones SQL se aplican manualmente vía Supabase Dashboard. No hay rollback automatizado, no hay estado de migración en CI, y `database.types.ts` se mantiene manualmente. El riesgo de divergencia entre esquema de BD y tipos de TypeScript aumenta con cada sprint.

---

## 3. Diseño propuesto: componentes faltantes

### 3.1 Capa de servicio para T5-T12

**Diseño:**
```typescript
// src/modules/T5_AITaxonomyCanvas/service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type T5Row = Database['public']['Tables']['t5_taxonomy']['Row']

export const T5Service = {
  async load(engagementId: string): Promise<T5Row[]> {
    const { data, error } = await supabase
      .from('t5_taxonomy')
      .select('id, engagement_id, category, subcategory, maturity_score, notes')
      .eq('engagement_id', engagementId)
      .order('category')
    if (error) throw error
    return data ?? []
  },

  async upsert(record: Partial<T5Row> & { engagement_id: string }): Promise<T5Row> {
    const { data, error } = await supabase
      .from('t5_taxonomy')
      .upsert(record, { onConflict: 'engagement_id,category,subcategory' })
      .select()
      .single()
    if (error) throw error
    return data
  }
}
```

**Patrón a replicar en T5-T12.** Cada servicio expone solo `load` y `upsert` (+ `delete` si aplica). El store importa el servicio, nunca al cliente de Supabase directamente.

### 3.2 Arquitectura de la llamada LLM — la correcta

El problema de `VITE_CLAUDE_API_KEY` se resuelve con este flujo:

```
Frontend                    Supabase Edge Function          Anthropic API
   │                               │                              │
   │  POST /functions/ai-recommend │                              │
   │  body: { context: {...} }     │                              │
   │──────────────────────────────►│                              │
   │                               │  POST /messages              │
   │                               │  Authorization: sk-ant-...   │
   │                               │  (env var del servidor)      │
   │                               │─────────────────────────────►│
   │                               │                              │
   │                               │◄─────────────────────────────│
   │◄──────────────────────────────│                              │
   │  { recommendations: [...] }   │                              │
```

La API key **nunca sale del servidor**. El frontend solo envía contexto y recibe recomendaciones.

### 3.3 Estrategia de caché mínima viable

Sin añadir dependencias, se puede implementar caché a nivel de store:

```typescript
// En cada store — patrón de caché simple
interface StoreState {
  data: T1Data | null
  loading: boolean
  error: string | null
  lastLoadedEngagementId: string | null  // ← nuevo
  lastLoadedAt: number | null            // ← nuevo (timestamp)
}

// En la función load:
load: async (engagementId: string) => {
  const state = get()
  const CACHE_TTL_MS = 5 * 60 * 1000  // 5 minutos

  // Skip fetch si los datos son recientes y del mismo engagement
  if (
    state.lastLoadedEngagementId === engagementId &&
    state.lastLoadedAt &&
    Date.now() - state.lastLoadedAt < CACHE_TTL_MS
  ) return

  // fetch normal...
}
```

Cero dependencias nuevas, 5 líneas por store, elimina la mayoría de fetches redundantes.

---

## 4. Trade-offs y decisiones pendientes

| Decisión | Opción A | Opción B | Recomendación |
|----------|----------|----------|---------------|
| Tipado Supabase | Mantener `<any>` + tipos manuales | `createClient<Database>` + CLI codegen | **B** — activa el compilador en el punto más crítico |
| Caché | Sin caché (estado actual) | Caché simple en store (5min TTL) | **B** — mínimo esfuerzo, alto impacto |
| Migraciones | Manual via Dashboard | Supabase CLI en GitHub Actions | **B** — cuando CI/CD exista (ADR previo) |
| Estado de red | loading/error binario | loading/error/stale/retry | **B** progresivo — empezar con retry automático |

---

## 5. Recomendaciones priorizadas

1. **Inmediato:** Eliminar `VITE_CLAUDE_API_KEY` de .env.example — riesgo de seguridad activo.
2. **Sprint siguiente:** Crear service.ts para T5-T12 siguiendo el patrón de T1. Unificar la arquitectura del 100% de los módulos.
3. **Sprint siguiente:** Activar `createClient<Database>` y resolver divergencia de UserRole (ADR D-10).
4. **Sprint 3:** Añadir caché mínima de 5 minutos en stores — visible improvement para el usuario sin dependencias nuevas.
5. **Futuro:** Evaluar React Query o SWR cuando el número de módulos haga el patrón de store demasiado verboso.

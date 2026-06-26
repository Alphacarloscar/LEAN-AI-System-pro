# Área 02 — Patrones de Programación   🟡

**Puntuación:** 5/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

La arquitectura de módulos (View / store / service / types / constants) es correcta y consistente en T1-T4. El problema es que T5-T12 no tienen capa de service: 8 de los 12 módulos de herramientas acceden a Supabase directamente desde sus stores o no tienen persistencia real. Hay además una divergencia de tipos grave entre `domain.types.ts` y `database.types.ts` en el modelo de roles de usuario.

## Hallazgos

### 🔴 Críticos

- **T5-T12 sin capa service**: Solo T1-T4 tienen fichero `t{n}.service.ts`. Los 8 módulos restantes — que representan el 66% de las herramientas del producto — no tienen capa de abstracción de datos. Esto significa que los stores llaman directamente a Supabase o que la persistencia no está implementada en esos módulos.

- **Divergencia de tipos de roles (domain.types.ts vs database.types.ts)**: `domain.types.ts` define `UserRole` como `'consultor_alpha' | 'pm_cliente' | 'viewer_csuite' | 'admin_alpha' | 'superadmin'` (terminología de arquetipos de negocio). `database.types.ts` define `UserRole` como `'superadmin' | 'consultant' | 'client_editor' | 'client_viewer'` (terminología técnica de BD). Son dos enumeraciones incompatibles con el mismo nombre. El compilador puede confundirlas si se importan juntas.

### 🟡 Mejorables

- **Acceso directo a Supabase desde modules**: `Auth/store.ts`, `Engagement/store.ts`, `T3/T3View.tsx`, `CompanyProfile/CompanyProfileView.tsx` importan `supabase` directamente en lugar de hacerlo a través de `services/`. Viola el patrón establecido en D5 (ARQUITECTURA.md).

- **Sub-componentes incrustados en View**: Los ficheros `TxView.tsx` contienen tanto lógica de estado como múltiples componentes hijos. El patrón correcto (View delgado + componentes hijos en `/components/`) existe en la intención pero no en la implementación.

- **Único store global de recomendaciones** (`recommendationCache.store.ts`) aislado en `src/stores/` en lugar de coexistir con el módulo que lo usa. Inconsistente con el patrón de store-por-módulo.

- **Route wrappers en App.tsx**: Los 12 `T{n}RouteView` están definidos directamente en `App.tsx`. Con 12 módulos, el fichero raíz acumula 200+ líneas de wrappers que deberían estar en `src/routes/`.

### 🟢 Correctos

- Estructura de módulo consistente en T1-T4: `View / store / service / types / constants / index`.
- 13 stores Zustand aislados por módulo (uno por módulo).
- Error handling en stores con try/catch + console.error contextualizado (`[T1Store] load:`).
- Debounce en setScore (800ms) para evitar flood de UPSERTs — buen patrón.
- Imports via path aliases en 100% de los ficheros (0 imports relativos `../`).

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| Módulos con capa service completa | 4/12 (33%) | Objetivo 12/12 |
| Módulos con acceso directo a Supabase | 4+ | Objetivo 0 |
| Stores Zustand por módulo | 13 | ✅ Correcto |
| Tipos de rol coherentes entre capas | ❌ Divergencia | Requerido |

## Recomendaciones priorizadas

### Prioridad 1 — Crear services T5-T12

**Qué:** Crear `src/services/t5.service.ts` ... `t12.service.ts` siguiendo el mismo contrato que `t1.service.ts` (fetch, upsert, delete tipados).

**Por qué:** Sin capa de service, cualquier cambio en el esquema de Supabase requiere buscar y editar directamente los stores o las views. El acoplamiento es total.

**Cómo:** Tomar `t1.service.ts` como plantilla. Para cada módulo, identificar las tablas que usa (ya documentadas en ARQUITECTURA.md sección 8) y crear las funciones de fetch/upsert correspondientes.

**Plan Maestro:** Sin PR asignado — Sprint de completar capa de servicios.

### Prioridad 2 — Resolver divergencia domain.types.ts / database.types.ts

**Qué:** Decidir cuál es la fuente de verdad para `UserRole` y eliminar la definición del otro fichero, o renombrar una de las dos para que sean inconfundibles (`DomainUserRole` vs `DbUserRole`).

**Por qué:** Una importación accidental del tipo equivocado es silenciosa en compilación y rompería la lógica de autorización en runtime.

**Plan Maestro:** Sin PR asignado — Fix crítico de tipos.

### Prioridad 3 — Mover route wrappers a src/routes/

**Qué:** Extraer los 12 `T{n}RouteView` de `App.tsx` a `src/routes/index.tsx` (carpeta que existe pero está vacía).

**Plan Maestro:** Sin PR asignado — Limpieza de App.tsx.

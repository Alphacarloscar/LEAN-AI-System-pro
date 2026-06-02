# Code Review — L.E.A.N. AI System Enterprise
**Scope:** Ficheros críticos del codebase | **Fecha:** 2026-05-21  
**Ficheros revisados:** supabase.ts, .env.example, domain.types.ts, T4View.tsx (primeras 80L), AppSidebar.tsx

---

## Resumen

El código base tiene una base TypeScript sólida (strict mode, path aliases, Zod) y patrones de store bien ejecutados en T1-T4. Los problemas críticos se concentran en dos áreas: **seguridad** (API key de Claude en el bundle de cliente, branding residual de GOBY en .env.example) y **tipo-seguridad** (createClient\<any\> que silencia todos los errores de BD, divergencia de UserRole entre los dos archivos de tipos). La deuda de mantenimiento está bien localizada: T4View.tsx concentra el 90% de la complejidad en un solo fichero.

---

## Issues críticos

| # | Fichero | Línea | Issue | Severidad |
|---|---------|-------|-------|-----------|
| 1 | `.env.example` | — | `VITE_CLAUDE_API_KEY=sk-ant-...` comentado como variable de producción. Cualquier `VITE_*` se incrusta en el bundle de Vite y queda expuesta en el código fuente del cliente. Una API key de Anthropic expuesta permite a cualquier usuario del producto hacer requests ilimitados a la API de Claude en la cuenta de Alpha. | 🔴 Crítico |
| 2 | `src/lib/supabase.ts` | 29 | `createClient<any>` desactiva toda inferencia de tipos de la base de datos. Errores de columnas inexistentes, tipos incorrectos en queries y divergencias entre BD y frontend no se detectan en compile time — llegan a producción silenciosamente. | 🔴 Crítico |
| 3 | `src/types/domain.types.ts` | 7-13 | `UserRole` define 5 roles originales (consultor_alpha, pm_cliente, viewer_csuite, admin_alpha, superadmin). La BD en producción tiene 4 roles diferentes (superadmin, consultant, client_editor, client_viewer) desde migration 008. Cualquier comparación `user.role === 'consultor_alpha'` es siempre `false` en producción. | 🔴 Crítico |
| 4 | `.env.example` | header | El comentario de cabecera dice `# GOBY — Variables de entorno`. Branding incorrecto en un fichero que los developers leen constantemente. | 🔴 Branding |
| 5 | `T4View.tsx` | 1 | 2.329 líneas de un fichero con 7+ sub-componentes incrustados (StatusBadge, CategoryBadge, ExecDashboard, QuarterlyRoadmap, PriorityMatrix, T4ScoreBars…). Viola Single Responsibility, imposible de testear unitariamente, ningún módulo T5-T12 puede reutilizar estos componentes. | 🔴 Crítico |

---

## Sugerencias

| # | Fichero | Área | Sugerencia | Categoría |
|---|---------|------|------------|-----------|
| 1 | `supabase.ts` | L29 | Reemplazar `createClient<any>` por `createClient<Database>` importando el tipo de `@/types/database.types`. Esto activa inferencia completa y detectará el issue #3 automáticamente en compile time. | Type Safety |
| 2 | `.env.example` | — | Eliminar `VITE_CLAUDE_API_KEY`. Si el producto necesita LLM, las llamadas deben ir a través de una Edge Function de Supabase que guarda la key en `SUPABASE_CLAUDE_API_KEY` (variable de servidor, nunca expuesta al cliente). | Security |
| 3 | `domain.types.ts` | L7-13 | Actualizar `UserRole` para alinear con migration 008: `'superadmin' \| 'consultant' \| 'client_editor' \| 'client_viewer'`. Añadir `ROLE_DISPLAY` map para preservar nombres semánticos en UI. | Type Safety |
| 4 | `T4View.tsx` | — | Extraer los 7 sub-componentes a `src/shared/design-system/components/`. T4View debería importarlos, no definirlos. Objetivo: reducir T4View a ~400 líneas que solo orquesten la lógica de la vista. | Maintainability |
| 5 | `T4View.tsx` | import | `import { RecommendationPanel } from '@/components/RecommendationPanel'` — importa desde `src/components/`, no desde `src/shared/components/`. Mover el componente y actualizar el import. | Structure |
| 6 | `src/lib/supabase.ts` | comment | El comentario dice "Sprint 3: cliente sin genérico Database" y "Sprint 5: generar tipos via CLI". Estamos en Sprint 6+ con 12 módulos implementados — este comentario es deuda documental activa que puede confundir. | Documentation |
| 7 | `.env.example` | `AI_CATEGORY_HEX` | En T4View/constants.ts existe un objeto `AI_CATEGORY_HEX` con colores hex hardcodeados por categoría IA. Estos deberían ser tokens del DS o al menos referenciados desde un sistema centralizado. | Design System |

---

## Lo que funciona bien

- **Patrón de store en T1-T4** — try/catch contextualizado con prefijo `[T1Store]`, debounce de 800ms en setScore, separación limpia service/store/view.
- **Validación de env vars al arranque** — el check `if (!supabaseUrl || !supabaseAnonKey)` en supabase.ts falla rápido y con mensaje claro, evitando errores crípticos en runtime.
- **Comentario de arquitectura en supabase.ts** — la instrucción `NUNCA importar @supabase/supabase-js directamente en componentes` como doctrina arquitectónica documentada inline es una buena práctica que otros ficheros deberían replicar.
- **TypeScript strict mode** — el hecho de que el proyecto use strict mode hace que las violaciones de tipo sean más visibles cuando sí está tipado.
- **Separación de tipos** — tener `database.types.ts` para tipos de Supabase y `domain.types.ts` para tipos de negocio es la arquitectura correcta. El problema es la desincronización, no el patrón.
- **Path aliases** — `@/` en todos los imports evita los `../../..` relativos que son frágiles en refactors.

---

## Veredicto: Request Changes

Los issues #1, #2 y #3 son bloqueantes para un producto enterprise:
- El #1 (VITE_CLAUDE_API_KEY) es un riesgo de seguridad activo que puede generar costes inesperados en producción.
- El #2 (createClient\<any\>) silencia el compilador en el punto donde más necesitas que hable.
- El #3 (UserRole divergente) produce bugs silenciosos en las comparaciones de rol que afectan al control de acceso de la interfaz.

Los tres son correcciones de 2-4 horas cada uno. No hay justificación para no hacerlas en el próximo sprint.

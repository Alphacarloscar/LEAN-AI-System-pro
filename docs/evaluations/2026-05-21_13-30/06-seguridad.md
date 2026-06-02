# Área 06 — Seguridad   🟡

**Puntuación:** 6/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

La base de seguridad es correcta: no hay secrets hardcodeados, `.env.local` está en `.gitignore`, `import.meta.env` se usa apropiadamente, RLS activado en todas las tablas. El riesgo más significativo es que `VITE_CLAUDE_API_KEY` está diseñada para exponerse en el frontend — cualquier key de Anthropic que se meta ahí será visible para cualquier usuario de la app. El segundo riesgo es el paquete `@supabase/auth-helpers-react` que está deprecado y no recibe parches de seguridad.

## Hallazgos

### 🔴 Críticos

- **VITE_CLAUDE_API_KEY en frontend**: `.env.example` define `VITE_CLAUDE_API_KEY=sk-ant-...` para "Sprint 6 — recomendaciones LLM". Las variables `VITE_*` se incrustan en el bundle de Vite y son visibles en el código fuente del cliente. Cualquier usuario que abra DevTools verá la API key de Anthropic. Esta arquitectura no es viable para producción — las llamadas a Claude deben ir a través de la Edge Function de Supabase o un proxy backend.

### 🟡 Mejorables

- **`@supabase/auth-helpers-react` deprecado**: Este paquete (v0.5.0) fue marcado como deprecated por Supabase en favor de `@supabase/ssr`. No recibe updates de seguridad. La migración es necesaria antes de añadir flows de auth más complejos.

- **`createClient<any>` en supabase.ts**: Sin tipado de Database en el cliente, las queries no tienen validación de shape de respuesta. Un cambio de schema que rompa el shape esperado fallará silenciosamente en runtime en lugar de en compilación.

- **Edge Function `ai-recommend` sin análisis**: No se pudo analizar el contenido de `supabase/functions/ai-recommend/` en detalle. Si esta función accede a la API de Claude, debe verificarse que las keys están en las variables de entorno de Supabase (no en el frontend) y que hay validación de autenticación antes de cada invocación.

- **Validación de entrada en Edge Functions**: No se observa un esquema de validación (Zod u otro) en los payloads que reciben las Edge Functions.

### 🟢 Correctos

- `.env.local` en `.gitignore` ✅
- No hay secrets hardcodeados en `src/` ✅
- `import.meta.env` usado correctamente en los 3 puntos de acceso ✅
- Validación de variables en startup: si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` están vacías, la app lanza error descriptivo en lugar de fallar silenciosamente ✅
- RLS activado en todas las tablas de las migraciones ✅
- 4 roles claramente diferenciados con CHECK constraints en BD ✅

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| Secrets hardcodeados en src/ | 0 | ✅ Objetivo 0 |
| .env.local en .gitignore | ✅ Sí | Requerido |
| API key Anthropic en frontend | 🔴 Diseñada así | Inaceptable en prod |
| Auth helper deprecado | 🟡 @auth-helpers-react | Migrar a @ssr |
| RLS en todas las tablas | ✅ Sí | Requerido |
| Cliente Supabase tipado | ❌ `<any>` | Requerido |

## Recomendaciones priorizadas

### Prioridad 1 — Mover llamadas a Claude a la Edge Function (jamás VITE_CLAUDE_API_KEY)

**Qué:** Eliminar `VITE_CLAUDE_API_KEY` de `.env.example` y de cualquier código frontend. Las llamadas a Claude deben ir a `supabase/functions/ai-recommend/` con la API key en las secrets de Supabase (Supabase Dashboard → Edge Functions → Secrets).

**Por qué:** Exponer una API key de Anthropic en el frontend permite a cualquier usuario usarla para llamadas externas a la API. Coste ilimitado y posible suspensión de cuenta.

**Cómo:**
```ts
// En el frontend (correcto):
const { data } = await supabase.functions.invoke('ai-recommend', { body: { engagementId } })

// En la Edge Function (ai-recommend/index.ts):
const claudeKey = Deno.env.get('ANTHROPIC_API_KEY') // secret en Supabase, nunca en frontend
```

**Plan Maestro:** Sin PR asignado — bloquea Sprint 6.

### Prioridad 2 — Migrar de @supabase/auth-helpers-react a @supabase/ssr

**Qué:**
```bash
npm uninstall @supabase/auth-helpers-react
npm install @supabase/ssr
```
Y actualizar `src/modules/Auth/store.ts` y cualquier punto que use las helpers.

**Por qué:** El paquete deprecated no recibirá parches de seguridad. La migración es sencilla y documentada por Supabase.

**Plan Maestro:** Sin PR asignado.

### Prioridad 3 — Añadir análisis de ai-recommend Edge Function

**Qué:** Revisar `supabase/functions/ai-recommend/` para confirmar: (a) auth check antes de procesar, (b) API key en Deno.env (no hardcoded), (c) validación de payload.

**Plan Maestro:** Sin PR asignado.

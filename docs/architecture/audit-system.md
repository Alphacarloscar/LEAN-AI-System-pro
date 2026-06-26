# Sistema de Auditoría — Única Fuente de Verdad

**Versión:** 1.1.0 | **Actualizado:** 2026-06-16
**Decisiones relacionadas:** ADR-017 (Proxy pattern) · ADR-018 (Retención pg_cron) · ADR-019 (SECURITY DEFINER)

---

## PARTE I — DOCUMENTACIÓN FUNCIONAL

### 1. Objetivo del sistema

El sistema de auditoría de GOBY registra automáticamente toda acción con efecto sobre los datos del negocio. Resuelve tres necesidades concretas:

**Cumplimiento legal:** cualquier empresa B2B que gestiona datos de clientes en proyectos de consultoría debe poder responder, en caso de auditoría, a las preguntas: *¿quién modificó este registro? ¿cuándo? ¿qué datos se enviaron?* El log proporciona esa trazabilidad sin depender de la memoria del equipo ni de reconstrucciones forenses en git.

**Seguridad operacional:** el sistema detecta comportamientos anómalos sin necesidad de un SIEM externo. Una secuencia inusual de errores de un mismo `user_id`, un pico de llamadas a servicios de archivo, o un `user_role = 'client_viewer'` invocando métodos de escritura son señales visibles directamente en `audit_logs`.

**Control de costes de IA:** cada llamada a la API de Anthropic consume tokens facturados por uso. Sin captura explícita, el gasto en IA es una caja negra. El sistema registra `input_tokens`, `output_tokens`, `total_tokens` y el modelo exacto que respondió en cada invocación, permitiendo calcular el coste real por usuario, proyecto, herramienta o modelo en cualquier ventana temporal mediante SQL directo.

---

### 2. Alcance del rastreo

#### Qué se registra actualmente

| Capa | Servicio / módulo | Etiqueta en `service_name` |
|------|-------------------|---------------------------|
| Servicios de datos | `projects.service.ts` | `services.projects` |
| Servicios de datos | `companies.service.ts` | `services.companies` |
| Servicios de datos | `auth.service.ts` | `services.auth` |
| Servicios de datos | `department.service.ts` | `services.department` |
| Servicios de datos | `company-profile.service.ts` | `services.company-profile` |
| Servicios de datos | `t1.service.ts` – `t8.service.ts` | `services.t1` – `services.t8` |
| Edge Function de IA | `supabase/functions/ai-recommend` | `edge.ai-recommend` |

Todos los servicios siguen el patrón `_impl` + `makeAuditable`. Los métodos síncronos, getters y constantes pasan sin instrumentar — el Proxy solo intercepta las funciones que devuelven una `Promise`.

#### Qué se ignora intencionadamente

- **Consultas de solo lectura no críticas:** `listMyProjects`, `getProjectCompanyId` sí se auditan, pero si en el futuro se decide excluir lecturas de alto volumen para reducir el tamaño de la tabla, se puede envolver el servicio con un segundo objeto que filtre por nombre de método antes de llamar a `makeAuditable`.
- **Campos sensibles en los argumentos:** `password`, `token`, `secret`, `apiKey`, `authorization`, `access_token`, `refresh_token` y `service_role_key` se redactan automáticamente con el valor `"[REDACTED]"` antes de persistir. La redacción es recursiva (funciona en objetos anidados).
- **Respuestas muy grandes:** el campo `response_payload` se trunca a 4.000 caracteres. Si la respuesta supera ese límite, se almacena `{ "_truncated": true, "_preview": "..." }` en su lugar.
- **Logs del sistema de auditoría en sí:** `fireAuditLog` tiene su propio `try/catch` interno y nunca llama a `fireAuditLog` de vuelta, evitando recursión.

---

### 3. Gobierno de la IA

Cada vez que un usuario invoca la herramienta de recomendaciones de IA (`ai-recommend`), la Edge Function captura la respuesta nativa de la API de Anthropic antes de cualquier procesamiento posterior. El campo `usage` de la respuesta incluye:

| Campo Anthropic | Campo en `metadata` de `audit_logs` | Descripción |
|-----------------|-------------------------------------|-------------|
| `model` | `model_responded` | Modelo exacto que respondió (puede diferir del solicitado si Anthropic redirige) |
| `usage.input_tokens` | `input_tokens` | Tokens del prompt (contexto + instrucciones + datos) |
| `usage.output_tokens` | `output_tokens` | Tokens de la respuesta generada |
| `input_tokens + output_tokens` | `total_tokens` | Total facturable |
| `usage.cache_creation_input_tokens` | `cache_write_tokens` | Tokens escritos en caché de prompt (0 si no aplica) |
| `usage.cache_read_input_tokens` | `cache_read_tokens` | Tokens leídos de caché (ahorro de coste) |
| — | `provider` | Siempre `"anthropic"` para futuras comparativas multi-proveedor |
| — | `model_requested` | El modelo que se solicitó en la llamada |

El log se dispara **inmediatamente después** de que `callClaude` devuelve respuesta, antes del parseo del JSON de negocio. Esto garantiza que incluso si la respuesta de Claude es JSON malformado (y la función retorna error 502), los tokens consumidos quedan registrados. Si `callClaude` lanza una excepción de red, el log se dispara igualmente con `status: 'error'` y `input_tokens: null`.

**Query de coste mensual por herramienta:**
```sql
SELECT
  metadata->>'tool_code'                        AS herramienta,
  SUM((metadata->>'total_tokens')::integer)     AS tokens_total,
  COUNT(*)                                      AS llamadas,
  AVG((metadata->>'total_tokens')::integer)     AS tokens_promedio
FROM audit_logs
WHERE service_name = 'edge.ai-recommend'
  AND status = 'success'
  AND created_at >= date_trunc('month', now())
GROUP BY 1
ORDER BY 2 DESC;
```

---

### 4. Política de retención

| Tabla | Ventana | Contenido | Acceso |
|-------|---------|-----------|--------|
| `audit_logs` | 90 días activos | Payload completo (args, response, error_stack) | Superadmin + usuario propio |
| `audit_logs_archive` | 5 años | Compactado (sin payloads) + métricas IA en columnas tipadas | Solo superadmin |

**Los 90 días activos** cubren el 100% de las necesidades operacionales: depuración de incidencias, revisión de uso, detección de comportamientos anómalos. Ningún caso de soporte normal requiere datos más antiguos.

**El archivo de 5 años** cumple los requisitos legales mínimos para contratos B2B en España/UE. Almacena solo las señales de negocio — quién, qué, resultado, duración, error — sin los payloads de datos que representan el grueso del volumen de almacenamiento.

**El horario de purga (02:00–03:00 UTC, carga mínima)** corresponde a las 04:00–05:00 CET, la franja de menor actividad de los usuarios. La purga activa se ejecuta primero (02:00), la purga del archivo el día 1 de cada mes (03:00), sin solapamiento.

---

## PARTE II — DOCUMENTACIÓN TÉCNICA

### 5. Patrón de diseño: Proxy de JavaScript

El sistema instrumenta los servicios sin modificar su código de negocio. El mecanismo es el [objeto `Proxy` de JavaScript](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Proxy), que intercepta cada acceso a una propiedad del objeto de servicio.

```
┌─────────────────────────────────────────────────────┐
│  Vista / Store                                      │
│    await createProject({ name: 'Nexus' })           │
└──────────────────┬──────────────────────────────────┘
                   │ llama a la función exportada
┌──────────────────▼──────────────────────────────────┐
│  makeAuditable — Proxy (transparente al caller)     │
│  1. Registra startedAt = performance.now()          │
│  2. await método_original(...args)   ──────────────►│ Supabase DB
│  3a. (éxito) fireAuditLog({ status: 'success' })   │
│  3b. (error) fireAuditLog({ status: 'error' })     │
│              throw error  ← re-lanza SIEMPRE        │
│  4. return response                                 │
└─────────────────────────────────────────────────────┘
                   │ fire-and-forget (no bloquea)
┌──────────────────▼──────────────────────────────────┐
│  fireAuditLog → supabase.functions.invoke(          │
│    'log-audit-event', { body: entry }               │
│  )   IIFE async con try/catch propio                │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP POST con JWT del usuario
┌──────────────────▼──────────────────────────────────┐
│  Edge Function: log-audit-event                     │
│  1. Verifica JWT → extrae user_id, email, role      │
│  2. Valida body mínimo (service_name, method_name)  │
│  3. INSERT en audit_logs con service_role           │
│     (bypass RLS — user_id añadido server-side)      │
└─────────────────────────────────────────────────────┘
```

#### Por qué TypeScript no pierde el tipo

La firma de `makeAuditable` es:

```typescript
function makeAuditable<T extends Record<string, unknown>>(
  service: T,
  serviceName: string,
  defaultMetadata?: Partial<AuditAIMetadata>,
): T
```

El tipo de retorno es exactamente `T` — no un `Record<string, unknown>` genérico. El compilador infiere `T = typeof _impl` y devuelve ese tipo exacto. El autocompletado del IDE sobre las exportaciones del servicio es idéntico al que existía antes de envolver el objeto.

#### Por qué se usa el patrón `_impl` + destructuring

TypeScript no permite declarar `export async function foo()` y luego `export const { foo } = makeAuditable(...)` en el mismo módulo (error TS2300: identificador duplicado). La solución es convertir todas las funciones en métodos de un objeto literal privado `const _impl = { ... }` y exportar desde el objeto envuelto:

```typescript
// Privado — implementaciones sin cambio
const _impl = { async createProject(...) {...}, async archiveProject(...) {...} }

// Punto de exportación auditado
const _service = makeAuditable(_impl, 'services.projects')

// Exports públicos — nombres idénticos a los de la versión anterior
export const { createProject, archiveProject, ... } = _service
```

#### Contexto de usuario: Edge Function server-side

El contexto de usuario (`user_id`, `user_email`, `user_role`) **no se extrae en el cliente**. El Proxy solo envía los datos del evento (servicio, método, args, resultado). La Edge Function `log-audit-event` verifica el JWT en cada request y extrae los datos de identidad server-side consultando `auth.users` y `profiles`. Esto garantiza que el cliente no puede falsificar su identidad.

`context.ts` existe en el módulo pero está actualmente vacío — el patrón de singleton de contexto client-side quedó obsoleto con la introducción de la Edge Function como receptor. Ver DEBT-021 para el plan de limpieza.

---

### 6. Modelo de datos polimórfico

#### Esquema de `audit_logs`

```sql
CREATE TABLE public.audit_logs (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz  NOT NULL DEFAULT now(),

  -- Quién
  user_id          uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email       text,
  user_role        text,        -- 'superadmin' | 'consultant' | 'client_editor' | 'client_viewer'

  -- Qué
  service_name     text         NOT NULL,  -- ej: 'services.projects', 'edge.ai-recommend'
  method_name      text         NOT NULL,  -- ej: 'createProject', 'generate_recommendations'

  -- Entrada (campos sensibles redactados)
  args_payload     jsonb        NOT NULL DEFAULT '{}',

  -- Salida
  status           text         NOT NULL CHECK (status IN ('success', 'error')),
  response_payload jsonb,       -- truncado a 4.000 chars si supera el límite
  error_message    text,
  error_stack      text,        -- solo en registros activos; no se archiva

  -- Rendimiento
  duration_ms      integer      NOT NULL DEFAULT 0,

  -- Contexto del recurso afectado
  resource_id      text,        -- UUID del primer argumento si aplica

  -- Metadatos extensibles (ver estructura por tipo de evento abajo)
  metadata         jsonb        NOT NULL DEFAULT '{}'
);
```

#### Estructura del campo `metadata` por tipo de evento

**Llamada a servicio de datos (éxito o error):**
```json
{}
```
El campo `metadata` está vacío para servicios de datos en su implementación actual. Se puede enriquecer pasando `defaultMetadata` como tercer argumento a `makeAuditable`.

**Llamada a la Edge Function de IA (éxito):**
```json
{
  "provider":           "anthropic",
  "model_requested":    "claude-haiku-4-5-20251001",
  "model_responded":    "claude-haiku-4-5-20251001",
  "input_tokens":       847,
  "output_tokens":      312,
  "total_tokens":       1159,
  "cache_write_tokens": 0,
  "cache_read_tokens":  0,
  "stop_reason":        "end_turn",
  "function_version":   "ai-recommend-2026-06-04-v2"
}
```

**Llamada a la Edge Function de IA (error — API de Anthropic inalcanzable):**
```json
{
  "provider":           "anthropic",
  "model_requested":    "claude-haiku-4-5-20251001",
  "model_responded":    null,
  "input_tokens":       null,
  "output_tokens":      null,
  "total_tokens":       null,
  "cache_write_tokens": null,
  "cache_read_tokens":  null,
  "stop_reason":        null,
  "function_version":   "ai-recommend-2026-06-04-v2"
}
```

Los campos `null` distinguen explícitamente un fallo de red (no hubo consumo) de un consumo de cero tokens.

---

### 7. Capa de seguridad — Inmutabilidad y RLS

#### Principio Append-Only

La tabla `audit_logs` no tiene políticas de `UPDATE` ni de `DELETE` para ningún rol de aplicación. Los registros son inmutables desde el momento de su inserción. La única forma legítima de eliminar filas es a través de la función `purge_old_audit_logs()` (declarada `SECURITY DEFINER`), que opera exclusivamente en filas con más de 90 días.

#### Políticas RLS implementadas

**`audit_logs`:**

| Operación | Política | Condición |
|-----------|----------|-----------|
| `INSERT` | `audit_logs_insert_own` | `user_id = auth.uid() OR user_id IS NULL` |
| `SELECT` | `audit_logs_select_own` | `user_id = auth.uid()` (cada usuario solo ve sus filas) |
| `SELECT` (superadmin) | — | Solo vía `get_audit_logs()` SECURITY DEFINER (ADR-019) |
| `UPDATE` | — | Denegado (sin política) |
| `DELETE` | — | Denegado (sin política; solo `purge_old_audit_logs()` SECURITY DEFINER) |

La Edge Function `log-audit-event` inserta usando `service_role`, que bypasea RLS. Por eso puede insertar con `user_id` real del JWT sin necesitar una política de INSERT adicional. El superadmin **no tiene política SELECT directa** — el único canal de acceso es `get_audit_logs()`, que registra la consulta en `audit_access_logs` de forma atómica e inmutable antes de retornar datos (ADR-019).

**`audit_logs_archive`:**

| Operación | Política | Condición |
|-----------|----------|-----------|
| `INSERT` | — | Solo vía función `SECURITY DEFINER` |
| `SELECT` | `audit_archive_select_superadmin` | `profiles.role = 'superadmin'` |
| `UPDATE` | — | Denegado |
| `DELETE` | — | Denegado (solo `purge_old_audit_archive()`) |

---

### 8. Automatización de infraestructura (pg_cron)

#### Requisito previo

pg_cron debe estar habilitado antes de ejecutar la migración de retención:
> Supabase Dashboard → Database → Extensions → `pg_cron` → Enable

#### Jobs registrados

| Nombre del job | Schedule (cron) | UTC | CET | Función invocada |
|----------------|-----------------|-----|-----|------------------|
| `purge-audit-logs-90d` | `0 2 * * *` | 02:00 diario | 04:00 CET | `purge_old_audit_logs()` |
| `purge-audit-archive-5y` | `0 3 1 * *` | 03:00 el día 1/mes | 05:00 CET día 1 | `purge_old_audit_archive()` |

#### Lógica interna de `purge_old_audit_logs`

```
cutoff = now() - 90 días

CTE rows_to_purge:
  SELECT id FROM audit_logs WHERE created_at < cutoff LIMIT 5000

CTE archived:
  INSERT INTO audit_logs_archive (fields compactos sin payloads)
  SELECT ... FROM audit_logs WHERE id IN rows_to_purge
  ON CONFLICT (original_id) DO NOTHING  ← idempotente
  RETURNING original_id

DELETE FROM audit_logs WHERE id IN (SELECT original_id FROM archived)
```

El `DELETE` solo elimina exactamente lo que se archivó con éxito. Si el `INSERT` falla parcialmente (conflicto de unicidad en `original_id`), esas filas NO se eliminan. El batch de 5.000 filas por ejecución limita la duración del lock — si el backlog supera ese número, el cron diario lo evacuará en ejecuciones sucesivas.

`purge_old_audit_archive` es una operación simple sin batch: ejecuta `DELETE FROM audit_logs_archive WHERE created_at < now() - 5 years`. El volumen mensual de registros con más de 5 años es despreciable comparado con el diario.

---

### 9. Guía de mantenimiento

#### Verificar que los jobs están activos

```sql
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname IN ('purge-audit-logs-90d', 'purge-audit-archive-5y');
```

#### Revisar el historial de las últimas 30 ejecuciones

```sql
SELECT
  j.jobname,
  d.start_time,
  d.end_time,
  d.status,
  d.return_message
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
WHERE j.jobname IN ('purge-audit-logs-90d', 'purge-audit-archive-5y')
ORDER BY d.start_time DESC
LIMIT 30;
```

El campo `return_message` contiene el jsonb que devuelve la función:
`{"cutoff": "...", "archived": 1842, "deleted": 1842, "batch_size": 5000, "duration_ms": 234, "ran_at": "..."}`.

#### Ejecutar la purga manualmente (si pg_cron no está disponible)

```sql
SELECT public.purge_old_audit_logs();
-- Con parámetros personalizados:
SELECT public.purge_old_audit_logs(p_cutoff_days := 90, p_batch_size := 10000);
```

#### Verificar el estado actual de las tablas

```sql
-- Filas activas y rango de fechas
SELECT
  COUNT(*)                        AS total_logs,
  MIN(created_at)::date           AS log_mas_antiguo,
  MAX(created_at)::date           AS log_mas_reciente,
  COUNT(*) FILTER (WHERE status = 'error')  AS total_errores
FROM public.audit_logs;

-- Filas en archivo
SELECT
  COUNT(*)                        AS total_archivados,
  MIN(created_at)::date           AS archivo_mas_antiguo,
  MAX(created_at)::date           AS archivo_mas_reciente
FROM public.audit_logs_archive;
```

#### Reagendar un job (cambiar horario)

```sql
-- 1. Eliminar el job existente
SELECT cron.unschedule('purge-audit-logs-90d');

-- 2. Crear con el nuevo horario (ej: 01:30 UTC)
SELECT cron.schedule(
  'purge-audit-logs-90d',
  '30 1 * * *',
  $$ SELECT public.purge_old_audit_logs() $$
);
```

---

### 10. Archivos del sistema

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/lib/audit/types.ts` | Contratos TypeScript: `AuditLogInsert`, `AuditAIMetadata`, `AuditUserContext` |
| `src/lib/audit/context.ts` | Reservado — actualmente vacío (ver DEBT-021) |
| `src/lib/audit/auditClient.ts` | Escritor fire-and-forget: invoca Edge Function `log-audit-event` |
| `src/lib/audit/makeAuditable.ts` | Proxy factory con redacción, truncado y extracción de `resource_id` |
| `src/lib/audit/index.ts` | Barrel export del módulo |
| `src/services/projects.service.ts` | Envuelto con `makeAuditable('services.projects')` |
| `src/services/companies.service.ts` | Envuelto con `makeAuditable('services.companies')` |
| `src/services/auth.service.ts` | Envuelto con `makeAuditable('services.auth')` |
| `src/services/t1.service.ts` – `t8.service.ts` | Envueltos con `makeAuditable('services.tN')` |
| `src/services/auditLogs.service.ts` | Acceso privilegiado: `queryAuditLogs` vía RPC `get_audit_logs` (ADR-019) |
| `supabase/functions/log-audit-event/index.ts` | Edge Function receptora: verifica JWT, enriquece con contexto de usuario, inserta en `audit_logs` |
| `supabase/functions/ai-recommend/index.ts` | Edge Function de IA: captura tokens Anthropic en `metadata` |
| `supabase/migrations/20260615_003_audit_system.sql` | Migración consolidada: tablas + índices + RLS + funciones de purga + jobs pg_cron + `get_audit_logs` |
| `supabase/migrations/20260616_004_audit_schema_drift.sql` | Drift fix: añade columnas faltantes (`correlation_id`, `user_email_hash`, campos IA) a tablas preexistentes |
| `supabase/functions/_shared/audit-types.ts` | Tipos compartidos entre Edge Functions: `AIAuditEntry`, `AIAuditMetadata` |

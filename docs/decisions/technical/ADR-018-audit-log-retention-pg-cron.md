# ADR-018 — Política de retención de audit_logs mediante pg_cron

**Estado:** ACCEPTED
**Fecha:** 2026-06-15
**Área:** Infraestructura / Base de datos
**Autor:** Carlos Sánchez – Alpha Consulting
**Relacionado:** ADR-017 (Proxy pattern), ADR-002 (Supabase como backend único)

---

## Contexto

El sistema de audit logging (ADR-017) escribe un registro en `audit_logs` en cada llamada a los servicios de la aplicación y en cada invocación de la Edge Function de IA. Sin una política de retención, la tabla crecería indefinidamente y sus costes de almacenamiento y latencia de consulta escalarían sin control.

Dos restricciones dan forma a la solución:

1. **Rendimiento operacional:** solo los logs de los últimos 90 días son consultados con regularidad por el equipo (dashboards, depuración, revisión de uso).
2. **Cumplimiento legal:** los registros deben mantenerse durante 5 años completos para poder responder a auditorías externas, aunque no se consulten con frecuencia.

La solución debe ejecutarse **de forma completamente autónoma, sin intervención manual**, dentro del mismo ecosistema del proyecto (Supabase/PostgreSQL) y sin añadir dependencias de infraestructura externa.

---

## Decisión

**pg_cron** — la extensión nativa de PostgreSQL disponible en Supabase — orquesta dos jobs automáticos:

| Job | Schedule (cron) | Ejecución UTC | Acción |
|-----|-----------------|---------------|--------|
| `purge-audit-logs-90d`  | `0 2 * * *`   | Diaria 02:00  | Archiva y elimina filas > 90 días de `audit_logs` |
| `purge-audit-archive-5y` | `0 3 1 * *`  | Día 1/mes 03:00 | Elimina definitivamente filas > 5 años de `audit_logs_archive` |

### Arquitectura de dos tablas

```
audit_logs                       audit_logs_archive
──────────────────────           ──────────────────────────────────────────
Ventana: 90 días                 Retención: 5 años
Payload completo                 Compactado — sin args_payload,
(args, response, error_stack)    response_payload ni error_stack
Optimizado para queries          Columnas AI tipadas para SQL directo
operacionales frecuentes         (ai_provider, ai_model, ai_total_tokens)
```

La transición entre tablas es atómica: una CTE encadenada ejecuta el `INSERT` en el archivo y el `DELETE` de la tabla activa en la misma transacción. Si el archivo falla, la fila permanece en `audit_logs`. Si ya fue archivada previamente, `ON CONFLICT DO NOTHING` garantiza idempotencia.

### Ventana horaria (02:00 UTC = 04:00 CET)

La franja de baja carga para España peninsular es entre las 01:00 y las 05:00 UTC. El job de purga activa se ejecuta a las 02:00 UTC y el de archivo a las 03:00 UTC el día 1 de cada mes, evitando solapamiento.

---

## Alternativas descartadas

### Edge Function con scheduled trigger (Supabase Cron)
- **Problema:** requiere un salto de red (HTTP) para ejecutar código que solo necesita SQL. Latencia añadida, punto de fallo adicional, credenciales de invocación.
- **Descartado:** cuando la lógica es 100% SQL, ejecutar dentro del motor de BD es estrictamente superior.

### GitHub Actions scheduled workflow
- **Problema:** viola ADR-005 (sin CLI, sin dependencias de CI para operaciones de mantenimiento). La purga de logs no es una operación de build/deploy.
- **Descartado:** infraestructura fuera del ecosistema del proyecto.

### Borrado diferido por TTL (particionamiento por fecha)
- **Problema:** PostgreSQL no tiene TTL nativo en tablas convencionales. El particionamiento requeriría migrar el esquema y cambiar todas las consultas a tablas heredadas.
- **Descartado:** complejidad desproporcionada para el volumen previsto.

---

## Consecuencias

### Positivas
- **Cero infraestructura adicional:** pg_cron corre dentro del mismo proceso de PostgreSQL. No hay workers externos, no hay cronjobs de SO, no hay GitHub Actions.
- **Atomicidad garantizada:** el par INSERT+DELETE es transaccional. No hay ventana de inconsistencia.
- **Observable:** `cron.job_run_details` registra cada ejecución con status y `return_message` (el jsonb que devuelven las funciones con `cutoff`, `archived`, `deleted`, `duration_ms`).
- **Coste controlado:** Supabase cobra por almacenamiento activo. Limitar `audit_logs` a 90 días evita que el sistema de logging duplique el coste de almacenamiento de las tablas de negocio.

### Restricciones operacionales
- pg_cron debe estar habilitado **manualmente** en Supabase Dashboard → Database → Extensions → pg_cron antes de ejecutar la migración consolidada `20260615_003_audit_system.sql`.
- Si pg_cron no está disponible (plan Free de Supabase), la alternativa inmediata es ejecutar `SELECT public.purge_old_audit_logs()` manualmente desde el SQL Editor una vez al mes.
- El `batch_size` por defecto es 5.000 filas por ejecución. Si el volumen diario supera esa cifra, el job tardará más de un día en evacuar el backlog inicial. Ajustar `p_batch_size` según métricas reales.

---

## Archivos implicados

| Archivo | Rol |
|---------|-----|
| `supabase/migrations/20260615_003_audit_system.sql` | Migración consolidada: tablas + RLS + funciones `purge_old_audit_logs` + `purge_old_audit_archive` + `hmac_email_hash` + jobs pg_cron |
| `supabase/migrations/20260616_004_audit_schema_drift.sql` | Drift fix: columnas faltantes en tablas preexistentes |
| `src/lib/audit/auditClient.ts` | Escritor fire-and-forget → invoca Edge Function `log-audit-event` |
| `supabase/functions/ai-recommend/index.ts` | Inserta métricas AI en `audit_logs` via `supabaseAdmin` |
| `docs/architecture/audit-system.md` | Documentación funcional y técnica completa del sistema |

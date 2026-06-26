# ADR-019: Acceso a audit_logs exclusivamente vía función SECURITY DEFINER

**Status:** ACCEPTED
**Date:** 2026-06-15
**Proposed by:** Carlos Sánchez - Alpha Consulting
**Approved by:** Carlos Sánchez - Alpha Consulting — 2026-06-15
**Supersedes:** —
**Superseded by:** —

---

## Context

El sistema de meta-auditoría implementado en ADR-017 y consolidado en la migración
`20260615_003_audit_system.sql` tenía una vulnerabilidad estructural en su diseño inicial:

- La política RLS `audit_logs_select_own_or_superadmin` concedía al superadmin
  acceso SELECT irrestricto sobre la tabla `public.audit_logs`.
- La función `emitMetaAuditLog()` en `auditLogs.service.ts` registraba el acceso
  en `audit_access_logs` **desde TypeScript**, antes de ejecutar la query.
- Un superadmin con acceso al SQL Editor de Supabase o al endpoint PostgREST podía
  hacer `SELECT * FROM audit_logs` directamente, usando su token JWT o una sesión
  `postgres` — **sin pasar por la capa TypeScript** y, por tanto, sin generar
  ninguna traza en `audit_access_logs`.

La meta-auditoría era, en la práctica, una promesa voluntaria de la aplicación:
correcta cuando el acceso venía del frontend, inexistente cuando el superadmin
esquivaba el frontend.

---

## Decision

Mover la responsabilidad de la traza de acceso a la **capa de base de datos**,
haciéndola un invariante del motor, no de la aplicación:

1. **Eliminar** la política RLS `audit_logs_select_own_or_superadmin`.  
   Nueva política `audit_logs_select_own`: los usuarios autenticados ven **solo
   sus propias filas**. El superadmin no tiene política directa.

2. **Crear** la función `public.get_audit_logs(filters jsonb)` con directiva
   `SECURITY DEFINER` como único canal de acceso superadmin:
   - Verifica server-side que el llamante es `superadmin` (vía `profiles.role`).
   - Inserta en `audit_access_logs` de forma **obligatoria e inmutable** antes
     de ejecutar el `SELECT`. Sin `EXCEPTION` handler alrededor del `INSERT`:
     si falla la traza, falla toda la consulta.
   - Retorna `SETOF public.audit_logs` con los filtros aplicados.

3. **Añadir** la restricción `CHECK (resource_id IS NULL OR length(resource_id) <= 256)`
   en `audit_logs` y `audit_logs_archive` para proteger el almacenamiento contra
   payloads de basura deliberados.

4. **Actualizar** `auditLogs.service.ts` para sustituir el acceso directo
   `.from('audit_logs').select()` + `emitMetaAuditLog()` por una única llamada
   `.rpc('get_audit_logs', { filters })`. La función `emitMetaAuditLog` es
   eliminada: la traza ya no depende de que el servicio TypeScript la emita.

---

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **get_audit_logs() SECURITY DEFINER** *(elegida)* | Traza obligatoria a nivel DB; imposible esquivar sin acceso postgres superusuario | Añade un salto de función PL/pgSQL en cada consulta | — (elegida) |
| Mantener RLS + emitMetaAuditLog() en TS | Sin cambios de esquema | Traza fácilmente esquivable desde SQL Editor o PostgREST directo | Rechazada: no cierra la vulnerabilidad |
| Trigger AFTER SELECT en audit_logs | Traza automática sin función | PostgreSQL no soporta triggers en SELECT | Rechazada: no existe en PostgreSQL |
| Revocar SELECT a `authenticated` en audit_logs y usar solo service_role | Imposible desde JWT de usuario | Rompería la capacidad de que usuarios vean sus propios logs | Rechazada: demasiado restrictiva |
| pg_audit extension | Traza a nivel de sistema, no esquivable | Solo disponible en Supabase Enterprise; no en plan Pro | Rechazada: fuera del plan actual |

---

## Consequences

### Positive
- La traza de acceso es un invariante del motor de base de datos, no de la
  aplicación. No puede ser omitida desde el SQL Editor, PostgREST, o cualquier
  cliente que use el JWT del usuario.
- El superadmin no tiene ninguna política RLS que le permita `SELECT` directo:
  el único camino es `get_audit_logs()`, que siempre registra.
- La restricción `CHECK` en `resource_id` cierra el vector de almacenamiento
  basura tanto en la tabla activa como en el archivo histórico.
- El servicio TypeScript es más simple: una sola llamada RPC reemplaza
  la combinación SELECT + fire-and-forget de `emitMetaAuditLog`.

### Negative / Trade-offs accepted
- Cada consulta superadmin pasa por PL/pgSQL en lugar de ir directo a la tabla
  (latencia extra de ~1–3 ms en condiciones normales — aceptable).
- Los filtros se pasan como `jsonb`, no como parámetros tipados, lo que implica
  que errores de nombre de clave no son detectados por el compilador TypeScript
  hasta runtime. El test de integración cubre este riesgo.
- El cast `as unknown as SupabaseClient` en `auditLogs.service.ts` se mantiene
  hasta que se regenere `database.types.ts` (ver DEBT-018).

### Constraints introduced
- Todo acceso de lectura a `audit_logs` con permisos superadmin **debe** pasar
  por `public.get_audit_logs()`. No añadir políticas RLS de SELECT para superadmin
  sin actualizar primero este ADR.
- La función `get_audit_logs()` debe ser el punto de mantenimiento para cualquier
  cambio en los filtros de consulta — no construir queries directas en la capa TS.
- Si en el futuro se añade un nuevo rol con acceso de lectura al historial completo,
  deberá añadirse una guardia equivalente en `get_audit_logs()` o crear una función
  derivada con las mismas garantías de traza.

---

## Implementation

| Artefacto | Cambio |
|-----------|--------|
| `supabase/migrations/20260615_003_audit_system.sql` | Migración consolidada — incluye CHECK constraints, DROP política antigua, CREATE `get_audit_logs` SECURITY DEFINER, jobs pg_cron, tablas y RLS completas |
| `supabase/functions/log-audit-event/index.ts` | Edge Function receptora: verifica JWT, extrae contexto de usuario server-side, inserta con service_role |
| `src/services/auditLogs.service.ts` | Reemplaza SELECT directo + `emitMetaAuditLog` por `.rpc('get_audit_logs')` |
| `docs/architecture/TECH-DEBT.md` | DEBT-018: plan de regeneración de tipos pendiente |

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

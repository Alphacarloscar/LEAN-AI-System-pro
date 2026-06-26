# RUNBOOK — Activación: Audit System + Atomic Screen Independence
**GOBY · Alpha Consulting**
Versión: 1.0 | Fecha: 2026-06-16 | Branch: `feat/atomic-screen-independence`
ADRs relacionados: ADR-017 · ADR-018 · ADR-019

---

## Resumen ejecutivo

Este runbook cubre el despliegue de dos cambios entregados conjuntamente en este release:

| Componente | Descripción |
|---|---|
| **Audit System** | 3 tablas inmutables, 5 funciones SECURITY DEFINER, RLS Append-Only, 2 jobs pg_cron. Trazabilidad completa de operaciones de servicio y accesos de superadmin. |
| **Atomic Screen Independence** | Las 13 pantallas (T1–T12 + T10 index) leen su `engagementId` directamente de la URL (`/t1/:engagementId`). Eliminación de `DemoContext`. Cada pantalla es desplegable, linkable y recargable de forma totalmente independiente. |

Tiempo estimado de activación: **< 10 minutos**.
Ventana de mantenimiento requerida: **No** (cambios aditivos sin downtime).

---

## Parte 1 — Variables de Entorno

### 1.1 Variables nuevas requeridas

Estas variables deben declararse en **Vercel → Settings → Environment Variables** para los entornos **Preview (PRE)** y **Production (PRO)** antes de ejecutar el script SQL.

> **Nota ADR-005:** Carlos opera vía Web UI únicamente. Todas las instrucciones usan el panel de Vercel y el editor SQL de Supabase, sin CLI.

| Variable | Entorno | Descripción | Ejemplo de valor |
|---|---|---|---|
| `APP_AUDIT_PEPPER` | PRE + PRO | Secreto de 64 chars hex para HMAC-SHA256. Generado una sola vez, nunca rotado (rompería hashes históricos). | `a3f8...` (64 chars) |

> **Importante:** `APP_AUDIT_PEPPER` **no se pasa a la Edge Function como env var de Vercel**. Se configura directamente en la base de datos de Supabase como `app.audit_pepper` (ver Paso 2.2). Esta tabla de Vercel es un recordatorio del valor a usar — el valor real vive en Supabase Vault.

#### Variables ya existentes que deben estar activas

Verificar que estas variables estén presentes (no son nuevas, pero son precondición):

| Variable | Entorno | Necesaria para |
|---|---|---|
| `VITE_SUPABASE_URL` | PRE + PRO | Cliente Supabase del frontend |
| `VITE_SUPABASE_ANON_KEY` | PRE + PRO | Cliente Supabase del frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | PRE + PRO | Edge Functions (`log-audit-event`, `ai-recommend`) |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | PRE | Bypass para Playwright E2E en CI |

---

## Parte 2 — Instrucciones de Ejecución del Script SQL

### 2.1 Prerrequisitos en Supabase Dashboard

Completar estos pasos en **Supabase Dashboard → Database → Extensions** antes de ejecutar el SQL:

**Paso 1 — Habilitar `pg_cron`:**
```
Dashboard → Database → Extensions → buscar "pg_cron" → Enable
```
> Supabase Cloud no permite activar pg_cron vía SQL. Debe hacerse desde el Dashboard.

**Paso 2 — Habilitar `pgcrypto`:**
```
Dashboard → Database → Extensions → buscar "pgcrypto" → Enable
```
> El script incluye `CREATE EXTENSION IF NOT EXISTS pgcrypto` como fallback idempotente.

### 2.2 Configurar el secreto `audit_pepper` en Supabase

**Paso 1 — Generar el valor del pepper** (si no existe ya):
```sql
-- Ejecutar en Supabase SQL Editor para generar el secreto
SELECT encode(gen_random_bytes(32), 'hex');
```
Copiar la salida (64 caracteres hexadecimales). Guardarla en un gestor de secretos seguro.

**Paso 2 — Registrar en Supabase Vault:**
```
Dashboard → Project Settings → Vault → New Secret
  Name:  audit_pepper
  Value: <pegar los 64 chars hex>
```

**Paso 3 — Activar como parámetro de base de datos:**
```sql
-- Sustituir <valor> por los 64 chars hex generados en el paso anterior
ALTER DATABASE postgres SET app.audit_pepper = '<valor>';
```
> Este parámetro persiste entre reinicios de la BD. Solo necesita ejecutarse una vez por entorno.

### 2.3 Ejecutar el script SQL consolidado

**Esta es la única acción SQL necesaria para el release completo del Audit System.**

1. Abrir **Supabase Dashboard → SQL Editor**
2. Copiar el contenido íntegro del archivo:
   ```
   supabase/releases/release-audit-system-complete.sql
   ```
3. Pegar en el editor y hacer clic en **Run**

El script es **idempotente**: puede ejecutarse múltiples veces en el mismo entorno sin errores ni efectos secundarios. Está diseñado para ser seguro de re-lanzar en caso de duda.

**Salidas esperadas al finalizar sin error:**

```
-- Las únicas salidas son los SELECT de cron.schedule() que devuelven el jobid asignado:
-- jobid
-- ─────
--  1       ← purge-audit-logs-90d
--  2       ← purge-audit-archive-5y
```

> Si el script ya se ejecutó antes, pg_cron devuelve un nuevo jobid mayor (los anteriores quedan inactivos por el `unschedule` previo). Esto es correcto y esperado.

---

## Parte 3 — Impacto de Rutas (Atomic Screen Independence)

### 3.1 Nuevo esquema de rutas

Todas las pantallas de herramientas ahora incluyen el `engagementId` como segmento dinámico en la URL:

| Ruta anterior (obsoleta) | Ruta actual (canónica) |
|---|---|
| `/t1` | `/t1/:engagementId` |
| `/t2` | `/t2/:engagementId` |
| `/t3` | `/t3/:engagementId` |
| `/t4` | `/t4/:engagementId` |
| `/t5` | `/t5/:engagementId` |
| `/t6` | `/t6/:engagementId` |
| `/t7` | `/t7/:engagementId` |
| `/t8` | `/t8/:engagementId` |
| `/t9` | `/t9/:engagementId` |
| `/t11` | `/t11/:engagementId` |
| `/t12` | `/t12/:engagementId` |
| `/` (index) | `/` → T10 (AI Value Dashboard, sin engagementId en URL) |

### 3.2 Comportamiento de redirección

**Accesos directos a rutas limpias sin ID (`/t1`, `/t2`, etc.):**
- React Router no encuentra la ruta y activa el fallback `<Navigate to="/" replace />`.
- El usuario es redirigido de forma segura al dashboard principal (`/`).
- No se produce error 404 ni pantalla en blanco.

**Accesos directos a rutas con ID válido (`/t1/abc-123`):**
- El hook `useEngagementSync()` lee el `engagementId` de la URL y sincroniza el store global de Zustand.
- La pantalla carga directamente el engagement correcto sin pasar por el selector.
- Los links son **bookmarkables, compartibles y recargables** sin perder contexto.

### 3.3 Advertencia para el equipo de QA

> ⚠️ **Los scripts o bookmarks de tests que apunten a rutas limpias (`/t1`, `/t2`, etc.) sin `engagementId` ya no funcionarán.**
>
> **Acción requerida:** Actualizar todos los accesos directos de prueba para incluir el UUID del engagement del entorno PRE. El equipo de QA puede obtener el `engagementId` correcto desde el selector de proyectos en la pantalla principal o desde la URL al navegar a cualquier herramienta normalmente.
>
> Los helpers de E2E (`e2e/helpers.ts`) ya usan el patrón correcto: inyectan el `projectId` en localStorage via `selectEngagement()` antes de navegar.

---

## Parte 4 — Smoke Test post-despliegue

Ejecutar estos 3 bloques en **Supabase SQL Editor** inmediatamente después del despliegue para confirmar que el sistema está operativo.

### Smoke Test 1 — Verificación estructural del sistema de auditoría

Confirma que las 3 tablas tienen RLS activo, las 5 funciones son SECURITY DEFINER y los 2 jobs de pg_cron están registrados.

```sql
-- ── Tablas con RLS activo (debe devolver 3 filas con rowsecurity = true) ──
SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  tablename IN ('audit_logs', 'audit_logs_archive', 'audit_access_logs')
ORDER BY tablename;

-- ── Funciones SECURITY DEFINER (prosecdef = true en las 5) ──
SELECT proname, prosecdef
FROM   pg_proc
WHERE  proname IN (
  'hmac_email_hash', 'log_audit_access', 'get_audit_logs',
  'purge_old_audit_logs', 'purge_old_audit_archive'
)
ORDER BY proname;

-- ── Jobs pg_cron activos (debe devolver 2 filas con active = true) ──
SELECT jobname, schedule, active
FROM   cron.job
WHERE  jobname IN ('purge-audit-logs-90d', 'purge-audit-archive-5y');
```

**Resultado esperado:** 3 tablas con `rowsecurity = true`, 5 funciones con `prosecdef = true`, 2 jobs con `active = true`.

---

### Smoke Test 2 — Verificación del cifrado HMAC y la meta-auditoría

Confirma que el pepper está configurado y que `get_audit_logs()` registra el acceso en `audit_access_logs` antes de devolver datos.

```sql
-- ── Test HMAC: debe devolver una cadena hex de 64 caracteres ──
SELECT
  length(public.hmac_email_hash('smoke-test@example.com')) AS hash_length,
  public.hmac_email_hash('smoke-test@example.com')         AS hash_value;

-- ── Test get_audit_logs (ejecutar autenticado como superadmin): ──
-- Paso 1: consulta que genera automáticamente 1 entrada en audit_access_logs
SELECT * FROM public.get_audit_logs('{"limit": 3}'::jsonb);

-- Paso 2: confirmar que el acceso quedó registrado
SELECT accessed_at, user_email, user_role, query_filters, rows_returned
FROM   public.audit_access_logs
ORDER BY accessed_at DESC
LIMIT 1;
```

**Resultado esperado:**
- `hash_length = 64` y `hash_value` es una cadena hex no nula.
- `get_audit_logs` devuelve filas (o set vacío si no hay logs aún) SIN error.
- `audit_access_logs` muestra 1 entrada nueva con `user_role = 'superadmin'` y los filtros usados.

---

### Smoke Test 3 — Verificación del rechazo de acceso no autorizado

Confirma que la función rechaza a usuarios sin rol `superadmin` y que el muro de seguridad está activo.

```sql
-- ── Ejecutar como usuario con rol 'consultor' o 'editor' (NO superadmin) ──
-- Debe lanzar el siguiente error sin devolver ninguna fila:
--   "get_audit_logs: permission denied — superadmin role required (caller role: consultor)"

SELECT * FROM public.get_audit_logs('{}');
```

**Resultado esperado:** La query lanza una excepción de PostgreSQL con el mensaje de permiso denegado. No se devuelve ninguna fila ni se registra en `audit_access_logs` (el INSERT ocurre después de la verificación de rol).

---

## Checklist de despliegue

Marcar cada ítem antes de declarar el despliegue completado:

### PRE
- [ ] pg_cron habilitado en Supabase PRE
- [ ] pgcrypto habilitado en Supabase PRE
- [ ] Secreto `audit_pepper` generado y guardado en gestor de secretos
- [ ] `audit_pepper` registrado en Vault de Supabase PRE
- [ ] `ALTER DATABASE postgres SET app.audit_pepper = '...'` ejecutado en PRE
- [ ] Script SQL `release-audit-system-complete.sql` ejecutado en PRE sin errores
- [ ] Smoke Test 1 ejecutado: 3/3 tablas ✓ · 5/5 funciones ✓ · 2/2 jobs ✓
- [ ] Smoke Test 2 ejecutado: hash_length=64 ✓ · meta-auditoría registrada ✓
- [ ] Smoke Test 3 ejecutado: acceso denegado correctamente ✓
- [ ] Deploy de Vercel PRE confirmado (variables de entorno propagadas)
- [ ] Suite E2E en verde (`npx playwright test`)
- [ ] QA ha actualizado accesos directos de prueba con `:engagementId` correcto

### PRO
- [ ] Todos los ítems de PRE superados sin incidencias
- [ ] `audit_pepper` generado **independientemente** para PRO (secreto diferente a PRE)
- [ ] `audit_pepper` registrado en Vault de Supabase PRO
- [ ] `ALTER DATABASE postgres SET app.audit_pepper = '...'` ejecutado en PRO
- [ ] Script SQL ejecutado en PRO sin errores
- [ ] Smoke Test 1 ejecutado en PRO ✓
- [ ] Smoke Test 2 ejecutado en PRO ✓
- [ ] Smoke Test 3 ejecutado en PRO ✓
- [ ] Deploy de Vercel PRO confirmado

---

## Rollback

### Frontend (Vercel)
El rollback de código se realiza desde **Vercel Dashboard → Deployments → [deploy anterior] → Redeploy**.
No hay side effects de estado en el cliente; las rutas antiguas simplemente redirigen al index.

### Base de datos
El Audit System es **aditivo**: añade tablas, funciones e índices nuevos sin modificar tablas existentes.

**No existe un rollback automático de base de datos.** Si fuera necesario revertir:

```sql
-- ⚠️ SOLO ejecutar si se decide abandonar el Audit System completamente.
-- Elimina todas las tablas, funciones y jobs del sistema de auditoría.

-- Jobs
SELECT cron.unschedule('purge-audit-logs-90d');
SELECT cron.unschedule('purge-audit-archive-5y');

-- Funciones
DROP FUNCTION IF EXISTS public.get_audit_logs(jsonb);
DROP FUNCTION IF EXISTS public.log_audit_access(jsonb, integer);
DROP FUNCTION IF EXISTS public.purge_old_audit_logs(integer, integer);
DROP FUNCTION IF EXISTS public.purge_old_audit_archive();
DROP FUNCTION IF EXISTS public.hmac_email_hash(text);

-- Tablas (DESTRUYE TODOS LOS LOGS — irreversible)
DROP TABLE IF EXISTS public.audit_access_logs;
DROP TABLE IF EXISTS public.audit_logs_archive;
DROP TABLE IF EXISTS public.audit_logs;
```

> **Este rollback es destructivo e irreversible.** Requiere aprobación explícita del Release Manager antes de ejecutarse en PRO.

---

## Referencias

| Documento | Ruta |
|---|---|
| Script SQL consolidado | `supabase/releases/release-audit-system-complete.sql` |
| ADR-017 — Audit Logging Proxy | `docs/decisions/technical/ADR-017-audit-logging-proxy.md` |
| ADR-018 — Audit Log Retention | `docs/decisions/technical/ADR-018-audit-log-retention-pg-cron.md` |
| ADR-019 — Audit Logs Read Security | `docs/decisions/technical/ADR-019-audit-logs-read-security-definer.md` |
| ADR-005 — No CLI Workflow | `docs/decisions/technical/ADR-005-no-cli-workflow.md` |
| Audit System Architecture | `docs/architecture/audit-system.md` |
| Database Schemas | `docs/operations/DATABASES.md` |
| E2E Helpers | `e2e/helpers.ts` |

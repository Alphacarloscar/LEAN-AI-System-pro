﻿﻿﻿# Databases — GOBY

Last updated: 2026-07-06
AI-Ready Repository System v2.1.0

> ⚠️ Política de seguridad: Este fichero documenta la ESTRUCTURA y PROTOCOLOS de base de datos.
> Los nombres de proyecto, URLs de conexión y credenciales NUNCA se almacenan aquí.
> Los placeholders marcados [COMPLETAR] deben rellenarse en `.env.local` — nunca en este fichero.

---

## Sistema de Base de Datos

**Sistema:** Supabase (PostgreSQL 15)
**ORM / Client:** @supabase/supabase-js (acceso via `src/lib/supabase.ts`)
**Schema / Migrations:** `supabase/migrations/` — SQL puro ejecutado en Supabase SQL Editor
**RLS:** Habilitado en todas las tablas con datos de engagement o empresa (ADR-004)

---

## Proyectos por Entorno

| Entorno | Label | Proyecto Supabase | URL | Variables requeridas |
|---------|-------|-------------------|-----|---------------------|
| Production | PRO | `vbpgsgxsslccctjhuegt` | https://vbpgsgxsslccctjhuegt.supabase.co | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Pre-production | PRE | `mkypmakmkxpecuezofkk` | https://mkypmakmkxpecuezofkk.supabase.co | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Development | DEV | local (Supabase CLI) | http://127.0.0.1:54321 | `VITE_SUPABASE_URL=http://127.0.0.1:54321`, `VITE_SUPABASE_ANON_KEY` (ver output de `supabase start`) |

> DEV usa Supabase CLI local — proyecto propio en máquina, desechable. PRE y PRO son proyectos remotos separados (ADR-006).
> Las credenciales (anon keys) se obtienen de: Supabase Dashboard → proyecto → Settings → API.

---

## Tablas del Sistema

### Tablas estructurales (FKs reales)

| Tabla | Propósito | Discriminador de tenant |
|-------|----------|------------------------|
| `companies` | Empresas cliente (tenants) | `id` |
| `profiles` | Usuarios (extiende auth.users) | `company_id` |
| `projects` | Proyectos de adopción IA | `company_id` |
| `project_members` | Relación usuario ↔ proyecto | `project_id` |
| `company_profiles` | Perfil de empresa del cliente | `project_id` |
| `snapshots` | Capturas longitudinales del estado | `project_id` |
| `frictions` | Fricciones detectadas en T3 | `project_id` |
| `company_persons` | Personas del proyecto (nombre, cargo, departamento, tool origen) — reutilizable desde T1, T2, T3, T9 y CompanyProfile via `PersonSelectField` | `project_id` (opcional `company_id`) |
| `audit_logs` | Historial de auditoría (90 días) | `user_id` / `metadata.company_id` |
| `audit_logs_archive` | Archivo de auditoría (5 años) | `user_id` / `metadata.company_id` |
| `audit_access_logs` | Meta-auditoría de accesos al log | `user_id` |

### Tablas con payload JSONB (flexibles por herramienta)

| Tabla | Herramienta | Payload JSONB |
|-------|------------|--------------|
| `t1_dimension_scores` | T1 | Scores por dimensión/subdimensión/entrevistado |
| `stakeholders` | T2 | Cuadrante, arquetipo, herramientas unofficiales |
| `value_streams` | T3 | Value stream con fricciones asociadas |
| `use_cases` | T4 | Caso de uso con scoring ROI/viabilidad, Go/No-Go |
| `t5_canvas` | T5 | Canvas departamento × dominio IA |
| `iso42001_controls` | T12 | Controles ISO 42001 con estado de cumplimiento |

### Tablas de snapshot (longitudinales)

| Tabla | Datos que captura |
|-------|-----------------|
| `t1_score_snapshots` | Estado de T1 en el momento del snapshot |
| `stakeholder_snapshots` | Estado de T2 en el momento del snapshot |
| `value_stream_snapshots` | Estado de T3 en el momento del snapshot |

---

## Migraciones Ejecutadas

| Fichero | Descripción | Estado |
|---------|-------------|--------|
| `001_foundation.sql` | Schema base: profiles, projects, members, company_profiles, frictions, T1, stakeholders, value_streams, use_cases, t5_canvas, iso42001_controls | ✅ DEV + PRE + PRO |
| `002_snapshots.sql` | Sistema de snapshots longitudinales | ✅ DEV + PRE + PRO |
| `003_t1_multiinterviewee.sql` | T1 multi-entrevistado: interviewee_id + interviewee_type | ✅ DEV + PRE + PRO |
| `004_companies_and_rename.sql` | Tabla `companies` + renombrado de `engagements` a `projects` | ✅ DEV + PRE + PRO |
| `005_company_wide_access.sql` | company_id en members + auto-add usuarios de empresa | ✅ DEV + PRE + PRO |
| `006_performance_indexes.sql` | Índices en project_id, company_id, created_at | ✅ DEV + PRE + PRO |
| `007_stakeholder_unofficial_tools.sql` | Campo unofficial_tools en stakeholders (Shadow AI) | ✅ DEV + PRE + PRO |
| `008_roles_four_tier.sql` | Sistema de 4 roles (ADR-008) | ✅ DEV + PRE + PRO |
| `20260527_security_persistence.sql` | Persistencia de sesión y seguridad | ✅ DEV + PRE + PRO |
| `20260527_security_persistence_v2.sql` | Fix: ajustes de persistencia | ✅ DEV + PRE + PRO |
| `20260527_security_persistence_v3.sql` | Fix: ajustes finales de persistencia | ✅ DEV + PRE + PRO |
| `20260527_security_persistence_v3_1.sql` | Hotfix: seguridad persistencia | ✅ DEV + PRE + PRO |
| `20260615_003_audit_system.sql` | Migración consolidada del sistema de auditoría: tablas `audit_logs`, `audit_logs_archive`, `audit_access_logs` + índices + RLS + funciones de purga HMAC + jobs pg_cron + `get_audit_logs` SECURITY DEFINER (ADR-017, ADR-018, ADR-019) | ✅ DEV — ⏳ PRE + PRO pendiente |
| `20260615_007_perf_profiles_idx.sql` | Índice explícito en `profiles.id` para mejorar rendimiento de consultas de rol | ✅ DEV — ⏳ PRE + PRO pendiente |
| `20260616_004_audit_schema_drift.sql` | Drift fix: añade columnas faltantes en tablas preexistentes (`audit_logs.correlation_id`, `audit_logs_archive.correlation_id/user_email_hash/ai_provider/ai_model/ai_total_tokens`) | ✅ DEV — ⏳ PRE + PRO pendiente |
| `20260703_company_persons.sql` | Tabla `company_persons` (scope `project_id`, RLS via `user_can_read_project`/`user_can_edit_project`) + columnas `person_id` (FK nullable) en `t9_free_items` y `t1_dimension_scores` — soporta `PersonSelectField` en T1/T2/T3/T9/CompanyProfile | ✅ DEV — ⏳ PRE + PRO pendiente |
| `20260704_backfill_company_persons_toy_story.sql` | Backfill de datos (histórico, ámbito único): cargó `company_persons` desde T1/T2/T3/T9 solo para "Toy Story"/"Disney". Superado por la versión genérica de abajo — no reutilizar como plantilla para nuevos clientes. | ✅ Ejecutado (DEV + PRE + PRO) |
| `20260705_backfill_company_persons_all_projects.sql` | Backfill de datos genérico: carga `company_persons` desde T1/T2/T3/T9 para **todos** los proyectos/empresas de la BD en una sola pasada. Reemplaza al backfill anterior como método estándar — usar este para cualquier carga futura (clientes nuevos, proyectos añadidos con posterioridad a la migración de esquema). No es migración de esquema. Requiere `20260703_company_persons.sql` ya aplicada. Ver protocolo más abajo. | ✅ DEV (validado contra Postgres 15 vía Docker, multi-tenant) — ⏳ PRE + PRO pendiente |
| `20260706_stakeholders_person_id.sql` | Añade `stakeholders.person_id` (FK nullable a `company_persons`, `ON DELETE SET NULL`) + backfill por `(project_id, nombre, cargo)`. Hasta esta migración, T2 solo copiaba nombre/cargo/departamento como texto libre sin vínculo real — con esta columna, T1, T2, T3 y T9 quedan todos con una referencia real que la función de fusión (ver siguiente fila) puede repuntar. | ✅ DEV (validado contra Postgres 15 vía Docker) — ⏳ PRE + PRO pendiente |
| `20260706_merge_company_persons_function.sql` | Función `merge_company_persons(p_principal_id, p_replaced_id)` — fusiona dos `company_persons`: repunta T1/T2/T3(JSONB)/T9 hacia la principal y elimina la sustituible. `SECURITY DEFINER`, solo `superadmin`/`consultant`, atómica (revierte todo ante cualquier error). Invocada desde `src/services/company-person.service.ts` vía `supabase.rpc(...)`. Ver sección "Función merge_company_persons" más abajo. | ✅ DEV (validado contra Postgres 15 vía Docker: caso feliz, mismo id, proyectos distintos, persona inexistente, rol no autorizado, rollback transaccional) — ⏳ PRE + PRO pendiente |

> Las migraciones marcadas ⏳ se aplican juntas via `supabase/releases/release-v2.2.0-pre-pro.sql` (único script idempotente).

> **FASE2_verify_indexes.sql, FASE3_add_missing_indexes.sql** — scripts de verificación/mantenimiento, no migraciones de esquema.

---

## Releases Pendientes de Aplicar

| Archivo release | Cubre | Ejecutar en | Estado |
|-----------------|-------|-------------|--------|
| `supabase/releases/release-v2.2.0-pre-pro.sql` | Sistema auditoría completo: 003+007+004 consolidados + fix search_path | PRE → PRO (en ese orden) | ⏳ Pendiente |

**Protocolo:**
1. Verificar prerrequisitos: pg_cron habilitado + Vault `audit_pepper` configurado en el proyecto destino.
2. Copiar contenido de `release-v2.2.0-pre-pro.sql` en Supabase SQL Editor (proyecto PRE).
3. Ejecutar y verificar con los bloques §V del propio script.
4. Repetir en PRO solo tras confirmación de PRE.
5. Actualizar esta tabla con ✅ + fecha de ejecución.

---

## Scripts de Backfill (carga de datos, no de esquema)

A diferencia de las migraciones (que crean/alteran tablas), un **backfill** rellena una tabla nueva con datos que ya existen en otras tablas — típico tras añadir una entidad que reutiliza información dispersa en varias herramientas (ej. `company_persons` a partir de T1/T2/T3/T9).

**Ficheros de backfill activos:**

| Archivo | Qué carga | Alcance |
|---------|-----------|---------|
| `supabase/migrations/20260705_backfill_company_persons_all_projects.sql` | `company_persons` a partir de `t1_dimension_scores.interviewee_*`, `stakeholders.*`, `value_streams.stages[].responsible/department` (JSONB) y `t9_free_items.responsible/department` | **Todos** los proyectos/empresas de la BD (sin filtro por nombre) |
| `supabase/migrations/20260704_backfill_company_persons_toy_story.sql` | Mismo origen de datos, pero ámbito fijo a un solo proyecto | ⚠️ Histórico — ya ejecutado, no reutilizar. Usar el genérico de arriba para cualquier carga nueva. |

**Características de diseño (aplican a cualquier backfill futuro):**
- **Idempotente**: usa `NOT EXISTS` antes de cada `INSERT` — ejecutarlo varias veces (o tras dar de alta un cliente nuevo) no duplica filas ya creadas. Validado con doble ejecución en Postgres 15 (Docker), incluyendo dos empresas distintas con una persona homónima entre ellas, sin duplicados ni fugas cruzadas.
- **Sin filtro por nombre**: el genérico opera sobre `JOIN public.projects p ON p.id = <tabla>.project_id` sin `WHERE p.name = ...` — cubre automáticamente cualquier proyecto/empresa presente en la BD, incluidos los que se den de alta después de ejecutar el script (basta con re-ejecutarlo).
- **Deduplicación por (project_id, nombre, cargo)**: dos entradas con el mismo nombre pero cargo distinto (o sin cargo, como ocurre en T3/T9 que no capturan cargo) se tratan como personas distintas dentro del mismo proyecto — evita fusionar por error a dos personas homónimas. El `project_id` en la comparación también evita que una persona de una empresa se fusione con la homónima de otra empresa. Los duplicados aparentes "con/sin cargo" se resuelven de forma natural hacia delante: en cuanto T3/T9 empiecen a usar `PersonSelectField` para capturar también el cargo, las siguientes altas ya no generarán esas filas "sin cargo".
- **Vínculo `person_id`**: además de crear las filas en `company_persons`, actualiza `t1_dimension_scores.person_id` y `t9_free_items.person_id` con el id de la persona correspondiente. En T3, como `stages` es JSONB, reescribe el array completo añadiendo `"personId"` a cada etapa cuyo `responsible` coincida con una persona.
- **Verificación incluida**: el script termina con un `RAISE NOTICE` con el total global, más un `SELECT` de desglose por empresa/proyecto/herramienta — revisar ambos tras ejecutar para confirmar el resultado antes de pasar al siguiente entorno.

**Protocolo de ejecución por entornos:**
1. Confirmar que `20260703_company_persons.sql` ya está aplicada en el entorno destino (tabla `company_persons` debe existir).
2. Copiar el contenido íntegro de `20260705_backfill_company_persons_all_projects.sql` en el SQL Editor de Supabase del entorno.
3. Ejecutar. Revisar el `NOTICE` con el total y la tabla de desglose por empresa/proyecto/herramienta que devuelve el `SELECT` final.
4. Repetir en el siguiente entorno (DEV → PRE → PRO) solo tras confirmar el resultado en el anterior.
5. Actualizar la tabla de "Migraciones Ejecutadas" con ✅ + fecha por entorno.
6. **Cuando se dé de alta un cliente/proyecto nuevo más adelante**, basta con volver a ejecutar este mismo script — es idempotente y cubre automáticamente los datos nuevos sin tocar los ya migrados.

---

## Función `merge_company_persons` (fusionar personas del equipo)

Funcionalidad de "Equipo del proyecto" (Perfil de Empresa) para roles `consultant`/`superadmin`: fusiona dos `company_persons` — una "principal" (se conserva) y una "sustituible" (se elimina) — repuntando todas las referencias reales antes de borrar.

**Fichero:** `supabase/migrations/20260706_merge_company_persons_function.sql`

**Por qué una función Postgres y no llamadas secuenciales desde el cliente:** la fusión toca 4 tablas (T1, T2, T3 JSONB, T9) más el `DELETE` final en `company_persons`. Supabase no ofrece transacciones multi-statement desde el cliente JS — varias llamadas `.from(...).update()` seguidas no son atómicas entre sí. Se optó por una única función `SECURITY DEFINER` en `plpgsql`, invocada una sola vez vía `supabase.rpc('merge_company_persons', {...})` desde `src/services/company-person.service.ts`. Toda la función corre en una única transacción implícita de Postgres: si cualquier `RAISE EXCEPTION` se dispara (validación fallida, error inesperado), **todos** los cambios hechos hasta ese punto dentro de la función se revierten automáticamente — no existe estado parcial ni hace falta lógica de rollback manual en el frontend.

**Validaciones dentro de la función (en este orden):**
1. Rol del que llama (`profiles.role` de `auth.uid()`) debe ser `superadmin` o `consultant` — si no, `RAISE EXCEPTION` y aborta sin tocar nada.
2. `p_principal_id` y `p_replaced_id` no pueden ser el mismo id.
3. Ambas personas deben existir en `company_persons`.
4. Ambas personas deben pertenecer al mismo `project_id` — si no, aborta (protección adicional aunque la UI ya solo ofrece personas del proyecto activo).
5. Repunta `t1_dimension_scores.person_id`, `stakeholders.person_id`, `value_streams.stages[].personId` (JSONB, reescribiendo el array completo por cada `value_stream` afectado) y `t9_free_items.person_id`.
6. Verificación defensiva: si quedara alguna referencia sin repuntar, aborta antes de borrar.
7. `DELETE FROM company_persons WHERE id = p_replaced_id`.
8. Devuelve un `jsonb` con el conteo de filas actualizadas por herramienta (`t1_updated`, `t2_updated`, `t3_updated`, `t9_updated`).

**Frontend:**
- `src/services/company-person.service.ts` → `mergePersons(principalId, replacedId)` — llama al RPC, envuelve el error de Postgres (mensaje ya en español, listo para mostrar al usuario).
- `src/modules/CompanyProfile/useCompanyPersonStore.ts` → acción `mergePersons(projectId, principalId, replacedId)` — en éxito refresca `persons` con `fetchPersons`; en error deja el mensaje en `mergeError` (no toca `persons`, no hay refresh — el estado visible no cambia porque el backend no cambió nada).
- `src/modules/CompanyProfile/components/MergePersonsModal.tsx` — modal con dos selectores (principal / sustituible, mutuamente excluyentes). Si `mergeError` está poblado, el mismo componente muestra un **modal de error dedicado** con el texto descriptivo devuelto por la función, en vez del formulario — no un toast, tal como se especificó en el requisito.

**Validado con Docker (Postgres 15) antes de entregar:** caso feliz (4 tablas repuntadas correctamente, persona sustituible eliminada, referencias ya correctas a la principal quedan intactas), mismo id, proyectos distintos, persona inexistente, rol no autorizado (`client_viewer`), y confirmación explícita de que un `ROLLBACK` externo (simulando cualquier error a mitad de la operación) no deja ningún cambio parcial en ninguna de las 4 tablas ni en `company_persons`.

---

## Reglas de Datos por Entorno

### PRO — Production (datos reales, sagrados)
- Contiene datos reales de clientes.
- Acceso directo (SQL Editor) solo para: migraciones validadas en DEV → PRE → PRO. Sin acceso ad-hoc.
- **Nunca** copiar a PRE o DEV sin proceso de anonimización documentado.
- Backups: automáticos via Supabase (verificar en Dashboard → Database → Backups).
- Claude no ejecuta queries directas en PRO. Proporciona SQL para que Carlos lo ejecute.

### PRE — Pre-production (datos sintéticos)
- Datos sintéticos de prueba. Puede resetearse libremente. Sin datos reales de clientes.
- Para QA antes de releases.

### DEV — Local development (datos desechables)
- Supabase CLI local (`supabase start`) — BD propia en la máquina de desarrollo.
- Reset libre: `supabase db reset` o ejecutar migration files desde el principio.
- Seed de prueba: `supabase/seed/` (si existe) o ejecutar manualmente en el SQL Editor local (http://127.0.0.1:54323).

---

## Protocolo de Sincronización entre Entornos

### Schema (migraciones) — SIEMPRE de DEV hacia PRO
```
DEV (local SQL Editor)
    → Escribir y probar migration
    → Validar que funciona correctamente
    ↓
PRE (SQL Editor proyecto DEV — mismo proyecto)
    → Aplicar migration con datos demo
    → Verificar que los datos existentes no se corrompen
    ↓
PRO (SQL Editor proyecto PRO)
    → Carlos ejecuta el script tras confirmación explícita
    → Verificar con query de comprobación
```

### Datos — NUNCA de PRO hacia abajo
- PRO → PRE: **PROHIBIDO** sin anonimización completa
- PRO → DEV: **PROHIBIDO** sin anonimización completa
- PRE → DEV: permitido (son datos demo/sintéticos)

---

## Backups

| Entorno | Frecuencia | Gestión | Retención |
|---------|-----------|---------|-----------|
| PRO | Automática via Supabase Pro plan | Supabase Dashboard → Database → Backups | [COMPLETAR: verificar en Dashboard] |
| PRE | No necesario (datos demo) | — | — |
| DEV | No necesario (datos desechables) | — | — |

**Verificación de backup antes de migración PRO:**
1. Abrir Supabase Dashboard → proyecto PRO → Database → Backups
2. Verificar que existe un backup de < 24 horas
3. Si no existe, esperar al backup automático o contactar a Supabase Support

**Restauración:**
→ Ver docs/operations/MIGRATIONS.md sección "Rollback procedure"

---

## Access Control

| Rol | PRO DB | PRE DB | DEV DB | Notas |
|-----|--------|--------|--------|-------|
| Carlos (superadmin) | SQL Editor — solo migraciones | SQL Editor — libre | SQL Editor — libre | Via Supabase Dashboard |
| Claude (AI) | Via código (app) únicamente | Via código (app) | Via código + SQL scripts para Carlos | Nunca acceso directo a PRO |
| Usuarios app | Via RLS (app únicamente) | Via RLS (app) | Via RLS (app) | Sin acceso al Dashboard |

> **Regla crítica:** Claude NUNCA ejecuta queries directas en la BD de PRO. Proporciona el SQL script para que Carlos lo ejecute manualmente en Supabase SQL Editor, con instrucciones paso a paso y query de verificación.


---

## Audit Edge Function — Propagación de JWT

**Problema diagnosticado (2026-06-30):** `supabase.functions.invoke()` en supabase-js v2 envía el `anon key` en el header `Authorization` por defecto, incluso con sesión activa. La Edge Function `log-audit-event` llama a `supabase.auth.getUser()` para extraer la identidad del caller — con anon key recibe `{ user: null }` y devuelve `401 "Invalid token"`. Resultado: 0 filas en `audit_logs` en toda la historia del sistema hasta el fix.

**Fix aplicado:** `auditClient.ts` lee el `access_token` vía `supabase.auth.getSession()` y lo pasa explícitamente:

```ts
const { data: { session } } = await supabase.auth.getSession()
// headers: { Authorization: `Bearer ${session.access_token}` }
await supabase.functions.invoke('log-audit-event', { body: entry, headers })
```

**Regla derivada (ADR-026):** Toda llamada a `supabase.functions.invoke()` en este proyecto debe pasar el `Authorization` header explícitamente si la Edge Function necesita identificar al usuario. Ver `src/lib/audit/auditClient.ts::getAuthHeader()` como implementación de referencia.

**Validación post-deploy:**
```sql
SELECT COUNT(*)
FROM audit_logs
WHERE method_name = 'upsertAllScoresForInterviewee'
  AND created_at > now() - interval '30 minutes';
-- Debe devolver > 0 tras un run de E2E post-fix.
```

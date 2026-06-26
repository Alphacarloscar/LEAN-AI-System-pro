﻿﻿﻿# Databases — GOBY

Last updated: 2026-06-01
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

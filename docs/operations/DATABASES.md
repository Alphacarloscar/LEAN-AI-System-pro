# Databases — GOBY

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
| `profiles` | Usuarios (extiende auth.users) | `id` = user_id |
| `engagements` | Proyectos de adopción IA | `company_id` |
| `engagement_members` | Relación usuario ↔ engagement | `engagement_id` |
| `company_profiles` | Perfil de empresa del cliente | `engagement_id` |
| `snapshots` | Capturas longitudinales del estado | `engagement_id` |
| `frictions` | Fricciones detectadas en T3 | `engagement_id` |

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
| `001_foundation.sql` | Schema base: profiles, engagements, members, company_profiles, frictions, T1, stakeholders, value_streams, use_cases, t5_canvas, iso42001_controls | ✅ DEV + PRO |
| `002_snapshots.sql` | Sistema de snapshots longitudinales | ✅ DEV + PRO |
| `003_t1_multiinterviewee.sql` | T1 multi-entrevistado: interviewee_id + interviewee_type | ✅ DEV + PRO |
| `004_companies_and_rename.sql` | Tabla company_profiles + renombrado de columnas | ✅ DEV + PRO |
| `005_company_wide_access.sql` | company_id en members + auto-add usuarios de empresa | ✅ DEV + PRO |
| `006_performance_indexes.sql` | Índices en engagement_id, company_id, created_at | ✅ DEV + PRO |
| `007_stakeholder_unofficial_tools.sql` | Campo unofficial_tools en stakeholders (Shadow AI) | ✅ DEV + PRO |
| `008_roles_four_tier.sql` | Sistema de 4 roles (ADR-008) | ✅ DEV + PRO |
| `20260527_security_persistence.sql` | Persistencia de sesión y seguridad | ✅ DEV + PRO |
| `20260527_security_persistence_v2.sql` | Fix: ajustes de persistencia | ✅ DEV + PRO |
| `20260527_security_persistence_v3.sql` | Fix: ajustes finales de persistencia | ✅ DEV + PRO |
| `20260527_security_persistence_v3_1.sql` | Hotfix: seguridad persistencia | ✅ DEV + PRO |

> **FASE2_verify_indexes.sql, FASE3_add_missing_indexes.sql** — scripts de verificación/mantenimiento, no migraciones de esquema.

---

## Reglas de Datos por Entorno

### PRO — Production (datos reales, sagrados)
- Contiene datos reales de clientes.
- Acceso directo (SQL Editor) solo para: migraciones validadas en DEV → PRE → PRO. Sin acceso ad-hoc.
- **Nunca** copiar a PRE o DEV sin proceso de anonimización documentado.
- Backups: automáticos via Supabase (verificar en Dashboard → Database → Backups).
- Claude no ejecuta queries directas en PRO. Proporciona SQL para que Carlos lo ejecute.

### PRE — Pre-production (datos sintéticos)
- `VITE_DEMO_ENABLED=true` → datos demo de `src/data/demo/scenarios/`.
- Puede resetearse libremente. Sin datos reales de clientes.
- Para QA y demos a potenciales clientes.

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

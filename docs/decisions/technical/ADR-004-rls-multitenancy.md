# ADR-004: Row Level Security (RLS) como modelo de multi-tenancy

**Status:** ACCEPTED
**Date:** 2026-04-19
**Proposed by:** Claude (co-arquitecto técnico)
**Approved by:** Carlos Sánchez (COO) — 2026-04-19
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01. Documenta la decisión D3 de ARQUITECTURA.md.

---

## Context

El sistema es multi-tenant desde el día 1: múltiples empresas cliente con sus propios engagements, usuarios y datos, todos en la misma base de datos. La separación de datos entre tenants es un requisito de seguridad crítico — una empresa no puede ver datos de otra.

Opciones disponibles en Supabase/PostgreSQL:
- RLS (Row Level Security) — policies a nivel de fila en cada tabla
- Esquema separado por tenant — base de datos aislada lógicamente por empresa
- Instancia separada por tenant — Supabase project por cliente

Contexto adicional: Carlos no usa CLI, y la gestión de 1 proyecto Supabase por cliente escalaría rápidamente fuera de control. El MVP tiene < 20 clientes en el horizonte visible.

## Decision

**Row Level Security (RLS) de PostgreSQL como modelo principal de multi-tenancy**, con `engagement_id` y `company_id` como discriminadores de tenant en todas las tablas relevantes.

Ruta de promoción documentada (sin comprometerse ahora): si un cliente enterprise exige aislamiento de esquema o instancia, se puede migrar ese tenant específico sin afectar al resto. Esta decisión no bloquea esa evolución futura.

Las policies RLS están en `supabase/policies/` y se aplican en cada migración relevante.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **RLS (fila por fila)** | Nativo en PostgreSQL/Supabase; gestionable desde Dashboard; no requiere infraestructura adicional por cliente | Complejidad de diseño de policies; `SERVICE_ROLE_KEY` bypassa RLS (debe protegerse) | — (elegida) |
| Esquema por tenant | Aislamiento perfecto del esquema | Un Supabase project = múltiples esquemas → complejidad de gestión; sin soporte nativo en Supabase para múltiples esquemas de tenant | Inmanejable sin CLI y con < 20 clientes |
| Proyecto Supabase por tenant | Aislamiento total, facturación por cliente | 1 dashboard por cliente = gestión caótica; credenciales múltiples; inviable en MVP | Complejidad operativa extrema |

## Consequences

### Positive
- Un único proyecto Supabase gestiona todos los tenants — facturación simple, dashboard único
- Las policies RLS garantizan que ningún usuario puede ver datos de otro tenant aunque la query sea incorrecta
- Supabase genera el token JWT con el `user_id` — las policies lo usan automáticamente
- La función `is_engagement_member()` centraliza la lógica de acceso reutilizable

### Negative / Trade-offs accepted
- Cada nueva tabla debe tener sus policies RLS configuradas — si se olvida, los datos quedan expuestos
- `SUPABASE_SERVICE_ROLE_KEY` bypassa todas las RLS policies — uso prohibido en código cliente (red flag en CLAUDE.md)
- Las policies incorrectas son difíciles de depurar — requieren tests de acceso desde diferentes roles

### Constraints introduced
- TODA tabla con datos de engagement o empresa DEBE tener RLS habilitado y policies configuradas
- Antes de ejecutar cualquier migration que crea una tabla, verificar que incluye `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` y las policies correspondientes
- El archivo de policies va en `supabase/policies/` y se referencia en el migration file
- Red flag: si detectas una tabla sin RLS habilitado en producción → STOP y reportar inmediatamente

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

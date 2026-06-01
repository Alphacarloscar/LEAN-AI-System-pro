# ADR-002: Supabase como backend único

**Status:** ACCEPTED
**Date:** 2026-04-19
**Proposed by:** Claude (co-arquitecto técnico)
**Approved by:** Carlos Sánchez (COO) — 2026-04-19
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01. Documenta la decisión de Sprint 0 (ARQUITECTURA.md sección 3.5).

---

## Context

El sistema requiere: base de datos relacional con soporte JSONB, autenticación con MFA, storage para PDFs y adjuntos, funciones serverless para IA, y realtime para el dashboard T10. Todo esto con un único developer humano sin acceso a terminal que no puede gestionar infraestructura compleja.

Además: las migraciones SQL deben poder ejecutarse desde un editor web (Supabase SQL Editor), no desde CLI. El sistema es multi-tenant desde el día 1 con RLS.

## Decision

**Supabase como plataforma backend completa**: PostgreSQL 15 (BD relacional + JSONB), GoTrue (Auth + MFA), PostgREST (API REST automática), Realtime (websockets), Storage (archivos), Edge Functions (Deno, lógica serverless para IA).

Un solo proveedor elimina la complejidad de integrar múltiples servicios. Supabase es open-source compatible con PostgreSQL estándar — si en el futuro se necesita migrar, el esquema SQL es portable. El SQL Editor de Supabase Dashboard permite a Carlos ejecutar migraciones sin CLI.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Supabase** | BD + Auth + Storage + Realtime + Edge en un solo proveedor; SQL Editor web; RLS nativo; open-source | Vendor lock-in moderado; Edge Functions en Deno (diferente de Node.js) | — (elegida) |
| Firebase + Firestore | Excelente realtime, sin SQL | NoSQL dificulta queries complejas entre herramientas T1-T13; sin SQL Editor | El dominio requiere relaciones complejas (grafo de dependencias T1-T13) |
| Prisma + Neon + Auth0 | Máxima flexibilidad | 3 proveedores = 3 facturaciones, 3 dashboards, integración manual | Complejidad inmanejable para un solo developer sin CLI |
| PlanetScale + Clerk | MySQL con branching, Auth excelente | No soporta JSONB nativo; otro proveedor más | Stack fragmentado innecesariamente |

## Consequences

### Positive
- Un solo dashboard web para toda la infraestructura de backend
- RLS de PostgreSQL implementa multi-tenancy sin código adicional
- PostgREST genera API automáticamente — Claude no necesita escribir endpoints REST
- Migraciones ejecutables desde SQL Editor (compatible con ADR-005 no-CLI)
- Backups automáticos incluidos en el plan Supabase
- Edge Functions (Deno) para lógica serverless de IA (Claude API — ADR-009)

### Negative / Trade-offs accepted
- Edge Functions en Deno (no Node.js) — sintaxis ligeramente diferente para módulos
- Vendor dependency: si Supabase cambia precios o cierra, migración necesaria (mitigado: PostgreSQL estándar)
- `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS — nunca debe usarse en código cliente (red flag en CLAUDE.md)

### Constraints introduced
- NUNCA importar `@supabase/supabase-js` directamente en componentes. Siempre a través de `src/lib/supabase.ts` (punto único de conexión — D5 de ARQUITECTURA.md)
- Toda la lógica de negocio que acceda a BD debe pasar por `src/services/` — no queries directas en componentes
- Queries a producción: nunca `SELECT *` en tablas grandes sin WHERE acotado

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

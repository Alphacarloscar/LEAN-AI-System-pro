# ADR-006: Dos proyectos Supabase separados desde el día 1 (PRO / DEV)

**Status:** ACCEPTED
**Date:** 2026-04-19
**Proposed by:** Claude (co-arquitecto técnico)
**Approved by:** Carlos Sánchez (COO) — 2026-04-19
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01. Documenta la decisión D6 de ARQUITECTURA.md.

---

## Context

Durante el desarrollo activo de un sistema con clientes reales, existe el riesgo permanente de que cambios en desarrollo contaminen datos de producción o que errores en migraciones afecten a usuarios reales. La solución estándar es separar los entornos de base de datos.

En Supabase, la unidad de aislamiento es el "proyecto" (project), que incluye BD, Auth, Storage y Edge Functions independientes. Crear 2 proyectos desde el inicio es más barato y más seguro que hacerlo después de tener datos en producción.

Coste adicional: ~$25/mes para el segundo proyecto en plan Pro de Supabase.

## Decision

**Dos proyectos Supabase separados**: uno para producción (PRO) y uno para desarrollo/staging (DEV). El proyecto DEV se usa tanto para desarrollo local (`.env.local`) como para staging (rama `develop` en Vercel). Un tercer proyecto PRE se creará cuando el volumen de clientes lo justifique.

Rama `main` → proyecto PRO → lean-ai.consultoriaalpha.com
Rama `develop` → proyecto DEV → Vercel preview automático
Local → proyecto DEV (mismas credenciales que develop)

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **2 proyectos Supabase (PRO + DEV)** | Aislamiento completo PRO/DEV; iteración agresiva en DEV sin riesgo; ~$25/mes adicional | 2 sets de credenciales a gestionar; migraciones deben aplicarse en ambos | — (elegida) |
| 1 proyecto + esquemas separados | Sin coste adicional | Supabase no soporta Auth/Storage/Edge separados por esquema; contaminación de datos posible | No hay aislamiento real entre entornos |
| 1 proyecto + datos demo vs reales | Sin coste | Riesgo permanente de contaminar datos PRO; no hay separación de Auth entre entornos | Inaceptable con clientes reales |
| 3 proyectos (PRO + PRE + DEV) | Separación máxima | Triple coste; 2 sets de credenciales de staging a gestionar | Justificado solo cuando el volumen lo requiera — decisión postergada |

## Consequences

### Positive
- Iteración agresiva en DEV/PRE sin riesgo para clientes PRO
- Datos de producción nunca se mezclan con datos de desarrollo
- Auth separada: usuarios de prueba no aparecen en el panel PRO
- Edge Functions se pueden probar en DEV antes de deployar en PRO
- PRE/DEV opera siempre contra datos sintéticos del proyecto Supabase de desarrollo

### Negative / Trade-offs accepted
- Las migraciones SQL deben aplicarse en AMBOS proyectos (DEV primero, PRO después de validar)
- 2 sets de credenciales en `.env.local` y Vercel Dashboard
- Riesgo de divergencia de esquema si se aplica una migración solo en uno de los proyectos

### Constraints introduced
- El protocolo de migraciones es obligatorio: DEV → validar → PRO (ver MIGRATIONS.md)
- NUNCA aplicar una migración en PRO sin haberla probado en DEV primero
- Las credenciales de PRO (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) se configuran en Vercel Dashboard para `main` branch
- Las credenciales de DEV se configuran en Vercel Dashboard para `develop` branch y en `.env.local` para desarrollo local

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

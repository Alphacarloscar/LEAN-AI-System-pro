# ADR-003: Modelo de datos híbrido — Foreign Keys estructurales + JSONB flexible

**Status:** ACCEPTED
**Date:** 2026-04-19
**Proposed by:** Claude (co-arquitecto técnico)
**Approved by:** Carlos Sánchez (COO) — 2026-04-19
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01. Documenta la decisión D2 de ARQUITECTURA.md.

---

## Context

El GOBY tiene 13 herramientas (T1-T13) con estructuras de datos muy distintas entre sí. Algunas son comparables entre clientes (T1: scores de dimensiones, T2: stakeholders con cuadrantes), otras tienen payloads altamente variables por sector/empresa (T5: canvas de taxonomía IA, T9: roadmap). 

Requisitos en tensión:
- **Comparabilidad entre engagements**: necesaria para benchmarking agregado y analytics del sistema (T10)
- **Flexibilidad por herramienta**: cada herramienta produce outputs con estructura específica que puede evolucionar
- **Trazabilidad ISO 42001**: el grafo de dependencias T1→T2→T3→... requiere foreign keys reales, no referencias en texto
- **Evolución sin migraciones destructivas**: añadir campos a T7 no debe requerir ALTER TABLE en tablas con datos de producción

## Decision

**Modelo híbrido**: Foreign Keys relacionales para las entidades estructurales que son comparables entre clientes (engagement, profiles, company_profiles, snapshots), y columnas JSONB para los payloads específicos de cada herramienta que son variables o pueden crecer.

Regla de decisión: si el campo se usa en queries de filtrado, JOIN, o índice → FK/columna tipada. Si el campo es un payload de output de herramienta que solo se lee completo → JSONB.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Híbrido FK + JSONB** | Comparabilidad estructural + flexibilidad de payload; índices en campos clave; JSONB consultable con operadores PostgreSQL | Más complejo de diseñar que un modelo puro | — (elegida) |
| Esquema relacional puro | Máxima integridad referencial, queries simples | Requiere ALTER TABLE para cada campo nuevo en cualquier herramienta; 13 herramientas × N campos = complejidad de migraciones inmanejable | Rigidez incompatible con velocidad de iteración |
| JSONB puro (document store) | Flexibilidad total, zero migraciones de esquema | Sin comparabilidad entre clientes; sin índices en campos clave; rompe trazabilidad ISO 42001 | Pierde el valor diferencial del sistema |
| Esquema separado por herramienta | Aislamiento perfecto | 13+ esquemas = gestión imposible en Supabase Dashboard; no hay JOINs entre herramientas | Rompe el grafo de dependencias T1-T13 |

## Consequences

### Positive
- Los snapshots longitudinales (T1, T2, T3) tienen FK reales a `engagements` → comparabilidad para analytics
- JSONB para payloads de T4-T13 permite añadir campos sin migración
- RLS funciona correctamente sobre las tablas estructurales (FK a `engagement_id`)
- Índices en `engagement_id`, `company_id`, `created_at` para queries frecuentes (migración 006_performance_indexes.sql)
- Compatible con ISO 42001: trazabilidad de inputs → outputs entre herramientas

### Negative / Trade-offs accepted
- El diseño requiere pensar por adelantado qué campos van en FK vs JSONB
- Las columnas JSONB no tienen constraint de tipo en BD — la validación es responsabilidad del servicio TypeScript

### Constraints introduced
- Todo campo que se use en un WHERE o JOIN debe ser columna tipada, no campo de JSONB
- Los payloads JSONB de cada herramienta deben tener su tipo TypeScript en `src/types/`
- Al crear una nueva herramienta T[N], la decisión FK vs JSONB debe documentarse en el comentario del migration file

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

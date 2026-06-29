# ADR-024: Rutas T1-T12 requieren parámetro :engagementId

**Status:** ACCEPTED
**Date:** 2026-06-29
**Proposed by:** Equipo GOBY (refactor v2.1.0 "atomic-screen-independence")
**Approved by:** Carlos Sánchez — 2026-06-29
**Supersedes:** —
**Superseded by:** —

---

## Context

El refactor v2.1.0 ("atomic-screen-independence") convirtió todas las rutas de herramienta de `/tN` a `/tN/:engagementId`. El objetivo era que cada pantalla pudiera cargarse de forma autónoma sin depender del estado global del store de selección de engagement.

Sin el parámetro `:engagementId` en la URL, el router redirige al fallback `/` (T10 — Dashboard). Esto afectó a todos los specs E2E que navegaban a `/tN` directamente, causando ~27 timeouts porque el ToolHeader nunca montaba su `<h1>`.

## Decision

Todas las rutas T1-T12 (y sus sub-rutas) deben incluir obligatoriamente el parámetro `:engagementId`. No existe ruta válida `/tN` sin id.

Cualquier navegación programática — en código de aplicación, specs E2E, scripts de seed o documentación de ejemplo — debe usar la forma `/tN/:engagementId`.

La constante `LAB_PROJECT_ID` exportada desde `e2e/helpers.ts` es el identificador canónico para el entorno de laboratorio E2E.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Ruta con :engagementId obligatorio** | Carga autónoma, URL compartible, sin estado global implícito | Tests deben incluir el id | — (elegida) |
| Ruta sin id + store global | Specs más simples | Acoplamiento implícito al store; pantalla no compartible por URL | Incompatible con atomic-screen-independence |
| Ruta opcional `/:engagementId?` | Retrocompatibilidad | Fallback ambiguo; oculta errores de navegación | Rechazada para mantener la invariante explícita |

## Consequences

### Positive
- Cada pantalla de herramienta es autónoma y compartible por URL.
- El engagement activo es siempre explícito en la URL, facilitando debug y reproducción de errores.
- Elimina la dependencia implícita del store de selección al montar la vista.

### Negative / Trade-offs accepted
- Todo código que navegue a una herramienta debe conocer el engagementId en el momento de la navegación.
- Los specs E2E deben importar y usar `LAB_PROJECT_ID` explícitamente.

### Constraints introduced
- **PROHIBIDO** crear rutas `/tN` sin `:engagementId` en `src/App.tsx` ni en specs E2E.
- Cualquier nuevo spec que navegue a T1-T12 debe usar `LAB_PROJECT_ID` de `e2e/helpers.ts`.
- La constante `LAB_PROJECT_ID` en `e2e/helpers.ts` debe mantenerse sincronizada con el proyecto seed del entorno E2E.

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

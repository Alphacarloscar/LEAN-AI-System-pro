# FDR-001: BackToDashboard como control canónico de "Volver al dashboard"

**Status:** ACCEPTED
**Date:** 2026-06-05
**Proposed by:** Claude (co-arquitecto) + Carlos Sánchez (COO)
**Approved by:** Carlos Sánchez (COO) — 2026-06-05
**Related ADR:** —

---

## Context

La acción "Volver al dashboard" estaba implementada como 13 botones hand-rolled distintos repartidos por T1–T9, T11, T12 y CompanyProfile. La auditoría (P1, Sprint 11) encontró divergencia en 7 dimensiones: forma (inline texto+icono vs botón redondo solo-icono en T3/T4), texto ("Volver al dashboard" / "Volver al Dashboard" / "Volver" / sin texto), geometría del icono (3 SVG distintos), grosor de trazo, tamaño tipográfico, tokens de color y patrón de handler onClick.

Funcionalmente todas las variantes eran equivalentes: en `App.tsx` cada vista recibe `onBack={() => navigate('/')}`, así que todas terminaban navegando a `/`. La divergencia era 100% cosmética/estructural, pero generaba inconsistencia visible justo en las superficies de la primera demo con clientes reales (semana del 9-jun-2026).

## Decision

`src/shared/components/BackToDashboard.tsx` es el **único** control permitido para la acción "Volver al dashboard". Patrón canónico: inline icono (chevron 16×16) + texto "Volver al dashboard", tipografía `text-xs font-medium`, tokens `text-text-muted` / hover `text-lean-black`. Navega a `/` por defecto; acepta `onClick` opcional para preservar el contrato `onBack`, y `className` para márgenes contextuales.

A partir de aquí, ninguna herramienta nueva (T1–T12 o futuras) debe crear una variante manual de este control. Cualquier cabecera que necesite vuelta al dashboard reutiliza `BackToDashboard`.

**El texto es fijo y NO parametrizable.** La etiqueta "Volver al dashboard" está hardcodeada en el componente; no existe prop `label`. Esto es deliberado: un `label` abierto reintroduciría por la puerta de atrás las variantes de texto ("Volver", "Dashboard", "Ir al dashboard"…) que P1 eliminó. Las únicas props son `onClick?` (solo para delegar en el `onBack` canónico del parent, que ya equivale a `navigate('/')`) y `className?` (ajustes de layout).

## User impact

- **consultor_alpha:** mismo control, idéntico en las 12 herramientas — menos fricción cognitiva al saltar entre tools en una sesión de delivery.
- **pm_cliente:** en T3 y T4 el botón pasa de un icono redondo diminuto a un objetivo con texto, más fácil de descubrir y clicar en su primera sesión.
- **viewer_csuite:** coherencia visual en la demo; nada que aprender por herramienta.
- **admin_alpha / superadmin:** sin cambio de comportamiento.

Navegación, contexto de empresa/proyecto y permisos no cambian: el destino (`/`) es idéntico al de antes.

## Alternatives considered

| Option | User benefit | Risk | Why rejected |
|--------|-------------|------|--------------|
| **Componente único inline texto+icono (elegida)** | Coherencia + mayor área de click; patrón dominante (9/11) | Convertir T3/T4 desde icon-only | — (elegida) |
| Componente con variantes (inline + icon-only) | Flexibilidad | Perpetúa dos patrones → superficie de inconsistencia futura | Contradice el objetivo de unificar |
| Mantener botón redondo icon-only en todos | Más minimalista | Área de click diminuta (ya marcada en AUDIT Sprint 4) | Peor discoverability en demo |

## Consequences

### Positive
- Una sola fuente de verdad para el control; cambios de estilo se hacen en un fichero.
- Elimina la causa de la fragmentación más visible antes de las demos.
- Base sobre la que colgará el futuro `ToolHeader` canónico (ver DEBT-003).

### Negative / Trade-offs accepted
- Los 12 headers siguen siendo hand-rolled en lo demás (badge T[N], breadcrumb, PhaseMiniMap); este FDR solo cubre el back button. La duplicación de cabecera completa queda como deuda registrada (DEBT-003), diferida a post-demo por riesgo de regresión sin tests automatizados (DEBT-001).

---
*AI-Ready Repository System v2.1.0 — docs/decisions/functional/*

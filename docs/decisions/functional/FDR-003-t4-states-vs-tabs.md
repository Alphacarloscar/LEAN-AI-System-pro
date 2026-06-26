# FDR-003: T4 — Separación visual entre estados del caso y tabs de navegación

**Status:** ACCEPTED
**Date:** 2026-06-16
**Proposed by:** Carlos Sánchez (Alpha Consulting)
**Approved by:** Carlos Sánchez — 2026-06-16
**Related ADR:** ADR-020 (UX/UI Strategy Master Plan), ADR-021 (Design System Charter)

---

## Context

En `UseCaseDetailPanel` (T4), dos grupos de controles interactivos convivían en la cabecera del panel sin una jerarquía visual clara:

1. **Grupo de estado** — botones pill para `Go / En piloto / Priorizado / Candidato / No-Go / Completado`.  
   Son **atributos del caso de uso**: cambian el estado del objeto de negocio.

2. **Grupo de navegación** — tabs `Scoring / Economía / Hoja de ruta / Contexto T1/T2 / AI Act`.  
   Son **secciones de la vista**: organizan la información del panel dentro de la misma pantalla.

El usuario no podía distinguir a primera vista qué controles modifican el caso y cuáles navegan. Esto es especialmente crítico porque cambiar el estado activa un modal de clasificación AI Act, mientras que cambiar el tab solo alterna contenido.

---

## Decision

### Estado del caso → `SegmentedControl` con label "Estado:" explícito

- Se sustituyen los botones pill manuales por el componente `SegmentedControl` del Design System.
- Label `"Estado:"` aparece a la izquierda del control (texto `text-[10px] font-mono uppercase text-text-subtle`).
- Cada opción tiene un `activeColor` hexadecimal que indica el grupo semántico:

| Opción | Color activo | Semántica |
|--------|-------------|-----------|
| Go | `#5FAF8A` (success) | Aprobado para implementación |
| En piloto | `#D4A85C` (warning) | En ejecución piloto |
| Priorizado | `#6A90C0` (info) | Aprobado, pendiente de arranque |
| Candidato | `#94A3B8` (neutral) | En evaluación |
| No-Go | `#C06060` (danger) | Descartado |
| Completado | `#2A5C8A` (navy) | Finalizado |

- El `SegmentedControl` usa `aria-label="Estado del caso de uso"` y `size="sm"`.

### Tabs de navegación → `Tabs` del DS con `variant="underline"`

- Se sustituye el `Tabs` con variante por defecto (`pill`) por `variant="underline"`.
- El underline navy (`border-navy`) distingue visualmente la navegación del atributo "Estado".
- El `aria-label` queda como `"Secciones del caso de uso"` (ya existente).

---

## User impact

El cambio es puramente visual — no altera el modelo de datos ni los permisos.

- **consultor_alpha / pm_cliente:** Distinguen instantáneamente "qué es el estado del caso" vs. "en qué sección estoy mirando". Reducción de clics erróneos al cambiar estado.
- **viewer_csuite:** Read-only; ve el estado con color semántico (verde/naranja/rojo) sin acceso de edición — sin impacto funcional.
- **admin_alpha / superadmin:** Comportamiento idéntico al consultor.

---

## Alternatives considered

| Option | User benefit | Risk | Why rejected |
|--------|-------------|------|--------------|
| **SegmentedControl + Tabs underline** | Semántica clara, uses DS existente, 0 dependencias nuevas | Cambio visual (usuarios deben reaprender posición) | — (elegida) |
| Mantener status quo (dos grupos de pills) | Sin cambio cognitivo para usuarios actuales | Confusión persistente entre estado y navegación | UX ambigua; no cumple ADR-020 §5 (jerarquía visual) |
| Mover estado al header global (ToolHeader) | Estado visible en todo momento | ToolHeader no recibe estado por caso individual sin refactor mayor | Demasiado invasivo para este cambio |

---

## Consequences

### Positive
- Clara jerarquía visual: estado = atributo (control izquierda), tabs = navegación (control inferior, underline).
- Color semántico del estado sin leer el texto (accesibilidad perceptual).
- Usa componentes DS existentes — 0 componentes nuevos.
- `role="radiogroup"` en SegmentedControl + `role="tablist"` en Tabs: aria correcta sin trabajo adicional.

### Negative / Trade-offs accepted
- El cambio de `pill` a `underline` en Tabs requiere que el contenedor gestione el borde inferior (línea separadora). Se incluye `border-b border-border` en el wrapper del tablist.

---

*AI-Ready Repository System v2.1.0 — docs/decisions/functional/*

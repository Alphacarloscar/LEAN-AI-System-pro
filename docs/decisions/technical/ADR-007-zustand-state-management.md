# ADR-007: Zustand para gestión de estado global

**Status:** ACCEPTED
**Date:** 2026-04-19
**Proposed by:** Claude (co-arquitecto técnico)
**Approved by:** Carlos Sánchez (COO) — 2026-04-19
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01. Inferido de package.json + src/stores/.

---

## Context

El sistema tiene 13 herramientas (T1-T13) con estado compartido entre ellas: un engagement activo, datos de empresa, perfiles de usuario, y resultados de herramientas que son inputs para otras (T1 → T2 → T3...). Se necesita estado global que:
- Evite prop drilling excesivo entre componentes de diferentes herramientas
- Sea sencillo de entender y mantener para AI-assisted development
- No requiera boilerplate excesivo (actions, reducers, dispatchers)
- Soporte TypeScript con tipado completo
- Permita reset limpio al cambiar de engagement o hacer logout

## Decision

**Zustand 5 para estado global** con stores separados por dominio en `src/stores/`. Un store por contexto de datos: `AuthStore`, `CompanyStore`, `EngagementStore`, y stores específicos por herramienta cuando sea necesario.

La función `resetEngagementStores()` en `src/lib/resetEngagementStores.ts` limpia todos los stores al cambiar de engagement o hacer logout — patrón central para evitar contaminación de datos entre proyectos.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Zustand 5** | API mínima (hooks nativos); TypeScript nativo; zero boilerplate; bundle ~3KB; fácil de resetear | Menos estructura que Redux — puede crecer sin control si no se define arquitectura de stores | — (elegida) |
| Redux Toolkit | Estándar de la industria; DevTools potentes; patrón bien definido | Boilerplate excesivo para el tamaño del proyecto; actions/reducers/slices para operaciones simples | Overhead innecesario; más difícil de mantener por AI |
| React Context + useReducer | Sin dependencias adicionales | Context causa re-renders en todo el árbol de componentes; sin DevTools; complejo para estado global múltiple | Rendimiento inaceptable con 13 herramientas activas |
| Jotai / Recoil | Modelo atómico, re-renders mínimos | Menos training data para Claude; menor ecosistema | Menor familiaridad del AI co-arquitecto |

## Consequences

### Positive
- Cada herramienta T[N] puede suscribirse solo al slice de estado que necesita — re-renders mínimos
- El reset global via `resetEngagementStores()` es una sola línea — elimina bugs de estado sucio entre proyectos
- Zustand persiste fácilmente a localStorage/sessionStorage si se necesita en el futuro
- API de hooks directos: `const { engagement } = useEngagementStore()` — sin HOCs ni providers extra

### Negative / Trade-offs accepted
- Sin la estructura de Redux, el equipo (Claude) debe ser disciplinado en la arquitectura de stores
- Los stores pueden crecer sin límite si no se aplica la regla: un store por dominio de datos
- El estado de Zustand no persiste en refresh (sin configurar) — aceptable para datos de sesión

### Constraints introduced
- **Un store por dominio**: `AuthStore`, `CompanyStore`, `EngagementStore`, stores de herramienta cuando sea necesario. No stores genéricos tipo `AppStore` con todo mezclado
- Los stores van en `src/stores/` — nunca inline en componentes
- Al hacer logout o cambiar de engagement: llamar `resetEngagementStores()` — obligatorio
- Los stores deben ser completamente tipados con TypeScript — sin `any` en el estado

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

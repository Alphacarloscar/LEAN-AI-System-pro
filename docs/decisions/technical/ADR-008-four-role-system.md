# ADR-008: Sistema de 4 roles de usuario (superadmin / consultant / client_editor / client_viewer)

**Status:** ACCEPTED
**Date:** 2026-05-01
**Proposed by:** Claude (co-arquitecto técnico)
**Approved by:** Carlos Sánchez (COO) — 2026-05-01
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01. Evidencia: commit feat(admin) + migración 008_roles_four_tier.sql.

---

## Context

El sistema tiene múltiples tipos de usuarios con niveles de acceso muy diferentes:
- **Fundadores de Alpha** (Carlos + Óscar): acceso total a todos los clientes y engagements
- **Consultores de Alpha**: acceso a los engagements que gestionan
- **PMs y líderes del cliente**: pueden editar datos de su empresa
- **Ejecutivos del cliente (C-suite)**: solo lectura, vista de outputs y dashboards

El sistema original tenía 5 arquetipos conceptuales pero se implementaron 4 roles técnicos que los mapean. La migración 008 consolidó un sistema anterior de roles más simple.

## Decision

**4 roles técnicos en `profiles.role`**:

| Rol | Acceso | Quién lo usa |
|-----|--------|-------------|
| `superadmin` | Todo — sin restricciones | Carlos + Óscar (fundadores Alpha) |
| `consultant` | Sus engagements asignados — lectura + escritura | Consultores de Alpha |
| `client_editor` | Engagement de su empresa — lectura + escritura | PM cliente / Technical Leader |
| `client_viewer` | Engagement de su empresa — solo lectura | C-suite del cliente |

`isReadOnly` global: hook en `src/shared/hooks/` que detecta `client_viewer` y activa estado solo-lectura en todas las herramientas T1-T13 simultáneamente.

El sistema de invitación de usuarios (`invite-user` Edge Function) maneja el flujo de onboarding de nuevos usuarios — asigna rol en el momento de la invitación.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **4 roles** | Cubre todos los casos de uso MVP; `isReadOnly` simplifica implementación en todas las herramientas | Menos granular que RBAC completo | — (elegida) |
| RBAC por permisos granulares | Máxima flexibilidad; permisos por herramienta | Complejidad de gestión alta; UI de administración compleja | Sobreingeniería para MVP con < 20 clientes |
| 2 roles (admin / user) | Mínima complejidad | No cubre separación Alpha/cliente ni lectura vs escritura | Insuficiente para el modelo de negocio |
| 5 roles (añadir `admin_alpha` separado) | Separación explícita entre superadmin y admin Alpha | Un rol más en un sistema pequeño; poca diferencia práctica con superadmin | Simplificado en la implementación real |

## Consequences

### Positive
- El hook `isReadOnly` permite implementar read-only en una herramienta nueva con una línea
- `ViewerEmptyState` componente reutilizable para estados vacíos de `client_viewer`
- RLS policies pueden usar `role` directamente en las conditions
- Flujo de invitación via Edge Function — Carlos puede invitar clientes desde el panel admin sin CLI

### Negative / Trade-offs accepted
- Si en el futuro un `client_editor` necesita acceso a solo algunas herramientas, se necesitará un ADR nuevo para permisos por herramienta
- `superadmin` tiene acceso total — solo 2 personas deben tener este rol (Carlos + Óscar)

### Constraints introduced
- Los roles deben ser exactamente estos 4 strings en `profiles.role`: `superadmin`, `consultant`, `client_editor`, `client_viewer`
- Cualquier nueva herramienta T[N] DEBE respetar el hook `isReadOnly` — un `client_viewer` nunca debe poder modificar datos
- Los usuarios de Alpha usan `consultant` o `superadmin` — nunca `client_editor`/`client_viewer`
- Cambios al sistema de roles requieren ADR nuevo (este se convertiría en SUPERSEDED)

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*

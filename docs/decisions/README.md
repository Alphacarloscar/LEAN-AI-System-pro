# Decision Log — GOBY

AI-Ready Repository System v2.1.0 | Última actualización: 2026-06-26

> Este directorio contiene el registro completo de decisiones técnicas (ADR) y funcionales (FDR)
> del proyecto. Toda decisión arquitectónica o de producto con impacto duradero debe tener un
> documento aquí antes de ejecutarse.

---

## Cómo usar este registro

**Leer antes de empezar a trabajar:** revisa las últimas entradas para conocer el contexto reciente.

**Crear un ADR cuando** el cambio afecte a: stack, esquema de BD, seguridad, arquitectura de módulos, infraestructura, dependencias principales.

**Crear un FDR cuando** el cambio afecte a: comportamiento visible para el usuario, roles y permisos, lógica de negocio, definición de herramientas T1-T13, arquetipos de stakeholder.

**Templates:**
- ADR: `technical/ADR-000-template.md`
- FDR: `functional/FDR-000-template.md`

---

## Decisiones Técnicas (ADR)

| ID | Título | Estado | Fecha | Área |
|----|--------|--------|-------|------|
| [ADR-001](technical/ADR-001-react-vite-typescript-stack.md) | React 18 + Vite + TypeScript como stack frontend | ACCEPTED | 2026-04-19 | Stack |
| [ADR-002](technical/ADR-002-supabase-as-sole-backend.md) | Supabase como backend único | ACCEPTED | 2026-04-19 | Infraestructura |
| [ADR-003](technical/ADR-003-hybrid-data-model-fk-jsonb.md) | Modelo de datos híbrido FKs + JSONB | ACCEPTED | 2026-04-19 | Esquema |
| [ADR-004](technical/ADR-004-rls-multitenancy.md) | Row Level Security para multi-tenancy | ACCEPTED | 2026-04-19 | Seguridad |
| [ADR-005](technical/ADR-005-no-cli-workflow.md) | Workflow sin CLI — solo GitHub/Vercel/Supabase web | ACCEPTED | 2026-04-19 | Workflow |
| [ADR-006](technical/ADR-006-two-supabase-environments.md) | 2 entornos Supabase separados (PRO/DEV) | ACCEPTED | 2026-04-19 | Infraestructura |
| [ADR-007](technical/ADR-007-zustand-state-management.md) | Zustand para estado global | ACCEPTED | 2026-04-19 | Arquitectura |
| [ADR-008](technical/ADR-008-four-role-system.md) | Sistema de 4 roles de usuario | ACCEPTED | 2026-05-01 | Seguridad |
| [ADR-009](technical/ADR-009-claude-api-via-edge-functions.md) | Claude API vía Supabase Edge Functions | ACCEPTED | 2026-05-15 | IA/Infraestructura |
| [ADR-016](technical/ADR-016-vite-build-target-es2022.md) | Establecer build.target es2022 para compatibilidad esbuild >=0.28 | ACCEPTED | 2026-06-13 | Stack |
| [ADR-017](technical/ADR-017-audit-logging-proxy.md) | Sistema de Audit Logging transversal mediante patrón Proxy | ACCEPTED | 2026-06-15 | Infraestructura |
| [ADR-018](technical/ADR-018-audit-log-retention-pg-cron.md) | Política de retención de audit_logs: 90 días activos + 5 años archivo via pg_cron | ACCEPTED | 2026-06-15 | Infraestructura |
| [ADR-019](technical/ADR-019-audit-logs-read-security-definer.md) | Acceso a audit_logs exclusivamente vía función SECURITY DEFINER | ACCEPTED | 2026-06-15 | Seguridad |
| [ADR-020](technical/ADR-020-ux-ui-strategy-master-plan.md) | Plan Maestro de Estrategia UX/UI y Sistema de Diseño | IN PROGRESS | 2026-06-16 | UX/UI · Stack |
| [ADR-021](technical/ADR-021-design-system-charter.md) | Design System Charter — escala space, tokens CSS vars, densidad configurable | ACCEPTED | 2026-06-16 | UX/UI · Stack |
| [ADR-022](technical/ADR-022-forms-rhf-zod-standard.md) | Estándar de formularios: react-hook-form + Zod | ACCEPTED | 2026-06-16 | Stack · UX/UI |
| [ADR-023](technical/ADR-023-visual-system-v2.md) | Visual System V2 — Obsidian Editorial warm-only palette | ACCEPTED | 2026-06-23 | UX/UI · Design System |
| [ADR-024](technical/ADR-024-routes-require-engagement-id.md) | Rutas T1-T12 requieren parámetro :engagementId | ACCEPTED | 2026-06-29 | Arquitectura · E2E |
| [ADR-025](technical/ADR-025-audit-test-mode-awaitable.md) | Modo awaitable de auditoría para E2E (flag `__E2E_AWAIT_AUDIT__`) | ACCEPTED | 2026-06-30 | Audit trail · E2E |
| [ADR-026](technical/ADR-026-functions-invoke-explicit-jwt.md) | `functions.invoke()` debe propagar JWT explícito (Bearer token) | ACCEPTED | 2026-06-30 | Seguridad · Infraestructura |
| [ADR-027](technical/ADR-027-e2e-edge-function-route-interception.md) | Intercepción de Edge Functions en E2E con `page.route()` | ACCEPTED | 2026-07-02 | E2E · Testing |

---

## Decisiones Funcionales (FDR)

| ID | Título | Estado | Fecha | Área |
|----|--------|--------|-------|------|
| [FDR-001](functional/FDR-001-back-to-dashboard-canonical.md) | BackToDashboard — control canónico de vuelta al dashboard | ACCEPTED | 2026-06-05 | UX |
| [FDR-003](functional/FDR-003-t4-states-vs-tabs.md) | T4 — Separación visual entre estado del caso y tabs de navegación | ACCEPTED | 2026-06-16 | UX · T4 |

---

## Decisiones Estratégicas de Producto

Las decisiones estratégicas de producto/mercado se documentan en:
→ `DECISIONES_ESTRATEGICAS.md` (formato propio, complementario a este registro)

---

## Próximo número disponible

- **ADR:** ADR-028
- **FDR:** FDR-002 (reservado por ADR-020 Fase 2 — pantalla piloto AppLayout)

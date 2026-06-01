# Decision Log — L.E.A.N. AI System Enterprise

AI-Ready Repository System v2.1.0 | Última actualización: 2026-06-01

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

---

## Decisiones Funcionales (FDR)

| ID | Título | Estado | Fecha | Área |
|----|--------|--------|-------|------|
| *(primer FDR se creará con el siguiente cambio funcional significativo)* | | | | |

---

## Decisiones Estratégicas de Producto

Las decisiones estratégicas de producto/mercado se documentan en:
→ `DECISIONES_ESTRATEGICAS.md` (formato propio, complementario a este registro)

---

## Próximo número disponible

- **ADR:** ADR-010
- **FDR:** FDR-001

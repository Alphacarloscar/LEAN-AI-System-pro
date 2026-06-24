# Status Report — GOBY
**Período:** Mayo 2026 — Baseline post Sprint 0-6  
**Autor:** Carlos Sánchez (COO) | **Fecha:** 2026-05-21  
**Audiencia:** Alpha Consulting Solutions — dirección

---

## Resumen ejecutivo

El GOBY tiene los 12 módulos de herramienta (T1-T12) implementados y funcionales. La arquitectura base (Supabase, RLS, autenticación, estructura modular) está sólida. La deuda técnica acumulada durante los sprints de desarrollo rápido es significativa pero controlable: los tres riesgos críticos (API key expuesta, cero tests, cero error tracking) son corregibles en 2-3 semanas. El producto está en condiciones de demostrarse a clientes potenciales, pero no de entrar en producción con un cliente enterprise hasta resolver los bloqueantes de seguridad y observabilidad.

---

## Estado global: 🟡 En riesgo

El producto funciona, pero no tiene las salvaguardas mínimas para operar con confianza con clientes reales: sin tests, sin monitoring de errores, y con una API key que puede filtrarse.

---

## KPIs de producto y técnicos

| Métrica | Target | Actual | Estado |
|---------|--------|--------|--------|
| Módulos T1-T12 implementados | 12/12 | 12/12 | 🟢 |
| Tests unitarios | >50 | 0 | 🔴 |
| CI/CD pipeline activo | Sí | No | 🔴 |
| Error tracking (Sentry) | Activo | No instalado | 🔴 |
| Cobertura WCAG 2.1 AA | >80% | ~45% | 🔴 |
| Riesgos críticos de seguridad | 0 | 2 | 🔴 |
| Score técnico global (evaluación) | >6/10 | 4.4/10 | 🟡 |
| Documentación arquitectónica | Completa | ARQUITECTURA.md 42KB | 🟢 |
| RLS activo en todas las tablas | Sí | 99 políticas | 🟢 |
| TypeScript strict mode | Activo | Activo | 🟢 |

---

## Logros del período (Sprint 0-6)

- 12 módulos de herramienta completamente funcionales (T1-T12)
- Sistema de autenticación con 4 roles (superadmin, consultant, client_editor, client_viewer)
- 99 políticas RLS que garantizan aislamiento multi-tenant
- Sistema de diseño Obsidian Amber con tokens semánticos en Tailwind
- ARQUITECTURA.md de 42KB con decisiones D1-D9 documentadas
- 8 migraciones SQL aplicadas, esquema de BD estable
- Edge Function `ai-recommend` con integración Claude API
- Deploy automático a Vercel desde GitHub

---

## En progreso

| Item | Estado | ETA | Notas |
|------|--------|-----|-------|
| Evaluación técnica completa (baseline) | ✅ Completado hoy | — | 10 áreas, score 4.4/10 |
| Audit WCAG 2.1 AA | ✅ Completado hoy | — | 19 issues, 5 críticos |
| Crítica de diseño | ✅ Completado hoy | — | 134 hardcodes, DS vacío |
| ADR D-10 (unificación roles) | Propuesto | Sprint 1 | Decisión pendiente de Carlos |
| ADR D-11 (librería componentes) | Propuesto | Sprint 2 | Requiere sprint dedicado |
| Correcciones GOBY branding | Pendiente | Esta semana | 5 minutos |
| Eliminación VITE_CLAUDE_API_KEY | Pendiente | Esta semana | 15 minutos |

---

## Riesgos e incidencias

| Riesgo | Impacto | Mitigación | Propietario |
|--------|---------|-----------|-------------|
| VITE_CLAUDE_API_KEY en bundle cliente | 🔴 Seguridad — potencial exfiltración de key | Eliminar de .env.example esta semana | Carlos |
| 0 tests en producción | 🔴 Regresiones invisibles en datos de cliente | Instalar Vitest en Sprint 1 | Carlos |
| Sin Sentry — errores invisibles | 🔴 Tiempo de detección indefinido | Instalar en Sprint 1 (~2h) | Carlos |
| Branding GOBY en producción | 🟡 Confusión para clientes en demos | Corregir esta semana (5min) | Carlos |
| UserRole divergente (5 vs 4 roles) | 🔴 Control de acceso incorrecto en UI | ADR D-10 en Sprint 1 | Carlos |

---

## Decisiones necesarias

| Decisión | Contexto | Deadline | Recomendación |
|----------|----------|----------|---------------|
| ¿admin_alpha = consultant o rol separado? | ADR D-10 no puede implementarse sin esta decisión. Determina si el modelo final tiene 4 o 5 roles. | Antes de Sprint 1 | Simplificar a 4 roles: admin_alpha → consultant con flag de permisos extra |
| ¿Sprint dedicado a componentes atómicos o incremental? | ADR D-11. Impacta consistencia visual antes de primer cliente enterprise. | Sprint 1 | Sprint dedicado — 12-16h para Fase 1 |
| ¿Activar Storybook o eliminarlo? | 6 paquetes instalados sin stories. Overhead sin ROI. | Sprint 1 | Activar junto con ADR D-11 o eliminar |

---

## Prioridades del próximo período

1. **Esta semana:** Corregir GOBY (5 min) + eliminar VITE_CLAUDE_API_KEY (15 min) + decisión sobre admin_alpha
2. **Sprint 1:** Tests (Vitest) + CI (GitHub Actions) + Sentry + Unificar UserRole + Migrar xlsx
3. **Sprint 2:** Componentes atómicos (Button, FormField, Card, Badge) + service.ts en T5-T12
4. **Sprint 3:** PostHog analytics + ampliar cobertura de tests + WCAG fixes restantes

---

## Contexto estratégico

El producto tiene el contenido metodológico correcto y la arquitectura técnica base es sólida. La deuda acumulada es consecuencia del ritmo de desarrollo de Sprint 0-6, que priorizó correctamente implementar los 12 módulos antes de añadir capas de calidad. El momento de cambiar el ratio features/calidad es ahora: antes de entrar con el primer cliente enterprise real, y antes de construir T13.

*Impacto en [VENTAS]: el producto puede demostrarse hoy. No puede operar con datos reales de un cliente hasta resolver R1, R2 y R3.*

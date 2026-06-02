# Registro de Deuda Técnica — L.E.A.N. AI System Enterprise
**Fecha:** 2026-05-21 | **Método de priorización:** (Impacto + Riesgo) × (6 - Esfuerzo)  
**Escala:** 1-5 por dimensión | **Prioridad máxima posible:** 50

---

## Resumen ejecutivo

| Categoría | Items | Prioridad promedio | Score máximo del grupo |
|-----------|-------|-------------------|----------------------|
| Seguridad | 2 | 45 | 50 |
| Tipo-seguridad | 2 | 42 | 50 |
| Tests | 1 | 40 | 40 |
| CI/CD | 1 | 38 | 38 |
| Arquitectura de código | 4 | 28 | 40 |
| Observabilidad | 2 | 30 | 35 |
| Dependencias | 2 | 22 | 25 |
| Sistema de diseño | 3 | 18 | 24 |
| Documentación | 2 | 12 | 16 |

**Total de items de deuda identificados:** 19  
**Deuda bloqueante para enterprise (score >35):** 6 items

---

## Registro completo — ordenado por prioridad

### 🔴 Deuda crítica (Score > 35)

| # | Item | Tipo | Impacto | Riesgo | Esfuerzo | Score | Sprint sugerido |
|---|------|------|---------|--------|----------|-------|-----------------|
| 1 | `VITE_CLAUDE_API_KEY` en bundle cliente | Seguridad | 5 | 5 | 1 | 50 | Inmediato |
| 2 | `createClient<any>` sin tipado de BD | Tipo-seguridad | 5 | 5 | 2 | 40 | Inmediato |
| 3 | `UserRole` divergente (5 vs 4 roles) | Tipo-seguridad | 5 | 4 | 2 | 36 | Inmediato |
| 4 | 0 tests en el proyecto | Tests | 4 | 5 | 3 | 27→40* | Sprint 1 |
| 5 | Sin GitHub Actions / CI | CI/CD | 4 | 4 | 3 | 24→38* | Sprint 1 |
| 6 | Sin Sentry / error tracking | Observabilidad | 4 | 4 | 2 | 32 | Sprint 1 |

*El score de tests y CI/CD escala con el tiempo: cada sprint sin tests aumenta el riesgo de regresión en producción.

---

### 🟡 Deuda mayor (Score 15-35)

| # | Item | Tipo | Impacto | Riesgo | Esfuerzo | Score | Sprint sugerido |
|---|------|------|---------|--------|----------|-------|-----------------|
| 7 | T4View.tsx (2.329 líneas, 7 sub-componentes) | Código | 4 | 3 | 3 | 21 | Sprint 2 |
| 8 | T5-T12 sin capa service.ts (8 módulos) | Arquitectura | 3 | 3 | 3 | 18 | Sprint 2 |
| 9 | Sin analytics de producto (PostHog/similar) | Observabilidad | 3 | 3 | 2 | 24 | Sprint 2 |
| 10 | `database.types.ts` manual (no generado) | Tipo-seguridad | 3 | 4 | 3 | 21 | Sprint 2 |
| 11 | `xlsx` v0.18.5 con CVEs conocidos | Dependencias | 4 | 4 | 2 | 32 | Sprint 1 |
| 12 | `@supabase/auth-helpers-react` deprecado | Dependencias | 3 | 3 | 3 | 18 | Sprint 3 |
| 13 | 134 hardcodes hex en src/ | Diseño | 3 | 2 | 4 | 10 | Sprint 2-3 |
| 14 | `src/shared/design-system/` vacía | Arquitectura | 4 | 3 | 3 | 21 | Sprint 2 |
| 15 | Sin skip link ni focus trap (WCAG) | A11Y | 4 | 3 | 2 | 28 | Sprint 1 |
| 16 | Branding "GOBY" activo en producción | Branding | 5 | 2 | 1 | 35 | **Inmediato** |

---

### 🟢 Deuda menor (Score < 15)

| # | Item | Tipo | Impacto | Riesgo | Esfuerzo | Score | Sprint sugerido |
|---|------|------|---------|--------|----------|-------|-----------------|
| 17 | Solo rama `main` — sin `develop` | Proceso | 2 | 2 | 1 | 20 | Sprint 1 |
| 18 | Storybook instalado sin stories | Docs | 2 | 1 | 2 | 12 | Sprint 2 |
| 19 | `document.title` estático en navegación | A11Y | 2 | 1 | 1 | 15 | Sprint 2 |

---

## Plan de remediación por fases

### Fase 0 — Correcciones inmediatas (esta semana, <1 día total)

| Fix | Esfuerzo | Responsable |
|-----|----------|-------------|
| Eliminar VITE_CLAUDE_API_KEY de .env.example | 15 min | Carlos |
| Corregir "GOBY" en AlphaLogo.tsx y AppSidebar.tsx | 5 min | Carlos |
| Corregir "GOBY" en .env.example header | 2 min | Carlos |

**Total: ~22 minutos. Ratio impacto/esfuerzo máximo del proyecto.**

---

### Fase 1 — Sprint de fundamentos técnicos (2-3 semanas)

**Objetivo:** Resolver la deuda que bloquea la confiabilidad del producto.

1. **Resolver UserRole divergente** (ADR D-10) — unificar domain.types.ts con migration 008. Activar `createClient<Database>`. ~4h
2. **Instalar Vitest + primeros tests** — stores de T1 y T2 como punto de entrada. Objetivo: 20 tests, 0 → 20% cobertura en stores. ~8h
3. **GitHub Actions básico** — typecheck + lint + build en cada push a main. Sin merge sin CI verde. ~4h
4. **Instalar Sentry** — plan gratuito, 5.000 errores/mes. Actualizar ErrorBoundary para reportar. ~2h
5. **Migrar xlsx a exceljs** — eliminar CVEs. ~3h
6. **Crear rama develop** — proteger main con branch protection rules en GitHub. ~30min

---

### Fase 2 — Sprint de arquitectura de código (3-4 semanas)

**Objetivo:** Completar la arquitectura de módulos y componentes.

1. **Crear service.ts para T5-T12** — siguiendo el patrón de T1. ~8h
2. **Crear componentes atómicos** — Button, FormField, Card, Badge (ADR D-11). ~16h
3. **Extraer sub-componentes de T4View.tsx** — reducir de 2.329 a ~400 líneas. ~6h
4. **Añadir caché mínima en stores** — 5 minutos TTL, cero dependencias nuevas. ~3h
5. **Activar Supabase CLI para generación de tipos** — eliminar database.types.ts manual. ~2h

---

### Fase 3 — Sprint de calidad (en paralelo con features)

**Objetivo:** Alcanzar mínimos de calidad sostenibles a largo plazo.

1. **Ampliar cobertura de tests** — target: 60% en stores y servicios, 40% en componentes críticos.
2. **Migrar @supabase/auth-helpers-react a @supabase/ssr**.
3. **Auditar y tokenizar 134 hardcodes** — clasificar y eliminar por lotes.
4. **Añadir Storybook stories** o eliminar el paquete (decisión binaria).
5. **Implementar analytics con PostHog** — tracking mínimo de navegación entre módulos.

---

## Justificación de negocio para la Fase 1

Para una empresa que vende a enterprises B2B, la deuda técnica tiene consecuencias comerciales directas:

- **Sin tests ni CI:** cada sprint añade riesgo de regresión invisible. El primer bug grave en producción con un cliente enterprise puede costar el contrato.
- **Sin Sentry:** cuando un cliente reporta un error, Carlos no tiene stack trace — depende de la descripción del usuario para reproducir el bug.
- **Sin analytics:** Alpha no sabe qué módulos usan más sus consultores ni cuánto tiempo pasan en cada herramienta. Las decisiones de producto son intuición pura.
- **VITE_CLAUDE_API_KEY:** si un usuario del producto inspecciona el bundle de JavaScript (trivial con DevTools), tiene acceso a la API de Claude de Alpha con su crédito.

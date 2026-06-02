# Technical Debt Register — GOBY

Last updated: 2026-06-01
AI-Ready Repository System v2.1.0

> Registro activo de deuda técnica conocida. Cada item tiene severidad, impacto y plan de acción.
> Política: detectar en cualquier PR → logear aquí → abordar en PR separado y dedicado.
> NO mezclar deuda técnica con features en el mismo PR.

---

## Items Activos

### DEBT-001 — Sin tests automatizados
**Severidad:** 🔴 Alta
**Detectado:** 2026-06-01 (AI-Ready Setup)
**Área:** tests/unit/, tests/integration/, tests/e2e/
**Estado:** Pendiente — carpetas creadas, 0 ficheros de test

**Descripción:**
Las carpetas `tests/unit/`, `tests/integration/` y `tests/e2e/` están creadas pero vacías. No hay configuración de framework de tests (Jest, Vitest, Playwright) en `package.json`. El sistema funciona en producción con clientes reales sin ninguna red de seguridad automatizada.

**Impacto:**
- Refactorizaciones de código sin validación — riesgo de regresiones silenciosas
- Bugs en servicios compartidos afectan a múltiples herramientas T1-T13 sin detección temprana
- La lógica del motor IA (recomendaciones, scores) no tiene tests de contrato
- Confianza en el sistema baja a medida que crece la base de código

**Plan de acción:**
1. **Fase 1** (prioridad alta): Configurar Vitest + Testing Library. Tests unitarios para `src/services/` y `src/stores/`.
2. **Fase 2**: Tests de integración para flujos críticos (auth, carga de engagement, RLS).
3. **Fase 3**: Tests E2E con Playwright para los happy paths de T1-T4 (las herramientas más usadas).

**Requiere ADR:** No (configuración de testing framework es una mejora, no una decisión arquitectónica nueva).

---

### DEBT-002 — Sin pipeline CI automatizado hasta este setup
**Severidad:** 🟡 Media (resuelto parcialmente por este setup)
**Detectado:** 2026-06-01 (AI-Ready Setup)
**Área:** .github/workflows/
**Estado:** Parcialmente resuelto — workflows creados por este setup, pendientes de activar en GitHub

**Descripción:**
No existían GitHub Actions workflows. Cualquier PR podía mergearse sin validación automatizada de TypeScript, build, o documentación. El `.github/workflows/ci.yml` y `validate-docs.yml` creados por este setup resuelven el problema, pero requieren activar branch protection en GitHub para ser efectivos.

**Impacto antes del fix:**
- PRs podían mergearse con errores de TypeScript
- Sin validación de que el build de producción funciona antes de llegar a main
- Sin garantía de que la documentación se mantiene actualizada

**Acción pendiente (manual — Carlos):**
1. Ir a GitHub → Settings → Branches
2. Añadir regla de protección para `main`:
   - Require PR before merging ✅
   - Status checks requeridos: `ci`, `validate-docs` ✅
   - Require 1 approval ✅
3. Añadir regla de protección para `develop`:
   - Status checks requeridos: `ci` ✅
4. Añadir GitHub Secrets si CI necesita variables de entorno:
   - `VITE_SUPABASE_URL` (para build checks)
   - `VITE_SUPABASE_ANON_KEY` (para build checks)

---

## Items Resueltos

*(ninguno todavía — este registro se inicializa hoy)*

---

## Cómo añadir un item

Cuando detectes deuda técnica en un PR:

1. No la fixes en ese PR — mantén el PR enfocado
2. Añade un item a este fichero con el formato:

```markdown
### DEBT-NNN — [Título corto]
**Severidad:** 🔴 Alta | 🟡 Media | 🟢 Baja
**Detectado:** YYYY-MM-DD
**Área:** [ruta de fichero o módulo]
**Estado:** Pendiente | En progreso | Resuelto (YYYY-MM-DD)

**Descripción:** [qué es el problema]
**Impacto:** [qué puede salir mal si no se arregla]
**Plan de acción:** [pasos concretos]
**Requiere ADR:** Sí/No
```

3. Informa a Carlos: "Detecté deuda en [área] — logueada en TECH-DEBT.md como DEBT-NNN. La abordaremos en un PR separado."
4. Crea un GitHub Issue con label `tech-debt` si quieres trackear en el backlog.

# Technical Debt Register — GOBY

Last updated: 2026-06-02
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

### ~~DEBT-001~~ — Tests automatizados ✅ (Resuelto parcialmente — 2026-06-02)
- **Vitest** configurado y funcionando: 184 tests en 14 ficheros pasando
- Servicios T1-T4, T6, T7, T8 cubiertos (7 service test files)
- Lógica de dominio T1/T4 cubierta (scoring, ROI, AI Act)
- **Pendiente**: T5, T9, T10, T11, T12 sin tests (75% cobertura de módulos)

### ~~DEBT-003~~ — Vistas monolíticas >1000 LOC ✅ (Resuelto P1+P2 — 2026-06-02)
- T4View: 2386 → ~220 líneas (9 componentes extraídos)
- T3View: 1202 → ~220 líneas (5 componentes extraídos)
- Pendiente: T8View (1140), T7View (1097), T10View (1072), T5View (1049), T11View (1029)

### ~~DEBT-004~~ — Tipos duplicados en PolicyPDF.tsx ✅ (Resuelto P2-2 — 2026-06-02)
- `UseCase` y `Domain` locales reemplazados con imports de T4/T5 types

### ~~DEBT-005~~ — console.error en stores sin Sentry ✅ (Resuelto P2-5 — 2026-06-02)
- `reportError()` wrapper creado; T1 y T4 stores actualizados

### ~~DEBT-006~~ — xlsx CVE-2023-30533 ✅ (Resuelto P1-3 — 2026-06-02)
- Paquete eliminado (0 imports, dead dependency)

## Items Activos

### DEBT-007 — Vistas T5/T7/T8/T10/T11 todavía monolíticas
**Severidad:** 🟡 Media
**Detectado:** 2026-06-02 (P2 audit)
**Estado:** Pendiente

T8View (1140), T7View (1097), T10View (1072), T5View (1049), T11View (1029) superan los 400 líneas establecidos en ADR-013. Se aplicará el mismo patrón de extracción que T3/T4.

### DEBT-008 — T3 ProcessDetailPanel usa supabase directamente
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-02 (ADR-011)
**Estado:** Pendiente

`ProcessDetailPanel.tsx` llama `supabase.functions.invoke` directamente para la generación de oportunidades IA de T3. Debería extraerse a `src/services/t3.service.ts` o usar `useEdgeFunctionInvoke`. Aceptable por ahora (ADR-011).

### DEBT-009 — 12/16 módulos sin tests
**Severidad:** 🟡 Media
**Detectado:** 2026-06-02 (P2 audit)
**Estado:** Pendiente

T5, T9, T10, T11, T12, Auth, Admin, CompanyProfile, Engagement no tienen tests. Prioridad: T6 hooks (usePolicyGeneration) y lógica del motor T11.

### DEBT-010 — Zod schemas para JSONB de roadmap, t1_context, t2_context
**Severidad:** 🟢 Baja
**Detectado:** 2026-06-02 (ADR-015)
**Estado:** Pendiente

`rowToUseCase()` aún usa `castOpt` para `roadmap`, `t1_context`, `t2_context`. Añadir schemas cuando crezca su complejidad.

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

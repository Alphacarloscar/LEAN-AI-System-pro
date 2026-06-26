# FDR-002: Navegación por paquetes de venta (Fase 1) — capa de orquestación comercial sobre T1–T12

**Status:** ACCEPTED
**Version:** v3 (incorpora 2ª auditoría GPT sobre v2 + nombres comerciales definitivos de Carlos, 2026-06-22)
**Date:** 2026-06-22
**Proposed by:** Claude (orquestador) + Carlos Sánchez (COO)
**Approved by:** Carlos Sánchez (COO) — 2026-06-24
**Related ADR:** ADR-007 (Zustand — solo UI state), ADR-008 (4 roles — NO se tocan), ADR-004 (RLS — NO se toca)
**Related FDR:** FDR-001 (BackToDashboard canónico)

---

## Context

El embudo comercial de GOBY se cae en la **demo** (línea base S5: >60 leads → ~18 reuniones → 0 cierres de gobierno de IA; objeción P4 "esfuerzo/tiempo de rellenar" en ~10 de 18 reuniones; churn de Madison por fricción de onboarding). Diagnóstico de producto: 12 tools planas (T1–T12) dan "aspecto de Ferrari" y abruman al comprador.

El pivote vende **consultoría empaquetada acompañada de herramienta**: el vehículo es el *paquete* (agrupación digerible de tools existentes con dashboard propio que demuestra rigor sin pedir esfuerzo de carga al cliente). Este FDR cubre **Fase 1: agrupación de navegación + dashboards derivados**. No fusiona tools ni cambia su lógica.

**Alcance explícitamente FUERA de este FDR (diferido a FDR/ADR posteriores):**
- Fusión de T7 + T8 en una sola herramienta.
- Fusión de T3 + T4 en una sola herramienta.
- Reformat de T6 con nuevos desarrollos.
Estas son cambios de definición de tool (tocan modelo de datos / servicios / tipos), no navegación. Se documentarán por separado cuando Carlos aporte su contexto.

**Estado real del código (verificado, no asumido):**
- Routing `src/App.tsx`: rutas planas bajo `AppLayout`. Índice `/` = T10. Tools en `/t1`…`/t12` excepto T10 (`/`). Paths en minúscula.
- Sidebar `src/shared/components/AppSidebar.tsx`: panel slide-over, estado local `open`, lista plana `TOOL_NAVIGATION` (T1–T12) + "Perfil de Empresa". Activo por `location.pathname`.
- Tipo `ToolCode` (`src/types/domain.types.ts`): **mayúsculas** `'T1'…'T12'`. T13 no existe.
- No existe `src/config/`. `VITE_PACKAGE_NAV_ENABLED` no está aún en `.env.example`.
- Glosario: T11 (Operating Rhythm) depende de T9+T10; T12 (ISO Assessment) depende de T6 + contexto regulatorio.

## Decision

Capa de orquestación comercial **aditiva y reversible** compuesta por: (1) navegación por paquetes, (2) dashboards derivados por paquete, (3) selectores de lectura/agregación sobre datos existentes.

### 1. Estructura de paquetes (config hardcodeada TypeScript, no BBDD)

Navegación principal con el flag activo = **1 acceso global (T10) + 4 paquetes comerciales**. Sin lista plana T1–T12. T12 se resuelve como **paquete propio**, no como tool suelta duplicada (cierra la ambigüedad del hallazgo CRÍTICO #1 de la 2ª auditoría).

| packageId (técnico) | commercialName | Dashboard (dentro del desplegable) | Tools (Fase 1) | Fase 2 (fuera de este FDR) |
|---------------------|----------------|-----------------------------------|----------------|----------------------------|
| `ai-maturity`   | **AI Maturity Boost**        | Dashboard de Madurez | T1, T2, T7, T8 | T7+T8 se fusionan |
| `ai-compliance` | **AI Compliance**            | Dashboard de Riesgos | T6 | reformat de T6 |
| `ai-portfolio`  | **AI Portfolio Management**  | Portfolio Dashboard | T3, T4, T5, T9, T11 | T3+T4 se fusionan |
| `iso-42001`     | **ISO 42001 Readiness**      | (vista propia de T12) | T12 | — |

**Único acceso standalone** (fuera de desplegables, visible y clicable): **T10** (AI Value Dashboard) → "Dashboard Global", permanece en `/`.

T12 **no** se muestra además como tool suelta: aparece una sola vez, como paquete `iso-42001`. La navegación tiene 5 entradas (Dashboard Global + 4 paquetes), ninguna duplicada.

El dashboard de cada paquete vive **dentro del mismo desplegable** que sus tools (ej.: AI Maturity Boost → "Dashboard de Madurez" + T1 + T2 + T7 + T8).

**Regla anti-sobrediseño (hallazgo #4):** la config de Fase 1 modela **solo tools actuales**. No introduce abstracciones para fusiones futuras (`sourceToolCodes`, `absorbedTools`, `legacyAbsorbedPaths`, etc.). Las fusiones T7+T8 y T3+T4 modificarán la config en su FDR posterior, no antes.

### 2. Mapping canónico ToolCode ↔ slug de ruta (corrige hallazgo CRÍTICO #2 GPT)

Nuevo `src/config/toolRoutes.ts` como **fuente única** de conversión. `ToolCode` interno en mayúscula; slug de URL en minúscula:

```ts
type ToolRouteSlug = 't1'|'t2'|'t3'|'t4'|'t5'|'t6'|'t7'|'t8'|'t9'|'t10'|'t11'|'t12'
const TOOL_ROUTE_MAP: Record<ToolCode, { legacyPath: string; slug: ToolRouteSlug }> = {
  T1:{legacyPath:'/t1',slug:'t1'}, /* … */ T10:{legacyPath:'/',slug:'t10'}, /* … */ T12:{legacyPath:'/t12',slug:'t12'},
}
```

URLs de paquete en minúscula (`/packages/ai-readiness/tools/t1`), resueltas internamente a `ToolCode = 'T1'`. `salesPackages.ts` referencia tools por `ToolCode` y deriva el path desde `TOOL_ROUTE_MAP`.

### 3. Routing aditivo, no destructivo

Se conservan intactas `/`, `/t1`…`/t12`. Se añade bajo `AppLayout`:
- `/packages/:packageId` → dashboard del paquete.
- `/packages/:packageId/tools/:toolSlug` (slug minúscula) → tool en contexto de paquete (reutiliza el `*View` existente; el paquete es contexto de navegación, no otra instancia de la tool).

### 4. Dashboards derivados — parte del alcance, con regla de datos

Los dashboards de paquete **no son solo navegación**: requieren selectores/adaptadores de lectura. Cero tablas/columnas/métricas nuevas persistidas. Sin migración de BBDD en este FDR.

**Orden obligatorio de acceso a datos (hallazgo #5 — evita lógica duplicada):**
1. Reutilizar el servicio existente de la tool.
2. Si no existe servicio de lectura, crear uno en `src/services/` — **nunca** query directa a Supabase en el componente.
3. Todo cálculo compartido vive en un selector/helper testeable, **no** dentro del JSX.

Coherente con CLAUDE.md §5 (acceso a datos solo vía `src/services/`).

### 5. Estado en Zustand: solo lo NO derivable de la URL (corrige #6 GPT)

Permitido: `isPackageSidebarCollapsed`, `expandedPackageIds`. **Prohibido como fuente de verdad:** `activePackageId`, `activeToolCode` → se derivan de `location.pathname` / `useParams()`. Coherente con ADR-007.

### 6. Feature flag `VITE_PACKAGE_NAV_ENABLED` — comportamiento exacto (corrige #5 GPT)

```
=false (default en develop hasta validar):
  - Sin navegación por paquetes en sidebar.
  - Rutas /packages/* NO accesibles: acceso manual → redirige a / (NotFound controlado).
  - Rutas legacy /t1…/t12 y / funcionan igual.
=true:
  - Sidebar muestra paquetes como navegación principal (sin lista plana T1–T12).
  - Rutas /packages/:packageId y /packages/:packageId/tools/:toolSlug activas.
  - Rutas legacy siguen funcionando (deep links y compatibilidad).
```

### 7. Regla de estado activo (corrige #7 GPT)

- Ruta `/packages/:packageId/...` → manda el contexto de paquete; auto-expande ese paquete y marca la tool dentro de él.
- Ruta legacy `/t1` → tool en vista legacy/global, sin paquete activo.

### 8. Nomenclatura comercial en config (adopta #10 GPT)

Cada paquete lleva `commercialName`, `internalName`, `description`, `primaryBuyerPain` para alinear la nav con el lenguaje de venta.

### 9. RLS y ADR-008 intactos

Los paquetes son **navegación, no permisos**. Mismo acceso a tools que sin paquetes; solo cambia la agrupación en UI.

## User impact

- **consultor_alpha:** presenta 3 paquetes consultivos (problema → dashboard → tools que lo sustentan) + 2 ganchos standalone (T10 global, T12 ISO), en vez de 12 tools planas. Ataca P4/"Ferrari".
- **pm_cliente / viewer_csuite:** propuesta digerible; dashboard que demuestra rigor sin que ellos carguen datos.
- **admin_alpha / superadmin:** sin cambio de permisos.
Con el flag en `false`, experiencia idéntica a hoy.

## Riesgos abiertos / pendientes de verificación (honestidad — no aprobar como hechos)

1. **[HIPÓTESIS, competencia GPT] Aislamiento de datos demo sin migración.** Afirmar "tenant/project soporta datos demo aislados" requiere **matriz tabla-por-tabla** (Tool | tablas | campo tenant/company | campo project/engagement | RLS activa | riesgo) para T1,T2,T7,T8,T6,T3,T4,T5,T9,T11,T12. Hasta entonces es hipótesis. Riesgo acotado para la demo de Solera porque va en **PRE (entorno sintético)**, no PRO; pero la matriz es **bloqueante antes de que el patrón toque PRO**. → Entregable de GPT (auditor BBDD).
2. **[HIPÓTESIS] Mejora del ratio de venta.** No hay dato de que "3 paquetes convierten mejor que 12 tools". Es mecanismo razonable (reducir abrumo → P4), validable solo por las demos, con n bajo (P4 en ~10/18). Tratar como hipótesis a validar, no como hecho. **Criterio de validación comercial (hallazgo #7):** medir en las próximas 3 demos con navegación por paquetes → (a) tiempo hasta primer "momento de valor", (b) nº de tools mostradas, (c) aparición de objeción P4, (d) si hay siguiente paso fechado. Éxito mínimo: ≥2 de 3 demos terminan con siguiente paso fechado o propuesta solicitada.
3. **[NOTA] T11 cruza la frontera del paquete:** depende de T9 (dentro de `ai-portfolio`) y de T10 (standalone). Los selectores del dashboard de Portfolio deben contemplarlo. En demo, T11 se presenta como cadencia entregada por Alpha, NO como formulario que el cliente rellena (riesgo P4).
4. **[NOTA — decisión de Carlos vs auditoría] "AI Compliance" con solo T6.** GPT recomienda renombrar a "AI Risk & Governance" por riesgo de sobre-promesa (compliance amplio = controles, evidencias, estado de políticas, trazabilidad; T6 solo no lo cubre). Carlos mantiene "AI Compliance". Mitigación: el reformat de T6 (Fase 2) debe ampliar su alcance para sostener la etiqueta; si no, revisar el nombre antes de escalar. No bloquea Fase 1.

## Alternatives considered

| Opción | Beneficio | Riesgo | Por qué (no) elegida |
|--------|-----------|--------|----------------------|
| **Fase 1: agrupación nav + dashboards derivados, flag, sin fusiones (elegida)** | Reversible, cero migración, demostrable ya en Solera | Dos modelos nav conviviendo (mitigado: legacy oculto con flag on) | Mínimo riesgo sin tests (DEBT-001); prueba el pivote rápido |
| Hacer fusiones (T7+T8, T3+T4) antes de la demo | Producto más limpio de golpe | Toca modelo de datos sin tests; retrasa semanas la prueba del pivote | Carlos decide: fusiones a Fase 2 |
| Paquetes en tabla BBDD ya | Soporta venta modular por cliente | Migración + RLS sin venta modular real aún | Prematuro |
| Mantener sidebar + lista plana T1–T12 | Menos trabajo | Sigue abrumando → no ataca P4 (hallazgo #1 GPT) | Contradice el objetivo comercial |

## Consequences

### Positive
- Ataca el cuello de botella real (conversión en demo).
- Cero migración / cero cambio de permisos → superficie de riesgo acotada.
- Reversible vía flag; `develop` no se rompe.
- Fuente única de routing (`toolRoutes.ts`) elimina ambigüedad mayúscula/minúscula.
- Base para venta modular futura (migración a BBDD) y para las fusiones de Fase 2.

### Negative / Trade-offs aceptados
- Conviven dos modelos de nav hasta retirar el legacy tras validación.
- Dashboards derivados dependen de que las tools subyacentes tengan datos (vacío = esperado, no bug).
- Sin tests automatizados (DEBT-001), la no-regresión de routing/sidebar se verifica manualmente.

## Demo Solera Industrial — condiciones de aprobación (de la matriz GPT)

Aprobable como dato cerrado solo si: Solera existe como company/tenant demo en PRE; el proyecto demo existe como project/engagement aislado; los registros de T1/T2/T7/T8 (y demás) están asociados a ese proyecto; los dashboards leen siempre desde el `project_id` activo. Si no se verifica → tratar como pendiente, no como hecho.

---
*AI-Ready Repository System v2.1.0 — docs/decisions/functional/*

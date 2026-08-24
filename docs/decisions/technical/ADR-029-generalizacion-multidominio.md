# ADR-029 — Generalización Multidominio de GOBY

**Estado:** Propuesto  
**Fecha:** 2026-08-24  
**Autores:** Panel ROL-01 · ROL-02 · ROL-05 · ROL-16  
**Revisores:** Alpha (responsable de desarrollo)  
**ADRs relacionados:** ADR-011 (service layer separation), ADR-028 (8 fases de generalización)

---

## 1. Contexto

### Qué es GOBY hoy

GOBY / LEAN-AI-System Enterprise es una plataforma B2B SaaS de consultoría de adopción IA construida con React 18 + Vite 6 + TypeScript 5.7 + Tailwind CSS + Zustand + Supabase + Vercel. Comprende 13 módulos propietarios (T1–T13) organizados en torno a la metodología L.E.A.N. (Listen → Explore → Analyze → Navigate).

El sistema está construido como plataforma de dominio único, con conceptos de IA (AI Maturity, AI Act Risk, AI Adoption Roadmap) hardcodeados en literales de BD, lógica de permisos, navegación y componentes UI. Un análisis automatizado identificó 214+ literales AI-específicos distribuidos en categorías crítico / moderado / trivial.

### Por qué se re-arquitecturiza

1. **Bloqueo de mercado.** La dependencia de dominio AI impide ofrecer la plataforma en verticales adyacentes (transformación digital, compliance regulatorio, gestión de datos) sin reescribir el núcleo.
2. **Acoplamiento estructural.** Los módulos T1–T13 consumen conceptos de dominio directamente desde la UI, violando la separación de capas del ADR-011.
3. **Sin clientes en PRO.** El entorno de producción contiene únicamente datos de prueba y demo, lo que elimina el riesgo de breaking changes y abre una ventana de reestructuración sin coste operativo.

### Decisión de modelo de negocio que guía la arquitectura

- **Single-domain por proyecto:** cada proyecto pertenece a exactamente un dominio de consultoría (ej: AI Adoption, Data Governance). Un cliente puede tener múltiples proyectos en dominios distintos.
- **Multi-proyecto por cliente:** un `company_id` puede tener N proyectos en M dominios distintos.
- **Paquetes de módulos contratados:** cada proyecto tiene un campo `contracted_packages` que determina qué módulos T1–T13 están disponibles en ese engagement.

---

## 2. Decisión

### 2.1 Arquitectura objetivo: tres capas

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA PLATAFORMA                                            │
│  T10 Dashboard ejecutivo · Auth · CompanyProfile · Billing  │
│  Infraestructura presente en toda suscripción               │
├─────────────────────────────────────────────────────────────┤
│  SHARED KERNEL                                              │
│  T4 Roadmap Initiatives                                     │
│  Compartido por Paquete 2 y Paquete 3                       │
├──────────────────────────┬──────────────────────────────────┤
│  PAQUETE 1               │  PAQUETE 2        PAQUETE 3      │
│  Boost Assessment        │  Portfolio Mgmt   Legal &        │
│  T1 · T2 · T7            │  T3·T5·T8·T9·T11  Compliance    │
│                          │  (consume T4)     T6·T12         │
│                          │                   (consume T4)   │
├──────────────────────────┴──────────────────────────────────┤
│  CAPA DE PERSONALIZACIÓN DE DOMINIO                         │
│  governance_domains · evaluation_dimensions                 │
│  governance_configurations · llm_prompt_templates           │
│  framework_controls                                         │
│  (BD configurable, sin lógica hardcodeada en código)        │
├─────────────────────────────────────────────────────────────┤
│  CORE GENÉRICO (dominio-agnóstico)                          │
│  Scoring engine · Permissions · Navigation · UI components  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Asignación de módulos por capa

| Capa | Módulos | Justificación |
|---|---|---|
| Plataforma | T10, Auth, CompanyProfile | Presentes en toda suscripción; no son funcionalidad de paquete |
| Shared Kernel | T4 | Consumido por ≥2 paquetes independientes; extraído para evitar duplicación |
| Paquete 1 — Boost Assessment | T1, T2, T7 | Evaluación inicial; entrada al funnel; bajo TCO |
| Paquete 2 — Portfolio Management | T3, T5, T8, T9, T11 | Gestión continua del portfolio de iniciativas; consume T4 |
| Paquete 3 — Legal & Compliance | T6, T12 | Gobierno y riesgo regulatorio; consume T4 |
| Fuera de paquete (aparcado) | T8 multi-paquete, T13 | Decisión explícita: no implementar en este ciclo |

**Notas de asignación:**
- T3 y T4 permanecen como módulos separados. La fusión T3+T4 está aparcada.
- T8 aparece en Paquete 2 únicamente. La presencia en múltiples paquetes está aparcada.
- T10 tiene dos estados por panel (ver §2.4).

### 2.3 Campo `contracted_packages` en projects

```sql
-- Tipo enum en BD
CREATE TYPE package_id AS ENUM (
  'boost_assessment',
  'portfolio_management',
  'legal_compliance'
);

-- Campo en tabla projects
ALTER TABLE projects
  ADD COLUMN contracted_packages package_id[] NOT NULL DEFAULT '{}',
  ADD COLUMN domain_id uuid REFERENCES governance_domains(id);
```

**Comportamiento:**
- `contracted_packages = ['boost_assessment']` → sidebar muestra T1, T2, T7 + T10 (plataforma).
- `contracted_packages = ['portfolio_management', 'legal_compliance']` → sidebar muestra T3–T6, T8, T9, T11, T12 + T4 (shared kernel) + T10.
- Array vacío → solo acceso a T10 en modo preview total.

**Lógica de permisos:** implementada en `usePermissions` hook. El hook lee `contracted_packages` del proyecto activo y expone `hasPackage(packageId: PackageId): boolean`. Ningún componente evalúa `contracted_packages` directamente — toda lógica de acceso pasa por `usePermissions`.

### 2.4 T10 — Dashboard ejecutivo: dos estados

T10 es infraestructura de plataforma (presente en toda suscripción) pero sus paneles internos muestran datos de paquetes específicos.

| Estado del panel | Condición | Comportamiento |
|---|---|---|
| **Activo** | El paquete del panel está en `contracted_packages` | Datos reales del engagement |
| **Preview** | El paquete del panel NO está en `contracted_packages` | Reclamo visual con datos ficticios + CTA "Contratar" |

**Implementación:** cada widget de T10 recibe un prop `packageId` y consulta `usePermissions().hasPackage(packageId)` para decidir el estado de renderizado. No hay lógica de negocio en la capa de presentación.

### 2.5 Capa de personalización de dominio

La personalización de dominio vive exclusivamente en tablas de BD. El código no contiene strings de dominio hardcodeados.

**Tablas nuevas:**

| Tabla | Propósito |
|---|---|
| `governance_domains` | Catálogo de dominios disponibles (AI Adoption, Data Governance, etc.) |
| `evaluation_dimensions` | Dimensiones de evaluación por dominio (reemplaza dimensiones AI hardcodeadas) |
| `governance_configurations` | Configuración de gobierno por dominio y empresa |
| `llm_prompt_templates` | Prompts de LLM parametrizados por dominio (sin strings AI hardcodeados en Edge Functions) |
| `framework_controls` | Controles de framework regulatorio/metodológico por dominio |

**Dominio inicial:** AI Adoption se migra como primer dominio en `governance_domains`. La UI y el código no saben que es "AI" — solo saben que es `domain_id = <uuid>`.

**Segundo dominio:** diseñado en BD únicamente. Sin UI ni lógica frontend en este ciclo.

### 2.6 Eliminación de literales AI-específicos

Los 214+ literales identificados se eliminan por categoría:

- **Críticos (strings en BD/types):** migrados a `governance_domains` y `evaluation_dimensions`.
- **Moderados (labels en UI):** sustituidos por lookup a tablas de dominio vía `domain_id`.
- **Triviales (comentarios/docs):** limpieza mecánica sin impacto funcional.

El `database.types.ts` deja de contener referencias a "AI" en nombres de tipos de negocio. Los tipos de plataforma (UserRole, LeanPhase) permanecen sin cambio.

---

## 3. Consecuencias

### Qué cambia

- `projects` adquiere `contracted_packages` y `domain_id` como campos obligatorios.
- `usePermissions` incorpora lógica de paquetes contratados.
- El sidebar se renderiza dinámicamente según `contracted_packages`, no como lista estática.
- T4 se extrae como Shared Kernel con interfaz pública clara; Paquete 2 y Paquete 3 lo consumen vía importación de servicio, no de componente.
- Las Edge Functions dejan de contener prompts AI hardcodeados; leen de `llm_prompt_templates`.
- `database.types.ts` se actualiza para reflejar los nuevos tipos de paquete y dominio.

### Breaking changes (aceptables)

Los siguientes cambios rompen la estructura actual de BD y código:

1. `projects` requiere `domain_id` NOT NULL → necesita migración con valor por defecto (dominio AI inicial).
2. `projects` requiere `contracted_packages` → necesita migración con valor por defecto (todos los paquetes para datos de prueba existentes).
3. Renombrado de tipos en `database.types.ts` que contengan "AI" en su semántica de negocio.
4. Eliminación de literals hardcodeados en componentes de navegación.

**Por qué son aceptables:** No hay clientes reales en PRO. Los datos de prueba y demo pueden migrarse con valores por defecto sin impacto en usuarios reales.

### Fuera de alcance (no implementar en este ciclo)

- UI de administración para contratar/descontratar paquetes.
- Integración con sistema de pagos.
- T8 disponible en múltiples paquetes simultáneamente.
- Fusión de módulos T3+T4.
- Segundo dominio con UI y lógica frontend (solo BD).
- Quick Assessment (freemium entry point) — diseñado, pendiente de ciclo propio.

### Deuda técnica previa — Fase 0 obligatoria

Las siguientes ramas deben cerrarse **antes** de iniciar cualquier fase de esta re-arquitectura:

| Rama | Motivo |
|---|---|
| `fix/adr011-finish` | Cierra violaciones ADR-011 pendientes; la nueva arquitectura asume separación de capas correcta |
| `test/debt-009-coverage` | Incrementa cobertura de servicios hasta umbral sostenible antes de refactorizar |
| `feat/zod-jsonb` | Validación runtime de JSONB necesaria para nuevas columnas de configuración de dominio |
| `chore/react-refresh` | Dependencia desactualizada que puede interferir con cambios de Vite config |

**Tests de caracterización obligatorios antes de Fase 0:**

Escribir tests que documentan el comportamiento actual (no el deseado) de:
- `T4.computeAIActRisk()` — fórmula de scoring de riesgo AI Act
- `T5` scoring formula
- `T2` archetype assignment logic
- `T7` Rogers segment assignment logic

Estos tests actúan como red de seguridad para la refactorización posterior. Si fallan después de la migración, hay regresión.

---

## 4. Plan de implementación en fases

### Fase 0 — Deuda técnica (prerrequisito bloqueante)

**Objetivo:** dejar la base de código en estado limpio y estable antes de cualquier cambio estructural.

**Módulos/capas afectadas:** todas (corrección transversal).

**Criterio de aceptación — COMPLETADO 2026-08-24:**
- `fix/adr011-finish` → ya mergeado históricamente en develop ✅
- `test/debt-009-coverage` → mergeado (81.48% cobertura servicios) ✅
- `feat/zod-jsonb` → ya mergeado históricamente (ADR-015/ADR-022) ✅
- `chore/react-refresh` → N/A: no había dependencias desactualizadas; chunk 2.1MB es deuda de code-splitting registrada en backlog ✅
- 4 tests de caracterización → en verde (T4 AIActRisk, T5 scoring, T2 archetype, T7 Rogers) ✅
- CI verde: 718 tests passed, typecheck clean ✅

**Estado: IMPLEMENTADO**

**Dependencias:** ninguna (era el punto de partida).

---

### Fase 1 — Base de datos y dominio

**Objetivo:** crear las tablas de configuración de dominio y añadir `domain_id` y `contracted_packages` a `projects`.

**Módulos/capas afectadas:** BD (Supabase migrations), `database.types.ts`.

**Migraciones a escribir:**

```sql
-- 1. Tablas de dominio
CREATE TABLE governance_domains (...);
CREATE TABLE evaluation_dimensions (...);
CREATE TABLE governance_configurations (...);
CREATE TABLE llm_prompt_templates (...);
CREATE TABLE framework_controls (...);

-- 2. Tipo enum para paquetes
CREATE TYPE package_id AS ENUM (...);

-- 3. Extensión de projects
ALTER TABLE projects
  ADD COLUMN domain_id uuid REFERENCES governance_domains(id),
  ADD COLUMN contracted_packages package_id[] NOT NULL DEFAULT '{}';

-- 4. Seed del dominio AI como dominio inicial
INSERT INTO governance_domains (...) VALUES ('AI Adoption', ...);

-- 5. RLS policies para nuevas tablas
-- governance_domains: lectura pública (no contiene datos sensibles)
-- evaluation_dimensions, governance_configurations: RLS por company_id
-- llm_prompt_templates: lectura por domain_id
-- framework_controls: lectura por domain_id
```

**Criterio de aceptación:**
- Migraciones aplicadas en Local → PRE sin errores.
- `database.types.ts` regenerado y tipado correcto.
- `tsc --noEmit` en verde.
- RLS policies testeadas: un usuario de empresa A no puede leer `governance_configurations` de empresa B.

**Dependencias:** Fase 0 completada.

---

### Fase 2 — Shared Kernel T4

**Objetivo:** extraer T4 como módulo con interfaz pública explícita, consumible por Paquete 2 y Paquete 3 sin acoplamiento directo.

**Módulos/capas afectadas:** T4, T5 (consumidor existente), T6 (consumidor nuevo en Paquete 3).

**Contrato de T4 como Shared Kernel:**
- T4 expone un servicio con interfaz TypeScript tipada.
- T4 no importa nada de T5 ni T6 (dependencia unidireccional: paquetes → kernel).
- T4 no contiene lógica de presentación — solo lógica de negocio y acceso a datos.

**Criterio de aceptación:**
- T4 importable desde Paquete 2 y Paquete 3 sin imports cruzados entre paquetes.
- ESLint `no-restricted-imports` actualizado para reflejar las nuevas reglas de dependencia.
- Tests de caracterización de T4 en verde (de Fase 0).
- `tsc --noEmit` en verde.

**Dependencias:** Fase 1.

---

### Fase 3 — Paquetes en navegación y permisos

**Objetivo:** que el sidebar y `usePermissions` reflejen `contracted_packages` del proyecto activo.

**Módulos/capas afectadas:** sidebar navigation, `usePermissions` hook, Zustand store de proyecto activo.

**Implementación:**
- `usePermissions` lee `contracted_packages` del proyecto activo en Zustand.
- Sidebar filtra módulos según `usePermissions().hasPackage(packageId)`.
- Ningún componente evalúa `contracted_packages` directamente.
- Datos de prueba en PRE: proyectos de seed con `contracted_packages` que cubran los tres paquetes para facilitar testing manual.

**Criterio de aceptación:**
- Un proyecto con `contracted_packages = ['boost_assessment']` muestra solo T1, T2, T7 en sidebar.
- Un proyecto con los tres paquetes muestra todos los módulos.
- `usePermissions` tiene tests unitarios para cada combinación de paquetes.
- CI verde.

**Dependencias:** Fase 1 (campo `contracted_packages` disponible en BD).

---

### Fase 4 — T10 dos estados

**Objetivo:** que cada panel de T10 muestre estado activo o preview según `contracted_packages`.

**Módulos/capas afectadas:** T10 (todos sus widgets/panels).

**Implementación:**
- Cada widget de T10 recibe prop `packageId: PackageId`.
- Widget llama a `usePermissions().hasPackage(packageId)`.
- Estado activo: datos reales del engagement.
- Estado preview: datos ficticios + componente `PackagePreviewBanner` con CTA.
- `PackagePreviewBanner` es un componente nuevo (primer consumidor); se abstrae cuando exista un segundo consumidor real.

**Criterio de aceptación:**
- T10 renderiza correctamente para las cuatro combinaciones posibles de paquetes contratados.
- El estado preview no llama a ninguna Edge Function ni consulta datos reales.
- Tests de renderizado para ambos estados.
- CI verde.

**Dependencias:** Fase 3 (usePermissions disponible).

---

### Fase 5 — Generalización de dominio (eliminación de literales AI)

**Objetivo:** eliminar los 214+ literales AI-específicos del código. El core pasa a ser dominio-agnóstico; los conceptos de dominio vienen de BD.

**Módulos/capas afectadas:** todos los módulos T1–T13, Edge Functions, `database.types.ts`.

**Orden recomendado dentro de la fase:**
1. Críticos: migrar tipos y enums de BD a `governance_domains` / `evaluation_dimensions`.
2. Edge Functions: sustituir prompts hardcodeados por lectura de `llm_prompt_templates`.
3. Moderados: sustituir labels UI hardcodeados por lookup a dominio.
4. Triviales: limpieza de comentarios y documentación interna.

**Criterio de aceptación:**
- `grep -r "AI Maturity\|AI Act\|ai_adoption\|AIMaturity" src/` devuelve 0 resultados en código de producción (excluir tests y fixtures).
- Los 4 tests de caracterización de Fase 0 siguen en verde (no hay regresión en fórmulas de scoring).
- `tsc --noEmit` en verde.
- `npm run build` sin errores.
- CI verde con todos los specs E2E pasando.

**Dependencias:** Fases 1, 2, 3, 4.

---

### Fase 6 — Validación end-to-end

**Objetivo:** verificar que el sistema completo funciona correctamente tras la re-arquitectura.

**Módulos/capas afectadas:** todos (validación global).

**Acciones:**
- Ejecutar suite completa de Playwright E2E en PRE.
- Validación manual de los tres paquetes con datos de seed.
- Verificar que T10 muestra estado activo/preview correctamente para cada combinación.
- Smoke test de dominio AI (primer dominio): engagement end-to-end desde T1 hasta T10.
- Cierre de `INFORME_DESACOPLAMIENTO_GOBIERNO.md` con estado final.

**Criterio de aceptación:**
- ≥95% de specs E2E en verde (umbral para PRE → PRO).
- Validación manual aprobada por Alpha.
- `npm run build` produce chunk ≤ 2MB (o hay plan documentado de code-splitting si no).
- ADR-029 marcado como `Implementado`.

**Dependencias:** Fase 5.

---

## 5. Verificación

### Comandos de verificación por fase

```bash
# Verificación de tipos (barata, usar frecuentemente)
npx tsc --noEmit

# Verificación de build (solo al cerrar fase)
npm run build

# Verificación de tests unitarios
npm run test

# Verificación E2E en PRE (requiere entorno activo)
npx playwright test --project=chromium

# Verificación de literales AI en código (Fase 5)
grep -r "AI Maturity\|AI Act\|ai_adoption\|AIMaturity\|AiAct" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__\|fixtures\|.spec."

# Verificación de violaciones ADR-011 (imports directos desde UI a BD)
npx eslint src/ --rule '{"no-restricted-imports": "error"}'
```

### Criterios observables de implementación completa

| Criterio | Observable |
|---|---|
| `contracted_packages` en BD | `SELECT contracted_packages FROM projects LIMIT 1` devuelve array tipado |
| T4 como Shared Kernel | `grep -r "from.*T4" src/features/T5` y `src/features/T6` devuelven imports de servicio, no de componente |
| Sidebar dinámico | Cambiar `contracted_packages` de un proyecto en seed → refrescar → sidebar actualizado |
| T10 dos estados | Proyecto con Paquete 1 solamente → paneles de Paquete 2 y 3 en estado preview |
| Sin literales AI | Comando grep de Fase 5 devuelve 0 resultados |
| RLS correcta | Usuario de empresa A no puede leer `governance_configurations` de empresa B (testeable con Supabase CLI) |
| CI verde | GitHub Actions verde en `develop` tras merge de cada fase |

### Tests mínimos requeridos por área

| Área | Tests requeridos |
|---|---|
| `usePermissions` | Unit: hasPackage() para cada combinación de contracted_packages |
| T4 Shared Kernel | Unit: interfaz pública completa + tests de caracterización de Fase 0 |
| T10 estados | Render: activo vs preview para cada packageId |
| BD migrations | Integration: RLS policies por company_id para nuevas tablas |
| E2E | Smoke test de engagement end-to-end con dominio AI |

---

## Apéndice — Estructura de tablas nuevas (esquema de referencia)

```sql
-- governance_domains
CREATE TABLE governance_domains (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,          -- 'ai_adoption', 'data_governance'
  label       text NOT NULL,                 -- 'AI Adoption', 'Data Governance'
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- evaluation_dimensions
CREATE TABLE evaluation_dimensions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES governance_domains(id),
  slug        text NOT NULL,
  label       text NOT NULL,
  weight      numeric(4,3) CHECK (weight BETWEEN 0 AND 1),
  sort_order  integer NOT NULL DEFAULT 0,
  UNIQUE (domain_id, slug)
);

-- governance_configurations
CREATE TABLE governance_configurations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id),
  domain_id   uuid NOT NULL REFERENCES governance_domains(id),
  config      jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, domain_id)
);

-- llm_prompt_templates
CREATE TABLE llm_prompt_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES governance_domains(id),
  module_slug text NOT NULL,                 -- 't1_radar', 't6_risk', etc.
  prompt_key  text NOT NULL,
  template    text NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  UNIQUE (domain_id, module_slug, prompt_key, version)
);

-- framework_controls
CREATE TABLE framework_controls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES governance_domains(id),
  control_id  text NOT NULL,                 -- 'GPAI-1.1', 'ISO-27001-A.5.1', etc.
  label       text NOT NULL,
  description text,
  category    text,
  UNIQUE (domain_id, control_id)
);
```

---

## 6. Registro de ejecución

| Fase | Estado | Fecha | Notas |
|---|---|---|---|
| Fase 0 | ✅ Implementada | 2026-08-24 | Ver criterios actualizados en §4 |
| Fase 1 | ⏳ Pendiente | — | BD y dominio |
| Fase 2 | ⏳ Pendiente | — | Shared Kernel T4 |
| Fase 3 | ⏳ Pendiente | — | Navegación y permisos |
| Fase 4 | ⏳ Pendiente | — | T10 dos estados |
| Fase 5 | ⏳ Pendiente | — | Eliminación literales AI |
| Fase 6 | ⏳ Pendiente | — | Validación E2E |

---

**Versión:** 1.0.0  
**Última revisión:** 2026-08-24 (Fase 0 completada)  
**Próxima revisión:** al iniciar Fase 1  
**Idioma:** Español de España (documentación humana)  
**Fuente de verdad para implementación:** este documento + `CLAUDE.md` del repo
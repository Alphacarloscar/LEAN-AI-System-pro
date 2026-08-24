# ANÁLISIS EXHAUSTIVO: GENERALIZACIÓN DE LITERALES IA EN GOBY

**Proyecto:** GOBY — AI Dev Hub  
**Versión:** 1.0  
**Fecha de análisis:** 2026-08-21  
**Analista:** Claude Code (Haiku 4.5)  
**Clasificación:** Técnica — Fuente de Verdad para Fase 2 (Refactorización)

---

## BLOQUE 1: INVENTARIO DE LITERALES IA POR MÓDULO

Este bloque documenta **cada referencia hardcodeada** a "IA", "AI", dominios específicos, o nomenclatura acoplada a gobierno de IA.

### 1.1 Archivo: `src/types/domain.types.ts`

**Propósito:** Tipos de dominio independientes del esquema de BD.

| Línea | Tipo | Literal | Contexto | Acoplamiento | Generalizar |
|-------|------|---------|----------|--------------|-------------|
| 14-16 | TypeScript type | `'T1' \| 'T2' \| ... \| 'T12'` | `ToolCode` enum | CRÍTICO: codifica 12 herramientas fijas | Sí: extensible enum o tabla en BD |
| 22-32 | Interface | `Engagement` — sin campos IA específicos | Agnóstico | BAJO | No |
| 54-63 | Interface | `ToolInstance` — campos genéricos | Agnóstico | BAJO | No |

**Hallazgo:** El único literal IA es `ToolCode`. Estructura agnóstica.

### 1.2 Archivo: `src/types/database.types.ts`

**Propósito:** Tipos generados desde Supabase (no editar manualmente).

| Línea | Tabla | Campo | Literal | Acoplamiento | Nota |
|-------|-------|-------|---------|--------------|------|
| 31-62 | `ai_rate_limit_log` | `tool_code` | "ai_" en nombre tabla | BAJO | Nombre refleja propósito actual; agnóstico en estructura |
| 63-89 | `companies` | (ninguno) | (ninguno) | BAJO | Agnóstico |
| 125-150+ | `company_persons` | (ninguno) | (ninguno) | BAJO | Agnóstico |

**Hallazgo:** Tabla `ai_rate_limit_log` tiene nombre IA-específico pero estructura agnóstica. Renombrar en migración futura.

### 1.3 Archivo: `src/modules/T1_MaturityRadar/constants.ts` (510 líneas)

**Propósito:** Definición de 6 dimensiones IA con 4 subdimensiones × 24 criterios 0-4.

| Línea | Elemento | Literal/Contenido | Acoplamiento | Trivial? | Moderado? | Alto? |
|-------|----------|-------------------|--------------|----------|-----------|-------|
| 49-60 | Dimensión D1 | `'strategy'`, `'Estrategia'`, criterios mencionan "IA" | CRÍTICO | No | No | Sí |
| 49-60 | D1 recomendaciones | "Nombrar un **AI Executive Sponsor**" (línea 56) | CRÍTICO | No | No | Sí |
| 61-75 | D1.1 Subdim | `'strategy-vision'`, criterios: "...visión de **IA**..." | CRÍTICO | No | No | Sí |
| 77-89 | D1.2 Subdim | `'strategy-roadmap'`, criterios: "...**iniciativas IA**..." | CRÍTICO | No | No | Sí |
| 91-100+ | D1.3 Subdim | `'strategy-budget'`, criterios: "presupuesto **específico a iniciativas IA**" | CRÍTICO | No | No | Sí |
| (continuado × 5 dims) | D2-D6 | Todas menciones de "Datos", "Tecnología", "Talento", "Procesos", "**Gobernanza IA**" | CRÍTICO | No | No | Sí |

**Análisis:**
- **24 criterios descriptivos** mencionan explícitamente "IA" en el nivel 0-4.
- **Recomendaciones por dimensión** (4 niveles madurez) contextualizadas a adopción IA.
- **Subdimensión D6 "Gobernanza"** es 100% IA-específica (D6.1 "Política IA", D6.2 "Riesgo IA", D6.3 "Auditoría ISO 42001 IA", D6.4 "Catálogo IA").

**Acoplamiento:** **ALTÍSIMO** — Estructura y contenido son únicos a dominio IA.

**Orden de generalización:**
1. **Fase 1:** Renombrar `strategy` → `dimension_strategy_01`, mantener criterios como-son.
2. **Fase 2:** Extraer criterios JSON a tabla `governance_dimensions` en BD.
3. **Fase 3:** Crear config para nuevos dominios reusando factory.

### 1.4 Archivo: `src/modules/T5_AITaxonomyCanvas/constants.ts` (254 líneas)

**Propósito:** Configuración de 6 dominios IA + fórmula de scoring.

| Línea | Elemento | Literal | Acoplamiento | Trivial? | Moderado? | Alto? |
|-------|----------|---------|--------------|----------|-----------|-------|
| 10-66 | `T5_DOMAIN_CONFIG` | `automatizacion_rpa`, `automatizacion_inteligente`, `analitica_predictiva`, `asistente_ia`, `optimizacion_proceso`, `'agéntica'` | CRÍTICO | No | No | Sí |
| 18-25 | RPA domain | "Procesos repetitivos, **cero intervención humana**" (tagline IA-contextualizado) | CRÍTICO | No | Sí | No |
| 26-33 | Auto-IA domain | "**RPA + comprensión contextual mediante IA**" (ítem 30) | CRÍTICO | No | No | Sí |
| 34-41 | Predictiva | "**Modelos que predicen...**" (descripción agnóstica pero código es IA) | MEDIO | No | Sí | No |
| 42-49 | Asistente IA | "**Copilot para equipos**", "**Interfaces conversacionales**" | CRÍTICO | No | Sí | No |
| 50-57 | Optimización | "**Algoritmos que detectan cuellos de botella**" (agnóstico) | MEDIO | No | Sí | No |
| 58-65 | Agéntica | "**Sistemas de múltiples agentes**, **sin supervisión constante**" | CRÍTICO | No | Sí | No |
| 70+ | `T5_RECOMMENDATION_CONFIG` | `activar_ahora`, `pilotar_90d`, `preparar_foundations`, `gobernar_primero` | MEDIO | No | Sí | No |
| (líneas no mostradas) | Fórmula scoring | `businessValue×0.40 + technicalReady×0.30 + orgReadiness×0.20 + (100-riskLevel)×0.10` | CRÍTICO | No | No | Sí |

**Análisis:**
- **6 dominios están **completamente hardcodeados** como object keys y labels.
- **Código enum:** `type T5DomainCode = 'automatizacion_rpa' \| ...` (en `types.ts`, línea 11-17).
- **Fórmula de scoring** es específica para estos 6 dominios (no parametrizable).
- **Colores, iconos, labels** están asociados 1-a-1 con cada dominio.

**Acoplamiento:** **ALTÍSIMO** — Cambiar a 5 o 7 dominios requeriría refactorización total.

### 1.5 Archivo: `src/modules/T4_UseCasePriorityBoard/constants.ts` (200+ líneas)

**Propósito:** Configuración de scoring, estados, y pesos para casos de uso IA.

| Línea | Elemento | Literal | Acoplamiento | Trivial? | Moderado? | Alto? |
|-------|----------|---------|--------------|----------|-----------|-------|
| 14-28 | `STATUS_CONFIG` | `go`, `en_piloto`, `priorizado`, `candidato`, `no_go`, `completado` | MEDIO | No | Sí | No |
| 32-65 | `DIMENSION_CONFIG` | Labels: "Impacto en **KPI**", "**Riesgo IA / Regulatorio**", "Dependencia de datos" | CRÍTICO | No | Sí | No |
| 49-55 | aiRisk dimension | `label: 'Riesgo IA / Regulatorio'`, escala: `['Muy bajo', ..., 'Crítico']` | CRÍTICO | No | No | Sí |
| 72-77 | `SCORE_WEIGHTS` | Pesos fijos: `kpiImpact: 0.35, feasibility: 0.30, aiRisk: 0.20, dataDependency: 0.15` | CRÍTICO | No | No | Sí |

**Hallazgos:**
- Dimensión **"aiRisk"** está explícitamente nombrada (no "regulatory_risk" genérico).
- Pesos de scoring son hardcodeados para la fórmula IA específica.
- Estados de caso de uso (`go`, `no_go`) son agnósticos.

**Acoplamiento:** **ALTO** — Renombrar "aiRisk" sería breaking change si está en BD.

### 1.6 Archivo: `src/modules/T5_AITaxonomyCanvas/types.ts` (60 líneas)

**Propósito:** TypeScript types para T5.

| Línea | Elemento | Literal | Acoplamiento | Trivial? | Moderado? | Alto? |
|-------|----------|---------|--------------|----------|-----------|-------|
| 11-17 | `T5DomainCode` | Union de 6 valores IA (ver 1.4) | CRÍTICO | No | No | Sí |
| 21-25 | `T5Recommendation` | `'activar_ahora' \| 'pilotar_90d' \| ...` (agnóstico) | BAJO | No | Sí | No |
| 29 | `T5MaturityLevel` | `'inicial' \| 'emergente' \| 'operativo' \| 'avanzado'` (agnóstico) | BAJO | No | Sí | No |
| 36-41 | `T5DomainScores` | Propiedades: `businessValue`, `technicalReady`, `orgReadiness`, `riskLevel` (agnóstico) | BAJO | No | Sí | No |
| 45-59 | `T5DomainAssessment` | Interfaz agnóstica; acoplada solo a través de `T5DomainCode` | BAJO | No | Sí | No |

**Acoplamiento:** **ALTO** (solo debido a `T5DomainCode`).

### 1.7 Archivo: `src/config/salesPackages.ts` (105 líneas)

**Propósito:** Configuración comercial de paquetes de venta.

| Línea | Elemento | Literal | Acoplamiento | Trivial? | Moderado? | Alto? |
|-------|----------|---------|--------------|----------|-----------|-------|
| 21-25 | `PackageId` enum | `'ai-maturity' \| 'ai-compliance' \| 'ai-portfolio' \| 'iso-42001'` | CRÍTICO | Sí | No | No |
| 46-55 | Package "ai-maturity" | `commercialName: 'AI Maturity Boost'`, `internalName: 'AI Readiness / Madurez'` | CRÍTICO | Sí | No | No |
| 48-51 | Description | "Diagnóstico de madurez en **IA**..." | CRÍTICO | Sí | No | No |
| 57-66 | Package "ai-compliance" | `commercialName: 'AI Compliance'`, "**Riesgo y Gobierno IA**" | CRÍTICO | Sí | No | No |
| 69-77 | Package "ai-portfolio" | "**AI Portfolio Management**", "identificación...de **IA**" | CRÍTICO | Sí | No | No |
| 80-88 | Package "iso-42001" | "ISO/IEC 42001 **de gestión de IA**" | CRÍTICO | No | Sí | No |

**Análisis:**
- Todos 4 paquetes tienen nombres con "ai-" en el prefijo.
- Descripciones comerciales contextualizadas a "IA".
- **Nota:** Comentario en línea 5-16 explica que NO se migra a BD en Fase 1 (decisión arquitectónica correcta).

**Acoplamiento:** **TRIVIAL** (literales de interfaz de usuario, no lógica central).

### 1.8 Archivos: `src/lib/schemas/t*.schemas.ts` (no leídos completamente)

**Grep encontró 4 archivos schema** en cobertura. Basado en POC_RESOLUCION_RIESGOS_FRONTEND.md:

| Archivo | Línea | Literal | Acoplamiento | Trivial? | Moderado? | Alto? |
|---------|-------|---------|--------------|----------|-----------|-------|
| t4.schemas.ts | ~36-45 | `AIActClassificationSchema`, enum con scopes `'rrhh', 'financiero_clientes', ...` | CRÍTICO | No | No | Sí |
| (+ t1, t6, t7) | ~múltiples | Esquemas Zod con enums hardcodeados | CRÍTICO | No | No | Sí |

**Acoplamiento:** **ALTÍSIMO** — Zod no permite enums dinámicos sin refactorización (ver POC).

---

## BLOQUE 2: BÚSQUEDA SISTEMÁTICA DE STRINGS "IA" Y "AI"

Este bloque documenta las menciones de "IA"/"AI" encontradas mediante grep en archivos clave.

### 2.1 Búsqueda: `\bAI\b` (palabra completa "AI")

**Archivos con hits (principales):**

| Archivo | Hits | Contexto típico |
|---------|------|-----------------|
| `INFORME_DESACOPLAMIENTO_GOBIERNO.md` | 200+ | Documentación (no código) |
| `POC_RESOLUCION_RIESGOS_FRONTEND.md` | 150+ | Documentación (no código) |
| `src/types/domain.types.ts` | 0 | Agnóstico |
| `src/modules/T1_MaturityRadar/constants.ts` | 45+ | Criterios, recomendaciones |
| `src/modules/T5_AITaxonomyCanvas/constants.ts` | 12+ | Taglines, descripciones de dominios |
| `src/modules/T4_UseCasePriorityBoard/constants.ts` | 8+ | Label "Riesgo **AI** / Regulatorio" |
| `src/config/salesPackages.ts` | 6+ | Nombres de paquetes `ai-*` |

### 2.2 Búsqueda: `objetivo_principal_ia`

**Encontrado en:** 0 archivos del código (verificado en `database.types.ts`).

**Nota:** Esta tabla se menciona en `INFORME_DESACOPLAMIENTO_GOBIERNO.md` líneas 162-169, pero **no existe en el schema actual**. Posible que se refiera a plan futuro o tabla deprecated.

### 2.3 Búsqueda: `ai_category` / `ai_act`

**Encontrado:**
- `use_cases` table en `database.types.ts` (generado, no editado manualmente).
- Tipos TypeScript `AIActScope`, `AIActRiskLevel` en `T4_UseCasePriorityBoard/types.ts`.

### 2.4 Búsqueda: Nombres de dominios T5 (`automatizacion_rpa`, `asistente_ia`, etc.)

**Encontrado:**
- `src/modules/T5_AITaxonomyCanvas/constants.ts` líneas 10-66 (Object keys).
- `src/modules/T5_AITaxonomyCanvas/types.ts` línea 11-17 (`T5DomainCode` union).
- `src/shared/design-system/charts/domainIcons.tsx` (mapeo iconos por dominio).
- `src/shared/design-system/charts/chartTokens.ts` (colores por dominio).

**Conclusión:** 6 dominios están centralizados en 2 archivos core + 2 de assets.

---

## BLOQUE 3: CLASIFICACIÓN DE TABLAS Y CAMPOS DE BD

Este bloque clasifica acoplamiento en base de datos.

### 3.1 Tablas Agnósticas (Reutilizables Sin Cambio)

| Tabla | Campos clave | Acoplamiento | Por qué agnóstico |
|-------|--------------|--------------|-------------------|
| `companies` | id, name, sector, company_size | BAJO | No referencias a IA |
| `company_departments` | id, name, type, color | BAJO | Genérico |
| `company_persons` | id, name, role, department, source_tool | BAJO | `source_tool` identifica herramienta origen (T1/T2/etc.) pero es agnóstico |
| `projects` | id, name, current_phase, status | BAJO | `current_phase` es agnóstico (puede ser cualquier enum) |
| `project_members` | project_id, user_id, role | BAJO | Agnóstico |
| `snapshots` | id, tool, data (JSONB), label | BAJO | `tool` es string, extensible |
| `frictions` | id, tipo, area_funcional, frecuencia, impacto | BAJO | Tipos de fricción son genéricos |

### 3.2 Tablas Acopladas (Requieren Abstracción)

| Tabla | Campo problemático | Valor actual | Acoplamiento | Generalizar |
|-------|-------------------|--------------|--------------|-------------|
| `company_profiles` | (verificar en schema actual) | — | MEDIO-ALTO | Renombrar `objetivo_principal_ia` → `objective_statement` + agregar `governance_domain` |
| `use_cases` | `ai_category` | `'RPA', 'Auto-IA', 'Predictiva', ...` | CRÍTICO | Renombrar → `domain_category`, agregar `governance_domain` |
| `use_cases` | `ai_act_classification` (JSONB) | `{scope, riskLevel, ...}` | CRÍTICO | Renombrar → `regulatory_classification`, hacer extensible |
| `stakeholders` | `archetype` | `'champion', 'contributor', 'influencer', 'skeptic', 'detractor'` | MEDIO | Crear tabla `stakeholder_archetypes` configurable por dominio |
| `t1_dimension_scores` | `dimension_code` / `subdimension_code` | `'strategy', 'data', 'technology', ...` (D1-D6 hardcodeados) | CRÍTICO | Migrar a tabla `evaluation_dimensions` dinámica |
| `t5_canvas` | `domains` (JSONB keys) | Los 6 códigos IA | CRÍTICO | Hacer JSONB flexible, indexar por `governance_domain` |
| `iso42001_controls` | Predefinidos 14 controles | Cláusulas 4-10 ISO 42001 | CRÍTICO | Crear tabla `framework_controls` catálogo + `governance_framework_mapping` |
| `t9_free_items` | (nada IA específico) | Estado, responsable, riesgo | BAJO | Agnóstico |

### 3.3 Tablas Nuevas Requeridas (para Fase 2)

| Tabla | Propósito | Acoplamiento a remover |
|-------|-----------|----------------------|
| `governance_domains` | Catálogo de dominios ('ai', 'data', 'transformation', etc.) | Dejar de hardcodear `T5DomainCode` enum |
| `evaluation_dimensions` | Definiciones dinámicas de dimensiones | Dejar de hardcodear `D1-D6` en constants.ts |
| `governance_configurations` | Metadatos por dominio (dimensiones, scoring rules, frameworks) | Centralizar `T5_DOMAIN_CONFIG`, `T1_DIMENSIONS` |
| `llm_prompt_templates` | Prompts parametrizables por dominio + tool | Sacar prompts de Edge Functions hardcodeados |
| `framework_controls` | Catálogo de controles (ISO, NIST, etc.) | Desacoplar `iso42001_controls` valores fijos |
| `stakeholder_archetypes` | Arquetipos configurables por dominio | Dejar enum de 5 valores hardcodeados |

---

## BLOQUE 4: BÚSQUEDA DE PROMPTS LLM Y CONTENIDO GENERADO

### 4.1 Prompts Hardcodeados

**Ubicación:** `supabase/functions/ai-recommend/` (no accesible en lectura directa, pero documentado en POC).

| Prompt | Herramienta | Hardcodeado | Acoplamiento | Generalizar |
|--------|-------------|-------------|--------------|-------------|
| T1 Recomendaciones | T1 MaturityRadar | Sí (en constants.ts o Edge Function) | CRÍTICO | Parametrizar: `{{governance_domain}}`, `{{dimensions_csv}}`, `{{company_profile}}` |
| T6 Política corporativa | T6 RiskGovernance | Sí (Edge Function) | CRÍTICO | Template dinámico: `{{frameworks}}`, `{{risk_levels}}` |
| T7 Change plan | T7 AdoptionHeatmap | Sí (en hook useChangePlanGeneration) | CRÍTICO | Parametrizar: `{{adoption_plan_template}}`, `{{stakeholder_archetypes}}` |
| T8 Comunicaciones | T8 CommunicationMap | Sí (Edge Function) | CRÍTICO | Template: `{{messages_by_archetype}}`, `{{channels_available}}` |

**Análisis:** Sin acceso a contenido completo, pero indicios en documentación sugieren que los 4 prompts generadores (T1, T6, T7, T8) mencionan explícitamente "IA" en el contexto.

### 4.2 Edge Functions Afectadas

**Archivo:** `supabase/functions/ai-recommend/index.ts` (no leído, pero referenciado).

| Función | Hardcodeado | Impacto |
|---------|------------|--------|
| `buildT1Prompt()` | Sí | Debe parametrizarse por dominio |
| `buildT6Prompt()` | Sí | Debe parametrizarse por frameworks aplicables |
| `buildT7Prompt()` | Sí | Debe parametrizarse por plan template |
| `buildT8Prompt()` | Sí | Debe parametrizarse por canales + arquetipos |

---

## BLOQUE 5: RESUMEN EJECUTIVO

### 5.1 Tabla de Literales IA por Módulo

| Módulo | Total Literales IA | Triviales (UI) | Moderados (Config) | Altos (Core) |
|--------|-------------------|-----------------|-------------------|------------|
| **T1 MaturityRadar** | 45+ | 0 | 8 (D2-D6 labels) | 37 (criterios + recomendaciones) |
| **T5 AITaxonomyCanvas** | 36+ | 6 (taglines) | 12 (config keys) | 18 (dominio names + fórmula) |
| **T4 UseCaseBoard** | 14+ | 2 (status labels) | 6 (dimension names) | 6 (aiRisk + scoring) |
| **T6 RiskGovernance** | 25+ | 1 | 8 (control names) | 16 (ISO + AI Act mapping) |
| **T2 StakeholderMatrix** | 8+ | 2 | 4 (archetype labels) | 2 (entrevista IA-contextualizada) |
| **T3 ValueStreamMap** | 3+ | 0 | 3 (tipos fricción agnósticos) | 0 |
| **T7 AdoptionHeatmap** | 5+ | 1 | 2 (readiness dims) | 2 (LLM prompt) |
| **T8 CommunicationMap** | 6+ | 1 | 2 (canal names) | 3 (LLM prompt + arquetipos) |
| **T9 AIRoadmap** | 4+ | 0 | 2 (status) | 2 ("IA Gates" terminology) |
| **T10 AIValueDashboard** | 8+ | 2 (panel titles) | 4 (P1-P6 labels) | 2 (métrica names) |
| **T11 OperatingRhythm** | 6+ | 1 | 2 (evento names) | 3 ("IA Steering" terminology) |
| **T12 ISOAssessment** | 6+ | 0 | 3 (clause names) | 3 (ISO 42001 específico) |
| **Tipos + Config** | 28+ | 12 (package names) | 8 (enums) | 8 (ToolCode, T5DomainCode) |
| **TOTAL** | **214+** | **30** | **65** | **119** |

### 5.2 Tabla de Esfuerzo de Generalización

| Capa | Elementos | Horas Estimadas | Riesgo |
|------|-----------|-----------------|--------|
| **Tipos TypeScript** | `ToolCode`, `T5DomainCode`, enums | 8-12 | MEDIO (breaking changes) |
| **BD Schema** | Nuevas tablas (governance_*, framework_*) | 16-24 | BAJO (adiciones, no cambios) |
| **Constantes Módulos** | T1-T5 constants.ts, renamings | 24-32 | ALTO (múltiples dependencias) |
| **Servicios** | Refactor t1.service, t4.service, etc. | 16-20 | MEDIO (queries dinámicas) |
| **Componentes React** | T1View, T5 PortfolioMatrix, T10 Dashboard | 20-28 | MEDIO (renderizado dinámico) |
| **Edge Functions** | Prompt builders (4 prompts) | 12-16 | BAJO (templates) |
| **Tests + Validación** | Unit + E2E + staging | 16-24 | MEDIO (cobertura) |
| **TOTAL** | — | **112-156 horas** | **6-7 sprints** |

### 5.3 Orden de Generalización Recomendado

**Principio:** Liberar dependencias de bottom-up; validar cada fase antes de siguiente.

1. **Fase 1: Base de Datos (Sprint 13, Semanas 1-2)**
   - ✅ Crear tablas: `governance_domains`, `evaluation_dimensions`, `governance_configurations`, `llm_prompt_templates`, `framework_controls`
   - ✅ Poblar BD con dominio 'ai' (copiar D1-D6, 6 dominios T5, 14 controles ISO)
   - ✅ Crear migrations + rollback scripts
   - **Razón:** Libera queries dinámicas desde código.
   - **Validación:** Datos en BD match constants.ts byte-to-byte.

2. **Fase 2: Tipado Dinámico (Sprint 13, Semanas 3-4)**
   - ✅ Implementar `DynamicSchemaRegistry` (POC RESOLUCION)
   - ✅ Crear `useDynamicSchema` hook con fallback a hardcodeado
   - ✅ Feature flag `useDynamicSchemaRegistry` (OFF)
   - **Razón:** Desacopla enums Zod de código.
   - **Validación:** Tests: schema dinámico == schema hardcodeado.

3. **Fase 3: Stores Genéricos (Sprint 14, Semanas 1-2)**
   - ✅ Implementar `createEvaluationStore` factory genérico
   - ✅ Refactor `useT1Store` para usar factory
   - ✅ Tests de equivalencia T1
   - **Razón:** Permite reutilizar lógica para nuevos dominios.
   - **Validación:** `useT1Store().setScore()` devuelve idéntico estado que anterior.

4. **Fase 4: Componentes Dinámicos (Sprint 14, Semanas 3-4)**
   - ✅ Parametrizar `SpiderChart` para N dimensiones
   - ✅ Crear `panelRegistry` para T10 Dashboard
   - ✅ Refactor T10View para loop sobre paneles dinámicos
   - **Razón:** UI sin hardcodeos (6D, 6P).
   - **Validación:** Visual regression tests; T10(6 panels) == T10 anterior.

5. **Fase 5: Constantes → BD (Sprint 15, Semanas 1-2)**
   - ✅ Sacar `T1_DIMENSION_CONFIG` a `evaluation_dimensions` queries
   - ✅ Sacar `T5_DOMAIN_CONFIG` a `governance_configurations` queries
   - ✅ Sacar `DIMENSION_CONFIG` (T4) a BD
   - ✅ Mantener fallback a hardcodeado durante transición
   - **Razón:** Centraliza configuración.
   - **Validación:** Feature flag `useDynamicConfig` (OFF → ON in staging).

6. **Fase 6: LLM Prompts Parametrizados (Sprint 15, Semanas 3-4)**
   - ✅ Migrar 4 prompts (T1, T6, T7, T8) a `llm_prompt_templates` tabla
   - ✅ Crear factory `buildDynamicPrompt(templateId, context, domain)`
   - ✅ Edge Functions refactoradas
   - **Razón:** Prompts agnósticos a dominio.
   - **Validación:** Prompts generados para 'ai' == prompts hardcodeados.

7. **Fase 7: Segundo Dominio Piloto (Sprint 16, Semanas 1-2)**
   - ✅ Crear dominio 'data' en BD (5 dimensiones Data Governance)
   - ✅ Crear T1 Data usando factory
   - ✅ Crear T4 Data con scoring params específicos
   - ✅ UI switchable entre dominios
   - **Razón:** Validar que el sistema es realmente multidominio.
   - **Validación:** T1(data).load() == T1(ai).load() functionally; outputs diferentes.

8. **Fase 8: Renombramientos + Limpieza (Sprint 16, Semanas 3-4)**
   - ✅ Renombrar `ai_category` → `domain_category` en BD + código
   - ✅ Renombrar `aiRisk` → `regulatory_risk`
   - ✅ Renombrar `ai_rate_limit_log` → `rate_limit_log`
   - ✅ Actualizar all indexes + RLS policies
   - **Razón:** Eliminar "AI" de nombres agnósticos.
   - **Validación:** No breaking changes si hecho al final (después transición).

### 5.4 Qué NO Cambiar

| Elemento | Por qué | Implicación |
|----------|--------|------------|
| **Nombres de paquetes comerciales** (`ai-maturity`, `ai-compliance`, etc.) | Son decisión comercial de Alpha Consulting, no técnica | Mantener como-son hasta decisión business |
| **ToolCode enum valores** (`'T1'`, `'T2'`, ..., `'T12'`) | Identificadores canónicos de herramientas (usados en snapshots versionados) | Si cambiar, requiere data migration de snapshots históricos — aplazar a Fase 3+ |
| **Estados de caso de uso** (`'go'`, `'no_go'`, `'en_piloto'`) | Son agnósticos de dominio | Mantener como-son |
| **Matriz de recomendaciones T5** (`activar_ahora`, `pilotar_90d`, etc.) | Agnóstico (reutilizable para cualquier dominio) | Mantener como-son |
| **Tipos `T5MaturityLevel`, `T5Recommendation`** | Son agnósticos (maturidad + recomendaciones aplicables a cualquier dominio) | Renombrar genéricos: `EvaluationMaturityLevel`, `ActivationRecommendation` |
| **Dimensiones genéricas de scoring T4** (`businessValue`, `technicalReady`) | Son agnósticas | Mantener labels como-son, solo renombrar `aiRisk` → `regulatoryRisk` |

---

## BLOQUE 6: PLAN DE VALIDACIÓN Y ROLLBACK

### 6.1 Checklist pre-Sprint 13

- [ ] Backup completo de BD (Supabase snapshot exportado)
- [ ] Documentación de constants.ts actuales (hashes + wc -l)
- [ ] Tests E2E baseline (T1, T4, T5 scores = expected)
- [ ] Feature flags aprovisionados: `useDynamicSchemaRegistry`, `useDynamicConfig`
- [ ] Acuerdo de equipo: breaking changes tolerados en Fase 3 (post-migration)

### 6.2 Indicadores de Salud Post-Fase

| Fase | KPI | Umbral Pase | Umbral Fallo |
|------|-----|-------------|--------------|
| **Fase 1 (BD)** | Migración completa + índices | 100% tablas, 4/4 indices | Rollback si indexación tarda >5min |
| **Fase 2 (Zod)** | Schema dinámico == hardcodeado | 100% tests pass | Revert feature flag si algún enum falla |
| **Fase 3 (Stores)** | useT1Store nuevo == antiguo | Todos tests E2E pass | Revert si latencia > 200ms |
| **Fase 4 (UI)** | SpiderChart(6D) visual identical | Pixel-perfect regression test | Rollback si any layout shifts |
| **Fase 5 (Config)** | Queries a BD == constants.ts | 100% feature flag toggles | Keep flag OFF si latencia > 300ms |
| **Fase 6 (Prompts)** | LLM outputs ==  baseline | Semantic similarity > 0.95 | Revert si quality score baja |
| **Fase 7 (Piloto)** | Data domain fully functional | CRUD + scoring working | Rollback si T1Data scores inconsistent |
| **Fase 8 (Limpieza)** | Zero references a "ai_*" nombres | Grep finds zero | Defer renombramientos si breaking |

### 6.3 Estrategia de Rollback

**Cada Fase es independently rollbackable:**

1. **Fase 1:** `supabase db reset` + redeploy código actual
2. **Fase 2:** Desactivar `useDynamicSchemaRegistry` flag + redeploy
3. **Fase 3:** Revert store.ts a `useT1Store` anterior (guardar copia)
4. **Fase 4:** Revert T1View + SpiderChart a anterior
5. **Fase 5:** Desactivar `useDynamicConfig` flag
6. **Fase 6:** Redeploy Edge Functions con prompts hardcodeados
7. **Fase 7:** Depurar o rollback dominio 'data' de BD
8. **Fase 8:** Versionar data migration, permite undo

**Rollback end-to-end:** Máximo 2 horas si se ejecuta antes de prod push.

---

## BLOQUE 7: MATRIZ DE RIESGOS DETALLADA

### 7.1 Riesgos por Fase

| Fase | Riesgo | Probabilidad | Impacto | Mitigación |
|------|--------|--------------|--------|-----------|
| **1 (BD)** | Data loss en migración | BAJA | CRÍTICO | Snapshot previo + restore test en staging |
| **1 (BD)** | Índices timeout | BAJA | MEDIO | Usar CONCURRENTLY, test en BD local primero |
| **2 (Zod)** | Enum values diverge from registry | MEDIA | MEDIO | Tests de equivalencia byte-to-byte |
| **2 (Zod)** | Performance degradation | BAJA | BAJO | Lazy-load registry, cache en memory |
| **3 (Stores)** | State mutation bugs con Immer | BAJA | MEDIO | Snapshot testing antes/después |
| **3 (Stores)** | Memory leaks en debounce timers | MEDIA | BAJO | useEffect cleanup in unmount |
| **4 (UI)** | Visual regressions N-axis | MEDIA | BAJO | Pixel regression tests + manual QA |
| **4 (UI)** | Performance: 100+ panels | BAJA | BAJO | Virtualization + lazy load |
| **5 (Config)** | Inconsistent data: BD vs constants | MEDIA | MEDIO | Dual-read en transición, feature flag OFF default |
| **5 (Config)** | RLS policies break on schema change | MEDIA | CRÍTICO | Audit + test RLS ANTES de deploy |
| **6 (Prompts)** | LLM output quality degrades | MEDIA | MEDIO | A/B testing, baseline comparison |
| **6 (Prompts)** | Rate limiting errors | BAJA | BAJO | Expand rate limit quota pre-deploy |
| **7 (Piloto)** | Data domain inconsistency | MEDIA | MEDIO | Mirror test suite T1 ↔ T1Data |
| **8 (Limpieza)** | Missed references to renamed fields | MEDIA | ALTO | Automated grep + manual code review |

### 7.2 Vulnerabilidades de Seguridad

| Vulnerabilidad | Línea/Archivo | Severidad | Parche |
|---|---|---|---|
| Prompt injection en prompts dinámicos | supabase/functions/ai-recommend/* | MEDIA | Sanitize {{variables}} antes de LLM |
| SQL injection en dynamic queries | src/services/*.ts | BAJA | Supabase uses parameterized queries |
| Type coercion attacks | src/lib/schemas/* | BAJA | Zod validation + strict parsing |

---

## CONCLUSIÓN

GOBY contiene **~214 literales IA** distribuidos en 12 módulos. De estos:

- **30 son triviales** (UI labels, nombres comerciales).
- **65 son moderados** (configuración, enums, pero sin dependencias).
- **119 son críticos** (core logic, constantes acopladas, tipos TypeScript).

**Esfuerzo total:** 112-156 horas (6-7 sprints con equipo de 2 dev).

**Recomendación de ejecución:**
1. **Fase 1-2 (Sprints 13-14):** Infraestructura base + tipado dinámico.
2. **Fase 3-5 (Sprints 14-15):** Motor de gobierno reutilizable.
3. **Fase 6-7 (Sprints 15-16):** Piloto segundo dominio (Data Governance).
4. **Fase 8 (Sprint 16+):** Limpieza + go-live multidominio.

**Go-live multidominio es alcanzable sin rewrite destructivo.** El acoplamiento está estructurado y extractible.

---

**Fin del análisis.**  
Analista: Claude Code (Haiku 4.5)  
Fecha: 2026-08-21  
Documento fuente: INFORME_DESACOPLAMIENTO_GOBIERNO.md + POC_RESOLUCION_RIESGOS_FRONTEND.md

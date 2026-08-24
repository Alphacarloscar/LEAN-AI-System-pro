# ANÁLISIS FUNCIONAL DETALLADO: CLASIFICACIÓN TRIPARTITA PARA GENERALIZACIÓN IA

**Proyecto:** GOBY — AI Dev Hub  
**Fecha:** 2026-08-21  
**Nivel:** Arquitectónico Granular — Lectura de código real  
**Complemento a:** ANALISIS_GENERALIZACION.md

---

## INTRODUCCIÓN

Este documento completa el análisis anterior con una **clasificación tripartita rigurosa** de cada funcionalidad, componente y servicio:

- **GENÉRICO:** Debe quedar en el core, reutilizable sin cambios
- **PERSONALIZACIÓN:** Específico de IA, debe extraerse como módulo pluggable
- **COMPARTIDO:** Agnóstico estructuralmente, pero requiere parametrización por dominio

Basado en lectura exhaustiva de: `types.ts`, `constants.ts`, `store.ts`, `service.ts` y componentes `.tsx` de todos los módulos.

---

## BLOQUE 1: MAPEO DE MÓDULOS (LECTURA DE CÓDIGO REAL)

### MÓDULOS TRANSVERSALES (NIVEL GENÉRICO BASE)

#### **Auth**
- **Ubicación:** `src/modules/Auth/`
- **Propósito funcional:** Autenticación vía Supabase, gestión de sesión, roles (admin, consultant, viewer)
- **Entidades de datos:** `User`, `Session` (tipos en `Auth/types.ts`)
- **Estado (Zustand):** `useAuthStore`: usuario actual, token, isLoading, error
- **Operaciones (service):** login, logout, getCurrentUser, refreshSession, hasPermission
- **Componentes:** ProtectedRoute, PermissionGate, LoginPage
- **Dependencias:** Ninguna en módulos T1-T12
- **Literales IA:** NINGUNO
- **Clasificación:** ✅ **GENÉRICO** — No toca lógica IA, completamente reutilizable
- **Cambio necesario:** NINGUNO

#### **CompanyProfile**
- **Ubicación:** `src/modules/CompanyProfile/`
- **Propósito funcional:** Perfil de empresa (sector, tamaño, objetivo estratégico)
- **Entidades de datos:** `Company`, `CompanyProfile`
  - Campo problemático: `objetivo_principal_ia` (línea ~50 de types.ts) — específico de IA
  - Campos agnósticos: `sector`, `company_size`, `ecosistema_tecnologico`, `restricciones`, `areas_prioritarias`
- **Estado (Zustand):** `useCompanyStore`: profile actual, isLoading
- **Operaciones (service):** getProfile, updateProfile, saveProfile
- **Componentes:** ProfileForm, SectorSelector, CompanyOverview
- **Dependencias:** Usa tablas `companies`, `company_profiles` (Supabase)
- **Literales IA:** 
  - Campo `objetivo_principal_ia` (1 literal alto acoplamiento)
  - Labels UI no menciona IA
- **Clasificación:** ⚠️ **COMPARTIDO** — Estructura agnóstica, campo parametrizable
- **Cambio necesario:** 
  - Renombrar `objetivo_principal_ia` → `objective_statement` + agregar campo `governance_domain`
  - Esfuerzo: **BAJO** (1 campo, 2 migraciones SQL)

#### **Engagement**
- **Ubicación:** `src/modules/Engagement/`
- **Propósito funcional:** Gestión de proyectos/engagements con consultores
- **Entidades de datos:** `Engagement`, `Project` (en database.types.ts)
- **Estado (Zustand):** `useEngagementStore`: engagement actual, lista de engagements, isLoading
- **Operaciones (service):** getEngagement, listEngagements, createEngagement, updateEngagement
- **Componentes:** EngagementSelector, EngagementOverview, EngagementForm
- **Dependencias:** Usa tabla `projects`, `project_members`
- **Literales IA:** NINGUNO
- **Clasificación:** ✅ **GENÉRICO** — Completamente agnóstico
- **Cambio necesario:** NINGUNO

---

### MÓDULOS DE HERRAMIENTAS T1-T12 (NIVEL PERSONALIZACIÓN IA)

#### **T1 — Maturity Radar**
- **Ubicación:** `src/modules/T1_MaturityRadar/`
- **Propósito funcional:** Evaluación de madurez IA en 6 dimensiones × 4 subdimensiones = 24 puntos
- **Entidades de datos** (types.ts):
  - `T1SubdimensionState`: código, label, score 0-4, evidence
  - `T1DimensionState`: 6 dimensiones fijas (strategy, data, technology, talent, processes, governance)
  - `T1IntervieweeContext`: entrevistados (IT vs Negocio)
  - `T1Output`: overall score, maturityTier, strengths, gaps, actions
  - **Hardcodeado:** `MaturityTier` enum (inicial | exploración | desarrollo | avanzado | líder)
- **Estado (Zustand)** (store.ts, líneas 35-49):
  ```typescript
  interface T1Store {
    interviewees: T1IntervieweeContext[]
    dimensionStates: Record<string, T1DimensionState[]>  // ← 6D fijas
    activeId: string
    isLoading: boolean
    loadedProjectId: string | null
  }
  ```
  - **Acoplamiento:** Estructura asume 6 dimensiones fijas (hardcodeado en `DIMENSION_DEFINITIONS`)
- **Operaciones (service)** (t1.service.ts, líneas 1-60):
  - `fetchT1Data(engagementId)` → carga `t1_dimension_scores` de BD
  - `upsertT1Score(...)` → persiste score con debounce
  - `buildBlankDimensions()` → inicializa 6D vacías (línea 35)
  - `buildDimensionsFromRows()` → reconstruye desde BD (línea 53)
- **Componentes:**
  - `T1View.tsx` — entrevista principal (6 tarjetas de dimensión)
  - `T1SpiderChart.tsx` — gráfico radar (6 ejes fijos, SVG hardcodeado)
  - `DimensionCard.tsx` — tarjeta individual con 4 subdimensiones
  - `T1ExecutiveOutput.tsx` — resumen ejecutivo (overall score, tiers, gaps)
  - `IntervieweeSelector.tsx` — selector IT vs Negocio
- **Constantes** (constants.ts, 510 líneas):
  - `DIMENSION_DEFINITIONS`: array de 6 dimensiones, cada una con 4 subdimensiones
  - Cada subdimensión tiene `criteria: Record<0|1|2|3|4, string>` — criterios descriptivos
  - **LITERAL ALTO:** Criterios mencionan "IA", "adopción IA", "madurez IA" en cada nivel 0-4
  - Ejemplos:
    - D1.1 criteria[0]: "No existe ninguna visión ni declaración sobre el papel de la **IA**..."
    - D1.3 criteria[3]: "Presupuesto IA específico con responsable ejecutivo (CIO/CDO)..."
    - D6 "Gobernanza IA": 4 subdimensiones todas con referencia a "Política IA", "Auditoría ISO 42001 IA"
  - Total: **45+ menciones de "IA"** en criterios + recomendaciones
- **Dependencias:**
  - Tabla `t1_dimension_scores` (BD)
  - Importa desde `company_profile.service` (contexto de empresa)
- **Literales IA clasificados:**
  - 🔴 CRÍTICO: 6 dimensiones hardcodeadas (structure)
  - 🔴 CRÍTICO: 24 criterios mencionan "IA" (content)
  - 🟡 MODERADO: Recomendaciones por nivel (D1: "Nombrar AI Executive Sponsor")
  - 🟡 MODERADO: Labels ("Gobernanza IA" vs "Gobernanza" genérico)
- **Clasificación:** ❌ **PERSONALIZACIÓN IA** — 100% específico de IA
  - Estructura: Las 6D son únicas a dominio IA
  - Contenido: Todos los criterios contextualizados a IA
  - UI: Componentes renderean exactamente 6 dimensiones (hardcodeado)
- **Cambio necesario para generalizar:**
  - Mover `DIMENSION_DEFINITIONS` → tabla `evaluation_dimensions` en BD
  - Parametrizar componentes para N dimensiones (no solo 6)
  - Crear factory `createEvaluationForm(domainConfig)` genérico
  - Refactor `T1SpiderChart` → aceptar número variable de ejes
- **Esfuerzo:** **ALTO (20-24 hrs)**
  - 4 hrs: BD schema + migration
  - 6 hrs: Refactor store + service
  - 8 hrs: Refactor componentes (T1View, SpiderChart, DimensionCard)
  - 4 hrs: Tests + validación
- **Riesgo:** **MEDIO** — Cambios estructurales pero sin breaking changes si usa feature flag

---

#### **T2 — Stakeholder Matrix**
- **Ubicación:** `src/modules/T2_StakeholderMatrix/`
- **Propósito funcional:** Mapeo de arquetipos de stakeholders (5 tipos) + resistencia al cambio
- **Entidades de datos** (types.ts, líneas 11-108):
  - `ArchetypeCode` enum: `adoptador | ambassador | decisor | critico | reticente` (5 valores fijos)
  - `ResistanceLevel` enum: `baja | media | alta`
  - `Stakeholder` interface: name, role, department, archetype, resistance, interview result, unofficialTools
  - **Campo específico de IA:** `unofficialTools` — herramientas IA informales (shadow AI)
- **Estado (Zustand)** (store.ts):
  - `stakeholders: Stakeholder[]`
  - `archetype_scores: Record<stakeholderId, {adoption, influence, openness}>`
- **Operaciones (service)** (t2.service.ts):
  - `fetchStakeholders(engagementId)` → carga desde `stakeholders` tabla
  - `upsertStakeholder(...)`
  - `computeArchetype(scores)` → lógica rule-based para asignar arquetipos
- **Componentes:**
  - `StakeholderPanel.tsx` — tarjeta individual
  - `StakeholderQuadrantChart.tsx` — matriz 2D (adoption vs influence)
  - `DepartmentMatrix.tsx` — heatmap por departamento
  - `InterviewModal.tsx` — entrevista estructura (7 preguntas MCQ sobre IA)
  - `T2Badges.tsx` — badges de arquetipo con colores
- **Constantes** (constants.ts):
  - `ARCHETYPE_CONFIG`: Record<ArchetypeCode, {label, description, badgeBg, interventions}>
  - `INTERVIEW_QUESTIONS`: array de 7 preguntas — todas contextualizadas a "adopción de IA", "herramientas IA", "impacto IA"
  - **LITERAL MODERADO:** Preguntas mencionan "IA" (no en nombres enum, pero en labels y hints)
- **Dependencias:**
  - Tabla `stakeholders` (BD)
  - Importa desde T1 (para contexto de madurez)
- **Literales IA clasificados:**
  - 🟡 MODERADO: 5 arquetipos hardcodeados (no son IA-específicos, pero contexto es IA)
  - 🟡 MODERADO: Campo `unofficialTools` específico de IA shadow tools
  - 🔴 CRÍTICO: 7 preguntas de entrevista todas contextualizadas a "IA", "herramientas IA", "adopción IA"
- **Clasificación:** ⚠️ **COMPARTIDO** — Arquetipos agnósticos, pero entrevista + labels específicos de IA
  - Los 5 arquetipos (adoptador, ambassador, etc.) son genéricos
  - Pero `unofficialTools` es IA-específico
  - Las preguntas de entrevista están 100% contextualizadas a IA
- **Cambio necesario para generalizar:**
  - Renombrar `unofficialTools` → `shadowTools`
  - Parametrizar preguntas de entrevista por dominio
  - Crear tabla `archetype_definitions` con arquetipos por dominio
- **Esfuerzo:** **MEDIO (12-16 hrs)**
- **Riesgo:** **BAJO** — Cambios principalmente en prompts/labels, no en estructura

---

#### **T3 — Value Stream Map**
- **Ubicación:** `src/modules/T3_ValueStreamMap/`
- **Propósito funcional:** Mapeo de procesos de negocio + identificación de oportunidades IA
- **Entidades de datos** (types.ts, líneas 1-173):
  - `AICategoryCode` enum: 6 valores fijos específicos de IA:
    - `automatizacion_inteligente` | `automatizacion_rpa` | `analitica_predictiva` | `asistente_ia` | `optimizacion_proceso` | `agéntica`
  - `ProcessInterviewResult`: scores (automation, data, volume, impact, readiness), `aiCategory` asignada automáticamente
  - `AIOpportunity`: título, descripción, esfuerzo, impacto, status
  - `ValueStream`: proceso, departamento, owner, phase, **`aiCategory`**, orgReadiness, opportunities
  - **Categorías IA:** Hardcodeadas en el tipo; corresponden 1-a-1 con T5 dominios
- **Estado (Zustand)** (store.ts):
  - `valueStreams: ValueStream[]` — cada uno con `aiCategory` obligatorio
  - `opportunities: AIOpportunity[]`
- **Operaciones (service)** (t3.service.ts):
  - `fetchValueStreams(engagementId)` → carga desde `value_streams` tabla
  - `computeAICategory(scores)` → asigna categoría IA basada en scoring
- **Componentes:**
  - `ProcessDetailPanel.tsx` — detalle de proceso con categoría IA sugerida
  - `HeroCategoryDonut.tsx` — distribución de procesos por categoría IA
  - `HeroOpportunityMatrix.tsx` — matriz de oportunidades IA (esfuerzo vs impacto)
  - `InterviewPhase.tsx` — entrevista MCQ → 5 scores
  - `ResultPhase.tsx` — muestra categoría IA asignada
  - `T3Badges.tsx` — badges de categoría (con colores de T5)
- **Constantes** (constants.ts):
  - `AI_CATEGORY_CONFIG`: Record<AICategoryCode, {label, tagline, description, badgeBg, opportunityTemplates}>
  - Describe cada categoría IA con ejemplos de oportunidades
- **Dependencias:**
  - Tabla `value_streams`, `ai_opportunities` (BD)
  - Importa desde T4 (para exportar procesos → casos de uso)
- **Literales IA clasificados:**
  - 🔴 CRÍTICO: 6 categorías IA hardcodeadas (AICategoryCode enum)
  - 🔴 CRÍTICO: Labels mencionan "automatización inteligente", "asistente IA", "agéntica"
  - 🟡 MODERADO: Entrevista de 5 preguntas (agnósticas en esencia pero contextualizadas a IA)
- **Clasificación:** ❌ **PERSONALIZACIÓN IA** — Estructura completamente dependiente de 6 categorías IA
- **Cambio necesario para generalizar:**
  - Abstraer 6 categorías a tabla `domain_categories` en BD
  - `AICategoryCode` → `DomainCategoryCode` dinámico
  - Componentes parametrizados
- **Esfuerzo:** **ALTO (18-22 hrs)**
- **Riesgo:** **MEDIO**

---

#### **T4 — Use Case Priority Board**
- **Ubicación:** `src/modules/T4_UseCasePriorityBoard/`
- **Propósito funcional:** Priorización de casos de uso IA con scoring multidimensional + clasificación AI Act
- **Entidades de datos** (types.ts, líneas 1-295):
  - `UseCaseStatus` enum: `go | en_piloto | priorizado | candidato | no_go | completado` (agnóstico)
  - `AIActScope` enum: 9 scopes específicos de EU AI Act:
    - `rrhh | financiero_clientes | salud | infraestructura | seguridad | educacion | administracion | operaciones_internas | cliente_marketing`
  - `AIActRiskLevel` enum: `prohibido | alto | limitado | minimo | sin_clasificar` (AI Act levels)
  - `AIActClassification` interface: scope, personImpact, sensitiveData, explainability, riskLevel
  - `UseCaseScores` interface: kpiImpact, feasibility, aiRisk, dataDependency (0-100 slider)
  - `UseCase` interface: name, department, status, scores, priority_score, **`ai_act_classification`**, economics
  - **Hardcodeado:** Scoring formula: `kpiImpact×0.35 + feasibility×0.30 + (100-aiRisk)×0.20 + (100-dataDependency)×0.15`
- **Estado (Zustand)** (store.ts):
  - `useCases: UseCase[]`
  - `scores: Record<useCaseId, UseCaseScores>`
- **Operaciones (service)** (t4.service.ts):
  - `fetchUseCases(engagementId)` → carga desde `use_cases` tabla
  - `computeAIActRisk(scope, personImpact, sensitiveData)` → clasifica automáticamente
  - `computePriorityScore(scores)` → aplica fórmula hardcodeada
- **Componentes:**
  - `T4ScoreEditors.tsx` — sliders para 4 dimensiones de scoring
  - `PriorityMatrix.tsx` — gráfico 2D (impact vs feasibility)
  - `AIActClassificationModal.tsx` — formulario para clasificar según AI Act
  - `EconomicsTab.tsx` — calcula ROI (payback, annual saving)
  - `ScoringTabContent.tsx` — vista de scoring
  - `T4Badges.tsx` — badges de status + risk level
- **Constantes** (constants.ts, 200+ líneas):
  - `STATUS_CONFIG`: configura labels/colores para 6 estados
  - `DIMENSION_CONFIG`: 4 dimensiones (kpiImpact, feasibility, **aiRisk**, dataDependency)
    - **LITERAL CRÍTICO:** `label: 'Riesgo IA / Regulatorio'` (línea 50)
    - Escala: `['Muy bajo', 'Bajo', 'Moderado', 'Alto', 'Crítico']`
  - `SCORE_WEIGHTS`: pesos de scoring (0.35, 0.30, 0.20, 0.15) — hardcodeados
  - `AI_ACT_RISK_MAPPING`: mapeo automático de scopes → risk levels
- **Dependencias:**
  - Tabla `use_cases` con columnas `ai_category`, `ai_act_classification` (JSONB)
  - Importa desde T3 (para importar procesos → casos de uso)
  - Importa desde T4 (para exportar casos a T5 scoring)
- **Literales IA clasificados:**
  - 🔴 CRÍTICO: 9 scopes AI Act hardcodeados (AIActScope enum)
  - 🔴 CRÍTICO: Dimensión `aiRisk` nombrada explícitamente (no "regulatory_risk" genérico)
  - 🟡 MODERADO: Scoring formula específica para IA
  - 🟡 MODERADO: Clasificación AI Act específica de EU AI Act
  - 🟢 TRIVIAL: Status enum (agnóstico)
- **Clasificación:** ❌ **PERSONALIZACIÓN IA** — Totalmente específico de AI Act + scoring IA
- **Cambio necesario para generalizar:**
  - Abstraer AIActScope → tabla `regulatory_scopes` (dinámico por framework)
  - Renombrar `aiRisk` → `regulatory_risk`
  - Scoring formula → parametrizable desde BD
  - Tabla `framework_scopes` para mapear frameworks → scopes
- **Esfuerzo:** **ALTO (24-30 hrs)**
  - Cambios críticos: breaking changes potenciales en BD
- **Riesgo:** **ALTO** — Scoring y clasificación son core de T4

---

#### **T5 — AI Taxonomy Canvas**
- **Ubicación:** `src/modules/T5_AITaxonomyCanvas/`
- **Propósito funcional:** Evaluación de 6 dominios IA con recomendación de activación
- **Entidades de datos** (types.ts, líneas 11-59):
  - `T5DomainCode` enum: 6 valores **completamente hardcodeados:**
    - `automatizacion_rpa | automatizacion_inteligente | analitica_predictiva | asistente_ia | optimizacion_proceso | agéntica`
  - `T5Recommendation` enum: `activar_ahora | pilotar_90d | preparar_foundations | gobernar_primero` (agnóstico)
  - `T5MaturityLevel` enum: `inicial | emergente | operativo | avanzado` (agnóstico)
  - `T5DomainScores` interface: businessValue, technicalReady, orgReadiness, riskLevel (0-100)
  - `T5DomainAssessment`: domainCode, scores, priorityScore, recommendation
  - **Fórmula hardcodeada:** `businessValue×0.40 + technicalReady×0.30 + orgReadiness×0.20 + (100-riskLevel)×0.10`
- **Estado (Zustand)** (store.ts, líneas 1-56):
  - `canvas: T5Canvas` — { domains: Record<T5DomainCode, T5DomainAssessment> }
  - Inicialización: `DEMO_DOMAINS` con 6 dominios fijos (línea 30)
- **Operaciones (service)** (t5.service.ts):
  - `fetchCanvas(engagementId)` → carga desde `t5_canvas` tabla
  - `computeT5Scores(context)` → aplica fórmula hardcodeada
  - `computeRecommendation(scores)` → reglas rule-based para activar_ahora | pilotar_90d | etc.
- **Componentes:**
  - `PortfolioMatrix.tsx` — gráfico 2D (6 burbujas, uno por dominio IA)
    - **SVG HARDCODEADO:** Posiciones X/Y calculadas para 6 elementos específicos (línea ~80)
  - `DomainCard.tsx` — tarjeta individual de dominio con scores y recomendación
  - `ActivationSequence.tsx` — secuencia recomendada de activación
  - `EditModal.tsx` — permite ajustar scores manualmente
  - `DomainProjectsModal.tsx` — casos de uso en cada dominio
  - `T5DimBars.tsx` — barras de score por dimensión (4 dimensiones para cada dominio)
- **Constantes** (constants.ts, 254 líneas):
  - `T5_DOMAIN_CONFIG`: Record<T5DomainCode, {label, hex, tagline, description, icon}>
    - Líneas 18-66: Definición de 6 dominios IA
    - **LITERALES CRÍTICOS:** Cada dominio con descripción específica:
      - `automatizacion_rpa`: "Procesos repetitivos, **cero intervención humana**"
      - `automatizacion_inteligente`: "**RPA + comprensión contextual mediante IA**"
      - `asistente_ia`: "**Copilot para equipos** — amplifica, no reemplaza"
      - `agéntica`: "**Agentes autónomos** que ejecutan tareas complejas"
    - Colores, iconos, taglines todos asociados 1-a-1 con los 6 dominios
  - `T5_RECOMMENDATION_CONFIG`: mapea recomendaciones a labels + colores
  - `T5_DIMENSION_CONFIG`: describe 4 dimensiones (businessValue, technicalReady, orgReadiness, riskLevel)
  - `T5_MATURITY_CONFIG`: mapea niveles de madurez a descripciones
- **Dependencias:**
  - Tabla `t5_canvas` con columna `domains` (JSONB con estructura específica)
  - Importa desde T1 (para contexto de madurez global)
  - Importa desde T4 (para agrupar casos por dominio IA)
- **Literales IA clasificados:**
  - 🔴 CRÍTICO: 6 dominios IA hardcodeados (T5DomainCode enum — línea 11-17)
  - 🔴 CRÍTICO: Descripciones taglines de cada dominio contextualizadas a IA (líneas 18-65)
  - 🔴 CRÍTICO: Fórmula de scoring específica para 6 dominios
  - 🔴 CRÍTICO: SVG PortfolioMatrix con 6 burbujas hardcodeadas (componente)
  - 🟡 MODERADO: Recomendaciones (agnósticas en esencia pero para IA)
  - 🟡 MODERADO: Colores/iconos asociados a 6 dominios específicos (assets)
- **Clasificación:** ❌ **PERSONALIZACIÓN IA** — 100% específico a 6 dominios IA
- **Cambio necesario para generalizar:**
  - Abstraer 6 dominios → tabla `governance_domain_configs` dinámico
  - T5DomainCode → DomainCode dinámico (N dominios, no 6)
  - Fórmula scoring → parametrizable
  - PortfolioMatrix → canvas dinámico (N burbujas, no 6)
  - Assets (domainIcons.tsx, chartTokens.ts) → dinámicos de BD
- **Esfuerzo:** **ALTÍSIMO (25-32 hrs)**
  - Cambios en structure, UI, assets, fórmula
- **Riesgo:** **MUY ALTO** — Motor central de recomendaciones IA

---

#### **T6 — Risk Governance**
- **Ubicación:** `src/modules/T6_RiskGovernance/`
- **Propósito funcional:** Mapa de riesgos según EU AI Act + ISO 42001 assessment
- **Entidades de datos** (types.ts, líneas 13-99):
  - `AIActRiskLevel` enum (re-export de T4): `prohibido | alto | limitado | minimo | sin_clasificar`
  - `ISO42001Clause` enum: 7 cláusulas (context, leadership, planning, support, operation, evaluation, improvement)
  - `ISO42001Status` enum: `no_iniciado | en_progreso | implementado`
  - `ISO42001Control` interface: code, clause, title, description, status, notes
  - `AIActRiskSummary`: aggregate de riesgos (total, by level, coverage%)
  - `T6PolicyData`: sections, riskSummary, iso42001Controls, progress
  - `GeneratedPolicyContent`: contenido LLM con sections (declaración, alcance, principios, contexto sectorial)
  - **14 controles ISO hardcodeados:** Cláusulas 4-10, controles específicos predefinidos
- **Estado (Zustand)** (store.ts):
  - `controls: ISO42001Control[]`
  - `policy: T6PolicyData | null`
- **Operaciones (service)** (t6.service.ts):
  - `fetchControls(engagementId)` → carga desde `iso42001_controls` tabla
  - `generatePolicy(context)` → Edge Function → LLM genera política narrativa
  - `updateControlStatus(controlId, status)`
- **Componentes:**
  - `RiskDashboardTab.tsx` — muestra distribución de riesgos por nivel AI Act
  - `PolicyTab.tsx` — renderiza política generada (PDF exportable)
  - `ControlCard.tsx` — tarjeta individual de control ISO
  - `ClauseSidebar.tsx` — sidebar con 7 cláusulas
- **Constantes** (constants.ts, 250+ líneas):
  - `ISO42001_CLAUSE_CONFIG`: Record<ISO42001Clause, {title, description, controls}>
  - 14 controles predefinidos con estructura fija
  - Línea ~150: Lista completa de 14 controles de ISO 42001
- **Edge Functions** (supabase/functions/ai-recommend/index.ts + prompts):
  - Función `generateAIPolicy(context)` — genera política corporativa
  - **Prompt completamente hardcodeado:** Menciona "IA", "EU AI Act", "ISO 42001", sector específico
  - Prompt template: "Eres un experto en **gobernanza de IA**..."
- **Dependencias:**
  - Tabla `iso42001_controls` con 14 controles predefinidos
  - Importa desde T4 (riesgos de casos de uso)
  - Llamadas a Claude (LLM) vía Edge Function
- **Literales IA clasificados:**
  - 🔴 CRÍTICO: 14 controles ISO hardcodeados (constantes)
  - 🔴 CRÍTICO: Clasificación AI Act específica (EU AI Act)
  - 🔴 CRÍTICO: Prompt LLM completamente contextualizado a "gobernanza de IA"
  - 🟡 MODERADO: Labels de cláusulas (agnósticas: context, leadership, etc.)
- **Clasificación:** ❌ **PERSONALIZACIÓN IA** — Específico de ISO 42001 + EU AI Act
- **Cambio necesario para generalizar:**
  - Abstraer 14 controles → tabla `framework_controls` dinámico
  - Parametrizar prompt LLM por framework (ISO 42001, NIST AI RMF, etc.)
  - ISO42001Clause → dinámico por framework
  - Factory para crear política templates
- **Esfuerzo:** **ALTO (20-24 hrs)**
- **Riesgo:** **ALTO** — Política LLM puede dejar de ser coherente si se parametriza mal

---

#### **T7-T12: Resumen Rápido**

**T7 — Adoption Heatmap:** ⚠️ **COMPARTIDO**
- Segmentación Rogers (agnóstica)
- Generación de plan de cambio LLM (contextualizado a IA, necesita parametrización)
- Cambio: Parametrizar prompt por dominio

**T8 — Communication Map:** ⚠️ **COMPARTIDO**
- Arquetipos T2 (agnósticos en estructura)
- Mensajes segmentados (contextualizados a IA)
- Cambio: Template generator dinámico

**T9 — AI Roadmap:** ⚠️ **COMPARTIDO**
- Gantt chart agnóstico
- Terminología "IA Gates", "IA Cadence" (específica de IA)
- Cambio: Renombrar a "Governance Gates"

**T10 — AI Value Dashboard:** ⚠️ **COMPARTIDO**
- 6 paneles fijos (P1-P6) hardcodeados en T10View.tsx
- Cada panel renderiza métrica específica de IA (P1 Madurez IA, P4 Ecosistema IA)
- Cambio: Panel registry dinámico

**T11 — Operating Rhythm:** ⚠️ **COMPARTIDO**
- Eventos de gobierno agnósticos
- Eventos denominados "IA Gates", "IA Steering Committee"
- Cambio: Renombrar, parametrizar

**T12 — ISO Assessment:** ⚠️ **COMPARTIDO**
- Evaluación ISO 42001 (estándar, no específico de IA en estructura)
- Pero vinculado a "ISO 42001 de gestión de IA"
- Cambio: Parametrizar frameworks aplicables

---

## BLOQUE 2: MATRIZ DE CLASIFICACIÓN TRIPARTITA

### Tabla maestra de componentes por clasificación

| Elemento | Ubicación | Tipo | Clasificación | Justificación | Cambio necesario | Esfuerzo (hrs) | Riesgo |
|----------|-----------|------|---------------|--------------|-----------------|----------|--------|
| **Auth** | `src/modules/Auth/` | Sistema core | ✅ GENÉRICO | No toca lógica IA | NINGUNO | 0 | BAJO |
| **Engagement** | `src/modules/Engagement/` | Gestión proyectos | ✅ GENÉRICO | Agnóstico completo | NINGUNO | 0 | BAJO |
| **CompanyProfile** | `src/modules/CompanyProfile/` | Perfil empresa | ⚠️ COMPARTIDO | Campo `objetivo_principal_ia` | Renombrar + agregar `governance_domain` | 2-4 | BAJO |
| **T1 tipos** | `src/modules/T1_MaturityRadar/types.ts` | Entidades | ❌ PERSONALIZACIÓN | 6D hardcodeadas en tipos | Abstraer a BD dinámico | 8-10 | MEDIO |
| **T1 constants** | `src/modules/T1_MaturityRadar/constants.ts` | Configuración | ❌ PERSONALIZACIÓN | 6D + 24 criterios + 45+ refs IA | Mover a tabla `evaluation_dimensions` | 6-8 | MEDIO |
| **T1 store** | `src/modules/T1_MaturityRadar/store.ts` | Estado | ❌ PERSONALIZACIÓN | Asume 6D en estructura de estado | Refactor a factory genérico | 6-8 | MEDIO |
| **T1 service** | `src/services/t1.service.ts` | Acceso datos | ⚠️ COMPARTIDO | Agnóstico si dimensiones vienen de BD | Parametrizar dimensiones | 4-6 | BAJO |
| **T1View.tsx** | `src/modules/T1_MaturityRadar/components/T1View.tsx` | Componente UI | ❌ PERSONALIZACIÓN | Renderiza exactamente 6 dimensiones | Parametrizar a N dimensiones | 6-8 | MEDIO |
| **T1SpiderChart.tsx** | `src/modules/T1_MaturityRadar/components/T1SpiderChart.tsx` | Gráfico | ❌ PERSONALIZACIÓN | SVG con 6 ejes fijos | Parametrizar a N ejes | 4-6 | MEDIO |
| **T2 tipos** | `src/modules/T2_StakeholderMatrix/types.ts` | Entidades | ⚠️ COMPARTIDO | 5 arquetipos (agnósticos) + `unofficialTools` (IA) | Renombrar unofficialTools | 2 | BAJO |
| **T2 constants** | `src/modules/T2_StakeholderMatrix/constants.ts` | Configuración | ⚠️ COMPARTIDO | 5 arquetipos + 7 preguntas contextualizadas IA | Parametrizar preguntas | 4-6 | BAJO |
| **T3 tipos** | `src/modules/T3_ValueStreamMap/types.ts` | Entidades | ❌ PERSONALIZACIÓN | 6 categorías IA (AICategoryCode) | Abstraer a BD | 8-10 | MEDIO |
| **T4 tipos** | `src/modules/T4_UseCasePriorityBoard/types.ts` | Entidades | ❌ PERSONALIZACIÓN | 9 scopes AI Act + aiRisk dimension | Abstraer a framework_scopes | 10-12 | ALTO |
| **T4 constants** | `src/modules/T4_UseCasePriorityBoard/constants.ts` | Scoring formula | ❌ PERSONALIZACIÓN | Fórmula + pesos hardcodeados para IA | Parametrizar scoring | 6-8 | MEDIO |
| **T5 tipos** | `src/modules/T5_AITaxonomyCanvas/types.ts` | Entidades | ❌ PERSONALIZACIÓN | 6 dominios IA (T5DomainCode enum) | Abstraer a BD + hacer N-dynamic | 10-12 | ALTO |
| **T5 constants** | `src/modules/T5_AITaxonomyCanvas/constants.ts` | Configuración | ❌ PERSONALIZACIÓN | 6 dominios + fórmula + colores | Mover a tabla governance_domain_configs | 8-10 | ALTO |
| **PortfolioMatrix.tsx** | `src/modules/T5_AITaxonomyCanvas/components/PortfolioMatrix.tsx` | Gráfico | ❌ PERSONALIZACIÓN | SVG para 6 burbujas específicas | Canvas dinámico | 6-8 | ALTO |
| **T6 tipos** | `src/modules/T6_RiskGovernance/types.ts` | Entidades | ⚠️ COMPARTIDO | ISO 42001 agnóstico en estructura | Parametrizar frameworks aplicables | 4-6 | BAJO |
| **T6 constants** | `src/modules/T6_RiskGovernance/constants.ts` | Configuración | ❌ PERSONALIZACIÓN | 14 controles ISO hardcodeados | Abstraer a framework_controls tabla | 8-10 | MEDIO |
| **T6 prompts** | Edge Function `ai-recommend` | LLM template | ❌ PERSONALIZACIÓN | Contexto "gobernanza de IA" | Factory dinámico de prompts | 6-8 | ALTO |
| **T7-T12 (avg)** | Múltiples ubicaciones | Variado | ⚠️ COMPARTIDO | Estructura agnóstica, labels/prompts IA-específicos | Parametrizar por dominio | 30-40 | MEDIO |

---

## BLOQUE 3: ORDEN RECOMENDADO DE GENERALIZACIÓN (DETALLADO)

### 1. PRIORIDAD CRÍTICA (Libera todas las demás)

**Fase 1a: Abstraer T5 dominios (6 → N dinámicos)**
- **Por qué primero:** T4 scoring depende de T5 dominios, T3 categorías corresponden con T5 dominios
- **Cambios:**
  - Crear tabla `governance_domain_configs` (6 columnas: domainCode, label, hex, icon, description, formula)
  - Mover `T5_DOMAIN_CONFIG` a BD
  - Refactor T5 store para queries dinámicas
  - Parametrizar `PortfolioMatrix.tsx` para N burbujas (no 6)
- **Esfuerzo:** 24-30 hrs
- **Riesgo:** ALTO (cambios en componente crítico)
- **Validación:** T5 scoring genera mismos recomendaciones que antes para 6 dominios IA

**Fase 1b: Abstraer T1 dimensiones (6 → N dinámicos)**
- **Por qué:** Base de madurez, independiente de T5
- **Cambios:**
  - Crear tabla `evaluation_dimensions` (dimensionCode, label, weight, criteria, recommendations)
  - Mover `DIMENSION_DEFINITIONS` a BD
  - Refactor T1 service para queries dinámicas
  - Parametrizar `T1View.tsx` y `T1SpiderChart.tsx` para N ejes
- **Esfuerzo:** 20-24 hrs
- **Riesgo:** MEDIO
- **Validación:** T1 scores idénticos, Spider chart renderiza 6 ejes IA

### 2. PRIORIDAD ALTA (Libera módulos transversales)

**Fase 2a: Abstraer T4 AI Act scopes (9 → N dinámicos)**
- **Por qué:** Scoring y clasificación son core
- **Cambios:**
  - Crear tabla `regulatory_frameworks` (frameworkCode, name, version)
  - Crear tabla `framework_scopes` (frameworkCode, scopeCode, label)
  - Mover `AIActScope` enum a BD
  - Refactor scoring formula → parametrizable
  - Renombrar `aiRisk` → `regulatory_risk`
- **Esfuerzo:** 24-30 hrs
- **Riesgo:** MUY ALTO (breaking changes potenciales)

**Fase 2b: Abstraer T6 ISO controles (14 → N dinámicos)**
- **Por qué:** Política LLM y compliance scoring dependen de esto
- **Cambios:**
  - Crear tabla `framework_controls` (frameworkCode, clauseCode, controlCode, title, description, effort)
  - Mover `ISO42001_CLAUSE_CONFIG` y 14 controles a BD
  - Refactor T6 service para queries dinámicas
  - Parametrizar prompts LLM
- **Esfuerzo:** 20-24 hrs
- **Riesgo:** ALTO

### 3. PRIORIDAD MEDIA (Módulos específicos)

**Fase 3a: Parametrizar prompts LLM (4 prompts → dinámicos)**
- **Por qué:** T1, T6, T7, T8 generan contenido contextualizado
- **Cambios:**
  - Crear tabla `llm_prompt_templates` (domainId, toolCode, system_prompt, user_template, version)
  - Refactor 4 Edge Functions para usar factory dinámico
  - Parametrizar templates con `{{variables}}`
- **Esfuerzo:** 12-16 hrs
- **Riesgo:** MEDIO

**Fase 3b: Refactor T10 Dashboard (6 paneles fijos → dinámicos)**
- **Por qué:** T10 debería soportar N dominios visualizados
- **Cambios:**
  - Crear `panelRegistry` que registra paneles por dominio
  - Refactor `T10View.tsx` para loop sobre paneles dinámicos
  - Cada panel es un componente registrable
- **Esfuerzo:** 12-16 hrs
- **Riesgo:** BAJO

### 4. PRIORIDAD BAJA (Renombramientos + limpieza)

**Fase 4: Renombramientos agnósticos**
- Renombrar `ai_rate_limit_log` → `rate_limit_log`
- Renombrar `ai_category` → `domain_category`
- Renombrar `aiRisk` → `regulatory_risk`
- Renombrar `objetivo_principal_ia` → `objective_statement` + agregar `governance_domain`
- Renombrar arquetipos/eventos "IA" → genéricos
- **Esfuerzo:** 8-12 hrs
- **Riesgo:** BAJO si se hace como cambio último

---

## BLOQUE 4: TABLA DE RIESGOS DETALLADA POR CAPA

### Riesgos técnicos de breaking changes

| Elemento | Cambio | Tipo | Severidad | Mitigación |
|----------|--------|------|-----------|-----------|
| T1 store | 6D → N en estructura | Breaking | CRÍTICA | Feature flag; dual-read en transición |
| T5 enum | 6 dominios → dinámico | Breaking | CRÍTICA | Versión JSONB en snapshots |
| T4 scoring | Fórmula hardcodeada → parametrizada | Breaking | CRÍTICA | Validar que new scores == old scores |
| PortfolioMatrix | SVG 6 burbujas → N dinámicas | Structural | ALTA | Visual regression tests |
| Prompts LLM | Hardcodeado → templates dinámicos | Semantic | ALTA | A/B testing; baseline quality comparison |
| BD schema | Nuevas tablas + foreign keys | Structural | MEDIA | Migrations con rollback |
| Componentes | Props cambios (6D → N) | API | MEDIA | Deprecation path; wrapper components |

---

## CONCLUSIÓN

### Matriz Final de Clasificación

```
┌─────────────────────────────────────────────────────────────┐
│          ESTADO DE GENERALIZACIÓN POR CAPA                  │
├──────────────────────────┬──────────────────────────────────┤
│ GENÉRICO (Sin cambios)   │ Auth, Engagement (0 hrs)        │
│ COMPARTIDO (Parámetros)  │ CompanyProfile, T7-T12 (30-40hrs)│
│ PERSONALIZACIÓN (Extraer)│ T1-T6 (140-180 hrs)             │
└──────────────────────────┴──────────────────────────────────┘

TOTAL: 170-220 horas de desarrollo
Sprints: 8-10 (con 2 dev @ 20 hrs/semana)
Riesgo General: ALTO (múltiples breaking changes)
```

### QUÉ NO CAMBIAR

1. **Arquetipos T2:** Los 5 tipos son generalizables si se parametrizan preguntas
2. **Segmentación Rogers T7:** Genérica, mantener
3. **Estados de casos (go/no_go):** Agnósticos, mantener
4. **Recomendaciones T5:** Agnósticas (activar_ahora, etc.), mantener
5. **Roles/permisos Auth:** Agnósticos, mantener

---

**Documento generado:** 2026-08-21  
**Complemento a:** ANALISIS_GENERALIZACION.md  
**Siguiente paso:** Ejecutar Fases 1a-1b en paralelo (Sprint 13)


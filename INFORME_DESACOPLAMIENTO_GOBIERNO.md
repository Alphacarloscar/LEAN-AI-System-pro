# INFORME DE DESACOPLAMIENTO: TRANSICIÓN HACIA ARQUITECTURA DE GOBIERNO MULTIDOMINIO

**Proyecto:** GOBY — AI Dev Hub  
**Versión del informe:** 2.0  
**Fecha de análisis:** 2026-08-17  
**Contexto:** Análisis exhaustivo de acoplamiento arquitectónico del módulo de Gobierno de IA hacia una plataforma agnóstica y extensible a múltiples dominios de gobernanza (Transformación, Datos, IA, Ciberseguridad, etc.)

---

## RESUMEN EJECUTIVO

GOBY es actualmente una **plataforma especializada en Gobierno de Inteligencia Artificial** organizada en **12 herramientas (T1–T12)** que forman un flujo integrado de evaluación, análisis y gobernanza. El análisis revela un **acoplamiento fuerte pero estructurado** entre la lógica de negocio específica de IA y la infraestructura base, lo que permite una estrategia de desacoplamiento en **3 fases sin rewrite destructivo**.

**Hallazgo crítico:** La mayoría del código está correctamente segregado en servicios, stores y contextos, facilitando la extracción modular. Sin embargo, existen **12 puntos clave de acoplamiento hardcodeado** que deben abstraerse para permitir tipos de gobierno dinámicos.

---

## 1. MAPEO Y INVENTARIO DE FUNCIONALIDADES Y HERRAMIENTAS

### 1.1 Estructura de las 12 Herramientas

| Tool | Código | Nombre | Propósito | Tipo de Entrada | Tipo de Salida | KPIs Clave | Acoplamiento IA |
|------|--------|--------|-----------|-----------------|----------------|-----------|-----------------|
| **T1** | `src/modules/T1_MaturityRadar/` | Maturity Radar | Evaluación de madurez IA en 6 dimensiones (Estrategia, Datos, Tecnología, Talento, Procesos, Gobernanza) × 4 subdimensiones cada una | Entrevista estructurada (0-4 puntos), perfil empresa (sector, tamaño, ecosistema), fricciones organizativas | 24 scores de subdimensiones, 6 scores de dimensiones, score global 0-4, matriz IT/Negocio, recomendaciones ejecutivas | Score de madurez por dimensión, brecha IT/Negocio, fortalezas/gaps | **HARDCODEADO:** 6 dimensiones fijas + D1-D6 en criterios de evaluación, cálculo de pesos 18%-18%-14%-16%-16%-18% |
| **T2** | `src/modules/T2_StakeholderMatrix/` | Stakeholder Matrix | Mapeo de arquetipos de stakeholders (5 arquetipos: Champion, Active Contributor, Influencer, Skeptic, Detractor) y análisis de resistencia al cambio IA | Entrevista de stakeholders, datos de T1, inventario de herramientas IA "officiales" vs "informales" | Matriz de resistencia/apoyo, posicionamiento en cuadrante, recomendaciones de engagement por perfil | Cobertura de stakeholders, personas en cada arquetipo, nivel de resistencia promedio | **HARDCODEADO:** 5 arquetipos fijos, entrevista con preguntas sobre "herramientas IA" |
| **T3** | `src/modules/T3_ValueStreamMap/` | Value Stream Map | Mapeo de procesos de negocio, identificación de fricciones (esperas, errores, información fragmentada) y oportunidades de automatización IA | Entrevista de procesos, datos de empresa | Mapa de procesos con fricciones categorizadas, oportunidad scores (0-4), exportación de casos de uso candidatos a T4 | Número de procesos mapeados, fricción promedio, casos de uso identificados | Acoplamiento débil: categorías de fricción genéricas ("espera", "error", "integración") |
| **T4** | `src/modules/T4_UseCasePriorityBoard/` | Use Case Priority Board | Priorización y scoring de casos de uso IA mediante matriz de impacto (KPI × facilidad × riesgo AI Act × dependencia datos) | Casos de uso de T3, scores de stakeholders (0-100 sliders), datos económicos (horas/semana, headcount, presupuesto) | Matriz de casos priorizado (priority score 0-100), recomendaciones go/no-go, ROI estimado (3 años, payback meses), clasificación AI Act | Casos scored, % go/no-go, ROI medio, cobertura de riesgos AI Act | **HARDCODEADO:** Clasificación AI Act con 7 scopes fijos (rrhh, financiero_clientes, salud, infraestructura, seguridad, educación, administración, operaciones_internas, cliente_marketing), pesos de scoring (40% KPI impact) |
| **T5** | `src/modules/T5_AITaxonomyCanvas/` | AI Taxonomy Canvas | Evaluación de 6 dominios IA (RPA, Auto-IA, Predictiva, Asistente, Optimización, Agéntica) y recomendación de activación con secuencia | Casos de uso de T4, scores por dominio (0-100), nivel de madurez T1 | Canvas con dominios priorizados, recommendation per domain (activar_ahora / pilotar_90d / preparar_foundations / gobernar_primero), secuencia de activación | Dominios activos, score de madurez por dominio, % preparado | **ALTAMENTE HARDCODEADO:** 6 dominios IA fijos con identidades visuales (iconos, colores, etiquetas), fórmula compuesta: value×0.40 + tech_ready×0.30 + org×0.20 + (100-risk)×0.10 |
| **T6** | `src/modules/T6_RiskGovernance/` | Risk Governance | Mapeo de riesgos IA según EU AI Act (4 niveles: prohibido, alto, limitado, mínimo) + ISO 42001 assessment (14 controles de cláusulas 4-10) | Casos de uso de T4 con clasificación AI Act, estado de controles ISO | Risk register de casos de uso con nivel AI Act, matriz de controles ISO con status (no iniciado/en progreso/implementado), política corporativa generada por LLM | % casos de alto riesgo, controles implementados, % ISO readiness | **HARDCODEADO:** Mapeo de scopes AI Act a niveles de riesgo (algoritmo computeAIActRisk), 14 controles ISO fijos (cláusulas 4-10) |
| **T7** | `src/modules/T7_AdoptionHeatmap/` | Adoption Heatmap | Evaluación de readiness de cada departamento para adoptar IA (madurez, resistencia, skills) y plan de gestión del cambio | Datos de T1/T2/T3, inventario departamental, nivel de madurez | Heatmap departamental de readiness, plan de change management generado por LLM (phases, communications, training) | Readiness score por dept, % de departamentos preparados | Acoplamiento moderado: dimensiones de readiness (Madurez, Resistencia, Skills) pueden ser genéricas |
| **T8** | `src/modules/T8_CommunicationMap/` | Communication Map | Diseño de estrategia de comunicación IA por arquetipos T2 (mensajes, canales, timing) | Arquetipos de T2, plan de cambio de T7, casos de uso de T4 | Plan de comunicaciones con mensajes segmentados por arquetipo, canal recomendado, timing, artefactos (email, newsletter, workshop) | % stakeholders comunicados, engagement rate por canal | Acoplamiento fuerte: contextualizado para "herramientas IA", arquetipos T2 fijos |
| **T9** | `src/modules/T9_AIRoadmap/` | AI Roadmap | Planificación temporal de activación de casos de uso IA con cadencia de governance (revisiones trimestrales, gates de decisión) | Casos go/no-go de T4, dominios de T5, items libres (iniciativas no mapeadas en T4) | Gantt chart de roadmap por trimestre, items con dueño, riesgo, status, KPIs de seguimiento | Roadmap coverage, casos en marcha, % completados | **HARDCODEADO:** Terminología de cadencia "IA" (trimestres AI, gates AI), dominio AI como eje organizador |
| **T10** | `src/modules/T10_AIValueDashboard/` | AI Value Dashboard | Dashboard ejecutivo sintético de valor generado por la cartera IA (P1 Madurez, P2 Portfolio, P3 Adopción, P4 Ecosistema, P5 Riesgos, P6 Governance) | Todos los outputs de T1-T9 | 6 paneles con KPIs agregados: score madurez, casos go vs no-go, adopción por dept, riesgos por nivel, controles ISO, dominios activos | KPI estratégico global, visibilidad ejecutiva | **ALTAMENTE HARDCODEADO:** Paneles específicos para IA (P6 Governance IA, P5 Riesgos IA, P4 Ecosistema IA), métricas derivadas |
| **T11** | `src/modules/T11_OperatingRhythm/` | Operating Rhythm | Cadencia de gobierno IA: definición de eventos de decisión (gov gates, reviews, decisiones por nivel), objetivos trimestrales, KPIs de seguimiento | Roadmap T9, stakeholders T2, casos T4, planes T7 | Calendario de eventos de gobierno, matriz de decisiones (quién decide qué en cada gate), objetivos OKRs para IA, dashboard de KPIs vivos | Eventos completados, decisiones tomadas a tiempo, % OKRs IA logrados | **HARDCODEADO:** Eventos de gobierno llamados "IA Gates", frecuencias "IA Cadence", niveles de decisión "IA Steering" |
| **T12** | `src/modules/T12_ISOAssessment/` | ISO 42001 Assessment | Evaluación de madurez según ISO/IEC 42001 (7 cláusulas, ~40 controles full mapping, MVP con 14 de T6) | T6 controls assessment, entrevistas de compliance | Control status matrix (no iniciado/en progreso/implementado), compliance score por cláusula (0-100), gap analysis respecto a certificación ISO | % controles implementados, score de cláusula, readiness para auditoría | Acoplamiento débil: estructura de controles ISO es agnóstica (pero terminología "AI Management System" es específica) |

### 1.2 Datos de Entrada Agregados

**De usuario:**
- Entrevistas estructuradas (T1: 24 preguntas 0-4 pts; T2/T3: preguntas abiertas + scoring)
- Inventario de herramientas IA actuales y aspiracionales
- Datos demográficos/departamentales de la empresa
- Histórico de proyectos fallidos/exitosos

**De sistema:**
- Perfiles de empresa: sector, tamaño, ecosistema tecnológico, restricciones, horizonte de valor
- Contexto de T1 → T4 (dimensiones de madurez influyen en scoring)
- Snapshots versionados en Supabase

### 1.3 Datos de Salida Agregados

**Reportes ejecutivos:**
1. **Situación actual:** Radar de madurez (T1), matriz de stakeholders (T2), mapa de procesos (T3)
2. **Cartera de inversión:** Matriz de casos de uso (T4), canvas de dominios (T5)
3. **Riesgos y gobernanza:** Risk register AI Act/ISO (T6/T12), plan de cambio (T7/T8)
4. **Hoja de ruta operacional:** Timeline de activación (T9), cadencia de decisión (T11)
5. **Dashboard de valor:** Agregado de KPIs (T10)

**Productos generados por LLM:**
- Recomendaciones de madurez (T1 prompt)
- Política corporativa de IA (T6 prompt)
- Plan de cambio (T7 prompt)
- Comunicaciones segmentadas (T8 prompt)

---

## 2. ENTIDADES Y ESTRUCTURA ORGANIZACIONAL REUTILIZABLE

### 2.1 Entidades Agnósticas (Independientes de Tipo de Gobierno)

Las siguientes entidades están almacenadas en Supabase y son **completamente reutilizables** para cualquier tipo de dominio de gobernanza:

#### **2.1.1 Empleados y Personas**

**Tabla:** `company_persons` (supabase/migrations/20260703_company_persons.sql)

```sql
CREATE TABLE company_persons (
  id                 uuid PRIMARY KEY,
  project_id         uuid NOT NULL,
  company_id         uuid,
  name               text NOT NULL,
  role               text,
  department         text,
  source_tool        text,  -- 'T1', 'T2', 'T3', etc.
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
)
```

**Atributos clave:**
- `name`, `role`, `department` — agnósticos
- `source_tool` — referencia a cuál herramienta los ingresó
- Relaciones: N personas por proyecto

**Acoplamiento actual:** Débil — la tabla no tiene campos específicos de IA. El acoplamiento está en los **servicios** que acceden (ej. `company-person.service.ts`), no en la estructura.

#### **2.1.2 Departamentos**

**Tabla:** `company_departments`

```sql
CREATE TABLE company_departments (
  id         uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  name       text NOT NULL,
  type       text,  -- genérico, puede ser cualquier cosa
  color      text,
  created_at timestamptz
)
```

**Atributos clave:**
- Estructura plana: cada dept tiene nombre y color para visualización
- **Reutilizable:** para cualquier tipo de gobernanza

#### **2.1.3 Proyectos (Engagements)**

**Tabla:** `projects` (antes `engagements` en v1, normalizado en v2)

```sql
CREATE TABLE projects (
  id              uuid PRIMARY KEY,
  name            text NOT NULL,
  company_id      uuid,
  owner_id        uuid,
  current_phase   text,  -- genérico (listen, evaluate, activate, normalize, closed)
  status          text,  -- active, archived
  start_date      date,
  end_date        date,
  created_at      timestamptz
)
```

**Atributos clave:**
- `current_phase` es agnóstico — cada tipo de gobierno puede definir sus propias fases
- **Reutilizable:** para cualquier engagement

#### **2.1.4 Empresa (Perfil Organizacional)**

**Tabla:** `companies`

```sql
CREATE TABLE companies (
  id            uuid PRIMARY KEY,
  name          text NOT NULL,
  sector        text,
  company_size  text,
  slug          text,
  created_at    timestamptz
)
```

**Tabla relacionada:** `company_profiles` (almacena contexto específico por project)

```sql
CREATE TABLE company_profiles (
  id                     uuid PRIMARY KEY,
  project_id             uuid NOT NULL UNIQUE,
  sector                 text,
  tamano_empresa         text,
  objetivo_principal_ia  text,              -- ← HARDCODEADO A IA
  horizonte_valor        text,
  ecosistema_tecnologico text,
  restricciones          text,
  areas_prioritarias     jsonb,
  saved_at               timestamptz,
  created_at             timestamptz,
  updated_at             timestamptz
)
```

**⚠️ Acoplamiento crítico detectado:**
- Campo `objetivo_principal_ia` está hardcodeado a IA
- **Solución:** Renombrar a `objetivo_principal` + agregar campo `domain_type` que identifique el dominio de gobernanza

#### **2.1.5 Fricciones/Problemas**

**Tabla:** `frictions`

```sql
CREATE TABLE frictions (
  id              uuid PRIMARY KEY,
  project_id      uuid NOT NULL,
  tipo            text NOT NULL,       -- genérico: "espera", "error", "integración"
  area_funcional  text,
  frecuencia      text,                -- "Baja", "Media", "Alta"
  impacto         text,                -- "Bajo", "Medio", "Alto"
  notas           text,
  created_at      timestamptz
)
```

**Atributos clave:**
- Completamente agnóstico — puede aplicarse a cualquier evaluación
- **Reutilizable:** sin cambios

#### **2.1.6 Miembros del Proyecto**

**Tabla:** `project_members`

```sql
CREATE TABLE project_members (
  project_id uuid NOT NULL,
  user_id    uuid NOT NULL,
  role       text,              -- 'admin', 'consultant', 'viewer'
  added_at   timestamptz,
  PRIMARY KEY (project_id, user_id)
)
```

**Atributos clave:**
- Agnóstico — roles de acceso, no específicos de IA
- **Reutilizable:** sin cambios

#### **2.1.7 Snapshots de Datos (Versionado)**

**Tabla:** `snapshots`

```sql
CREATE TABLE snapshots (
  id          uuid PRIMARY KEY,
  project_id  uuid,
  tool        text,              -- 'T1', 'T2', ..., 'T10'
  data        jsonb,             -- payload del snapshot
  label       text,              -- etiqueta manual (ej. "Sprint 10 final")
  created_at  timestamptz
)
```

**Atributos clave:**
- Agnóstico — almacena cualquier JSON serializable
- Campo `tool` referencia la herramienta origen (puede extenderse a nuevas herramientas)
- **Reutilizable:** sin cambios

### 2.2 Entidades Específicas de IA (Altamente Acopladas)

Las siguientes entidades están tightly coupled a la gobernanza de IA y requerirán **abstracción** para multidominio:

#### **2.2.1 Casos de Uso (T4)**

**Tabla:** `use_cases`

```sql
CREATE TABLE use_cases (
  id                     uuid PRIMARY KEY,
  project_id             uuid NOT NULL,
  name                   text NOT NULL,
  department             text,
  ai_category            text,              -- ← HARDCODEADO: RPA, Auto-IA, Predictiva, etc.
  status                 text,              -- candidato, priorizado, go, no_go, en_piloto, completado
  scores                 jsonb,             -- {kpiImpact, feasibility, aiRisk, dataDependency}
  priority_score         numeric,
  economics              jsonb,             -- ahorro, headcount, costo implementación
  ai_act_classification  jsonb,             -- {scope, personImpact, sensitiveData, explainability}
  go_no_go               jsonb,
  roadmap                jsonb,
  created_at             timestamptz
)
```

**Acoplamiento:**
- `ai_category` enumera 6 dominios IA fijos
- Scoring es específico de IA Act (4 dimensiones: KPI Impact, Feasibility, AI Risk, Data Dependency)
- Campos de clasificación regulatoria (AI Act específico)

**Abstracción requerida:**
- Renombrar `ai_category` → `domain_category` + agregar `governance_domain` (IA, Datos, Transformación, etc.)
- Hacer `scoring_dimensions` dinámicas (JSONB flexible)

#### **2.2.2 Evaluación de Dimensiones T1**

**Tabla:** `t1_dimension_scores`

```sql
CREATE TABLE t1_dimension_scores (
  id                    uuid PRIMARY KEY,
  project_id            uuid NOT NULL,
  dimension_code        text NOT NULL,     -- 'strategy', 'data', 'technology', etc.
  subdimension_code     text NOT NULL,     -- 'data-availability', etc.
  score                 numeric(3,1),      -- 0-4
  evidence              text,
  interviewee_id        text,
  interviewee_name      text,
  interviewee_role      text,
  person_id             uuid,              -- FK company_persons (nuevo en Sprint X)
  created_at            timestamptz,
  UNIQUE(project_id, dimension_code, subdimension_code)
)
```

**Acoplamiento:**
- Estructura de 6 dimensiones × 4 subdimensiones está **hardcodeada en código**
- En `src/modules/T1_MaturityRadar/constants.ts`: `DIMENSION_DEFINITIONS` con definiciones fijas

#### **2.2.3 Canvas de Dominios T5**

**Tabla:** `t5_canvas`

```sql
CREATE TABLE t5_canvas (
  id                  uuid PRIMARY KEY,
  project_id          uuid NOT NULL UNIQUE,
  domains             jsonb,             -- {automatizacion_rpa: {...}, asistente_ia: {...}, ...}
  maturity_level      text,              -- inicial, emergente, operativo, avanzado
  activation_sequence jsonb,             -- array de domios en orden recomendado
  created_at          timestamptz
)
```

**Acoplamiento:**
- Keys del objeto `domains` son los 6 códigos IA fijos
- Fórmula de scoring: `businessValue×0.40 + technicalReady×0.30 + orgReadiness×0.20 + (100-riskLevel)×0.10` hardcodeada

#### **2.2.4 Controles ISO 42001 (T6/T12)**

**Tabla:** `iso42001_controls`

```sql
CREATE TABLE iso42001_controls (
  id              uuid PRIMARY KEY,
  project_id      uuid NOT NULL,
  code            text NOT NULL,        -- '4.1', '5.2', etc.
  clause          text NOT NULL,        -- 'context', 'leadership', 'planning', ...
  title           text NOT NULL,
  description     text,
  status          text,                 -- no_iniciado, en_progreso, implementado
  notes           text,
  auto_inferred   boolean,
  updated_at      timestamptz,
  UNIQUE(project_id, code)
)
```

**Acoplamiento:**
- Los 14 controles (MVP) están predefinidos en `src/modules/T6_RiskGovernance/constants.ts`
- Estructura de cláusulas (4-10) es específica de ISO 42001

#### **2.2.5 Stakeholders (T2)**

**Tabla:** `stakeholders`

```sql
CREATE TABLE stakeholders (
  id                  uuid PRIMARY KEY,
  project_id          uuid NOT NULL,
  name                text NOT NULL,
  role                text NOT NULL,
  department          text NOT NULL,
  archetype           text NOT NULL,     -- 'champion', 'contributor', 'influencer', 'skeptic', 'detractor'
  resistance          text,              -- score de resistencia
  interview           jsonb,             -- respuestas de entrevista
  unofficial_tools    text,              -- referencias a herramientas IA informales
  person_id           uuid,              -- FK company_persons
  created_at          timestamptz
)
```

**Acoplamiento:**
- Campo `archetype` enumera 5 arquetipos fijos específicos para IA
- Entrevista contextualizada a "herramientas IA"

#### **2.2.6 Items de Roadmap Libre (T9)**

**Tabla:** `t9_free_items`

```sql
CREATE TABLE t9_free_items (
  id              uuid PRIMARY KEY,
  project_id      uuid NOT NULL,
  name            text NOT NULL,
  department      text,
  status          text,              -- planificado, en_curso, completado
  start_month     int,               -- 1-12
  end_month       int,
  risk_level      text,              -- bajo, medio, alto
  responsible     text,
  created_at      timestamptz
)
```

**Acoplamiento:** Moderado — terminología de "riesgo" puede ser genérica, pero contexto es IA.

### 2.3 Relaciones Entre Entidades

**Diagrama de acoplamiento:**

```
┌─────────────────────────────────────────────────┐
│              NIVEL AGNÓSTICO                    │
│  companies ← company_departments ← company_persons
│  ↓                                               │
│  projects ← project_members ← profiles           │
│  ↓                                               │
│  snapshots (versionado de cualquier output)     │
│  ↓                                               │
│  frictions (genérico)                           │
└─────────────────────────────────────────────────┘
                      ↑
         ┌────────────┴─────────────┐
         ↓                          ↓
    NIVEL IA (ACOPLADO)       NIVEL IA (ACOPLADO)
    ─────────────────────     ─────────────────────
    company_profiles(*)       use_cases(*)
    ↓                         ↓
    t1_dimension_scores       iso42001_controls
    stakeholders(archetype)   t5_canvas
    ↓                         ↓
    t9_free_items, t9_overrides
    ↓
    t7_adoption_heatmap, t8_communication_map
    ↓
    tool_outputs (snapshots finales por tool)

(*) = campos con "objetivo_principal_ia", "ai_category", etc.
```

**Grado de acoplamiento por tabla:**

| Entidad | Acoplamiento | Razón | Esfuerzo Desacople |
|---------|--------------|-------|-------------------|
| companies, company_departments, company_persons | BAJO | Estructura plana y agnóstica | Bajo (datos solo) |
| projects, project_members, profiles | BAJO | Agnóstico completo | Bajo (datos solo) |
| frictions | BAJO | Tipos genéricos | Bajo (datos solo) |
| snapshots | BAJO | JSON flexible | Bajo (datos solo) |
| company_profiles | MEDIO | Campo `objetivo_principal_ia` hardcodeado | Medio (renombrar campo) |
| stakeholders | ALTO | Arquetipos específicos de IA | Medio-Alto (abstracción de arquetipos) |
| t1_dimension_scores | ALTO | 6 dimensiones fijas, criterios T1-específicos | Medio-Alto (meta-schema dinámico) |
| use_cases | ALTO | `ai_category` fijo, AI Act scoring hardcodeado | Alto (scoring dinámico) |
| iso42001_controls | ALTO | 14 controles predefinidos, estructura ISO específica | Alto (catálogo dinámico de controles) |
| t5_canvas | ALTO | 6 dominios IA fijos, fórmula de scoring hardcodeada | Alto (motor de dominios dinámico) |
| t9_free_items, t9_overrides | MEDIO | Terminología IA, pero estructura genérica | Medio (renombrar campos) |

---

## 3. CONFIGURACIÓN TÉCNICA Y ACOPLAMIENTO ACTUAL DE LA CAPA DE IA

### 3.1 Ubicación en Código de la Lógica Específica de IA

#### **A. Constantes Hardcodeadas (CRÍTICO)**

**Ubicación:** `src/modules/T{N}/constants.ts`

1. **T1 — 6 Dimensiones IA:**
   - Archivo: `src/modules/T1_MaturityRadar/constants.ts` (510 líneas)
   - Estructura: `DIMENSION_DEFINITIONS: DimensionDefinition[]`
   - Contenido: D1 Estrategia, D2 Datos, D3 Tecnología, D4 Talento, D5 Procesos, D6 Gobernanza
   - Cada dimensión con 4 subdimensiones, criterios 0-4, pesos
   - **Extracc necesaria:** Este metadato debe migrar a BD (`governance_dimensions` table)

2. **T5 — 6 Dominios IA:**
   - Archivo: `src/modules/T5_AITaxonomyCanvas/constants.ts` (254 líneas)
   - Estructura: `T5_DOMAIN_CONFIG`, `T5_RECOMMENDATION_CONFIG`, `T5_DIMENSION_CONFIG`, `T5_MATURITY_CONFIG`
   - Dominios: automatizacion_rpa, automatizacion_inteligente, analitica_predictiva, asistente_ia, optimizacion_proceso, agéntica
   - Fórmula de scoring: `businessValue×0.40 + technicalReady×0.30 + orgReadiness×0.20 + (100-riskLevel)×0.10`
   - **Extracción necesaria:** Crear tabla `governance_domain_configs` (BD)

3. **T4 — AI Act Scopes:**
   - Archivo: `src/modules/T4_UseCasePriorityBoard/types.ts` (295 líneas)
   - Enums: `AIActScope` (rrhh, financiero_clientes, salud, infraestructura, seguridad, educación, administración, operaciones_internas, cliente_marketing)
   - Función: `computeAIActRisk()` — lógica hardcodeada de clasificación
   - **Extracción necesaria:** Motor de reglas dinámico en Supabase Functions

4. **T6 — ISO 42001:**
   - Archivo: `src/modules/T6_RiskGovernance/constants.ts` (250+ líneas)
   - Estructura: 14 controles predefinidos (cláusulas 4-10 de ISO 42001)
   - Enums: `ISO42001Clause`, `ISO42001_CLAUSE_CONFIG`
   - **Extracción necesaria:** Tabla `iso_controls_catalog` con catálogo completo de controles

5. **Paquetes de Venta (Config Comercial):**
   - Archivo: `src/config/salesPackages.ts` (105 líneas)
   - Estructura: 4 paquetes predefinidos (ai-maturity, ai-compliance, ai-portfolio, iso-42001)
   - Cada paquete mapea a subset de tools (T1-T12)
   - **Extracción necesaria:** Tabla `sales_packages` + `package_tools` (relación N:M)

#### **B. Esquemas de Validación (CRÍTICO)**

**Ubicación:** `src/lib/schemas/t{N}.schemas.ts`

1. **T4 Economics Schema:**
   ```typescript
   // src/lib/schemas/t4.schemas.ts
   UseCaseEconomicsSchema = z.object({
     processHoursPerWeek: z.number(),
     headcount: z.number(),
     efficiencyGain: z.number(),          // 0-1
     hourlyRate: z.number(),
     implementationCost: z.number(),
   })
   ```
   - Estos campos podrían ser agnósticos, pero `efficiencyGain` asume mejora de "proceso IA"
   - **Extracción:** Generalizar a `UseCaseEconomicsSchema` genérico

#### **C. Prompts de LLM (CRÍTICO)**

**Ubicación:** `supabase/functions/ai-recommend/prompts/`

1. **T1 Prompt:** `src/modules/T1_MaturityRadar/constants.ts` (línea 67–96)
   ```
   SYSTEM_PROMPT: "Eres un consultor senior especializado en adopción estratégica de IA..."
   ```
   - Hardcodeado para IA, menciona "empresa B2B", "CIO/COO", marcos regulatorios específicos (EU AI Act)
   - **Extracción:** Parametrizar `{governance_domain}`, `{industry}`, `{executive_role}`

2. **T6 Policy Prompt:** En Edge Function `supabase/functions/ai-recommend/index.ts`
   - Genera política corporativa específica de IA (Art. 5, AI Act, RGPD)
   - **Extracción:** Template generator dinámico para políticas de cualquier dominio

3. **T7 Change Plan Prompt:** `src/hooks/useChangePlanGeneration.ts`
   - Contextualizado a "adopción de herramientas IA"
   - **Extracción:** Generar prompts dinámicos por dominio

#### **D. Enums y Type Definitions (CRÍTICO)**

**Ubicación:** `src/types/domain.types.ts`, `src/modules/*/types.ts`

```typescript
// src/types/domain.types.ts
export type ToolCode = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11' | 'T12'

// src/modules/T5_AITaxonomyCanvas/types.ts
export type T5DomainCode = 'automatizacion_rpa' | 'automatizacion_inteligente' | ...
export type T5Recommendation = 'activar_ahora' | 'pilotar_90d' | 'preparar_foundations' | 'gobernar_primero'

// src/modules/T4_UseCasePriorityBoard/types.ts
export type AIActRiskLevel = 'prohibido' | 'alto' | 'limitado' | 'minimo' | 'sin_clasificar'
```

**Problema:** Los tipos están en TypeScript, no son versionables ni consultables en BD. Se necesita tabla `enum_catalogs` que actúe como single source of truth.

### 3.2 Edge Functions y Generación de Contenido

**Ubicación:** `supabase/functions/ai-recommend/`

**Flujo de generación (20 líneas críticas):**

1. **Validación:** JWT + payload + rate limiting (línea 6-20 de index.ts)
2. **Rate limiting:** Tabla `ai_rate_limit_log` + función `check_and_log_ai_call()` (RLS)
3. **Llamada a Anthropic:**
   ```typescript
   const prompt = buildT1Prompt(context)  // o buildT6Prompt(), buildT7Prompt(), etc.
   const response = await anthropic.messages.create({
     model: 'claude-3-5-sonnet-20241022',
     max_tokens: 2000,
     system: prompt.system,
     messages: [{ role: 'user', content: prompt.user }],
   })
   ```
4. **Persistencia:** Insertar en `tool_outputs` tabla con payload versionado
5. **Respuesta:** JSON con `data` + `persistence` flag

**Acoplamiento:** Fuerte — cada tool tiene su propio prompt builder. Para multidominio, necesitamos **prompt factory pattern** dinámico.

### 3.3 Indicadores y Métricas Visualizadas (T10 Dashboard)

**Ubicación:** `src/modules/T10_AIValueDashboard/`

**Paneles:**

| Panel | Fuente | KPIs | Acoplamiento |
|-------|--------|------|--------------|
| **P1 Maturity** | T1 scores | Score madurez por dimensión, brecha IT/Negocio | ALTO (6 dimensiones IA) |
| **P2 Portfolio** | T4 use cases | % go vs no-go, casos priorizado | ALTO (categorías IA fijas) |
| **P3 Adoption** | T7 + proyecto | Heatmap de readiness departamental | MEDIO (puede generalizarse) |
| **P4 Ecosystem** | T5 + T4 | Dominios activos, % cubiertos | ALTO (6 dominios IA) |
| **P5 Risk** | T6 + T4 | % casos por nivel AI Act risk | ALTO (niveles AI Act) |
| **P6 Governance** | T12 + T6 | % controles ISO implementados, claúsulas | MEDIO-ALTO (ISO específica pero genérica) |

**Componentes hardcodeados:**

```typescript
// src/modules/T10_AIValueDashboard/t10ContextBuilder.ts
{
  "P1": { title: "Madurez IA", icon: "radar", ... },
  "P2": { title: "Portfolio de Casos IA", icon: "grid", ... },
  "P3": { title: "Adopción por Departamento", icon: "heatmap", ... },
  "P4": { title: "Ecosistema de Dominios IA", icon: "network", ... },
  "P5": { title: "Riesgos AI Act", icon: "alert", ... },
  "P6": { title: "Governance ISO 42001", icon: "shield", ... },
}
```

**Para multidominio:** Hacer paneles dinámicos, cada uno registrado en tabla `dashboard_panels` con tipo de gobernanza.

### 3.4 Sistemas de Recomendaciones

**Ubicación:** `src/hooks/useRecommendations.ts`, `supabase/functions/ai-recommend/`

**Mecanismo:**

1. **Prompts internos:** Construídos en el cliente (T1, T6, T7, T8) y enviados a Edge Function
2. **Motores de reglas:** Algunos scores calculados localmente (T5 scoring, T4 priority)
3. **LLM generation:** Solamente para contenido narrativo (T1 recommendations, T6 policy, T7 change plan, T8 communications)

**Tipos de recomendaciones:**

- **T1:** "Nombrar un AI Executive Sponsor..." (estrategia)
- **T5:** "Activar ahora" / "Pilotar 90 días" (dominio) — derivada de fórmula
- **T4:** Go/No-Go decision — score + regla empresarial
- **T6:** "Riesgo prohibido: requiere revisión legal" — regla AI Act
- **T7:** Plan de cambio multipasos — LLM generated

**Acoplamiento:** El 100% de recomendaciones está contextualizado a IA. Para multidominio:
- Extraer reglas de negocio a tabla `recommendation_rules` (si/entonces lógica)
- Parametrizar prompts para cualquier dominio

### 3.5 Personalización por Cliente

**Mecanismo actual:**

1. **Por proyecto:** Cada engagement/project tiene su conjunto de scores, casos, planes (aislados en BD)
2. **Por rol:** RLS policies en Supabase (admin, consultant, viewer)
3. **Por paquete:** Se vende "AI Maturity Boost", "AI Compliance", etc. (en `salesPackages.ts`)

**No hay personalización de:**
- Dimensiones de evaluación (T1 siempre 6D)
- Dominios de IA (T5 siempre 6 dominios)
- Niveles de riesgo regulatorio (siempre AI Act + ISO 42001)

**Para multidominio:** Necesitamos tabla `governance_configurations` que permita:
- Elegir dimensiones de evaluación por dominio
- Definir reglas de scoring customizadas
- Seleccionar frameworks regulatorios (EU AI Act, NIST, ISO 27001, CCPA, GDPR, etc.)

---

## 4. REQUERIMIENTOS TÉCNICOS PARA EL DESACOPLAMIENTO DE LA CAPA DE GOBIERNO

### 4.1 Puntos Exactos de Separación en Código

#### **4.1.1 Qué Mantener en Base (Reutilizable)**

```
✓ Capa de autenticación y autorización (Auth, RLS policies)
✓ Gestión de proyectos/engagements (projects, project_members)
✓ Gestión de personas y departamentos (company_persons, company_departments)
✓ Snapshots versionados (snapshots table + S3/object storage)
✓ Auditoría y logging (audit logs)
✓ Componentes UI agnósticos (Button, Card, Modal, Tabs del Design System)
✓ Hooks de utilidad (useServiceError, useEdgeFunctionInvoke — parametrizables)
✓ Servicio de Supabase genérico (lib/supabase.ts)
✓ Reportes ejecutivos en PDF (react-pdf, generalizable)
```

#### **4.1.2 Qué Extraer a Módulo Pluggable**

```
✗ Todas las herramientas T1-T12 (excepto estructura compartida)
✗ Todas las constantes hardcodeadas (T1 dimensions, T5 domains, T4 AI Act, T6 ISO controls)
✗ Todos los prompts de LLM (parametrizarlos)
✗ Todos los esquemas específicos de IA (t1.schemas, t4.schemas, t6.schemas)
✗ Todos los servicios específicos de IA (t1.service, t4.service, t6.service)
✗ Paneles del dashboard (T10) — hacerlos dinámicos
✗ Componentes de visualización (T1 SpiderChart, T5 PortfolioMatrix, etc.)
```

#### **4.1.3 Rutas y Puntos de Integración**

**Archivo clave:** `src/App.tsx` (routing principal)

```typescript
// Hoy:
<Route path="/t1" element={<T1View />} />
<Route path="/t2" element={<T2View />} />
...
<Route path="/packages/:packageId" element={<PackageView />} />
```

**Futuro (multidominio):**
```typescript
<Route path="/governance/:domainId/t1" element={<T1View domain={domainId} />} />
<Route path="/governance/:domainId/t2" element={<T2View domain={domainId} />} />
...
```

**Servicios principales que invocar:**

```typescript
// src/services/ — todos se refieren a Supabase
t1.service.ts          // getT1Scores, saveT1Scores
t4.service.ts          // getUseCases, saveUseCase
t6.service.ts          // getControls, updateControl
// ... etc
```

**Archivo de configuración de tipos:**
```typescript
// src/types/domain.types.ts
export type ToolCode = 'T1' | 'T2' | ... | 'T12'
export type GovernanceDomain = 'ai' | 'data' | 'transformation' | 'cybersecurity' | ...

// Futuro:
export type ToolConfig = {
  code: ToolCode
  domain: GovernanceDomain
  enabled: boolean
  config: Record<string, unknown>
}
```

### 4.2 Propuesta de Patrón de Diseño

#### **Opción A: Strategy Pattern (Recomendado)**

**Concepto:** Cada tipo de gobernanza implementa una "estrategia" con estructura común.

```typescript
// src/lib/governance/types.ts
export interface GovernanceStrategy {
  domain:           GovernanceDomain
  name:            string
  description:     string
  
  // Metadatos
  dimensions:      DimensionConfig[]
  scoringRules:    ScoringRule[]
  frameworks:      FrameworkConfig[]
  
  // Funciones
  validateContext:   (ctx: unknown) => Promise<void>
  buildPrompt:       (ctx: unknown) => { system: string; user: string }
  computeScores:     (responses: unknown) => ScoringResult
  generateReport:    (scores: ScoringResult) => Report
}

// Implementaciones:
// src/governance/strategies/AIGovernanceStrategy.ts
// src/governance/strategies/DataGovernanceStrategy.ts
// src/governance/strategies/TransformationGovernanceStrategy.ts
```

**Ventajas:**
- Cada estrategia encapsula su lógica sin afectar otras
- Fácil agregar nuevos tipos de gobernanza
- Compatible con arquitectura hexagonal

**Desventajas:**
- Requiere refactor significativo de T1-T12

#### **Opción B: Engine de Configuración Dinámica (Altamente Recomendado)**

**Concepto:** Base de datos centralizada que define dimensiones, reglas y frameworks de cualquier tipo de gobernanza.

```sql
-- Nueva tabla: governance_configurations
CREATE TABLE governance_configurations (
  id              uuid PRIMARY KEY,
  domain_id       text NOT NULL UNIQUE,  -- 'ai', 'data', 'transformation'
  domain_name     text NOT NULL,
  description     text,
  
  -- Metadatos
  dimensions_config jsonb,  -- array de { code, label, weight, criteria_0_4, ... }
  scoring_formula   jsonb,  -- { "formula": "dim1×0.4 + dim2×0.3...", "scale": "0-100" }
  frameworks        jsonb,  -- array de { code, name, standards, controls }
  
  enabled         boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Nueva tabla: governance_dimensions
CREATE TABLE governance_dimensions (
  id                uuid PRIMARY KEY,
  config_id         uuid NOT NULL REFERENCES governance_configurations(id),
  code              text NOT NULL,
  label             text NOT NULL,
  description       text,
  weight            numeric(3,2),  -- 0.00-1.00
  
  -- Criterios por nivel (0-4)
  criteria          jsonb,  -- { "0": "...", "1": "...", ..., "4": "..." }
  
  recommendations   jsonb,  -- { "inicial": "...", "exploracion": "...", ... }
  
  created_at        timestamptz DEFAULT now()
);

-- Nueva tabla: governance_rules
CREATE TABLE governance_rules (
  id            uuid PRIMARY KEY,
  config_id     uuid NOT NULL REFERENCES governance_configurations(id),
  rule_code     text NOT NULL,
  
  -- Lógica SI/ENTONCES
  condition     text,     -- JSON path expression
  action        text,     -- recomendación, clasificación, etc.
  
  created_at    timestamptz DEFAULT now()
);

-- Nueva tabla: llm_prompt_templates
CREATE TABLE llm_prompt_templates (
  id            uuid PRIMARY KEY,
  domain_id     text NOT NULL,
  tool_code     text NOT NULL,  -- 'T1', 'T6', 'T7', etc.
  
  system_prompt text NOT NULL,  -- template con {{variables}}
  user_template text NOT NULL,
  
  version       int DEFAULT 1,
  created_at    timestamptz DEFAULT now()
);
```

**Ventajas:**
- Sin recompilación — cambios se aplican en vivo
- Multidominio nativo desde el inicio
- Facilita A/B testing de frameworks

**Desventajas:**
- Mayor complejidad inicial en BD
- Requiere validación de JSON dinámico

#### **Opción C: Arquitectura Hexagonal (Recomendado para largo plazo)**

**Concepto:** Separar dominio (reglas de negocio) de infraestructura (BD, UI, API).

```
┌─────────────────────────────────────────────────┐
│         PUERTOS (Interfaces)                    │
│  ─ GovernanceRepository (BD)                    │
│  ─ RecommendationEngine (LLM)                   │
│  ─ RulesEngine (scoring, reglas)                │
│  ─ ReportGenerator (PDF, dashboards)            │
└─────────────────────────────────────────────────┘
                      ↑
         ┌────────────┴─────────────┐
         ↓                          ↓
    ADAPTADORES                 DOMINIO
    ─────────────────          ─────────
    Repository                 GovernanceAggregate
    (Supabase)                  ├─ context
    ↓                           ├─ dimensions
    UI Components               ├─ scores
    (React)                     ├─ rules
    ↓                           └─ recommendations
    Edge Functions
    (LLM)
```

### 4.3 Abstracción de Datos Requerida

#### **4.3.1 Meta-Modelo de Gobernanza**

```typescript
// src/lib/governance/meta-schema.ts

export interface GovernanceMeta {
  domainId:        string               // 'ai', 'data', 'transformation'
  domainName:      string
  frameworkCode?:  string               // 'eu-ai-act', 'nist', 'iso-27001'
  
  // Dimensiones dinámicas
  dimensions: {
    code:          string               // 'strategy', 'data', ...
    label:         string
    weight:        number               // 0.0-1.0
    subDimensions: SubDimension[]
    criteria:      Record<0|1|2|3|4, string>
  }[]
  
  // Scoring
  scoringDimensions: string[]            // códigos a incluir en cálculo
  scoringFormula:    string              // e.g. "dim1×0.4 + dim2×0.3"
  scoreRange:        [number, number]    // e.g. [0, 100]
  
  // Frameworks y estándares
  applicableFrameworks: {
    code:          string               // 'iso-42001', 'nist-ai-rmf'
    version?:      string
    controls?:     ControlCatalog[]
  }[]
}

export interface SubDimension {
  code:          string
  label:         string
  description:   string
  criteria:      Record<0|1|2|3|4, string>
}

export interface ScoringRule {
  condition:     string                 // "dim1 >= 60 AND dim2 < 40"
  action:        string                 // "activar_ahora" | "preparar_foundations"
  recommendation?: string
}
```

#### **4.3.2 JSON Schema para Formularios Dinámicos**

```typescript
// Para cualquier dimensión, generar un formulario tipo Likert (0-4)

export interface DimensionFormConfig {
  questions: {
    code:         string
    label:        string
    description:  string
    scaleLabels:  [string, string, string, string, string]  // 0-4
    required:     boolean
  }[]
  layout:      'single' | 'multi_select' | 'free_text'
}
```

#### **4.3.3 Catálogo Dinámico de Controles**

```typescript
// Reemplaza los 14 controles hardcodeados de T6

export interface ControlCatalog {
  frameworkCode:  string               // 'iso-42001'
  version:        string               // '2024'
  
  clauses: {
    code:         string               // '4', '5', ...
    title:        string
    description:  string
    
    controls: {
      code:       string               // '4.1', '4.2', ...
      title:      string
      description: string
      effort:     'low' | 'medium' | 'high'
      status:     'no_iniciado' | 'en_progreso' | 'implementado'
    }[]
  }[]
}
```

---

## 5. MODELADO DE DATOS Y VOCABULARIO (NUEVO SECTOR CLAVE)

### 5.1 Localización de Cadenas Hardcodeadas a "IA"

#### **5.1.1 En Base de Datos**

| Tabla | Campo | Valor Actual | Problema | Solución |
|-------|-------|--------------|----------|----------|
| `company_profiles` | `objetivo_principal_ia` | "Implementar IA para..." | Hardcodeado a IA | Renombrar a `objetivo_principal` + agregar `governance_domain` |
| `use_cases` | `ai_category` | RPA, Auto-IA, Predictiva, etc. | 6 valores fijos | Renombrar a `domain_category`, hacer genérico |
| `snapshots` | `tool` | 'T1', 'T2', ..., 'T12' | Fijo al dominio IA | Extensible: agregar 'T13', 'T14' para nuevos dominios |
| `stakeholders` | `archetype` | champion, contributor, etc. | 5 arquetipos IA-específicos | Hacer tabla de arquetipos configurable por dominio |

#### **5.1.2 En TypeScript Enums**

```typescript
// src/types/domain.types.ts
export type ToolCode = 'T1' | 'T2' | ... // ← Hardcodeado

// src/modules/T5_AITaxonomyCanvas/types.ts
export type T5DomainCode = 'automatizacion_rpa' | ...  // ← 6 valores fijos

// src/modules/T4_UseCasePriorityBoard/types.ts
export type AIActScope = 'rrhh' | 'financiero_clientes' | ...  // ← EU AI Act específico
export type AIActRiskLevel = 'prohibido' | 'alto' | 'limitado' | 'minimo'  // ← AI Act
```

#### **5.1.3 En Constantes (Strings)**

```typescript
// src/config/salesPackages.ts
export const SALES_PACKAGES = [
  { id: 'ai-maturity', commercialName: 'AI Maturity Boost', ... },
  { id: 'ai-compliance', commercialName: 'AI Compliance', ... },
  { id: 'ai-portfolio', commercialName: 'AI Portfolio Management', ... },
  { id: 'iso-42001', commercialName: 'ISO 42001 Readiness', ... },
]

// src/modules/T1_MaturityRadar/constants.ts
const D1 = { label: 'Estrategia', description: 'Evalúa si la organización tiene visión clara...de IA.' }
const D2 = { label: 'Datos', description: 'Mide la calidad, accesibilidad y gobierno de los datos. Sin datos limpios y gobernados, ningún proyecto IA...' }
// ... etc
```

#### **5.1.4 En Prompts LLM**

```typescript
// supabase/functions/ai-recommend/prompts/t1.ts
SYSTEM_PROMPT: "Eres un consultor senior especializado en adopción estratégica de IA en empresas..."

// supabase/functions/ai-recommend/index.ts
const LLM_TOOLS = new Set(['t1', 't2', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11'])
```

### 5.2 Estrategia de Transformación a Esquemas Flexibles

#### **5.2.1 Fases de Migración**

**Fase 1: Documentación (Sprint actual)**
- Mapear todos los hardcodeados (✓ completado arriba)
- Diseñar tablas de catálogos

**Fase 2: Creación de Tablas Base (Meses 1-2)**
```sql
-- Tablas agnósticas (nuevas)
CREATE TABLE governance_domains (
  id                    uuid PRIMARY KEY,
  domain_code          text UNIQUE NOT NULL,  -- 'ai', 'data', 'transformation'
  domain_name          text NOT NULL,
  description          text,
  is_active            boolean DEFAULT true,
  created_at           timestamptz DEFAULT now()
);

CREATE TABLE governance_configurations (
  id                    uuid PRIMARY KEY,
  domain_id            uuid NOT NULL REFERENCES governance_domains(id),
  tool_code            text NOT NULL,  -- 'T1', 'T2', ...
  
  dimensions           jsonb,  -- array de DimensionConfig
  scoring_rules        jsonb,  -- array de ScoringRule
  frameworks           jsonb,  -- array de FrameworkConfig
  
  created_at           timestamptz DEFAULT now()
);

CREATE TABLE evaluation_dimensions (
  id                    uuid PRIMARY KEY,
  config_id            uuid NOT NULL REFERENCES governance_configurations(id),
  code                 text NOT NULL,
  label                text NOT NULL,
  weight               numeric(3,2),
  criteria             jsonb,  -- { "0": "...", "1": "...", ... }
  
  UNIQUE(config_id, code)
);

CREATE TABLE llm_prompt_templates (
  id                    uuid PRIMARY KEY,
  domain_id            uuid NOT NULL REFERENCES governance_domains(id),
  tool_code            text NOT NULL,
  
  system_prompt        text NOT NULL,
  user_template        text NOT NULL,
  version              int DEFAULT 1,
  
  UNIQUE(domain_id, tool_code)
);

CREATE TABLE framework_controls (
  id                    uuid PRIMARY KEY,
  framework_code       text NOT NULL,  -- 'iso-42001', 'nist-ai-rmf'
  clause_code          text NOT NULL,  -- '4', '5', ...
  control_code         text NOT NULL,  -- '4.1', '4.2', ...
  
  title                text NOT NULL,
  description          text,
  effort_level         text,  -- 'low', 'medium', 'high'
  
  created_at           timestamptz DEFAULT now(),
  UNIQUE(framework_code, control_code)
);
```

**Fase 3: Migración de Datos (Meses 2-3)**
- Crear registros en `governance_domains` para 'ai' (copia de T1-T12 hardcodeados)
- Leer constants.ts y poblar `evaluation_dimensions`, `llm_prompt_templates`
- Validación de integridad referencial

**Fase 4: Refactor de Código (Meses 3-4)**
- Reemplazar imports de constants.ts con queries a BD
- Crear factory functions que construyan componentes dinámicamente
- Tests de integración

#### **5.2.2 Meta-Modelo de Evaluación (JSON Schema)**

```json
{
  "evaluationSchema": {
    "type": "object",
    "properties": {
      "dimensions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "code": { "type": "string" },
            "label": { "type": "string" },
            "subdimensions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "code": { "type": "string" },
                  "scale": { "type": "integer", "minimum": 0, "maximum": 4 },
                  "criteria": {
                    "type": "object",
                    "properties": {
                      "0": { "type": "string" },
                      "1": { "type": "string" },
                      "2": { "type": "string" },
                      "3": { "type": "string" },
                      "4": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "scoringFormula": {
        "type": "string",
        "example": "dim1×0.40 + dim2×0.30 + dim3×0.30"
      }
    }
  }
}
```

#### **5.2.3 Generadores de Formularios Dinámicos**

```typescript
// src/lib/governance/formGenerators.ts

export function generateEvaluationForm(config: GovernanceMeta): FormSchema {
  return config.dimensions.map(dim => ({
    name: dim.code,
    label: dim.label,
    type: 'likert',
    scale: [0, 1, 2, 3, 4],
    labels: [
      dim.criteria['0'],
      dim.criteria['1'],
      dim.criteria['2'],
      dim.criteria['3'],
      dim.criteria['4'],
    ],
  }))
}

export function generateScoringTemplate(config: GovernanceMeta): ScoringFunction {
  const formula = config.scoringFormula
  return (scores: Record<string, number>) => {
    // Evaluar fórmula dinámica
    const result = evaluateFormula(formula, scores)
    return result
  }
}
```

#### **5.2.4 Generador de Prompts Dinámicos**

```typescript
// src/lib/governance/promptBuilder.ts

export function buildDynamicPrompt(
  template: LLMPromptTemplate,
  context: unknown,
  domain: GovernanceMeta,
): { system: string; user: string } {
  
  // Reemplazar variables
  const system = template.system_prompt
    .replace('{{domain_name}}', domain.domainName)
    .replace('{{frameworks}}', domain.applicableFrameworks.map(f => f.code).join(', '))
  
  const user = template.user_template
    .replace('{{context}}', JSON.stringify(context, null, 2))
  
  return { system, user }
}
```

### 5.3 Vocabulario Agnóstico (Recomendado)

| Término Actual (IA) | Término Agnóstico | Ejemplo de Uso |
|---------------------|-------------------|----------------|
| `objetivo_principal_ia` | `strategic_objective` | "Implementar Datos como ventaja competitiva" |
| `ai_category` | `domain_category` | RPA para IA, Data Integration para Datos |
| `ai_risk` | `regulatory_risk` | "Alto riesgo según AI Act" → "Alto riesgo según GDPR" |
| `herramienta IA` | `capability_tool` | "Herramienta de Datos", "Herramienta de Transformación" |
| `dominio IA` | `governance_domain` | 'ai', 'data', 'transformation' |
| `caso de uso IA` | `use_case` (agnóstico) | Aplicable a cualquier dominio |
| `evaluation_dimension` (actual T1D1-D6) | `maturity_dimension` | Genérico para cualquier evaluación |

---

## 6. MATRIZ DE IMPACTO, COMPLEJIDAD Y RIESGOS

### 6.1 Nivel de Esfuerzo por Módulo

| Módulo | Análisis | Complejidad | Breaking Changes | Esfuerzo Estimado | Sprint |
|--------|----------|-------------|------------------|------------------|--------|
| **T1 Maturity Radar** | 6 dimensiones hardcodeadas, pesos fijos, 24 preguntas | ALTO | Sí: cambiar estructura de scores si se dinamizan dimensiones | 15-20 pts | Sprint 14-16 |
| **T2 Stakeholder Matrix** | 5 arquetipos fijos, entrevista contextualizada a IA | MEDIO | Sí: abstracción de arquetipos | 8-12 pts | Sprint 14 |
| **T3 Value Stream Map** | Tipos de fricción genéricos, estructura agnóstica | BAJO | No | 3-5 pts | Sprint 13 |
| **T4 Use Case Priority Board** | AI Act scopes, scoring dimensions, economics | ALTO | Sí: generalizar scoring, desprender AI Act | 18-25 pts | Sprint 15-17 |
| **T5 AI Taxonomy Canvas** | 6 dominios fijos, fórmula de scoring hardcodeada | ALTO | Sí: convertir a dominios dinámicos, scoring configurable | 20-25 pts | Sprint 16-18 |
| **T6 Risk Governance** | 14 controles ISO fijos, clasificación AI Act | MEDIO-ALTO | Sí: catálogo de controles dinámico | 12-15 pts | Sprint 14-15 |
| **T7 Adoption Heatmap** | Dimensiones de readiness (genéricas), plan LLM | BAJO-MEDIO | No, si se parametrizan prompts | 5-8 pts | Sprint 13-14 |
| **T8 Communication Map** | Mensajes contextualizados a IA, arquetipos T2 | MEDIO | Moderado: parametrizar prompts | 8-12 pts | Sprint 14 |
| **T9 AI Roadmap** | Gantt de activación, terminología "IA Gates" | MEDIO | Sí: generalizar a "Governance Gates" | 10-12 pts | Sprint 14-15 |
| **T10 AI Value Dashboard** | 6 paneles específicos de IA | MEDIO-ALTO | Sí: hacer paneles dinámicos, reutilizables | 12-18 pts | Sprint 15-16 |
| **T11 Operating Rhythm** | Eventos de gobierno "IA-específicos", cadencia | BAJO-MEDIO | Moderado: renombrar eventos, reutilizar lógica | 6-10 pts | Sprint 13-14 |
| **T12 ISO Assessment** | 14 controles predefinidos, cláusulas ISO | BAJO-MEDIO | Moderado: conectar a framework_controls table | 5-8 pts | Sprint 13 |
| **Infraestructura (BD, Services, Edge Functions)** | Crear tablas de catálogos, refactor de servicios, prompts dinámicos | ALTO | Sí: cambios fundamentales en arquitectura | 30-40 pts | Sprint 13-16 |

### 6.2 Breaking Changes Esperados

#### **A. En API / Contrato de Datos**

| Cambio | Impacto | Migración |
|--------|--------|-----------|
| `company_profiles.objetivo_principal_ia` → `objetivo_principal` + `governance_domain` | CRÍTICO | Migration SQL: copiar valores, agregar columna nueva, backfill |
| `use_cases.ai_category` → `domain_category` + `governance_domain` | CRÍTICO | Migration SQL: copiar valores, redefinir constraints |
| `stakeholders.archetype` valores fijos → referencia a tabla `stakeholder_archetypes` | MEDIO | Foreign key, crear tabla, backfill |
| `tool_outputs.tool` enum T1-T12 → extensible | BAJO | Cambiar constraint de CHECK a FK |
| Snapshots de T1 scores con estructura 6D → nueva estructura con config_id | MEDIO | Versionar snapshots, agregar schema_version |

#### **B. En Frontend (Componentes React)**

| Cambio | Impacto | Solución |
|--------|--------|----------|
| T1View hardcodeado a 6D → parametrizado a N dimensiones | ALTO | Refactor completo de T1View, componentes dinámicos |
| T5 PortfolioMatrix hardcodeado a 6 dominios → dinámico | ALTO | Usar canvas dinámico (recharts, d3) en lugar de SVG fijo |
| T10 Dashboard con 6 paneles fijos → dinámico (P1-P6 + extensible) | MEDIO-ALTO | Registrar paneles en tabla, renderizar loops |
| Prompts hardcodeados en constants.ts → queries a BD | BAJO | Lazy load en useEffect |

#### **C. En Edge Functions**

| Cambio | Impacto | Solución |
|--------|--------|----------|
| Funciones ai-recommend con N prompts hardcodeados → factory pattern | MEDIO | Crear `buildPrompt(domainId, toolCode, context)` dinámico |
| Rate limiting solo por tool_code → por (domainId, tool_code) | BAJO | Cambiar key de rate limiting en BD |

#### **D. En Base de Datos**

| Cambio | Impacto | Solución |
|--------|---------|----------|
| Nuevas tablas `governance_domains`, `governance_configurations`, etc. | BAJO | Migrations nuevas, sin alterar tablas existentes |
| Backfill de `governance_domain` en registros existentes | MEDIO | Migration SQL con batch update, trigger para defaults |

### 6.3 Impacto en Frontend

#### **Componentes Rígidos → Dinámicos**

| Componente | Hoy | Cambio Requerido |
|-----------|-----|-----------------|
| `T1_MaturityRadar/T1View.tsx` | Renderiza exactamente 6 dimensiones | Usar loop sobre config dinámico |
| `T1_MaturityRadar/T1SpiderChart.tsx` | SVG hardcodeado con 6 ejes | Recharts RadarChart con N ejes |
| `T5_AITaxonomyCanvas/PortfolioMatrix.tsx` | 6 dominios, colores fijos | Canvas dinámico, leer domainColors de BD |
| `T10_AIValueDashboard/T10View.tsx` | 6 paneles fijos (P1-P6) | Map sobre paneles configurables |
| `T4_UseCasePriorityBoard` | Scoring formula hardcodeada | Usar scoring_formula de BD |
| `T6_RiskGovernance` | 14 controles mostrados | Query a framework_controls + loop |

#### **Gestión del Estado (Stores)**

| Store | Cambio |
|-------|--------|
| `src/modules/T1_MaturityRadar/store.ts` | Agregar dimensionConfig en state, hydrate de BD |
| `src/modules/T5_AITaxonomyCanvas/store.ts` | Agregar domainConfig en state |
| `src/modules/T4_UseCasePriorityBoard/store.ts` | Agregar scoringFormula en state |

### 6.4 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|--------|-----------|
| Inconsistencia entre constants.ts y BD durante migración | ALTA | CRÍTICO | Feature flag: "useDynamicConfig", dual-read en fase de transición |
| Pérdida de datos en migración de snapshots versionados | MEDIA | CRÍTICO | Backup completo pre-migración, test restore de BD de staging |
| Ruptura de RLS policies al cambiar estructura de tablas | MEDIA | CRÍTICO | Auditoría de policies antes de migration, test en staging |
| Prompts LLM inconsistentes (templates BD vs código) | MEDIA | MEDIO | Versionado de prompts, A/B testing, monitoring de quality |
| Latencia aumentada por queries a múltiples catálogos | BAJA | MEDIO | Caching en Redis, query optimization, índices |
| Performance degradación en T10 dashboard con N paneles | BAJA | MEDIO | Virtualización de paneles, lazy load, debounce |

---

## 7. ROADMAP DE REFACTORIZACIÓN EN FASES

### **Fase 1: ABSTRACCIÓN (Sprints 13-14)**

**Objetivo:** Separar metadatos de lógica, crear layer de configuración.

**Entregas:**
1. Diseño e implementación de tablas de catálogos
2. Servicios genéricos de lectura de configuraciones
3. Prompts templates en BD (reemplazando hardcodeados)
4. Feature flag `useDynamicConfig` (off por defecto)
5. Documentación de meta-modelo

**Hitos:**
- ✓ Schema de `governance_configurations` validado
- ✓ Migration SQL tested en staging
- ✓ Servicios de lectura funcionando
- ✓ Primeros 10 prompts templates en BD

---

### **Fase 2: MOTOR DE GOBIERNO (Sprints 15-17)**

**Objetivo:** Implementar estrategia/factory pattern, hacer T1-T12 agnósticos.

**Entregas:**
1. GovernanceStrategy interface implementada para IA
2. T1 dinámico (dimensiones desde BD)
3. T4 dinámico (scoring dimensions desde BD)
4. T5 dinámico (dominios desde BD)
5. T6/T12 dinámico (controles desde framework_controls)
6. Edge Functions refactoradas con factory pattern

**Hitos:**
- ✓ Strategy pattern running en staging
- ✓ T1/T4/T5 scores iguales a valores hardcodeados
- ✓ Documentación de extensión para nuevo dominio

---

### **Fase 3: MÓDULOS PLUGGABLES (Sprints 18-20)**

**Objetivo:** Agregar soporte para segundo tipo de gobernanza (ej. Data Governance).

**Entregas:**
1. Data Governance domain creado en BD
2. T1 equivalente para Datos (6 dimensiones data-specific)
3. T4 equivalente para casos de uso de datos
4. UI switchable entre dominios
5. Dashboard multidominio (T10 agregado)

**Hitos:**
- ✓ Ejecutar T1 para IA y Datos, scores independientes
- ✓ Casos de uso priorizable en ambos dominios
- ✓ Dashboard muestra ambos tipos de gobernanza

---

### Timeline Estimada

```
Sprint 13 ───────────────────────────────────────────────────
  ├─ Diseño final de schema (1-2 días)
  ├─ Creación de tablas + migrations (2-3 días)
  ├─ Servicios de lectura dinámicos (3-4 días)
  ├─ Feature flag + dual-read setup (2 días)
  └─ Testing E2E + docs (3 días)
  
Sprint 14 ───────────────────────────────────────────────────
  ├─ Refactor T1/T2 (5-7 días)
  ├─ Refactor T7/T11 (3-5 días)
  ├─ Refactor prompts (2-3 días)
  └─ Testing + documentation (2-3 días)
  
Sprint 15-16 ─────────────────────────────────────────────────
  ├─ Refactor T4/T5 (8-12 días)
  ├─ Edge Functions refactor (4-6 días)
  ├─ T10 Dashboard dinámico (4-6 días)
  └─ Performance testing + optimization (3-4 días)
  
Sprint 17-18 ─────────────────────────────────────────────────
  ├─ Data Governance domain setup (3-5 días)
  ├─ T1 Data, T4 Data, T5 Data (8-12 días)
  ├─ UI switchable (4-6 días)
  └─ Integration testing (2-3 días)
  
Sprint 19-20 ─────────────────────────────────────────────────
  ├─ Estabilización general (3-4 días)
  ├─ Documentación de extensión (2-3 días)
  ├─ Training material para nuevos dominios (2-3 días)
  └─ Go-live multidominio (preparación) (2 días)
```

**Tiempo total estimado:** 20-24 semanas (5-6 meses) con equipo de 2-3 ingenieros.

---

## ANEXOS

### A. Referencias de Archivos Críticos

| Archivo | Líneas | Propósito | Acoplamiento |
|---------|--------|-----------|--------------|
| `src/types/domain.types.ts` | 17 | Barrel de tipos | BAJO |
| `src/modules/T1_MaturityRadar/constants.ts` | 510 | 6 dimensiones + criterios | CRÍTICO |
| `src/modules/T5_AITaxonomyCanvas/constants.ts` | 254 | 6 dominios + fórmula | CRÍTICO |
| `src/modules/T4_UseCasePriorityBoard/types.ts` | 295 | AI Act scopes, scoring | CRÍTICO |
| `src/modules/T6_RiskGovernance/constants.ts` | 250+ | 14 controles ISO + AI Act | CRÍTICO |
| `src/config/salesPackages.ts` | 105 | 4 paquetes comerciales | MEDIO |
| `src/services/t{N}.service.ts` | ~100 c/u | Acceso a datos T1-T9 | BAJO (agnóstico) |
| `src/hooks/useEdgeFunctionInvoke.ts` | 121 | Hook genérico de LLM | BAJO (parametrizable) |
| `supabase/functions/ai-recommend/index.ts` | ~200 | Orchestración de generación | MEDIO (refactorizar) |
| `supabase/functions/ai-recommend/prompts/` | ~50 c/u | Prompts T1, T6, T7, T8 | CRÍTICO |
| `src/modules/T10_AIValueDashboard/t10ContextBuilder.ts` | ~200 | Agregación de KPIs | MEDIO |
| `supabase/migrations/001_foundation.sql` | ~400 | Schema base | BAJO (agregar tablas) |

### B. Checklist de Validación Pre-Refactor

- [ ] Snapshot de BD actual (backup completo)
- [ ] Documentación de 12 puntos de acoplamiento (✓ completado)
- [ ] Aprobación de meta-modelo de gobernanza
- [ ] Diseño de feature flag strategy
- [ ] Plan de versionado de API
- [ ] Acuerdos de breaking changes con stakeholders
- [ ] Testing strategy (staging + canary)
- [ ] Documentación de extensión ("How to add Transformation Governance")

### C. Criterios de Éxito Post-Refactor

1. **Funcionalidad:** T1-T12 generan exactamente los mismos scores/recomendaciones que hoy
2. **Extensibilidad:** Agregar "Data Governance" domain en < 1 sprint (2 semanas)
3. **Performance:** T10 dashboard carga en < 2s con 2-3 dominios
4. **Código:** 0 references a "IA" en tipos genéricos (todo parametrizado)
5. **Documentación:** Template README para agregar nuevo dominio en < 1 hora

---

## CONCLUSIONES

GOBY es una plataforma **estructurada, modular y refactorable hacia multidominio** sin reescrituras destructivas. El acoplamiento está **concentrado en 12 puntos clave** (constantes, prompts, enums) que pueden abstraerse en **2-3 meses de trabajo disciplinado**.

**Recomendación:** Proceder con **Fase 1 (Abstracción)** en Sprint 13-14 para validar el meta-modelo sin impacto en producción. Fase 2 (Motor) activar solo cuando Fase 1 esté 100% funcional en staging.

**Próximas acciones:**
1. Validar diagrama de desacoplamiento con equipo técnico
2. Diseñar y testear schema de `governance_configurations` en BD local
3. Prototipar servicios genéricos de lectura dinámicos
4. Definir roadmap comercial para "Transformation Governance" y "Data Governance"

---

**Fin del informe.**  
Analista: Claude Code (Haiku 4.5)  
Fecha: 2026-08-17

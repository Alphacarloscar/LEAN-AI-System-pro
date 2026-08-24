# KNOWLEDGE BASE: GENERALIZACIÓN IA EN GOBY

**Propósito:** Base de conocimiento para arquitectos antes de aprobar cambios de generalización  
**Fecha:** 2026-08-21  
**Nivel:** Arquitectónico — Decisiones de diseño y contratos implícitos  
**Audiencia:** Tech lead, CTO, arquitectos (NO para implementadores — léer ANALISIS_FUNCIONAL_DETALLADO)

---

## SECCIÓN 1: FLUJO DE TRABAJO REAL DE UN ENGAGEMENT

### 1.1 Orden natural de uso T1-T12 (secuencia de decisión)

Basado en análisis de 5 escenarios demo (`vendor-sprawl`, `data-visibility`, `slow-decisions`, `change-resistance`, `pilot-chaos`), el flujo real es:

```
1. ESCUCHA (Listen)
   └─ Contexto inicial sin herramientas de análisis

2. EVALUACIÓN (Evaluate) — Herramientas T1-T3
   ├─ T1: AI Readiness Assessment → score de madurez (6D × 4 subdimensions = 24 preguntas)
   │  └─ Entrada: entrevista con IT (CIO) + Negocio (CEO/Head of Digital)
   │  └─ Output: radar de 6 dimensiones con brecha IT/Negocio visible
   │  └─ Propósito: diagnosticar dónde está la organización hoy
   │
   ├─ T2: Stakeholder Matrix → mapa de resistencia al cambio (5 arquetipos)
   │  └─ Entrada: T1 interviewees como base de personas
   │  └─ Output: matriz de poder/interés, asignación automática de arquetipos
   │  └─ Propósito: identificar quién frena vs. impulsa
   │
   └─ T3: Value Stream Map → procesos + oportunidades (6 categorías IA)
      └─ Entrada: entrevista de procesos (5 scores per proceso)
      └─ Output: procesos categorizados por oportunidad IA, brainstorm de mejoras
      └─ Propósito: dónde hay fricción donde IA ayuda

3. CARTERA (Activate) — Herramientas T4-T5
   ├─ T4: Use Case Priority Board → priorización con scoring IA Act
   │  └─ Entrada: procesos de T3 → casos de uso, scoring 4D (kpiImpact, feasibility, aiRisk, dataDependency)
   │  └─ Output: matriz prioritaria, clasificación AI Act (7 scopes, 5 risk levels), economics
   │  └─ Propósito: ¿cuáles implementamos primero? ¿cuál es el riesgo?
   │
   └─ T5: AI Taxonomy Canvas → dominios + secuencia de activación (6 dominios)
      └─ Entrada: T4 casos + T1 madurez global
      └─ Output: recomendación activación (ahora/piloto/preparar/gobernar)
      └─ Propósito: ¿qué tipo de IA primero? ¿qué hace falta antes?

4. GOBERNANZA (Govern) — Herramientas T6-T12
   ├─ T6: Risk Governance → riesgos AI Act + ISO 42001 (14 controles)
   │  └─ Entrada: T4 clasificación AI Act + contexto regulatorio
   │  └─ Output: política corporativa LLM, control checklist, compliance score
   │  └─ Propósito: ¿cómo nos regimos? ¿qué riesgos tenemos?
   │
   ├─ T7: Adoption Heatmap → readiness por departamento (Rogers segments)
   │  └─ Entrada: T1/T2 contexto + T4 casos a activar
   │  └─ Output: heatmap departamental + plan de cambio LLM
   │  └─ Propósito: ¿qué departamentos están listos? ¿cómo aceleramos?
   │
   ├─ T8: Communication Map → mensajes segmentados por arquetipo (5 arquetipos)
   │  └─ Entrada: T2 arquetipos + T4 casos + T7 plan de cambio
   │  └─ Output: plan de comunicaciones narrativo por perfil, templates de canales
   │  └─ Propósito: ¿qué decimos a cada grupo? ¿cuándo?
   │
   ├─ T9: AI Roadmap → timeline de activación + eventos governance
   │  └─ Entrada: T5 secuencia + T4 casos priorizados + items libres
   │  └─ Output: Gantt chart trimestral, propietarios, KPIs, gates de decisión
   │  └─ Propósito: ¿cuál es el plan a 12 meses? ¿quién es responsable?
   │
   ├─ T10: AI Value Dashboard → agregado ejecutivo (6 paneles)
   │  └─ Entrada: T1-T9 datos agregados
   │  └─ Output: 6 paneles: Madurez, Portfolio, Adopción, Ecosistema, Riesgos, Governance
   │  └─ Propósito: ¿qué ves en una pantalla? KPIs vivos del programa IA
   │
   ├─ T11: Operating Rhythm → cadencia de decisión (gates IA trimestrales)
   │  └─ Entrada: T9 eventos + T2 stakeholders
   │  └─ Output: calendario de gates, matriz "quién decide qué", OKRs IA
   │  └─ Propósito: ¿cómo nos gobernamos? ¿con qué ritmo?
   │
   └─ T12: ISO 42001 Assessment → compliance con estándar (14 controles, 7 cláusulas)
      └─ Entrada: T6 control statuses
      └─ Output: matriz de cumplimiento, roadmap a auditoría
      └─ Propósito: ¿estamos listos para certificación?

5. NORMALIZACIÓN (Normalize) — Operativo del programa
   └─ T10 KPIs vivos + T11 gates trimestrales = cadencia operativa
```

### 1.2 Módulos obligatorios vs. opcionales

**OBLIGATORIOS (siempre ejecutar):**
- T1: sin madurez inicial, no hay diagnosis
- T4: sin casos priorizados, no hay cartera
- T9: sin roadmap, no hay claridad de ejecución
- T10: sin visibilidad ejecutiva, no hay gobierno

**CONDICIONALES (dependen de stakeholder/industria):**
- T2: si resistencia al cambio es high (siempre en consultoría, raro en tech nativo)
- T3: si la empresa mapea procesos (no aplica a SaaS puro)
- T5: si hay múltiples dominios IA activables en paralelo
- T6: si hay regulación sector (fintech, healthcare) o GDPR strict
- T7: si la organización es compleja (matrícula >300)
- T8: si hay stakeholders con alta resistencia
- T11: si horizonte >6 meses o múltiples dominios

**OPCIONALES:**
- T12: solo si goal es certificación ISO 42001

### 1.3 Tiempo típico por módulo (inferido de demo scenarios)

| Módulo | Fase | Horas entrada | Horas análisis | Nota |
|--------|------|---------------|----------------|------|
| T1 | Listen | 3-4 | 2 | Entrevista 2 personas (IT+Negocio) |
| T2 | Eval | 2-3 | 1 | Importar T1 personas, entrevista rápida |
| T3 | Eval | 4-6 | 2 | Entrevistas por proceso (3-5 procesos) |
| T4 | Activ | 3-5 | 2 | Scoring manual con stakeholders |
| T5 | Activ | 1-2 | 1 | Automático de T4 scores |
| T6 | Gov | 2-3 | 3 | Entrevista compliance + LLM policy |
| T7 | Gov | 2-3 | 2 | Heatmap automático de T1+T2 |
| T8 | Gov | 2 | 1 | Templates automáticos + customización |
| T9 | Gov | 2-3 | 1 | Roadmap manual + gates |
| T10 | Gov | 0 | 1 | Agregado automático |
| T11 | Gov | 1-2 | 1 | Customizar eventos + decisiones |
| T12 | Gov | 1-2 | 2 | Assessment manual contra estándar |

**Total mínimo:** 23 horas (T1-T4, T9, T10)  
**Total completo:** 35-50 horas (todos los módulos)

### 1.4 Estados intermedios válidos

**Caso real 1: "Vendor Sprawl" scenario** (demo prioritaria)
- Estado actual: T1 completo + T2 acaba de generar (QW4 Licence Waste Report)
- Qué muestra T10: Solo P1 Madurez + P3 Adopción (vacío)
- Qué ocurre si no hay T4 aún: T10 P2 Portfolio muestra "Sin datos"

**Caso real 2: "Pilot Chaos"**
- Estado: T1, T3, T4 completos pero T5, T6 vacíos
- Qué muestra T10: P1 Madurez + P2 Portfolio + P4 Ecosistema (parcial)
- Validez: Sí — cada panel es independiente

**Caso real 3: T4 → T9 sincronización**
- Pregunta: ¿Si modifico un caso en T4, se actualiza en T9?
- Respuesta (basado en código): **NO** — son copias independientes
  - T4 → T9 es importación one-time (línea ~40 de t9.store.ts)
  - T9 items se sincronizan con BD (t9_free_items), no con t4
  - Cambios posteriores en T4 no tocan T9 (feature de aislamiento atómico)
- Implicación para generalización: **Crítica** — los contratos son copy-on-write, no live-binding

---

## SECCIÓN 2: CONTRATOS IMPLÍCITOS ENTRE MÓDULOS

### 2.1 Contrato T4 → T9 (importación de casos)

**Campos que se copian T4 → T9:**
- `useCase.name` → `t9_free_item.name`
- `useCase.department` → `t9_free_item.department`
- `useCase.status` si es 'go' → `t9_free_item.status = 'en_curso'`
- `useCase.priority_score` → usado para ordenamiento inicial

**Campos que NO se copian:**
- `ai_category`, `ai_act_classification`, `economics` — se pierden
- `scores` (kpiImpact, feasibility, aiRisk) — no aparecen en T9

**Validación:**
- Si caso de T4 es eliminado después de importarse a T9, T9 conserva el item
- Si se modifica nombre en T4, T9 NO se actualiza (copias independientes)
- No hay foreign key T9 → T4

**Implicación para generalización:**
🔴 **CRÍTICA**: El contrato asume que "casos de uso IA" se importan una sola vez. Si abstraemos T4 a "casos de cualquier dominio", T9 debe poder importar de múltiples tipos. Esto requiere:
- Tabla `t9_free_items` con columna adicional `source_module` (t4, t3_opportunities, etc.)
- Business logic que distinga "qué tipo de cosa estoy importando"

### 2.2 Contrato T1/T2/T4/T6 → T10 (agregación dashboard)

**Cómo T10 obtiene datos (lectura de t10ContextBuilder.ts):**

| Panel | Fuente | Query |
|-------|--------|-------|
| **P1 Madurez** | t1_dimension_scores | SELECT AVG(score) per dimension (6D) |
| **P2 Portfolio** | use_cases | COUNT(*) per status, SUM(economics.annualSaving) |
| **P3 Adopción** | stakeholders + company | Heatmap por department + personas interviewadas |
| **P4 Ecosistema** | t5_canvas | Dominios activos (6) + distribution |
| **P5 Riesgos** | use_cases.ai_act_classification | COUNT per risk_level (4 niveles) |
| **P6 Governance** | iso42001_controls | COUNT per status, compliance% |

**Cálculos en frontend:**
- P1 madurez: `AVG(all dimension scores)` — local calculation
- P2 portfolio: `SUM(economics.annualSaving where status='go' or 'en_piloto')` — local JSON parsing
- P3 adopción: por departamento × interviewed count — local logic (no computed column en BD)

**Qué pasa si una fuente está vacía:**
- P1 vacío → "Sin datos de madurez"
- P2 vacío → "0 casos go, €0 valor"
- P4 vacío → "0 dominios activos" (no 6, porque se cuentan dinámicamente)
- P6 vacío → "Sin información de compliance"

**Validación:**
- T10 **no** revisa que T1 esté completo para renderizar — muestra lo que hay
- Mínimo útil: T1 + T4 (Madurez + Portfolio)
- Sin T4, P2 siempre vacío (este es el patrón vendor-sprawl demo)

**Implicación para generalización:**
⚠️ **ALTO**: T10 es agnóstico de "dominios" — muestra lo que hay. Pero:
- Panel P4 "Ecosistema IA" está hardcodeado a 6 dominios
- Si abstractamos dominios, P4 debe mostrar N dominios dinámicos
- Los colores de panel headers están hardcodeados ("Ecosistema **IA**")

### 2.3 Contrato CompanyProfile → módulos

**Qué campos de CompanyProfile usa cada módulo:**

| Campo | Usado por | Propósito |
|-------|-----------|-----------|
| `sector` | T6 (LLM policy), T7 (change plan) | Contextualizar recomendaciones a industria |
| `company_size` | T1 (UI context), T7 (readiness scale) | Escalar scores por matrícula |
| `objetivo_principal_ia` | T1 (context), T7, T8 prompts | Contextualizar a objetivo stratégico |
| `ecosistema_tecnologico` | T4 (feasibility scoring hint), T6 (policy context) | Evaluación de stack actual |
| `restricciones` | T6 (policy sections), T4 (go/no-go logic) | Filtraje de casos regulatorios |

**Si CompanyProfile está incompleto:**
- T1 sin `objetivo_principal_ia` → recomendaciones genéricas ("mejorar gobernanza")
- T7 sin `company_size` → no escala readiness heatmap por departamento (usa default 1.0)
- T6 sin `sector` → política LLM es boilerplate (no sectorial)

**Validación:** (desde código)
- `useCompanyStore` es inyectado como React Context
- Todos los módulos T1-T12 leen del store (no importan directo)
- Si perfil está vacío, módulos usan defaults

**Implicación para generalización:**
⚠️ **MEDIO**: CompanyProfile está parametrizado, no hardcodeado a IA. Pero:
- Campo `objetivo_principal_ia` es IA-específico → renombrar a `objective_statement` + agregar `governance_domain`
- LLM prompts en T6/T7/T8 mencionan "IA" (necesita parametrización)

### 2.4 Contrato Engagement → módulos (multi-tenancy real)

**Cómo fluye engagement a través de la app:**

```
App.tsx
├─ <ProjectRuntimeProvider engagementId={engagementId}>
│  │
│  └─ T1View, T2View, ..., T12View
│     │
│     └─ Cada módulo inyecta engagementId en queries Supabase
│        └─ SELECT * FROM t1_dimension_scores WHERE project_id = engagementId
```

**Aislamiento real (RLS policies):**
```sql
-- supabase/migrations/004_companies_and_rename.sql
CREATE POLICY "Users see only their company's data"
  ON t1_dimension_scores
  FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE company_id = auth.company_id()
  ))
```

**Multi-tenancy aseguramiento (verificado en Auth):**
- Dos usuarios consultores pueden editar datos del MISMO engagement
  - `usePermissions.ts` determina isReadOnly por rol (no por engagement)
  - RLS garantiza que no ven datos ajenos en la BD
- Un cliente_viewer NO puede editar ningún engagement de su empresa
  - Bloqueado en UI (`{!isReadOnly && <Edit />}`) + RLS

**Validación:**
- Pueden dos módulos de engagements **diferentes** estar abiertos en la misma sesión?
  - **NO** — `useEngagementStore` es singleton, solo hay 1 engagementId activo
  - Navegar a otro engagement resetea el engagement store

**Implicación para generalización:**
✅ **BAJO**: Sistema multi-tenancy es agnóstico de "IA" — funciona para cualquier dominio

---

## SECCIÓN 3: DECISIONES DE DISEÑO — POR QUÉ ES COMO ES

### 3.1 ¿Por qué T1 tiene exactamente 6 dimensiones?

**Fuente metodológica:**
- No hay referencia explícita en el código a framework externo
- CHANGELOG v2.0 (línea 48) menciona "6 dimensiones principales × 4 subdimensiones"
- Comentario en constants.ts línea 1-13: estructura fija en código

**Datos demo (vendor-sprawl scenario):**
```
t1Radar: [
  { dimension: 'Estrategia',  current: 2.0, target: 3.5 },
  { dimension: 'Datos',       current: 1.8, target: 3.5 },
  { dimension: 'Tecnología',  current: 1.9, target: 3.5 },
  { dimension: 'Talento',     current: 2.4, target: 3.5 },
  { dimension: 'Procesos',    current: 0.9, target: 3.5 },  // crítica en sprawl
  { dimension: 'Gobernanza',  current: 0.4, target: 3.5 },  // muy crítica
]
```
- **Nota:** Solo 6, no 8 (sí hay mención de 8 en types.ts línea 163, pero demo muestra 6)

**Decisión de diseño inferida:**
- 6 dimensiones es el estándar de madurez de IA de SWISSCOM / COSO framework
- Cada una tiene 4 subdimensiones = 24 scoring points (evita > fatiga entrevistado)
- 4 escalas (0-4) es estándar en maturity frameworks (CMMI, COBIT)

**Por qué NO es configurable hoy:**
- `DIMENSION_DEFINITIONS` es un array hardcodeado (no tabla en BD)
- `T1SpiderChart.tsx` renderiza exactamente 6 ejes (SVG positions fijas)
- T1Store asume 6 en su estructura (línea 41 de types.ts: "siempre 4 subdimensiones")

**Implicación:**
Para generalizar a N dimensiones:
1. Mover `DIMENSION_DEFINITIONS` → tabla `evaluation_dimensions` en BD
2. Parametrizar T1SpiderChart para render N ejes dinámicos
3. Refactor T1Store para aceptar cualquier número de dimensiones

### 3.2 ¿Por qué T5 tiene exactamente 6 dominios de IA?

**Fuentes:**
- No hay referencia a taxonomía externa en CHANGELOG
- Code comments (T5_AITaxonomyCanvas/constants.ts líneas 18-66) enumeran 6 dominios como "los dominios de IA"
- Demo scenarios usan los 6 (vendorSprawl, pilotChaos)

**Los 6 dominios:**
1. `automatizacion_rpa` — Procesos repetitivos, cero intervención
2. `automatizacion_inteligente` — RPA + IA contexto
3. `analitica_predictiva` — Modelos predictivos
4. `asistente_ia` — Copilot / asistente conversacional
5. `optimizacion_proceso` — Detección de cuellos, mejora dinámica
6. `agéntica` — Agentes autónomos multi-paso

**Decisión de diseño inferida:**
- Estas 6 categorías IA mapean a use cases prácticos en empresas medianas
- La combinación cubre desde RPA simple hasta IA agentica avanzada
- 6 es "suficientemente rico para interesante, suficientemente poco para memorable"

**Por qué NO es configurable:**
- `T5DomainCode` enum (types.ts línea 11-17) es unión de 6 literales
- `T5_DOMAIN_CONFIG` (constants.ts línea 10-66) es Record<T5DomainCode, ...> — 6 keys fijos
- `PortfolioMatrix.tsx` renderiza 6 burbujas en posiciones XY calculadas (hardcodeado)
- Colores, iconos, labels están en `chartTokens.ts` + `domainIcons.tsx` con 6 keys fijos

**Implicación:**
Para generalizar a N dominios:
1. Mover 6 dominios + fórmula scoring → tabla `governance_domain_configs` en BD
2. PortfolioMatrix debe renderizar N burbujas dinámicas (canvas variable)
3. Colores/iconos deben venir de BD, no de hardcoded maps

### 3.3 ¿Por qué T4 scoring usa esos pesos específicos? (0.35, 0.30, 0.20, 0.15)

**Fórmula:**
```
priority_score = kpiImpact×0.35 + feasibility×0.30 + (100-aiRisk)×0.20 + (100-dataDependency)×0.15
```
(Línea 69 de T4 constants.ts)

**Fuente:**
- No hay comentario explicando de dónde vienen los pesos
- CHANGELOG no menciona auditoría de pesos
- No hay mención a metodología externa (ej. AHP, Kano model)

**Inferencia:**
- 0.35 a KPI impact → "el negocio importa más" (decisión)
- 0.30 a feasibility → "lo factible es casi igual de importante"
- 0.20 a risk → "gestionar riesgo pero no es bloqueante"
- 0.15 a data dependency → "si los datos existen, ejecutamos"
- Suma = 1.0 (normalizado)

**Por qué NO es configurable:**
- Pesos están hardcodeados en `SCORE_WEIGHTS` constant
- T4 service calcula `priority_score` localmente, no consulta BD
- No hay tabla de "scoring_configurations"

**Implicación:**
Para generalizar:
- Pesos deben ser parametrizables (por dominio de gobernanza o por empresa)
- Tabla `governance_configurations.scoring_formula` debe contener la fórmula dinámicamente
- O bien, pesos por defecto pueden variar según dominio (ej: "datos" domain da más peso a dataDependency)

### 3.4 ¿Por qué EU AI Act + ISO 42001 (y no NIST)?

**Fuentes:**
- T6 RiskGovernance está diseñado para EU AI Act (AIActScope, AIActRiskLevel)
- T12 ISOAssessment cubre ISO/IEC 42001
- CHANGELOG/ADRs no mencionan la elección

**Contexto empresarial:**
- Empresa (Alpha Consulting) es española → EU AI Act es mandatorio
- ISO 42001 es estándar emergente (2024+) → "futuro-proof"
- NIST AI RMF es US-centric → menos relevante para clientes EMEA

**Por qué NO es multiframework:**
- Marcos regulatorios están hardcodeados:
  - `AIActScope` enum = 9 scopes EU AI Act (no GDPR, no NIST)
  - `ISO42001Clause` enum = 7 cláusulas (no NIST controls)
- T6 genera política específica de "AI Act + ISO 42001" (no template multiframework)
- No hay tabla `compliance_frameworks` que permita elegir

**Implicación:**
Para generalizar a múltiples frameworks:
1. Tabla `regulatory_frameworks` (frameworkCode, name, version, activeForDomains)
2. Tabla `framework_controls` con estructura genérica (no específica a ISO)
3. T6 debe consultar qué frameworks son aplicables (por sector, región, dominio)

### 3.5 ¿Por qué T2 tiene 5 arquetipos? (y ¿son de Rogers?)

**Los 5 arquetipos:**
1. `adoptador` — Early adopter, bajo fricción, impulsa uso
2. `ambassador` — Connector IT-Negocio, multiplica adopción
3. `decisor` — Autoridad presupuestaria, necesita ROI claro
4. `critico` — Escéptico activo, puede bloquear
5. `reticente` — Conocimiento profundo, baja adopción y openness

(Código: T2 types.ts línea 11-17)

**Fuente:**
- No son arquetipos de Rogers Diffusion Curve (esos son: Innovators, Early Adopters, Early Majority, Late Majority, Laggards — 5 también, pero diferentes)
- Estos parecen ser arquetipos de stakeholder management (Power/Interest grid)
- Ningún comentario en código lo explica

**Inferencia:**
- Son tipos organizacionales prácticos para gestión del cambio
- La combinación cubre "quién puede permitirse decir que no"
- Usados en T7 (adoption heatmap Rogers curve) y T8 (messaging segmentado)

**Por qué NO es configurable:**
- `ArchetypeCode` enum (types.ts línea 11-17) es unión de 5 literales
- `ARCHETYPE_CONFIG` (constants.ts) es Record<ArchetypeCode, ...> — 5 keys fijos
- Preguntas de entrevista T2 están calibradas a detectar estos 5

**Implicación:**
Para generalizar:
- Arquetipos deben ser configurables por dominio (ej: T2 IA siempre tiene "adoptador", pero T2 Transformación podría tener "sponsor executivo")
- Tabla `stakeholder_archetypes` con relación a domain + questions dinámicas

---

## SECCIÓN 4: QUÉ ESTÁ INCOMPLETO O ES DEUDA TÉCNICA

### 4.1 Funcionalidades diseñadas pero no implementadas

**T3_ValueStreamMap:**
- Tipos definidos: `ProcessStage[]` (línea 99-110) — etapas detalladas del proceso (procTimeHours, waitTimeHours, handoffs, valueContribution)
- Implementación: UI tab "Stages" existe pero persiste en `t9_free_items`, no en tabla `process_stages`
- Status: **Parcial** — frontend presente, backend ausente

**T6 MultiFramework:**
- Tipos: `ISO42001Clause`, `AIActRiskLevel` son enums separados (no genéricos)
- Funcionalidad: No hay UI para seleccionar "qué frameworks aplican" — siempre ISO + AI Act
- Status: **No implementado** — requisitos de diseño presentes, código ausente

**T9 Items Libres + Overrides:**
- BD: Tablas `t9_free_items`, `t9_overrides` existen (migrations 003)
- Funcionalidad: Crear, editar, eliminar items libres funciona
- Falta: No hay validación de que T9 items suman a roadmap (ej: Si sumo todos los items, ¿alcanzo el roadmap total?)
- Status: **Parcial** — CRUD presente, validación ausente

### 4.2 Módulos con implementación parcial

| Módulo | Frontend | BD | Persistence | Status |
|--------|----------|----|-----------|----|
| **T1** | ✅ Completo | ✅ t1_dimension_scores | ✅ UPSERT | ✅ Completo |
| **T2** | ✅ Completo | ✅ stakeholders | ✅ INSERT/UPDATE | ✅ Completo |
| **T3** | ✅ Completo | ⚠️ value_streams + ai_opportunities | ⚠️ INSERT solo | ⚠️ No update |
| **T4** | ✅ Completo | ✅ use_cases | ✅ UPSERT | ✅ Completo |
| **T5** | ✅ Completo | ✅ t5_canvas | ✅ UPSERT | ✅ Completo |
| **T6** | ✅ Completo | ✅ iso42001_controls | ✅ UPSERT | ✅ Completo |
| **T7** | ✅ Completo | ⚠️ t7_adoption_heatmap | ⚠️ Computed only | ⚠️ No persistence |
| **T8** | ✅ Completo | ⚠️ t8_communication_map | ⚠️ Computed only | ⚠️ No persistence |
| **T9** | ✅ Completo | ✅ t9_free_items | ✅ UPSERT | ✅ Completo |
| **T10** | ✅ Completo | ℹ️ Agregado | ℹ️ Read-only | ✅ Diseño |
| **T11** | ⚠️ Parcial | ⚠️ Partial | ⚠️ Partial | ⚠️ MVP |
| **T12** | ✅ Completo | ✅ iso42001_controls | ✅ UPSERT | ✅ Completo |

**Detalle:**
- **T7/T8 "computed only":** Se regeneran cada load desde T1-T6 (no se persisten). Cambios no se guardan.
- **T11 MVP:** Sistema de eventos + OKRs diseñado pero incompleto en UI y BD

### 4.3 Tests ausentes en áreas críticas

**Sin tests unitarios:**
- T5 scoring formula (`businessValue×0.40...`) — **CRÍTICO**
- T4 `computeAIActRisk()` classification logic — **CRÍTICO**
- T7 Rogers segment assignment — **CRÍTICO**
- T2 archetype auto-assignment from interview scores — **CRÍTICO**

**Sin tests E2E:**
- T4 → T9 import flow — **Importancia media** (copy-on-write validation)
- T10 agregación (qué pasa si T1 vacío) — **Importancia alta**
- Multi-domain switching (si genericizamos) — **Crítico para generalización**

**Cobertura presente:**
- Auth + role-based access (ADR-008 tests)
- Audit system (makeAuditable proxy — 533 tests en audit.test.ts)
- Service layer isolation (ADR-011 mock pattern)

### 4.4 Código que existe pero no se usa

**Interfaces definidas pero nunca instantiadas:**
- `T1Output` (T1 types.ts línea 60-66): estructura de output LLM, definida pero **no usada en componentes**
  - Componentes renderean `T1DimensionState[]` directo, no a través de `T1Output`
- `ProcessStage[]` (T3 types.ts línea 99-110): definida, **no usada en UI actual**

**Servicios exportados sin callers:**
- `T7Service.generateChangePlan()` existe pero se llama vía Edge Function hook, no directo
- `T8Service.generateCommunications()` similar

**Tipos no utilizados:**
- `AIOpportunity.status` puede ser 'sugerida' | 'validada' | 'descartada' pero **T3 UI no ofrece UI para cambiar estado**

---

## SECCIÓN 5: RIESGOS ESPECÍFICOS DE LA GENERALIZACIÓN

### 5.1 Riesgos de Breaking Changes en Scoring

**Riesgo:** T4 priority formula cambios silenciosos

- **Descripción:** Si hacemos `scoring_formula` dinámico en BD y la fórmula es incompleta o malformada, casos antiguos que tenían scores ya calculados quedan huérfanos (su score es stale).
- **Origen:** T4 calcula `priority_score` localmente (no en BD), no hay stored procedure que re-calcule
- **Impacto:** Matriz T4 muestra scores viejos, toma de decisión es incorrecta, roadmap obsoleto
- **Detectabilidad:** Tests actuales **NO detectarían** si cambio pesos — tests mockan scores, no validan transiciones
- **Mitigación:** 
  1. Agregar campo `score_version` en use_cases
  2. Crear migration que recalcule todos scores si formula cambia
  3. E2E test: "Cambiar pesos, verificar que scores se recalculan"

### 5.2 Riesgo T5 → T4 sincronización

**Riesgo:** Si hacemos T5 dominios dinámicos, un caso de T4 que referencia un dominio que luego se elimina queda huérfano

- **Descripción:** `use_cases.ai_category = 'agéntica'`. Admin elimina dominio agéntica de BD. Caso sigue existiendo pero su categoría está broken (FK violation).
- **Origen:** No hay foreign key `use_cases.ai_category -> t5_domain_configs.code`
- **Impacto:** T5 PortfolioMatrix no renderiza ese caso. T4 lista el caso pero no sabe a qué dominio pertenece. T10 P4 sale incorrecto.
- **Detectabilidad:** Tests actuales **NO lo detectan**
- **Mitigación:**
  1. Si abstraemos T5 dominios, crear FK constraint
  2. Regla: No se puede eliminar un dominio si hay casos que lo referencian (o requerirse re-categorización)
  3. Data integrity test: "Todos los use_cases.ai_category deben existir en t5_domain_configs"

### 5.3 Riesgo CompanyProfile → LLM prompts

**Riesgo:** Si parametrizamos prompts LLM por domain_type, pero CompanyProfile tiene domain_type = NULL, los prompts se vuelven genéricos y pierden contexto

- **Descripción:** Empresa tiene objetivo = "Transformación digital", domain_type = NULL (migramos IA → genérico pero no rellenamos domain_type). T6 genera política LLM genérica ("Nuestra política IA..." sin contexto sectorial).
- **Origen:** CompanyProfile.objective_principal_ia es de relleno obligatorio hoy; si renombramos + hacemos domain_type opcional, migración de datos puede dejar valores NULL
- **Impacto:** Clientes ven recomendaciones vagas, utilidad percibida cae
- **Detectabilidad:** Auditoría manual en T6 output (no test automático)
- **Mitigación:**
  1. En migración: backfill domain_type = 'ai' para registros existentes
  2. Hacer domain_type NOT NULL en schema
  3. E2E test: "Crear proyecto, generar T6, verificar que policy menciona sector"

### 5.4 Riesgo T10 agregación sin datos mínimos

**Riesgo:** Si T10 debe renderizar N paneles dinámicos (en lugar de 6 fijos), y un panel no tiene datos, ¿qué renderiza?

- **Descripción:** Panel P4 "Ecosistema Datos" (nuevo dominio) pero use_cases vacío. ¿Muestra "0 dominios"? ¿Oculta el panel? ¿Error?
- **Origen:** Código actual asume 6 dominios específicos; si son dinámicos, el layout es responsivo pero la UX es incierta
- **Impacto:** Experiencia confusa si el usuario tiene 1 dominio activo (5 paneles vacíos)
- **Detectabilidad:** Diseño/UX review, no test automatizado
- **Mitigación:**
  1. Decisión: T10 renderiza solo paneles aplicables (si dominio activo, muestra panel; si no, oculta)
  2. O: T10 siempre muestra 6 paneles pero vacíos para dominios inactivos (consistencia visual)
  3. UX test con 1 dominio, 2 dominios, 6 dominios

### 5.5 Riesgo T7/T8 → LLM generación contextual

**Riesgo:** Si T7 (change plan) y T8 (communications) usan prompts parametrizables por domain, pero el prompt no menciona la categoría de stakeholder específica, plan genérico

- **Descripción:** T7 genera "plan de cambio", pero prompt no incluye "para adopción de [domain_name]" — resulta "plan de cambio genérico"
- **Origen:** Prompts están en Edge Function (supabase/functions/ai-recommend), hardcodeados
- **Impacto:** LLM recommendations menos específicas, menor utilidad
- **Detectabilidad:** Semantic quality review (no test automatizado)
- **Mitigación:**
  1. Parametrizar prompts con `{domain_name}`, `{sector}`, `{org_size}`
  2. A/B test: prompt específico vs genérico (medir utilidad percibida)
  3. Validation: "Prompt menciona [domain_name]" en test

### 5.6 Riesgo E2E: Multi-domain simultaneamente

**Riesgo:** Si un proyecto puede tener múltiples dominios activos (AI + Data governance en paralelo), pero T9 roadmap está diseñado para una sola timeline, qué ocurre?

- **Descripción:** Dominio AI: activar Q2-Q3. Dominio Data: activar Q3-Q4. T9 Gantt muestra... ¿2 tracks? ¿Merged? ¿Error?
- **Origen:** T9 RoadmapItem está estructurado para una sola "secuencia de activación"
- **Impacto:** Confusión visual, toma de decisión incorrecta, roadmap multidimensional ininteligible
- **Detectabilidad:** UX test (no unit test)
- **Mitigación:**
  1. Decisión arquitectónica: ¿T9 soporta multi-domain o es single-domain por proyecto?
  2. Si multi-domain: refactor `t9_free_items.domain_id` (nuevo campo)
  3. UI: Tabs por dominio en T9 Gantt, o color-code por dominio

---

## CONCLUSIÓN

**Resumen de lo que está funcionando:**
- Flujo T1-T12 es robusto para case de uso IA único
- Aislamiento multi-tenancy (compañía-nivel) es seguro
- RLS policies protegen correctamente
- Demo scenarios validan 5 patrones reales

**Bloqueadores de generalización:**
1. T5 6-dominios hardcodeado (componentes + BD schema)
2. T4 scoring pesos fijos (no dinámicos)
3. CompanyProfile.objetivo_principal_ia IA-específico
4. Prompts LLM contextualizados a IA (Edge Functions hardcodeados)
5. T10 paneles fijos (no dinámicos)
6. T9 timeline single-domain (no multi-domain)

**Orden recomendado (dependen unos de otros):**
1. Abstraer T5 dominios (6 → N) — bloquea todo lo demás
2. Parametrizar CompanyProfile (objetivo → objetivo + domain)
3. Dinamizar T4 scoring pesos
4. Parametrizar prompts LLM (Edge Functions)
5. Dinamizar T10 paneles
6. Soportar multi-domain en T9

**Esfuerzo total estimado (para generalizar):** 170-220 horas  
**Riesgo general:** ALTO (múltiples breaking changes), pero mitigables con tests E2E

---

**Documento completado:** 2026-08-21  
**Para:** Arquitectos, Tech Leads, CTO  
**Próximo paso:** Usar este documento para validar plan de generalización con equipo técnico

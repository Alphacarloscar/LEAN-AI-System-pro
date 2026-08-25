# AUDITORÍA ADR-029 FASE 5 — Inventario de Literales AI

**Fecha:** 2026-08-24  
**Rama:** feat/adr029-fase5-generalizacion  
**Clasificación:** 5 tipos de literales según Fase 5 revisada  
**Estado:** Inventario completado — NO implementar nada todavía

---

## RESUMEN EJECUTIVO

| Tipo | Descripción | Count | Impacto |
|---|---|---|---|
| **TIPO 1** | Label de dominio (nombre metodología) | 1 | Bajo |
| **TIPO 2** | Label de dimensión (nombres ejes T1) | 2 | Medio |
| **TIPO 3** | Label de control/framework | 16 | Alto |
| **TIPO 4** | Prompts LLM hardcodeados en Edge Functions | 3+ | Alto |
| **TIPO 5** | Nombres de módulo/herramienta (invariantes) | 6 | NO TOCAR |
| **TOTAL CRÍTICO** | Requiere acción en Fase 5 | ~22 | — |
| **TRIVIAL** | Comentarios/docs | ~5 | Bajo |

---

## TIPO 1 — Labels de Dominio (Nombre de metodología/dominio)

**Solución:** Reemplazar con `governance_domains.label` donde `slug = 'ai_adoption'`

### Ubicaciones encontradas

1. **[AppSidebar.tsx:46](src/shared/components/AppSidebar.tsx#L46)** — "AI Value Dashboard"
   - Contexto: Label del módulo T10 en el sidebar
   - Propuesto: Leer de `governance_domains.label` para dominio activo
   - Campo: `governance_domains.label` (donde `domain_id` = proyecto activo)
   
**Count:** 1 ocurrencia en UI de módulo invariante (pero el label va en T10 dinámico)

---

## TIPO 2 — Labels de Dimensión (Nombres de ejes de evaluación)

**Solución:** Reemplazar con `evaluation_dimensions.label` por `domain_id` + `dimension_slug`

### Ubicaciones encontradas

1. **[MaturityBadge.tsx:17](src/modules/T5_AITaxonomyCanvas/components/MaturityBadge.tsx#L17)** — "AI Maturity"
   - Contexto: Label del badge en T5
   - Texto: `AI Maturity: {cfg.label}`
   - Propuesto: `{evaluationDimensionLabel('maturity')}: {cfg.label}`
   - Campo: `evaluation_dimensions.label` (domain_id + slug='maturity')

2. **[T11View.tsx:143](src/modules/T11_OperatingRhythm/T11View.tsx#L143)** — "AI Operating Rhythm"
   - Contexto: Título del módulo T11
   - Texto: `title="AI Operating Rhythm"`
   - Propuesto: Leer de `governance_configurations.config.t11_title` o similar
   - Campo: Configuración por dominio

**Count:** 2 ocurrencias (1 crítica, 1 moderada)

---

## TIPO 3 — Labels de Control/Framework (Regulatorio, normativa)

**Solución:** Reemplazar con `framework_controls.label` por `domain_id` + `control_id`

### Ubicaciones encontradas — CRÍTICAS (16 ocurrencias)

#### T6 — Risk Governance (13 ocurrencias)

1. **[T6View.tsx:133](src/modules/T6_RiskGovernance/T6View.tsx#L133)** 
   - Texto: `label: 'Dashboard AI Act'`
   - Propuesto: `label: getFrameworkLabel('ai_act_dashboard')`
   - Campo: `framework_controls.label` (domain_id + control_id)

2. **[T6View.tsx:154](src/modules/T6_RiskGovernance/T6View.tsx#L154)**
   - Texto: `subtitle="Recomendaciones de gobernanza basadas en tu exposición AI Act"`
   - Propuesto: Leer de configuración de dominio
   - Campo: `governance_configurations.config.risk_subtitle`

3. **[PolicyTab.tsx:183](src/modules/T6_RiskGovernance/components/PolicyTab.tsx#L183)**
   - Texto: `Política Corporativa de Inteligencia Artificial`
   - Propuesto: `governance_configurations.config.policy_title`
   - Campo: Configuración por dominio

4. **[PolicyTab.tsx:205](src/modules/T6_RiskGovernance/components/PolicyTab.tsx#L205)** — Contenido largo (ver linea)
   - Texto: Párrafos sobre "Política Corporativa de Inteligencia Artificial", "Inteligencia Artificial", "AI Act"
   - Propuesto: Leer de `llm_prompt_templates` (si es template de PDF) o `governance_configurations`
   - Campo: Múltiples campos de configuración

5. **[PolicyTab.tsx:316](src/modules/T6_RiskGovernance/components/PolicyTab.tsx#L316)**
   - Texto: `Riesgo AI Act`
   - Propuesto: `framework_controls.label` (control_id='ai_act_risk')
   - Campo: `framework_controls.label`

6. **[PolicyTab.tsx:358](src/modules/T6_RiskGovernance/components/PolicyTab.tsx#L358)**
   - Texto: `AI Act. Requieren las siguientes medidas...`
   - Propuesto: Leer de `governance_configurations.config.risk_guidance`
   - Campo: Configuración por dominio

7. **[PolicyTab.tsx:404](src/modules/T6_RiskGovernance/components/PolicyTab.tsx#L404)**
   - Texto: `disposiciones del AI Act, actualizaciones del RGPD...`
   - Propuesto: Leer de `governance_configurations.config.compliance_note`
   - Campo: Configuración por dominio

8. **[PolicyPDF.tsx:100](src/modules/T6_RiskGovernance/PolicyPDF.tsx#L100)**
   - Texto: `Política Corporativa de Inteligencia Artificial`
   - Propuesto: `governance_configurations.config.policy_title`
   - Campo: Configuración por dominio

9. **[PolicyPDF.tsx:113](src/modules/T6_RiskGovernance/PolicyPDF.tsx#L113)**
   - Texto: Párrafo completo sobre "Inteligencia Artificial", "EU AI Act", "RGPD"
   - Propuesto: Leer de `llm_prompt_templates` (template_key='policy_declaration')
   - Campo: `llm_prompt_templates.template`

10. **[PolicyPDF.tsx:184](src/modules/T6_RiskGovernance/PolicyPDF.tsx#L184)**
    - Texto: `Riesgo AI Act`
    - Propuesto: `framework_controls.label`
    - Campo: `framework_controls.label`

11. **[PolicyPDF.tsx:215](src/modules/T6_RiskGovernance/PolicyPDF.tsx#L215)**
    - Texto: `AI Act. Requieren las siguientes medidas...`
    - Propuesto: `governance_configurations.config.risk_guidance`
    - Campo: Configuración por dominio

12. **[PolicyPDF.tsx:257](src/modules/T6_RiskGovernance/PolicyPDF.tsx#L257)**
    - Texto: `disposiciones del AI Act...`
    - Propuesto: `governance_configurations.config.compliance_note`
    - Campo: Configuración por dominio

13. **[RiskDashboardTab.tsx:176](src/modules/T6_RiskGovernance/components/RiskDashboardTab.tsx#L176)**
    - Texto: `Cobertura de clasificación AI Act`
    - Propuesto: `framework_controls.label` (control_id='ai_act_classification')
    - Campo: `framework_controls.label`

#### T4 — Use Case Priority Board (3 ocurrencias)

14. **[AIActClassificationModal.tsx:98](src/modules/T4_UseCasePriorityBoard/components/AIActClassificationModal.tsx#L98)**
    - Texto: `<Badge variant="navy" shape="pill" size="xs" className="font-bold">AI Act</Badge>`
    - Propuesto: `{getFrameworkLabel('ai_act_framework')}`
    - Campo: `framework_controls.label`

15. **[AIActClassificationModal.tsx:119](src/modules/T4_UseCasePriorityBoard/components/AIActClassificationModal.tsx#L119)**
    - Texto: `El sector determina si aplica el Anexo III del AI Act (alto riesgo automático).`
    - Propuesto: Leer de `governance_configurations.config.aiact_annex3_rule`
    - Campo: Configuración por dominio

16. **[AIActClassificationModal.tsx:264](src/modules/T4_UseCasePriorityBoard/components/AIActClassificationModal.tsx#L264)**
    - Texto: `Este sistema puede caer en la categoría de uso prohibido por el AI Act (Art. 5). Revisa con el equipo legal antes de proceder.`
    - Propuesto: Leer de `governance_configurations.config.prohibited_use_warning`
    - Campo: Configuración por dominio

**Impacto:** ALTO — Estos literales están en paths críticos de negocio (riesgo regulatorio T6, clasificación T4)

---

## TIPO 4 — Prompts LLM Hardcodeados en Edge Functions

**Solución:** Migrar a `llm_prompt_templates` (lectura en runtime según `domain_id`)

### Ubicaciones encontradas

1. **[ai-recommend/index.ts:134-150](supabase/functions/ai-recommend/index.ts#L134-L150)** — SYSTEM_PROMPT T6
   - Módulo: T6 (Risk Governance / Policy Generator)
   - Contenido: "Eres un experto en gobernanza de IA y derecho tecnológico europeo..."
   - Líneas: 134–150 (breve)
   - Variables hardcodeadas: 
     - "EU AI Act"
     - "gobernanza de IA"
     - "política corporativa de adopción de IA"
   - Propuesto: Leer de `llm_prompt_templates` (domain_id + module_slug='t6_policy' + prompt_key='system')
   - Campo: `llm_prompt_templates.template`

2. **[ai-recommend/prompts/t1.ts:67-96](supabase/functions/ai-recommend/prompts/t1.ts#L67-L96)** — SYSTEM_PROMPT T1
   - Módulo: T1 (Maturity Radar)
   - Contenido: "Eres un consultor senior especializado en adopción estratégica de IA..."
   - Líneas: 67–96 (largo)
   - Variables hardcodeadas:
     - "adopción estratégica de IA"
     - "evaluación de madurez IA"
     - Referencias a madurez IA, dimensiones
   - Propuesto: Leer de `llm_prompt_templates` (domain_id + module_slug='t1_radar' + prompt_key='system')
   - Campo: `llm_prompt_templates.template`

3. **[ai-recommend/index.ts:398](supabase/functions/ai-recommend/index.ts#L398)** — SYSTEM_PROMPT T6 (redundante con #1)
   - Módulo: T6 (Risk Governance)
   - Contenido: "Eres un experto en gobernanza de IA, EU AI Act y compliance..."
   - Similar al anterior, consolidable

**Análisis adicional:** Hay referencias a `maturityTier`, `earlyAdopterRatio`, `dashboard.maturity`, `dashboard.adoption` en los mismos archivos (líneas 324, 372, 394, 493, 494, 517). Estos son **nombres de conceptos/campos**, no literales de dominio — van en estructuras de BD / tipos TS, no en prompts visibles. Ver TIPO 5.

**Impacto:** ALTO — Cambiar estos prompts requiere:
1. Crear migraciones SQL para poblar `llm_prompt_templates`
2. Actualizar Edge Functions para leer de BD en runtime
3. Garantizar que `domain_id` está disponible en contexto de edge function

---

## TIPO 5 — Nombres de Módulo/Herramienta (INVARIANTES - NO TOCAR)

**Decisión:** Estos son nombres de producto GOBY, no de dominio. No se reemplazan en Fase 5.

### Ubicaciones (informativas, no requieren acción)

1. **"AI Readiness Assessment"** (label de T1 en sidebar)
   - Archivo: [AppSidebar.tsx:37](src/shared/components/AppSidebar.tsx#L37)
   - Justificación: Nombre del módulo T1 es invariante de plataforma
   - Decisión: MANTENER

2. **"AI Taxonomy Canvas"** (label de T5 en sidebar)
   - Archivo: [AppSidebar.tsx:41](src/shared/components/AppSidebar.tsx#L41)
   - Justificación: Nombre del módulo T5 es invariante de plataforma
   - Decisión: MANTENER

3. **"AI Roadmap"** (label de T9 en sidebar)
   - Archivo: [AppSidebar.tsx:45](src/shared/components/AppSidebar.tsx#L45)
   - Justificación: Nombre del módulo T9 es invariante de plataforma
   - Decisión: MANTENER

4. **"AI Stakeholder Matrix"** (título de T2)
   - Archivo: [T2View.tsx:112](src/modules/T2_StakeholderMatrix/T2View.tsx#L112)
   - Justificación: Nombre del módulo T2 es invariante de plataforma
   - Decisión: MANTENER

5. **"AI Domain Architecture Canvas"** (título de T5)
   - Archivo: [T5View.tsx:76](src/modules/T5_AITaxonomyCanvas/T5View.tsx#L76)
   - Justificación: Nombre del módulo T5 es invariante de plataforma
   - Decisión: MANTENER

6. **"AI System Impact Assessment — ISO 42001"** (título de T12)
   - Archivo: [T12View.tsx:110](src/modules/T12_ISOAssessment/T12View.tsx#L110)
   - Justificación: Nombre del módulo T12 es invariante de plataforma
   - Decisión: MANTENER

**Count:** 6 ocurrencias (todas TIPO 5)

---

## TRIVIAL — Comentarios y Documentación (No afectan funcionalidad)

### Ubicaciones

1. **[T6View.tsx:6](src/modules/T6_RiskGovernance/T6View.tsx#L6)**
   - Texto: `// Dashboard AI Act — distribución de riesgos + tabla por caso`
   - Acción: Limpiar o actualizar comentario

2. **[RiskDashboardTab.tsx:2](src/modules/T6_RiskGovernance/components/RiskDashboardTab.tsx#L2)**
   - Texto: `// RiskDashboardTab — Tab 2 of T6View: AI Act risk distribution`
   - Acción: Limpiar comentario

3. **[ai-recommend/prompts/t1.ts:2-8](supabase/functions/ai-recommend/prompts/t1.ts#L2-L8)**
   - Texto: Comentarios sobre "Madurez IA", "adopción IA"
   - Acción: Actualizar para referir a dominio genérico

4. **[UseCaseDetailPanel.tsx:326](src/modules/T4_UseCasePriorityBoard/components/UseCaseDetailPanel.tsx#L326)**
   - Texto: `{/* ── TAB: REGULATORIO (AI Act) ──────────────────────── */}`
   - Acción: Limpiar comentario (cambiar a "TAB: REGULATORIO")

5. **Varios** en tests (exluidos per spec)

**Impacto:** BAJO — No afecta funcionalidad

---

## RESUMEN POR IMPACTO

### CRÍTICO (impacto alto, cambio obligatorio en Fase 5)

| Tipo | Ubicación | Cambio |
|---|---|---|
| TIPO 3 | T6 (13 ocurrencias) | Migrar labels a `framework_controls` + `governance_configurations` |
| TIPO 3 | T4 (3 ocurrencias) | Migrar labels a `framework_controls` |
| TIPO 4 | Edge Functions T1, T6 | Migrar prompts a `llm_prompt_templates` |

**Estimación de esfuerzo:** 
- Análisis: 2h (definir campos de configuración para cada literal)
- Implementación: 4–6h (update componentes + edge functions)
- Testing: 2–3h (verificar que lookups funcionan, no regresión en scoring)
- **Total: 8–11h**

### MODERADO (cambio necesario pero menor impacto)

| Tipo | Ubicación | Cambio |
|---|---|---|
| TIPO 2 | T5, T11 | Migrar dimension labels a `evaluation_dimensions` |
| TIPO 1 | T10 (sidebar) | Migrar domain label a `governance_domains` |

**Estimación de esfuerzo:** 
- Análisis: 1h
- Implementación: 1–2h
- Testing: 1h
- **Total: 3–4h**

### BAJO (opcional, no bloquea Fase 5)

| Tipo | Ubicación | Cambio |
|---|---|---|
| TRIVIAL | Comentarios | Limpieza mecánica |
| TIPO 5 | Nombres de módulo | NO TOCAR (invariantes) |

---

## PRÓXIMOS PASOS (Fuera de este inventario)

1. **Confirmar estructura de tablas** — Verificar que `governance_domains`, `evaluation_dimensions`, `governance_configurations`, `llm_prompt_templates`, `framework_controls` están creadas (Fase 1 debe estar hecha)

2. **Definir campos de configuración** — Para cada literal de TIPO 3:
   - ¿Va en `governance_configurations.config` (JSONB) o en tabla separada?
   - Ejemplo: "Riesgo AI Act" → `framework_controls.label` ✅ o `governance_configurations.config.risk_label`?

3. **Crear helper functions** — Para acceso centralizado:
   ```typescript
   // Ejemplo de helpers a crear
   getFrameworkLabel(controlId: string, domainId: uuid) → string
   getEvaluationDimensionLabel(dimensionSlug: string, domainId: uuid) → string
   getDomainLabel(domainId: uuid) → string
   ```

4. **Seed data** — Poblar `llm_prompt_templates` con los 2 prompts de Edge Functions (T1, T6)

5. **Tests de caracterización** — Verificar que:
   - T1 sigue generando recomendaciones correctas tras leer prompt de BD
   - T4/T6 clasifican riesgos AI Act correctamente
   - Labels dinámicos se renderizen sin regresión visual

---

**Generado:** 2026-08-24  
**Auditor:** Claude Code (ADR-029 Fase 5)  
**Estado:** Inventario COMPLETADO — Listo para plan de implementación

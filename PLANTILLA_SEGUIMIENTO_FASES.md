# PLANTILLA DE SEGUIMIENTO: FASES DE GENERALIZACIÓN IA

**Proyecto:** GOBY — Multidominio Governance  
**Objetivo:** Trackear progreso de 8 fases (Sprints 13-16)  
**Responsable:** [Nombre]  
**Última actualización:** [Fecha]

---

## ESTADO GENERAL

| Métrica | Estado | Detalle |
|---------|--------|---------|
| **Fases completadas** | 0/8 | Próximo: Fase 1 |
| **Bloqueadores** | 0 | Ninguno |
| **Riesgo actual** | VERDE | En plan |
| **Slippage estimado** | 0 días | On track |

---

## FASE 1: BASE DE DATOS (Sprint 13, Semanas 1-2)

### Objetivo
Crear tablas: governance_domains, evaluation_dimensions, governance_configurations, llm_prompt_templates, framework_controls. Poblar con dominio 'ai'.

### Tareas

- [ ] **T1.1** Diseñar schema detallado de 5 nuevas tablas
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Notas: Revisar con equipo técnico

- [ ] **T1.2** Crear migrations SQL + rollback scripts
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: Tests en BD local

- [ ] **T1.3** Poblar governance_domains tabla (dominio 'ai')
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: SELECT * count = 1

- [ ] **T1.4** Poblar evaluation_dimensions (D1-D6 + subdims)
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: count(dimensions) = 6, count(subdimensions) = 24

- [ ] **T1.5** Poblar governance_configurations (T5 dominios + T1 config)
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: JSONB integridad

- [ ] **T1.6** Crear índices + optimizar queries
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: EXPLAIN ANALYZE < 100ms

- [ ] **T1.7** Snapshot BD + test restore en staging
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: Restore completo < 5min

- [ ] **T1.8** Documentar schema changes en ADR
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Archivo: docs/decisions/technical/ADR-XXX.md

### Validación Pre-Merge

- [ ] Migrations ejecutadas en BD local sin errores
- [ ] Datos de dominio 'ai' == constants.ts actuales (byte-to-byte)
- [ ] Índices creados y performantes
- [ ] Rollback script testrado
- [ ] Code review: 2/2 aprobaciones

### Bloqueadores

(Ninguno aún)

### Notas

---

## FASE 2: TIPADO DINÁMICO (Sprint 13, Semanas 3-4)

### Objetivo
Implementar DynamicSchemaRegistry + useDynamicSchema hook con fallback a hardcodeado.

### Tareas

- [ ] **T2.1** Implementar DynamicSchemaBuilder.ts factory
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Archivo: src/lib/schemas/dynamicSchemaBuilder.ts
  - Líneas: ~155
  - Tests: buildZodSchemaFromMeta

- [ ] **T2.2** Crear useDynamicSchema hook
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Archivo: src/hooks/useDynamicSchema.ts
  - Líneas: ~80

- [ ] **T2.3** Implementar feature flag useDynamicSchemaRegistry
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Default: OFF
  - Validación: Toggle sin recompilación

- [ ] **T2.4** Unit tests: schema dinámico == hardcodeado
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Cobertura: >95%

- [ ] **T2.5** Refactor t4.service.ts para usar registry
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: useCase parsing idéntico

- [ ] **T2.6** Refactor T4 componentes para usar hook
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: Modal validación funcional

### Validación Pre-Merge

- [ ] Unit tests: 100% pass
- [ ] Schema dinámico produces identical validation results
- [ ] Fallback to hardcodeado works (feature flag OFF)
- [ ] No performance degradation
- [ ] Code review: 2/2 aprobaciones

### Bloqueadores

(Ninguno aún)

### Notas

---

## FASE 3: STORES GENÉRICOS (Sprint 14, Semanas 1-2)

### Objetivo
Implementar createEvaluationStore factory genérico. Refactor useT1Store.

### Tareas

- [ ] **T3.1** Implementar genericEvaluationStore.ts factory
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Archivo: src/lib/stores/genericEvaluationStore.ts
  - Líneas: ~260
  - Tests: createEvaluationStore con diferentes configs

- [ ] **T3.2** Refactor useT1Store usando factory
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: setScore, setEvidence, addRespondent idénticos

- [ ] **T3.3** Unit tests: equivalencia useT1Store nuevo == antiguo
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Snapshot tests: estado antes/después

- [ ] **T3.4** Refactor useT5Store usando factory
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: canvas state idéntico

- [ ] **T3.5** Performance tests: latencia store operations
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Umbrales: setScore < 10ms, persist debounce 600ms

### Validación Pre-Merge

- [ ] Generic factory tests: 100% pass
- [ ] useT1Store equivalence: test suite pass
- [ ] useT5Store equivalence: test suite pass
- [ ] No performance regression
- [ ] Memory profiling: no leaks en debounce

### Bloqueadores

(Ninguno aún)

### Notas

---

## FASE 4: COMPONENTES DINÁMICOS (Sprint 14, Semanas 3-4)

### Objetivo
Parametrizar SpiderChart para N dimensiones. Crear panelRegistry. Refactor T10View.

### Tareas

- [ ] **T4.1** Parametrizar SpiderChart.tsx para N ejes
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: SVG viewBox escalable
  - Tests: N=3,4,5,6,7 ejes render correctamente

- [ ] **T4.2** Implementar panelRegistry.ts
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Archivo: src/lib/dashboards/panelRegistry.ts
  - Líneas: ~180

- [ ] **T4.3** Registrar paneles IA por defecto (6 paneles)
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: panelRegistry.getPanelsByDomain('ai').length == 6

- [ ] **T4.4** Refactor T10View para usar panelRegistry
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: Mismo layout que anterior, pero dinámico

- [ ] **T4.5** Visual regression tests: SpiderChart
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Umbrales: <2% pixel diff con T1SpiderChart anterior

- [ ] **T4.6** Visual regression tests: T10 Dashboard
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Umbrales: <2% pixel diff

### Validación Pre-Merge

- [ ] SpiderChart(N) renders correctly for N=3 to N=8
- [ ] panelRegistry unit tests: 100% pass
- [ ] T10View visual regression: pass
- [ ] No performance regression on T10 load
- [ ] Code review: 2/2 aprobaciones

### Bloqueadores

(Ninguno aún)

### Notas

---

## FASE 5: CONSTANTES → BD (Sprint 15, Semanas 1-2)

### Objetivo
Sacar T1_DIMENSION_CONFIG, T5_DOMAIN_CONFIG, DIMENSION_CONFIG (T4) a queries dinámicas.

### Tareas

- [ ] **T5.1** Refactor T1 para queries dinámicas a evaluation_dimensions
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: Scores == baseline
  - Fallback: Si query falla, usar constants.ts

- [ ] **T5.2** Refactor T5 para queries dinámicas a governance_configurations
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: Recommendation engine == baseline

- [ ] **T5.3** Refactor T4 scoring para usar config dinámico
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: Score compuesto == baseline

- [ ] **T5.4** Feature flag useDynamicConfig (OFF default)
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: Doble-read en transición

- [ ] **T5.5** Tests: cambiar config en BD → verificar UI actualiza
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Escenario: Cambiar weight D1 de 0.18 a 0.20 → score recalculado

- [ ] **T5.6** Performance tests: queries + caching
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Umbrales: Query < 100ms con índice

### Validación Pre-Merge

- [ ] Queries a BD retornan datos idénticos a constants.ts
- [ ] Feature flag toggle works (ON/OFF sin recompilación)
- [ ] Performance: T1 load < 500ms (incluye queries)
- [ ] No breaking changes para usuarios finales
- [ ] RLS policies aún funcionales

### Bloqueadores

(Ninguno aún)

### Notas

---

## FASE 6: LLM PROMPTS PARAMETRIZADOS (Sprint 15, Semanas 3-4)

### Objetivo
Migrar 4 prompts (T1, T6, T7, T8) a tabla llm_prompt_templates. Factory buildDynamicPrompt.

### Tareas

- [ ] **T6.1** Pueblar llm_prompt_templates tabla con 4 prompts
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: SELECT * count = 4

- [ ] **T6.2** Crear factory buildDynamicPrompt
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Archivo: src/lib/governance/promptBuilder.ts

- [ ] **T6.3** Refactor Edge Function ai-recommend para usar factory
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: LLM outputs == baseline (semantic similarity > 0.95)

- [ ] **T6.4** Tests: cambiar prompt en BD → verificar quality
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - A/B testing setup

- [ ] **T6.5** Documentation: parámetros de template por dominio
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Archivo: docs/prompts/TEMPLATE_GUIDE.md

### Validación Pre-Merge

- [ ] LLM outputs idénticos a prompts hardcodeados (semantic similarity)
- [ ] Prompts en BD = prompts en código (inicial)
- [ ] Feature flag para rolear cambios gradualmente
- [ ] No rate limiting issues

### Bloqueadores

(Ninguno aún)

### Notas

---

## FASE 7: SEGUNDO DOMINIO PILOTO (Sprint 16, Semanas 1-2)

### Objetivo
Crear dominio 'data' en BD. Implementar T1 Data + T4 Data. UI switchable.

### Tareas

- [ ] **T7.1** Diseñar Data Governance dimensiones (5 dimensions)
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Dimensiones propuestas: Quality, Governance, Architecture, Culture, Analytics

- [ ] **T7.2** Poblar BD: governance_domains('data')
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente

- [ ] **T7.3** Poblar evaluation_dimensions para 'data' domain
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente

- [ ] **T7.4** Crear useT1DataStore usando factory
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: T1Data CRUD = T1 pero 5 dimensiones

- [ ] **T7.5** Crear T1 Data UI componentes
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Reutilizar T1View como template

- [ ] **T7.6** Crear UI selector: "Govern. IA" vs "Govern. Datos"
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Ubicación: Navigation / dominio selector

- [ ] **T7.7** E2E tests: crear entrevista T1 Data → scores independientes
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: T1(ai) scores != T1(data) scores

### Validación Pre-Merge

- [ ] T1 Data CRUD fully functional
- [ ] Scores independientes por dominio (T1ai != T1data)
- [ ] UI selector works (switching without losing data)
- [ ] E2E tests: crear + guardar + cargar entrevista Data
- [ ] Dashboard muestra ambos dominios si ambos con datos

### Bloqueadores

(Ninguno aún)

### Notas

---

## FASE 8: RENOMBRAMIENTOS Y LIMPIEZA (Sprint 16, Semanas 3-4)

### Objetivo
Renombrar campos/tablas agnósticas. Eliminar referencias "ai_" de nombres genéricos.

### Tareas

- [ ] **T8.1** Renombrar ai_category → domain_category en BD + código
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: use_cases.domain_category queries OK
  - Breaking: Sí (pero post-migration, aceptable)

- [ ] **T8.2** Renombrar aiRisk → regulatory_risk en BD + código
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente

- [ ] **T8.3** Renombrar ai_rate_limit_log → rate_limit_log
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente

- [ ] **T8.4** Grep "ai_" agnóstico (no "ai-" en package names)
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Target: 0 resultados para campos agnósticos

- [ ] **T8.5** Actualizar all indexes + RLS policies
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Validación: RLS tests pass

- [ ] **T8.6** Code cleanup: remover dead constants si migraron a BD
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Fallback: mantener si no migraron completamente

- [ ] **T8.7** Documentación final: "How to add new Governance Domain"
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Archivo: docs/guides/ADD_NEW_DOMAIN.md
  - Audiencia: Ingenieros nuevos

- [ ] **T8.8** Retrospectiva: lecciones aprendidas
  - Propietario: [Nombre]
  - Estado: ⏳ Pendiente
  - Documento: RETRO_GENERALIZACION.md

### Validación Pre-Merge

- [ ] All renamed fields: queries OK, RLS policies OK
- [ ] Grep "ai_" agnóstico: 0 resultados
- [ ] Integration tests: end-to-end workflows still work
- [ ] Documentation complete + reviewed

### Bloqueadores

(Ninguno aún)

### Notas

---

## MÉTRICAS Y KPIs

### Velocidad de Desarrollo

| Fase | Horas Estimadas | Horas Reales | Varianza | Productividad |
|------|-----------------|--------------|----------|--------------|
| Fase 1 | 20 | — | — | — |
| Fase 2 | 16 | — | — | — |
| Fase 3 | 16 | — | — | — |
| Fase 4 | 24 | — | — | — |
| Fase 5 | 20 | — | — | — |
| Fase 6 | 16 | — | — | — |
| Fase 7 | 16 | — | — | — |
| Fase 8 | 16 | — | — | — |
| **TOTAL** | **144** | — | — | — |

### Calidad

| Métrica | Umbral | Estado |
|---------|--------|--------|
| Unit test coverage | >95% | ⏳ Pendiente |
| E2E test pass rate | 100% | ⏳ Pendiente |
| Code review approvals | 2/2 | ⏳ Pendiente |
| Visual regression diff | <2% | ⏳ Pendiente |
| Zero breaking changes (user-facing) | 100% | ⏳ Pendiente |

### Riesgos Activos

| Riesgo | Estado | Mitigación |
|--------|--------|-----------|
| Data loss en migración | VERDE (snapshot listo) | Backup + restore test |
| RLS policies break | AMARILLO (audit pendiente) | Auditoría pre-deploy |
| LLM quality degrades | VERDE (baseline establecido) | Semantic similarity test |
| Performance regression | VERDE (benchmark set) | Load tests por fase |

---

## NOTAS GENERALES

(Uso este espacio para notas, decisiones, learnings, blockers a nivel general)

---

## HISTORIAL DE ACTUALIZACIONES

| Fecha | Actualizado por | Cambios |
|-------|-----------------|---------|
| 2026-08-21 | [Nombre] | Plantilla inicial creada |
| — | — | — |

---

**Última revisión:** 2026-08-21  
**Próxima actualización prevista:** Sprint 13 start (within 1 week)

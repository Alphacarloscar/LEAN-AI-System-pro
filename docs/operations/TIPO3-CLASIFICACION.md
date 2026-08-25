# TIPO 3 — Diagnóstico de Framework Labels (AI Act)

**Auditoría:** Grep exhaustivo de "AI Act", "GPAI", "EU AI", "Reglamento IA", "Riesgo AI"  
**Fecha:** 2026-08-24  
**Módulos:** T6 (Risk Governance), T4 (Use Case Priority Board)  
**Clasificación:** A (Label visible) | B (Valor de dato) | C (Key interno NO tocar)

---

## T6 — RISK GOVERNANCE (19 referencias)

### A) Labels Visibles al Usuario (PARAMETRIZAR)

| Línea | Archivo | Contexto | Texto | Clasificación | Solución |
|---|---|---|---|---|---|
| 133 | T6View.tsx | Tab label en selector | `'Dashboard AI Act'` | **A** | Leer de `framework_controls.label` (control_id='aiact_dashboard') |
| 316 | PolicyTab.tsx | Header de tabla HTML | `<th>Riesgo AI Act</th>` | **A** | Leer de `framework_controls.label` (control_id='aiact_risk') |
| 219 | RiskDashboardTab.tsx | Header de tabla HTML | `<th>Riesgo AI Act</th>` | **A** | Leer de `framework_controls.label` (control_id='aiact_risk') |
| 176 | RiskDashboardTab.tsx | Texto en modal/card | `"Cobertura de clasificación AI Act"` | **A** | Leer de `framework_controls.label` (control_id='aiact_classification') |
| 184 | PolicyPDF.tsx | Header de tabla PDF | `<Text>Riesgo AI Act</Text>` | **A** | Leer de `framework_controls.label` — mismo que línea 316 |
| 141 | constants.ts | Título de control | `'Evaluación de riesgos regulatorios IA (AI Act)'` | **A** | Leer de `framework_controls.label` (control_id='aiact_assessment') |
| 154 | T6View.tsx | Subtitle en widget | `"Recomendaciones de gobernanza basadas en tu exposición AI Act"` | **A** | Leer de `governance_configurations.config.aiact_subtitle` |

**Count A:** 7 ocurrencias visibles al usuario

---

### B) Valores de Datos en Constantes/Configuración (EVALUAR CASO A CASO)

| Línea | Archivo | Contexto | Texto | Clasificación | Análisis |
|---|---|---|---|---|---|
| 26 | constants.ts | description en objeto AI Act nivel 'prohibited' | `'Sistema potencialmente en categoría prohibida (Art. 5 AI Act). Requiere revisión legal inmediata...'` | **B** | Descripción de nivel de riesgo. Va en `framework_controls.description` parametrizada por dominio. |
| 35 | constants.ts | description en objeto AI Act nivel 'high_risk' | `'Sistema de alto riesgo según Annex III del AI Act. Requiere evaluación de conformidad...'` | **B** | Descripción de nivel de riesgo. Va en `framework_controls.description` parametrizada por dominio. |
| 53 | constants.ts | description en objeto AI Act nivel 'low_risk' | `'Sin requisitos regulatorios específicos del AI Act. Recomendado documentar...'` | **B** | Descripción de nivel de riesgo. Va en `framework_controls.description` parametrizada por dominio. |
| 62 | constants.ts | description en objeto AI Act nivel 'unclassified' | `'Pendiente de clasificación. Completa el cuestionario AI Act...'` | **B** | Descripción de nivel de riesgo. Va en `framework_controls.description` parametrizada por dominio. |
| 142 | constants.ts | description de control regulatorio | `'Los sistemas IA han sido evaluados según el EU AI Act y el RGPD...'` | **B** | Descripción de control. Va en `framework_controls.description` parametrizada. |
| 205 | PolicyTab.tsx | Párrafo completo de declaración política | `"${companyName} se compromete a adoptar la Inteligencia Artificial... EU AI Act, Reglamento UE 2024/1689..."` | **B** | Párrafo template generado por LLM (T6_policy). YA MOVIDO a `llm_prompt_templates` en Fase 5 Tipo 4. NO tocar aquí. |
| 358 | PolicyTab.tsx | Texto de guidance en tabla | `"AI Act. Requieren las siguientes medidas..."` | **B** | Guidance de usuario. Va en `governance_configurations.config` como template corto. |
| 404 | PolicyTab.tsx | Texto de guidance en tabla | `"nuevas disposiciones del AI Act, actualizaciones del RGPD..."` | **B** | Guidance de usuario. Va en `governance_configurations.config`. |
| 215 | PolicyPDF.tsx | Texto en PDF (cuerpo) | `"AI Act. Requieren las siguientes medidas..."` | **B** | Mismo que línea 358 (reutilizable). |
| 257 | PolicyPDF.tsx | Texto en PDF (cuerpo) | `"nuevas disposiciones del AI Act..."` | **B** | Mismo que línea 404 (reutilizable). |
| 113 | PolicyPDF.tsx | Párrafo de declaración en PDF | Similar a línea 205 | **B** | YA en `llm_prompt_templates`. NO tocar. |

**Count B:** 11 referencias (7 críticas = constantes, 4 = YA en LLM templates)

---

### C) Keys Internos / Comentarios (NO TOCAR)

| Línea | Archivo | Contexto | Texto | Clasificación | Nota |
|---|---|---|---|---|---|
| 2 | RiskDashboardTab.tsx | Comentario JSDoc | `// AI Act risk distribution` | **C** | Comentario interno. Limpieza mecánica opcional. |
| 6 | T6View.tsx | Comentario en código | `// Dashboard AI Act — distribución de riesgos` | **C** | Comentario interno. Limpieza mecánica opcional. |
| 8 | constants.ts | Comentario header | `// ── Config visual AI Act ──` | **C** | Comentario interno. Limpieza mecánica opcional. |
| 2 | t6ContextBuilder.ts | Comentario JSDoc | `// a partir de los datos de T4 (AI Act)` | **C** | Comentario interno. |
| 54 | t6ContextBuilder.ts | Comentario en código | `// AI Act risk breakdown` | **C** | Comentario interno. |
| 6 | types.ts | Comentario JSDoc | `// · Dashboard de riesgos AI Act por caso de uso` | **C** | Comentario interno. |
| 47 | types.ts | Comentario header | `// ── Resumen de riesgos AI Act ─────────────────` | **C** | Comentario interno. |

**Count C:** 7 comentarios (limpieza opcional, no afecta funcionalidad)

---

## T4 — USE CASE PRIORITY BOARD (15 referencias)

### A) Labels Visibles al Usuario (PARAMETRIZAR)

| Línea | Archivo | Contexto | Texto | Clasificación | Solución |
|---|---|---|---|---|---|
| 98 | AIActClassificationModal.tsx | Badge en modal | `<Badge>AI Act</Badge>` | **A** | Leer de `framework_controls.label` (control_id='aiact_framework') |
| 228 | UseCaseDetailPanel.tsx | Tooltip/title | `title="Ver clasificación AI Act"` | **A** | Leer de `governance_configurations.config.aiact_classification_title` |
| 298 | UseCaseDetailPanel.tsx | Tab label | `` `AI Act${...}` `` | **A** | Leer de `framework_controls.label` (control_id='aiact_framework') |
| 326 | UseCaseDetailPanel.tsx | Comentario/markup | `{/* ── TAB: REGULATORIO (AI Act) ──*/}` | **C** | Cambiar a `{/* ── TAB: REGULATORIO ──*/}` (limpieza) |
| 335 | UseCaseDetailPanel.tsx | Texto de estado vacío | `"Sin clasificación AI Act"` | **A** | Leer de `governance_configurations.config.unclassified_label` |
| 358 | UseCaseDetailPanel.tsx | Label de campo | `"Nivel de riesgo EU AI Act"` | **A** | Leer de `framework_controls.label` (control_id='aiact_risk_level') |
| 422 | UseCaseDetailPanel.tsx | Texto de categoría riesgo | `"Sistema potencialmente prohibido — Art. 5 AI Act"` | **A** | Leer de `framework_controls.label` (control_id='aiact_prohibited') |
| 463 | UseCaseDetailPanel.tsx | Texto de guidance | `"Sin obligaciones regulatorias específicas del AI Act..."` | **A** | Leer de `governance_configurations.config.no_obligations_guidance` |

**Count A:** 8 ocurrencias visibles al usuario

---

### B) Valores de Datos en Constantes/Contexto (EVALUAR)

| Línea | Archivo | Contexto | Texto | Clasificación | Análisis |
|---|---|---|---|---|---|
| 119 | AIActClassificationModal.tsx | Texto educativo en modal | `"El sector determina si aplica el Anexo III del AI Act (alto riesgo automático)."` | **B** | Guidance educativa. Va en `governance_configurations.config.sector_annex3_guidance` |
| 264 | AIActClassificationModal.tsx | Texto de advertencia | `"Este sistema puede caer en la categoría de uso prohibido por el AI Act (Art. 5)..."` | **B** | Guidance educativa. Va en `governance_configurations.config.prohibited_use_warning` |
| 269 | AIActClassificationModal.tsx | Texto de advertencia | `"Requiere conformidad con el Anexo III del AI Act antes de despliegue..."` | **B** | Guidance educativa. Va en `governance_configurations.config.annex3_compliance_warning` |
| 30 | LowScoreRecommendations.tsx | Acción en recomendación | `'Realiza la clasificación según el AI Act, documenta el plan...'` | **B** | Acción de recomendación. Va en `governance_configurations.config.aiact_classification_action` |
| 338 | UseCaseDetailPanel.tsx | Descripción de campo | `"Clasifica este caso de uso para evaluar su nivel de riesgo regulatorio según el EU AI Act y el RGPD."` | **B** | Guidance educativa. Va en `governance_configurations.config.classification_guidance` |

**Count B:** 5 referencias

---

### C) Keys Internos / Comentarios (NO TOCAR)

| Línea | Archivo | Contexto | Texto | Clasificación | Nota |
|---|---|---|---|---|---|
| 78 | store.ts | Comentario JSDoc | `/** Guarda la clasificación AI Act */` | **C** | Comentario interno. |
| 11 | t4ContextBuilder.ts | Comentario JSDoc | `// - Perfil de riesgo AI Act del portfolio` | **C** | Comentario interno. |
| 138 | t4ContextBuilder.ts | Comentario en código | `// ── Riesgo AI Act ──` | **C** | Comentario interno. |
| 207 | types.ts | Comentario JSDoc | `/** Clasificación regulatoria AI Act + RGPD */` | **C** | Comentario interno. |
| 214 | types.ts | Comentario header | `// ── Clasificación regulatoria AI Act ───────` | **C** | Comentario interno. |
| 257 | types.ts | Comentario JSDoc | `/** Calcula el nivel de riesgo AI Act...` | **C** | Comentario interno. |

**Count C:** 6 comentarios (limpieza opcional)

---

## RESUMEN EJECUTIVO

### Recuento Total por Clasificación

| Clasificación | T6 | T4 | Total | Acción |
|---|---|---|---|---|
| **A) Label visible** | 7 | 8 | **15** | ✅ Parametrizar (criticidad ALTA) |
| **B) Valor de dato** | 7 críticos + 4 en LLM | 5 | **16** | ⚠️ Evaluar (algunos YA movidos) |
| **C) Key interno** | 7 comentarios | 6 comentarios | **13** | 🟢 NO tocar (limpieza opcional) |
| **TOTAL** | 21 | 19 | **40** | — |

---

## Impacto por Tipo de Cambio

### A) Labels Visibles (15) — CRÍTICO

**Ubicaciones:** Principalmente en JSX (componentes renderizados).

**Estrategia parametrización:**
1. Crear tabla `framework_controls` con:
   - `control_id`: 'aiact_dashboard', 'aiact_risk', 'aiact_classification', 'aiact_framework', 'aiact_risk_level', 'aiact_prohibited'
   - `label`: El texto visible actual (parametrizable por idioma después)
   - `description`: Guidance asociada

2. Crear helpers en `src/services/governance.ts`:
   ```typescript
   getFrameworkControlLabel(controlId: string, domainId: string): Promise<string>
   ```

3. Actualizar componentes para llamar al helper antes de render.

**Esfuerzo:** 3–4h (queries BD, helpers, actualizar 8 componentes JSX)

---

### B) Valores de Datos (16) — MODERADO

**Ubicaciones:** Constantes, strings en objetos, guidance educativa.

**Análisis:**
- 4 YA están en `llm_prompt_templates` (Fase 5 Tipo 4) — **NO TOCAR**
- 7 en T6 constants.ts (descriptions de niveles de riesgo) — **Migrar a `framework_controls.description`**
- 5 en T4 (guidance educativa) — **Migrar a `governance_configurations.config`**

**Esfuerzo:** 2–3h (migrar constantes a helpers, actualizar referencias)

---

### C) Keys Internos (13) — BAJO

**Ubicaciones:** Comentarios en código, JSDoc, labels internos.

**Acción:** Limpieza mecánica (cambiar "AI Act" → "Regulatorio" en comentarios). **Opcional, no bloquea Fase 5.**

**Esfuerzo:** 0.5–1h (si se hace)

---

## Orden de Implementación Recomendado (Fase 5 Tipo 3)

1. **Paso 1:** Confirmar estructura BD (Fase 1 completada)
2. **Paso 2:** Crear helpers en `src/services/governance.ts`
3. **Paso 3:** Migrar constantes T6 a `framework_controls` + `governance_configurations`
4. **Paso 4:** Actualizar componentes JSX para leer de BD (T6 primero, luego T4)
5. **Paso 5:** Tests de renderizado (verificar labels se actualizan dinámicamente)
6. **Paso 6:** Limpieza opcional de comentarios (Paso C)

---

**Generado:** 2026-08-24  
**Estado:** Diagnóstico COMPLETO — Listo para plan de implementación Tipo 3

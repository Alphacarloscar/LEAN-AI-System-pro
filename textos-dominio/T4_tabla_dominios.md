# T4 — Use Case Priority Board / Economics — Tabla de personalización por dominio
 
Total: 333 entradas (1 fila = 1 string individual). Fuentes: extracción original, IA, Transformación Digital (DT), Data (borrador).
 
 
## constants.ts
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| Go | STATUS_CONFIG.go.label | badge de estado | Go | Go | Go | (igual) |
| En piloto | STATUS_CONFIG.en_piloto.label | badge de estado | En piloto | En piloto | En piloto | (igual) |
| Priorizado | STATUS_CONFIG.priorizado.label | badge de estado | Priorizado | Priorizado | Priorizado | (igual) |
| Candidato | STATUS_CONFIG.candidato.label | badge de estado | Candidato | Candidato | Candidato | (igual) |
| No-Go | STATUS_CONFIG.no_go.label | badge de estado | No-Go | No-Go | No-Go | (igual) |
| Completado | STATUS_CONFIG.completado.label | badge de estado | Completado | Completado | Completado | (igual) |
| Impacto en KPI | DIMENSION_CONFIG.kpiImpact.label |  | Impacto en KPI | Impacto en KPI de Datos | Impacto en KPI | (igual) |
| Impacto estimado en los KPIs de negocio si se implementa. Mayor = más impacto directo y cuantificable. | DIMENSION_CONFIG.kpiImpact.description |  | Impacto estimado en los KPIs de negocio si se implementa. Mayor = más impacto directo y cuantificable. | Impacto estimado en los KPIs de gobierno del dato (calidad, disponibilidad, cumplimiento) si se implementa. Mayor = más impacto directo y cuantificable. | Impacto estimado en los KPIs de negocio si se implementa. Mayor = más impacto directo y cuantificable. | (igual) |
| Sin impacto | DIMENSION_CONFIG.kpiImpact.scaleLabels[0] |  | Sin impacto | Sin impacto | Sin impacto | (igual) |
| Marginal | DIMENSION_CONFIG.kpiImpact.scaleLabels[1] |  | Marginal | Marginal | Marginal | (igual) |
| Moderado | DIMENSION_CONFIG.kpiImpact.scaleLabels[2] |  | Moderado | Moderado | Moderado | (igual) |
| Alto | DIMENSION_CONFIG.kpiImpact.scaleLabels[3] |  | Alto | Alto | Alto | (igual) |
| Transformador | DIMENSION_CONFIG.kpiImpact.scaleLabels[4] |  | Transformador | Transformador | Transformador | (igual) |
| Facilidad de implementación | DIMENSION_CONFIG.feasibility.label |  | Facilidad de implementación | Facilidad de implementación | Facilidad de implementación | (igual) |
| Facilidad técnica, organizativa y de recursos para implementar. Mayor = más fácil y rápido. | DIMENSION_CONFIG.feasibility.description |  | Facilidad técnica, organizativa y de recursos para implementar. Mayor = más fácil y rápido. | Facilidad técnica, organizativa y de recursos de datos para implementar. Mayor = más fácil y rápido. | Facilidad técnica, organizativa y de recursos para implementar. Mayor = más fácil y rápido. | (igual) |
| Muy difícil | DIMENSION_CONFIG.feasibility.scaleLabels[0] |  | Muy difícil | Muy difícil | Muy difícil | (igual) |
| Difícil | DIMENSION_CONFIG.feasibility.scaleLabels[1] |  | Difícil | Difícil | Difícil | (igual) |
| Moderada | DIMENSION_CONFIG.feasibility.scaleLabels[2] |  | Moderada | Moderada | Moderada | (igual) |
| Fácil | DIMENSION_CONFIG.feasibility.scaleLabels[3] |  | Fácil | Fácil | Fácil | (igual) |
| Muy fácil | DIMENSION_CONFIG.feasibility.scaleLabels[4] |  | Muy fácil | Muy fácil | Muy fácil | (igual) |
| Riesgo IA / Regulatorio | DIMENSION_CONFIG.aiRisk.label |  | Riesgo IA / Regulatorio | Riesgo Regulatorio / RGPD | Riesgo Digital / Regulatorio | Riesgo regulatorio / operativo |
| Riesgo asociado al uso de IA (sesgos, regulación, privacidad, impacto en personas). Menor riesgo = mejor. | DIMENSION_CONFIG.aiRisk.description |  | Riesgo asociado al uso de IA (sesgos, regulación, privacidad, impacto en personas). Menor riesgo = mejor. | Riesgo asociado al tratamiento de datos (privacidad, RGPD, seguridad, calidad). Menor riesgo = mejor. | Riesgo asociado a la iniciativa digital (ciberseguridad, cumplimiento normativo, privacidad, impacto operativo). Menor riesgo = mejor. | Riesgo asociado a la iniciativa (ciberseguridad, cumplimiento normativo, privacidad, impacto operativo). Menor riesgo = mejor. |
| Muy bajo | DIMENSION_CONFIG.aiRisk.scaleLabels[0] |  | Muy bajo | Muy bajo | Muy bajo | (igual) |
| Bajo | DIMENSION_CONFIG.aiRisk.scaleLabels[1] |  | Bajo | Bajo | Bajo | (igual) |
| Moderado | DIMENSION_CONFIG.aiRisk.scaleLabels[2] |  | Moderado | Moderado | Moderado | (igual) |
| Alto | DIMENSION_CONFIG.aiRisk.scaleLabels[3] |  | Alto | Alto | Alto | (igual) |
| Crítico | DIMENSION_CONFIG.aiRisk.scaleLabels[4] |  | Crítico | Crítico | Crítico | (igual) |
| Dependencia de datos | DIMENSION_CONFIG.dataDependency.label |  | Dependencia de datos | Dependencia de Arquitectura de Datos | Dependencia de datos y sistemas | Dependencia de recursos e información |
| Grado en que el caso de uso depende de datos maduros, disponibles y de calidad. Menor dependencia bloqueante = mejor. | DIMENSION_CONFIG.dataDependency.description |  | Grado en que el caso de uso depende de datos maduros, disponibles y de calidad. Menor dependencia bloqueante = mejor. | Grado en que la iniciativa depende de una arquitectura y plataforma de datos maduras, disponibles y de calidad. Menor dependencia bloqueante = mejor. | Grado en que la iniciativa depende de datos y sistemas maduros, disponibles y de calidad. Menor dependencia bloqueante = mejor. | (igual) |
| Datos listos | DIMENSION_CONFIG.dataDependency.scaleLabels[0] |  | Datos listos | Datos listos | Datos y sistemas listos | Recursos e información listos |
| Mínima prep. | DIMENSION_CONFIG.dataDependency.scaleLabels[1] |  | Mínima prep. | Mínima prep. | Mínima prep. | (igual) |
| Moderada | DIMENSION_CONFIG.dataDependency.scaleLabels[2] |  | Moderada | Moderada | Moderada | (igual) |
| Alta | DIMENSION_CONFIG.dataDependency.scaleLabels[3] |  | Alta | Alta | Alta | (igual) |
| Bloqueante | DIMENSION_CONFIG.dataDependency.scaleLabels[4] |  | Bloqueante | Bloqueante | Bloqueante | (igual) |
| Recomendación: GO | getGoNoGoRecommendation(), caso 'go'.label |  | Recomendación: GO | Recomendación: GO | Recomendación: GO | (igual) |
| Score superior al umbral de prioridad. Este caso de uso tiene el perfil adecuado para iniciar implementación o piloto. | getGoNoGoRecommendation(), caso 'go'.description |  | Score superior al umbral de prioridad. Este caso de uso tiene el perfil adecuado para iniciar implementación o piloto. | Score superior al umbral de prioridad. Esta iniciativa de datos tiene el perfil adecuado para iniciar implementación o piloto. | Score superior al umbral de prioridad. Esta iniciativa digital tiene el perfil adecuado para iniciar implementación o piloto. | Score superior al umbral de prioridad. Esta iniciativa tiene el perfil adecuado para iniciar implementación o piloto. |
| Revisar en profundidad | getGoNoGoRecommendation(), caso 'pending'.label |  | Revisar en profundidad | Revisar en profundidad | Revisar en profundidad | (igual) |
| Score en zona gris. Requiere análisis adicional o mejora de alguna dimensión antes de tomar la decisión. | getGoNoGoRecommendation(), caso 'pending'.description |  | Score en zona gris. Requiere análisis adicional o mejora de alguna dimensión antes de tomar la decisión. | Score en zona gris. Requiere análisis adicional o mejora de alguna dimensión de gobierno del dato antes de tomar la decisión. | Score en zona gris. Requiere análisis adicional o mejora de alguna dimensión antes de tomar la decisión. | (igual) |
| Recomendación: NO-GO | getGoNoGoRecommendation(), caso 'no_go'.label |  | Recomendación: NO-GO | Recomendación: NO-GO | Recomendación: NO-GO | (igual) |
| Score inferior al umbral mínimo. No cumple criterios de priorización en el contexto actual. Revisar en próxima iteración. | getGoNoGoRecommendation(), caso 'no_go'.description |  | Score inferior al umbral mínimo. No cumple criterios de priorización en el contexto actual. Revisar en próxima iteración. | Score inferior al umbral mínimo. No cumple criterios de priorización de gobierno de datos en el contexto actual. Revisar en próxima iteración. | Score inferior al umbral mínimo. No cumple criterios de priorización en el contexto actual. Revisar en próxima iteración. | (igual) |
| IMPLEMENTAR YA | PRIORITY_QUADRANTS[0].text | etiqueta de cuadrante en matriz | IMPLEMENTAR YA | IMPLEMENTAR YA | IMPLEMENTAR YA | (igual) |
| PLANIFICAR | PRIORITY_QUADRANTS[1].text |  | PLANIFICAR | PLANIFICAR | PLANIFICAR | (igual) |
| QUICK WIN | PRIORITY_QUADRANTS[2].text |  | QUICK WIN | QUICK WIN | QUICK WIN | (igual) |
| REVISAR | PRIORITY_QUADRANTS[3].text |  | REVISAR | REVISAR | REVISAR | (igual) |
| Q2 2026 | ROADMAP_QUARTERS[0] | opción de quarter | Q2 2026 | Q2 2026 | Q2 2026 | (igual) |
| Q3 2026 | ROADMAP_QUARTERS[1] | opción de quarter | Q3 2026 | Q3 2026 | Q3 2026 | (igual) |
| Q4 2026 | ROADMAP_QUARTERS[2] | opción de quarter | Q4 2026 | Q4 2026 | Q4 2026 | (igual) |
| Q1 2027 | ROADMAP_QUARTERS[3] | opción de quarter | Q1 2027 | Q1 2027 | Q1 2027 | (igual) |
| Q2 2027 | ROADMAP_QUARTERS[4] | opción de quarter | Q2 2027 | Q2 2027 | Q2 2027 | (igual) |
| Q3 2027 | ROADMAP_QUARTERS[5] | opción de quarter | Q3 2027 | Q3 2027 | Q3 2027 | (igual) |
| Q4 2027 | ROADMAP_QUARTERS[6] | opción de quarter | Q4 2027 | Q4 2027 | Q4 2027 | (igual) |
| Automatización Inteligente | AI_CATEGORY_LABELS.automatizacion_inteligente |  | Automatización Inteligente | Calidad e Integridad del Dato | Automatización de Procesos | (igual) |
| Automatización RPA | AI_CATEGORY_LABELS.automatizacion_rpa |  | Automatización RPA | Automatización de Procesos de Datos | Automatización RPA | (igual) |
| Analítica Predictiva | AI_CATEGORY_LABELS.analitica_predictiva |  | Analítica Predictiva | Analítica y Reporting de Datos | Analítica de Datos y BI | (igual) |
| Asistente IA | AI_CATEGORY_LABELS.asistente_ia |  | Asistente IA | Catálogo y Asistente de Datos | Portal / Autoservicio Digital | (igual) |
| Optimización de Proceso | AI_CATEGORY_LABELS.optimizacion_proceso |  | Optimización de Proceso | Optimización de Arquitectura de Datos | Optimización de Proceso | (igual) |
| Agéntica IA | AI_CATEGORY_LABELS.agéntica |  | Agéntica IA | Gobernanza Ágil de Datos | Integración y Orquestación de Sistemas | (igual) |
| 15k – 60k € | IMPLEMENTATION_COST_BENCHMARKS.automatizacion_inteligente.label |  | 15k – 60k € | 15k – 60k € | 15k – 60k € | (igual) |
| 8k – 40k € | IMPLEMENTATION_COST_BENCHMARKS.automatizacion_rpa.label |  | 8k – 40k € | 8k – 40k € | 8k – 40k € | (igual) |
| 20k – 80k € | IMPLEMENTATION_COST_BENCHMARKS.analitica_predictiva.label |  | 20k – 80k € | 20k – 80k € | 20k – 80k € | (igual) |
| 5k – 25k € | IMPLEMENTATION_COST_BENCHMARKS.asistente_ia.label |  | 5k – 25k € | 5k – 25k € | 5k – 25k € | (igual) |
| 12k – 50k € | IMPLEMENTATION_COST_BENCHMARKS.optimizacion_proceso.label |  | 12k – 50k € | 12k – 50k € | 12k – 50k € | (igual) |
| 35k – 120k € | IMPLEMENTATION_COST_BENCHMARKS.agéntica.label |  | 35k – 120k € | 35k – 120k € | 35k – 120k € | (igual) |
| ~55% reducción de carga manual | EFFICIENCY_GAIN_BENCHMARKS.automatizacion_inteligente.label |  | ~55% reducción de carga manual | ~55% reducción de carga manual | ~55% reducción de carga manual | (igual) |
| ~70% reducción de carga manual | EFFICIENCY_GAIN_BENCHMARKS.automatizacion_rpa.label |  | ~70% reducción de carga manual | ~70% reducción de carga manual | ~70% reducción de carga manual | (igual) |
| ~30% mejora de velocidad decisional | EFFICIENCY_GAIN_BENCHMARKS.analitica_predictiva.label |  | ~30% mejora de velocidad decisional | ~30% mejora de velocidad decisional | ~30% mejora de velocidad decisional | (igual) |
| ~40% reducción de tiempo en tarea | EFFICIENCY_GAIN_BENCHMARKS.asistente_ia.label |  | ~40% reducción de tiempo en tarea | ~40% reducción de tiempo en tarea | ~40% reducción de tiempo en tarea | (igual) |
| ~35% reducción de ineficiencias | EFFICIENCY_GAIN_BENCHMARKS.optimizacion_proceso.label |  | ~35% reducción de ineficiencias | ~35% reducción de ineficiencias | ~35% reducción de ineficiencias | (igual) |
| ~65% reducción en procesos complejos multi-paso | EFFICIENCY_GAIN_BENCHMARKS.agéntica.label |  | ~65% reducción en procesos complejos multi-paso | ~65% reducción en procesos complejos multi-paso | ~65% reducción en procesos complejos multi-paso | (igual) |
| Administrativo | HOURLY_RATE_PRESETS.administrativo.label |  | Administrativo | Administrativo | Administrativo | (igual) |
| ~25 €/h · perfil backoffice, soporte, ops | HOURLY_RATE_PRESETS.administrativo.hint |  | ~25 €/h · perfil backoffice, soporte, ops | ~25 €/h · perfil backoffice, calidad de datos, ops | ~25 €/h · perfil backoffice, soporte, ops | (igual) |
| Técnico / Mando | HOURLY_RATE_PRESETS.tecnico.label |  | Técnico / Mando | Técnico / Mando | Técnico / Mando | (igual) |
| ~45 €/h · IT, analítica, product, RRHH, finanzas | HOURLY_RATE_PRESETS.tecnico.hint |  | ~45 €/h · IT, analítica, product, RRHH, finanzas | ~45 €/h · IT, analítica de datos, arquitectura, RRHH, finanzas | ~45 €/h · IT, analítica, product, RRHH, finanzas | (igual) |
| Directivo | HOURLY_RATE_PRESETS.directivo.label |  | Directivo | Directivo | Directivo | (igual) |
| ~90 €/h · C-level, directores de área | HOURLY_RATE_PRESETS.directivo.hint |  | ~90 €/h · C-level, directores de área | ~90 €/h · C-level, Chief Data Officer, directores de área | ~90 €/h · C-level, directores de área | (igual) |
 
## components/ImportFromT3Modal.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| T3 → T4 | eyebrow del header del modal |  | T3 → T4 | T3 → T4 | T3 → T4 | (igual) |
| Importar procesos desde T3 | título h2 del modal |  | Importar procesos desde T3 | Importar procesos de datos desde T3 | Importar procesos desde T3 | (igual) |
| Selecciona qué procesos del Value Stream Map pasan como candidatos al Priority Board. | subtítulo del modal |  | Selecciona qué procesos del mapa de flujo de valor (T3) pasan como candidatos al Priority Board. | Selecciona qué procesos del mapa de flujo de datos pasan como candidatos al Priority Board de gobierno de datos. | Selecciona qué procesos del Value Stream Map pasan como candidatos al Priority Board. | (igual) |
| ✕ | botón cerrar modal | header | ✕ | ✕ | ✕ | (igual) |
| {n} proceso(s) disponibles | contador de acciones rápidas | plural dinámico "proceso"/"procesos" | {n} proceso(s) disponibles | {n} proceso(s) disponibles | {n} proceso(s) disponibles | (igual) |
| Seleccionar todos | botón acción rápida |  | Seleccionar todos | Seleccionar todos | Seleccionar todos | (igual) |
| Limpiar | botón acción rápida | visible solo si hay selección | Limpiar | Limpiar | Limpiar | (igual) |
| Sin procesos en T3 | título estado vacío | sin procesos | Sin procesos en T3 | Sin procesos en T3 | Sin procesos en T3 | (igual) |
| Completa el Value Stream Map (T3) primero para poder importar procesos aquí. | descripción estado vacío |  | Completa el Value Stream Map (T3) primero para poder importar procesos aquí. | Completa el mapa de flujo de datos (T3) primero para poder importar procesos aquí. | Completa el Value Stream Map (T3) primero para poder importar procesos aquí. | (igual) |
| T3: {oppScore}/4 | badge de score T3 en tarjeta de proceso |  | T3: {oppScore}/4 | T3: {oppScore}/4 | T3: {oppScore}/4 | (igual) |
| → KPI inicial: | texto de preview del kpiImpact asignado |  | → KPI inicial: | → KPI de Datos inicial: | → KPI inicial: | (igual) |
| (desde T3 opp. score) | aclaración del preview de kpiImpact |  | (desde T3 opp. score) | (desde T3 opp. score) | (desde T3 opp. score) | (igual) |
| Ya importados | encabezado de sección de procesos ya importados |  | Ya importados | Ya importados | Ya importados | (igual) |
| Importado ✓ | badge de proceso ya importado |  | Importado ✓ | Importado ✓ | Importado ✓ | (igual) |
| {n} proceso(s) seleccionado(s) | contador del footer | plural dinámico | {n} proceso(s) seleccionado(s) | {n} proceso(s) seleccionado(s) | {n} proceso(s) seleccionado(s) | (igual) |
| Ningún proceso seleccionado | texto del footer cuando no hay selección |  | Ningún proceso seleccionado | Ningún proceso seleccionado | Ningún proceso seleccionado | (igual) |
| Cancelar | botón footer |  | Cancelar | Cancelar | Cancelar | (igual) |
| Importando… | texto del botón durante la importación |  | Importando… | Importando… | Importando… | (igual) |
| Importar {n} candidato(s) | texto del botón de importar | plural dinámico | Importar {n} candidato(s) | Importar {n} candidato(s) | Importar {n} candidato(s) | (igual) |
| {n} caso(s) de uso importado(s) | título de la pantalla de éxito |  | {n} caso(s) de uso importado(s) | {n} iniciativa(s) de datos importada(s) | {n} iniciativa(s) digital(es) importada(s) | (igual) |
| Los procesos aparecen ahora en el Priority Board con estado | texto de la pantalla de éxito | parte previa a la palabra en negrita | Los procesos aparecen ahora en el Priority Board con estado | Los procesos aparecen ahora en el Priority Board de gobierno de datos con estado | Los procesos aparecen ahora en el Priority Board con estado | (igual) |
| candidato | palabra en negrita dentro del mensaje de éxito |  | candidato | candidato | candidato | (igual) |
| Ajusta los scores en el taller para completar la priorización. | texto de la pantalla de éxito | parte final | Ajusta los scores en el taller para completar la priorización. | Ajusta los scores en el taller para completar la priorización de gobierno de datos. | Ajusta los scores en el taller para completar la priorización. | (igual) |
| Ver el Priority Board | botón de cierre de la pantalla de éxito |  | Ver el Priority Board | Ver el Priority Board | Ver el Priority Board | (igual) |
 
## T4View.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| Casos aprobados (GO) | label KPI box 1 |  | Casos aprobados (GO) | Iniciativas de datos aprobadas (GO) | Iniciativas aprobadas (GO) | (igual) |
| de {n} totales | subtexto KPI box 1 |  | de {n} totales | de {n} totales | de {n} totales | (igual) |
| Ahorro anual estimado | label KPI box 2 |  | Ahorro anual estimado | Ahorro anual estimado | Ahorro anual estimado | (igual) |
| {n} casos con datos económicos | subtexto KPI box 2 |  | {n} casos con datos económicos | {n} iniciativas con datos económicos | {n} iniciativas con datos económicos | (igual) |
| Payback promedio | label KPI box 3 |  | Payback promedio | Payback promedio | Payback promedio | (igual) |
| {n} meses | valor KPI box 3 | cuando hay dato | {n} meses | {n} meses | {n} meses | (igual) |
| — | valor KPI box 3 | placeholder sin dato | — | — | — | (igual) |
| recuperación de inversión | subtexto KPI box 3 |  | recuperación de inversión | recuperación de inversión | recuperación de inversión | (igual) |
| Pendientes de decisión | label KPI box 4 |  | Pendientes de decisión | Pendientes de decisión | Pendientes de decisión | (igual) |
| candidatos + priorizados | subtexto KPI box 4 |  | candidatos + priorizados | candidatos + priorizados | candidatos + priorizados | (igual) |
| Roadmap trimestral — distribución planificada | encabezado de sección |  | Roadmap trimestral — distribución planificada | Roadmap trimestral — distribución planificada | Roadmap trimestral — distribución planificada | (igual) |
| {n} caso(s) | contador de casos por quarter |  | {n} caso(s) | {n} caso(s) | {n} iniciativa(s) | (igual) |
| Sin casos asignados | texto de quarter vacío | línea punteada | Sin casos asignados | Sin casos asignados | Sin iniciativas asignadas | (igual) |
| {importe}/año · payback {n}m | resumen económico en tarjeta de caso dentro del roadmap |  | {importe}/año · payback {n}m | {importe}/año · payback {n}m | {importe}/año · payback {n}m | (igual) |
| Sin Q | etiqueta para casos sin quarter asignado |  | Sin Q | Sin Q | Sin Q | (igual) |
| FACILIDAD → | etiqueta eje X del gráfico |  | FACILIDAD → | FACILIDAD → | FACILIDAD → | (igual) |
| IMPACTO ↑ | etiqueta eje Y del gráfico |  | IMPACTO ↑ | IMPACTO ↑ | IMPACTO ↑ | (igual) |
| Facilidad | etiqueta en tooltip del punto | matriz | Facilidad | Facilidad | Facilidad | (igual) |
| Impacto KPI | etiqueta en tooltip del punto | matriz | Impacto KPI | Impacto KPI de Datos | Impacto KPI | (igual) |
| /100 | sufijo de unidad junto al valor del score | barras de visualización | /100 | /100 | /100 | (igual) |
| ↑ riesgo | sufijo añadido a la etiqueta de escala cuando la dimensión es negativa | barras | ↑ riesgo | ↑ riesgo | ↑ riesgo | (igual) |
| /100 | sufijo de unidad junto al valor del score | slider ScoreInput | /100 | /100 | /100 | (igual) |
| ↑ | sufijo añadido a la etiqueta de valor cuando la dimensión es negativa | slider ScoreInput | ↑ | ↑ | ↑ | (igual) |
| Ahorro anual estimado | label caja ROI 1 |  | Ahorro anual estimado | Ahorro anual estimado | Ahorro anual estimado | (igual) |
| {horas}h/sem × {personas} personas × {pct}% ef. | subtexto caja ROI 1 |  | {horas}h/sem × {personas} personas × {pct}% ef. | {horas}h/sem × {personas} personas × {pct}% ef. | {horas}h/sem × {personas} personas × {pct}% ef. | (igual) |
| Payback estimado | label caja ROI 2 |  | Payback estimado | Payback estimado | Payback estimado | (igual) |
| {n} meses | valor caja ROI 2 | cuando hay dato | {n} meses | {n} meses | {n} meses | (igual) |
| — | valor caja ROI 2 | placeholder sin dato | — | — | — | (igual) |
| {importe} inversión | subtexto caja ROI 2 |  | {importe} inversión | {importe} inversión | {importe} inversión | (igual) |
| ROI 3 años | label caja ROI 3 |  | ROI 3 años | ROI 3 años | ROI 3 años | (igual) |
| {n}% | valor caja ROI 3 | cuando hay dato | {n}% | {n}% | {n}% | (igual) |
| — | valor caja ROI 3 | placeholder sin dato | — | — | — | (igual) |
| {importe} beneficio neto | subtexto caja ROI 3 |  | {importe} beneficio neto | {importe} beneficio neto | {importe} beneficio neto | (igual) |
| Benchmark · {categoría} | eyebrow del bloque de contexto benchmark |  | Benchmark · {categoría} | Benchmark · {categoría} | Benchmark · {categoría} | (igual) |
| Coste de implementación | label dentro del bloque de benchmark |  | Coste de implementación | Coste de implementación | Coste de implementación | (igual) |
| Ganancia de eficiencia | label dentro del bloque de benchmark |  | Ganancia de eficiencia | Ganancia de eficiencia | Ganancia de eficiencia | (igual) |
| Datos del caso de uso | eyebrow de la sección de campos editables |  | Datos del caso de uso | Datos de la iniciativa | Datos de la iniciativa digital | Datos de la iniciativa |
| ✎ Editar | botón para activar edición |  | ✎ Editar | ✎ Editar | ✎ Editar | (igual) |
| Cancelar | botón cancelar edición |  | Cancelar | Cancelar | Cancelar | (igual) |
| Guardar | botón guardar edición |  | Guardar | Guardar | Guardar | (igual) |
| KPI principal a impactar | label del campo |  | KPI principal a impactar | KPI de Datos principal a impactar | KPI principal a impactar | (igual) |
| ej. Tiempo de resolución L1, Coste por contratación... | placeholder del campo KPI principal |  | ej. Tiempo de resolución L1, Coste por contratación… | ej. Tasa de calidad de datos, Tiempo de resolución de incidencias de datos... | ej. Tiempo de resolución L1, Coste por contratación... | (igual) |
| Sin definir | texto itálico cuando el campo KPI principal está vacío |  | Sin definir | Sin definir | Sin definir | (igual) |
| Horas/semana del proceso actual | label del campo |  | Horas/semana del proceso actual | Horas/semana del proceso actual | Horas/semana del proceso actual | (igual) |
| horas por semana | texto de unidad junto al input | modo edición | horas por semana | horas por semana | horas por semana | (igual) |
| h/semana | texto de unidad en modo visualización |  | h/semana | h/semana | h/semana | (igual) |
| Personas involucradas | label del campo |  | Personas involucradas | Personas involucradas | Personas involucradas | (igual) |
| personas | texto de unidad junto al input | modo edición | personas | personas | personas | (igual) |
| personas | texto de unidad en modo visualización |  | personas | personas | personas | (igual) |
| Ganancia de eficiencia | label del campo editable | segunda aparición, distinta del bloque benchmark | Ganancia de eficiencia | Ganancia de eficiencia | Ganancia de eficiencia | (igual) |
| benchmark | botón toggle de modo | ganancia de eficiencia | benchmark | benchmark | benchmark | (igual) |
| manual | botón toggle de modo | ganancia de eficiencia | manual | manual | manual | (igual) |
| % | símbolo de unidad junto al input de ganancia de eficiencia |  | % | % | % | (igual) |
| (benchmark) | nota inline cuando el modo activo es benchmark |  | (benchmark) | (benchmark) | (benchmark) | (igual) |
| benchmark | etiqueta de modo en modo visualización | ganancia de eficiencia | benchmark | benchmark | benchmark | (igual) |
| Coste/hora cargado | label del campo |  | Coste/hora cargado | Coste/hora cargado | Coste/hora cargado | (igual) |
| benchmark | botón toggle de modo | coste por hora, llamado "preset" en código pero label mostrado es el nombre del preset | benchmark | benchmark | benchmark | (igual) |
| manual | botón toggle de modo | coste por hora | manual | manual | manual | (igual) |
| € | símbolo de moneda junto al input manual de coste/hora |  | € | € | € | (igual) |
| /hora | texto de unidad junto al input manual de coste/hora |  | /hora | /hora | /hora | (igual) |
| Coste de implementación estimado | label del campo |  | Coste de implementación estimado | Coste de implementación estimado | Coste de implementación estimado | (igual) |
| benchmark | botón toggle de modo | coste de implementación | benchmark | benchmark | benchmark | (igual) |
| manual | botón toggle de modo | coste de implementación | manual | manual | manual | (igual) |
| € | símbolo de moneda junto al input de coste de implementación |  | € | € | € | (igual) |
| euros (coste total del proyecto) | texto de unidad junto al input de coste de implementación |  | euros (coste total del proyecto) | euros (coste total del proyecto) | euros (coste total del proyecto) | (igual) |
| Rango benchmark: {label} | nota inline con el rango benchmark | modo edición | Rango benchmark: {label} | Rango benchmark: {label} | Rango benchmark: {label} | (igual) |
| benchmark · rango: {label} | nota en modo visualización del coste de implementación |  | benchmark · rango: {label} | benchmark · rango: {label} | benchmark · rango: {label} | (igual) |
| Prohibido | AIACT_RISK_CONFIG.prohibido.label |  | Prohibido | Prohibido | Prohibido | (igual) |
| Alto riesgo | AIACT_RISK_CONFIG.alto.label |  | Alto riesgo | Alto riesgo | Alto riesgo | (igual) |
| Riesgo limitado | AIACT_RISK_CONFIG.limitado.label |  | Riesgo limitado | Riesgo limitado | Riesgo limitado | (igual) |
| Riesgo mínimo | AIACT_RISK_CONFIG.minimo.label |  | Riesgo mínimo | Riesgo mínimo | Riesgo mínimo | (igual) |
| Sin clasificar | AIACT_RISK_CONFIG.sin_clasificar.label |  | Sin clasificar | Sin clasificar | Sin clasificar | (igual) |
| RRHH — Selección, evaluación o formación de personas | AIACT_SCOPE_LABELS.rrhh |  | RRHH — Selección, evaluación o formación de personas | RRHH — Selección, evaluación o formación de personas | RRHH — Selección, evaluación o formación de personas | (igual) |
| Financiero — Crédito, scoring o seguros a clientes | AIACT_SCOPE_LABELS.financiero_clientes |  | Financiero — Crédito, scoring o seguros a clientes | Financiero — Crédito, scoring o seguros a clientes | Financiero — Crédito, scoring o seguros a clientes | (igual) |
| Salud o servicios sanitarios | AIACT_SCOPE_LABELS.salud |  | Salud o servicios sanitarios | Salud o servicios sanitarios | Salud o servicios sanitarios | (igual) |
| Infraestructura crítica (energía, transporte, agua) | AIACT_SCOPE_LABELS.infraestructura |  | Infraestructura crítica (energía, transporte, agua) | Infraestructura crítica (energía, transporte, agua) | Infraestructura crítica (energía, transporte, agua) | (igual) |
| Seguridad — Identificación o control de acceso | AIACT_SCOPE_LABELS.seguridad |  | Seguridad — Identificación o control de acceso | Seguridad — Identificación o control de acceso | Seguridad — Identificación o control de acceso | (igual) |
| Educación — Evaluación o acceso a formación | AIACT_SCOPE_LABELS.educacion |  | Educación — Evaluación o acceso a formación | Educación — Evaluación o acceso a formación | Educación — Evaluación o acceso a formación | (igual) |
| Administración pública o justicia | AIACT_SCOPE_LABELS.administracion |  | Administración pública o justicia | Administración pública o justicia | Administración pública o justicia | (igual) |
| Operaciones internas (back-office, procesos) | AIACT_SCOPE_LABELS.operaciones_internas |  | Operaciones internas (back-office, procesos) | Operaciones internas (back-office, procesos) | Operaciones internas (back-office, procesos) | (igual) |
| Atención al cliente, marketing o ventas | AIACT_SCOPE_LABELS.cliente_marketing |  | Atención al cliente, marketing o ventas | Atención al cliente, marketing o ventas | Atención al cliente, marketing o ventas | (igual) |
| AI Act | badge de cabecera del modal |  | AI Act | RGPD / DAMA-DMBOK | Cumplimiento Normativo TI | Cumplimiento Normativo |
| Clasificación regulatoria | eyebrow de cabecera del modal |  | Clasificación regulatoria | Clasificación de Gobernanza y Cumplimiento del Dato | Clasificación regulatoria | (igual) |
| Responde 4 preguntas para clasificar el riesgo regulatorio de este caso de uso. | subtítulo del modal |  | Responde estas 4 preguntas para clasificar el riesgo regulatorio de este caso de uso. | Responde 4 preguntas para clasificar el riesgo regulatorio de esta iniciativa según RGPD y DAMA-DMBOK / ISO/IEC 38505. | Responde 4 preguntas para clasificar el riesgo regulatorio de esta iniciativa digital según DORA, NIS2, GDPR e ISO 27001. | Responde 4 preguntas para clasificar el riesgo regulatorio de esta iniciativa según el marco normativo o contractual aplicable. |
| ✕ | botón cerrar modal |  | ✕ | ✕ | ✕ | (igual) |
| P1 · ¿En qué ámbito opera este sistema? | pregunta 1 |  | P1 · ¿En qué ámbito opera este sistema? | P1 · ¿En qué ámbito opera este tratamiento de datos? | P1 · ¿En qué ámbito opera este sistema? | (igual) |
| El sector determina si aplica el Anexo III del AI Act (alto riesgo automático). | ayuda pregunta 1 |  | El sector determina si aplica el Anexo III del AI Act (alto riesgo automático). | El sector determina si aplican obligaciones reforzadas de gobierno de datos (categorías especiales, alto riesgo). | El sector determina qué marco regulatorio aplica (DORA para entidades financieras, NIS2 para infraestructura crítica y esenciales, GDPR si hay datos personales). | El sector determina qué marco regulatorio aplica (el marco normativo o contractual específico del sector de la iniciativa). |
| P2 · ¿El sistema toma decisiones que afectan a personas físicas? | pregunta 2 |  | P2 · ¿El sistema toma decisiones que afectan a personas físicas? | P2 · ¿El tratamiento de datos afecta a decisiones sobre personas físicas? | P2 · ¿El sistema toma decisiones que afectan a personas físicas? | (igual) |
| No incluye decisiones sobre procesos o datos agregados de la empresa. | ayuda pregunta 2 |  | No incluye decisiones sobre procesos o datos agregados de la empresa. | No incluye decisiones sobre procesos o datos agregados de la empresa. | No incluye decisiones sobre procesos o datos agregados de la empresa. | (igual) |
| No — opera sobre procesos o datos internos de la empresa | opción pregunta 2 |  | No — opera sobre procesos o datos internos de la empresa | No — opera sobre procesos o datos internos de la empresa | No — opera sobre procesos o datos internos de la empresa | (igual) |
| Sí — pero un humano revisa y aprueba cada decisión antes de aplicarla | opción pregunta 2 |  | Sí — pero un humano revisa y aprueba cada decisión antes de aplicarla | Sí — pero un humano revisa y aprueba cada decisión antes de aplicarla | Sí — pero un humano revisa y aprueba cada decisión antes de aplicarla | (igual) |
| Sí — de forma autónoma o con supervisión mínima | opción pregunta 2 |  | Sí — de forma autónoma o con supervisión mínima | Sí — de forma autónoma o con supervisión mínima | Sí — de forma autónoma o con supervisión mínima | (igual) |
| P3 · ¿Utiliza o procesa datos de salud, biométricos, religión, origen étnico o datos sexuales? | pregunta 3 |  | P3 · ¿Utiliza o procesa datos de salud, biométricos, religión, origen étnico o datos sexuales? | P3 · ¿Utiliza o procesa datos de salud, biométricos, religión, origen étnico o datos sexuales? | P3 · ¿Utiliza o procesa datos de salud, biométricos, religión, origen étnico o datos sexuales? | (igual) |
| Categorías especiales RGPD Art. 9 y datos biométricos identificativos. | ayuda pregunta 3 |  | Categorías especiales RGPD Art. 9 y datos biométricos identificativos. | Categorías especiales RGPD Art. 9 y datos biométricos identificativos. | Categorías especiales RGPD Art. 9 y datos biométricos identificativos. | (igual) |
| No | opción pregunta 3 |  | No | No | No | (igual) |
| Sí | opción pregunta 3 |  | Sí | Sí | Sí | (igual) |
| P4 · ¿El output del sistema es explicable o trazable para el usuario afectado? | pregunta 4 |  | P4 · ¿El output del sistema es explicable o trazable para el usuario afectado? | P4 · ¿El tratamiento de datos es explicable o trazable (linaje de datos) para el usuario afectado? | P4 · ¿El sistema es explicable, auditable y trazable para el usuario afectado? | (igual) |
| El sistema puede justificar por qué tomó una decisión o recomendación concreta. | ayuda pregunta 4 |  | El sistema puede justificar por qué tomó una decisión o recomendación concreta. | El sistema puede justificar y trazar el linaje del dato que sustenta una decisión o recomendación concreta. | El sistema puede justificar y documentar por qué tomó una decisión o acción concreta. | (igual) |
| Sí — hay trazabilidad o explicación disponible | opción pregunta 4 |  | Sí — hay trazabilidad o explicación disponible | Sí — hay trazabilidad o explicación disponible | Sí — hay trazabilidad o explicación disponible | (igual) |
| No — el output es opaco o no se comunica | opción pregunta 4 |  | No — el output es opaco o no se comunica | No — el output es opaco o no se comunica | No — el output es opaco o no se comunica | (igual) |
| Clasificación resultante | eyebrow del preview de resultado |  | Clasificación resultante | Clasificación resultante | Clasificación resultante | (igual) |
| ⚠️ Este sistema puede caer en la categoría de uso prohibido por el AI Act (Art. 5). Revisa con el equipo legal antes de proceder. | aviso cuando el resultado es "prohibido" |  | ⚠️ Este sistema puede caer en la categoría de uso prohibido por el AI Act (Art. 5). Revisa con el equipo legal antes de proceder. | ⚠️ Este tratamiento de datos puede caer en la categoría de uso prohibido por el RGPD (Art. 9). Revisa con el equipo legal antes de proceder. | ⚠️ Este sistema puede caer en la categoría de uso prohibido o de alto riesgo regulatorio (DORA/NIS2/GDPR). Revisa con el equipo legal y de cumplimiento antes de proceder. | ⚠️ Este sistema puede caer en la categoría de uso prohibido o de alto riesgo regulatorio (el marco normativo aplicable). Revisa con el equipo legal y de cumplimiento antes de proceder. |
| Requiere conformidad con el Anexo III del AI Act antes de despliegue. Documenta controles y supervisión humana. | aviso cuando el resultado es "alto" |  | Requiere conformidad con el Anexo III del AI Act antes de despliegue. Documenta controles y supervisión humana. | Requiere evaluación de impacto de protección de datos (EIPD) antes de despliegue. Documenta controles y supervisión humana. | Requiere evaluación de conformidad antes de despliegue (ISO 27001 / COBIT 2019). Documenta controles y supervisión operativa. | Requiere evaluación de conformidad antes de despliegue (los estándares de gestión aplicables). Documenta controles y supervisión operativa. |
| Cancelar | botón footer del modal |  | Cancelar | Cancelar | Cancelar | (igual) |
| Guardar clasificación | botón footer del modal |  | Guardar clasificación | Guardar clasificación | Guardar clasificación | (igual) |
| Impacto en KPIs | dimensión de la recomendación 1 |  | Impacto en KPIs | Impacto en KPIs de Datos | Impacto en KPIs | (igual) |
| Score KPI bajo ({n}/100). El caso no tiene aún un beneficio cuantificado que justifique la inversión. | mensaje recomendación 1 |  | Score KPI bajo ({n}/100). El caso no tiene aún un beneficio cuantificado que justifique la inversión. | Score KPI bajo ({n}/100). La iniciativa no tiene aún un beneficio cuantificado en calidad o gobierno del dato que justifique la inversión. | Score KPI bajo ({n}/100). La iniciativa no tiene aún un beneficio cuantificado que justifique la inversión. | (igual) |
| Cuantifica el impacto con el business sponsor: define el KPI objetivo, el baseline actual y el delta esperado en el sprint. | acción recomendación 1 |  | Cuantifica el impacto con el business sponsor: define el KPI objetivo, el baseline actual y el delta esperado en el sprint. | Cuantifica el impacto con el data owner: define el KPI de calidad de datos objetivo, el baseline actual y el delta esperado en el sprint. | Cuantifica el impacto con el business sponsor: define el KPI objetivo, el baseline actual y el delta esperado en el sprint. | (igual) |
| Viabilidad técnica | dimensión de la recomendación 2 |  | Viabilidad técnica | Viabilidad técnica | Viabilidad técnica | (igual) |
| Score de facilidad bajo ({n}/100). El caso puede ser difícil de implementar en el plazo del sprint. | mensaje recomendación 2 |  | Score de facilidad bajo ({n}/100). El caso puede ser difícil de implementar en el plazo del sprint. | Score de facilidad bajo ({n}/100). La iniciativa puede ser difícil de implementar en el plazo del sprint dada la madurez de la arquitectura de datos. | Score de facilidad bajo ({n}/100). La iniciativa puede ser difícil de implementar en el plazo del sprint. | (igual) |
| Reduce el alcance a un MVP acotado e identifica los bloqueantes técnicos concretos antes de priorizar. | acción recomendación 2 |  | Reduce el alcance a un MVP acotado e identifica los bloqueantes técnicos concretos antes de priorizar. | Reduce el alcance a un MVP acotado e identifica los bloqueantes de arquitectura de datos concretos antes de priorizar. | Reduce el alcance a un MVP acotado e identifica los bloqueantes técnicos concretos antes de priorizar. | (igual) |
| Riesgo de IA | dimensión de la recomendación 3 |  | Riesgo de IA | Riesgo Regulatorio | Riesgo Digital / Regulatorio | Riesgo regulatorio / operativo |
| Riesgo IA elevado ({n}/100). Penaliza el score compuesto y puede comprometer la adopción interna. | mensaje recomendación 3 |  | Riesgo IA elevado ({n}/100). Penaliza el score compuesto y puede comprometer la adopción interna. | Riesgo RGPD elevado ({n}/100). Penaliza el score compuesto y puede comprometer la adopción interna y el cumplimiento. | Riesgo regulatorio elevado ({n}/100). Penaliza el score compuesto y puede comprometer la adopción interna. | (igual) |
| Realiza la clasificación según el AI Act, documenta el plan de mitigación y considera mantener un humano en el loop. | acción recomendación 3 |  | Realiza la clasificación según el AI Act, documenta el plan de mitigación y considera mantener un humano en el loop. | Realiza la clasificación según RGPD / DAMA-DMBOK, documenta el plan de mitigación y considera mantener un data steward en el loop. | Realiza la clasificación según DORA/NIS2/GDPR/ISO 27001, documenta el plan de mitigación y define responsables de supervisión operativa. | Realiza la clasificación según el marco normativo aplicable, documenta el plan de mitigación y define responsables de supervisión operativa. |
| Dependencia de datos | dimensión de la recomendación 4 |  | Dependencia de datos | Dependencia de Arquitectura de Datos | Dependencia de datos y sistemas | Dependencia de recursos e información |
| Madurez de datos baja ({n}/100). Sin datos suficientes el modelo no puede entrenarse ni validarse. | mensaje recomendación 4 |  | Madurez de datos baja ({n}/100). Sin datos suficientes el modelo no puede entrenarse ni validarse. | Madurez de arquitectura de datos baja ({n}/100). Sin una plataforma de datos suficiente la iniciativa no puede validarse ni escalar. | Madurez de datos y sistemas baja ({n}/100). Sin datos e integraciones suficientes la iniciativa no puede validarse. | Madurez de recursos e información baja ({n}/100). Sin recursos e información suficientes la iniciativa no puede validarse. |
| Audita las fuentes de datos disponibles, evalúa datos sintéticos como puente y define el mínimo viable de calidad. | acción recomendación 4 |  | Audita las fuentes de datos disponibles, evalúa datos sintéticos como puente y define el mínimo viable de calidad. | Audita las fuentes de datos disponibles, evalúa datos sintéticos como puente y define el mínimo viable de calidad de datos. | Audita las fuentes de datos y sistemas disponibles, evalúa integraciones puente y define el mínimo viable de calidad. | (igual) |
| Score compuesto — NO-GO | dimensión de la recomendación 5 |  | Score compuesto — NO-GO | Score compuesto — NO-GO | Score compuesto — NO-GO | (igual) |
| Score total ({n}) por debajo del umbral mínimo de {n}. | mensaje recomendación 5 |  | Score total ({n}) por debajo del umbral mínimo de {n}. | Score total ({n}) por debajo del umbral mínimo de {n}. | Score total ({n}) por debajo del umbral mínimo de {n}. | (igual) |
| Considera fusionar este caso con uno de mayor score o moverlo al backlog inactivo hasta que las condiciones mejoren. | acción recomendación 5 |  | Considera fusionar este caso con uno de mayor score o moverlo al backlog inactivo hasta que las condiciones mejoren. | Considera fusionar esta iniciativa con una de mayor score o moverla al backlog inactivo hasta que las condiciones de gobierno de datos mejoren. | Considera fusionar esta iniciativa con una de mayor score o moverla al backlog inactivo hasta que las condiciones mejoren. | (igual) |
| Acciones recomendadas · {n} alerta(s) | encabezado del bloque de recomendaciones | singular/plural dinámico | Acciones recomendadas · {n} alerta(s) | Acciones recomendadas · {n} alerta(s) | Acciones recomendadas · {n} alerta(s) | (igual) |
| · Importado desde T3 | texto añadido al eyebrow cuando el caso viene de T3 |  | · Importado desde T3 | · Importado desde T3 | · Importado desde T3 | (igual) |
| Scoring | nombre de tab |  | Scoring | Scoring | Scoring | (igual) |
| Economía | nombre de tab |  | Economía | Economía | Economía | (igual) |
| Hoja de ruta | nombre de tab |  | Hoja de ruta | Hoja de ruta | Hoja de ruta | (igual) |
| Contexto T1/T2 | nombre de tab |  | Contexto T1/T2 | Contexto T1/T2 | Contexto T1/T2 | (igual) |
| ⚖️ AI Act | nombre de tab (regulatorio), prefijo antes de anexar el nivel de riesgo |  | ⚖️ AI Act | ⚖️ RGPD / DAMA | ⚖️ Cumplimiento TI | ⚖️ Cumplimiento |
| Score | eyebrow del score hero |  | Score | Score | Score | (igual) |
| /100 | sufijo del score hero |  | /100 | /100 | /100 | (igual) |
| Posición en la matriz de prioridad | eyebrow de la matriz |  | Posición en la matriz de prioridad | Posición en la matriz de prioridad | Posición en la matriz de prioridad | (igual) |
| Dimensiones de scoring | eyebrow de la sección de scores |  | Dimensiones de scoring | Dimensiones de scoring | Dimensiones de scoring | (igual) |
| ✎ Editar scores | botón activar edición de scores |  | ✎ Editar scores | ✎ Editar scores | ✎ Editar scores | (igual) |
| Cancelar | botón cancelar edición de scores |  | Cancelar | Cancelar | Cancelar | (igual) |
| Guardar | botón guardar edición de scores |  | Guardar | Guardar | Guardar | (igual) |
| Score compuesto · ponderado | eyebrow de la caja de score compuesto |  | Score compuesto · ponderado | Score compuesto · ponderado | Score compuesto · ponderado | (igual) |
| /100 | sufijo del valor de score compuesto |  | /100 | /100 | /100 | (igual) |
| KPI 35% · facilidad 30% · riesgo IA 20% · dep. datos 15% | texto explicativo de ponderación |  | KPI 35% · facilidad 30% · riesgo IA 20% · dep. datos 15% | KPI Datos 35% · facilidad 30% · riesgo regulatorio 20% · dep. arquitectura 15% | KPI 35% · facilidad 30% · riesgo regulatorio 20% · dep. datos/sistemas 15% | KPI 35% · facilidad 30% · riesgo regulatorio 20% · dep. recursos/información 15% |
| Umbral GO ≥ {n} · Revisar ≥ {n} · NO-GO < {n} | texto explicativo de umbrales |  | Umbral GO ≥ {n} · Revisar ≥ {n} · NO-GO < {n} | Umbral GO ≥ {n} · Revisar ≥ {n} · NO-GO < {n} | Umbral GO ≥ {n} · Revisar ≥ {n} · NO-GO < {n} | (igual) |
| Ajusta los scores del taller (0 = mínimo, 100 = máximo). Para riesgo y dependencia de datos, valores altos indican mayor riesgo/dependencia. | instrucción en modo edición |  | Ajusta los scores del taller (0 = mínimo, 100 = máximo). Para riesgo y dependencia de datos, valores altos indican mayor riesgo/dependencia. | Ajusta los scores del taller (0 = mínimo, 100 = máximo). Para riesgo y dependencia de arquitectura, valores altos indican mayor riesgo/dependencia. | Ajusta los scores del taller (0 = mínimo, 100 = máximo). Para riesgo y dependencia de datos, valores altos indican mayor riesgo/dependencia. | (igual) |
| Mayor valor = mayor impacto en KPIs de negocio | descripción del slider Impacto en KPI |  | Mayor valor = mayor impacto en KPIs de negocio | Mayor valor = mayor impacto en KPIs de gobierno de datos | Mayor valor = mayor impacto en KPIs de negocio | (igual) |
| Mayor valor = más fácil de implementar | descripción del slider Facilidad |  | Mayor valor = más fácil de implementar | Mayor valor = más fácil de implementar | Mayor valor = más fácil de implementar | (igual) |
| Mayor valor = mayor riesgo (peor para el score) | descripción del slider Riesgo IA |  | Mayor valor = mayor riesgo (peor para el score) | Mayor valor = mayor riesgo regulatorio (peor para el score) | Mayor valor = mayor riesgo (peor para el score) | (igual) |
| Mayor valor = mayor dependencia bloqueante (peor) | descripción del slider Dependencia de datos |  | Mayor valor = mayor dependencia bloqueante (peor) | Mayor valor = mayor dependencia bloqueante de arquitectura de datos (peor) | Mayor valor = mayor dependencia bloqueante (peor) | (igual) |
| Preview score | label de la caja de previsualización del score en edición |  | Preview score | Preview score | Preview score | (igual) |
| /100 | sufijo del preview score |  | /100 | /100 | /100 | (igual) |
| Scores por stakeholder | eyebrow de la lista de scores individuales |  | Scores por stakeholder | Scores por stakeholder | Scores por stakeholder | (igual) |
| Decisión go/no-go | eyebrow del bloque de decisión |  | Decisión go/no-go | Decisión go/no-go | Decisión go/no-go | (igual) |
| ✓ GO | texto de decisión "go" |  | ✓ GO | ✓ GO | ✓ GO | (igual) |
| ✕ NO-GO | texto de decisión "no_go" |  | ✕ NO-GO | ✕ NO-GO | ✕ NO-GO | (igual) |
| ◎ PENDIENTE | texto de decisión "pending" |  | ◎ PENDIENTE | ◎ PENDIENTE | ◎ PENDIENTE | (igual) |
| Sin clasificación AI Act | título estado vacío |  | Sin clasificación AI Act | Sin clasificación RGPD / DAMA | Sin clasificación de cumplimiento | (igual) |
| Clasifica este caso de uso para evaluar su nivel de riesgo regulatorio según el EU AI Act y el RGPD. | descripción estado vacío |  | Clasifica este caso de uso para evaluar su nivel de riesgo regulatorio según el EU AI Act y el RGPD. | Clasifica esta iniciativa de datos para evaluar su nivel de riesgo regulatorio según el RGPD y el marco DAMA-DMBOK / ISO/IEC 38505. | Clasifica esta iniciativa digital para evaluar su nivel de riesgo regulatorio según DORA, NIS2, GDPR e ISO 27001. | Clasifica esta iniciativa para evaluar su nivel de riesgo regulatorio según el marco normativo o contractual aplicable. |
| Clasificar ahora | botón estado vacío |  | Clasificar ahora | Clasificar ahora | Clasificar ahora | (igual) |
| Nivel de riesgo EU AI Act | eyebrow del resultado principal |  | Nivel de riesgo EU AI Act | Nivel de riesgo RGPD / Gobierno de Datos | Nivel de riesgo regulatorio TI | (igual) |
| Clasificado el {fecha} | texto de fecha de clasificación |  | Clasificado el {fecha} | Clasificado el {fecha} | Clasificado el {fecha} | (igual) |
| Reclasificar | botón para reabrir el modal |  | Reclasificar | Reclasificar | Reclasificar | (igual) |
| Respuestas del cuestionario | eyebrow del bloque de respuestas |  | Respuestas del cuestionario | Respuestas del cuestionario | Respuestas del cuestionario | (igual) |
| P1 · Ámbito | label de respuesta P1 |  | P1 · Ámbito | P1 · Ámbito | P1 · Ámbito | (igual) |
| P2 · Impacto en personas | label de respuesta P2 |  | P2 · Impacto en personas | P2 · Impacto en personas | P2 · Impacto en personas | (igual) |
| No afecta a personas físicas | valor de respuesta P2 | personImpact 'no' | No afecta a personas físicas | No afecta a personas físicas | No afecta a personas físicas | (igual) |
| Sí, con revisión humana | valor de respuesta P2 | personImpact 'human_review' | Sí, con revisión humana | Sí, con revisión humana | Sí, con revisión humana | (igual) |
| Sí, de forma autónoma | valor de respuesta P2 | personImpact 'autonomous' | Sí, de forma autónoma | Sí, de forma autónoma | Sí, de forma autónoma | (igual) |
| P3 · Datos sensibles | label de respuesta P3 |  | P3 · Datos sensibles | P3 · Datos sensibles | P3 · Datos sensibles | (igual) |
| ⚠️ Sí — datos RGPD Art. 9 | valor de respuesta P3 | sensitiveData true | ⚠️ Sí — datos RGPD Art. 9 | ⚠️ Sí — datos RGPD Art. 9 | ⚠️ Sí — datos RGPD Art. 9 | (igual) |
| ✓ No | valor de respuesta P3 | sensitiveData false | ✓ No | ✓ No | ✓ No | (igual) |
| P4 · Explicabilidad | label de respuesta P4 |  | P4 · Explicabilidad | P4 · Explicabilidad / Trazabilidad | P4 · Explicabilidad | (igual) |
| ✓ Sistema explicable / trazable | valor de respuesta P4 | explainability 'yes' | ✓ Sistema explicable / trazable | ✓ Tratamiento explicable / trazable | ✓ Sistema explicable / trazable | (igual) |
| ✕ Output opaco | valor de respuesta P4 | explainability 'no' | ✕ Output opaco | ✕ Output opaco | ✕ Output opaco | (igual) |
| Obligaciones regulatorias aplicables | eyebrow del bloque de obligaciones |  | Obligaciones regulatorias aplicables | Obligaciones regulatorias aplicables | Obligaciones regulatorias aplicables | (igual) |
| 🚫 Sistema potencialmente prohibido — Art. 5 AI Act | título aviso para nivel "prohibido" |  | 🚫 Sistema potencialmente prohibido — Art. 5 AI Act | 🚫 Tratamiento potencialmente prohibido — RGPD Art. 9 | 🚫 Sistema potencialmente en incumplimiento crítico — DORA / NIS2 / GDPR | 🚫 Sistema potencialmente en incumplimiento crítico — el marco normativo aplicable |
| Detener el desarrollo e iniciar revisión legal inmediata. Este sistema puede infringir el artículo 5 del AI Act si se despliega. | texto aviso para nivel "prohibido" |  | Detener el desarrollo e iniciar revisión legal inmediata. Este sistema puede infringir el artículo 5 del AI Act si se despliega. | Detener el tratamiento e iniciar revisión legal inmediata. Este tratamiento puede infringir el artículo 9 del RGPD si se despliega. | Detener el desarrollo e iniciar revisión legal y de cumplimiento inmediata. Este sistema puede infringir DORA, NIS2 o GDPR si se despliega. | Detener el desarrollo e iniciar revisión legal y de cumplimiento inmediata. Este sistema puede infringir el marco normativo aplicable si se despliega. |
| Evaluación de conformidad antes del despliegue (Annex III) | obligación 1 | nivel "alto" | Evaluación de conformidad antes del despliegue (Annex III) | Evaluación de impacto de protección de datos (EIPD) antes del despliegue | Evaluación de conformidad antes del despliegue (ISO 27001 / COBIT 2019) | Evaluación de conformidad antes del despliegue (los estándares de gestión aplicables) |
| Sistema de gestión de riesgos documentado | obligación 2 | nivel "alto" | Sistema de gestión de riesgos documentado | Sistema de gestión de riesgos de datos documentado | Sistema de gestión de riesgos documentado (ISO 27001 / ITIL4) | Sistema de gestión de riesgos documentado (los estándares de gestión aplicables) |
| Datos de entrenamiento y gobernanza documentados | obligación 3 | nivel "alto" | Datos de entrenamiento y gobernanza documentados | Datos de entrenamiento y gobernanza del dato documentados (linaje, calidad) | Datos y gobernanza de sistemas documentados (COBIT 2019) | Datos y gobernanza de sistemas documentados (estándares de gestión aplicables) |
| Registro en la base de datos EU de sistemas de alto riesgo | obligación 4 | nivel "alto" | Registro en la base de datos EU de sistemas de alto riesgo | Registro de actividades de tratamiento (RAT) actualizado | Registro en el inventario corporativo de sistemas críticos | (igual) |
| Supervisión humana obligatoria definida y operativa | obligación 5 | nivel "alto" | Supervisión humana obligatoria definida y operativa | Supervisión humana obligatoria definida y operativa | Supervisión operativa obligatoria definida y operativa (ITIL4) | Supervisión operativa obligatoria definida y operativa (estándares de gestión aplicables) |
| Transparencia hacia usuarios afectados | obligación 6 | nivel "alto" | Transparencia hacia usuarios afectados | Transparencia hacia los interesados (data subjects) | Transparencia hacia usuarios afectados | (igual) |
| Obligación de transparencia hacia los usuarios (Art. 50) | obligación 1 | nivel "limitado" | Obligación de transparencia hacia los usuarios (Art. 50) | Obligación de transparencia hacia los interesados (Art. 13-14 RGPD) | Obligación de transparencia hacia los usuarios (GDPR) | Obligación de transparencia hacia los usuarios (el marco normativo aplicable) |
| Indicar que el contenido es generado por IA si aplica | obligación 2 | nivel "limitado" | Indicar que el contenido es generado por IA si aplica | Indicar la base legal del tratamiento si aplica | Indicar cambios relevantes en el servicio si aplica | (igual) |
| Política de uso aceptable documentada | obligación 3 | nivel "limitado" | Política de uso aceptable documentada | Política de uso aceptable de datos documentada | Política de uso aceptable documentada | (igual) |
| ✓ Sin obligaciones regulatorias específicas del AI Act. Se recomienda documentar el uso en el catálogo corporativo de IA como buena práctica de gobernanza. | texto para nivel "mínimo" |  | ✓ Sin obligaciones regulatorias específicas del AI Act. Se recomienda documentar el uso en el catálogo corporativo de IA como buena práctica de gobernanza. | ✓ Sin obligaciones regulatorias específicas adicionales. Se recomienda documentar el tratamiento en el catálogo corporativo de datos como buena práctica de gobernanza. | ✓ Sin obligaciones regulatorias específicas. Se recomienda documentar la iniciativa en el catálogo corporativo de TI como buena práctica de gobernanza (COBIT 2019). | ✓ Sin obligaciones regulatorias específicas. Se recomienda documentar la iniciativa en el catálogo corporativo de iniciativas como buena práctica de gobernanza (estándares de gestión aplicables). |
| Quarter de implementación | eyebrow de la sección |  | Quarter de implementación | Quarter de implementación | Quarter de implementación | (igual) |
| Click en el quarter activo para quitar la asignación. | nota de ayuda | visible cuando hay quarter asignado | Click en el quarter activo para quitar la asignación. | Click en el quarter activo para quitar la asignación. | Click en el quarter activo para quitar la asignación. | (igual) |
| Duración estimada | label del campo |  | Duración estimada | Duración estimada | Duración estimada | (igual) |
| ej. 6 semanas, 3 meses… | placeholder del campo duración |  | ej. 6 semanas, 3 meses… | ej. 6 semanas, 3 meses… | ej. 6 semanas, 3 meses… | (igual) |
| Fecha de inicio | label del campo |  | Fecha de inicio | Fecha de inicio | Fecha de inicio | (igual) |
| Si se especifica, tiene prioridad sobre el quarter en el Roadmap T9. | nota de ayuda del campo fecha de inicio |  | Si se especifica, tiene prioridad sobre el quarter en el Roadmap T9. | Si se especifica, tiene prioridad sobre el quarter en el Roadmap T9. | Si se especifica, tiene prioridad sobre el quarter en el Roadmap T9. | (igual) |
| Fecha de fin | label del campo |  | Fecha de fin | Fecha de fin | Fecha de fin | (igual) |
| Responsable de implementación | label del campo |  | Responsable de implementación | Responsable de implementación | Responsable de implementación | (igual) |
| Nombre o rol responsable… | placeholder del campo responsable |  | Nombre o rol responsable… | Nombre o rol responsable… | Nombre o rol responsable… | (igual) |
| Próximos pasos | label del campo |  | Próximos pasos | Próximos pasos | Próximos pasos | (igual) |
| Acciones concretas para arrancar este caso de uso… | placeholder del campo próximos pasos |  | Acciones concretas para arrancar este caso de uso… | Acciones concretas para arrancar esta iniciativa de datos… | Acciones concretas para arrancar esta iniciativa digital… | Acciones concretas para arrancar esta iniciativa… |
| Dependencias | label del campo |  | Dependencias | Dependencias | Dependencias | (igual) |
| Dependencias con otros casos de uso, sistemas o equipos… | placeholder del campo dependencias |  | Dependencias con otros casos de uso, sistemas o equipos… | Dependencias con otras iniciativas de datos, sistemas o equipos… | Dependencias con otras iniciativas, sistemas o equipos… | (igual) |
| Notas del consultor | eyebrow del bloque de notas | solo lectura | Notas del consultor | Notas del consultor | Notas del consultor | (igual) |
| T1 | badge identificador del bloque T1 |  | T1 | T1 | T1 | (igual) |
| Contexto de madurez IA (T1) | título del bloque T1 |  | Contexto de madurez IA (T1) | Contexto de madurez de datos (T1) | Contexto de madurez digital (T1) | Contexto de madurez (T1) |
| Dimensiones relevantes | label de la lista de dimensiones T1 | cuando hay t1Context manual | Dimensiones relevantes | Dimensiones relevantes | Dimensiones relevantes | (igual) |
| Auto-calculado desde T1 · {n} dimensiones evaluadas | nota de auto-cálculo T1 |  | Auto-calculado desde T1 · {n} dimensiones evaluadas | Auto-calculado desde T1 · {n} dimensiones evaluadas | Auto-calculado desde T1 · {n} dimensiones evaluadas | (igual) |
| Dimensiones con madurez baja (≤2) | label de dimensiones débiles auto-calculadas |  | Dimensiones con madurez baja (≤2) | Dimensiones con madurez baja (≤2) | Dimensiones con madurez baja (≤2) | (igual) |
| ✓ Madurez IA suficiente en todas las dimensiones | texto cuando no hay dimensiones débiles |  | ✓ Madurez IA suficiente en todas las dimensiones | ✓ Madurez de datos suficiente en todas las dimensiones | ✓ Madurez digital suficiente en todas las dimensiones | ✓ Madurez suficiente en todas las dimensiones |
| Sin datos de T1. Completa el Madurez Radar primero. | texto cuando no hay datos de T1 |  | Sin datos de T1. Completa el Madurez Radar primero. | Sin datos de T1. Completa el Madurez Radar primero. | Sin datos de T1. Completa el Madurez Radar primero. | (igual) |
| T2 | badge identificador del bloque T2 |  | T2 | T2 | T2 | (igual) |
| Contexto de stakeholders (T2) | título del bloque T2 |  | Contexto de stakeholders (T2) | Contexto de stakeholders de datos (T2) | Contexto de stakeholders (T2) | (igual) |
| Champion | label del champion | t2Context manual | Champion | Champion | Champion | (igual) |
| ✓ {championArchetype} | texto del champion | t2Context manual | ✓ {championArchetype} | ✓ {championArchetype} | ✓ {championArchetype} | (igual) |
| Posibles bloqueos | label de bloqueos | t2Context manual | Posibles bloqueos | Posibles bloqueos | Posibles bloqueos | (igual) |
| ▲ {blockerArchetype} | texto de cada bloqueo | t2Context manual | ▲ {blockerArchetype} | ▲ {blockerArchetype} | ▲ {blockerArchetype} | (igual) |
| Auto-calculado desde T2 · {n} stakeholders relevantes | nota de auto-cálculo T2 |  | Auto-calculado desde T2 · {n} stakeholders relevantes | Auto-calculado desde T2 · {n} stakeholders relevantes | Auto-calculado desde T2 · {n} stakeholders relevantes | (igual) |
| Champions potenciales | label de champions auto-calculados |  | Champions potenciales | Champions potenciales | Champions potenciales | (igual) |
| ✓ {name} · {role} | texto de cada champion auto-calculado |  | ✓ {name} · {role} | ✓ {name} · {role} | ✓ {name} · {role} | (igual) |
| Posibles bloqueos | label de bloqueos auto-calculados | segunda aparición, contexto T2 automático | Posibles bloqueos | Posibles bloqueos | Posibles bloqueos | (igual) |
| ▲ {name} · {role} | texto de cada bloqueo auto-calculado |  | ▲ {name} · {role} | ▲ {name} · {role} | ▲ {name} · {role} | (igual) |
| Sin perfiles críticos detectados en T2 | texto cuando no hay champions ni bloqueos |  | Sin perfiles críticos detectados en T2 | Sin perfiles críticos detectados en T2 | Sin perfiles críticos detectados en T2 | (igual) |
| Sin datos de T2. Completa la Stakeholder Matrix primero. | texto cuando no hay datos de T2 |  | Sin datos de T2. Completa la Stakeholder Matrix primero. | Sin datos de T2. Completa la Stakeholder Matrix primero. | Sin datos de T2. Completa la Stakeholder Matrix primero. | (igual) |
| Categoría IA | título del bloque de categoría IA |  | Categoría IA | Categoría de Iniciativa de Datos | Categoría de iniciativa digital | Categoría de iniciativa |
| Proceso origen (T3) | label del proceso de origen | cuando fue importado desde T3 | Proceso origen (T3) | Proceso origen (T3) | Proceso origen (T3) | (igual) |
| Opp. score T3: | prefijo del score de oportunidad T3 | dentro del bloque de categoría IA | Opp. score T3: | Opp. score T3: | Opp. score T3: | (igual) |
| Cargando casos de uso... | texto del spinner de carga bloqueante |  | Cargando casos de uso... | Cargando iniciativas de datos... | Cargando iniciativas digitales... | Cargando iniciativas... |
| Selecciona un proyecto | título de la guarda "sin proyecto seleccionado" |  | Selecciona un proyecto | Selecciona un proyecto | Selecciona un proyecto | (igual) |
| Los casos de uso están vinculados al proyecto activo. Usa el selector | texto de la guarda | parte previa al selector resaltado | Los casos de uso están vinculados al proyecto activo. Usa el selector | Las iniciativas de datos están vinculadas al proyecto activo. Usa el selector | Las iniciativas digitales están vinculadas al proyecto activo. Usa el selector | Las iniciativas están vinculadas al proyecto activo. Usa el selector |
| ▾ Proyecto | texto resaltado dentro de la guarda, referencia al selector de la barra superior |  | ▾ Proyecto | ▾ Proyecto | ▾ Proyecto | (igual) |
| en la barra superior para seleccionar uno existente o crear uno nuevo. | texto de la guarda | parte final | en la barra superior para seleccionar uno existente o crear uno nuevo. | en la barra superior para seleccionar uno existente o crear uno nuevo. | en la barra superior para seleccionar uno existente o crear uno nuevo. | (igual) |
| Volver al Dashboard | botón de la guarda |  | Volver al Dashboard | Volver al Dashboard | Volver al Dashboard | (igual) |
| T4 | badge identificador del módulo en el header |  | T4 | T4 | T4 | (igual) |
| Use Case Priority Board | título h1 del header |  | Use Case Priority Board | Use Case Priority Board de Gobierno de Datos | Use Case Priority Board | (igual) |
| {companyName} · Portfolio de IA | eyebrow bajo el título principal |  | {companyName} · Portfolio de IA | {companyName} · Portfolio de Gobierno de Datos | {companyName} · Portfolio Digital | {companyName} · Portfolio de Iniciativas |
| Actualizando… | indicador de refetch no bloqueante |  | Actualizando… | Actualizando… | Actualizando… | (igual) |
| ↓ Importar desde T3 | botón del header |  | ↓ Importar desde T3 | ↓ Importar desde T3 | ↓ Importar desde T3 | (igual) |
| Dashboard ejecutivo | título h2 de la sección hero |  | Dashboard ejecutivo | Dashboard ejecutivo | Dashboard ejecutivo | (igual) |
| Sin casos de uso | título del estado vacío general |  | Sin casos de uso | Sin iniciativas de datos | Sin iniciativas digitales | Sin iniciativas |
| Importa procesos desde T3 o añade un caso de uso manualmente. | descripción del estado vacío general |  | Importa procesos desde T3 o añade un caso de uso manualmente. | Importa procesos desde T3 o añade una iniciativa de datos manualmente. | Importa procesos desde T3 o añade una iniciativa digital manualmente. | Importa procesos desde T3 o añade una iniciativa manualmente. |
| Recomendaciones IA — Portfolio de Casos de Uso | título pasado al RecommendationPanel |  | Recomendaciones IA — Portfolio de Casos de Uso | Recomendaciones IA — Portfolio de Gobierno de Datos | Recomendaciones IA — Portfolio de Iniciativas Digitales | Recomendaciones IA — Portfolio de Iniciativas |
| Generadas por Claude · Específicas para este portfolio | subtítulo pasado al RecommendationPanel |  | Generadas por Claude · Específicas para este portfolio | Generadas por Claude · Específicas para este portfolio de gobierno de datos | Generadas por Claude · Específicas para este portfolio | (igual) |
 
- **Nota del experto — Generalización (Gobierno de Proyectos):** la columna "Generalización" reescribe el copy de Transformación Digital para que sea válido para cualquier dominio de iniciativa (no solo IT/datos/IA). Sustituye "caso(s) de uso" por "iniciativa(s)", "Riesgo IA/Digital/Regulatorio" por "Riesgo regulatorio/operativo", "Dependencia de datos y sistemas" por "Dependencia de recursos e información", y las referencias normativas concretas (AI Act, RGPD, DORA, NIS2, GDPR, ISO 27001, COBIT 2019, ITIL4) por "el marco normativo/contractual aplicable" o "los estándares de gestión aplicables", configurables por dominio. Los benchmarks de coste (€), ganancia de eficiencia (%), quarters del roadmap y la mecánica de scoring/umbrales GO-NO-GO ya eran agnósticos y se marcan "(igual)". El módulo de clasificación regulatoria ("AI Act" / "RGPD-DAMA" / "Cumplimiento TI") se generaliza a un módulo de "Cumplimiento" configurable, donde el marco normativo de referencia (AI Act, RGPD, ISO 27001, sectorial, etc.) se selecciona según el tipo de iniciativa y el sector del cliente, sin cambiar la estructura del cuestionario de 4 preguntas ni la lógica de riesgo.
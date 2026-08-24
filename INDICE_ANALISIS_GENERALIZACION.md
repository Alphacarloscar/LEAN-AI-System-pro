# ÍNDICE: ANÁLISIS EXHAUSTIVO DE GENERALIZACIÓN DE LITERALES IA EN GOBY

**Fecha de análisis:** 2026-08-21  
**Versión:** 1.0  
**Documentos generados:** 4 archivos principales

---

## 📋 DOCUMENTOS INCLUIDOS

### 1. **ANALISIS_GENERALIZACION.md** (28.3 KB, 469 líneas)
   
   **Propósito:** Análisis técnico exhaustivo en 5 bloques estructurados.
   
   **Contenido:**
   - **Bloque 1:** Inventario de 214+ literales IA por módulo (tablas detalladas)
   - **Bloque 2:** Búsqueda sistemática de strings "IA"/"AI" en codebase
   - **Bloque 3:** Clasificación de tablas y campos de BD por acoplamiento
   - **Bloque 4:** Búsqueda de prompts LLM y contenido generado
   - **Bloque 5:** Resumen ejecutivo + tabla de esfuerzo (112-156 horas)
   - **Bloque 6:** Plan de validación y rollback por fase
   - **Bloque 7:** Matriz de riesgos detallada + vulnerabilidades
   
   **Audiencia:** Ingenieros técnicos, arquitectos, líderes de proyecto.
   **Usar para:** Comprensión profunda del acoplamiento, planificación técnica detallada.

---

### 2. **RESUMEN_EJECUTIVO_ANALISIS.txt** (9.6 KB, ~250 líneas)
   
   **Propósito:** Referencia rápida para stakeholders y decisiones ejecutivas.
   
   **Contenido:**
   - Hallazgos clave (214 literales, distribución por severidad)
   - Módulos más acoplados (T1, T5, T6, T4)
   - Plan de ejecución en 8 fases (2-3 sprints cada una)
   - Qué cambiar vs qué no cambiar
   - Tabla: módulos por prioridad de generalización
   - Checklist pre-Sprint 13
   - Indicadores de salud (KPIs por fase)
   - Riesgos principales + mitigaciones
   - Estrategia de rollback
   - Next steps (esta semana → Sprint 16)
   
   **Audiencia:** PMs, CTOs, stakeholders, equipo completo.
   **Usar para:** Decisiones rápidas, reportes ejecutivos, alignment de equipo.

---

### 3. **MAPA_LITERALES_REFERENCIA_RAPIDA.csv** (4.7 KB, ~35 filas)
   
   **Propósito:** Tabla filtrable de archivo → literal → contexto.
   
   **Contenido:**
   - Archivo (path relativo)
   - Línea / rango de líneas
   - Tipo (TypeScript type, constant, SQL, React component, etc.)
   - Literal exacto (string/keyword)
   - Contexto (qué representa)
   - Acoplamiento (CRÍTICO, MEDIO, BAJO)
   - Trivial/Moderado/Alto (booleanos)
   - Fase de generalización (Fase 1-8, "No Cambiar")
   - Notas
   
   **Audiencia:** Ingenieros implementando cambios, code reviewers.
   **Usar para:** Búsqueda rápida ("¿dónde está T5DomainCode?"), filtrar por acoplamiento/fase.
   **Cómo usar:** Abrir en Excel/Google Sheets, filtrar por columna "Acoplamiento" o "Fase".

---

### 4. **PLANTILLA_SEGUIMIENTO_FASES.md** (14.2 KB, 8 secciones)
   
   **Propósito:** Tracker ejecutable para 8 fases durante Sprints 13-16.
   
   **Contenido:**
   - Estado general (4 métricas en dashboard)
   - Para cada fase (1-8):
     * Objetivo
     * Lista de tareas con propietario/estado
     * Validación pre-merge (checklist)
     * Bloqueadores
     * Notas
   - Métricas: velocidad (horas reales vs estimadas), calidad (test coverage, pass rate)
   - Riesgos activos (tracker de estado)
   - Historial de actualizaciones
   
   **Audiencia:** Dev leads, scrum masters, equipos implementadores.
   **Usar para:** Seguimiento weekly/daily durante execution, reportes de progreso.
   **Cómo usar:** Copiar, llenar propietarios/estados, actualizar cada standup.

---

## 🗂️ CÓMO USAR ESTOS DOCUMENTOS

### Escenario 1: "Necesito entender el problema" (Primera lectura)
1. Leer **RESUMEN_EJECUTIVO_ANALISIS.txt** (15 min)
2. Revisar tablas de módulos acoplados (RESUMEN, líneas ~100-120)
3. Consultar **ANALISIS_GENERALIZACION.md** Bloque 1 para profundizar en módulo específico

### Escenario 2: "Voy a implementar Fase X" (Durante Sprint)
1. Consultar **PLANTILLA_SEGUIMIENTO_FASES.md** → Fase X
2. Para cada tarea, buscar en **MAPA_LITERALES_REFERENCIA_RAPIDA.csv** archivos afectados
3. Leer **ANALISIS_GENERALIZACION.md** Bloque correspondiente para contexto
4. Actualizar checklist de validación en PLANTILLA

### Escenario 3: "¿Dónde está el literal X?" (Búsqueda rápida)
1. Abrir **MAPA_LITERALES_REFERENCIA_RAPIDA.csv** en Excel/Google Sheets
2. Filtrar por columna "Literal" o "Archivo"
3. Ir a archivo:línea indicado

### Escenario 4: "Necesito un reporte ejecutivo" (Stakeholder update)
1. Usar tablas de **RESUMEN_EJECUTIVO_ANALISIS.txt**:
   - Tabla "Hallazgos clave" (214 literales)
   - Tabla "Esfuerzo estimado" (112-156 horas)
   - Tabla "KPIs por fase" (indicadores de salud)
2. Mencionar "Plan en 8 fases (6-7 sprints)"
3. Incluir "Riesgos principales" si aplica

### Escenario 5: "Auditoría de RLS/Security" (Code review)
1. Consultar **ANALISIS_GENERALIZACION.md** Bloque 7 "Vulnerabilidades de Seguridad"
2. Revisar sección 7.2 "Riesgos por Fase" para impacto en policies

---

## 📊 RESUMEN RÁPIDO

| Métrica | Valor |
|---------|-------|
| **Total literales IA** | 214+ |
| **Triviales (UI labels)** | 30 (14%) |
| **Moderados (config)** | 65 (30%) |
| **Críticos (core logic)** | 119 (56%) |
| **Módulos más acoplados** | T1 (45), T5 (36), T6 (25), T4 (14) |
| **Esfuerzo estimado** | 112-156 horas |
| **Sprints necesarios** | 6-7 (Sprints 13-16) |
| **Riesgo general** | MEDIO (estructurado, no caótico) |
| **Go-live multidominio** | ✅ Alcanzable sin rewrite |

---

## 🚀 PLAN DE EJECUCIÓN (8 FASES)

```
Sprint 13 (Semanas 1-2)
├─ Fase 1: Base de Datos (tablas, índices, migración)
└─ Fase 2: Tipado Dinámico (DynamicSchemaRegistry, feature flag)

Sprint 13-14 (Semanas 3-4)
├─ Fase 3: Stores Genéricos (factory, refactor T1/T5)
└─ Fase 4: Componentes Dinámicos (SpiderChart, panelRegistry, T10)

Sprint 15 (Semanas 1-4)
├─ Fase 5: Constantes → BD (queries dinámicas)
└─ Fase 6: Prompts Dinámicos (templates, Edge Functions)

Sprint 16 (Semanas 1-4)
├─ Fase 7: Segundo Dominio (Data Governance piloto)
└─ Fase 8: Renombramientos (limpieza, documentación)
```

---

## ✅ CHECKLIST ANTES DE INICIAR

- [ ] Revisar RESUMEN_EJECUTIVO_ANALISIS.txt
- [ ] Reunión técnica: validar estimaciones con equipo
- [ ] Leer ANALISIS_GENERALIZACION.md Bloque 5 (resumen ejecutivo técnico)
- [ ] Backup completo de BD
- [ ] Feature flags provisioned en settings.json
- [ ] Asignar propietarios a cada Fase
- [ ] Crear copy de PLANTILLA_SEGUIMIENTO_FASES.md para tracking

---

## 🔗 RELACIONES ENTRE DOCUMENTOS

```
┌─ RESUMEN_EJECUTIVO_ANALISIS.txt
│  └─ Entrada rápida, decisiones ejecutivas
│
├─ ANALISIS_GENERALIZACION.md (documento fuente)
│  ├─ Bloque 1-2: Inventario detallado
│  ├─ Bloque 3: Mapeo BD
│  ├─ Bloque 5: Resumen (referenciado en RESUMEN)
│  └─ Bloque 6-7: Validación + riesgos
│
├─ MAPA_LITERALES_REFERENCIA_RAPIDA.csv
│  └─ Búsqueda rápida durante implementación
│
└─ PLANTILLA_SEGUIMIENTO_FASES.md
   └─ Tracking ejecutivo durante Sprints 13-16
```

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Cuántas líneas de código hay que cambiar?**  
R: Estimado: 2,000-3,000 líneas afectadas (refactoring + nuevas tablas/funciones). Ver RESUMEN tabla "Esfuerzo de Generalización".

**P: ¿Es breaking change para usuarios finales?**  
R: No. Cambios son internos (BD schema, tipos TS). UX es idéntica (Fases 1-7). Renombramientos agnósticos (Fase 8) ocurren al final, sin impacto visible.

**P: ¿Por qué 6-7 sprints?**  
R: 112-156 horas de dev + testing + validation. Con 2 dev, ~20 horas/semana = 5-8 semanas. Ver RESUMEN tabla "Esfuerzo de Generalización".

**P: ¿Cuál es el orden de prioridad si tenemos menos tiempo?**  
R: Fases 1-2 (BD + tipado) = críticas. Fases 3-5 (stores + UI + config) = medianas. Fases 6-7 (prompts + piloto) = pueden aplazarse.

**P: ¿Cómo rollback si algo falla?**  
R: Cada Fase es independently reversible (<2 horas). Ver RESUMEN "Rollback Strategy" o ANALISIS Bloque 6.

---

## 📄 INFORMACIÓN DE REFERENCIA

**Documentos consultados durante análisis:**
- INFORME_DESACOPLAMIENTO_GOBIERNO.md (1,424 líneas)
- POC_RESOLUCION_RIESGOS_FRONTEND.md (2,054 líneas)
- POC_QUICK_REFERENCE.md (332 líneas)

**Archivos de código analizados:**
- src/types/domain.types.ts
- src/types/database.types.ts
- src/modules/T1_MaturityRadar/constants.ts
- src/modules/T5_AITaxonomyCanvas/constants.ts
- src/modules/T4_UseCasePriorityBoard/constants.ts
- src/config/salesPackages.ts
- (+ 40+ archivos adicionales via grep)

**Total de búsquedas realizadas:** 15+ queries regex/grep

---

## 📝 NOTAS DE MANTENIMIENTO

- **Actualmente:** Este análisis es el estado de verdad (2026-08-21)
- **Próxima revisión:** Post-Fase 1 (una vez datos en BD)
- **Cambios esperados:** Ajustes menores en estimaciones tras primeras 2 semanas
- **Deprecation:** INFORME_DESACOPLAMIENTO_GOBIERNO.md puede considerarse deprecated post-Fase 3 (contenido integrado acá)

---

**Documento generado:** 2026-08-21  
**Por:** Claude Code (Haiku 4.5)  
**Para:** Equipo de desarrollo GOBY (Sprints 13-16)

---

**¡Listo para Sprint 13 kick-off!** 🚀

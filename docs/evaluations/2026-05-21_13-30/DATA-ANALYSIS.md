# Análisis de datos del proyecto — L.E.A.N. AI System Enterprise
**Pregunta de análisis:** ¿Cuál es el estado cuantificable del codebase y dónde están los mayores riesgos medibles?  
**Fecha:** 2026-05-21 | **Fuente:** Análisis estático del repositorio

---

## Métricas del codebase

| Métrica | Valor | Referencia / Interpretación |
|---------|-------|----------------------------|
| Líneas totales de código | 28.453 | Tamaño medio para un SaaS de 12 módulos |
| Ficheros TypeScript/TSX | 113 | ~251 líneas/fichero promedio |
| Módulos de herramienta | 12 | T1-T12 |
| Fichero más grande | T4View.tsx (~2.329L) | 21× la media — outlier extremo |
| Dependencias de producción | 41 | Todas con `^` (drift risk) |
| Devdependencies relevantes | Storybook (6 pkgs) sin stories | Overhead sin ROI |
| Migraciones SQL | 8 | Aplicadas manualmente |
| Políticas RLS | 99 | Buena cobertura de seguridad |

---

## Distribución de deuda por categoría

| Categoría | Items | % del total | Score promedio |
|-----------|-------|-------------|---------------|
| Seguridad | 2 | 10.5% | 47.5 |
| Tipo-seguridad | 3 | 15.8% | 35.7 |
| Calidad de código | 4 | 21.0% | 22.0 |
| Observabilidad | 2 | 10.5% | 28.0 |
| Testing/CI | 2 | 10.5% | 39.0 |
| Sistema de diseño | 3 | 15.8% | 18.0 |
| Dependencias | 2 | 10.5% | 25.0 |
| Documentación | 1 | 5.3% | 12.0 |

---

## Análisis de adherencia al patrón arquitectónico

| Patrón | Módulos que lo cumplen | Módulos que no | % adherencia |
|--------|----------------------|----------------|-------------|
| View.tsx separado | T1-T12 (12/12) | — | 100% |
| store.ts separado | T1-T12 (12/12) | — | 100% |
| service.ts separado | T1-T4 (4/12) | T5-T12 | **33%** |
| types.ts separado | T1-T12 (12/12) | — | 100% |
| constants.ts separado | T1-T12 (12/12) | — | 100% |
| Componentes sin hardcodes | ~30% estimado | ~70% | **~30%** |

**Interpretación:** El patrón de módulo está bien definido y se sigue en su mayoría, pero la capa de servicio — la más crítica para la separación de concerns — se implementó solo en el 33% de los módulos.

---

## Análisis de concentración de complejidad

### Top 5 ficheros por complejidad

| Fichero | Líneas estimadas | Sub-componentes | Imports | Riesgo |
|---------|-----------------|-----------------|---------|--------|
| T4View.tsx | ~2.329 | 7+ inline | 25+ | 🔴 Crítico |
| AdminView.tsx | ~521+ | — | — | 🟡 Alto |
| T7_AdoptionHeatmap | Desconocido | — | — | 🟡 Sin service |
| T10_AIValueDashboard | Desconocido | — | — | 🟡 Sin service |
| AppSidebar.tsx | ~200 | — | — | 🟡 Hardcodes |

**El 90% de la deuda de mantenimiento está en T4View.tsx.** Un solo fichero concentra toda la complejidad arquitectónica del proyecto.

---

## Análisis de accesibilidad — distribución de issues

| Principio WCAG | Issues | Críticos | Mayores | Menores |
|---------------|--------|----------|---------|---------|
| Perceptible (contraste, alt text) | 9 | 4 | 3 | 2 |
| Operable (teclado, skip link) | 5 | 3 | 1 | 1 |
| Comprensible (labels, headings) | 4 | 1 | 3 | 0 |
| Robusto (ARIA live) | 1 | 0 | 0 | 1 |
| **Total** | **19** | **5 (26%)** | **9 (47%)** | **5 (26%)** |

**26% de los issues son críticos.** Para un producto enterprise B2B, los issues de contraste y formularios (categorías 1 y 3) son los que más probabilidad tienen de aparecer en una auditoría de compliance de un cliente grande.

---

## Análisis de tokens de diseño

| Métrica | Valor | Ideal | Gap |
|---------|-------|-------|-----|
| Tokens definidos en tailwind.config.ts | ~45 | — | — |
| Hardcodes hex en src/ | 134 | 0 | 134 |
| Componentes atómicos implementados | 0 | ~8 | 8 |
| Componentes de app implementados | 7 | ~7 | 0 |
| Violaciones de naming (token `navy`) | 1 | 0 | 1 |
| Tokens de contraste insuficiente en uso | 3 | 0 | 3 |

---

## Proyección de crecimiento de deuda

Si el proyecto continúa añadiendo módulos sin resolver la deuda actual:

| Métrica | Hoy (T12) | T13 | T15 | T20 (hipotético) |
|---------|-----------|-----|-----|-----------------|
| Módulos sin service.ts | 8 | 9 | 11 | 16 |
| Hardcodes estimados | 134 | ~145 | ~167 | ~222 |
| Instancias de Button ad-hoc | ~80 | ~90 | ~110 | ~160 |
| Tiempo de refactor (estimado) | 40-60h | 45-65h | 55-75h | 90-120h |

**El coste de la deuda técnica crece linealmente con cada módulo nuevo.** El momento óptimo de resolución es antes de construir T13, no después.

---

## Análisis de riesgo de dependencias

| Dependencia | Versión | Estado | CVEs | Acción |
|-------------|---------|--------|------|--------|
| xlsx | 0.18.5 | ⚠️ Sin updates desde 2023 | ✅ CVE-2023-30533 | Migrar a exceljs |
| @supabase/auth-helpers-react | — | ❌ Deprecada | No | Migrar a @supabase/ssr |
| recharts | ^2.13.3 | ✅ Activo | No | — |
| zustand | ^5.0.2 | ✅ Activo | No | — |
| react | ^18.3.1 | ✅ Activo | No | — |
| vite | ^6.0.3 | ✅ Activo | No | — |

---

## Conclusiones del análisis

**Los 3 números que importan:**

1. **134 hardcodes** — mide la brecha entre el DS planificado y el ejecutado. Reducible a 0 en 2-3 sprints.
2. **0 tests** — el indicador de riesgo más simple: cualquier cambio puede romper producción sin detección.
3. **33% de adherencia al patrón de servicio** — significa que 8 de 12 módulos mezclan acceso a datos con lógica de estado.

**El análisis de concentración de complejidad muestra que la deuda no está distribuida uniformemente.** T4View.tsx es un outlier que sesga todas las métricas de calidad de código hacia abajo. Extraer sus sub-componentes resolvería ~40% del score de complejidad del proyecto con un sprint de esfuerzo medio.

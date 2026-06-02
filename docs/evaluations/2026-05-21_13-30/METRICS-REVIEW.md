# Metrics Review — GOBY
**[ÁREA: PRODUCTO]**  
**Período:** Baseline — Mayo 2026 | **Audiencia:** Carlos Sánchez

---

## Situación actual

El GOBY no tiene analytics de producto instalados. No existe ninguna métrica de uso real. Todas las métricas de este documento son de **estado del producto/negocio**, no de uso de usuarios — porque esos datos no existen todavía.

Este documento cumple dos funciones:
1. **Inventario del estado actual** — qué sabemos hoy
2. **Framework de métricas** — qué deberíamos medir y cómo

---

## Estado actual — métricas conocidas

### Scorecard técnico (fuente: evaluación 2026-05-21)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Score técnico global | 4.4/10 | 🟡 |
| Calidad de código | 5/10 | 🟡 |
| Tests | 1/10 | 🔴 |
| Frontend | 6/10 | 🟡 |
| Base de datos | 6/10 | 🟡 |
| Seguridad | 6/10 | 🟡 |
| CI/CD | 2/10 | 🔴 |
| Documentación | 7/10 | 🟢 |
| Dependencias | 5/10 | 🟡 |
| Observabilidad | 2/10 | 🔴 |

### Scorecard de diseño/accesibilidad (fuente: A11Y-AUDIT + DESIGN-CRITIQUE)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Score WCAG 2.1 AA global | 4.5/10 | 🟡 |
| Issues críticos de a11y | 5 | 🔴 |
| Score diseño global | 4.8/10 | 🟡 |
| Adherencia al token system | 3/10 | 🔴 |
| Hardcodes hex en codebase | 134 | 🔴 |
| Componentes atómicos implementados | 0/8 planificados | 🔴 |

### Scorecard de producto (fuente: conocimiento del proyecto)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Módulos T1-T12 funcionales | 12/12 | 🟢 |
| Clientes en producción | 0 | — (MVP) |
| Consultores usando el sistema | ~1-2 (Alpha interno) | — |
| Engagements activos | Desconocido | ⚠️ Sin datos |

---

## Áreas de preocupación

**Crítico — Sin datos de uso real.** El producto lleva sprints de desarrollo pero no hay ninguna métrica que responda: ¿cuántos consultores lo usan? ¿qué módulos usan más? ¿dónde se atoran? Esto es acceptable en MVP puro, pero en cuanto entre el primer cliente, la ausencia de analytics impide iterar con datos.

**Crítico — Sin North Star Metric definida.** Para un producto de consultoría B2B como el GOBY, la North Star no es obvia. Propuestas a evaluar (ver sección siguiente).

**Preocupante — Sin métricas de negocio.** Alpha no tiene datos del funnel comercial estructurados: leads, propuestas enviadas, propuestas ganadas, valor medio de contrato, tiempo de ciclo de venta.

---

## Framework de métricas propuesto

### North Star Metric

Para el GOBY, la North Star candidata es:

**"Engagements con ≥6 módulos activos y datos completados en las últimas 4 semanas"**

**Razonamiento:** Un engagement activo con múltiples módulos usados indica:
- El consultor encuentra valor en la herramienta (la usa)
- El cliente está comprometido con el proceso
- Alpha está generando valor metodológico real

**Alternativas a evaluar:**
- "Horas ahorradas en generación de informes por engagement" (difícil de medir directamente)
- "Score de madurez de IA completado en T1 por mes" (más fácil, pero mide una sola herramienta)

### L1 — Métricas de salud del producto (propuestas)

| Métrica | Descripción | Cómo medir | Frecuencia |
|---------|-------------|-----------|-----------|
| Engagements activos | Engagements con actividad en los últimos 30 días | PostHog + Supabase | Semanal |
| Módulos usados por engagement (promedio) | ¿Cuántas de las 12 herramientas usa un proyecto tipo? | PostHog event: module_opened | Mensual |
| Tasa de completado T1 | % de engagements con T1 completado (todos los sliders rellenados) | Query Supabase | Mensual |
| Tiempo medio de sesión por módulo | ¿Cuánto tiempo pasan en cada herramienta? | PostHog | Mensual |
| Usuarios activos semanales | Consultores que abren la app ≥1 vez/semana | PostHog WAU | Semanal |

### L2 — Métricas diagnósticas (para investigación)

| Métrica | Descripción | Trigger de investigación |
|---------|-------------|------------------------|
| Drop-off por módulo | ¿En qué módulo se abandona el engagement? | Si drop-off >50% en un módulo específico |
| Tiempo hasta primer uso de T4 (ROI) | ¿Cuántos días desde T1 hasta llegar a T4? | Si es >30 días |
| % de campos completados en T7 (Heatmap) | Completitud del módulo más complejo | Si <60% completado |
| Errores por módulo | Qué módulos generan más errores de JS | Sentry, si se instala |

---

## Implementación mínima viable de analytics

**Herramienta propuesta:** PostHog (open-source, self-hosteable, plan cloud gratuito)

**Eventos mínimos a trackear en Sprint 2:**

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js'

export const analytics = {
  // Navegación entre módulos — evento más crítico
  moduleOpened: (module: string, engagementId: string) => {
    posthog.capture('module_opened', { module, engagement_id: engagementId })
  },

  // Completado de assessment en T1
  t1AssessmentCompleted: (engagementId: string, score: number) => {
    posthog.capture('t1_assessment_completed', { engagement_id: engagementId, maturity_score: score })
  },

  // Caso de uso creado en T4
  useCaseCreated: (engagementId: string, category: string) => {
    posthog.capture('use_case_created', { engagement_id: engagementId, category })
  },

  // Identidad del usuario (llamar en login exitoso)
  identify: (userId: string, role: string) => {
    posthog.identify(userId, { role })
  },
}
```

**Integración en cada módulo:**
```typescript
// En cada TxRouteView o TxView — una sola línea
useEffect(() => {
  analytics.moduleOpened('T1', engagementId)
}, [engagementId])
```

**Coste:** PostHog cloud gratuito hasta 1M eventos/mes. Suficiente para 12 meses de uso actual.

---

## Métricas de negocio — framework para Óscar y Carlos

Sin datos históricos, estas métricas deben empezar a medirse ahora:

| Métrica | Definición | Cómo capturarla |
|---------|-----------|----------------|
| Leads cualificados por mes | Empresas con fit (200-2000 empleados, interés IA declarado) contactadas | CRM o simple hoja de seguimiento |
| Tasa de conversión lead → propuesta | % de leads que llegan a propuesta económica | CRM |
| Tasa de conversión propuesta → contrato | % de propuestas que se firman | CRM |
| Tiempo de ciclo de venta | Días desde primer contacto hasta firma | CRM |
| Valor medio de contrato (ACV) | Precio medio por proyecto | Contabilidad |
| Net Promoter Score (NPS) | ¿Recomendarías Alpha a un colega? | Encuesta post-proyecto |

**Herramienta:** Una hoja de cálculo compartida entre Óscar y Carlos sirve para empezar. El objetivo no es complejidad — es consistencia.

---

## Tendencias y alertas a monitorizar

| Indicador | Señal positiva | Señal de alarma |
|-----------|---------------|----------------|
| Módulos usados por engagement | Subiendo hacia 8-10 de 12 | Estancado en <4 módulos |
| Tiempo en T4 (ROI) | >45 min/sesión | <15 min (no están usando los cálculos) |
| Errores reportados por clientes | 0 por semana | >2 por semana |
| Propuestas enviadas | Subiendo MoM | Planas o bajando |
| Ciclo de venta | <90 días | >180 días |

---

## Recomendaciones

1. **Inmediato:** Instalar PostHog con los 3 eventos mínimos (moduleOpened, identify, t1AssessmentCompleted). ~3h. Sin esto, no hay datos para la próxima revisión de métricas.

2. **Sprint 1:** Crear un documento de seguimiento comercial simple (leads / propuestas / contratos) que Óscar y Carlos rellenen cada semana.

3. **Primer cliente en producción:** Hacer una sesión de "user research" al final del primer engagement — 1h con el PM del cliente para entender qué módulos encontraron más valor. Eso es más valioso que 6 meses de analytics cuantitativos.

4. **Siguiente revisión de métricas:** Cuando existan datos reales (mínimo 4 semanas de PostHog + 1 engagement completo). Sin datos, el siguiente metrics review sería otro análisis de estado, no de uso.

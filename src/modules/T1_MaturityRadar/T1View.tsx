// ============================================================
// T1 — Vista completa (AI Readiness Assessment)
// Layout: header con back + two-column (dimensions | radar sticky)
//         + executive output (QW1) al final.
// Estado: local React, pre-cargado desde el escenario demo activo.
// ============================================================

import { useState, useMemo }            from 'react'
import type { DemoScenario }            from '@/data/demo/types'
import { DIMENSION_DEFINITIONS }        from './constants'
import type { T1DimensionState }        from './types'
import { DimensionCard }                from './components/DimensionCard'
import { T1RadarPanel }                 from './components/T1RadarPanel'
import { T1ExecutiveOutput }            from './components/T1ExecutiveOutput'

interface T1ViewProps {
  scenario: DemoScenario
  onBack:   () => void
}

// Convierte el t1Radar del escenario en estado editable de dimensiones
function buildInitialState(scenario: DemoScenario): T1DimensionState[] {
  return DIMENSION_DEFINITIONS.map((def) => {
    // Buscar en el radar del escenario por nombre de dimensión (case-insensitive)
    const radarEntry = scenario.t1Radar.find(
      (r) => r.dimension.toLowerCase() === def.label.toLowerCase()
    )
    return {
      code:     def.code,
      label:    def.label,
      score:    radarEntry?.current ?? 3,
      target:   radarEntry?.target  ?? 4,
      evidence: buildDefaultEvidence(def.code, scenario),
    }
  })
}

// Evidencia pre-cargada por dimensión — contextualizada al escenario demo activo
function buildDefaultEvidence(code: string, scenario: DemoScenario): string {
  const company = scenario.company.name
  const pattern = scenario.id

  const evidenceMap: Record<string, Record<string, string>> = {
    'vendor-sprawl': {
      strategy:   `${company} tiene una visión de IA a nivel directivo pero no existe un roadmap corporativo formal.`,
      data:       `Múltiples fuentes de datos activas. Sin estándar de calidad corporativo.`,
      technology: `Stack cloud presente (M365 + Azure). Arquitectura IA no definida formalmente.`,
      talent:     `Alta iniciativa individual en equipos. Formación IA no estandarizada.`,
      processes:  `Procesos no rediseñados para IA. La adopción ha sido sobre procesos existentes.`,
      culture:    `Cultura muy abierta a la tecnología. La adopción IA ha sido espontánea y viral.`,
      governance: `Sin política IA corporativa. Compras realizadas sin proceso de aprobación.`,
      leadership: `El CIO es consciente del problema pero no tiene mandato ni presupuesto formal.`,
    },
    'data-visibility': {
      strategy:   `${company} tiene estrategia IA declarada a nivel ejecutivo con KPIs genéricos.`,
      data:       `14 herramientas IA activas. Solo 3 con métricas de consumo de datos estructuradas.`,
      technology: `Stack tecnológico robusto (cloud nativo). Falta integración entre sistemas IA.`,
      talent:     `Perfiles técnicos presentes. Sin especialización en medición de valor IA.`,
      processes:  `No existe un proceso formal para medir el ROI de herramientas IA.`,
      culture:    `Adopción IA presente pero dispersa. Sin cultura de medición de impacto.`,
      governance: `Sin inventario formal de herramientas IA ni proceso de reporting al Comité.`,
      leadership: `El CIO ha adoptado IA activamente pero no puede reportar valor al Consejo.`,
    },
    'slow-decisions': {
      strategy:   `${company} identifica oportunidades IA regularmente pero no tiene proceso de decisión.`,
      data:       `Datos disponibles y de calidad aceptable. No son el cuello de botella.`,
      technology: `Infraestructura técnica lista. El problema no es tecnológico.`,
      talent:     `Talento técnico básico presente. Motivado pero frustrado por la lentitud.`,
      processes:  `El proceso de aprobación de iniciativas IA involucra 18 stakeholders y tarda 4,5 meses.`,
      culture:    `Cultura favorable a la IA en equipos técnicos. Resistencia en mandos intermedios.`,
      governance: `Sin framework de decisión IA. Cada iniciativa pasa por un proceso ad-hoc diferente.`,
      leadership: `El CEO da luz verde verbalmente pero sin mandato ejecutivo formal.`,
    },
    'change-resistance': {
      strategy:   `${company} tiene una estrategia IA documentada y casos de uso priorizados.`,
      data:       `Datos clínicos de calidad. Acceso regulado por compliance sanitario.`,
      technology: `Stack tecnológico robusto. Las herramientas IA están desplegadas y funcionan.`,
      talent:     `Personal clínico sin formación IA específica. Solo el 18% usa herramientas disponibles.`,
      processes:  `Los flujos de trabajo no han sido rediseñados para integrar IA de forma natural.`,
      culture:    `Alta resistencia entre personal clínico. 3 de 5 pilotos abandonados en rollout.`,
      governance: `AI Policy básica. Falta protocolo de gestión del cambio y arquetipos de resistencia.`,
      leadership: `Dirección comprometida pero el liderazgo intermedio no lidera el cambio activamente.`,
    },
    'pilot-chaos': {
      strategy:   `${company} tiene visión IA clara y apoyo ejecutivo pleno. La estrategia no es el problema.`,
      data:       `Datos disponibles por proyecto pero sin gobierno centralizado entre pilotos.`,
      technology: `Stack técnico avanzado. Capacidad de ejecutar proyectos IA complejos.`,
      talent:     `Equipo técnico capaz. Alta iniciativa. Sin metodología de ejecución de pilotos.`,
      processes:  `Sin proceso estándar para gestionar pilotos IA. Cada equipo inventa su metodología.`,
      culture:    `Cultura de innovación excepcional. El problema no es la voluntad sino la disciplina.`,
      governance: `Sin criterios de Go/No-Go para pilotos. Sin registro de lecciones aprendidas entre proyectos.`,
      leadership: `El CEO patrocina activamente la IA. Frustrado porque ningún piloto escala a producción.`,
    },
  }

  return evidenceMap[pattern]?.[code] ?? ''
}

// ── Componente principal ──────────────────────────────────────

export function T1View({ scenario, onBack }: T1ViewProps) {
  const [dimensions, setDimensions] = useState<T1DimensionState[]>(
    () => buildInitialState(scenario)
  )

  function updateDimension(updated: T1DimensionState) {
    setDimensions((prev) =>
      prev.map((d) => (d.code === updated.code ? updated : d))
    )
  }

  // El overall score se recalcula en cada render — sin memoize innecesario
  // porque el componente solo re-renderiza cuando dimensions cambia
  const overallScore = useMemo(
    () => dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length,
    [dimensions]
  )

  return (
    <div className="min-h-screen bg-surface dark-page-bg">

      {/* ── Header de herramienta ── */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-border px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Volver al dashboard
          </button>

          <span className="text-text-subtle">·</span>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[10px] font-mono font-semibold text-navy dark:text-info-soft uppercase tracking-wider">
              T1
            </span>
            <h1 className="text-sm font-semibold text-lean-black dark:text-gray-100 truncate">
              AI Readiness Assessment
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-text-muted shrink-0">
              Fase Listen · Semanas 1–3
            </span>
          </div>

          {/* Score en la cabecera */}
          <div className="text-right shrink-0">
            <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
              {overallScore.toFixed(1)}
            </span>
            <span className="text-sm font-light text-text-muted"> / 5</span>
          </div>
        </div>
      </div>

      {/* ── Empresa + contexto ── */}
      <div className="max-w-6xl mx-auto px-8 pt-6 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-lean-black dark:text-gray-100">
            {scenario.company.name}
          </p>
          <span className="text-text-subtle">·</span>
          <p className="text-xs text-text-muted">{scenario.company.industry}</p>
          <span className="text-text-subtle">·</span>
          <p className="text-xs text-text-muted">
            {scenario.company.employees.toLocaleString('es-ES')} empleados
          </p>
        </div>
        <p className="text-xs text-text-subtle mt-1 max-w-xl">
          Ajusta los scores según lo que observes en la sesión. El informe ejecutivo se genera automáticamente.
        </p>
      </div>

      {/* ── Layout two-column ── */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="flex gap-6 items-start">

          {/* Columna izquierda — 8 DimensionCards */}
          <div className="flex-1 min-w-0 space-y-3">
            {dimensions.map((dim) => {
              const def = DIMENSION_DEFINITIONS.find((d) => d.code === dim.code)
              if (!def) return null
              return (
                <DimensionCard
                  key={dim.code}
                  state={dim}
                  definition={def}
                  onChange={updateDimension}
                />
              )
            })}
          </div>

          {/* Columna derecha — RadarPanel sticky */}
          <div className="w-72 xl:w-80 shrink-0 sticky top-20">
            <T1RadarPanel dimensions={dimensions} />
          </div>

        </div>

        {/* ── Executive Output (QW1) ── */}
        <div className="mt-8">
          <T1ExecutiveOutput
            dimensions={dimensions}
            companyName={scenario.company.name}
          />
        </div>
      </div>
    </div>
  )
}

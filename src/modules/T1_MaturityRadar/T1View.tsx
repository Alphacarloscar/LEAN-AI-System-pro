// ============================================================
// T1 — Vista completa (AI Readiness Assessment)
//
// Layout: header sticky (breadcrumb + progreso + score)
//         + selector de entrevistado
//         + two-column (dimensiones | radar sticky)
//         + executive output (QW1) al final
//
// Novedad Sprint 2:
//   — 6 dimensiones × 4 subdimensiones (escala 0-4)
//   — Selector de entrevistados (IT vs. Negocio)
//   — Estado por entrevistado (scores independientes)
//   — Gap IT/Negocio en T1ExecutiveOutput
// ============================================================

import { useState, useMemo }                  from 'react'
import type { DemoScenario }                  from '@/data/demo/types'
import { DIMENSION_DEFINITIONS, TOTAL_SUBDIMENSIONS } from './constants'
import type { T1DimensionState, T1SubdimensionState } from './types'
import { countScoredSubdimensions, computeOverallScore } from './types'
import { DimensionCard }                      from './components/DimensionCard'
import { T1RadarPanel }                       from './components/T1RadarPanel'
import { T1ExecutiveOutput }                  from './components/T1ExecutiveOutput'
import type { IntervieweeAggregate }          from './components/T1ExecutiveOutput'

interface T1ViewProps {
  scenario: DemoScenario
  onBack:   () => void
}

// ── Builder: T1DimensionState[] desde un entrevistado demo ────

function buildDimensionsForInterviewee(
  intervieweeScores: Record<string, number>,
  intervieweeEvidence: Record<string, string> = {}
): T1DimensionState[] {
  return DIMENSION_DEFINITIONS.map((def) => ({
    code:      def.code,
    label:     def.label,
    dimNumber: def.dimNumber,
    subdimensions: def.subdimensions.map((sub): T1SubdimensionState => ({
      code:          sub.code,
      label:         sub.label,
      dimensionCode: def.code,
      score:         intervieweeScores[sub.code] ?? null,
      evidence:      intervieweeEvidence[sub.code] ?? '',
      showCriteria:  false,
      showEvidence:  !!(intervieweeEvidence[sub.code]),
    })),
  }))
}

// ── Componente principal ──────────────────────────────────────

export function T1View({ scenario, onBack }: T1ViewProps) {

  // Estado por entrevistado: Record<id, T1DimensionState[]>
  const [intervieweeStates, setIntervieweeStates] = useState<Record<string, T1DimensionState[]>>(
    () => Object.fromEntries(
      scenario.interviewees.map((i) => [
        i.id,
        buildDimensionsForInterviewee(i.scores, i.evidence ?? {}),
      ])
    )
  )

  const [activeId, setActiveId] = useState<string>(scenario.interviewees[0]?.id ?? '')

  // Dimensiones activas del entrevistado seleccionado
  const activeDimensions = intervieweeStates[activeId] ?? []

  // Actualizar una dimensión del entrevistado activo
  function updateDimension(updated: T1DimensionState) {
    setIntervieweeStates((prev) => ({
      ...prev,
      [activeId]: prev[activeId].map((d) => d.code === updated.code ? updated : d),
    }))
  }

  // Métricas de progreso del entrevistado activo
  const scoredCount  = useMemo(
    () => countScoredSubdimensions(activeDimensions),
    [activeDimensions]
  )
  const overallScore = useMemo(
    () => computeOverallScore(activeDimensions),
    [activeDimensions]
  )

  // Datos para el gap IT/Negocio en T1ExecutiveOutput
  const allIntervieweeAggregates: IntervieweeAggregate[] = scenario.interviewees.map((i) => ({
    id:         i.id,
    name:       i.name,
    role:       i.role,
    type:       i.type,
    dimensions: intervieweeStates[i.id] ?? [],
  }))

  const activeInterviewee = scenario.interviewees.find((i) => i.id === activeId)

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

          {/* Progreso + score */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-text-subtle tabular-nums">
              <span className="font-semibold text-lean-black dark:text-gray-200">{scoredCount}</span>
              /{TOTAL_SUBDIMENSIONS} subdimensiones puntuadas
            </span>
            <div className="text-right">
              <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                {overallScore.toFixed(1)}
              </span>
              <span className="text-sm font-light text-text-muted"> / 4</span>
            </div>
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
          Selecciona el entrevistado y ajusta los scores en tiempo real. El informe ejecutivo se genera automáticamente.
        </p>
      </div>

      {/* ── Selector de entrevistados ── */}
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            Entrevistado activo
          </span>
          <div className="flex gap-2 flex-wrap">
            {scenario.interviewees.map((person) => {
              const personDims   = intervieweeStates[person.id] ?? []
              const personScored = countScoredSubdimensions(personDims)
              const isActive     = person.id === activeId
              const isComplete   = personScored === TOTAL_SUBDIMENSIONS

              return (
                <button
                  key={person.id}
                  onClick={() => setActiveId(person.id)}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all duration-150',
                    isActive
                      ? 'bg-navy text-white border-navy shadow-sm'
                      : 'bg-white dark:bg-gray-900 border-border hover:border-navy/30 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  {/* Tipo IT / BIZ */}
                  <span className={[
                    'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
                    isActive
                      ? 'bg-white/20 text-white'
                      : person.type === 'it'
                        ? 'bg-navy/10 text-navy dark:bg-navy/20 dark:text-info-soft'
                        : 'bg-success-light text-success-dark',
                  ].join(' ')}>
                    {person.type === 'it' ? 'IT' : 'BIZ'}
                  </span>

                  {/* Nombre + cargo */}
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-lean-black dark:text-gray-100'}`}>
                      {person.name}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
                      {person.role}
                    </p>
                  </div>

                  {/* Progreso */}
                  <span className={`text-[10px] tabular-nums shrink-0 ${isActive ? 'text-white/70' : 'text-text-subtle'}`}>
                    {isComplete ? (
                      <svg className="h-3.5 w-3.5 text-current" viewBox="0 0 16 16" fill="currentColor">
                        <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.78 5.22a.75.75 0 010 1.06l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06L7.25 9.69l3.47-3.47a.75.75 0 011.06 0z" />
                      </svg>
                    ) : (
                      `${personScored}/${TOTAL_SUBDIMENSIONS}`
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Nombre del entrevistado activo (contexto) */}
          {activeInterviewee && (
            <div className="ml-auto flex items-center gap-2 text-xs text-text-muted">
              <span className="text-text-subtle">Puntuando:</span>
              <span className="font-medium text-lean-black dark:text-gray-200">
                {activeInterviewee.name} · {activeInterviewee.archetype}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Layout two-column ── */}
      <div className="max-w-6xl mx-auto px-8 pb-6">
        <div className="flex gap-6 items-start">

          {/* Columna izquierda — 6 DimensionCards */}
          <div className="flex-1 min-w-0 space-y-3">
            {activeDimensions.map((dim) => {
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
            <T1RadarPanel dimensions={activeDimensions} />
          </div>

        </div>

        {/* ── Executive Output (QW1) ── */}
        <div className="mt-8">
          <T1ExecutiveOutput
            dimensions={activeDimensions}
            companyName={scenario.company.name}
            allInterviewees={allIntervieweeAggregates}
          />
        </div>
      </div>
    </div>
  )
}

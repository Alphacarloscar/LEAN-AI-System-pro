// ============================================================
// T1 — DimensionCard
// Tarjeta editable de una dimensión del AI Readiness Assessment.
// Muestra: nombre, descripción, botones de score 1–5,
// descripción del nivel activo, evidencia editable y gap vs target.
// ============================================================

import type { T1DimensionState }   from '../types'
import type { DimensionDefinition } from '../constants'

interface DimensionCardProps {
  state:      T1DimensionState
  definition: DimensionDefinition
  onChange:   (updated: T1DimensionState) => void
}

const SCORE_LABELS_SHORT: Record<number, string> = {
  1: 'Inicial',
  2: 'Explorando',
  3: 'Desarrollando',
  4: 'Avanzado',
  5: 'Líder',
}

export function DimensionCard({ state, definition, onChange }: DimensionCardProps) {
  const gap         = state.target - state.score
  const hasGap      = gap > 0.4
  const recommendation = gap > 0.1
    ? definition.recommendations[Math.min(state.score, 4) as 1|2|3|4]
    : null

  function setScore(score: number) {
    onChange({ ...state, score })
  }

  function setEvidence(evidence: string) {
    onChange({ ...state, evidence })
  }

  // Color del score badge
  const scoreBadgeColor =
    state.score >= 4   ? 'text-success-dark bg-success-light' :
    state.score >= 3   ? 'text-info-dark bg-info-light'       :
    state.score >= 2   ? 'text-warning-dark bg-warning-light' :
                         'text-danger-dark bg-danger-light'

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900 p-5 space-y-4 transition-shadow hover:shadow-sm">

      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">
            {definition.label}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            {definition.description}
          </p>
        </div>
        {/* Score actual + target */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${scoreBadgeColor}`}>
            {state.score.toFixed(1)}
          </span>
          {hasGap && (
            <span className="text-[10px] text-text-subtle tabular-nums">
              → {state.target.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* ── Score buttons 1–5 ── */}
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              onClick={() => setScore(n)}
              title={SCORE_LABELS_SHORT[n]}
              className={[
                'flex-1 h-9 rounded-lg text-sm font-semibold transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-navy/30',
                state.score === n
                  ? 'bg-navy text-white shadow-sm scale-[1.04]'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {n}
            </button>
          ))}
        </div>
        {/* Descripción del nivel activo */}
        <p className="text-xs text-text-muted leading-relaxed bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
          <span className="font-medium text-lean-black dark:text-gray-200">
            {SCORE_LABELS_SHORT[state.score]}:{' '}
          </span>
          {definition.scoreLabels[state.score as 1|2|3|4|5]}
        </p>
      </div>

      {/* ── Evidencia editable ── */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Evidencia
        </label>
        <textarea
          value={state.evidence}
          onChange={(e) => setEvidence(e.target.value)}
          rows={2}
          placeholder="Describe qué observaste que justifica este score…"
          className={[
            'w-full text-xs text-lean-black dark:text-gray-200 leading-relaxed',
            'bg-transparent border border-border rounded-lg px-3 py-2 resize-none',
            'focus:outline-none focus:ring-1 focus:ring-navy/30 focus:border-navy/40',
            'placeholder:text-text-subtle dark:placeholder:text-gray-600',
          ].join(' ')}
        />
      </div>

      {/* ── Recomendación para mejorar ── */}
      {recommendation && (
        <div className="flex gap-2 bg-info-light/40 dark:bg-gray-800/60 rounded-lg px-3 py-2.5">
          <svg className="h-3.5 w-3.5 shrink-0 mt-0.5 text-navy dark:text-info-soft" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 4a.75.75 0 00-1.5 0v3.25H4a.75.75 0 000 1.5h3.25V13a.75.75 0 001.5 0V9.75H12a.75.75 0 000-1.5H8.75V5z" clipRule="evenodd"/>
          </svg>
          <p className="text-[11px] text-navy dark:text-info-soft leading-relaxed">
            <span className="font-semibold">Próximo paso: </span>
            {recommendation}
          </p>
        </div>
      )}
    </div>
  )
}

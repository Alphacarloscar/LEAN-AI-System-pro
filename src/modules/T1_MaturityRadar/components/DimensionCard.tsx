// ============================================================
// T1 — DimensionCard (sección de dimensión con subdimensiones)
//
// Muestra una dimensión principal (D1–D6) con sus 4 subdimensiones.
// Cada subdimensión tiene:
//   — Botones de score 0-4
//   — Criterios expandibles ("Ver criterios")
//   — Nota de apoyo/evidencia (expandible on demand)
// ============================================================

import { useState } from 'react'
import type { T1DimensionState, T1SubdimensionState } from '../types'
import { computeDimensionScore }                      from '../types'
import type { DimensionDefinition }                    from '../constants'
import { SUBDIMENSION_MAP }                            from '../constants'

interface DimensionCardProps {
  state:      T1DimensionState
  definition: DimensionDefinition
  onChange:   (updated: T1DimensionState) => void
}

// Etiquetas cortas para los 5 niveles 0-4
const SCORE_LABELS: Record<number, string> = {
  0: 'Sin evidencia',
  1: 'Inicial',
  2: 'Emergente',
  3: 'Sistemático',
  4: 'Óptimo',
}

// ── Subcomponente: una fila de subdimensión ───────────────────

interface SubdimRowProps {
  sub:        T1SubdimensionState
  dimCode:    string
  onChange:   (updated: T1SubdimensionState) => void
}

function SubdimRow({ sub, onChange }: SubdimRowProps) {
  const def  = SUBDIMENSION_MAP[sub.code]
  const hasScore = sub.score !== null

  // Color del badge de score activo
  const scoreColor = (n: number) =>
    n >= 3   ? 'bg-success-dark text-white' :
    n >= 2   ? 'bg-info-dark text-white'    :
    n >= 1   ? 'bg-warning-dark text-white' :
               'bg-gray-400 text-white'

  function setScore(n: number) {
    // Si ya está activo el mismo score, lo desmarca (null)
    onChange({ ...sub, score: sub.score === n ? null : n })
  }

  return (
    <div className="group">
      {/* ── Fila principal ── */}
      <div className="flex items-start gap-3 py-3">

        {/* Número de subdimensión */}
        <span className="shrink-0 mt-0.5 text-[10px] font-mono font-semibold text-text-subtle w-8">
          {def?.subdimNumber ?? sub.code}
        </span>

        {/* Label + descripción */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-lean-black dark:text-gray-200 leading-snug">
            {sub.label}
          </p>
          {def?.description && (
            <p className="text-[11px] text-text-subtle mt-0.5 leading-snug">
              {def.description}
            </p>
          )}
        </div>

        {/* Botones de score 0-4 */}
        <div className="flex gap-1 shrink-0">
          {([0, 1, 2, 3, 4] as const).map((n) => (
            <button
              key={n}
              onClick={() => setScore(n)}
              title={SCORE_LABELS[n]}
              className={[
                'h-7 w-7 rounded-md text-xs font-semibold transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-navy/30',
                sub.score === n
                  ? `${scoreColor(n)} shadow-sm scale-[1.08]`
                  : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ── Score activo — descripción del nivel ── */}
      {hasScore && (
        <div className="ml-11 mb-1 text-[11px] text-text-muted leading-snug px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-md">
          <span className="font-medium text-lean-black dark:text-gray-300">
            {SCORE_LABELS[sub.score!]}:{' '}
          </span>
          {def?.criteria[sub.score as 0|1|2|3|4] ?? ''}
        </div>
      )}

      {/* ── Controles de expansión ── */}
      <div className="ml-11 flex items-center gap-3 pb-2">
        {/* Ver criterios */}
        <button
          onClick={() => onChange({ ...sub, showCriteria: !sub.showCriteria })}
          className="flex items-center gap-1 text-[10px] font-medium text-navy dark:text-info-soft hover:underline transition-colors"
        >
          <svg
            className={`h-3 w-3 transition-transform duration-150 ${sub.showCriteria ? 'rotate-90' : ''}`}
            viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <path d="M6 12l4-4-4-4" />
          </svg>
          Ver criterios por nivel
        </button>

        {/* Nota de apoyo */}
        <button
          onClick={() => onChange({ ...sub, showEvidence: !sub.showEvidence })}
          className={[
            'flex items-center gap-1 text-[10px] font-medium transition-colors',
            sub.evidence
              ? 'text-success-dark hover:underline'
              : 'text-text-subtle hover:text-text-muted',
          ].join(' ')}
        >
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h12M2 8h8M2 12h10" />
          </svg>
          {sub.evidence ? 'Nota añadida' : 'Añadir nota'}
        </button>
      </div>

      {/* ── Criterios expandidos ── */}
      {sub.showCriteria && def && (
        <div className="ml-11 mb-2 rounded-lg border border-border/60 bg-gray-50 dark:bg-gray-800/40 divide-y divide-border/40 overflow-hidden">
          {([0, 1, 2, 3, 4] as const).map((n) => (
            <div
              key={n}
              className={[
                'flex gap-2.5 px-3 py-1.5 text-[11px] cursor-pointer transition-colors',
                sub.score === n
                  ? 'bg-navy/8 dark:bg-navy/20'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
              ].join(' ')}
              onClick={() => setScore(n)}
            >
              <span className="shrink-0 font-bold text-text-subtle w-3 text-center">{n}</span>
              <span className="text-text-muted leading-relaxed">{def.criteria[n]}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Textarea de evidencia ── */}
      {sub.showEvidence && (
        <div className="ml-11 mb-2">
          <textarea
            value={sub.evidence}
            onChange={(e) => onChange({ ...sub, evidence: e.target.value })}
            rows={2}
            placeholder="Evidencia o nota de apoyo observada en la entrevista…"
            className={[
              'w-full text-[11px] text-lean-black dark:text-gray-200 leading-relaxed',
              'bg-transparent border border-border rounded-lg px-2.5 py-1.5 resize-none',
              'focus:outline-none focus:ring-1 focus:ring-navy/30 focus:border-navy/40',
              'placeholder:text-text-subtle dark:placeholder:text-gray-600',
            ].join(' ')}
          />
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function DimensionCard({ state, definition, onChange }: DimensionCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const dimScore   = computeDimensionScore(state)
  const scoredCount = state.subdimensions.filter((s) => s.score !== null).length

  const scoreBadgeColor =
    dimScore === null       ? 'text-text-subtle bg-gray-100 dark:bg-gray-800' :
    dimScore >= 3           ? 'text-success-dark bg-success-light' :
    dimScore >= 2           ? 'text-info-dark bg-info-light'       :
    dimScore >= 1           ? 'text-warning-dark bg-warning-light' :
                              'text-danger-dark bg-danger-light'

  function updateSubdimension(updated: T1SubdimensionState) {
    onChange({
      ...state,
      subdimensions: state.subdimensions.map((s) =>
        s.code === updated.code ? updated : s
      ),
    })
  }

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden transition-shadow hover:shadow-sm">

      {/* ── Cabecera de dimensión ── */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
      >
        {/* Número D1-D6 */}
        <span className="shrink-0 px-2 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[11px] font-mono font-bold text-navy dark:text-info-soft">
          {definition.dimNumber}
        </span>

        {/* Label + descripción */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-lean-black dark:text-gray-100">
            {definition.label}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5 leading-snug truncate pr-4">
            {definition.description}
          </p>
        </div>

        {/* Score + contador */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-text-subtle tabular-nums">
            {scoredCount}/4
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${scoreBadgeColor}`}>
            {dimScore !== null ? dimScore.toFixed(1) : '—'}
          </span>
          <svg
            className={`h-3.5 w-3.5 text-text-subtle transition-transform duration-150 ${isCollapsed ? '-rotate-90' : ''}`}
            viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      </button>

      {/* ── Subdimensiones ── */}
      {!isCollapsed && (
        <div className="px-5 divide-y divide-border/50">
          {state.subdimensions.map((sub) => (
            <SubdimRow
              key={sub.code}
              sub={sub}
              dimCode={state.code}
              onChange={updateSubdimension}
            />
          ))}
        </div>
      )}
    </div>
  )
}

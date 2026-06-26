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
import { Button, FormField } from '@/shared/design-system/components'
import type { T1DimensionState, T1SubdimensionState } from '../types'
import { computeDimensionScore, maturityHex, maturityTextOnBg } from '../types'
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

  // Gradiente warm-700→gold: 0 = #4A4740 (track barra progreso), 4 = #C8860A (gold)
  const scoreActiveBg = (n: number): string => {
    const t = n / 4
    const r = Math.round(74  + (200 - 74)  * t)
    const g = Math.round(71  + (134 - 71)  * t)
    const b = Math.round(64  + (10  - 64)  * t)
    return `rgb(${r},${g},${b})`
  }
  const scoreActiveText = () => '#FFFFFF'

  function setScore(n: number) {
    // Si ya está activo el mismo score, lo desmarca (null)
    onChange({ ...sub, score: sub.score === n ? null : n })
  }

  return (
    <div className="group">
      {/* ── Fila principal ── */}
      <div className="flex items-start gap-3 py-3">

        {/* Número de subdimensión */}
        <span className="shrink-0 mt-0.5 text-[10px] font-mono font-semibold text-text-muted w-8">
          {def?.subdimNumber ?? sub.code}
        </span>

        {/* Label + descripción */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-lean-black dark:text-warm-100 leading-snug">
            {sub.label}
          </p>
          {def?.description && (
            <p className="text-[11px] text-text-muted mt-0.5 leading-snug line-clamp-2">
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
                'focus:outline-none focus:ring-2 focus:ring-gold/40',
                sub.score === n
                  ? 'shadow-sm scale-[1.08]'
                  : 'bg-warm-100 dark:bg-warm-700 text-text-muted hover:bg-warm-200 dark:hover:bg-warm-600',
              ].join(' ')}
              style={sub.score === n ? { backgroundColor: scoreActiveBg(n), color: scoreActiveText() } : undefined}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ── Score activo — descripción del nivel ── */}
      {hasScore && (
        <div className="ml-11 mb-1 text-[11px] text-text-muted leading-snug px-2 py-1 bg-warm-50 dark:bg-warm-700/50 rounded-md">
          <span className="font-medium text-lean-black dark:text-warm-200">
            {SCORE_LABELS[sub.score!]}:{' '}
          </span>
          {def?.criteria[sub.score as 0|1|2|3|4] ?? ''}
        </div>
      )}

      {/* ── Controles de expansión ── */}
      <div className="ml-11 flex items-center gap-3 pb-2">
        <Button
          variant="link"
          className="text-[10px]"
          onClick={() => onChange({ ...sub, showCriteria: !sub.showCriteria })}
          icon={
            <svg
              className={`h-3 w-3 transition-transform duration-150 ${sub.showCriteria ? 'rotate-90' : ''}`}
              viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <path d="M6 12l4-4-4-4" />
            </svg>
          }
        >
          Ver criterios por nivel
        </Button>

        <Button
          variant="link"
          className="text-[10px]"
          onClick={() => onChange({ ...sub, showEvidence: !sub.showEvidence })}
          icon={
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M2 8h8M2 12h10" />
            </svg>
          }
        >
          {sub.evidence ? 'Editar nota' : 'Añadir nota'}
        </Button>
      </div>

      {/* ── Criterios expandidos ── */}
      {sub.showCriteria && def && (
        <div className="ml-11 mb-2 rounded-lg border border-border/60 bg-warm-50 dark:bg-warm-700/40 divide-y divide-border/40 overflow-hidden">
          {([0, 1, 2, 3, 4] as const).map((n) => (
            <div
              key={n}
              className={[
                'flex gap-2.5 px-3 py-1.5 text-[11px] cursor-pointer transition-colors',
                sub.score === n
                  ? 'bg-navy/8 dark:bg-navy/20'
                  : 'hover:bg-warm-100 dark:hover:bg-warm-600/50',
              ].join(' ')}
              onClick={() => setScore(n)}
            >
              <span className="shrink-0 font-bold text-text-muted w-3 text-center">{n}</span>
              <span className="text-text-muted leading-relaxed">{def.criteria[n]}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Textarea de evidencia ── */}
      {sub.showEvidence && (
        <div className="ml-11 mb-2">
          <FormField
            id={`evidence-${sub.code}`}
            label="Nota de apoyo"
            multiline
            rows={2}
            value={sub.evidence}
            onChange={(e) => onChange({ ...sub, evidence: e.target.value })}
            placeholder="Evidencia o nota de apoyo observada en la entrevista…"
            className="!text-[11px] leading-relaxed resize-none"
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

  function updateSubdimension(updated: T1SubdimensionState) {
    onChange({
      ...state,
      subdimensions: state.subdimensions.map((s) =>
        s.code === updated.code ? updated : s
      ),
    })
  }

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-warm-800 overflow-hidden transition-shadow hover:shadow-sm">

      {/* ── Cabecera de dimensión ── */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-warm-50/50 dark:hover:bg-warm-700/50 transition-colors"
      >
        {/* Número D1-D6 */}
        <span className="shrink-0 px-2 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[11px] font-mono font-bold text-navy dark:text-warm-100">
          {definition.dimNumber}
        </span>

        {/* Label + descripción */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-lean-black dark:text-warm-50">
            {definition.label}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5 leading-snug truncate pr-4">
            {definition.description}
          </p>
        </div>

        {/* Score + contador */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-text-muted tabular-nums">
            {scoredCount}/4
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums"
            style={{ backgroundColor: maturityHex(dimScore), color: maturityTextOnBg(dimScore) }}
          >
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

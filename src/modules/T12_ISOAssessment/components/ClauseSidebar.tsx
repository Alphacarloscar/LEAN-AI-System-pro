// ============================================================
// ClauseSidebar — Left sidebar with clause tree for T12View
// ============================================================

import { T12_CLAUSE_CONFIG, T12_CLAUSE_ORDER, T12_STATUS_CONFIG } from '../constants'
import type { T12Clause, T12Control, T12Status } from '../types'
import { Card } from '@shared/design-system/components'

function clauseProgress(controls: T12Control[], clause: T12Clause) {
  const subset = controls.filter((c) => c.clause === clause)
  return {
    total:       subset.length,
    aprobado:    subset.filter((c) => c.status === 'aprobado').length,
    pendiente:   subset.filter((c) => c.status === 'pendiente_revision').length,
    en_progreso: subset.filter((c) => c.status === 'en_progreso').length,
    pct:         subset.length
      ? Math.round((subset.filter((c) => c.status === 'aprobado').length / subset.length) * 100)
      : 0,
  }
}

interface ClauseSidebarProps {
  controls: T12Control[]
  active:   T12Clause
  onSelect: (c: T12Clause) => void
}

export function ClauseSidebar({ controls, active, onSelect }: ClauseSidebarProps) {
  const total    = controls.length
  const approved = controls.filter((c) => c.status === 'aprobado').length
  const globalPct = Math.round((approved / total) * 100)

  return (
    <aside className="w-56 shrink-0 flex flex-col gap-1">

      {/* Progreso global */}
      <Card variant="outlined" padding="none" className="rounded-xl px-4 py-3 mb-2">
        <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
          Progreso global
        </p>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-bold text-lean-black dark:text-warm-50 tabular-nums leading-none">
            {globalPct}%
          </span>
          <span className="text-[10px] text-text-subtle mb-0.5">aprobado</span>
        </div>
        {/* Barra multi-estado */}
        <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex">
          {(['aprobado', 'pendiente_revision', 'en_progreso'] as T12Status[]).map((s) => {
            const count = controls.filter((c) => c.status === s).length
            const pct   = (count / total) * 100
            if (pct === 0) return null
            return (
              <div
                key={s}
                style={{ width: `${pct}%`, backgroundColor: T12_STATUS_CONFIG[s].hex }}
                className="h-full transition-all duration-500"
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-text-subtle">{approved}/{total} controles</span>
          <span className="text-[9px] text-text-subtle">
            {controls.filter((c) => c.status === 'pendiente_revision').length} en revisión
          </span>
        </div>
      </Card>

      {/* Lista de cláusulas */}
      {T12_CLAUSE_ORDER.map((clause) => {
        const cfg  = T12_CLAUSE_CONFIG[clause]
        const prog = clauseProgress(controls, clause)
        const isActive = clause === active

        return (
          <button
            key={clause}
            onClick={() => onSelect(clause)}
            className={[
              'w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-150',
              isActive
                ? 'border-transparent shadow-sm'
                : 'border-border bg-white dark:bg-gray-900 hover:border-border-hover hover:bg-gray-50 dark:hover:bg-gray-800/50',
            ].join(' ')}
            style={isActive ? {
              backgroundColor: cfg.hex + '12',
              borderColor:     cfg.hex + '40',
            } : {}}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-4 w-4 rounded text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cfg.hex }}
                >
                  {cfg.number}
                </span>
                <span className={`text-[11px] font-semibold ${isActive ? 'text-lean-black dark:text-warm-50' : 'text-text-muted'}`}>
                  {cfg.shortLabel}
                </span>
              </div>
              <span className="text-[9px] font-mono text-text-subtle">
                {prog.aprobado}/{prog.total}
              </span>
            </div>
            {/* Mini barra */}
            <div className="h-1 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex">
              {prog.aprobado > 0 && (
                <div
                  style={{ width: `${prog.pct}%`, backgroundColor: cfg.hex }}
                  className="h-full transition-all duration-500"
                />
              )}
              {prog.pendiente > 0 && (
                <div
                  style={{ width: `${(prog.pendiente / prog.total) * 100}%`, backgroundColor: '#6A90C0' }}
                  className="h-full transition-all duration-500"
                />
              )}
              {prog.en_progreso > 0 && (
                <div
                  style={{ width: `${(prog.en_progreso / prog.total) * 100}%`, backgroundColor: '#D4A85C' }}
                  className="h-full transition-all duration-500"
                />
              )}
            </div>
          </button>
        )
      })}
    </aside>
  )
}

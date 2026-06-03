// ObjetivosTab — objetivos por fase del sprint LEAN

import { useState } from 'react'
import type { T11PhaseObjective } from '../types'

const PHASE_COLORS: Record<string, string> = {
  listen:      '#6A90C0',
  enable:      '#7C3AED',
  accelerate:  '#D4A85C',
  normalize:   '#5FAF8A',
  scale:       '#C8860A',
}

export function ObjetivosTab({ objectives }: { objectives: T11PhaseObjective[] }) {
  const [active, setActive] = useState<string>(objectives[0]?.phase ?? 'listen')
  const current = objectives.find((o) => o.phase === active)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {objectives.map((o) => {
          const color    = PHASE_COLORS[o.phase]
          const isActive = active === o.phase
          return (
            <button
              key={o.phase}
              onClick={() => setActive(o.phase)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                isActive
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-warm-600 text-text-muted dark:text-warm-200 border-border dark:border-warm-500 hover:border-border'
              }`}
              style={isActive ? { backgroundColor: color, borderColor: color } : {}}
            >
              <span className="font-mono">{o.phaseLabel}</span>
              <span className="ml-2 opacity-70 font-normal">{o.sprintRange}</span>
            </button>
          )
        })}
      </div>

      {current && (
        <div className="rounded-2xl border border-border dark:border-warm-500 bg-white dark:bg-warm-600 overflow-hidden">
          <div className="px-6 py-4" style={{ backgroundColor: PHASE_COLORS[current.phase] + '18' }}>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono text-white" style={{ backgroundColor: PHASE_COLORS[current.phase] }}>
                {current.phaseLabel}
              </span>
              <span className="text-sm font-semibold text-lean-black dark:text-warm-50">{current.sprintRange}</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">Objetivos del periodo</p>
              <ol className="space-y-2 list-decimal list-inside">
                {current.objectives.map((obj) => (
                  <li key={obj} className="text-xs text-text-muted dark:text-warm-200 leading-relaxed">{obj}</li>
                ))}
              </ol>
            </div>

            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">Eventos clave</p>
              <ul className="space-y-1.5">
                {current.keyEvents.map((e) => (
                  <li key={e} className="flex items-start gap-2 text-xs text-text-muted dark:text-warm-200">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: PHASE_COLORS[current.phase] }} />
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">Datos necesarios</p>
              <ul className="space-y-1.5">
                {current.dataNeeded.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs text-text-muted dark:text-warm-200">
                    <span className="font-mono text-[10px] shrink-0" style={{ color: PHASE_COLORS[current.phase] }}>→</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

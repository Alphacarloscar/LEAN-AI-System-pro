// ============================================================
// T5 — ActivationSequence
//
// Secuencia horizontal de tarjetas mostrando el orden
// recomendado de activación de los dominios IA.
// ============================================================

import { T5_DOMAIN_CONFIG, T5_RECOMMENDATION_CONFIG } from '../constants'
import { Card }                                        from '@shared/design-system/components'
import type { T5Canvas, T5DomainCode }                 from '../types'

interface ActivationSequenceProps {
  canvas:      T5Canvas
  onCardClick: (code: T5DomainCode) => void
}

export function ActivationSequence({ canvas, onCardClick }: ActivationSequenceProps) {
  return (
    <Card variant="outlined" padding="none" className="rounded-2xl p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
        Secuencia de activación recomendada
      </p>
      <p className="text-[10px] text-text-subtle mb-4">
        Haz clic en cada dominio para ver los proyectos y procesos identificados
      </p>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {canvas.activationSequence.map((code, idx) => {
          const d = canvas.domains[code]
          if (!d) return null
          const domCfg  = T5_DOMAIN_CONFIG[code]
          const recCfg  = T5_RECOMMENDATION_CONFIG[d.recommendation]
          if (!domCfg || !recCfg) return null
          const isLast  = idx === canvas.activationSequence.length - 1
          return (
            <div key={code} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onCardClick(code)}
                className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3 min-w-[155px]
                  hover:border-navy/30 hover:bg-navy/4 transition-all duration-150 text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: recCfg.hex }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm">{domCfg.icon}</span>
                  <span className="text-[11px] font-semibold text-lean-black dark:text-gray-200 leading-tight truncate">
                    {domCfg.label}
                  </span>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${recCfg.badgeBg} ${recCfg.badgeText}`}>
                  {recCfg.actionLabel}
                </span>
                <p className="text-[9px] text-text-subtle mt-1.5 tabular-nums">
                  {d.priorityScore}/100
                  {d.useCaseCount > 0 && <> · {d.useCaseCount} caso{d.useCaseCount > 1 ? 's' : ''}</>}
                </p>
                <p className="text-[9px] text-text-subtle/60 mt-0.5 group-hover:text-navy/50 transition-colors">
                  Ver proyectos →
                </p>
              </button>
              {!isLast && <span className="text-text-subtle text-sm shrink-0">→</span>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

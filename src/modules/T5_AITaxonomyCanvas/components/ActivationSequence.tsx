// ============================================================
// T5 — ActivationSequence
//
// Secuencia horizontal de tarjetas mostrando el orden
// recomendado de activación de los dominios IA.
// ============================================================

import { Network, Cpu, MessageSquare, TrendingUp, Settings, RefreshCw, type LucideIcon } from 'lucide-react'
import { T5_DOMAIN_CONFIG, T5_RECOMMENDATION_CONFIG }                                    from '../constants'
import { Card }                                                                          from '@shared/design-system/components'
import type { T5Canvas, T5DomainCode }                                                   from '../types'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  network:        Network,
  cpu:            Cpu,
  'message-square': MessageSquare,
  'trending-up':  TrendingUp,
  settings:       Settings,
  'refresh-cw':   RefreshCw,
}

interface ActivationSequenceProps {
  canvas:      T5Canvas
  onCardClick: (code: T5DomainCode) => void
}

export function ActivationSequence({ canvas, onCardClick }: ActivationSequenceProps) {
  return (
    <Card variant="outlined" padding="none" className="rounded-xl p-5">
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
          const Icon    = DOMAIN_ICONS[domCfg.icon]
          return (
            <div key={code} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onCardClick(code)}
                className="rounded-xl px-4 py-3 min-w-[165px] transition-all duration-150 text-left group"
                style={{
                  border:          `1.5px solid ${hexToRgba(recCfg.hex, 0.4)}`,
                  backgroundColor: hexToRgba(recCfg.hex, 0.07),
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: recCfg.hex }}
                  >
                    {idx + 1}
                  </span>
                  {Icon && (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: 'var(--color-warm-200)',
                        color:           'var(--color-warm-500)',
                      }}
                    >
                      <Icon size={12} strokeWidth={1.5} aria-label={domCfg.label} />
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-lean-black dark:text-warm-100 leading-tight truncate">
                    {domCfg.label}
                  </span>
                </div>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: recCfg.hex }}>
                  Recomendación
                </p>
                <span
                  className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold"
                  style={{
                    backgroundColor: recCfg.hex + '22',
                    color:           recCfg.hex,
                    border:          `1px solid ${recCfg.hex}55`,
                  }}
                >
                  {recCfg.actionLabel}
                </span>
                <p className="text-[10px] text-text-muted mt-2 tabular-nums">
                  {d.priorityScore}/100
                  {d.useCaseCount > 0 && <> · {d.useCaseCount} caso{d.useCaseCount > 1 ? 's' : ''}</>}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5 group-hover:text-navy dark:group-hover:text-warm-200 transition-colors">
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

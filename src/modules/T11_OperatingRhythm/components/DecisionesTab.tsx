// DecisionesTab — matriz de decisiones y escalada por nivel
// Incluye DecisionCard (tarjeta individual de decisión)

import { T11_LEVEL_CONFIG } from '../constants'
import type { T11DecisionNode, T11Level } from '../types'
import { Card } from '@shared/design-system/components'

// ── DecisionCard ──────────────────────────────────────────────

function DecisionCard({ node }: { node: T11DecisionNode }) {
  const lcfg = T11_LEVEL_CONFIG[node.level]

  return (
    <div className={`rounded-xl border ${lcfg.border} bg-white dark:bg-warm-600 overflow-hidden`}>
      <div className={`px-4 py-3 ${lcfg.bg}`}>
        <div className="flex items-start gap-2">
          <span className={`text-[9px] font-mono font-bold shrink-0 mt-0.5 ${lcfg.bgText}`}>TRIGGER</span>
          <p className="text-xs font-semibold text-lean-black dark:text-warm-50 leading-snug">{node.trigger}</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-0.5">Decisión</p>
          <p className="text-[11px] text-lean-black dark:text-warm-100">{node.decision}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Owner',    value: node.owner },
            { label: 'Valida',   value: node.validator },
            { label: 'Escala a', value: node.escalateTo },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-0.5">{item.label}</p>
              <p className="text-[11px] text-text-muted dark:text-warm-200">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <svg className="h-3 w-3 text-text-subtle shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5l2 1.5" />
          </svg>
          <p className="text-[10px] text-text-subtle">
            Plazo: <span className="font-medium text-text-muted dark:text-warm-200">{node.timeline}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── DecisionesTab ─────────────────────────────────────────────

export function DecisionesTab({ decisions }: { decisions: T11DecisionNode[] }) {
  const levels: T11Level[] = ['team', 'program', 'direction']

  return (
    <div className="space-y-8">
      {levels.map((level) => {
        const lvDecisions = decisions.filter((d) => d.level === level)
        if (!lvDecisions.length) return null
        const lcfg = T11_LEVEL_CONFIG[level]

        return (
          <div key={level}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                {lcfg.label}
              </div>
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lvDecisions.map((node) => (
                <DecisionCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        )
      })}

      <Card variant="flat" padding="none" className="rounded-xl border border-border dark:border-warm-500 bg-surface dark:bg-warm-800 px-5 py-4">
        <p className="text-[11px] text-text-subtle dark:text-warm-300 leading-relaxed">
          <span className="font-semibold text-text-muted dark:text-warm-200">Nota sobre escalada:</span> Si un decisor no está disponible en el plazo indicado, la decisión escala automáticamente al nivel superior. Ninguna decisión debe quedar bloqueada más de 2× el plazo base.
        </p>
      </Card>
    </div>
  )
}

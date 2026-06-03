// ── PlanPhaseCard — reutilizable para LLM y estático ─────────

import type { GeneratedChangePlanPhase } from '../types'

export function PlanPhaseCard({ step }: { step: GeneratedChangePlanPhase }) {
  return (
    <div className="rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 text-center">
          <div className="text-2xl">{step.icon}</div>
          <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-navy/10 dark:bg-navy/20 text-navy dark:text-warm-100">
            {step.phase}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lean-black dark:text-gray-100 text-sm">{step.title}</h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{step.objective}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] font-mono text-text-subtle uppercase tracking-wide">Foco:</span>
            {step.segments.map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-text-muted font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {step.actions.map((action, j) => (
          <div key={j} className="flex gap-2 items-start">
            <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-navy/10 dark:bg-navy/25 flex items-center justify-center text-[9px] font-bold text-navy dark:text-warm-100">
              {j + 1}
            </span>
            <p className="text-xs text-text-muted leading-relaxed">{action}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-start p-3 rounded-lg bg-danger-light/30 dark:bg-red-900/15 border border-danger-light dark:border-red-800/30">
        <svg className="flex-shrink-0 mt-0.5 w-3.5 h-3.5 text-danger-dark" fill="none" viewBox="0 0 16 16">
          <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M8 7v3M8 12v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-xs text-danger-dark leading-relaxed">{step.risk}</p>
      </div>
    </div>
  )
}

// ── T8 Tab 4: Kit por Departamento ────────────────────────────

import { CHANNEL_CFG } from '../T8Generators'
import type { DeptKit } from '../types'

export function DeptKitTab({ kits }: { kits: DeptKit[] }) {
  const DEPT_COLORS: Record<string, string> = {
    'Dirección General':     '#2A2822',
    'IT / Tecnología':       '#6366F1',
    'Operaciones':           '#F97316',
    'Marketing & Comercial': '#10B981',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {kits.map(kit => {
        const color = DEPT_COLORS[kit.department] ?? '#94A3B8'
        const readinessBg = kit.readiness >= 65 ? 'bg-success-light text-success-dark'
          : kit.readiness >= 35 ? 'bg-warning-light text-warning-dark'
          : 'bg-danger-light text-danger-dark'
        const channelCfg = CHANNEL_CFG[kit.channel]

        return (
          <div key={kit.department} className="rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                <p className="font-semibold text-sm text-lean-black dark:text-gray-100">{kit.department}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${readinessBg}`}>
                  Readiness {kit.readiness}% — {kit.readinessLabel}
                </span>
              </div>
            </div>

            {/* Concern + Approach */}
            <div className="space-y-2.5">
              <div className="flex gap-2 items-start p-3 rounded-lg bg-warning-light/40 border border-warning-light">
                <span className="text-warning-dark text-xs flex-shrink-0 mt-0.5">⚠</span>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-warning-dark mb-0.5">Preocupación principal</p>
                  <p className="text-xs text-warning-dark leading-relaxed">{kit.mainConcern}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border dark:border-white/6">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">Enfoque comunicativo</p>
                <p className="text-xs text-text-muted leading-relaxed">{kit.approach}</p>
              </div>
            </div>

            {/* Ambassadors */}
            {kit.ambassadors.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-text-subtle">Ambassador interno:</span>
                {kit.ambassadors.map(a => (
                  <span key={a} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {a}
                  </span>
                ))}
              </div>
            )}

            {/* Acciones */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">Acciones concretas</p>
              <div className="space-y-2">
                {kit.actions.map((action, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
                      style={{ backgroundColor: color }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs text-text-muted leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Canal recomendado */}
            <div className="flex items-center gap-2 pt-2 border-t border-border dark:border-white/6">
              <span className="text-[10px] font-mono text-text-subtle">Canal principal:</span>
              <span className="text-[10px] font-medium text-text-muted">
                {channelCfg.icon} {channelCfg.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

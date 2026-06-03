// KpisTab — tabla de KPIs por nivel de gobierno

import { T11_LEVEL_CONFIG } from '../constants'
import type { T11KpiGroup } from '../types'

export function KpisTab({ kpiGroups }: { kpiGroups: T11KpiGroup[] }) {
  return (
    <div className="space-y-8">
      {kpiGroups.map((group) => {
        const lcfg = T11_LEVEL_CONFIG[group.level]

        return (
          <div key={group.level}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                {group.label}
              </div>
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
            </div>

            <div className="rounded-xl border border-border dark:border-warm-500 bg-white dark:bg-warm-600 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-warm-500">
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">KPI</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle hidden sm:table-cell">Cómo se calcula</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Fuente</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Frecuencia</th>
                  </tr>
                </thead>
                <tbody>
                  {group.kpis.map((kpi, i) => (
                    <tr key={kpi.name} className={`border-b border-border/50 dark:border-warm-500/50 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-warm-700/30'}`}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-lean-black dark:text-warm-50">{kpi.name}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-[11px] text-text-muted dark:text-warm-300 font-mono">{kpi.formula}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: lcfg.hex }}>
                          {kpi.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] text-text-subtle dark:text-warm-300">{kpi.cadence}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { useMemo } from 'react'
import { STATUS_CONFIG, ROADMAP_QUARTERS, computeROIFromEconomics } from '../constants'
import { priorityScoreColor, fmtEur } from './T4Badges.constants'
import { Card } from '@shared/design-system/components'
import type { UseCase } from '../types'

export function QuarterlyRoadmap({
  useCases,
  activeId,
  onSelect,
}: {
  useCases: UseCase[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const byQuarter = useMemo(() => {
    const map = new Map<string, UseCase[]>()
    ROADMAP_QUARTERS.forEach((q) => map.set(q, []))
    useCases.forEach((uc) => {
      if (uc.roadmap?.quarter && map.has(uc.roadmap.quarter)) {
        map.get(uc.roadmap.quarter)!.push(uc)
      }
    })
    return map
  }, [useCases])

  const quartersToShow = useMemo(() => {
    const all      = [...ROADMAP_QUARTERS]
    const used     = all.filter((q) => (byQuarter.get(q)?.length ?? 0) > 0)
    if (used.length === 0) return all.slice(0, 4)
    const lastUsedIdx = all.indexOf(used[used.length - 1])
    return all.slice(0, Math.min(lastUsedIdx + 3, all.length))
  }, [byQuarter])

  const unassigned = useCases.filter((uc) => !uc.roadmap?.quarter)

  return (
    <Card variant="outlined" padding="none" className="rounded-xl px-6 py-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-5">
        Roadmap trimestral — distribución planificada
      </p>

      <div className="flex flex-col divide-y divide-border dark:divide-white/6">
        {quartersToShow.map((quarter) => {
          const cases   = byQuarter.get(quarter) ?? []
          const isEmpty = cases.length === 0
          return (
            <div
              key={quarter}
              className={`flex items-start gap-5 py-4 first:pt-0 last:pb-0 ${isEmpty ? 'opacity-40' : ''}`}
            >
              <div className="shrink-0 w-20 pt-1">
                <p className="text-sm font-bold text-lean-black dark:text-warm-100 tabular-nums">
                  {quarter.split(' ')[0]}
                </p>
                <p className="text-[10px] text-text-subtle tabular-nums">
                  {quarter.split(' ')[1]}
                </p>
                {!isEmpty && (
                  <p className="text-[9px] font-mono text-text-subtle mt-0.5">
                    {cases.length} caso{cases.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-x-auto">
                {isEmpty ? (
                  <div className="flex items-center h-14">
                    <div
                      className="w-full h-px opacity-50"
                      style={{
                        background:
                          'repeating-linear-gradient(to right,#CBD5E1 0,#CBD5E1 5px,transparent 5px,transparent 10px)',
                      }}
                    />
                    <span className="shrink-0 ml-3 text-[10px] text-text-subtle italic">
                      Sin casos asignados
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2.5 pb-0.5">
                    {cases.map((uc) => {
                      const isActive  = uc.id === activeId
                      const statusCfg = STATUS_CONFIG[uc.status]
                      const roi       = uc.economics ? computeROIFromEconomics(uc.economics) : null
                      return (
                        <button
                          key={uc.id}
                          onClick={() => onSelect(uc.id)}
                          className={[
                            'shrink-0 w-52 text-left rounded-xl border px-3 py-2.5 transition-all duration-150',
                            isActive
                              ? 'border-navy/40 bg-navy/5 dark:bg-navy/10 ring-1 ring-navy/20 shadow-sm'
                              : 'border-border dark:border-white/8 bg-white dark:bg-warm-900 hover:border-navy/30 hover:shadow-sm',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold
                              ${statusCfg.badgeBg} ${statusCfg.badgeText}`}
                            >
                              {statusCfg.label}
                            </span>
                            <span
                              className={`text-sm font-bold tabular-nums ${priorityScoreColor(uc.priorityScore)}`}
                            >
                              {uc.priorityScore.toFixed(0)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-lean-black dark:text-warm-100 leading-tight line-clamp-2 mb-1">
                            {uc.name}
                          </p>
                          <p className="text-[10px] text-text-subtle truncate">{uc.department}</p>
                          {roi && roi.annualSaving > 0 && (
                            <p className="text-[10px] font-semibold text-success-dark mt-1">
                              {fmtEur(roi.annualSaving)}/año · payback {roi.paybackMonths.toFixed(1)}m
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {unassigned.length > 0 && (
          <div className="flex items-start gap-5 pt-4 opacity-50">
            <div className="shrink-0 w-20 pt-1">
              <p className="text-[10px] font-mono font-bold text-text-subtle">Sin Q</p>
            </div>
            <div className="flex-1 flex gap-2 flex-wrap">
              {unassigned.map((uc) => (
                <button
                  key={uc.id}
                  onClick={() => onSelect(uc.id)}
                  className="shrink-0 text-left rounded-xl border border-dashed border-border
                    dark:border-white/8 bg-warm-50 dark:bg-warm-900/50 px-3 py-2 transition-all
                    hover:border-gray-400 hover:opacity-100"
                >
                  <p className="text-[10px] font-semibold text-text-muted truncate max-w-[160px]">
                    {uc.name}
                  </p>
                  <p className="text-[9px] text-text-subtle">{uc.department}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

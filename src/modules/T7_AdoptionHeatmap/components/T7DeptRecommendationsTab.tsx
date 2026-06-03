// ── Tab 2: Recomendaciones por Departamento ───────────────────

import { useMemo } from 'react'
import { ARCHETYPE_CONFIG } from '@/modules/T2_StakeholderMatrix/constants'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import { getSegment, deptFill, SEG_LABELS } from '../T7Constants'

export function DeptRecommendationsTab({ stakeholders, dark }: { stakeholders: Stakeholder[]; dark: boolean }) {
  const byDept = useMemo(() => {
    const map: Record<string, Stakeholder[]> = {}
    for (const sh of stakeholders) {
      if (!map[sh.department]) map[sh.department] = []
      map[sh.department].push(sh)
    }
    return map
  }, [stakeholders])

  function deptReadiness(deptShs: Stakeholder[]): { label: string; pct: number; color: string } {
    const positives = deptShs.filter(sh => {
      const seg = getSegment(sh.archetype, sh.resistance)
      return seg === 'innovators' || seg === 'early_adopters' || seg === 'early_majority'
    }).length
    const pct = Math.round((positives / deptShs.length) * 100)
    if (pct >= 75) return { label: 'Alta preparación', pct, color: 'text-success-dark bg-success-light' }
    if (pct >= 40) return { label: 'Preparación media', pct, color: 'text-warning-dark bg-warning-light' }
    return { label: 'Preparación baja', pct, color: 'text-danger-dark bg-danger-light' }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Object.entries(byDept).map(([dept, deptShs]) => {
        const fill      = deptFill(dept, dark)
        const readiness = deptReadiness(deptShs)

        const recs = deptShs.flatMap(sh => {
          const arc  = ARCHETYPE_CONFIG[sh.archetype] ?? ARCHETYPE_CONFIG.adoptador
          const tips = arc?.interventions?.[sh.resistance] ?? []
          return tips.slice(0, 2).map(tip => ({ sh, tip }))
        })
        const seen = new Set<string>()
        const uniqueRecs = recs.filter(r => {
          if (seen.has(r.tip)) return false
          seen.add(r.tip)
          return true
        }).slice(0, 3)

        return (
          <div
            key={dept}
            className="rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: fill }} />
                <div>
                  <p className="font-semibold text-sm text-lean-black dark:text-gray-100">{dept}</p>
                  <p className="text-xs text-text-muted">{deptShs.length} stakeholders</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${readiness.color}`}>
                {readiness.label} · {readiness.pct}%
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {deptShs.map(sh => {
                const arcCfg = ARCHETYPE_CONFIG[sh.archetype] ?? ARCHETYPE_CONFIG.adoptador
                const seg    = SEG_LABELS[getSegment(sh.archetype, sh.resistance)]?.label ?? '—'
                return (
                  <div key={sh.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border dark:border-white/6">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                    <span className="text-xs font-medium text-lean-black dark:text-gray-200">{sh.name}</span>
                    <span className={`text-[10px] px-1.5 rounded-full ${arcCfg.badgeBg} ${arcCfg.badgeText}`}>{arcCfg.label}</span>
                    <span className="text-[10px] text-text-subtle font-mono">{seg}</span>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2.5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Acciones recomendadas</p>
              {uniqueRecs.map((r, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span
                    className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: fill }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs text-text-muted leading-relaxed">{r.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

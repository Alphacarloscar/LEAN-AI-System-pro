// ── Condensed Stakeholder Card ────────────────────────────────

import { ARCHETYPE_CONFIG } from '@/modules/T2_StakeholderMatrix/constants'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import type { DotPosition } from '../types'
import { RES_CFG, SEG_LABELS, deptCfg, deptFill } from '../T7Constants'
import { Card } from '@shared/design-system/components'

export function CondensedCard({
  dot, stakeholders, onClose, dark,
}: {
  dot:          DotPosition
  stakeholders: Stakeholder[]
  onClose:      () => void
  dark:         boolean
}) {
  const sh = stakeholders.find(s => s.id === dot.stakeholderId)
  if (!sh) return null

  const arcCfg   = ARCHETYPE_CONFIG[sh.archetype] ?? ARCHETYPE_CONFIG.adoptador
  const resCfg   = RES_CFG[sh.resistance]
  const segLabel = SEG_LABELS[dot.segment]?.label ?? '—'
  const avatarFill = deptFill(sh.department, dark)
  const tip      = arcCfg?.interventions?.[sh.resistance]?.[0] ?? ''
  const initials = sh.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Card variant="outlined" padding="none" className="relative rounded-xl p-5 shadow-sm">
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-text-base hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg leading-none"
      >
        ×
      </button>

      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
          style={{ backgroundColor: avatarFill }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-lean-black dark:text-gray-100 text-sm leading-tight">{sh.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{sh.role}</p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wide text-text-subtle bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
              {segLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${deptCfg(sh.department).badgeBg} ${deptCfg(sh.department).badgeText}`}>
              {sh.department}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${arcCfg.badgeBg} ${arcCfg.badgeText}`}>
              {arcCfg.label}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${resCfg.color}`}>
              {resCfg.label}
            </span>
          </div>

          <div className="mt-3 flex gap-2.5 items-start">
            <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-navy/10 dark:bg-navy/25 flex items-center justify-center text-navy dark:text-warm-100">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <p className="text-xs text-text-muted leading-relaxed">{tip}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

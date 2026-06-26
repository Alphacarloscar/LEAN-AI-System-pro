// ── Tarjeta de Momentum ───────────────────────────────────────

import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import type { RogersSegment } from '../types'
import { getSegment, SEG_LABELS } from '../T7Constants'
import { Card, Badge } from '@shared/design-system/components'

export function MomentumCard({ stakeholders }: { stakeholders: Stakeholder[] }) {
  const total = stakeholders.length
  if (total === 0) return null

  // % en segmentos positivos (innovators + early_adopters + early_majority)
  const positive = stakeholders.filter(sh => {
    const seg = getSegment(sh.archetype, sh.resistance)
    return seg === 'innovators' || seg === 'early_adopters' || seg === 'early_majority'
  }).length
  const momentumPct = Math.round((positive / total) * 100)

  // Nivel de momentum
  const momentumLevel =
    momentumPct >= 65 ? { label: 'Alto', color: 'text-success-dark', bg: 'bg-success-light' }
    : momentumPct >= 40 ? { label: 'Medio', color: 'text-warning-dark', bg: 'bg-warning-light' }
    : { label: 'Bajo', color: 'text-danger-dark', bg: 'bg-danger-light' }

  // Riesgo principal: stakeholders con resistencia alta
  const highResistance = stakeholders.filter(sh => sh.resistance === 'alta')
  const topRisk = highResistance.length > 0
    ? `${highResistance.length} stakeholder${highResistance.length > 1 ? 's' : ''} con resistencia alta`
    : 'Sin resistencia crítica detectada'

  // Oportunidad: ambassadors / adoptadores con resistencia baja-media
  const ambassadors = stakeholders.filter(sh =>
    (sh.archetype === 'ambassador' || sh.archetype === 'adoptador') && sh.resistance !== 'alta'
  )
  const topOpp = ambassadors.length > 0
    ? `${ambassadors.length} agente${ambassadors.length > 1 ? 's' : ''} de cambio activos disponibles`
    : 'Identificar nuevos early adopters internos'

  // Segmento con más concentración
  const segCount: Partial<Record<RogersSegment, number>> = {}
  for (const sh of stakeholders) {
    const seg = getSegment(sh.archetype, sh.resistance)
    segCount[seg] = (segCount[seg] ?? 0) + 1
  }
  const topSeg = (Object.entries(segCount) as [RogersSegment, number][])
    .sort((a, b) => b[1] - a[1])[0]
  const topSegLabel = topSeg ? SEG_LABELS[topSeg[0]].label : '—'

  const momentumVariant = momentumPct >= 65 ? 'success' : momentumPct >= 40 ? 'warning' : 'danger'

  return (
    <Card variant="outlined" padding="none" className="w-52 flex-shrink-0 rounded-xl p-4 space-y-4">
      {/* Momentum score */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">Momentum</p>
        <div className="flex items-end gap-1.5 mb-1.5">
          <span className="text-2xl font-bold text-lean-black dark:text-warm-50 tabular-nums leading-none">
            {momentumPct}%
          </span>
          <Badge variant={momentumVariant} size="xs" className="mb-0.5">
            {momentumLevel.label}
          </Badge>
        </div>
        {/* Barra de progreso */}
        <div className="h-1.5 rounded-full bg-warm-100 dark:bg-warm-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${momentumPct}%`,
              backgroundColor: momentumPct >= 65 ? '#5FAF8A' : momentumPct >= 40 ? '#D4A85C' : '#C06060',
            }}
          />
        </div>
        <p className="text-[10px] text-text-subtle mt-1.5">
          Concentración: <span className="font-medium text-text-muted">{topSegLabel}</span>
        </p>
      </div>

      <div className="border-t border-border dark:border-white/6" />

      {/* Riesgo */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">Riesgo principal</p>
        <div className="flex gap-2 items-start">
          <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-danger-light flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1L1 7h6L4 1z" stroke="#C06060" strokeWidth="1.2" strokeLinejoin="round"/>
              <circle cx="4" cy="5.5" r="0.4" fill="#C06060"/>
            </svg>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">{topRisk}</p>
        </div>
      </div>

      <div className="border-t border-border dark:border-white/6" />

      {/* Oportunidad */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">Oportunidad</p>
        <div className="flex gap-2 items-start">
          <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-success-light flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4.5l2 2 3-3.5" stroke="#5FAF8A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">{topOpp}</p>
        </div>
      </div>
    </Card>
  )
}

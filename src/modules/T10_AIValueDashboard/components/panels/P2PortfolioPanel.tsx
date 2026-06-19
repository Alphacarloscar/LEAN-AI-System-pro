// P2 — T4 Portfolio IA (Featured)

import { StatusBar }      from '../StatusBar'
import { MetricChip }     from '../MetricChip'
import { NavButton }      from '../NavButton'
import { ExpandedSection } from '../ExpandedSection'
import { HeroMetric }     from '../HeroMetric'
import { PanelCard }      from '../PanelCard'
import { Badge }          from '@shared/design-system/components'

interface P2Props {
  t4data: {
    totalInitiatives: number
    totalInvestment:  number
    ahorroAnual:      number
    paybackMeses:     number
    roi3years:        number
    roi:              number
    statuses:         { active: number; validating: number; backlog: number; stopped: number }
    topInitiatives:   Array<{ name: string; status: string; value: number }>
  }
  segments:   Array<{ pct: number; color: string; label: string }>
  expanded:   boolean
  onToggle:   () => void
  onNavigate: (path: string) => void
}

export function P2PortfolioPanel({ t4data, segments, expanded, onToggle, onNavigate }: P2Props) {
  return (
    <PanelCard
      id="p2" featured expanded={expanded} onClick={onToggle}
      tag="T4 · Portfolio IA  ★" tagColor="success"
      title="Iniciativas activas" subtitle={`${t4data.totalInitiatives} iniciativas · ${t4data.statuses.active} activas`}
      animDelay={80}
      heroSlot={<HeroMetric label="Inversión total" value={t4data.totalInvestment > 0 ? `€${(t4data.totalInvestment / 1000).toFixed(0)}K` : '—'} />}
    >
      <StatusBar segments={segments} />
      <div className="flex gap-2 mt-3">
        <MetricChip label="Ahorro anual est." value={t4data.ahorroAnual > 0 ? `€${(t4data.ahorroAnual / 1000).toFixed(0)}K` : '—'} valueColor="var(--color-success)" />
        <MetricChip label="Payback promedio"  value={t4data.paybackMeses > 0 ? `${t4data.paybackMeses} meses` : '—'} />
        <MetricChip label="ROI 3 años"        value={t4data.roi3years > 0 ? `${t4data.roi3years}%` : '—'} valueColor="var(--color-gold)" />
      </div>

      {expanded && (
        <ExpandedSection>
          <div className="space-y-1.5 mb-3">
            {t4data.topInitiatives.length > 0
              ? t4data.topInitiatives.map((ini, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="text-text-primary dark:text-warm-100 flex-1 truncate">{ini.name}</span>
                    <Badge
                      variant={ini.status === 'active' ? 'success' : 'warning'}
                      size="xs"
                      className="shrink-0"
                    >
                      {ini.status === 'active' ? 'Activa' : 'Validando'}
                    </Badge>
                    <span className="text-text-muted dark:text-warm-300 tabular-nums flex-shrink-0">
                      €{(ini.value / 1000).toFixed(0)}K
                    </span>
                  </div>
                ))
              : <p className="text-[11px] text-text-muted dark:text-warm-300">Sin iniciativas priorizadas aún</p>
            }
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-text-muted dark:text-warm-300">ROI estimado:</span>
            <span className="text-[10px] font-semibold text-success-dark">{t4data.roi > 0 ? `${t4data.roi}x retorno` : '—'}</span>
          </div>
          <NavButton label="Abrir T4 Portfolio" onClick={() => onNavigate('/t4')} />
        </ExpandedSection>
      )}
    </PanelCard>
  )
}

// P5 — T6+T12 Riesgo + ISO 42001

import { AlertTriangle } from 'lucide-react'
import { DonutChart }      from '../DonutChart'
import { NavButton }       from '../NavButton'
import { ExpandedSection } from '../ExpandedSection'
import { HeroMetric }      from '../HeroMetric'
import { PanelCard }       from '../PanelCard'

interface P5Props {
  p5data: {
    isoCompliance: number
    risks:         { high: number; medium: number; low: number; total: number }
    hasData:       boolean
  }
  riskSegments: Array<{ pct: number; color: string }>
  shadowAIPct:  { pct: number; total: number; withTools: number } | null
  expanded:     boolean
  onToggle:     () => void
  onNavigate:   (path: string) => void
}

export function P5RiskPanel({ p5data, riskSegments, shadowAIPct, expanded, onToggle, onNavigate }: P5Props) {
  return (
    <PanelCard
      id="p5" expanded={expanded} onClick={onToggle}
      tag="T6 + T12 · Riesgos" tagColor="danger"
      title="Riesgo + ISO 42001"
      subtitle={p5data.risks.total > 0 || p5data.isoCompliance > 0
        ? `${p5data.risks.total} casos mapeados · ${p5data.isoCompliance}% ISO`
        : 'Pendiente de mapeo'}
      animDelay={320}
      heroSlot={<HeroMetric
        label="ISO 42001"
        value={p5data.isoCompliance > 0 ? `${p5data.isoCompliance}%` : '—'}
        colorScore={p5data.isoCompliance > 0 ? p5data.isoCompliance : undefined}
      />}
    >
      {p5data.hasData ? (
        <>
          <div className="flex items-center gap-3">
            <DonutChart segments={riskSegments} size={60} strokeWidth={12} centerLabel={`${p5data.risks.total}`} />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-danger" />
                <span className="text-text-muted dark:text-warm-300 flex-1">Alto</span>
                <span className="font-semibold text-danger-dark dark:text-danger">{p5data.risks.high}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-warning" />
                <span className="text-text-muted dark:text-warm-300 flex-1">Medio</span>
                <span className="font-medium text-warning-dark dark:text-warning">{p5data.risks.medium}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-success" />
                <span className="text-text-muted dark:text-warm-300 flex-1">Bajo</span>
                <span className="font-medium text-success-dark">{p5data.risks.low}</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-text-muted dark:text-warm-300">ISO 42001 cumplimiento</span>
              <span className="text-[10px] font-semibold text-gold">{p5data.isoCompliance}%</span>
            </div>
            <div className="h-[5px] rounded-full bg-border dark:bg-warm-500">
              <div className="h-full rounded-full bg-gold" style={{ width: `${p5data.isoCompliance}%` }} />
            </div>
          </div>
          {shadowAIPct !== null && (
            <div className="mt-3 pt-3 border-t border-border dark:border-white/10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <AlertTriangle size={12} strokeWidth={1.75} className="text-gold" />
                  <span className="text-[10px] text-text-muted dark:text-warm-300">Shadow AI</span>
                </div>
                <span className={`text-[10px] font-semibold tabular-nums ${shadowAIPct.pct > 0 ? 'text-gold' : 'text-text-muted'}`}>
                  {shadowAIPct.pct}%
                </span>
              </div>
              <div className="h-[5px] rounded-full bg-border dark:bg-warm-500 overflow-hidden">
                <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${shadowAIPct.pct}%` }} />
              </div>
              <p className="text-[9px] text-text-subtle mt-1">
                {shadowAIPct.withTools} de {shadowAIPct.total} perfiles declaran herramientas externas
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-[11px] text-text-muted dark:text-warm-300 py-2">
          Completa T4 (casos de uso) y T12 (ISO 42001) para ver el mapa de riesgo real del proyecto.
        </p>
      )}

      {expanded && (
        <ExpandedSection>
          <div className="flex items-center gap-3">
            <NavButton label="Abrir T6 Riesgos" onClick={() => onNavigate('/t6')} />
            <NavButton label="Abrir T12 ISO"    onClick={() => onNavigate('/t12')} secondary />
          </div>
        </ExpandedSection>
      )}
    </PanelCard>
  )
}

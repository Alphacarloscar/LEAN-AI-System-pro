// P1 — T1 Madurez IA

import type { RadarDimension } from '@/shared/components/charts/LeanRadarChart'
import { DimBar }         from '../DimBar'
import { NavButton }      from '../NavButton'
import { ExpandedSection } from '../ExpandedSection'
import { HeroMetric }     from '../HeroMetric'
import { PanelCard }      from '../PanelCard'

interface P1Props {
  radar:         RadarDimension[]
  avg:           number
  tier:          string
  weakest:       string
  breakdown:     {
    itAvg:           number
    bizAvg:          number
    gapPts:          number
    gapSign?:        string
    interviewsCount: number
  }
  expanded:      boolean
  onToggle:      () => void
  onNavigate:    (path: string) => void
}

export function P1MaturityPanel({
  radar, avg, tier, weakest, breakdown, expanded, onToggle, onNavigate,
}: P1Props) {
  return (
    <PanelCard
      id="p1" expanded={expanded} onClick={onToggle}
      tag="T1 · Readiness" tagColor="warning"
      title="Madurez IA" subtitle={`${radar.length} dimensiones · Score ${avg}/4`}
      animDelay={0}
      heroSlot={<HeroMetric label="Madurez IA" value={avg.toFixed(1)} colorScore={(avg / 4) * 100} />}
    >
      <div className="space-y-[5px]">
        {radar.slice(0, 4).map(dim => (
          <DimBar key={dim.dimension} label={dim.dimension} value={dim.current} max={4} color="#C8860A" />
        ))}
        {radar.length > 4 && (
          <p className="text-[10px] text-text-subtle dark:text-warm-400 pt-0.5">+{radar.length - 4} más</p>
        )}
      </div>

      {expanded && (
        <ExpandedSection>
          {breakdown.interviewsCount > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-center">
                  <p className="text-[10px] text-text-muted dark:text-warm-300">IT (avg)</p>
                  <p className="text-xl font-semibold text-gold tabular-nums">{breakdown.itAvg}</p>
                </div>
                <div className="flex-1 relative mx-1">
                  <div className="h-1.5 bg-border dark:bg-warm-500 rounded-full overflow-hidden">
                    <div className="absolute left-0 top-0 h-full rounded-full bg-gold"
                      style={{ width: `${(breakdown.itAvg / 4) * 100}%` }} />
                  </div>
                  <div className="h-1.5 bg-border dark:bg-warm-500 rounded-full overflow-hidden mt-1">
                    <div className="absolute left-0 top-0 h-full rounded-full bg-info"
                      style={{ width: `${(breakdown.bizAvg / 4) * 100}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-text-muted dark:text-warm-300">Negocio (avg)</p>
                  <p className="text-xl font-semibold text-info-dark dark:text-info tabular-nums">{breakdown.bizAvg}</p>
                </div>
              </div>
              <p className="text-[10px] text-text-muted dark:text-warm-300 mb-2">
                → {breakdown.gapSign} +{breakdown.gapPts} pts
              </p>
            </>
          ) : (
            <p className="text-[10px] text-text-muted dark:text-warm-300 mb-2">
              Sin entrevistas registradas aún — abre T1 para añadir la primera.
            </p>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${avg < 2 ? 'bg-warning-light text-warning-dark' : 'bg-info-light text-info-dark'}`}>{tier}</span>
            <span className="text-[10px] text-text-muted dark:text-warm-300">
              Nº entrevistas: <span className="font-semibold text-lean-black dark:text-warm-50">{breakdown.interviewsCount}</span>
            </span>
          </div>
          <p className="text-[10px] text-text-muted dark:text-warm-300 mb-2">
            Área más débil: <span className="font-medium text-lean-black dark:text-warm-100">{weakest || '—'}</span>
          </p>
          <NavButton label="Abrir T1 Assessment" onClick={() => onNavigate('/t1')} />
        </ExpandedSection>
      )}
    </PanelCard>
  )
}

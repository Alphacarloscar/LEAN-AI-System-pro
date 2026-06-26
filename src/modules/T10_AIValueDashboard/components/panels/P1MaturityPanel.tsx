// P1 — T1 Madurez IA

import type { RadarDimension } from '@/shared/components/charts/LeanRadarChart'
import { DimBar }         from '../DimBar'
import { NavButton }      from '../NavButton'
import { ExpandedSection } from '../ExpandedSection'
import { HeroMetric }     from '../HeroMetric'
import { PanelCard }      from '../PanelCard'
import { Badge }          from '@shared/design-system/components'

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
      tag="T1 · Readiness"
      title="Madurez IA" subtitle={`${radar.length} dimensiones · Score ${avg}/4`}
      animDelay={0}
      heroSlot={<HeroMetric label="Madurez IA" value={avg.toFixed(1)} colorScore={(avg / 4) * 100} dangerBelow={38} warningBelow={63} />}
    >
      <div className="space-y-[5px]">
        {radar.slice(0, 4).map(dim => (
          <DimBar key={dim.dimension} label={dim.dimension} value={dim.current} max={4} color="var(--color-gold)" />
        ))}
        {radar.length > 4 && (
          <p className="text-xs text-text-muted dark:text-warm-400 pt-0.5">+{radar.length - 4} más</p>
        )}
      </div>

      {expanded && (
        <ExpandedSection>
          {breakdown.interviewsCount > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-center">
                  <p className="text-xs text-text-muted dark:text-warm-300">IT (avg)</p>
                  <p className="text-xl font-semibold text-gold tabular-nums">{breakdown.itAvg}</p>
                </div>
                <div className="flex-1 mx-1 space-y-1.5">
                  {/* Barra IT — gold */}
                  <div className="h-1.5 bg-warm-200 dark:bg-warm-600/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gold"
                      style={{ width: `${(breakdown.itAvg / 4) * 100}%` }} />
                  </div>
                  {/* Barra Negocio — warm-500 (excepción: comparación de dos valores) */}
                  <div className="h-1.5 bg-warm-200 dark:bg-warm-600/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-warm-500"
                      style={{ width: `${(breakdown.bizAvg / 4) * 100}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-muted dark:text-warm-300">Negocio (avg)</p>
                  <p className="text-xl font-semibold text-warm-600 dark:text-warm-400 tabular-nums">{breakdown.bizAvg}</p>
                </div>
              </div>
              <p className="text-xs text-text-muted dark:text-warm-300 mb-2">
                → {breakdown.gapSign} +{breakdown.gapPts} pts
              </p>
            </>
          ) : (
            <p className="text-xs text-text-muted dark:text-warm-300 mb-2">
              Sin entrevistas registradas aún — abre T1 para añadir la primera.
            </p>
          )}
          <div className="flex items-center justify-between mb-3">
            <Badge variant={avg < 2 ? 'warning' : 'info'} shape="pill" size="xs">{tier}</Badge>
            <span className="text-xs text-text-muted dark:text-warm-300">
              Nº entrevistas: <span className="font-semibold text-lean-black dark:text-warm-50">{breakdown.interviewsCount}</span>
            </span>
          </div>
          <p className="text-xs text-text-muted dark:text-warm-300 mb-2">
            Área más débil: <span className="font-medium text-lean-black dark:text-warm-100">{weakest || '—'}</span>
          </p>
          <NavButton label="Abrir T1 Assessment" onClick={() => onNavigate('/t1')} />
        </ExpandedSection>
      )}
    </PanelCard>
  )
}

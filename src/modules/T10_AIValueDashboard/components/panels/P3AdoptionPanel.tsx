// P3 — T2+T7 Adopción

import { AlertTriangle } from 'lucide-react'
import { DeptBar }         from '../DeptBar'
import { NavButton }       from '../NavButton'
import { ExpandedSection } from '../ExpandedSection'
import { HeroMetric }      from '../HeroMetric'
import { PanelCard }       from '../PanelCard'

interface P3Props {
  t2data: {
    totalStakeholders: number
    activePercent:     number
    changeScore:       number
    rogersPhase:       string
    groups:            Array<{ label: string; count: number; pct: number; color: string }>
    departments:       Array<{ label: string; innovadores: number; early: number; rezagados: number; total: number }>
  }
  shadowAIPct:  { pct: number; total: number; withTools: number } | null
  expanded:     boolean
  onToggle:     () => void
  onNavigate:   (path: string) => void
}

export function P3AdoptionPanel({ t2data, shadowAIPct, expanded, onToggle, onNavigate }: P3Props) {
  return (
    <PanelCard
      id="p3" expanded={expanded} onClick={onToggle}
      tag="T2 + T7 · Adopción"
      title="Velocidad de adopción" subtitle={`${t2data.totalStakeholders} stakeholders · ${t2data.activePercent}% activos`}
      animDelay={160}
      heroSlot={<HeroMetric label="Adopción activa" value={`${t2data.activePercent}%`} colorScore={t2data.activePercent} />}
    >
      <div className="mb-2">
        <p className="text-[9px] font-sans uppercase tracking-widest text-text-muted dark:text-warm-400 mb-1.5">
          Composición por departamento
        </p>
        {t2data.departments.length > 0
          ? t2data.departments.map((dept, i) => <DeptBar key={i} {...dept} colors={[t2data.groups[0]?.color ?? '#C8860A', t2data.groups[1]?.color ?? '#B07840', t2data.groups[2]?.color ?? '#9A9790']} />)
          : <p className="text-[10px] text-text-muted dark:text-warm-300">Sin stakeholders registrados aún</p>
        }
        {t2data.groups.length > 0 && (
          <div className="flex gap-3 mt-1.5">
            {t2data.groups.map((g, i) => (
              <div key={i} className="flex items-center gap-1 text-[9px] text-text-muted dark:text-warm-300">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: g.color }} />
                {g.label.split(' ')[0]} {g.count}
              </div>
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <ExpandedSection>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Score de cambio</p>
              <p className="text-lg font-semibold text-info-dark dark:text-info tabular-nums">{t2data.changeScore} / 5</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Fase de difusión</p>
              <p className="text-[11px] font-medium text-text-primary dark:text-warm-100">{t2data.rogersPhase}</p>
            </div>
          </div>
          {shadowAIPct !== null && (
            <div className="rounded-r-xl border-l-4 border-l-gold bg-card dark:bg-warm-700 px-3 py-2.5 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} strokeWidth={1.5} className="text-gold" />
                  <p className="text-[9px] font-sans uppercase tracking-widest text-gold">
                    Riesgo de Shadow AI
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums text-gold">
                  {shadowAIPct.pct}%
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-border dark:bg-warm-700 overflow-hidden">
                <div className="h-full rounded-full bg-gold" style={{ width: `${shadowAIPct.pct}%` }} />
              </div>
              <p className="text-[9px] text-text-muted mt-1">
                {shadowAIPct.withTools} de {shadowAIPct.total} perfiles declaran herramientas externas · Ver detalle en T6
              </p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <NavButton label="Abrir T2" onClick={() => onNavigate('/t2')} />
            <NavButton label="Abrir T7" onClick={() => onNavigate('/t7')} secondary />
          </div>
        </ExpandedSection>
      )}
    </PanelCard>
  )
}

// P6 — T8+T9+T11 Gobierno Activo

import { PackagePreviewBanner } from '@shared/design-system/components'
import { usePackagePanel } from '@shared/hooks/usePackagePanel'
import { MetricChip }      from '../MetricChip'
import { NavButton }       from '../NavButton'
import { ExpandedSection } from '../ExpandedSection'
import { HeroMetric }      from '../HeroMetric'
import { PanelCard }       from '../PanelCard'

const EVENT_LEVEL_COLOR: Record<string, string> = {
  direction: 'var(--color-gold)',
  program:   'var(--color-info)',
  team:      'var(--color-success)',
}

interface P6Props {
  p6data: {
    casosEnGO:          number
    completados:        number
    libres:             number
    gobiernoActivoPct:  number
    hasData:            boolean
    upcomingEvents:     Array<{ name: string; date: string; level: string }>
  }
  risksHigh:  number
  expanded:   boolean
  onToggle:   () => void
  onNavigate: (path: string) => void
}

export function P6GovernancePanel({ p6data, risksHigh, expanded, onToggle, onNavigate }: P6Props) {
  const { isActive } = usePackagePanel('portfolio_management')

  const content = !isActive ? (
    <PackagePreviewBanner
      packageName="Portfolio Management"
      moduleCodes={['T8', 'T9', 'T11']}
    />
  ) : p6data.hasData ? (
    <>
      <div className="space-y-1.5">
        {p6data.upcomingEvents.map((ev, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: EVENT_LEVEL_COLOR[ev.level] ?? '#C8860A' }} />
            <span className="text-[11px] text-text-primary dark:text-warm-100 flex-1 truncate">{ev.name}</span>
            <span className="text-[10px] text-text-muted dark:text-warm-300 flex-shrink-0">{ev.date}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-3">
        <MetricChip label="Casos en GO"  value={String(p6data.casosEnGO)}   valueColor="var(--color-gold)" />
        <MetricChip label="Candidatos"   value={String(p6data.libres)} />
        <MetricChip label="Completados"  value={String(p6data.completados)} />
        <MetricChip label="Riesgo alto"  value={String(risksHigh)} valueColor="var(--color-danger-dark, #C06060)" />
      </div>
    </>
  ) : (
    <p className="text-[11px] text-text-muted dark:text-warm-300 py-2">
      Usa T4 (Portfolio) y T9 (Roadmap) para construir el panel de gobierno del proyecto.
    </p>
  )

  return (
    <PanelCard
      id="p6" expanded={expanded} onClick={onToggle}
      tag="T8 · T9 · T11 · Gobierno"
      title="Gobierno activo"
      subtitle={p6data.hasData
        ? `${p6data.casosEnGO} en GO · ${p6data.upcomingEvents.length} hitos próximos`
        : 'Pendiente de configurar'}
      animDelay={400}
      heroSlot={<HeroMetric
        label="Gobierno activo"
        value={p6data.hasData ? `${p6data.gobiernoActivoPct}%` : '—'}
        colorScore={p6data.hasData ? p6data.gobiernoActivoPct : undefined}
      />}
    >
      <div className={!isActive ? 'relative' : undefined}>
        {content}
      </div>
      {isActive && expanded && (
        <ExpandedSection>
          <div className="flex items-center gap-3 flex-wrap">
            <NavButton label="Abrir T11 Gobierno" onClick={() => onNavigate('/t11')} />
            <NavButton label="Abrir T9 Roadmap"   onClick={() => onNavigate('/t9')}  secondary />
            <NavButton label="Abrir T8 Vendors"   onClick={() => onNavigate('/t8')}  secondary />
          </div>
        </ExpandedSection>
      )}
    </PanelCard>
  )
}

// P4 — T3+T5 Ecosistema IA

import { DonutChart }      from '../DonutChart'
import { MetricChip }      from '../MetricChip'
import { NavButton }       from '../NavButton'
import { ExpandedSection } from '../ExpandedSection'
import { HeroMetric }      from '../HeroMetric'
import { PanelCard }       from '../PanelCard'

interface P4Props {
  t3data: {
    processesTotal:  number
    processesMapped: number
    efficiencyPct:   number
    bottleneck:      string
    oppCritica:      number
    oppAlta:         number
    aiTypes:         Array<{ label: string; color: string; count: number; pct: number }>
  } | null
  expanded:   boolean
  onToggle:   () => void
  onNavigate: (path: string) => void
}

export function P4EcosystemPanel({ t3data, expanded, onToggle, onNavigate }: P4Props) {
  return (
    <PanelCard
      id="p4" expanded={expanded} onClick={onToggle}
      tag="T3 · Ecosistema IA"
      title="Ecosistema IA"
      subtitle={t3data
        ? `${t3data.processesTotal} procesos · ${t3data.aiTypes.length} tipos IA`
        : 'Sin procesos mapeados aún'}
      animDelay={240}
      heroSlot={<HeroMetric
        label="Eficiencia"
        value={t3data ? `${t3data.efficiencyPct}%` : '—'}
        colorScore={t3data?.efficiencyPct}
      />}
    >
      {t3data ? (
        <>
          <div className="flex items-center gap-3">
            <DonutChart
              segments={t3data.aiTypes.map(t => ({ pct: t.pct, color: t.color }))}
              size={68} strokeWidth={14}
            />
            <div className="space-y-1.5 flex-1">
              {t3data.aiTypes.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                  <span className="text-text-muted dark:text-warm-300 flex-1 truncate">{t.label}</span>
                  <span className="font-medium text-lean-black dark:text-warm-100">{t.count}</span>
                  <span className="text-text-muted dark:text-warm-400">{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md px-2.5 py-1.5 mt-2 border-l-4 border-l-gold bg-card dark:bg-warm-700">
            <p className="text-[10px] text-text-muted dark:text-warm-300">
              Mayor espera: <span className="font-semibold text-lean-black dark:text-warm-100 truncate">{t3data.bottleneck}</span>
            </p>
          </div>
        </>
      ) : (
        <p className="text-[11px] text-text-muted dark:text-warm-300 py-2">
          Abre T3 para mapear los procesos de la empresa y ver la distribución de tipos de IA.
        </p>
      )}

      {expanded && (
        <ExpandedSection>
          {t3data ? (
            <div className="flex gap-2 mb-3">
              <MetricChip label="Mapeados"   value={`${t3data.processesMapped}/${t3data.processesTotal}`} />
              <MetricChip label="Opp crítica" value={String(t3data.oppCritica)} valueColor="var(--color-danger-dark, #C06060)" />
              <MetricChip label="Opp alta"    value={String(t3data.oppAlta)}    valueColor="var(--color-warning-dark, #D4A85C)" />
            </div>
          ) : null}
          <NavButton label="Abrir T3 Procesos" onClick={() => onNavigate('/t3')} />
        </ExpandedSection>
      )}
    </PanelCard>
  )
}

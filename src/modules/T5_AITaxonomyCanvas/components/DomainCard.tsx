// ============================================================
// T5 — DomainCard
//
// Ficha de governance para un dominio IA seleccionado.
// Muestra recomendación, score, dimensiones y condiciones
// de activación.
// ============================================================

import { Settings, Cpu, TrendingUp, MessageSquare, RefreshCw, Network, User, BarChart2, AlertTriangle } from 'lucide-react'
import { T5_DOMAIN_CONFIG, T5_RECOMMENDATION_CONFIG } from '../constants'
import { Button, Badge, Card }                         from '@shared/design-system/components'
import type { T5DomainAssessment }                     from '../types'
import { T5DimBars }                                   from './T5DimBars'

const DOMAIN_ICON_MAP: Record<string, React.ReactElement> = {
  settings:        <Settings     size={20} strokeWidth={1.5} />,
  cpu:             <Cpu          size={20} strokeWidth={1.5} />,
  'trending-up':   <TrendingUp   size={20} strokeWidth={1.5} />,
  'message-square':<MessageSquare size={20} strokeWidth={1.5} />,
  'refresh-cw':    <RefreshCw    size={20} strokeWidth={1.5} />,
  network:         <Network      size={20} strokeWidth={1.5} />,
}

interface DomainCardProps {
  assessment: T5DomainAssessment
  onEdit:     () => void
}

export function DomainCard({ assessment, onEdit }: DomainCardProps) {
  const domCfg = T5_DOMAIN_CONFIG[assessment.domainCode]
  const recCfg = T5_RECOMMENDATION_CONFIG[assessment.recommendation]

  return (
    <Card variant="outlined" padding="none" className="rounded-2xl p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55`, color: domCfg.hex }}
          >
            {DOMAIN_ICON_MAP[domCfg.icon] ?? <Settings size={20} strokeWidth={1.5} />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100 leading-tight">
              {domCfg.label}
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{domCfg.tagline}</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={onEdit}>
          Editar
        </Button>
      </div>

      {/* Recommendation + score */}
      <Card variant="flat" padding="none" className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <Badge
            shape="pill"
            size="sm"
            style={{ backgroundColor: `${recCfg.hex}22`, color: recCfg.hex }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: recCfg.hex }} aria-hidden="true" />
            {recCfg.label}
          </Badge>
          <div className="text-right">
            <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
              {assessment.priorityScore}
            </span>
            <span className="text-[10px] text-text-muted">/100</span>
          </div>
        </div>
        <p className="text-[10px] text-text-muted leading-relaxed">{recCfg.description}</p>
      </Card>

      {/* Dimension bars */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">
          Evaluación por dimensión
        </p>
        <T5DimBars scores={assessment.scores} />
      </div>

      {/* Governance */}
      <Card variant="flat" padding="none" className="rounded-xl border border-border bg-gray-50/50 dark:bg-gray-800/30 px-4 py-4 flex flex-col gap-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Governance</p>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-md dark:bg-slate-800/60 dark:border-slate-700 shrink-0">
              <User size={16} strokeWidth={1.5} className="text-text-muted" />
            </span>
            <div>
              <p className="text-[9px] font-mono text-text-muted uppercase tracking-wide">Owner sugerido</p>
              <p className="text-[11px] font-medium text-lean-black dark:text-gray-200 leading-tight mt-0.5">
                {assessment.suggestedOwner}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-md dark:bg-slate-800/60 dark:border-slate-700 shrink-0">
              <BarChart2 size={16} strokeWidth={1.5} className="text-text-muted" />
            </span>
            <div>
              <p className="text-[9px] font-mono text-text-muted uppercase tracking-wide">KPI principal</p>
              <p className="text-[11px] font-medium text-lean-black dark:text-gray-200 leading-tight mt-0.5">
                {assessment.primaryKPI}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-2">
            Condiciones de activación
          </p>
          <ul className="flex flex-col gap-1.5">
            {assessment.activationConditions.map((cond, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold"
                  style={{ backgroundColor: recCfg.hex + '30', color: recCfg.hex }}
                >
                  {i + 1}
                </span>
                <span className="text-[10px] text-text-muted leading-tight">{cond}</span>
              </li>
            ))}
          </ul>
        </div>

        {assessment.governanceNotes && (
          <div className="rounded-lg bg-warning-light/40 border border-warning-dark/20 px-3 py-2">
            <p className="text-[10px] text-warning-dark leading-relaxed flex items-start gap-1.5"><AlertTriangle size={12} strokeWidth={1.5} className="shrink-0 mt-0.5" />{assessment.governanceNotes}</p>
          </div>
        )}
      </Card>
    </Card>
  )
}

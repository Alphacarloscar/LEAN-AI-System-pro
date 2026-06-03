// ============================================================
// T5 — DomainCard
//
// Ficha de governance para un dominio IA seleccionado.
// Muestra recomendación, score, dimensiones y condiciones
// de activación.
// ============================================================

import { T5_DOMAIN_CONFIG, T5_RECOMMENDATION_CONFIG } from '../constants'
import type { T5DomainAssessment }                     from '../types'
import { T5DimBars }                                   from './T5DimBars'

interface DomainCardProps {
  assessment: T5DomainAssessment
  onEdit:     () => void
}

export function DomainCard({ assessment, onEdit }: DomainCardProps) {
  const domCfg = T5_DOMAIN_CONFIG[assessment.domainCode]
  const recCfg = T5_RECOMMENDATION_CONFIG[assessment.recommendation]

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55` }}
          >
            {domCfg.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100 leading-tight">
              {domCfg.label}
            </h3>
            <p className="text-[10px] text-text-subtle mt-0.5 leading-tight">{domCfg.tagline}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-navy-metallic text-white text-xs font-medium
            hover:bg-navy-metallic-hover transition-colors shadow-sm"
        >
          Editar
        </button>
      </div>

      {/* Recommendation + score */}
      <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${recCfg.badgeBg} ${recCfg.badgeText}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: recCfg.hex }} />
            {recCfg.label}
          </span>
          <div className="text-right">
            <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
              {assessment.priorityScore}
            </span>
            <span className="text-[10px] text-text-subtle">/100</span>
          </div>
        </div>
        <p className="text-[10px] text-text-subtle leading-relaxed">{recCfg.description}</p>
      </div>

      {/* Dimension bars */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
          Evaluación por dimensión
        </p>
        <T5DimBars scores={assessment.scores} />
      </div>

      {/* Governance */}
      <div className="rounded-xl border border-border bg-gray-50/50 dark:bg-gray-800/30 px-4 py-4 flex flex-col gap-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Governance</p>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <span className="text-sm shrink-0 mt-0.5">👤</span>
            <div>
              <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide">Owner sugerido</p>
              <p className="text-[11px] font-medium text-lean-black dark:text-gray-200 leading-tight mt-0.5">
                {assessment.suggestedOwner}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-sm shrink-0 mt-0.5">📊</span>
            <div>
              <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide">KPI principal</p>
              <p className="text-[11px] font-medium text-lean-black dark:text-gray-200 leading-tight mt-0.5">
                {assessment.primaryKPI}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-2">
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
            <p className="text-[10px] text-warning-dark leading-relaxed">⚠️ {assessment.governanceNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

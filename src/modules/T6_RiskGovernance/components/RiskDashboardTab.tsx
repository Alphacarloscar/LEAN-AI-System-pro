// ============================================================
// RiskDashboardTab — Tab 2 of T6View: AI Act risk distribution
// ============================================================

import { useState, useMemo } from 'react'
import { useT4Store }    from '@/modules/T4_UseCasePriorityBoard'
import { useT2Store }    from '@/modules/T2_StakeholderMatrix'
import { AIACT_RISK_CONFIG } from '../constants'
import type { AIActRiskLevel } from '@/modules/T4_UseCasePriorityBoard/types'
import {
  ALL_RISK_LEVELS,
  selectAIActRiskSummaryFromUseCases,
} from '@/modules/T4_UseCasePriorityBoard/selectors/aiActRisk.selectors'
import { Button, Card } from '@shared/design-system/components'

// ── ShadowAICard ──────────────────────────────────────────────

function ShadowAICard() {
  const { stakeholders } = useT2Store()

  const { total, withTools } = useMemo(() => {
    const total     = stakeholders.length
    const withTools = stakeholders.filter((s) => s.unofficialTools?.trim()).length
    return { total, withTools }
  }, [stakeholders])

  const pct = total > 0 ? Math.round((withTools / total) * 100) : 0

  const riskLabel =
    pct >= 60 ? 'Riesgo alto'    :
    pct >= 30 ? 'Riesgo medio'   :
    total === 0 ? 'Sin datos'    :
    'Riesgo bajo'

  const riskColor =
    pct >= 60 ? '#C8860A' :
    pct >= 30 ? '#b07a00' :
    '#6b7280'

  return (
    <div
      className="rounded-2xl border px-5 py-4"
      style={{ backgroundColor: 'rgba(200,134,10,0.04)', borderColor: 'rgba(200,134,10,0.25)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#C8860A' }}>
              Riesgo de Shadow AI
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Stakeholders que usan herramientas externas no aprobadas oficialmente
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: '#C8860A' }}>
            {total === 0 ? '—' : `${pct}%`}
          </p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: riskColor }}>
            {riskLabel}
          </p>
        </div>
      </div>

      {total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-subtle">{withTools} de {total} perfiles declaran herramientas externas</span>
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#C8860A' }}>{pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: '#C8860A' }}
            />
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="mt-2 text-[11px] text-text-subtle">
          Completa entrevistas en T2 — Matriz de Stakeholders para activar este indicador.
        </p>
      )}
    </div>
  )
}

// ── RiskDashboardTab ──────────────────────────────────────────

export function RiskDashboardTab() {
  const { useCases } = useT4Store()
  const [selectedLevel, setSelectedLevel] = useState<AIActRiskLevel | null>(null)

  const summary = useMemo(
    () => selectAIActRiskSummaryFromUseCases(useCases),
    [useCases],
  )

  const filteredCases = selectedLevel
    ? useCases.filter((uc) => (uc.aiActClassification?.riskLevel ?? 'sin_clasificar') === selectedLevel)
    : useCases

  return (
    <div className="flex flex-col gap-5">

      {/* Shadow AI risk indicator */}
      <ShadowAICard />

      {/* KPI cards — una por nivel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {ALL_RISK_LEVELS.map((level) => {
          const cfg   = AIACT_RISK_CONFIG[level]
          const count = summary.byLevel[level]
          const isActive = selectedLevel === level
          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(isActive ? null : level)}
              className={[
                'rounded-2xl border px-4 py-4 text-left transition-all duration-150',
                isActive
                  ? `${cfg.badgeBg} border-2`
                  : 'border-border bg-white dark:bg-gray-900 hover:border-navy/30',
              ].join(' ')}
              style={{ borderColor: isActive ? cfg.hex : undefined }}
            >
              <p className="text-2xl mb-1">{cfg.icon}</p>
              <p className="text-2xl font-bold tabular-nums text-lean-black dark:text-gray-100">{count}</p>
              <p className={`text-[10px] font-semibold ${isActive ? cfg.badgeText : 'text-text-muted'}`}>
                {cfg.shortLabel}
              </p>
            </button>
          )
        })}
      </div>

      {/* Cobertura */}
      <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            Cobertura de clasificación AI Act
          </p>
          <span className="text-sm font-bold text-lean-black dark:text-gray-100 tabular-nums">
            {summary.classified}/{summary.total} casos ({summary.coveragePercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:           `${summary.coveragePercent}%`,
              backgroundColor: summary.coveragePercent === 100 ? '#16A34A' : summary.coveragePercent >= 50 ? '#D97706' : '#EA580C',
            }}
          />
        </div>
        {summary.unclassified > 0 && (
          <p className="text-[10px] text-text-subtle mt-2">
            {summary.unclassified} caso{summary.unclassified > 1 ? 's' : ''} pendiente{summary.unclassified > 1 ? 's' : ''} de clasificación. Accede a T4 → tab Regulatorio para clasificarlos.
          </p>
        )}
      </Card>

      {/* Tabla de casos */}
      <Card variant="outlined" padding="none" className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border dark:border-white/6 flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            {selectedLevel ? `Casos — ${AIACT_RISK_CONFIG[selectedLevel].label}` : 'Todos los casos de uso'}
            <span className="ml-2 font-bold text-lean-black dark:text-gray-200">({filteredCases.length})</span>
          </p>
          {selectedLevel && (
            <Button variant="link" size="xs" onClick={() => setSelectedLevel(null)}>
              Ver todos ×
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-white/6">
                <th className="text-left py-2 px-5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Caso de uso</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Departamento</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Categoría IA</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Estado</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Riesgo AI Act</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((uc) => {
                const riskLevel = uc.aiActClassification?.riskLevel ?? 'sin_clasificar'
                const riskCfg   = AIACT_RISK_CONFIG[riskLevel]
                return (
                  <tr key={uc.id} className="border-b border-border/40 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2.5 px-5">
                      <p className="text-xs font-medium text-lean-black dark:text-gray-200 leading-tight">{uc.name}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-text-muted">{uc.department}</td>
                    <td className="py-2.5 px-3 text-[11px] text-text-muted capitalize">{uc.aiCategory.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-medium capitalize text-text-muted">{uc.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${riskCfg.badgeBg} ${riskCfg.badgeText}`}>
                        {riskCfg.icon} {riskCfg.shortLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// T1 — RadarPanel (sticky)
// Muestra el radar en tiempo real + overall score + tier badge.
// Se actualiza en cada cambio de score sin delay.
// ============================================================

import { ChartWrapper, LeanRadarChart } from '@/shared/components/charts'
import type { T1DimensionState }        from '../types'
import { resolveMaturityTier, MATURITY_TIER_CONFIG } from '../types'

interface T1RadarPanelProps {
  dimensions: T1DimensionState[]
}

export function T1RadarPanel({ dimensions }: T1RadarPanelProps) {
  // Calcular overall score (media simple — en prod será ponderada)
  const overallScore = dimensions.length > 0
    ? dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
    : 0

  const tier   = resolveMaturityTier(overallScore)
  const config = MATURITY_TIER_CONFIG[tier]

  // Construir data para el radar (mismo shape que LeanRadarChart espera)
  const radarData = dimensions.map((d) => ({
    dimension: d.label,
    current:   d.score,
    target:    d.target,
  }))

  // Barra de progreso del overall score
  const progressPct = ((overallScore - 1) / 4) * 100   // 1–5 → 0–100%

  return (
    <div className="space-y-4">

      {/* ── Overall score + tier ── */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-900 p-5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
          Madurez IA global
        </p>

        {/* Número hero */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-bold tracking-tight text-lean-black dark:text-gray-50 tabular-nums">
            {overallScore.toFixed(1)}
          </span>
          <span className="text-xl font-light text-text-muted">/ 5</span>
        </div>

        {/* Tier badge */}
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
          {config.label}
        </span>

        {/* Barra de progreso */}
        <div className="mt-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-navy rounded-full transition-all duration-300"
            style={{ width: `${Math.max(progressPct, 2)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-text-subtle">Inicial</span>
          <span className="text-[10px] text-text-subtle">Líder</span>
        </div>

        {/* Descripción del tier */}
        <p className="mt-3 text-xs text-text-muted leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* ── Radar chart ── */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">
        <ChartWrapper
          title="Radar de madurez IA"
          subtitle="Estado actual vs. objetivo del sprint"
          height={280}
        >
          <LeanRadarChart data={radarData} showTarget />
        </ChartWrapper>
      </div>

      {/* ── Leyenda ── */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-navy" />
          <span className="text-[11px] text-text-muted">Estado actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-success-dark" />
          <span className="text-[11px] text-text-muted">Objetivo sprint</span>
        </div>
      </div>

    </div>
  )
}

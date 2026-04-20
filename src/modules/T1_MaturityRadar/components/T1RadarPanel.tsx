// ============================================================
// T1 — RadarPanel (sticky)
//
// Muestra el radar de madurez en tiempo real + overall score + tier badge.
// Los scores de las dimensiones se computan desde las subdimensiones.
// Escala 0-4. Se actualiza en cada cambio sin delay.
// ============================================================

import { ChartWrapper, LeanRadarChart }              from '@/shared/components/charts'
import type { T1DimensionState }                     from '../types'
import { computeDimensionScore, computeOverallScore,
         resolveMaturityTier, MATURITY_TIER_CONFIG } from '../types'

interface T1RadarPanelProps {
  dimensions: T1DimensionState[]
}

export function T1RadarPanel({ dimensions }: T1RadarPanelProps) {
  const overallScore = computeOverallScore(dimensions)
  const tier         = resolveMaturityTier(overallScore)
  const config       = MATURITY_TIER_CONFIG[tier]

  // Construir data para el radar — score de cada dimensión desde subdimensiones
  const radarData = dimensions.map((d) => {
    const score = computeDimensionScore(d)
    return {
      dimension: d.label,
      current:   score ?? 0,
      target:    3.5,   // objetivo estándar del sprint L.E.A.N.
    }
  })

  // Barra de progreso: 0-4 → 0-100%
  const progressPct = (overallScore / 4) * 100

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
          <span className="text-xl font-light text-text-muted">/ 4</span>
        </div>

        {/* Tier badge */}
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
          {config.label}
        </span>

        {/* Barra de progreso */}
        <div className="mt-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-navy rounded-full transition-all duration-300"
            style={{ width: `${Math.max(progressPct, 1.5)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-text-subtle">Sin evidencia</span>
          <span className="text-[10px] text-text-subtle">Óptimo</span>
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
          subtitle="Estado actual · Objetivo sprint"
          height={280}
        >
          <LeanRadarChart data={radarData} showTarget maxValue={4} />
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

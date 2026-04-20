// ============================================================
// T1 — Executive Output (QW1 preview)
// Panel de output ejecutivo auto-generado desde los scores.
// Se recalcula en tiempo real. Esto es lo que Carlos enseña
// al CIO como entregable: "esto es lo que os damos 48h después."
// ============================================================

import type { T1DimensionState }                    from '../types'
import { resolveMaturityTier, MATURITY_TIER_CONFIG } from '../types'
import { DIMENSION_MAP }                             from '../constants'

interface T1ExecutiveOutputProps {
  dimensions: T1DimensionState[]
  companyName: string
}

export function T1ExecutiveOutput({ dimensions, companyName }: T1ExecutiveOutputProps) {
  if (dimensions.length === 0) return null

  // ── Cálculos ──────────────────────────────────────────────────
  const overallScore = dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length
  const tier         = resolveMaturityTier(overallScore)
  const tierConfig   = MATURITY_TIER_CONFIG[tier]

  // Top 3 fortalezas — scores más altos
  const strengths = [...dimensions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  // Top 3 gaps — mayor brecha vs. target
  const gaps = [...dimensions]
    .sort((a, b) => (b.target - b.score) - (a.target - a.score))
    .filter((d) => d.target - d.score > 0.1)
    .slice(0, 3)

  // 3 acciones prioritarias — de las dimensiones con mayor gap
  const priorityActions = gaps.map((d) => {
    const def = DIMENSION_MAP[d.code]
    const level = Math.min(Math.floor(d.score), 4) as 1|2|3|4
    return { dimension: d.label, action: def?.recommendations[level] ?? '' }
  })

  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const scoreColor = (s: number) =>
    s >= 4   ? 'text-success-dark' :
    s >= 3   ? 'text-info-dark'    :
    s >= 2   ? 'text-warning-dark' :
               'text-danger-dark'

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

      {/* ── Cabecera del informe ── */}
      <div className="px-8 py-6 border-b border-border bg-navy dark:bg-navy/90">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                QW1
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                Executive Briefing Pack
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              AI Readiness Assessment
            </h2>
            <p className="text-sm text-white/70 mt-0.5">{companyName}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white tabular-nums">
              {overallScore.toFixed(1)}<span className="text-lg font-light text-white/60"> / 5</span>
            </p>
            <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white`}>
              {tierConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">

        {/* ── Resumen ejecutivo ── */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
            Diagnóstico
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            {tierConfig.description}
          </p>
          <p className="text-xs text-text-subtle mt-2">
            Informe generado automáticamente · {today}
          </p>
        </div>

        {/* ── 3 columnas: fortalezas / gaps / puntuaciones ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Fortalezas */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
              Top 3 fortalezas
            </p>
            <div className="space-y-2">
              {strengths.map((d) => (
                <div key={d.code} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-lean-black dark:text-gray-200">{d.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${scoreColor(d.score)}`}>
                    {d.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
              Top 3 áreas de mejora
            </p>
            <div className="space-y-2">
              {gaps.length > 0 ? gaps.map((d) => (
                <div key={d.code} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-lean-black dark:text-gray-200">{d.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold tabular-nums ${scoreColor(d.score)}`}>
                      {d.score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-text-subtle">→ {d.target.toFixed(1)}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-text-subtle">Sin brechas significativas.</p>
              )}
            </div>
          </div>

          {/* Todas las dimensiones */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
              Puntuaciones completas
            </p>
            <div className="space-y-1.5">
              {dimensions.map((d) => (
                <div key={d.code} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-navy rounded-full transition-all duration-300"
                      style={{ width: `${((d.score - 1) / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-text-subtle w-16 truncate">{d.label}</span>
                  <span className={`text-[11px] font-semibold tabular-nums w-6 text-right ${scoreColor(d.score)}`}>
                    {d.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3 acciones prioritarias ── */}
        {priorityActions.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
              3 acciones prioritarias recomendadas
            </p>
            <div className="space-y-3">
              {priorityActions.map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
                      {item.dimension}
                    </p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {item.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer del informe ── */}
        <div className="border-t border-border pt-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] text-text-subtle">
            Generado por L.E.A.N. AI System · Alpha Consulting Solutions S.L.
          </p>
          <p className="text-[11px] text-text-subtle">
            Este informe cubre el ~12% del AIMS requerido para ISO/IEC 42001:2023
          </p>
        </div>
      </div>
    </div>
  )
}

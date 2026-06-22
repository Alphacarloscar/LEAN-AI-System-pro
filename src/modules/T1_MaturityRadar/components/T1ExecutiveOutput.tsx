// ============================================================
// T1 — Executive Output (QW1 preview)
//
// Panel de output ejecutivo auto-generado desde los scores.
// Se recalcula en tiempo real. Esto es lo que Carlos enseña
// al CIO como entregable: "esto es lo que os damos 48h después."
//
// Novedad Sprint 2: sección de Brecha IT / Negocio cuando hay
// datos de múltiples entrevistados.
// ============================================================

import type { T1DimensionState }                          from '../types'
import { computeDimensionScore, computeOverallScore,
         resolveMaturityTier, MATURITY_TIER_CONFIG }      from '../types'
import { DIMENSION_MAP }                                  from '../constants'
import { ITBizGapSection }                               from './ITBizGapSection'

// ── Props ─────────────────────────────────────────────────────

export interface IntervieweeAggregate {
  id:         string
  name:       string
  role:       string
  type:       'it' | 'business'
  dimensions: T1DimensionState[]
}

interface T1ExecutiveOutputProps {
  dimensions:       T1DimensionState[]
  companyName:      string
  allInterviewees?: IntervieweeAggregate[]
}

// ── Helpers ───────────────────────────────────────────────────

function scoreColor(s: number | null) {
  if (s === null) return 'text-text-subtle'
  if (s >= 3)     return 'text-success-dark'
  if (s >= 2)     return 'text-info-dark'
  if (s >= 1)     return 'text-warning-dark'
  return 'text-danger-dark'
}

function miniBarFill(score: number): string {
  if (score >= 3) return 'bg-success-dark'
  if (score >= 2) return 'bg-info-dark'
  if (score >= 1) return 'bg-warning-dark'
  return 'bg-danger-dark'
}

function miniBar(score: number, max = 4) {
  return (
    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-warm-600 rounded-full overflow-hidden">
      <div
        className={`h-full ${miniBarFill(score)} rounded-full transition-all duration-300`}
        style={{ width: `${(score / max) * 100}%` }}
      />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function T1ExecutiveOutput({
  dimensions,
  companyName,
  allInterviewees = [],
}: T1ExecutiveOutputProps) {
  if (dimensions.length === 0) return null

  const overallScore = computeOverallScore(dimensions)
  const tier         = resolveMaturityTier(overallScore)
  const tierConfig   = MATURITY_TIER_CONFIG[tier]

  const dimScores = dimensions
    .map((d) => ({ ...d, score: computeDimensionScore(d) }))
    .filter((d): d is typeof d & { score: number } => d.score !== null)

  const strengths = [...dimScores].sort((a, b) => b.score - a.score).slice(0, 3)

  const TARGET = 3.5
  const gaps = [...dimScores]
    .map((d) => ({ ...d, gap: TARGET - d.score }))
    .filter((d) => d.gap > 0.2)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)

  const priorityActions = gaps.map((d) => {
    const def  = DIMENSION_MAP[d.code]
    const tier = resolveMaturityTier(d.score)
    const rec  = tier === 'avanzado' ? def?.recommendations.avanzado
                : tier === 'desarrollo' ? def?.recommendations.desarrollo
                : tier === 'exploracion' ? def?.recommendations.exploracion
                : def?.recommendations.inicial
    return { dimension: d.label, action: rec ?? '' }
  })

  const itInterviewees  = allInterviewees.filter((i) => i.type === 'it')
  const bizInterviewees = allInterviewees.filter((i) => i.type === 'business')
  const hasGapData      = itInterviewees.length > 0 && bizInterviewees.length > 0

  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-warm-800 overflow-hidden">

      {/* ── Cabecera del informe ── */}
      <div className="px-8 py-6 border-b border-border bg-navy dark:bg-navy/90">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">QW1</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Executive Briefing Pack</span>
            </div>
            <h2 className="text-lg font-semibold text-white">AI Readiness Assessment</h2>
            <p className="text-sm text-white/70 mt-0.5">{companyName}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white tabular-nums">
              {overallScore.toFixed(1)}<span className="text-lg font-light text-white/60"> / 4</span>
            </p>
            <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white">
              {tierConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">

        {/* ── Diagnóstico ── */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">Diagnóstico</p>
          <p className="text-sm text-text-muted leading-relaxed">{tierConfig.description}</p>
          <p className="text-xs text-text-muted mt-2">Informe generado automáticamente · {today}</p>
        </div>

        {/* ── 3 columnas: fortalezas / gaps / puntuaciones ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">Top 3 fortalezas</p>
            <div className="space-y-2">
              {strengths.length > 0 ? strengths.map((d) => (
                <div key={d.code} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-lean-black dark:text-warm-100">{d.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${scoreColor(d.score)}`}>{d.score.toFixed(1)}</span>
                </div>
              )) : (
                <p className="text-xs text-text-muted">Puntúa subdimensiones para ver fortalezas.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">Top 3 áreas de mejora</p>
            <div className="space-y-2">
              {gaps.length > 0 ? gaps.map((d) => (
                <div key={d.code} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-lean-black dark:text-warm-100">{d.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold tabular-nums ${scoreColor(d.score)}`}>{d.score.toFixed(1)}</span>
                    <span className="text-[10px] text-text-muted">→ {TARGET.toFixed(1)}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-text-muted">Sin brechas significativas detectadas.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">Puntuaciones completas</p>
            <div className="space-y-1.5">
              {dimensions.map((d) => {
                const s = computeDimensionScore(d)
                return (
                  <div key={d.code} className="flex items-center gap-2">
                    {miniBar(s ?? 0)}
                    <span className="text-[11px] text-text-muted w-16 truncate">{d.label}</span>
                    <span className={`text-[11px] font-semibold tabular-nums w-6 text-right ${scoreColor(s)}`}>
                      {s !== null ? s.toFixed(1) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Brecha IT / Negocio ── */}
        {hasGapData && (
          <ITBizGapSection
            dimensions={dimensions}
            itInterviewees={itInterviewees}
            bizInterviewees={bizInterviewees}
          />
        )}

        {/* ── 3 acciones prioritarias ── */}
        {priorityActions.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">
              3 acciones prioritarias recomendadas
            </p>
            <div className="space-y-3">
              {priorityActions.map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-warm-700/50">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-lean-black dark:text-warm-100 mb-0.5">{item.dimension}</p>
                    <p className="text-xs text-text-muted leading-relaxed">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-border pt-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] text-text-muted">Generado por GOBY · Alpha Consulting Solutions S.L.</p>
          <p className="text-[11px] text-text-muted">Este informe cubre el ~12% del AIMS requerido para ISO/IEC 42001:2023</p>
        </div>
      </div>
    </div>
  )
}

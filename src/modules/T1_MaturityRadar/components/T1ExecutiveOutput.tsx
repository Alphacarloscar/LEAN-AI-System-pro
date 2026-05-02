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

// ── Props ─────────────────────────────────────────────────────

export interface IntervieweeAggregate {
  id:         string
  name:       string
  role:       string
  type:       'it' | 'business'
  dimensions: T1DimensionState[]
}

interface T1ExecutiveOutputProps {
  /** Dimensiones del entrevistado activo (se muestra en la sección principal) */
  dimensions:      T1DimensionState[]
  companyName:     string
  /** Todos los entrevistados — para calcular el gap IT / Negocio */
  allInterviewees?: IntervieweeAggregate[]
}

// ── Colores IT / BIZ — tokens del design system ──────────────
// IT  → navy (#1B2A4E) light / info-soft (#9BB5D9) dark — contraste claro en ambos modos
// BIZ → warning-dark (#D4A85C) — ámbar/dorado visible en light y dark

const IT_BAR_CLASS  = 'bg-navy dark:bg-warm-600'
const BIZ_BAR_CLASS = 'bg-warning-dark'
const IT_TEXT_CLASS  = 'text-navy dark:text-warm-100'
const BIZ_TEXT_CLASS = 'text-warning-dark'

// ── Mensaje dinámico de gap IT / Negocio — rule-based ────────

type GapSeverity = 'ok' | 'low' | 'medium' | 'high'

interface GapMessage {
  severity: GapSeverity
  headline: string
  detail:   string
  steps?:   string[]
}

function getGapMessage(itScore: number, bizScore: number): GapMessage {
  const gap = bizScore - itScore   // positivo = Negocio > IT

  if (Math.abs(gap) <= 0.3) {
    return {
      severity: 'ok',
      headline: 'Percepción alineada',
      detail:   'IT y Negocio coinciden en la lectura de madurez. Punto de partida sólido para pilotos colaborativos sin necesidad de gestión activa de expectativas.',
    }
  }

  if (gap < -0.8) {
    // IT muy por encima de Negocio
    return {
      severity: 'high',
      headline: 'IT avanza sin demanda interna validada',
      detail:   `IT supera a Negocio en ${Math.abs(gap).toFixed(1)} pts. Riesgo: bajo adoption rate en pilotos — la tecnología puede, pero la organización no está lista para usarla.`,
      steps: [
        'Identificar champions en las áreas de negocio prioritarias antes de lanzar cualquier piloto.',
        'Co-diseñar el primer caso de uso junto con el área más receptiva, no imponer uno desde IT.',
        'Medir éxito del piloto en indicadores de negocio (tiempo ahorrado, errores reducidos), no solo técnicos.',
      ],
    }
  }

  if (gap < -0.3) {
    // IT ligeramente por encima
    return {
      severity: 'low',
      headline: 'IT ligeramente más optimista',
      detail:   `Brecha de ${Math.abs(gap).toFixed(1)} pts favorable a IT. Habitual en fases iniciales. Validar que la demanda de negocio existe antes de escalar inversión.`,
      steps: [
        'Realizar al menos una entrevista con un responsable de área de negocio antes del kick-off del piloto.',
      ],
    }
  }

  if (gap > 0.8) {
    // Negocio muy por encima de IT
    return {
      severity: 'high',
      headline: 'Expectativas de Negocio desconectadas de capacidad IT',
      detail:   `Negocio supera a IT en ${gap.toFixed(1)} pts. Riesgo de frustración post-piloto — el negocio espera más de lo que IT puede entregar en el plazo acordado.`,
      steps: [
        'Sesión de alineación IT-Negocio antes de cualquier piloto. Mostrar capacidades y limitaciones reales.',
        'Reducir el alcance del primer caso de uso al mínimo que genere valor demostrable.',
        'Gestionar expectativas de plazos con Dirección antes del kick-off.',
      ],
    }
  }

  // gap > 0.3 — Negocio ligeramente por encima
  return {
    severity: 'medium',
    headline: 'Negocio percibe más madurez de la que IT reporta',
    detail:   `Brecha de ${gap.toFixed(1)} pts favorable a Negocio. Revisar capacidades técnicas reales antes de comprometer plazos con stakeholders ejecutivos.`,
    steps: [
      'Contrastar scores IT con un inventario rápido de herramientas y datos disponibles.',
    ],
  }
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
    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
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

  // ── Cálculos principales ──────────────────────────────────
  const overallScore = computeOverallScore(dimensions)
  const tier         = resolveMaturityTier(overallScore)
  const tierConfig   = MATURITY_TIER_CONFIG[tier]

  // Scores por dimensión (solo las puntuadas)
  const dimScores = dimensions
    .map((d) => ({ ...d, score: computeDimensionScore(d) }))
    .filter((d): d is typeof d & { score: number } => d.score !== null)

  // Top 3 fortalezas — scores más altos
  const strengths = [...dimScores].sort((a, b) => b.score - a.score).slice(0, 3)

  // Top 3 gaps — mayor distancia hasta objetivo (3.5)
  const TARGET = 3.5
  const gaps = [...dimScores]
    .map((d) => ({ ...d, gap: TARGET - d.score }))
    .filter((d) => d.gap > 0.2)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)

  // 3 acciones prioritarias — recomendaciones de las dimensiones con mayor gap
  const priorityActions = gaps.map((d) => {
    const def  = DIMENSION_MAP[d.code]
    const tier = resolveMaturityTier(d.score)
    const rec  = tier === 'avanzado' ? def?.recommendations.avanzado
                : tier === 'desarrollo' ? def?.recommendations.desarrollo
                : tier === 'exploracion' ? def?.recommendations.exploracion
                : def?.recommendations.inicial
    return { dimension: d.label, action: rec ?? '' }
  })

  // ── Gap IT / Negocio ──────────────────────────────────────
  const itInterviewees  = allInterviewees.filter((i) => i.type === 'it')
  const bizInterviewees = allInterviewees.filter((i) => i.type === 'business')
  const hasGapData      = itInterviewees.length > 0 && bizInterviewees.length > 0

  type DimGapRow = {
    code:     string
    label:    string
    itScore:  number
    bizScore: number
    diff:     number
  }

  let gapRows: DimGapRow[] = []

  if (hasGapData) {
    gapRows = dimensions.map((d) => {
      const itScores  = itInterviewees.map((i) => {
        const match = i.dimensions.find((dim) => dim.code === d.code)
        return match ? computeDimensionScore(match) : null
      }).filter((s): s is number => s !== null)

      const bizScores = bizInterviewees.map((i) => {
        const match = i.dimensions.find((dim) => dim.code === d.code)
        return match ? computeDimensionScore(match) : null
      }).filter((s): s is number => s !== null)

      const itAvg  = itScores.length  > 0 ? itScores.reduce((a, b) => a + b, 0)  / itScores.length  : 0
      const bizAvg = bizScores.length > 0 ? bizScores.reduce((a, b) => a + b, 0) / bizScores.length : 0

      return { code: d.code, label: d.label, itScore: itAvg, bizScore: bizAvg, diff: bizAvg - itAvg }
    })
  }

  const itOverall  = hasGapData
    ? itInterviewees.reduce((sum, i) => sum + computeOverallScore(i.dimensions), 0) / itInterviewees.length
    : null
  const bizOverall = hasGapData
    ? bizInterviewees.reduce((sum, i) => sum + computeOverallScore(i.dimensions), 0) / bizInterviewees.length
    : null

  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

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
              {overallScore.toFixed(1)}<span className="text-lg font-light text-white/60"> / 4</span>
            </p>
            <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white`}>
              {tierConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">

        {/* ── Diagnóstico ── */}
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
              {strengths.length > 0 ? strengths.map((d) => (
                <div key={d.code} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-lean-black dark:text-gray-200">{d.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${scoreColor(d.score)}`}>
                    {d.score.toFixed(1)}
                  </span>
                </div>
              )) : (
                <p className="text-xs text-text-subtle">Puntúa subdimensiones para ver fortalezas.</p>
              )}
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
                    <span className="text-[10px] text-text-subtle">→ {TARGET.toFixed(1)}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-text-subtle">Sin brechas significativas detectadas.</p>
              )}
            </div>
          </div>

          {/* Puntuaciones completas */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
              Puntuaciones completas
            </p>
            <div className="space-y-1.5">
              {dimensions.map((d) => {
                const s = computeDimensionScore(d)
                return (
                  <div key={d.code} className="flex items-center gap-2">
                    {miniBar(s ?? 0)}
                    <span className="text-[11px] text-text-subtle w-16 truncate">{d.label}</span>
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
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-4">
              Brecha IT / Negocio
            </p>

            {/* Mensaje dinámico de gap */}
            {(() => {
              const msg = getGapMessage(itOverall!, bizOverall!)
              const severityStyles: Record<GapSeverity, string> = {
                ok:     'bg-success-light border-success-dark/20 text-success-dark',
                low:    'bg-info-light border-info-dark/20 text-info-dark',
                medium: 'bg-warning-light border-warning-dark/20 text-warning-dark',
                high:   'bg-danger-light border-danger-dark/20 text-danger-dark',
              }
              const dotStyles: Record<GapSeverity, string> = {
                ok:     'bg-success-dark',
                low:    'bg-info-dark',
                medium: 'bg-warning-dark',
                high:   'bg-danger-dark',
              }
              return (
                <div className={`mb-4 p-4 rounded-xl border ${severityStyles[msg.severity]}`}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${dotStyles[msg.severity]}`} />
                    <div>
                      <p className="text-xs font-semibold mb-0.5">{msg.headline}</p>
                      <p className="text-[11px] opacity-80 leading-relaxed">{msg.detail}</p>
                      {msg.steps && (
                        <ol className="mt-2 space-y-1">
                          {msg.steps.map((step, i) => (
                            <li key={i} className="text-[11px] opacity-75 leading-relaxed flex gap-1.5">
                              <span className="font-bold shrink-0">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Resumen global de la brecha */}
            <div className="flex items-center gap-6 mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border/60">
              <div className="text-center">
                <p className={`text-2xl font-bold tabular-nums ${IT_TEXT_CLASS}`}>
                  {itOverall!.toFixed(1)}
                </p>
                <p className="text-[11px] text-text-subtle mt-0.5">IT (avg)</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span>↔</span>
                  <span className={`font-semibold ${Math.abs(bizOverall! - itOverall!) > 0.5 ? 'text-danger-dark' : 'text-text-muted'}`}>
                    {bizOverall! > itOverall!
                      ? `Negocio +${(bizOverall! - itOverall!).toFixed(1)} pts`
                      : `IT +${(itOverall! - bizOverall!).toFixed(1)} pts`}
                  </span>
                </div>
                {/* Barra visual de gap */}
                <div className="mt-2 w-full max-w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 flex">
                    <div className={`${IT_BAR_CLASS} rounded-full opacity-90`} style={{ width: `${(itOverall! / 4) * 100}%` }} />
                  </div>
                  <div className="absolute inset-0 flex">
                    <div
                      className={`${BIZ_BAR_CLASS} rounded-full opacity-60`}
                      style={{ width: `${(bizOverall! / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold tabular-nums ${BIZ_TEXT_CLASS}`}>
                  {bizOverall!.toFixed(1)}
                </p>
                <p className="text-[11px] text-text-subtle mt-0.5">Negocio (avg)</p>
              </div>
            </div>

            {/* Tabla de gap por dimensión */}
            <div className="space-y-2">
              {gapRows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).map((row) => {
                const absDiff    = Math.abs(row.diff)
                const isBizHigher = row.diff > 0
                return (
                  <div key={row.code} className="flex items-center gap-3">
                    <span className="text-[11px] text-text-muted w-24 shrink-0 truncate">{row.label}</span>
                    {/* IT score */}
                    <span className={`text-[11px] font-semibold tabular-nums w-7 text-right ${IT_TEXT_CLASS}`}>
                      {row.itScore.toFixed(1)}
                    </span>
                    {/* Barra comparativa — IT (navy) debajo, BIZ (ámbar) encima */}
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                      <div
                        className={`absolute top-0 bottom-0 left-0 ${IT_BAR_CLASS} rounded-full`}
                        style={{ width: `${(row.itScore / 4) * 100}%` }}
                      />
                      <div
                        className={`absolute top-0 bottom-0 left-0 ${BIZ_BAR_CLASS} rounded-full opacity-75`}
                        style={{ width: `${(row.bizScore / 4) * 100}%` }}
                      />
                    </div>
                    {/* Biz score */}
                    <span className={`text-[11px] font-semibold tabular-nums w-7 ${BIZ_TEXT_CLASS}`}>
                      {row.bizScore.toFixed(1)}
                    </span>
                    {/* Delta badge */}
                    {absDiff > 0.3 && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full w-12 text-center ${
                        absDiff > 0.8 ? 'text-danger-dark bg-danger-light' :
                        absDiff > 0.5 ? 'text-warning-dark bg-warning-light' :
                        'text-text-subtle bg-gray-100 dark:bg-gray-800'
                      }`}>
                        {isBizHigher ? '+' : '-'}{absDiff.toFixed(1)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="mt-3 text-[11px] text-text-subtle">
              <span className="inline-flex items-center gap-1.5 mr-3">
                <span className={`h-2 w-2 rounded-full ${IT_BAR_CLASS}`} /> IT
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${BIZ_BAR_CLASS}`} /> Negocio
              </span>
            </p>
          </div>
        )}

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

        {/* ── Footer ── */}
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

// ============================================================
// ITBizGapSection — IT vs Business gap analysis for T1ExecutiveOutput
// ============================================================

import type { T1DimensionState } from '../types'
import { computeDimensionScore, computeOverallScore } from '../types'
import type { IntervieweeAggregate } from './T1ExecutiveOutput'

// ── Colores IT / BIZ ──────────────────────────────────────────

// IT = gold (valor principal), Biz = warm-500 (segunda barra comparativa — excepción REGLA 1)
const IT_BAR_CLASS  = 'bg-gold'
const BIZ_BAR_CLASS = 'bg-warm-500'
const IT_TEXT_CLASS  = 'text-gold'
const BIZ_TEXT_CLASS = 'text-warm-600 dark:text-warm-400'

// ── Gap message logic ─────────────────────────────────────────

type GapSeverity = 'ok' | 'low' | 'medium' | 'high'

interface GapMessage {
  severity: GapSeverity
  headline: string
  detail:   string
  steps?:   string[]
}

function getGapMessage(itScore: number, bizScore: number): GapMessage {
  const gap = bizScore - itScore

  if (Math.abs(gap) <= 0.3) {
    return {
      severity: 'ok',
      headline: 'Percepción alineada',
      detail:   'IT y Negocio coinciden en la lectura de madurez. Punto de partida sólido para pilotos colaborativos sin necesidad de gestión activa de expectativas.',
    }
  }

  if (gap < -0.8) {
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

  return {
    severity: 'medium',
    headline: 'Negocio percibe más madurez de la que IT reporta',
    detail:   `Brecha de ${gap.toFixed(1)} pts favorable a Negocio. Revisar capacidades técnicas reales antes de comprometer plazos con stakeholders ejecutivos.`,
    steps: [
      'Contrastar scores IT con un inventario rápido de herramientas y datos disponibles.',
    ],
  }
}

// ── ITBizGapSection ───────────────────────────────────────────

interface ITBizGapSectionProps {
  dimensions:      T1DimensionState[]
  itInterviewees:  IntervieweeAggregate[]
  bizInterviewees: IntervieweeAggregate[]
}

export function ITBizGapSection({ dimensions, itInterviewees, bizInterviewees }: ITBizGapSectionProps) {
  type DimGapRow = {
    code:     string
    label:    string
    itScore:  number
    bizScore: number
    diff:     number
  }

  const gapRows: DimGapRow[] = dimensions.map((d) => {
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

  const itOverall  = itInterviewees.reduce((sum, i) => sum + computeOverallScore(i.dimensions), 0) / itInterviewees.length
  const bizOverall = bizInterviewees.reduce((sum, i) => sum + computeOverallScore(i.dimensions), 0) / bizInterviewees.length

  const msg = getGapMessage(itOverall, bizOverall)

  const severityStyles: Record<GapSeverity, string> = {
    ok:     'bg-warning-light border-gold/30 text-warning-dark',
    low:    'bg-surface border-border text-text-muted',
    medium: 'bg-warning-light border-warning/40 text-warning-dark',
    high:   'bg-danger-light border-danger-dark/20 text-danger-dark',
  }
  const dotStyles: Record<GapSeverity, string> = {
    ok:     'bg-gold',
    low:    'bg-silver',
    medium: 'bg-warning-dark',
    high:   'bg-danger-dark',
  }

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-4">
        Brecha IT / Negocio
      </p>

      {/* Mensaje dinámico */}
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

      {/* Resumen global */}
      <div className="flex items-center gap-6 mb-4 p-4 rounded-xl bg-warm-50 dark:bg-warm-700/50 border border-border/60">
        <div className="text-center">
          <p className={`text-2xl font-bold tabular-nums ${IT_TEXT_CLASS}`}>{itOverall.toFixed(1)}</p>
          <p className="text-[11px] text-text-muted mt-0.5">IT (avg)</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>↔</span>
            <span className={`font-semibold ${Math.abs(bizOverall - itOverall) > 0.5 ? 'text-danger-dark' : 'text-text-muted'}`}>
              {bizOverall > itOverall
                ? `Negocio +${(bizOverall - itOverall).toFixed(1)} pts`
                : `IT +${(itOverall - bizOverall).toFixed(1)} pts`}
            </span>
          </div>
          <div className="mt-2 w-full max-w-48 h-1 bg-warm-200 dark:bg-warm-600 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div className={`${IT_BAR_CLASS} rounded-full opacity-90`} style={{ width: `${(itOverall / 4) * 100}%` }} />
            </div>
            <div className="absolute inset-0 flex">
              <div className={`${BIZ_BAR_CLASS} rounded-full opacity-60`} style={{ width: `${(bizOverall / 4) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold tabular-nums ${BIZ_TEXT_CLASS}`}>{bizOverall.toFixed(1)}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Negocio (avg)</p>
        </div>
      </div>

      {/* Tabla por dimensión */}
      <div className="space-y-2">
        {gapRows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).map((row) => {
          const absDiff    = Math.abs(row.diff)
          const isBizHigher = row.diff > 0
          return (
            <div key={row.code} className="flex items-center gap-3">
              <span className="text-[11px] text-text-muted w-24 shrink-0 truncate">{row.label}</span>
              <span className={`text-[11px] font-semibold tabular-nums w-7 text-right ${IT_TEXT_CLASS}`}>
                {row.itScore.toFixed(1)}
              </span>
              <div className="flex-1 h-1.5 bg-warm-100 dark:bg-warm-700 rounded-full overflow-hidden relative">
                <div className={`absolute top-0 bottom-0 left-0 ${IT_BAR_CLASS} rounded-full`}
                  style={{ width: `${(row.itScore / 4) * 100}%` }} />
                <div className={`absolute top-0 bottom-0 left-0 ${BIZ_BAR_CLASS} rounded-full opacity-75`}
                  style={{ width: `${(row.bizScore / 4) * 100}%` }} />
              </div>
              <span className={`text-[11px] font-semibold tabular-nums w-7 ${BIZ_TEXT_CLASS}`}>
                {row.bizScore.toFixed(1)}
              </span>
              {absDiff > 0.3 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full w-12 text-center ${
                  absDiff > 0.8 ? 'text-danger-dark bg-danger-light' :
                  absDiff > 0.5 ? 'text-warning-dark bg-warning-light' :
                  'text-text-subtle bg-warm-100 dark:bg-warm-700'
                }`}>
                  {isBizHigher ? '+' : '-'}{absDiff.toFixed(1)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] text-text-muted">
        <span className="inline-flex items-center gap-1.5 mr-3">
          <span className={`h-2 w-2 rounded-full ${IT_BAR_CLASS}`} /> IT
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${BIZ_BAR_CLASS}`} /> Negocio
        </span>
      </p>
    </div>
  )
}

import { GO_NOGO_THRESHOLDS } from '../constants'
import type { UseCase } from '../types'

interface LowScoreRec {
  dimension: string
  message:   string
  action:    string
}

export function LowScoreRecommendations({ useCase }: { useCase: UseCase }) {
  const { scores, priorityScore } = useCase
  const recs: LowScoreRec[] = []

  if (scores.kpiImpact < 40) recs.push({
    dimension: 'Impacto en KPIs',
    message:   `Score KPI bajo (${scores.kpiImpact}/100). El caso no tiene aún un beneficio cuantificado que justifique la inversión.`,
    action:    'Cuantifica el impacto con el business sponsor: define el KPI objetivo, el baseline actual y el delta esperado en el sprint.',
  })

  if (scores.feasibility < 40) recs.push({
    dimension: 'Viabilidad técnica',
    message:   `Score de facilidad bajo (${scores.feasibility}/100). El caso puede ser difícil de implementar en el plazo del sprint.`,
    action:    'Reduce el alcance a un MVP acotado e identifica los bloqueantes técnicos concretos antes de priorizar.',
  })

  if (scores.aiRisk > 60) recs.push({
    dimension: 'Riesgo de IA',
    message:   `Riesgo IA elevado (${scores.aiRisk}/100). Penaliza el score compuesto y puede comprometer la adopción interna.`,
    action:    'Realiza la clasificación según el AI Act, documenta el plan de mitigación y considera mantener un humano en el loop.',
  })

  if (scores.dataDependency < 40) recs.push({
    dimension: 'Dependencia de datos',
    message:   `Madurez de datos baja (${scores.dataDependency}/100). Sin datos suficientes el modelo no puede entrenarse ni validarse.`,
    action:    'Audita las fuentes de datos disponibles, evalúa datos sintéticos como puente y define el mínimo viable de calidad.',
  })

  if (priorityScore < GO_NOGO_THRESHOLDS.pending) recs.push({
    dimension: 'Score compuesto — NO-GO',
    message:   `Score total (${priorityScore.toFixed(1)}) por debajo del umbral mínimo de ${GO_NOGO_THRESHOLDS.pending}.`,
    action:    'Considera fusionar este caso con uno de mayor score o moverlo al backlog inactivo hasta que las condiciones mejoren.',
  })

  if (recs.length === 0) return null

  return (
    <div
      className="mt-4 rounded-2xl border px-4 py-4"
      style={{ backgroundColor: 'rgba(200,134,10,0.04)', borderColor: 'rgba(200,134,10,0.18)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg
          width="13" height="13" viewBox="0 0 14 14" fill="none"
          stroke="#C8860A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="7" cy="7" r="6" />
          <path d="M7 4.5v3M7 9.5v.5" />
        </svg>
        <p className="text-[10px] font-mono uppercase tracking-widest font-semibold" style={{ color: '#C8860A' }}>
          Acciones recomendadas · {recs.length} {recs.length === 1 ? 'alerta' : 'alertas'}
        </p>
      </div>

      <div className="space-y-2">
        {recs.map((rec) => (
          <div
            key={rec.dimension}
            className="rounded-xl bg-warm-50 dark:bg-warm-800/40 border border-border dark:border-white/6 px-3 py-2.5"
          >
            <p className="text-[10px] font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              {rec.dimension}
            </p>
            <p className="text-[10px] text-text-muted dark:text-gray-400 leading-relaxed mb-1">
              {rec.message}
            </p>
            <p className="text-[10px] text-text-default dark:text-gray-300 leading-relaxed">
              → {rec.action}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

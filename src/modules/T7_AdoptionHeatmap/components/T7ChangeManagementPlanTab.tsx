// ── Tab 3: Plan Global de Gestión del Cambio ─────────────────
// Plan estático de fallback (se usa si el LLM aún no ha generado)

import { usePermissions } from '@/modules/Auth'
import type { GeneratedChangePlan, GeneratedChangePlanPhase } from '../types'
import { PlanPhaseCard } from './T7PlanPhaseCard'

const CHANGE_PLAN = [
  {
    phase:     'Mes 1–2',
    title:     'Activar a los agentes de cambio',
    icon:      '⚡',
    objective: 'Construir la masa crítica interna antes del lanzamiento visible.',
    segments:  ['Innovadores', 'Early Adopters'],
    actions: [
      'Identificar y briefar a ambassadors y adoptadores como co-pilotos del sprint.',
      'Realizar sesiones de alineación con los decisores clave — presentar el caso de negocio cuantificado (QW1).',
      'Establecer el grupo de trabajo LEAN con representación de todas las áreas.',
      'Definir el criterio de éxito del piloto junto a cada decisor — ownership desde el día 1.',
    ],
    risk: 'Si los ambassadors no tienen tiempo asignado, el proyecto se ralentizará en Mes 3-4.',
  },
  {
    phase:     'Mes 3–4',
    title:     'Construir evidencia, reducir fricción',
    icon:      '📊',
    objective: 'Generar datos internos de impacto para convertir a la Mayoría Temprana.',
    segments:  ['Early Majority', 'Mayoría Temprana'],
    actions: [
      'Publicar los primeros resultados del piloto con métricas concretas (no titulares, datos reales).',
      'Abordar a los perfiles reticentes individualmente — clarificar su rol en el entorno con IA.',
      'Ejecutar workshop de casos de uso con Operaciones y Dirección General.',
      'Escalar comunicación interna liderada por ambassadors — no por IT o consultores externos.',
    ],
    risk: 'Los críticos intentarán desacreditar resultados parciales. Anticipar con datos, no con narrativa.',
  },
  {
    phase:     'Mes 5–6',
    title:     'Escalar y normalizar',
    icon:      '🚀',
    objective: 'Transición de piloto a operación. La adopción pasa de voluntaria a estructural.',
    segments:  ['Late Majority', 'Laggards'],
    actions: [
      'Integrar el uso de IA en los procesos operativos estándar — no como opción, como flujo habitual.',
      'Revisar los casos de bajo score en T4 con evidencia real del piloto para actualizar prioridades.',
      'Presentar resultados al Comité de Dirección con el T9 Roadmap 6M actualizado.',
      'Diseñar el plan de continuidad post-sprint — quién mantiene la gobernanza del sistema de adopción.',
    ],
    risk: 'Sin un ownership interno claro post-sprint, la adopción se degrada en 3-6 meses.',
  },
]

interface ChangeManagementPlanTabProps {
  generatedPlan: GeneratedChangePlan | null
  isGenerating:  boolean
  error:         string | null
  canGenerate:   boolean
  onGenerate:    () => void
  onClear:       () => void
}

export function ChangeManagementPlanTab({
  generatedPlan,
  isGenerating,
  error,
  canGenerate,
  onGenerate,
  onClear,
}: ChangeManagementPlanTabProps) {
  const { isReadOnly } = usePermissions()

  const isLLM  = !!generatedPlan
  const phases = isLLM
    ? generatedPlan!.phases
    : CHANGE_PLAN

  return (
    <div className="space-y-5">

      {/* Header con botón de generación */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-text-muted leading-relaxed">
            {isLLM
              ? 'Plan generado por IA, personalizado para este cliente.'
              : 'Plan de referencia de 6 meses. Genera la versión personalizada para este cliente con IA.'}
          </p>
          {isLLM && generatedPlan?.contextualNote && (
            <p className="text-xs text-text-subtle mt-1 italic">
              💡 {generatedPlan.contextualNote}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isReadOnly && isLLM && (
            <button
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg text-xs text-text-subtle border border-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Restaurar plantilla
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={onGenerate}
              disabled={!canGenerate || isGenerating}
              className={[
                'flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                canGenerate && !isGenerating
                  ? 'bg-navy text-white hover:opacity-90 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-subtle cursor-not-allowed',
              ].join(' ')}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 1a5 5 0 11-5 5" strokeLinecap="round" />
                  </svg>
                  Generando plan…
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.4 1.4M8.1 8.1l1.4 1.4M2.5 9.5l1.4-1.4M8.1 3.9l1.4-1.4"/>
                  </svg>
                  {isLLM ? 'Regenerar plan con IA' : 'Generar plan con IA'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger-light bg-danger-light/30 dark:bg-red-900/15 px-4 py-3">
          <p className="text-xs text-danger-dark">{error}</p>
        </div>
      )}

      {/* Badge LLM */}
      {isLLM && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy/8 dark:bg-navy/20 border border-navy/20 dark:border-navy/30 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-navy animate-pulse" />
          <span className="text-[10px] font-semibold text-navy dark:text-warm-100">
            Plan generado por IA · {generatedPlan?.generatedAt
              ? new Date(generatedPlan.generatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>
        </div>
      )}

      {/* Fases */}
      {phases.map((step, i) => (
        <PlanPhaseCard key={i} step={step as GeneratedChangePlanPhase} />
      ))}
    </div>
  )
}

// ============================================================
// RecommendationPanel — Panel de recomendaciones LLM reutilizable
//
// Usado en T1, T2, T4, T5, T7, T8, T9, T11 y T10 (resumen ejecutivo).
// Renderiza los estados: vacío / cargando / error / resultado.
//
// Props:
//   tool         — identificador del tool ('t1', 't2', etc.)
//   context      — datos de contexto (tipo varía por tool)
//   engagementId — necesario para llamar a la Edge Function
//   title        — título del panel (default: "Recomendaciones IA")
//   subtitle     — subtítulo opcional
// ============================================================

import { useRecommendations }  from '@/hooks/useRecommendations'
import type { T1Recommendation } from '@/hooks/useRecommendations'
import { EmptyState as DSEmptyState } from '@shared/design-system/components'

// ── Config visual por nivel de esfuerzo ──────────────────────

const EFFORT_CONFIG = {
  bajo:  { label: 'Esfuerzo bajo',  dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  medio: { label: 'Esfuerzo medio', dot: 'bg-warning-dark', text: 'text-warning-dark' },
  alto:  { label: 'Esfuerzo alto',  dot: 'bg-red-500',      text: 'text-red-600 dark:text-red-400' },
} as const

// ── Iconos SVG inline ─────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M10.5 3.5l-2 2M5.5 10.5l-2 2" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8A6 6 0 112 8" />
      <path d="M14 3v5h-5" />
    </svg>
  )
}

// ── Subcomponentes ────────────────────────────────────────────


function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#C8860A] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-xs text-text-muted dark:text-gray-400">
        Analizando datos del cliente…
      </p>
      <p className="text-[10px] text-text-subtle dark:text-gray-500 text-center max-w-[220px] leading-relaxed">
        Puede tardar hasta 1–2 minutos según la complejidad del portfolio.
      </p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <p className="text-xs text-red-500 dark:text-red-400 text-center max-w-xs">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
      >
        <RefreshIcon />
        Reintentar
      </button>
    </div>
  )
}

function RecommendationCard({ rec, index }: { rec: T1Recommendation; index: number }) {
  const effort = EFFORT_CONFIG[rec.effort as keyof typeof EFFORT_CONFIG] ?? EFFORT_CONFIG.medio

  return (
    <div className="flex gap-3 p-4 rounded-xl bg-white dark:bg-gray-900/60 border border-border dark:border-white/6 hover:border-amber-300 dark:hover:border-amber-700/50 transition-colors">
      {/* Número */}
      <div className="shrink-0 w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center">
        <span className="text-[10px] font-bold text-[#C8860A]">{index + 1}</span>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-xs font-semibold text-lean-black dark:text-gray-100 leading-snug">
          {rec.title}
        </p>
        <p className="text-[11px] text-text-muted dark:text-gray-400 leading-relaxed">
          {rec.rationale}
        </p>

        {/* Meta: esfuerzo + horizonte */}
        <div className="flex items-center gap-3 pt-0.5">
          <span className={['flex items-center gap-1 text-[10px] font-medium', effort.text].join(' ')}>
            <span className={['w-1.5 h-1.5 rounded-full', effort.dot].join(' ')} />
            {effort.label}
          </span>
          <span className="text-[10px] text-text-subtle dark:text-gray-500 font-mono">
            {rec.horizon}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

interface RecommendationPanelProps {
  tool:         string
  context:      unknown
  engagementId: string | null
  title?:       string
  subtitle?:    string
}

export function RecommendationPanel({
  tool,
  context,
  engagementId,
  title    = 'Recomendaciones IA',
  subtitle,
}: RecommendationPanelProps) {
  const { data, isLoading, error, refetch } = useRecommendations(tool, context, engagementId)

  const hasData     = !!data && data.recommendations.length > 0
  const isDisabled  = !engagementId

  return (
    <div className="rounded-2xl bg-surface dark:bg-warm-900/40 border border-border dark:border-white/6 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 flex items-center justify-center text-[#C8860A]">
            <SparkleIcon />
          </div>
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-100">{title}</p>
            {subtitle && (
              <p className="text-[10px] text-text-subtle dark:text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Botón regenerar — solo visible si ya hay resultados */}
        {hasData && !isLoading && (
          <button
            onClick={refetch}
            disabled={isDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-text-muted dark:text-gray-400 hover:text-lean-black dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshIcon />
            Regenerar
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : hasData ? (
          <div className="space-y-3">
            {/* Nota contextual */}
            {data.contextualNote && (
              <div className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  {data.contextualNote}
                </p>
              </div>
            )}

            {/* Lista de recomendaciones */}
            <div className="space-y-2.5">
              {(data.recommendations as T1Recommendation[]).map((rec, i) => (
                <RecommendationCard key={i} rec={rec} index={i} />
              ))}
            </div>
          </div>
        ) : (
          <DSEmptyState
            icon={<SparkleIcon />}
            title="Recomendaciones IA disponibles"
            description="Genera recomendaciones específicas para este cliente basadas en los datos de la evaluación."
            action={
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={refetch}
                  disabled={isDisabled}
                  className={[
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                    isDisabled
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-[#C8860A] hover:bg-[#B57609] text-white shadow-sm hover:shadow',
                  ].join(' ')}
                >
                  <SparkleIcon />
                  Generar análisis
                </button>
                {isDisabled && (
                  <p className="text-[10px] text-text-subtle dark:text-gray-500">
                    Selecciona un engagement activo para generar recomendaciones.
                  </p>
                )}
              </div>
            }
            className="py-10"
          />
        )}
      </div>
    </div>
  )
}

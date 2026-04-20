import { type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// MetricHero — número grande estilo ejecutivo para dashboards
//
// Inspiración: Whoop / Linear / Stripe — una métrica principal
// con contexto mínimo pero máximo impacto visual.
//
// Uso:
//   <MetricHero value={23} unit="%" label="Reducción de costes" delta={+5} />
//   <MetricHero value={4.2} label="Madurez IA" suffix="/ 5" trend="up" />
//   <MetricHero value="€ 1.2M" label="ROI estimado" size="xl" />
// ─────────────────────────────────────────────────────────────

export type MetricSize  = 'sm' | 'md' | 'lg' | 'xl'
export type MetricTrend = 'up' | 'down' | 'neutral'

export interface MetricHeroProps {
  value:       string | number
  label:       string
  unit?:       string       // prefijo MUY corto, ej. "€" o "%" (se renderiza a text-2xl)
  suffix?:     string       // sufijo MUY corto sin espacios, ej. "/ 5", "pts", "sem." — NUNCA frases
  delta?:      number       // variación: +5, -3, 0
  deltaLabel?: string       // texto junto al delta, ej. "vs. mes anterior"
  trend?:      MetricTrend  // si no se pasa delta, permite forzar la dirección
  size?:       MetricSize
  sublabel?:   string       // segunda línea de contexto
  action?:     ReactNode    // link o botón opcional
  loading?:    boolean
  className?:  string
  invertTrend?: boolean     // para métricas donde bajar es bueno (ej. errores)
}

// ── Tamaños tipográficos ──────────────────────────────────────

const sizeMap: Record<MetricSize, {
  value:  string
  label:  string
  unit:   string
  delta:  string
}> = {
  sm: { value: 'text-3xl',  label: 'text-xs',  unit: 'text-lg',  delta: 'text-xs' },
  md: { value: 'text-5xl',  label: 'text-sm',  unit: 'text-2xl', delta: 'text-xs' },
  lg: { value: 'text-6xl',  label: 'text-sm',  unit: 'text-3xl', delta: 'text-sm' },
  xl: { value: 'text-7xl',  label: 'text-base', unit: 'text-4xl', delta: 'text-sm' },
}

// ── Helpers de tendencia ──────────────────────────────────────

function resolveTrend(delta?: number, trend?: MetricTrend, invertTrend?: boolean): MetricTrend {
  if (trend) return trend
  if (delta === undefined || delta === 0) return 'neutral'
  const raw: MetricTrend = delta > 0 ? 'up' : 'down'
  if (!invertTrend) return raw
  return raw === 'up' ? 'down' : 'up'  // si bajar es bueno, invertimos el semáforo
}

const trendColors: Record<MetricTrend, string> = {
  up:      'text-success-dark bg-success-light',
  down:    'text-danger-dark  bg-danger-light',
  neutral: 'text-text-muted   bg-surface dark:bg-gray-800',
}

function TrendArrow({ trend }: { trend: MetricTrend }) {
  if (trend === 'neutral') {
    return (
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M2 6h8M6 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  return (
    <svg
      className={`h-3 w-3 transition-transform ${trend === 'down' ? 'rotate-180' : ''}`}
      viewBox="0 0 12 12"
      fill="currentColor"
    >
      <path d="M6 2L10 7H2L6 2Z" />
    </svg>
  )
}

// ── Skeleton ──────────────────────────────────────────────────

function MetricHeroSkeleton({ size }: { size: MetricSize }) {
  const s = sizeMap[size]
  return (
    <div className="animate-pulse space-y-2">
      <div className={`h-8 w-24 rounded bg-gray-200 dark:bg-gray-700 ${
        size === 'xl' ? 'h-16 w-40' : size === 'lg' ? 'h-12 w-32' : 'h-10 w-24'
      }`} />
      <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      {s.delta && <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function MetricHero({
  value,
  label,
  unit,
  suffix,
  delta,
  deltaLabel,
  trend,
  size         = 'md',
  sublabel,
  action,
  loading      = false,
  className    = '',
  invertTrend  = false,
}: MetricHeroProps) {
  if (loading) return <MetricHeroSkeleton size={size} />

  const s            = sizeMap[size]
  const resolvedTrend = resolveTrend(delta, trend, invertTrend)
  const hasDelta     = delta !== undefined || trend !== undefined

  // Formatear el delta para mostrar
  const deltaDisplay = delta !== undefined
    ? `${delta > 0 ? '+' : ''}${delta}${unit ?? ''}`
    : null

  return (
    <div className={`flex flex-col gap-1 ${className}`}>

      {/* Valor principal */}
      <div className="flex items-baseline gap-1 leading-none">
        {unit && (
          <span className={`${s.unit} font-light text-text-muted tabular-nums`}>
            {unit}
          </span>
        )}
        <span className={`${s.value} font-bold tracking-tight text-lean-black dark:text-gray-50 tabular-nums`}>
          {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
        </span>
        {suffix && (
          <span className={`${s.unit} font-light text-text-muted`}>
            {suffix}
          </span>
        )}
      </div>

      {/* Etiqueta */}
      <p className={`${s.label} font-medium text-text-muted`}>
        {label}
      </p>

      {/* Sublabel */}
      {sublabel && (
        <p className="text-xs text-text-subtle">{sublabel}</p>
      )}

      {/* Delta / tendencia */}
      {hasDelta && (
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trendColors[resolvedTrend]}`}>
            <TrendArrow trend={resolvedTrend} />
            {deltaDisplay ?? (resolvedTrend === 'neutral' ? 'Sin cambio' : resolvedTrend === 'up' ? 'Al alza' : 'A la baja')}
          </span>
          {deltaLabel && (
            <span className="text-xs text-text-subtle">{deltaLabel}</span>
          )}
        </div>
      )}

      {/* Acción */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MetricHeroGrid — layout de 2/3/4 métricas en fila
// Ideal para la cabecera de un dashboard ejecutivo
// ─────────────────────────────────────────────────────────────

export interface MetricHeroGridProps {
  metrics:   MetricHeroProps[]
  cols?:     2 | 3 | 4
  divided?:  boolean     // separadores verticales entre métricas
  className?: string
}

const colsMap: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
}

export function MetricHeroGrid({
  metrics,
  cols     = 3,
  divided  = true,
  className = '',
}: MetricHeroGridProps) {
  return (
    <div
      className={[
        'grid gap-6',
        colsMap[cols],
        divided ? 'divide-x-0 sm:divide-x divide-border' : '',
        className,
      ].join(' ')}
    >
      {metrics.map((m, i) => (
        <MetricHero
          key={i}
          {...m}
          className={divided && i > 0 ? 'sm:pl-6' : ''}
        />
      ))}
    </div>
  )
}

import { type ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'

// ─────────────────────────────────────────────────────────────
// ChartWrapper — envoltorio base para todos los gráficos L.E.A.N.
//
// Proporciona:
// - ResponsiveContainer de Recharts
// - Estado de carga (skeleton animado)
// - Estado vacío
// - Título / subtítulo opcionales
// - Paleta de colores derivada de los design tokens D9
//
// Uso:
//   <ChartWrapper title="Madurez IA" height={320} loading={isLoading}>
//     <RadarChart data={...} />
//   </ChartWrapper>
// ─────────────────────────────────────────────────────────────

// ── Paleta de colores — valores hex que espeja tailwind.config.ts ──
// Recharts no puede leer CSS variables, necesita hex directos.
export const CHART_PALETTE = {
  navy:         '#1B2A4E',
  navyDark:     '#0A1530',
  silver:       '#C0C0C5',
  success:      '#86C7A8',
  successLight: '#D4EDE3',
  successDark:  '#5FAF8A',
  warning:      '#E8C281',
  warningLight: '#F8EDD3',
  warningDark:  '#C9973A',
  danger:       '#D89090',
  dangerLight:  '#F5DEDE',
  dangerDark:   '#B85C5C',
  info:         '#9BB5D9',
  infoLight:    '#D6E4F5',
  infoDark:     '#5A87C5',
  border:       '#E5E7EB',
  muted:        '#6B7280',
  subtle:       '#9CA3AF',
  surface:      '#F9FAFB',
  white:        '#FFFFFF',
  black:        '#0A0A0A',
} as const

// Secuencia de colores para series múltiples
export const CHART_SERIES_COLORS = [
  CHART_PALETTE.navy,
  CHART_PALETTE.success,
  CHART_PALETTE.warning,
  CHART_PALETTE.info,
  CHART_PALETTE.danger,
  CHART_PALETTE.silver,
] as const

// ── Skeleton de carga ─────────────────────────────────────────

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg bg-surface dark:bg-gray-800"
      style={{ height }}
    >
      <div className="h-full flex items-end justify-around px-6 pb-6 pt-10 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gray-200 dark:bg-gray-700"
            style={{ height: `${30 + Math.sin(i * 1.2) * 40 + 30}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Estado vacío ──────────────────────────────────────────────

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-10">
      <svg className="h-8 w-8 text-text-subtle" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="20" width="4" height="8" rx="1" />
        <rect x="12" y="14" width="4" height="14" rx="1" />
        <rect x="20" y="8" width="4" height="20" rx="1" opacity="0.4" />
        <rect x="28" y="4" width="4" height="24" rx="1" opacity="0.2" />
      </svg>
      <p className="text-xs text-text-subtle max-w-[160px]">{message}</p>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────

export interface ChartWrapperProps {
  children:     ReactNode
  height?:      number
  title?:       string
  subtitle?:    string
  loading?:     boolean
  empty?:       boolean
  emptyMessage?: string
  className?:   string
  action?:      ReactNode    // botón o link en esquina superior derecha
}

// ── Componente ────────────────────────────────────────────────

export function ChartWrapper({
  children,
  height       = 300,
  title,
  subtitle,
  loading      = false,
  empty        = false,
  emptyMessage = 'Sin datos disponibles',
  className    = '',
  action,
}: ChartWrapperProps) {
  return (
    <div className={`rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden ${className}`}>

      {/* Header */}
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            {title && (
              <h4 className="text-sm font-semibold text-lean-black dark:text-gray-100 truncate">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Chart area */}
      <div className="px-5 py-4">
        {loading ? (
          <ChartSkeleton height={height} />
        ) : empty ? (
          <div style={{ height }}>
            <ChartEmpty message={emptyMessage} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {children as React.ReactElement}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

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
// - Accesibilidad: role="img" + ariaLabel (WCAG 1.1.1, DEBT-025)
// - Tabla alternativa opcional expandible para lectores de pantalla
//
// Uso:
//   <ChartWrapper
//     title="Madurez IA"
//     ariaLabel="Radar de madurez IA en 6 dimensiones para Acme Corp"
//     height={320}
//     loading={isLoading}
//     dataTable={<Table columns={cols} rows={data} keyExtractor={r => r.id} />}
//   >
//     <RadarChart data={...} />
//   </ChartWrapper>
// ─────────────────────────────────────────────────────────────

// ── Paleta de colores — valores hex que espeja tailwind.config.ts ──
// ADR-021: Recharts resuelve colores en construcción del SVG y no soporta
// CSS vars en props de presentación (stroke, fill). Por tanto este objeto
// hex estático es la fuente de verdad para componentes Recharts.
// Para componentes no-chart usar token() de design-system/tokens.ts.
// Al actualizar tailwind.config.ts actualizar también este objeto.
export const CHART_PALETTE = {
  navy:         '#2A2822',   // warm charcoal (era #1B2A4E)
  navyDark:     '#16140F',   // warm-950 (era #0A1530)
  silver:       '#C4C0B8',   // warm silver (era #C0C0C5)
  success:      '#86C7A8',
  successLight: '#E8F5EE',
  successDark:  '#5FAF8A',
  warning:      '#E8C281',
  warningLight: '#FEF6E8',
  warningDark:  '#D4A85C',
  danger:       '#D89090',
  dangerLight:  '#FDECEC',
  dangerDark:   '#C06060',
  info:         '#9BB5D9',
  infoLight:    '#EBF2FA',
  infoDark:     '#6A90C0',
  border:       '#D4D0C8',   // warm border (era #E5E7EB)
  muted:        '#6B6864',   // warm text-muted (era #6B7280)
  subtle:       '#9A9790',   // warm text-subtle (era #9CA3AF)
  surface:      '#F7F4EE',   // warm ivory (era #F9FAFB)
  white:        '#FFFFFF',
  black:        '#1C1A16',   // warm near-black (era #0A0A0A)
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
      className="w-full animate-pulse rounded-lg bg-surface dark:bg-warm-800"
      style={{ height }}
    >
      <div className="h-full flex items-end justify-around px-6 pb-6 pt-10 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-warm-200 dark:bg-warm-700"
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
  children:      ReactNode
  /** Descripción concisa del gráfico para lectores de pantalla (WCAG 1.1.1). Obligatoria. */
  ariaLabel:     string
  /** Tabla semántica con el desglose de datos, mostrada en un <details> accesible. Obligatoria. */
  dataTable:     ReactNode
  height?:       number
  title?:        string
  subtitle?:     string
  loading?:      boolean
  empty?:        boolean
  emptyMessage?: string
  className?:    string
  action?:       ReactNode    // botón o link en esquina superior derecha
}

// ── Componente ────────────────────────────────────────────────

export function ChartWrapper({
  children,
  ariaLabel,
  dataTable,
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
    <div className={`rounded-xl bg-white dark-card overflow-hidden card-border ${className}`}>

      {/* Header */}
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 dark-card-header card-divider-bottom">
          <div className="min-w-0">
            {title && (
              <h4 className="text-sm font-semibold text-lean-black dark:text-warm-50 truncate">
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
          <div role="img" aria-label={ariaLabel}>
            <ResponsiveContainer width="100%" height={height}>
              {children as React.ReactElement}
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabla de datos accesible — scroll independiente para no desplazar el layout */}
        <details className="mt-4 border-t border-border/50 pt-2 text-xs text-text-muted select-none">
          <summary className="cursor-pointer hover:text-text-muted/80 transition-colors">
            Ver datos como tabla
          </summary>
          <div className="mt-2 max-h-56 overflow-y-auto overscroll-contain">
            {dataTable}
          </div>
        </details>
      </div>
    </div>
  )
}

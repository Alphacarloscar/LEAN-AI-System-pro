import { type ReactNode } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
  type TooltipProps,
} from 'recharts'
import { ChartWrapper, CHART_SERIES_COLORS } from './ChartWrapper'
import { getThemeColor } from '@shared/design-system/charts/chartTokens'
import { Table } from '@shared/design-system/components'

// ─────────────────────────────────────────────────────────────
// LeanBarChart — Gráfico de barras para KPIs y comparativas
//
// Soporta:
// - Serie única con colores por umbral (verde/naranja/rojo)
// - Múltiples series (antes/después, target/actual)
// - Barras verticales u horizontales
// - Línea de referencia (target)
//
// Uso:
//   <LeanBarChart data={kpiData} keys={['actual']} />
//   <LeanBarChart data={data} keys={['antes', 'después']} layout="horizontal" />
// ─────────────────────────────────────────────────────────────

export interface BarDataPoint {
  label:     string
  [key: string]: string | number   // valores de cada serie
}

export interface LeanBarChartProps {
  data:          BarDataPoint[]
  keys:          string[]          // nombres de las series a renderizar
  /** Descripción del gráfico para lectores de pantalla (WCAG 1.1.1). Obligatoria. */
  ariaLabel:     string
  /** Tabla de datos alternativa. Si se omite se genera automáticamente desde `data`. */
  dataTable?:    ReactNode
  layout?:       'vertical' | 'horizontal'
  referenceValue?: number          // línea de target
  referenceLabel?: string
  colorMode?:    'series' | 'threshold'  // 'threshold' colorea barras por valor
  thresholdGood?: number           // >= este valor = verde
  thresholdWarn?: number           // >= este valor (y < good) = naranja
  unit?:         string            // sufijo en tooltip, ej. "%" o "€"
  height?:       number
  title?:        string
  subtitle?:     string
  loading?:      boolean
  className?:    string
}

// ── Tooltip personalizado ──────────────────────────────────────

function CustomTooltip({
  active, payload, label, unit,
}: TooltipProps<number, string> & { unit?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-white dark:bg-warm-800 shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-lean-black dark:text-warm-50 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: entry.color }} />
          {payload.length > 1 && (
            <span className="text-text-muted dark:text-warm-300">{entry.name}:</span>
          )}
          <span className="font-semibold text-lean-black dark:text-warm-50">
            {entry.value?.toLocaleString('es-ES')}{unit}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Lógica de color por umbral ────────────────────────────────

function getThresholdColor(
  value: number,
  thresholdGood: number,
  thresholdWarn: number
): string {
  if (value >= thresholdGood) return getThemeColor('success-dark')
  if (value >= thresholdWarn) return getThemeColor('warning-dark')
  return getThemeColor('danger-dark')
}

// ── Tabla accesible autogenerada ─────────────────────────────────

function buildBarTable(data: BarDataPoint[], keys: string[], unit: string): ReactNode {
  const columns = [
    { key: 'label', header: 'Categoría' },
    ...keys.map(k => ({ key: k, header: k, align: 'right' as const,
      render: (r: BarDataPoint) => `${r[k]}${unit}` })),
  ]
  return (
    <Table<BarDataPoint>
      columns={columns}
      rows={data}
      keyExtractor={(r) => r.label}
    />
  )
}

// ── Componente principal ───────────────────────────────────────

export function LeanBarChart({
  data,
  keys,
  ariaLabel,
  dataTable,
  layout          = 'vertical',
  referenceValue,
  referenceLabel  = 'Objetivo',
  colorMode       = 'series',
  thresholdGood   = 80,
  thresholdWarn   = 50,
  unit            = '',
  height          = 300,
  title,
  subtitle,
  loading         = false,
  className       = '',
}: LeanBarChartProps) {
  const isHorizontal  = layout === 'horizontal'
  const isSingleKey   = keys.length === 1
  const resolvedTable = dataTable ?? buildBarTable(data, keys, unit)

  // Márgenes según orientación
  const margin = isHorizontal
    ? { top: 5, right: 20, bottom: 5, left: 100 }
    : { top: 5, right: 20, bottom: 20, left: 10 }

  return (
    <ChartWrapper
      ariaLabel={ariaLabel}
      dataTable={resolvedTable}
      height={height}
      title={title}
      subtitle={subtitle}
      loading={loading}
      empty={data.length === 0}
      className={className}
    >
      <BarChart
        data={data}
        layout={isHorizontal ? 'horizontal' : 'vertical'}
        margin={margin}
        barCategoryGap="28%"
        barGap={4}
      >
        <CartesianGrid
          strokeDasharray="4 2"
          stroke={getThemeColor('border')}
          vertical={!isHorizontal}
          horizontal={isHorizontal || !isHorizontal}
        />

        {/* Eje de categorías */}
        {isHorizontal ? (
          <YAxis
            dataKey="label"
            type="category"
            width={92}
            tick={{ fill: getThemeColor('text-muted'), fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
        ) : (
          <XAxis
            dataKey="label"
            tick={{ fill: getThemeColor('text-muted'), fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
        )}

        {/* Eje de valores */}
        {isHorizontal ? (
          <XAxis
            type="number"
            tick={{ fill: getThemeColor('text-subtle'), fontSize: 10, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />
        ) : (
          <YAxis
            tick={{ fill: getThemeColor('text-subtle'), fontSize: 10, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
            width={36}
          />
        )}

        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: getThemeColor('surface') }} />

        {keys.length > 1 && (
          <Legend
            wrapperStyle={{
              fontSize:   '11px',
              color:      getThemeColor('text-muted'),
              fontFamily: 'Inter, sans-serif',
              paddingTop: '12px',
            }}
          />
        )}

        {/* Línea de referencia / target */}
        {referenceValue !== undefined && (
          <ReferenceLine
            {...(isHorizontal ? { x: referenceValue } : { y: referenceValue })}
            stroke={getThemeColor('navy')}
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value:    referenceLabel,
              position: 'insideTopRight',
              fill:     getThemeColor('navy'),
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
            }}
          />
        )}

        {/* Barras */}
        {keys.map((key, seriesIndex) => (
          <Bar
            key={key}
            dataKey={key}
            name={key}
            fill={CHART_SERIES_COLORS[seriesIndex % CHART_SERIES_COLORS.length]}
            radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={40}
          >
            {/* Coloración por umbral — solo para serie única */}
            {colorMode === 'threshold' && isSingleKey && data.map((entry, cellIndex) => (
              <Cell
                key={`cell-${cellIndex}`}
                fill={getThresholdColor(
                  Number(entry[key] ?? 0),
                  thresholdGood,
                  thresholdWarn
                )}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ChartWrapper>
  )
}


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
import { CHART_PALETTE, CHART_SERIES_COLORS } from './ChartWrapper'

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
  layout?:       'vertical' | 'horizontal'
  referenceValue?: number          // línea de target
  referenceLabel?: string
  colorMode?:    'series' | 'threshold'  // 'threshold' colorea barras por valor
  thresholdGood?: number           // >= este valor = verde
  thresholdWarn?: number           // >= este valor (y < good) = naranja
  unit?:         string            // sufijo en tooltip, ej. "%" o "€"
  className?:    string
}

// ── Tooltip personalizado ──────────────────────────────────────

function CustomTooltip({
  active, payload, label, unit,
}: TooltipProps<number, string> & { unit?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-white dark:bg-gray-900 shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-lean-black dark:text-gray-100 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: entry.color }} />
          {payload.length > 1 && (
            <span className="text-text-muted">{entry.name}:</span>
          )}
          <span className="font-semibold text-lean-black dark:text-gray-100">
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
  if (value >= thresholdGood) return CHART_PALETTE.successDark
  if (value >= thresholdWarn) return CHART_PALETTE.warningDark
  return CHART_PALETTE.dangerDark
}

// ── Componente principal ───────────────────────────────────────

export function LeanBarChart({
  data,
  keys,
  layout          = 'vertical',
  referenceValue,
  referenceLabel  = 'Objetivo',
  colorMode       = 'series',
  thresholdGood   = 80,
  thresholdWarn   = 50,
  unit            = '',
  className       = '',
}: LeanBarChartProps) {
  const isHorizontal = layout === 'horizontal'
  const isSingleKey  = keys.length === 1

  // Márgenes según orientación
  const margin = isHorizontal
    ? { top: 5, right: 20, bottom: 5, left: 100 }
    : { top: 5, right: 20, bottom: 20, left: 10 }

  return (
    <div className={className}>
      <BarChart
        data={data}
        layout={isHorizontal ? 'horizontal' : 'vertical'}
        margin={margin}
        barCategoryGap="28%"
        barGap={4}
      >
        <CartesianGrid
          strokeDasharray="4 2"
          stroke={CHART_PALETTE.border}
          vertical={!isHorizontal}
          horizontal={isHorizontal || !isHorizontal}
        />

        {/* Eje de categorías */}
        {isHorizontal ? (
          <YAxis
            dataKey="label"
            type="category"
            width={92}
            tick={{ fill: CHART_PALETTE.muted, fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
        ) : (
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_PALETTE.muted, fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
        )}

        {/* Eje de valores */}
        {isHorizontal ? (
          <XAxis
            type="number"
            tick={{ fill: CHART_PALETTE.subtle, fontSize: 10, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />
        ) : (
          <YAxis
            tick={{ fill: CHART_PALETTE.subtle, fontSize: 10, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
            width={36}
          />
        )}

        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: CHART_PALETTE.surface }} />

        {keys.length > 1 && (
          <Legend
            wrapperStyle={{
              fontSize:   '11px',
              color:      CHART_PALETTE.muted,
              fontFamily: 'Inter, sans-serif',
              paddingTop: '12px',
            }}
          />
        )}

        {/* Línea de referencia / target */}
        {referenceValue !== undefined && (
          <ReferenceLine
            {...(isHorizontal ? { x: referenceValue } : { y: referenceValue })}
            stroke={CHART_PALETTE.navy}
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value:    referenceLabel,
              position: 'insideTopRight',
              fill:     CHART_PALETTE.navy,
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
    </div>
  )
}

// ── Datos de demo ──────────────────────────────────────────────

export const DEMO_KPI_DATA: BarDataPoint[] = [
  { label: 'Reducción costes',   actual: 23, target: 30 },
  { label: 'Automatización',     actual: 61, target: 70 },
  { label: 'Satisfacción equipo', actual: 74, target: 80 },
  { label: 'Time-to-decision',   actual: 45, target: 60 },
  { label: 'Errores manuales',   actual: 38, target: 50 },
]

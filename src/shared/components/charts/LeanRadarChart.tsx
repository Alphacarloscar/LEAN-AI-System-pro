import { type ReactNode } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts'
import { ChartWrapper, CHART_PALETTE } from './ChartWrapper'
import { Table } from '@shared/design-system/components'

// ─────────────────────────────────────────────────────────────
// LeanRadarChart — Spider chart para AI Readiness Assessment (T1)
//
// Muestra la madurez IA en 6 dimensiones: Datos, Procesos,
// Talento, Tecnología, Cultura, Gobernanza.
//
// Soporta dos series: estado actual + objetivo (opcional).
//
// Uso:
//   <LeanRadarChart data={readinessData} />
//   <LeanRadarChart data={readinessData} showTarget />
// ─────────────────────────────────────────────────────────────

export interface RadarDimension {
  dimension:  string    // nombre del eje, ej. "Datos"
  current:    number    // 0–5
  target?:    number    // 0–5 (opcional)
  maxValue?:  number    // default 5
}

export interface LeanRadarChartProps {
  data:         RadarDimension[]
  /** Descripción del gráfico para lectores de pantalla (WCAG 1.1.1). Obligatoria. */
  ariaLabel:    string
  /** Tabla de datos alternativa. Si se omite se genera automáticamente desde `data`. */
  dataTable?:   ReactNode
  showTarget?:  boolean
  maxValue?:    number     // escala del radar, default 5
  height?:      number
  title?:       string
  subtitle?:    string
  loading?:     boolean
  className?:   string
}

// ── Tooltip personalizado ──────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-white dark:bg-gray-900 shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-lean-black dark:text-gray-100 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-muted">{entry.name}:</span>
          <span className="font-medium text-lean-black dark:text-gray-100">
            {entry.value} / {entry.payload?.maxValue ?? 5}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────

// ── Tabla accesible autogenerada ────────────────────────────────

function buildRadarTable(data: RadarDimension[], maxValue: number): ReactNode {
  type Row = RadarDimension
  const columns = [
    { key: 'dimension', header: 'Dimensión' },
    { key: 'current',   header: `Actual (0–${maxValue})`, align: 'right' as const },
    ...(data.some(d => d.target != null)
      ? [{ key: 'target', header: `Objetivo (0–${maxValue})`, align: 'right' as const }]
      : []
    ),
  ]
  return (
    <Table<Row>
      columns={columns}
      rows={data}
      keyExtractor={(r) => r.dimension}
    />
  )
}

// ── Componente principal ───────────────────────────────────────

export function LeanRadarChart({
  data,
  ariaLabel,
  dataTable,
  showTarget = false,
  maxValue   = 5,
  height     = 300,
  title,
  subtitle,
  loading    = false,
  className  = '',
}: LeanRadarChartProps) {
  // Normalizar los datos para incluir maxValue en cada punto
  const normalized = data.map((d) => ({ ...d, maxValue }))
  const resolvedTable = dataTable ?? buildRadarTable(data, maxValue)

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
      <RadarChart
        data={normalized}
        margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
        // RadarChart recibe width/height del ResponsiveContainer padre
        // cuando se usa dentro de ChartWrapper. Si se usa standalone,
        // se puede especificar aquí.
      >
        <PolarGrid
          stroke={CHART_PALETTE.border}
          strokeDasharray="4 2"
        />

        <PolarAngleAxis
          dataKey="dimension"
          tick={{
            fill:     CHART_PALETTE.muted,
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
          }}
        />

        <PolarRadiusAxis
          angle={90}
          domain={[0, maxValue]}
          tick={{
            fill:     CHART_PALETTE.subtle,
            fontSize: 9,
          }}
          tickCount={maxValue + 1}
          stroke={CHART_PALETTE.border}
        />

        {/* Área de estado actual */}
        <Radar
          name="Estado actual"
          dataKey="current"
          stroke={CHART_PALETTE.navy}
          fill={CHART_PALETTE.navy}
          fillOpacity={0.18}
          strokeWidth={2}
          dot={{ r: 3, fill: CHART_PALETTE.navy, strokeWidth: 0 }}
        />

        {/* Área de objetivo — solo si showTarget */}
        {showTarget && (
          <Radar
            name="Objetivo"
            dataKey="target"
            stroke={CHART_PALETTE.success}
            fill={CHART_PALETTE.success}
            fillOpacity={0.10}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3, fill: CHART_PALETTE.success, strokeWidth: 0 }}
          />
        )}

        <Tooltip content={<CustomTooltip />} />

        {showTarget && (
          <Legend
            wrapperStyle={{
              fontSize:   '11px',
              color:      CHART_PALETTE.muted,
              fontFamily: 'Inter, sans-serif',
            }}
          />
        )}
      </RadarChart>
    </ChartWrapper>
  )
}


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
import { CHART_PALETTE } from './ChartWrapper'

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
  showTarget?:  boolean
  maxValue?:    number     // escala del radar, default 5
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

export function LeanRadarChart({
  data,
  showTarget = false,
  maxValue   = 5,
  className  = '',
}: LeanRadarChartProps) {
  // Normalizar los datos para incluir maxValue en cada punto
  const normalized = data.map((d) => ({ ...d, maxValue }))

  return (
    <div className={className}>
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
    </div>
  )
}

// ── Datos por defecto para demo / Storybook ────────────────────

export const DEMO_RADAR_DATA: RadarDimension[] = [
  { dimension: 'Datos',       current: 3, target: 5 },
  { dimension: 'Procesos',    current: 2, target: 4 },
  { dimension: 'Talento',     current: 2, target: 4 },
  { dimension: 'Tecnología',  current: 4, target: 5 },
  { dimension: 'Cultura',     current: 1, target: 3 },
  { dimension: 'Gobernanza',  current: 2, target: 4 },
]

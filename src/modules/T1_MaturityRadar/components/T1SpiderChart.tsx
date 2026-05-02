// ============================================================
// T1 — Spider Chart (SVG custom)
//
// Gráfico de araña construido en SVG puro — sin dependencia
// en Recharts. Control total sobre colores, dark mode y animación.
//
// Especificaciones:
//   — 6 dimensiones, escala 0-4
//   — 4 anillos de grilla (1, 2, 3, 4)
//   — Polígono actual: fill navy / info-soft en dark mode
//   — Polígono target 3.5: trazo punteado verde
//   — Labels de dimensión con score anotado
//   — Dark mode detectado via MutationObserver
// ============================================================

import { useState, useEffect } from 'react'
import type { T1DimensionState } from '../types'
import { computeDimensionScore } from '../types'

// ── Constantes de layout ──────────────────────────────────────

const VIEWBOX  = 300               // SVG viewBox cuadrado
const CX       = VIEWBOX / 2       // centro X
const CY       = VIEWBOX / 2       // centro Y
const R        = 108               // radio exterior (al vértice del anillo 4)
const N        = 6                 // número de dimensiones
const TARGET   = 3.5               // objetivo estándar del sprint
const MAX      = 4                 // escala máxima

// Ángulos de cada eje (radianes, empezando desde arriba = -π/2)
const AXES = Array.from({ length: N }, (_, i) => (i / N) * 2 * Math.PI - Math.PI / 2)

// ── Helpers geométricos ───────────────────────────────────────

function polarXY(angle: number, dist: number): [number, number] {
  return [
    CX + dist * Math.cos(angle),
    CY + dist * Math.sin(angle),
  ]
}

function toPoints(values: number[], max: number): string {
  return AXES.map((angle, i) => {
    const [x, y] = polarXY(angle, (values[i] / max) * R)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

// ── Hook: detecta dark mode en tiempo real ───────────────────

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return isDark
}

// ── Paleta adaptada a light/dark ─────────────────────────────

function palette(isDark: boolean) {
  return {
    grid:        isDark ? '#3E3B35' : '#D4D0C8',    // anillos de grilla — warm
    axis:        isDark ? '#333028' : '#E8E5DC',    // líneas de ejes — warm
    fill:        isDark ? 'rgba(196,192,184,0.14)' : 'rgba(42,40,34,0.10)',  // fill polígono
    stroke:      isDark ? '#C4C0B8' : '#2A2822',   // trazo polígono — warm metallic
    dot:         isDark ? '#C8860A' : '#2A2822',   // puntos de score — gold en dark, charcoal en light
    target:      '#5FAF8A',                         // target siempre verde
    label:       isDark ? '#9A9790' : '#6B6864',   // texto labels — warm
    labelScore:  isDark ? '#F0EDE8' : '#1C1A16',   // texto score en dot — warm
    gridLabel:   isDark ? '#4A4740' : '#C4C0B8',   // valores de anillos (1,2,3,4)
  }
}

// ── Componente ────────────────────────────────────────────────

interface T1SpiderChartProps {
  dimensions: T1DimensionState[]
}

export function T1SpiderChart({ dimensions }: T1SpiderChartProps) {
  const isDark = useIsDark()
  const p      = palette(isDark)

  // Scores por dimensión (0 si no puntuada)
  const scores = dimensions.map((d) => computeDimensionScore(d) ?? 0)
  const hasAnyScore = scores.some((s) => s > 0)

  // Puntos del polígono actual y del target
  const currentPts = toPoints(scores, MAX)
  const targetPts  = toPoints(Array(N).fill(TARGET), MAX)

  // Puntos de los anillos de grilla
  const gridPts = [1, 2, 3, 4].map((level) =>
    toPoints(Array(N).fill(level), MAX)
  )

  // ── Render ─────────────────────────────────────────────────

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className="w-full h-full select-none"
      aria-label="Radar de madurez IA"
    >
      <defs>
        {/* Gradientes para los dots del radar — luz desde arriba-izquierda */}
        <radialGradient id="spider-dot-light" cx="35%" cy="28%" r="70%" fx="35%" fy="28%">
          <stop offset="0%"   stopColor="#5A5550" />
          <stop offset="50%"  stopColor="#2A2822" />
          <stop offset="100%" stopColor="#1C1A16" />
        </radialGradient>
        <radialGradient id="spider-dot-dark" cx="35%" cy="28%" r="70%" fx="35%" fy="28%">
          <stop offset="0%"   stopColor="#E0A018" />
          <stop offset="50%"  stopColor="#C8860A" />
          <stop offset="100%" stopColor="#A06808" />
        </radialGradient>
      </defs>
      {/* ── Anillos de grilla ── */}
      {gridPts.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={p.grid}
          strokeWidth={i === 3 ? 1.5 : 0.8}
        />
      ))}

      {/* ── Etiquetas de nivel (1-4) en el eje superior ── */}
      {[1, 2, 3, 4].map((level) => {
        const [, y] = polarXY(-Math.PI / 2, (level / MAX) * R)
        return (
          <text
            key={level}
            x={CX + 4}
            y={y + 1}
            fontSize="8"
            fill={p.gridLabel}
            textAnchor="start"
            dominantBaseline="middle"
          >
            {level}
          </text>
        )
      })}

      {/* ── Líneas de ejes ── */}
      {AXES.map((angle, i) => {
        const [x, y] = polarXY(angle, R)
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={x.toFixed(2)} y2={y.toFixed(2)}
            stroke={p.axis}
            strokeWidth={0.8}
          />
        )
      })}

      {/* ── Polígono target (3.5 — trazo punteado verde) ── */}
      <polygon
        points={targetPts}
        fill="none"
        stroke={p.target}
        strokeWidth={1.5}
        strokeDasharray="5 3"
        opacity={0.65}
      />

      {/* ── Polígono actual ── */}
      {hasAnyScore && (
        <polygon
          points={currentPts}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}

      {/* ── Dots + score labels ── */}
      {hasAnyScore && AXES.map((angle, i) => {
        if (scores[i] === 0) return null
        const [x, y] = polarXY(angle, (scores[i] / MAX) * R)
        // Desplazar la etiqueta hacia fuera del centro
        const labelOffset = 10
        const [lx, ly]   = polarXY(angle, (scores[i] / MAX) * R + labelOffset)

        return (
          <g key={i}>
            {/* Halo suave — profundidad metálica */}
            <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r={7}
              fill={p.dot} opacity={0.18} />
            {/* Dot con gradiente radial esférico */}
            <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r={3.5}
              fill={isDark ? 'url(#spider-dot-dark)' : 'url(#spider-dot-light)'}
              stroke="rgba(255,255,255,0.70)"
              strokeWidth={0.8} />
            {/* Shine — punto de luz superior-izquierda */}
            <ellipse
              cx={(parseFloat(x.toFixed(2)) - 1.3).toFixed(2)}
              cy={(parseFloat(y.toFixed(2)) - 1.3).toFixed(2)}
              rx={1.4} ry={0.8}
              fill="rgba(255,255,255,0.60)"
              style={{ pointerEvents: 'none' }}
            />
            {/* Score value */}
            <text
              x={lx.toFixed(2)}
              y={ly.toFixed(2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8.5"
              fontWeight="600"
              fill={p.labelScore}
            >
              {scores[i].toFixed(1)}
            </text>
          </g>
        )
      })}

      {/* ── Labels de dimensión ── */}
      {dimensions.map((dim, i) => {
        const labelR = R + 26
        const [x, y] = polarXY(AXES[i], labelR)

        // Alineación horizontal según posición en el círculo
        const cos = Math.cos(AXES[i])
        const anchor =
          cos < -0.2 ? 'end' :
          cos >  0.2 ? 'start' :
          'middle'

        return (
          <text
            key={dim.code}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="500"
            fill={p.label}
          >
            {dim.label}
          </text>
        )
      })}

      {/* ── Punto central ── */}
      <circle cx={CX} cy={CY} r={2} fill={p.grid} />
    </svg>
  )
}

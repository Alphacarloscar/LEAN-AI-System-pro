// ============================================================
// T2 — MiniPositionMap
//
// Mini mapa de posición (cuadrante) — muestra al stakeholder
// como punto en el espacio adopción × influencia.
// ============================================================

import type { ArchetypeCode } from '../types'
import { ARCHETYPE_HEX as ARCH_HEX } from './quadrantChartHelpers'

interface MiniPositionMapProps {
  adoptionScore:  number
  influenceScore: number
  archetype:      ArchetypeCode
  size?:          number
}

export function MiniPositionMap({
  adoptionScore,
  influenceScore,
  archetype,
  size = 56,
}: MiniPositionMapProps) {
  const S   = size
  const P   = Math.round(S * 0.12)
  const IN  = S - P * 2

  const dx  = P + (adoptionScore  / 4) * IN
  const dy  = P + (1 - influenceScore / 4) * IN
  const hex = ARCH_HEX[archetype]
  const MID = P + IN / 2

  const dotR    = S * 0.040
  const glow1R  = S * 0.110
  const glow2R  = S * 0.065
  const lblSize = Math.max(S * 0.080, 5)
  const strokeW = Math.max(S * 0.006, 0.35)

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ display: 'block' }}>
      {/* Quadrant fills */}
      <rect x={P}       y={P}       width={IN/2-0.5} height={IN/2-0.5} fill={ARCH_HEX.critico}   opacity={0.07} rx={1} />
      <rect x={MID+0.5} y={P}       width={IN/2-0.5} height={IN/2-0.5} fill={ARCH_HEX.decisor}   opacity={0.07} rx={1} />
      <rect x={P}       y={MID+0.5} width={IN/2-0.5} height={IN/2-0.5} fill={ARCH_HEX.reticente} opacity={0.07} rx={1} />
      <rect x={MID+0.5} y={MID+0.5} width={IN/2-0.5} height={IN/2-0.5} fill={ARCH_HEX.adoptador} opacity={0.07} rx={1} />
      {/* Grid border */}
      <rect x={P} y={P} width={IN} height={IN} fill="none" stroke="var(--color-border)" strokeWidth={0.5} rx={2} />
      {/* Crosshair */}
      <line x1={MID} y1={P}   x2={MID} y2={P+IN} stroke="var(--color-warm-100)" strokeWidth={strokeW} opacity={0.22} />
      <line x1={P}   y1={MID} x2={P+IN} y2={MID} stroke="var(--color-warm-100)" strokeWidth={strokeW} opacity={0.22} />
      {/* Axis labels */}
      <text x={MID} y={S - P * 0.3} textAnchor="middle" fontSize={lblSize}
        fill="var(--color-warm-100)" fontFamily="ui-monospace,monospace">adopción</text>
      <text x={P * 0.35} y={MID + 1} textAnchor="middle" fontSize={lblSize}
        fill="var(--color-warm-100)" fontFamily="ui-monospace,monospace"
        transform={`rotate(-90,${P * 0.35},${MID})`}>influencia</text>
      {/* Glow halos */}
      <circle cx={dx} cy={dy} r={glow1R} fill={hex} opacity={0.08} />
      <circle cx={dx} cy={dy} r={glow2R} fill={hex} opacity={0.20} />
      {/* Main dot */}
      <circle cx={dx} cy={dy} r={dotR} fill={hex} opacity={0.92} />
      {/* Shine */}
      <ellipse cx={dx - dotR * 0.32} cy={dy - dotR * 0.32}
        rx={dotR * 0.38} ry={dotR * 0.24}
        fill="rgba(255,255,255,0.60)" />
    </svg>
  )
}

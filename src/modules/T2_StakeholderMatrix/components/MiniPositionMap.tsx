// ============================================================
// T2 — MiniPositionMap
//
// Mini mapa de posición (cuadrante) — muestra al stakeholder
// como punto en el espacio adopción × influencia.
// ============================================================

import type { ArchetypeCode } from '../types'

const ARCH_HEX: Record<ArchetypeCode, string> = {
  adoptador:  '#5FAF8A',
  ambassador: '#6A90C0',
  decisor:    '#2A2822',
  critico:    '#C06060',
  reticente:  '#D4A85C',
}

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
      <rect x={P}       y={P}       width={IN/2-0.5} height={IN/2-0.5} fill="#C06060" opacity={0.07} rx={1} />
      <rect x={MID+0.5} y={P}       width={IN/2-0.5} height={IN/2-0.5} fill="#2A2822" opacity={0.07} rx={1} />
      <rect x={P}       y={MID+0.5} width={IN/2-0.5} height={IN/2-0.5} fill="#D4A85C" opacity={0.07} rx={1} />
      <rect x={MID+0.5} y={MID+0.5} width={IN/2-0.5} height={IN/2-0.5} fill="#5FAF8A" opacity={0.07} rx={1} />
      {/* Grid border */}
      <rect x={P} y={P} width={IN} height={IN} fill="none" stroke="#E2E8F0" strokeWidth={0.5} rx={2} />
      {/* Crosshair */}
      <line x1={MID} y1={P}   x2={MID} y2={P+IN} stroke="#94A3B8" strokeWidth={strokeW} opacity={0.22} />
      <line x1={P}   y1={MID} x2={P+IN} y2={MID} stroke="#94A3B8" strokeWidth={strokeW} opacity={0.22} />
      {/* Axis labels */}
      <text x={MID} y={S - P * 0.3} textAnchor="middle" fontSize={lblSize}
        fill="#94A3B8" fontFamily="ui-monospace,monospace">adopción</text>
      <text x={P * 0.35} y={MID + 1} textAnchor="middle" fontSize={lblSize}
        fill="#94A3B8" fontFamily="ui-monospace,monospace"
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

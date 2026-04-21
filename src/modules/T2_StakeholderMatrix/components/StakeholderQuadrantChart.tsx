// ============================================================
// T2 — StakeholderQuadrantChart (v2 — circular)
//
// Gráfico circular: X = Adopción IA (0-4), Y = Influencia (0-4)
// Cada stakeholder = punto dentro de un círculo dividido en 4 cuadrantes.
//
// Cuadrantes:
//   TL: Alta influencia / Baja adopción  → Crítico    (bloquea)
//   TR: Alta influencia / Alta adopción  → Decisor    (decide y lidera)
//   BL: Baja influencia / Baja adopción  → Especialista
//   BR: Baja influencia / Alta adopción  → Adoptador
//
// Visual:
//   - Círculo con 4 sectores coloreados (clipPath)
//   - Punto r=14 coloreado por arquetipo
//   - Anillo de resistencia: fino verde / ámbar discontinuo / rojo sólido
//   - Iniciales 2 chars dentro del punto
//   - Tooltip al hover: nombre + arquetipo + resistencia
//   - Click → activa panel lateral
//   - Jitter anti-solapamiento constrained al círculo
// ============================================================

import { useState } from 'react'
import type { Stakeholder, ArchetypeCode, ResistanceLevel } from '../types'
import { ARCHETYPE_CONFIG, RESISTANCE_CONFIG }               from '../constants'

// ── Props ─────────────────────────────────────────────────────

interface StakeholderQuadrantChartProps {
  stakeholders: Stakeholder[]
  activeId:     string | null
  onSelect:     (s: Stakeholder) => void
}

// ── Constantes del layout SVG ─────────────────────────────────

const VB    = 520        // viewBox cuadrado (px)
const CX    = 260        // centro X
const CY    = 260        // centro Y
const CR    = 200        // radio del círculo del gráfico
const DOT_R = 14         // radio del punto de stakeholder (reducido de 20)
const MAX_R = CR - DOT_R - 4   // 182: margen para que el punto no sobresalga del círculo

// ── Helpers de coordenadas ────────────────────────────────────

/** Score (0–4) → coordenada X en el SVG */
function toSvgX(score: number) {
  return CX + ((score - 2) / 2) * CR
}

/** Score (0–4) → coordenada Y en el SVG (invertido: mayor score = arriba) */
function toSvgY(score: number) {
  return CY - ((score - 2) / 2) * CR
}

/** Limita el punto al área circular válida */
function constrainToCircle(cx: number, cy: number): { cx: number; cy: number } {
  const dx   = cx - CX
  const dy   = cy - CY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist <= MAX_R) return { cx, cy }
  const scale = MAX_R / dist
  return { cx: CX + dx * scale, cy: CY + dy * scale }
}

/** Iniciales del nombre (máx 2 caracteres) */
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Colores en hex (para SVG — no Tailwind) ───────────────────

const ARCHETYPE_HEX: Record<ArchetypeCode, string> = {
  adoptador:    '#5FAF8A',
  ambassador:   '#6A90C0',
  decisor:      '#1B2A4E',
  critico:      '#C06060',
  especialista: '#D4A85C',
}

const ARCHETYPE_BG_HEX: Record<ArchetypeCode, string> = {
  adoptador:    '#D4EDE3',
  ambassador:   '#DDE8F5',
  decisor:      'rgba(27,42,78,0.10)',
  critico:      '#F5DEDE',
  especialista: '#FAF0D7',
}

const RESISTANCE_STROKE: Record<ResistanceLevel, { color: string; width: number; dasharray?: string }> = {
  baja:  { color: '#5FAF8A', width: 1.5 },
  media: { color: '#D4A85C', width: 2.5, dasharray: '4 3' },
  alta:  { color: '#C06060', width: 3 },
}

// ── Jitter anti-solapamiento (constrained al círculo) ─────────

function applyJitter(
  items: { id: string; cx: number; cy: number }[]
): Map<string, { cx: number; cy: number }> {
  const result    = new Map<string, { cx: number; cy: number }>()
  const positions = items.map((item) => ({ ...item }))

  const ITERATIONS = 40
  const MIN_DIST   = DOT_R * 2 + 8
  const FORCE      = 0.4

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx   = positions[j].cx - positions[i].cx
        const dy   = positions[j].cy - positions[i].cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        if (dist < MIN_DIST) {
          const overlap = (MIN_DIST - dist) / 2
          const nx      = (dx / dist) * overlap * FORCE
          const ny      = (dy / dist) * overlap * FORCE
          positions[i].cx -= nx
          positions[i].cy -= ny
          positions[j].cx += nx
          positions[j].cy += ny
        }
      }
    }
    // Re-constrain al círculo tras cada iteración
    for (const p of positions) {
      const c = constrainToCircle(p.cx, p.cy)
      p.cx = c.cx
      p.cy = c.cy
    }
  }

  positions.forEach((p) => {
    result.set(p.id, { cx: p.cx, cy: p.cy })
  })

  return result
}

// ── Componente principal ──────────────────────────────────────

export function StakeholderQuadrantChart({
  stakeholders,
  activeId,
  onSelect,
}: StakeholderQuadrantChartProps) {
  const [hoverId, setHoverId] = useState<string | null>(null)

  const withScores    = stakeholders.filter((s) =>  s.interview)
  const withoutScores = stakeholders.filter((s) => !s.interview)

  // Posiciones base → jitter
  const basePositions = withScores.map((s) => ({
    id: s.id,
    cx: toSvgX(s.interview!.adoptionScore),
    cy: toSvgY(s.interview!.influenceScore),
  }))
  const jittered = applyJitter(basePositions)

  // Arquetipos presentes
  const archetypesPresent = [...new Set(stakeholders.map((s) => s.archetype))]

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            Mapa de stakeholders
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Adopción IA × Influencia organizacional
          </p>
        </div>
        {/* Leyenda de arquetipos */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end">
          {archetypesPresent.map((code) => (
            <div key={code} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: ARCHETYPE_HEX[code] }}
              />
              <span className="text-[10px] text-text-subtle">{ARCHETYPE_CONFIG[code].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG chart — circular */}
      <div className="flex justify-center px-6 py-5">
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          className="w-full"
          style={{ maxWidth: 420, maxHeight: 420 }}
        >
          <defs>
            {/* ClipPath circular para los fondos de cuadrante */}
            <clipPath id="quad-clip">
              <circle cx={CX} cy={CY} r={CR} />
            </clipPath>
          </defs>

          {/* ── Fondos de cuadrante y crosshairs (clipped al círculo) ── */}
          <g clipPath="url(#quad-clip)">
            {/* TL: Alta influencia / Baja adopción → Crítico */}
            <rect x={0} y={0} width={CX} height={CY}
              fill={ARCHETYPE_BG_HEX.critico} opacity={0.55} />
            {/* TR: Alta influencia / Alta adopción → Decisor */}
            <rect x={CX} y={0} width={VB} height={CY}
              fill={ARCHETYPE_BG_HEX.decisor} opacity={0.55} />
            {/* BL: Baja influencia / Baja adopción → Especialista */}
            <rect x={0} y={CY} width={CX} height={VB}
              fill={ARCHETYPE_BG_HEX.especialista} opacity={0.55} />
            {/* BR: Baja influencia / Alta adopción → Adoptador */}
            <rect x={CX} y={CY} width={VB} height={VB}
              fill={ARCHETYPE_BG_HEX.adoptador} opacity={0.55} />

            {/* Líneas divisorias (crosshairs) */}
            <line x1={0} y1={CY} x2={VB} y2={CY}
              stroke="#C8CACD" strokeWidth={1} strokeDasharray="5 4" />
            <line x1={CX} y1={0} x2={CX} y2={VB}
              stroke="#C8CACD" strokeWidth={1} strokeDasharray="5 4" />

            {/* Labels de cuadrante — en las esquinas diagonales (~75% del radio) */}
            {/* TL: Crítico */}
            <text x={CX - 108} y={CY - 104} textAnchor="middle"
              fontSize={8} fontWeight="700" fontFamily="ui-monospace, monospace"
              fill={ARCHETYPE_HEX.critico} opacity={0.55} letterSpacing="0.06em">
              CRÍTICO
            </text>
            <text x={CX - 108} y={CY - 93} textAnchor="middle"
              fontSize={7} fontFamily="ui-monospace, monospace"
              fill={ARCHETYPE_HEX.critico} opacity={0.38}>
              bloquea
            </text>

            {/* TR: Decisor */}
            <text x={CX + 108} y={CY - 104} textAnchor="middle"
              fontSize={8} fontWeight="700" fontFamily="ui-monospace, monospace"
              fill={ARCHETYPE_HEX.decisor} opacity={0.55} letterSpacing="0.06em">
              DECISOR
            </text>
            <text x={CX + 108} y={CY - 93} textAnchor="middle"
              fontSize={7} fontFamily="ui-monospace, monospace"
              fill={ARCHETYPE_HEX.decisor} opacity={0.38}>
              lidera
            </text>

            {/* BL: Especialista */}
            <text x={CX - 108} y={CY + 100} textAnchor="middle"
              fontSize={8} fontWeight="700" fontFamily="ui-monospace, monospace"
              fill={ARCHETYPE_HEX.especialista} opacity={0.55} letterSpacing="0.06em">
              ESPECIALISTA
            </text>
            <text x={CX - 108} y={CY + 111} textAnchor="middle"
              fontSize={7} fontFamily="ui-monospace, monospace"
              fill={ARCHETYPE_HEX.especialista} opacity={0.38}>
              dominio / miedo
            </text>

            {/* BR: Adoptador */}
            <text x={CX + 108} y={CY + 100} textAnchor="middle"
              fontSize={8} fontWeight="700" fontFamily="ui-monospace, monospace"
              fill={ARCHETYPE_HEX.adoptador} opacity={0.55} letterSpacing="0.06em">
              ADOPTADOR
            </text>
            <text x={CX + 108} y={CY + 111} textAnchor="middle"
              fontSize={7} fontFamily="ui-monospace, monospace"
              fill={ARCHETYPE_HEX.adoptador} opacity={0.38}>
              usa y adopta
            </text>
          </g>

          {/* ── Borde del círculo (encima de los fondos) ── */}
          <circle cx={CX} cy={CY} r={CR}
            fill="none" stroke="#D1D5DB" strokeWidth={1.5} />

          {/* ── Labels de eje (fuera del círculo) ── */}
          <text x={CX} y={CY - CR - 14} textAnchor="middle"
            fontSize={8.5} fill="#9CA3AF" fontFamily="ui-monospace, monospace">
            ↑ Alta influencia
          </text>
          <text x={CX} y={CY + CR + 22} textAnchor="middle"
            fontSize={8.5} fill="#9CA3AF" fontFamily="ui-monospace, monospace">
            Baja influencia ↓
          </text>
          <text x={CX - CR - 6} y={CY + 4} textAnchor="end"
            fontSize={8.5} fill="#9CA3AF" fontFamily="ui-monospace, monospace">
            ← Baja
          </text>
          <text x={CX + CR + 6} y={CY + 4} textAnchor="start"
            fontSize={8.5} fill="#9CA3AF" fontFamily="ui-monospace, monospace">
            Alta →
          </text>
          {/* Título eje X */}
          <text x={CX} y={VB - 6} textAnchor="middle"
            fontSize={9} fill="#6B7280" fontFamily="Inter, sans-serif">
            Adopción IA
          </text>

          {/* ── Puntos de stakeholders (renderizados encima, sin clipPath) ── */}
          {withScores.map((s) => {
            const base    = { cx: toSvgX(s.interview!.adoptionScore), cy: toSvgY(s.interview!.influenceScore) }
            const pos     = jittered.get(s.id) ?? constrainToCircle(base.cx, base.cy)
            const isActive = s.id === activeId
            const isHover  = s.id === hoverId
            const stroke   = RESISTANCE_STROKE[s.resistance]
            const fill     = ARCHETYPE_HEX[s.archetype]
            const ini      = initials(s.name)

            return (
              <g
                key={s.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(s)}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {/* Aura de selección / hover */}
                {(isActive || isHover) && (
                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={DOT_R + 8}
                    fill={fill} opacity={0.18}
                  />
                )}

                {/* Anillo de resistencia (fill=none → dashes visibles) */}
                <circle
                  cx={pos.cx} cy={pos.cy}
                  r={DOT_R + stroke.width + 1.5}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  strokeDasharray={stroke.dasharray}
                  opacity={s.resistance === 'baja' ? 0.6 : 0.9}
                />

                {/* Círculo del arquetipo */}
                <circle
                  cx={pos.cx} cy={pos.cy}
                  r={DOT_R}
                  fill={fill}
                  stroke={isActive ? '#FFFFFF' : 'none'}
                  strokeWidth={isActive ? 2 : 0}
                />

                {/* Iniciales */}
                <text
                  x={pos.cx} y={pos.cy + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight="700"
                  fill="#FFFFFF"
                  fontFamily="Inter, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {ini}
                </text>

                {/* Tooltip hover */}
                {isHover && (
                  <g>
                    {(() => {
                      const ttW       = 155
                      const ttH       = 38
                      const showAbove = pos.cy - DOT_R - 10 > ttH + 6
                      const ttY       = showAbove
                        ? pos.cy - DOT_R - ttH - 8
                        : pos.cy + DOT_R + 8
                      const rawX      = pos.cx - ttW / 2
                      const ttX       = Math.max(6, Math.min(VB - ttW - 6, rawX))
                      return (
                        <>
                          <rect x={ttX} y={ttY} width={ttW} height={ttH}
                            rx={6} fill="#0A0A0A" opacity={0.88} />
                          <text x={ttX + ttW / 2} y={ttY + 14}
                            textAnchor="middle" fontSize={10.5} fontWeight="600"
                            fill="#FFFFFF" fontFamily="Inter, sans-serif">
                            {s.name}
                          </text>
                          <text x={ttX + ttW / 2} y={ttY + 27}
                            textAnchor="middle" fontSize={9.5}
                            fill={fill} fontFamily="Inter, sans-serif">
                            {ARCHETYPE_CONFIG[s.archetype].label} · {RESISTANCE_CONFIG[s.resistance].label}
                          </text>
                        </>
                      )
                    })()}
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* ── Leyenda de resistencia ── */}
      <div className="px-5 pb-3 flex items-center gap-5 border-t border-border/50 pt-3">
        <span className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">
          Resistencia:
        </span>
        {([
          { level: 'baja'  as ResistanceLevel, label: 'Baja' },
          { level: 'media' as ResistanceLevel, label: 'Media' },
          { level: 'alta'  as ResistanceLevel, label: 'Alta' },
        ]).map(({ level, label }) => {
          const s = RESISTANCE_STROKE[level]
          return (
            <div key={level} className="flex items-center gap-1.5">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r="5"
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeDasharray={s.dasharray}
                />
              </svg>
              <span className="text-[10px] text-text-subtle">{label}</span>
            </div>
          )
        })}
      </div>

      {/* ── Stakeholders sin entrevista ── */}
      {withoutScores.length > 0 && (
        <div className="px-5 pb-4 border-t border-border/50 pt-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
            Sin entrevista completada
          </p>
          <div className="flex flex-wrap gap-2">
            {withoutScores.map((s) => {
              const cfg = ARCHETYPE_CONFIG[s.archetype]
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${cfg.badgeBg} ${cfg.badgeText} hover:opacity-80`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: ARCHETYPE_HEX[s.archetype] }}
                  />
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

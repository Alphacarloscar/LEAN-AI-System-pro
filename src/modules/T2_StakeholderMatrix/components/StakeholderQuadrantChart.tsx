// ============================================================
// T2 — StakeholderQuadrantChart
//
// Mapa 2D: X = Adopción IA (0-4), Y = Influencia (0-4)
// Cada stakeholder = un punto posicionado por sus scores.
//
// Cuadrantes (naturaleza del perfil):
//   ┌────────────────┬────────────────────┐
//   │ Crítico         │ Decisor/Ambassador │  ← Alta influencia
//   │ (bloquea)       │ (decide y lidera)  │
//   ├────────────────┼────────────────────┤
//   │ Especialista    │ Adoptador          │  ← Baja influencia
//   │ (dominio/miedo) │ (usa y adopta)     │
//   └────────────────┴────────────────────┘
//       Baja adopción    Alta adopción
//
// Visual:
//   - Punto coloreado por arquetipo
//   - Borde grueso rojo = resistencia Alta | naranja = Media | fino = Baja
//   - Iniciales dentro del punto
//   - Nombre completo al hover
//   - Click → activa el panel lateral
// ============================================================

import { useState } from 'react'
import type { Stakeholder, ArchetypeCode, ResistanceLevel } from '../types'
import { ARCHETYPE_CONFIG, RESISTANCE_CONFIG }               from '../constants'

// ── Props ─────────────────────────────────────────────────────

interface StakeholderQuadrantChartProps {
  stakeholders:      Stakeholder[]
  activeId:          string | null
  onSelect:          (s: Stakeholder) => void
  /** Si true, fondo oscuro (dark mode se hereda via CSS, no via prop) */
}

// ── Constantes del layout SVG ─────────────────────────────────

const VB_W    = 560
const VB_H    = 380
const ML      = 58    // margin left (eje Y label)
const MR      = 20    // margin right
const MT      = 24    // margin top
const MB      = 52    // margin bottom (eje X label)
const PW      = VB_W - ML - MR   // plot width  = 482
const PH      = VB_H - MT - MB   // plot height = 304
const MID_X   = ML + PW / 2
const MID_Y   = MT + PH / 2
const DOT_R   = 20   // radio del punto
const SCORE_MAX = 4

// ── Helpers de coordenadas ────────────────────────────────────

/** Score → coordenada X en el SVG (0=izq, 4=der) */
function toX(score: number) {
  return ML + (score / SCORE_MAX) * PW
}

/** Score → coordenada Y en el SVG (4=arriba, 0=abajo — invertido) */
function toY(score: number) {
  return MT + PH - (score / SCORE_MAX) * PH
}

/** Iniciales del nombre (máx 2 caracteres) */
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Colores de arquetipo en hex (para SVG — no Tailwind) ──────

const ARCHETYPE_HEX: Record<ArchetypeCode, string> = {
  adoptador:   '#5FAF8A',   // success-dark
  ambassador:  '#6A90C0',   // info-dark
  decisor:     '#1B2A4E',   // navy
  critico:     '#C06060',   // danger-dark
  especialista:'#D4A85C',   // warning-dark
}

const ARCHETYPE_BG_HEX: Record<ArchetypeCode, string> = {
  adoptador:   '#D4EDE3',   // success-light
  ambassador:  '#DDE8F5',   // info-light
  decisor:     'rgba(27,42,78,0.12)',
  critico:     '#F5DEDE',   // danger-light
  especialista:'#FAF0D7',   // warning-light
}

const RESISTANCE_STROKE: Record<ResistanceLevel, { color: string; width: number; dasharray?: string }> = {
  baja:  { color: '#5FAF8A', width: 2 },
  media: { color: '#D4A85C', width: 3, dasharray: '5 3' },
  alta:  { color: '#C06060', width: 3.5 },
}

// ── Labels de cuadrante ───────────────────────────────────────

const QUADRANT_LABELS = [
  // Top-left: alta influencia, baja adopción
  { x: ML + 8, y: MT + 14, label: 'Alta influencia', sub: 'Baja adopción', anchor: 'start' as const, fill: ARCHETYPE_HEX.critico },
  // Top-right: alta influencia, alta adopción
  { x: ML + PW - 8, y: MT + 14, label: 'Alta influencia', sub: 'Alta adopción', anchor: 'end' as const, fill: ARCHETYPE_HEX.decisor },
  // Bottom-left: baja influencia, baja adopción
  { x: ML + 8, y: MT + PH - 6, label: 'Baja influencia', sub: 'Baja adopción', anchor: 'start' as const, fill: ARCHETYPE_HEX.especialista },
  // Bottom-right: baja influencia, alta adopción
  { x: ML + PW - 8, y: MT + PH - 6, label: 'Baja influencia', sub: 'Alta adopción', anchor: 'end' as const, fill: ARCHETYPE_HEX.adoptador },
]

// ── Jitter anti-solapamiento ──────────────────────────────────
// Si dos puntos están muy cerca, los separa ligeramente.

function applyJitter(
  items: { id: string; cx: number; cy: number }[]
): Map<string, { cx: number; cy: number }> {
  const result = new Map<string, { cx: number; cy: number }>()
  const positions = items.map((item) => ({ ...item }))

  const ITERATIONS = 30
  const MIN_DIST   = DOT_R * 2 + 4
  const FORCE      = 0.3

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].cx - positions[i].cx
        const dy = positions[j].cy - positions[i].cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        if (dist < MIN_DIST) {
          const overlap = (MIN_DIST - dist) / 2
          const nx = (dx / dist) * overlap * FORCE
          const ny = (dy / dist) * overlap * FORCE
          positions[i].cx -= nx
          positions[i].cy -= ny
          positions[j].cx += nx
          positions[j].cy += ny
        }
      }
    }
  }

  // Clamp dentro del área del plot
  positions.forEach((p) => {
    p.cx = Math.max(ML + DOT_R + 2, Math.min(ML + PW - DOT_R - 2, p.cx))
    p.cy = Math.max(MT + DOT_R + 2, Math.min(MT + PH - DOT_R - 2, p.cy))
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

  // Sólo stakeholders con entrevista (tienen scores)
  const withScores = stakeholders.filter((s) => s.interview)
  // Sin entrevista: los mostramos en una fila aparte
  const withoutScores = stakeholders.filter((s) => !s.interview)

  // Calcular posiciones base
  const basePositions = withScores.map((s) => ({
    id: s.id,
    cx: toX(s.interview!.adoptionScore),
    cy: toY(s.interview!.influenceScore),
  }))

  // Aplicar jitter
  const jittered = applyJitter(basePositions)

  // Leyenda de arquetipos presentes
  const archetypesPresent = [...new Set(stakeholders.map((s) => s.archetype))]

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            Mapa de stakeholders
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Adopción IA × Influencia organizacional
          </p>
        </div>
        {/* Leyenda */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end">
          {archetypesPresent.map((code) => {
            const cfg = ARCHETYPE_CONFIG[code]
            return (
              <div key={code} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ARCHETYPE_HEX[code] }}
                />
                <span className="text-[10px] text-text-subtle">{cfg.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* SVG chart */}
      <div className="px-2 py-2">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          style={{ maxHeight: 340 }}
        >
          {/* ── Fondos de cuadrante ── */}
          {/* Top-left: Crítico */}
          <rect x={ML} y={MT} width={PW / 2} height={PH / 2}
            fill={ARCHETYPE_BG_HEX.critico} opacity={0.4} />
          {/* Top-right: Decisor/Ambassador */}
          <rect x={MID_X} y={MT} width={PW / 2} height={PH / 2}
            fill={ARCHETYPE_BG_HEX.decisor} opacity={0.4} />
          {/* Bottom-left: Especialista */}
          <rect x={ML} y={MID_Y} width={PW / 2} height={PH / 2}
            fill={ARCHETYPE_BG_HEX.especialista} opacity={0.4} />
          {/* Bottom-right: Adoptador */}
          <rect x={MID_X} y={MID_Y} width={PW / 2} height={PH / 2}
            fill={ARCHETYPE_BG_HEX.adoptador} opacity={0.4} />

          {/* ── Borde del plot ── */}
          <rect x={ML} y={MT} width={PW} height={PH}
            fill="none" stroke="#E5E7EB" strokeWidth={1} />

          {/* ── Líneas divisorias de cuadrante ── */}
          <line x1={MID_X} y1={MT} x2={MID_X} y2={MT + PH}
            stroke="#D1D5DB" strokeWidth={1} strokeDasharray="5 4" />
          <line x1={ML} y1={MID_Y} x2={ML + PW} y2={MID_Y}
            stroke="#D1D5DB" strokeWidth={1} strokeDasharray="5 4" />

          {/* ── Labels de cuadrante ── */}
          {QUADRANT_LABELS.map((q, i) => (
            <g key={i} opacity={0.55}>
              <text x={q.x} y={q.y} textAnchor={q.anchor} fontSize={9}
                fontWeight="600" fill={q.fill} fontFamily="ui-monospace, monospace"
                letterSpacing="0.05em">
                {q.label.toUpperCase()}
              </text>
              <text x={q.x} y={q.y + 11} textAnchor={q.anchor} fontSize={8.5}
                fill={q.fill} fontFamily="ui-monospace, monospace" opacity={0.75}>
                {q.sub}
              </text>
            </g>
          ))}

          {/* ── Eje X: ticks y label ── */}
          {[0, 1, 2, 3, 4].map((v) => (
            <g key={`xt-${v}`}>
              <line x1={toX(v)} y1={MT + PH} x2={toX(v)} y2={MT + PH + 5}
                stroke="#9CA3AF" strokeWidth={1} />
              <text x={toX(v)} y={MT + PH + 16} textAnchor="middle"
                fontSize={10} fill="#9CA3AF" fontFamily="ui-monospace, monospace">
                {v}
              </text>
            </g>
          ))}
          <text x={ML + PW / 2} y={VB_H - 4} textAnchor="middle"
            fontSize={10} fill="#6B7280" fontFamily="Inter, sans-serif">
            Adopción IA →
          </text>

          {/* ── Eje Y: ticks y label ── */}
          {[0, 1, 2, 3, 4].map((v) => (
            <g key={`yt-${v}`}>
              <line x1={ML - 5} y1={toY(v)} x2={ML} y2={toY(v)}
                stroke="#9CA3AF" strokeWidth={1} />
              <text x={ML - 8} y={toY(v) + 4} textAnchor="end"
                fontSize={10} fill="#9CA3AF" fontFamily="ui-monospace, monospace">
                {v}
              </text>
            </g>
          ))}
          <text
            transform={`rotate(-90) translate(${-(MT + PH / 2)}, 14)`}
            textAnchor="middle" fontSize={10} fill="#6B7280"
            fontFamily="Inter, sans-serif">
            Influencia →
          </text>

          {/* ── Puntos de stakeholders (con entrevista) ── */}
          {withScores.map((s) => {
            const pos      = jittered.get(s.id) ?? { cx: toX(s.interview!.adoptionScore), cy: toY(s.interview!.influenceScore) }
            const isActive  = s.id === activeId
            const isHover   = s.id === hoverId
            const stroke    = RESISTANCE_STROKE[s.resistance]
            const fill      = ARCHETYPE_HEX[s.archetype]
            const ini       = initials(s.name)

            return (
              <g
                key={s.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(s)}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {/* Aura de selección */}
                {(isActive || isHover) && (
                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={DOT_R + 6}
                    fill={fill} opacity={0.15}
                  />
                )}

                {/* Círculo exterior (resistencia) */}
                <circle
                  cx={pos.cx} cy={pos.cy}
                  r={DOT_R + stroke.width + 1}
                  fill={stroke.color}
                  opacity={s.resistance === 'baja' ? 0.25 : 0.55}
                  strokeDasharray={stroke.dasharray}
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
                  fontSize={s.resistance === 'alta' ? 10 : 10.5}
                  fontWeight="700"
                  fill="#FFFFFF"
                  fontFamily="Inter, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {ini}
                </text>

                {/* Tooltip hover: nombre + arquetipo */}
                {isHover && (
                  <g>
                    {/* Posicionar el tooltip arriba o abajo según posición en el gráfico */}
                    {(() => {
                      const ttW  = 140
                      const ttH  = 36
                      const aboveSpace = pos.cy - MT
                      const showAbove  = aboveSpace > ttH + DOT_R + 8
                      const ttY  = showAbove
                        ? pos.cy - DOT_R - ttH - 8
                        : pos.cy + DOT_R + 8
                      const rawX = pos.cx - ttW / 2
                      const ttX  = Math.max(ML, Math.min(ML + PW - ttW, rawX))

                      return (
                        <>
                          <rect
                            x={ttX} y={ttY} width={ttW} height={ttH}
                            rx={6} fill="#0A0A0A" opacity={0.88}
                          />
                          <text
                            x={ttX + ttW / 2} y={ttY + 14}
                            textAnchor="middle" fontSize={10.5}
                            fontWeight="600" fill="#FFFFFF"
                            fontFamily="Inter, sans-serif"
                          >
                            {s.name}
                          </text>
                          <text
                            x={ttX + ttW / 2} y={ttY + 26}
                            textAnchor="middle" fontSize={9.5}
                            fill={fill}
                            fontFamily="Inter, sans-serif"
                          >
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
        <span className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Resistencia:</span>
        {([
          { level: 'baja',  label: 'Baja',  desc: 'borde fino verde' },
          { level: 'media', label: 'Media', desc: 'borde discontinuo ámbar' },
          { level: 'alta',  label: 'Alta',  desc: 'borde sólido rojo' },
        ] as { level: ResistanceLevel; label: string; desc: string }[]).map(({ level, label }) => {
          const s = RESISTANCE_STROKE[level]
          return (
            <div key={level} className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle
                  cx="8" cy="8" r="6"
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

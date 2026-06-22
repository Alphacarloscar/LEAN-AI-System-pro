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

import { useState, useEffect } from 'react'
import type { Stakeholder, ResistanceLevel } from '../types'
import { ARCHETYPE_CONFIG, RESISTANCE_CONFIG } from '../constants'
import {
  VB, CX, CY, CR, DOT_R,
  ARCHETYPE_HEX, ARCHETYPE_BG_HEX, RESISTANCE_STROKE,
  toSvgX, toSvgY, constrainToCircle, initials, applyJitter,
} from './quadrantChartHelpers'

// ── Props ─────────────────────────────────────────────────────

interface StakeholderQuadrantChartProps {
  stakeholders: Stakeholder[]
  activeId:     string | null
  onSelect:     (s: Stakeholder) => void
}

// ── Dark mode detection ───────────────────────────────────────

function useDarkMode(): boolean {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  )
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'))
    })
    obs.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

// ── Componente principal ──────────────────────────────────────

export function StakeholderQuadrantChart({
  stakeholders,
  activeId,
  onSelect,
}: StakeholderQuadrantChartProps) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const isDark = useDarkMode()

  const QUADRANT_FILLS = {
    critico:   isDark ? 'rgba(192,96,96,0.28)'   : ARCHETYPE_BG_HEX.critico,
    decisor:   isDark ? 'rgba(196,192,184,0.18)' : ARCHETYPE_BG_HEX.decisor,
    reticente: isDark ? 'rgba(212,168,92,0.28)'  : ARCHETYPE_BG_HEX.reticente,
    adoptador: isDark ? 'rgba(95,175,138,0.28)'  : ARCHETYPE_BG_HEX.adoptador,
  }

  const LABEL_HEX = {
    ...ARCHETYPE_HEX,
    decisor: isDark ? '#8BAED4' : ARCHETYPE_HEX.decisor,
  }

  const withScores    = stakeholders.filter((s) =>  s.interview)
  const withoutScores = stakeholders.filter((s) => !s.interview)

  const basePositions = withScores.map((s) => ({
    id: s.id,
    cx: toSvgX(s.interview!.adoptionScore),
    cy: toSvgY(s.interview!.influenceScore),
  }))
  const jittered = applyJitter(basePositions)

  const archetypesPresent = [...new Set(stakeholders.map((s) => s.archetype))]

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-warm-800 overflow-hidden">

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
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end">
          {archetypesPresent.map((code) => (
            <div key={code} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: ARCHETYPE_HEX[code] }}
              />
              <span className="text-[10px] text-text-subtle">{(ARCHETYPE_CONFIG[code] ?? ARCHETYPE_CONFIG.adoptador).label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG chart */}
      <div className="flex justify-center px-4 py-5">
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          className="w-full"
          style={{ maxWidth: 560, maxHeight: 560 }}
        >
          <defs>
            <clipPath id="circle-clip">
              <circle cx={CX} cy={CY} r={CR} />
            </clipPath>

            <radialGradient id="grad-adoptador"    cx="38%" cy="28%" r="75%" fx="38%" fy="28%">
              <stop offset="0%"   stopColor="#AFD7C5" />
              <stop offset="52%"  stopColor="#5FAF8A" />
              <stop offset="100%" stopColor="#437B61" />
            </radialGradient>
            <radialGradient id="grad-ambassador"   cx="38%" cy="28%" r="75%" fx="38%" fy="28%">
              <stop offset="0%"   stopColor="#B5C8E0" />
              <stop offset="52%"  stopColor="#6A90C0" />
              <stop offset="100%" stopColor="#4A6586" />
            </radialGradient>
            <radialGradient id="grad-decisor"      cx="38%" cy="28%" r="75%" fx="38%" fy="28%">
              <stop offset="0%"   stopColor="#6A6762" />
              <stop offset="52%"  stopColor="#2A2822" />
              <stop offset="100%" stopColor="#1C1A16" />
            </radialGradient>
            <radialGradient id="grad-critico"      cx="38%" cy="28%" r="75%" fx="38%" fy="28%">
              <stop offset="0%"   stopColor="#E0B0B0" />
              <stop offset="52%"  stopColor="#C06060" />
              <stop offset="100%" stopColor="#864343" />
            </radialGradient>
            <radialGradient id="grad-reticente" cx="38%" cy="28%" r="75%" fx="38%" fy="28%">
              <stop offset="0%"   stopColor="#EAD4AE" />
              <stop offset="52%"  stopColor="#D4A85C" />
              <stop offset="100%" stopColor="#947640" />
            </radialGradient>
          </defs>

          <g clipPath="url(#circle-clip)">
            <rect x={0}      y={0}      width={CX - 4}      height={CY - 4}      fill={QUADRANT_FILLS.critico}   opacity={0.5} />
            <rect x={CX + 4} y={0}      width={VB - CX - 4} height={CY - 4}      fill={QUADRANT_FILLS.decisor}   opacity={0.5} />
            <rect x={0}      y={CY + 4} width={CX - 4}      height={VB - CY - 4} fill={QUADRANT_FILLS.reticente} opacity={0.5} />
            <rect x={CX + 4} y={CY + 4} width={VB - CX - 4} height={VB - CY - 4} fill={QUADRANT_FILLS.adoptador} opacity={0.5} />

            {withScores.map((s) => {
              const pos      = jittered.get(s.id) ?? constrainToCircle(
                toSvgX(s.interview!.adoptionScore),
                toSvgY(s.interview!.influenceScore),
              )
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
                  {(isActive || isHover) && (
                    <>
                      <circle cx={pos.cx} cy={pos.cy} r={DOT_R + 14} fill={fill} opacity={0.06} />
                      <circle cx={pos.cx} cy={pos.cy} r={DOT_R + 10} fill={fill} opacity={0.10} />
                      <circle cx={pos.cx} cy={pos.cy} r={DOT_R + 6}  fill={fill} opacity={0.16} />
                    </>
                  )}

                  {s.resistance === 'alta' && (
                    <>
                      <circle cx={pos.cx} cy={pos.cy} r={DOT_R + 12} fill={ARCHETYPE_HEX.critico} opacity={0.06} />
                      <circle cx={pos.cx} cy={pos.cy} r={DOT_R + 8}  fill={ARCHETYPE_HEX.critico} opacity={0.11} />
                      <circle cx={pos.cx} cy={pos.cy} r={DOT_R + 5}  fill={ARCHETYPE_HEX.critico} opacity={0.17} />
                    </>
                  )}

                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={DOT_R + stroke.width + 2}
                    fill="none"
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    strokeDasharray={stroke.dasharray}
                    opacity={s.resistance === 'baja' ? 0.65 : 0.92}
                  />

                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={DOT_R}
                    fill={`url(#grad-${s.archetype})`}
                    stroke={isActive ? 'rgba(255,255,255,0.85)' : 'none'}
                    strokeWidth={isActive ? 1.5 : 0}
                  />

                  <ellipse
                    cx={pos.cx - DOT_R * 0.27}
                    cy={pos.cy - DOT_R * 0.28}
                    rx={DOT_R * 0.36}
                    ry={DOT_R * 0.23}
                    fill="rgba(255,255,255,0.50)"
                    style={{ pointerEvents: 'none' }}
                  />

                  <text
                    x={pos.cx} y={pos.cy + 4}
                    textAnchor="middle" fontSize={9} fontWeight="700"
                    fill="rgba(255,255,255,0.92)" fontFamily="Inter, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {ini}
                  </text>
                </g>
              )
            })}
          </g>

          <circle cx={CX} cy={CY} r={CR} fill="none" stroke="var(--color-border)" strokeWidth={1.5} />

          {/* Quadrant labels */}
          <text x={94} y={91} textAnchor="middle" fontSize={9} fontWeight="700" fontFamily="ui-monospace, monospace" fill={ARCHETYPE_HEX.critico} letterSpacing="0.06em">CRÍTICO</text>
          <text x={94} y={103} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={ARCHETYPE_HEX.critico} opacity={0.65}>bloquea</text>
          <text x={426} y={91} textAnchor="middle" fontSize={9} fontWeight="700" fontFamily="ui-monospace, monospace" fill={LABEL_HEX.decisor} letterSpacing="0.06em">DECISOR</text>
          <text x={426} y={103} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={LABEL_HEX.decisor} opacity={0.65}>lidera</text>
          <text x={94} y={424} textAnchor="middle" fontSize={9} fontWeight="700" fontFamily="ui-monospace, monospace" fill={ARCHETYPE_HEX.reticente} letterSpacing="0.06em">RETICENTE</text>
          <text x={94} y={436} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={ARCHETYPE_HEX.reticente} opacity={0.65}>dominio / miedo</text>
          <text x={426} y={424} textAnchor="middle" fontSize={9} fontWeight="700" fontFamily="ui-monospace, monospace" fill={ARCHETYPE_HEX.adoptador} letterSpacing="0.06em">ADOPTADOR</text>
          <text x={426} y={436} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={ARCHETYPE_HEX.adoptador} opacity={0.65}>usa y adopta</text>

          {/* Axis labels */}
          <text x={CX} y={CY - CR - 14} textAnchor="middle" fontSize={8.5} fill="var(--color-warm-100)" fontFamily="ui-monospace, monospace">↑ Alta influencia</text>
          <text x={CX} y={CY + CR + 22} textAnchor="middle" fontSize={8.5} fill="var(--color-warm-100)" fontFamily="ui-monospace, monospace">Baja influencia ↓</text>
          <text x={CX - CR - 6} y={CY + 4} textAnchor="end" fontSize={8.5} fill="var(--color-warm-100)" fontFamily="ui-monospace, monospace">← Baja</text>
          <text x={CX + CR + 6} y={CY + 4} textAnchor="start" fontSize={8.5} fill="var(--color-warm-100)" fontFamily="ui-monospace, monospace">Alta →</text>
          <text x={CX} y={VB - 6} textAnchor="middle" fontSize={9} fill="var(--color-border)" fontFamily="Inter, sans-serif">Adopción IA</text>

          {/* Tooltips */}
          {withScores.map((s) => {
            if (s.id !== hoverId) return null
            const pos  = jittered.get(s.id) ?? constrainToCircle(
              toSvgX(s.interview!.adoptionScore),
              toSvgY(s.interview!.influenceScore),
            )
            const fill = ARCHETYPE_HEX[s.archetype]
            const ttW  = 155
            const ttH  = 38
            const showAbove = pos.cy - DOT_R - 10 > ttH + 6
            const ttY  = showAbove ? pos.cy - DOT_R - ttH - 8 : pos.cy + DOT_R + 8
            const ttX  = Math.max(6, Math.min(VB - ttW - 6, pos.cx - ttW / 2))

            return (
              <g key={`tt-${s.id}`} style={{ pointerEvents: 'none' }}>
                <rect x={ttX} y={ttY} width={ttW} height={ttH} rx={6} fill="var(--color-warm-950)" opacity={0.88} />
                <text x={ttX + ttW / 2} y={ttY + 14} textAnchor="middle" fontSize={10.5} fontWeight="600" fill="var(--color-surface)" fontFamily="Inter, sans-serif">{s.name}</text>
                <text x={ttX + ttW / 2} y={ttY + 27} textAnchor="middle" fontSize={9.5} fill={fill} fontFamily="Inter, sans-serif">
                  {(ARCHETYPE_CONFIG[s.archetype] ?? ARCHETYPE_CONFIG.adoptador).label} · {RESISTANCE_CONFIG[s.resistance].label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Leyenda de resistencia */}
      <div className="px-5 pb-3 flex items-center gap-5 border-t border-border/50 pt-3">
        <span className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Resistencia:</span>
        {(['baja', 'media', 'alta'] as ResistanceLevel[]).map((level) => {
          const stroke = RESISTANCE_STROKE[level]
          return (
            <div key={level} className="flex items-center gap-1.5">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r="5" fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeDasharray={stroke.dasharray} />
              </svg>
              <span className="text-[10px] text-text-subtle capitalize">{level}</span>
            </div>
          )
        })}
      </div>

      {/* Stakeholders sin entrevista */}
      {withoutScores.length > 0 && (
        <div className="px-5 pb-4 border-t border-border/50 pt-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
            Sin entrevista completada
          </p>
          <div className="flex flex-wrap gap-2">
            {withoutScores.map((s) => {
              const cfg = ARCHETYPE_CONFIG[s.archetype] ?? ARCHETYPE_CONFIG.adoptador
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${cfg.badgeBg} ${cfg.badgeText} hover:opacity-80`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ARCHETYPE_HEX[s.archetype] }} />
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

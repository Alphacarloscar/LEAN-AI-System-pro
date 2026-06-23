// ============================================================
// T7 — Constantes y funciones puras
// ============================================================

import type { ResistanceLevel, Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import type { RogersSegment, DotPosition } from './types'

// ── Orden de segmentos ────────────────────────────────────────

export const SEGMENT_ORDER: RogersSegment[] = [
  'innovators', 'early_adopters', 'early_majority', 'late_majority', 'laggards',
]

export const ARCHETYPE_BASE_SEG: Record<string, RogersSegment> = {
  adoptador:    'early_adopters',
  ambassador:   'early_majority',
  decisor:      'early_majority',
  reticente:    'late_majority',
  especialista: 'late_majority',  // compat: datos antiguos en localStorage
  critico:      'laggards',
}

export function getSegment(archetype: string, resistance: ResistanceLevel): RogersSegment {
  const base = ARCHETYPE_BASE_SEG[archetype] ?? 'early_majority'  // fallback para arquetipos desconocidos
  if (resistance === 'alta') {
    const idx = SEGMENT_ORDER.indexOf(base)
    return SEGMENT_ORDER[Math.min(idx + 1, SEGMENT_ORDER.length - 1)]
  }
  return base
}

// ── SVG Bell Curve ────────────────────────────────────────────

export const W         = 800
export const H_SVG     = 560
export const BASELINE  = 520           // línea base (eje X)
export const AMPLITUDE = 482           // pico llega a y≈38 (cerca del tope)
export const MU        = 400           // centrado en W/2 → curva perfectamente simétrica
export const SIGMA     = 120           // colas llegan al suelo en x=0 y x=800

// Segmentos de igual anchura (W/5 = 160px)
export const SEG_BOUNDS: Record<RogersSegment, { x1: number; x2: number }> = {
  innovators:     { x1: 0,   x2: 160 },
  early_adopters: { x1: 160, x2: 320 },
  early_majority: { x1: 320, x2: 480 },
  late_majority:  { x1: 480, x2: 640 },
  laggards:       { x1: 640, x2: 800 },
}

// Segmentos donde los dots van DEBAJO de la curva
export const BELOW_CURVE_SEGS: RogersSegment[] = ['early_majority', 'late_majority']

export function bellY(x: number): number {
  return BASELINE - AMPLITUDE * Math.exp(-((x - MU) ** 2) / (2 * SIGMA ** 2))
}

export function buildBellFillPath(): string {
  const pts: string[] = []
  for (let x = 0; x <= W; x += 4) {
    pts.push(`${x.toFixed(1)},${bellY(x).toFixed(1)}`)
  }
  return `M ${pts.join(' L ')} L ${W},${BASELINE} L 0,${BASELINE} Z`
}

export function buildBellStrokePath(): string {
  const pts: string[] = []
  for (let x = 0; x <= W; x += 4) {
    pts.push(`${x.toFixed(1)},${bellY(x).toFixed(1)}`)
  }
  return `M ${pts.join(' L ')}`
}

export const BELL_FILL   = buildBellFillPath()
export const BELL_STROKE = buildBellStrokePath()

export const SEG_LABELS: Record<RogersSegment, { label: string; pct: string; bg: string; darkBg: string }> = {
  innovators:     { label: 'Innovadores',    pct: '2.5%',  bg: '#DDE8F5', darkBg: 'rgba(106,144,192,0.07)' },  // info-light
  early_adopters: { label: 'Early Adopters', pct: '13.5%', bg: '#D4EDE3', darkBg: 'rgba(95,175,138,0.07)'  },  // success-light
  early_majority: { label: 'Mayoría Temp.',  pct: '34%',   bg: '#F8EDD3', darkBg: 'rgba(212,168,92,0.07)'  },  // warning-light
  late_majority:  { label: 'Mayoría Tardía', pct: '34%',   bg: '#FAF0D7', darkBg: 'rgba(200,134,10,0.07)'  },  // gold-light
  laggards:       { label: 'Rezagados',      pct: '16%',   bg: '#F7F4EE', darkBg: 'rgba(196,192,184,0.05)' },  // surface
}

// ── Departamentos ─────────────────────────────────────────────

export interface DeptCfg {
  fill:      string  // light mode dot/swatch color
  darkFill:  string  // dark mode dot/swatch color (más visible sobre fondos oscuros)
  badgeBg:   string
  badgeText: string
}

// Hex values sourced exclusively from tailwind.config.ts tokens.
// success-dark=#5FAF8A  info-dark=#6A90C0  warning-dark=#D4A85C
// danger-dark=#C06060   gold=#C8860A       silver=#C4C0B8
export const DEPT_CFG: Record<string, DeptCfg> = {
  // ── Entradas canónicas (keys del store de datos) ───────────────
  'Dirección General':     { fill: '#5FAF8A', darkFill: '#86C7A8', badgeBg: 'bg-success-light dark:bg-success-light/10', badgeText: 'text-success-dark' },
  'IT / Tecnología':       { fill: '#6A90C0', darkFill: '#9BB5D9', badgeBg: 'bg-info-light   dark:bg-info-light/10',    badgeText: 'text-info-dark'    },
  'Operaciones':           { fill: '#8A857C', darkFill: '#B8B4AB', badgeBg: 'bg-surface       dark:bg-warm-800/60',      badgeText: 'text-text-muted'   },
  'Marketing & Comercial': { fill: '#C8860A', darkFill: '#D4940F', badgeBg: 'bg-warning-light dark:bg-warning-light/10', badgeText: 'text-gold'         },
  'RRHH':                  { fill: '#C06060', darkFill: '#D89090', badgeBg: 'bg-danger-light  dark:bg-danger-light/10',  badgeText: 'text-danger-dark'  },
  // ── Aliases cortos (datos importados de otros módulos) ─────────
  'Dirección':             { fill: '#5FAF8A', darkFill: '#86C7A8', badgeBg: 'bg-success-light dark:bg-success-light/10', badgeText: 'text-success-dark' },
  'IT':                    { fill: '#6A90C0', darkFill: '#9BB5D9', badgeBg: 'bg-info-light   dark:bg-info-light/10',    badgeText: 'text-info-dark'    },
  'Marketing':             { fill: '#C8860A', darkFill: '#D4940F', badgeBg: 'bg-warning-light dark:bg-warning-light/10', badgeText: 'text-gold'         },
}

export function deptCfg(dept: string): DeptCfg {
  return DEPT_CFG[dept] ?? { fill: '#C4C0B8', darkFill: '#9A9790', badgeBg: 'bg-surface', badgeText: 'text-text-muted' }
}

export function deptFill(dept: string, dark: boolean): string {
  const cfg = deptCfg(dept)
  return dark ? cfg.darkFill : cfg.fill
}

// ── Resistencia ───────────────────────────────────────────────

export const RES_CFG: Record<ResistanceLevel, { label: string; color: string }> = {
  baja:  { label: 'Resistencia baja',  color: 'text-success-dark bg-success-light' },
  media: { label: 'Resistencia media', color: 'text-warning-dark bg-warning-light' },
  alta:  { label: 'Resistencia alta',  color: 'text-danger-dark  bg-danger-light'  },
}

// ── Posicionamiento de dots ───────────────────────────────────

export const DOT_R      = 11   // radio normal
export const DOT_OFFSET = DOT_R + 6   // distancia perpendicular a la curva

export function computeDotPositions(stakeholders: Stakeholder[]): DotPosition[] {
  const bySegment: Record<RogersSegment, Stakeholder[]> = {
    innovators: [], early_adopters: [], early_majority: [], late_majority: [], laggards: [],
  }
  for (const sh of stakeholders) {
    bySegment[getSegment(sh.archetype, sh.resistance)].push(sh)
  }

  const positions: DotPosition[] = []

  for (const seg of SEGMENT_ORDER) {
    const group = bySegment[seg]
    if (group.length === 0) continue

    const { x1, x2 } = SEG_BOUNDS[seg]
    const segW = x2 - x1
    const cx0  = (x1 + x2) / 2
    const below = BELOW_CURVE_SEGS.includes(seg)

    group.forEach((sh, i) => {
      const maxSpread = Math.min(segW * 0.55, 22 * group.length)
      const offsetX = group.length > 1
        ? -maxSpread / 2 + (maxSpread / (group.length - 1)) * i
        : 0

      const cx = cx0 + offsetX
      const curveY = bellY(cx)
      // Abajo de la curva en los segmentos mayoría; arriba en los demás
      const cy = below ? curveY + DOT_OFFSET : curveY - DOT_OFFSET

      positions.push({ stakeholderId: sh.id, segment: seg, cx, cy })
    })
  }

  return positions
}

// ── Gradiente ID seguro ───────────────────────────────────────

export function gradId(dept: string): string {
  return `dotGrad3D-${dept.replace(/[\s/&]/g, '')}`
}

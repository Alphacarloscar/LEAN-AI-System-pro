// ============================================================
// quadrantChartHelpers — Utilities for StakeholderQuadrantChart
// ============================================================

import type { ArchetypeCode, ResistanceLevel } from '../types'

// ── Constantes del layout SVG ─────────────────────────────────

export const VB    = 520        // viewBox cuadrado (px)
export const CX    = 260        // centro X
export const CY    = 260        // centro Y
export const CR    = 200        // radio del círculo del gráfico
export const DOT_R = 14         // radio del punto de stakeholder
export const MAX_R = CR - DOT_R - 8   // centro del punto máximo desde el centro

// ── Helpers de coordenadas ────────────────────────────────────

/** Score (0–4) → coordenada X en el SVG */
export function toSvgX(score: number) {
  return CX + ((score - 2) / 2) * CR
}

/** Score (0–4) → coordenada Y en el SVG (invertido: mayor score = arriba) */
export function toSvgY(score: number) {
  return CY - ((score - 2) / 2) * CR
}

/** Limita el punto al área circular válida */
export function constrainToCircle(cx: number, cy: number): { cx: number; cy: number } {
  const dx   = cx - CX
  const dy   = cy - CY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist <= MAX_R) return { cx, cy }
  const scale = MAX_R / dist
  return { cx: CX + dx * scale, cy: CY + dy * scale }
}

/** Iniciales del nombre (máx 2 caracteres) */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Colores en hex (para SVG — no Tailwind) ───────────────────

export const ARCHETYPE_HEX: Record<ArchetypeCode, string> = {
  adoptador:    '#5FAF8A',
  ambassador:   '#6A90C0',
  decisor:      '#2A2822',
  critico:      '#C06060',
  reticente:    '#D4A85C',
}

export const ARCHETYPE_BG_HEX: Record<ArchetypeCode, string> = {
  adoptador:    '#D4EDE3',
  ambassador:   '#DDE8F5',
  decisor:      'rgba(42,40,34,0.10)',
  critico:      '#F5DEDE',
  reticente:    '#FAF0D7',
}

export const RESISTANCE_STROKE: Record<ResistanceLevel, { color: string; width: number; dasharray?: string }> = {
  baja:  { color: '#5FAF8A', width: 1.5 },
  media: { color: '#D4A85C', width: 2.5, dasharray: '4 3' },
  alta:  { color: '#C06060', width: 3 },
}

// ── Jitter anti-solapamiento (constrained al círculo) ─────────

export function applyJitter(
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

import { describe, it, expect } from 'vitest'
import {
  getHeroColor,
  getThemeColor,
  getGoldRgb,
  getNavyRgb,
  QUADRANT_COLORS,
  ROGERS_SEGMENT_COLORS,
  DOMAIN_COLORS,
  T3_QUADRANT_COLORS,
  MONO_STATUS_COLORS,
  CHART_SERIES_COLORS,
  T3_VALUE_BAR_COLORS,
  T3_VALUE_ACTIVE_BG,
  DEPT_ADOPTION_COLORS,
  DEPT_COLORS,
  type ChartTokenName,
} from '@shared/design-system/charts/chartTokens'

// ── ADR-021 §4 — Contrato de tokens de color para Recharts ───────────────────
//
// Estos tests verifican que:
//   1. getHeroColor devuelve únicamente colores del sistema Obsidian Amber (sin cold grays).
//   2. getThemeColor devuelve hex/rgb en SSR (document undefined), nunca 'var(--...)'.
//   3. Todos los objetos PALETTE usan únicamente valores canónicos del DS.
//
// RESTRICCIÓN ADR-021: colores fríos prohibidos (bg-gray-*, #6B7280, #94A3B8, etc.)

// Paleta de colores fríos prohibidos por ADR-021
const COLD_COLORS = [
  '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6',  // gray-500..100 (Tailwind cold)
  '#94A3B8', '#CBD5E1', '#E2E8F0',              // slate-400..200
  '#374151', '#4B5563',                          // gray-700..600
]

// Verifica que un valor hexadecimal no pertenece a la paleta fría prohibida
function isNotColdColor(hex: string): boolean {
  return !COLD_COLORS.includes(hex.toLowerCase())
}

// ── getHeroColor ─────────────────────────────────────────────────────────────

describe('getHeroColor — interpolación RGB warm→gold (ADR-021)', () => {
  it('devuelve gold (#C8860A) cuando score es undefined (neutro)', () => {
    expect(getHeroColor(undefined)).toBe('#C8860A')
  })

  it('score=0 devuelve rgb de partida (warm-neutral)', () => {
    expect(getHeroColor(0)).toBe('rgb(154,151,144)')
  })

  it('score=100 devuelve rgb de gold', () => {
    expect(getHeroColor(100)).toBe('rgb(200,134,10)')
  })

  it('score=50 devuelve valor intermedio (no es ningún extremo)', () => {
    const color = getHeroColor(50)
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/)
    expect(color).not.toBe('rgb(154,151,144)')
    expect(color).not.toBe('rgb(200,134,10)')
  })

  it('clampea hacia abajo: score=-10 === score=0', () => {
    expect(getHeroColor(-10 as unknown as number)).toBe(getHeroColor(0))
  })

  it('clampea hacia arriba: score=150 === score=100', () => {
    expect(getHeroColor(150 as unknown as number)).toBe(getHeroColor(100))
  })

  it('acepta parámetros _dangerBelow/_warningBelow sin error (firma completa)', () => {
    expect(() => getHeroColor(50, 30, 60)).not.toThrow()
  })

  it('ningún valor devuelto pertenece a la paleta fría prohibida por ADR-021', () => {
    const scores = [undefined, 0, 15, 29, 30, 59, 60, 100]
    for (const score of scores) {
      const color = getHeroColor(score)
      expect(
        isNotColdColor(color),
        `getHeroColor(${score}) devolvió color frío prohibido: ${color}`,
      ).toBe(true)
    }
  })
})

// ── getThemeColor — SSR fallback ──────────────────────────────────────────────

describe('getThemeColor — SSR/JSDOM devuelve hex fallback, nunca CSS var', () => {
  const SAMPLE_TOKENS: ChartTokenName[] = [
    'gold', 'navy', 'warm-950', 'warm-100', 'surface', 'border',
    'success', 'danger', 'warning', 'info',
  ]

  it.each(SAMPLE_TOKENS)('token "%s" devuelve cadena no vacía', (token) => {
    const result = getThemeColor(token)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it.each(SAMPLE_TOKENS)('token "%s" no devuelve una CSS var (var(--...))', (token) => {
    const result = getThemeColor(token)
    expect(result).not.toMatch(/^var\(--/)
  })

  it('gold devuelve exactamente #C8860A como fallback (DS canonical)', () => {
    // En JSDOM getComputedStyle devuelve '' para custom properties → usa FALLBACK
    const result = getThemeColor('gold')
    expect(result).toBe('#C8860A')
  })

  it('navy devuelve exactamente #2A2822 como fallback (DS canonical)', () => {
    const result = getThemeColor('navy')
    expect(result).toBe('#2A2822')
  })
})

// ── getGoldRgb / getNavyRgb ───────────────────────────────────────────────────

describe('getGoldRgb — formato rgb() para Recharts', () => {
  it('sin opacidad devuelve "rgb(200 134 10)"', () => {
    expect(getGoldRgb()).toBe('rgb(200 134 10)')
  })

  it('con opacidad devuelve "rgb(200 134 10 / 0.5)"', () => {
    expect(getGoldRgb(0.5)).toBe('rgb(200 134 10 / 0.5)')
  })
})

describe('getNavyRgb — formato rgb() para Recharts', () => {
  it('sin opacidad devuelve "rgb(42 40 34)"', () => {
    expect(getNavyRgb()).toBe('rgb(42 40 34)')
  })

  it('con opacidad devuelve "rgb(42 40 34 / 0.3)"', () => {
    expect(getNavyRgb(0.3)).toBe('rgb(42 40 34 / 0.3)')
  })
})

// ── Paletas de objeto — verificación warm-palette ────────────────────────────

describe('QUADRANT_COLORS — sin colores fríos prohibidos', () => {
  it('todos los valores fill/bg son cadenas no vacías', () => {
    for (const [quadrant, colors] of Object.entries(QUADRANT_COLORS)) {
      expect(typeof colors.fill, `${quadrant}.fill`).toBe('string')
      expect(colors.fill, `${quadrant}.fill vacío`).toBeTruthy()
      expect(typeof colors.bg, `${quadrant}.bg`).toBe('string')
    }
  })
})

describe('ROGERS_SEGMENT_COLORS — sin colores fríos prohibidos', () => {
  it('todos los valores son hex no vacíos y no cold-gray', () => {
    for (const [seg, hex] of Object.entries(ROGERS_SEGMENT_COLORS)) {
      expect(hex, `${seg} vacío`).toBeTruthy()
      expect(isNotColdColor(hex), `${seg}: color frío prohibido ${hex}`).toBe(true)
    }
  })
})

describe('DOMAIN_COLORS — dominios IA con paleta warm', () => {
  it('automatizacion_inteligente usa gold (#C8860A)', () => {
    expect(DOMAIN_COLORS.automatizacion_inteligente).toBe('#C8860A')
  })

  it('todos los valores son hex no vacíos y no cold-gray', () => {
    for (const [domain, hex] of Object.entries(DOMAIN_COLORS)) {
      expect(hex, `${domain} vacío`).toBeTruthy()
      expect(isNotColdColor(hex), `${domain}: color frío prohibido ${hex}`).toBe(true)
    }
  })
})

describe('T3_QUADRANT_COLORS — oportunity matrix sin paleta fría', () => {
  it('border usa warm-200 (#D4D0C8), no cold (#E5E7EB)', () => {
    expect(T3_QUADRANT_COLORS.border).toBe('#D4D0C8')
    expect(T3_QUADRANT_COLORS.border).not.toBe('#E5E7EB')
  })

  it('axisLabel usa warm-500 (#9A9790), no cold (#9CA3AF)', () => {
    expect(T3_QUADRANT_COLORS.axisLabel).toBe('#9A9790')
    expect(T3_QUADRANT_COLORS.axisLabel).not.toBe('#9CA3AF')
  })
})

// ── Paletas adicionales ADR-021 ───────────────────────────────────────────────

describe('MONO_STATUS_COLORS — escala monocromática warm (4 categorías)', () => {
  it('tiene exactamente 4 valores', () => {
    expect(MONO_STATUS_COLORS).toHaveLength(4)
  })

  it('todos son hex no vacíos sin paleta fría', () => {
    for (const hex of MONO_STATUS_COLORS) {
      expect(hex).toBeTruthy()
      expect(isNotColdColor(hex), `color frío prohibido: ${hex}`).toBe(true)
    }
  })

  it('primer valor es gold (#C8860A) — categoría positiva', () => {
    expect(MONO_STATUS_COLORS[0]).toBe('#C8860A')
  })
})

describe('CHART_SERIES_COLORS — 10 colores para series multi-chart', () => {
  it('tiene exactamente 10 colores', () => {
    expect(CHART_SERIES_COLORS).toHaveLength(10)
  })

  it('todos son strings no vacíos', () => {
    for (const hex of CHART_SERIES_COLORS) {
      expect(typeof hex).toBe('string')
      expect(hex).toBeTruthy()
    }
  })
})

describe('T3_VALUE_BAR_COLORS — barras de value contribution', () => {
  it('tiene las 4 categorías esperadas', () => {
    expect(T3_VALUE_BAR_COLORS).toHaveProperty('alta')
    expect(T3_VALUE_BAR_COLORS).toHaveProperty('media')
    expect(T3_VALUE_BAR_COLORS).toHaveProperty('baja')
    expect(T3_VALUE_BAR_COLORS).toHaveProperty('nula')
  })

  it('todos son hex no vacíos sin paleta fría', () => {
    for (const [k, hex] of Object.entries(T3_VALUE_BAR_COLORS)) {
      expect(hex, `${k} vacío`).toBeTruthy()
      expect(isNotColdColor(hex), `${k}: color frío prohibido ${hex}`).toBe(true)
    }
  })
})

describe('T3_VALUE_ACTIVE_BG — fondos activos de barras value contribution', () => {
  it('tiene las 4 categorías esperadas', () => {
    expect(T3_VALUE_ACTIVE_BG).toHaveProperty('alta')
    expect(T3_VALUE_ACTIVE_BG).toHaveProperty('media')
    expect(T3_VALUE_ACTIVE_BG).toHaveProperty('baja')
    expect(T3_VALUE_ACTIVE_BG).toHaveProperty('nula')
  })

  it('todos son strings no vacíos', () => {
    for (const [k, val] of Object.entries(T3_VALUE_ACTIVE_BG)) {
      expect(val, `${k} vacío`).toBeTruthy()
    }
  })
})

describe('DEPT_ADOPTION_COLORS — 3 segmentos Rogers (DeptBar)', () => {
  it('tiene exactamente innovadores, early, rezagados', () => {
    expect(DEPT_ADOPTION_COLORS).toHaveProperty('innovadores')
    expect(DEPT_ADOPTION_COLORS).toHaveProperty('early')
    expect(DEPT_ADOPTION_COLORS).toHaveProperty('rezagados')
  })

  it('ninguno es color frío prohibido', () => {
    for (const [k, hex] of Object.entries(DEPT_ADOPTION_COLORS)) {
      expect(isNotColdColor(hex), `${k}: color frío prohibido ${hex}`).toBe(true)
    }
  })

  it('innovadores usa gold (#C8860A) — acento de adopción temprana', () => {
    expect(DEPT_ADOPTION_COLORS.innovadores).toBe('#C8860A')
  })
})

describe('DEPT_COLORS — colores por departamento cross-módulo (T5, T7, T8, T10)', () => {
  const EXPECTED_DEPTS = [
    'direction', 'it', 'ops', 'marketing', 'hr',
    'finance', 'legal', 'logistics', 'purchasing', 'fallback',
  ] as const

  it('contiene todos los departamentos esperados', () => {
    for (const dept of EXPECTED_DEPTS) {
      expect(DEPT_COLORS).toHaveProperty(dept)
    }
  })

  it('todos son hex no vacíos', () => {
    for (const [k, hex] of Object.entries(DEPT_COLORS)) {
      expect(typeof hex, `${k} no es string`).toBe('string')
      expect(hex, `${k} vacío`).toBeTruthy()
    }
  })

  it('direction es gold (#C8860A) — acento de marca', () => {
    expect(DEPT_COLORS.direction).toBe('#C8860A')
  })
})

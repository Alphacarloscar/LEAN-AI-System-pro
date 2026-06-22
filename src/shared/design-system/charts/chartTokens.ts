// ADR-021 — Tokens de color para componentes Recharts
//
// Recharts resuelve stroke/fill en tiempo de construcción del SVG y no acepta
// CSS custom properties directamente. Esta utilidad lee los tokens del :root
// en runtime (una sola vez por llamada, fuera del ciclo de render) y devuelve
// cadenas hex/rgb válidas que Recharts sí puede consumir.
//
// Uso correcto:
//   const gold = getThemeColor('gold')          // '#C8860A' o fallback
//   <Line stroke={gold} />                       // ✅ Recharts OK
//   <Line stroke={token('gold')} />              // ❌ CSS var — Recharts no resuelve
//
// Los fallbacks coinciden con los hex de CHART_PALETTE para que el gráfico
// nunca renderice en blanco si los estilos aún no se han cargado (SSR, FOUC).

/** Nombres de tokens de color definidos en src/index.css :root */
export type ChartTokenName =
  | 'gold'
  | 'navy'
  | 'warm-950'
  | 'warm-900'
  | 'warm-800'
  | 'warm-700'
  | 'warm-600'
  | 'warm-500'
  | 'warm-400'
  | 'warm-300'
  | 'warm-200'
  | 'warm-100'
  | 'surface'
  | 'border'
  | 'success'
  | 'success-dark'
  | 'success-light'
  | 'warning'
  | 'warning-dark'
  | 'warning-light'
  | 'danger'
  | 'danger-dark'
  | 'danger-light'
  | 'info'
  | 'info-dark'
  | 'info-light'
  | 'text-muted'
  | 'text-subtle'

/** Hex fallbacks mirroring CHART_PALETTE — garantizan render aunque CSS no haya cargado */
const FALLBACKS: Record<ChartTokenName, string> = {
  'gold':          '#C8860A',
  'navy':          '#2A2822',
  'warm-950':      '#16140F',
  'warm-900':      '#22201C',
  'warm-800':      '#2A2822',
  'warm-700':      '#4A4740',
  'warm-600':      '#6B6864',
  'warm-500':      '#8A857C',
  'warm-400':      '#9A9790',
  'warm-300':      '#B8B4AB',
  'warm-200':      '#D4D0C8',
  'warm-100':      '#C4C0B8',
  'surface':       '#F7F4EE',
  'border':        '#D4D0C8',
  'success':       '#86C7A8',
  'success-dark':  '#5FAF8A',
  'success-light': '#D4EDE3',
  'warning':       '#E8C281',
  'warning-dark':  '#C9973A',
  'warning-light': '#F8EDD3',
  'danger':        '#D89090',
  'danger-dark':   '#B85C5C',
  'danger-light':  '#F5DEDE',
  'info':          '#9BB5D9',
  'info-dark':     '#5A87C5',
  'info-light':    '#D6E4F5',
  'text-muted':    '#6B6864',
  'text-subtle':   '#9A9790',
}

/**
 * Lee un token de color desde los CSS custom properties del :root.
 * Si el entorno no tiene `document` (SSR) o el token no existe,
 * devuelve el fallback hex correspondiente.
 *
 * @param name - Nombre del token sin prefijo `--color-`
 * @returns Cadena de color válida para Recharts (hex)
 */
export function getThemeColor(name: ChartTokenName): string {
  if (typeof document === 'undefined') return FALLBACKS[name]

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim()

  return raw || FALLBACKS[name]
}

/**
 * Lee el token RGB de oro para uso con sintaxis `rgb(R G B / alpha)`.
 * Devuelve cadena lista para Recharts: 'rgb(200 134 10)' o con opacidad.
 *
 * @param opacity - Valor de opacidad 0–1 (default: 1)
 */
export function getGoldRgb(opacity = 1): string {
  if (typeof document === 'undefined') {
    return opacity < 1 ? `rgb(200 134 10 / ${opacity})` : 'rgb(200 134 10)'
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-gold-rgb')
    .trim()
  const channels = raw || '200 134 10'
  return opacity < 1 ? `rgb(${channels} / ${opacity})` : `rgb(${channels})`
}

/**
 * Lee el token RGB de navy para uso con sintaxis `rgb(R G B / alpha)`.
 * Devuelve cadena lista para Recharts: 'rgb(42 40 34)' o con opacidad.
 *
 * @param opacity - Valor de opacidad 0–1 (default: 1)
 */
export function getNavyRgb(opacity = 1): string {
  if (typeof document === 'undefined') {
    return opacity < 1 ? `rgb(42 40 34 / ${opacity})` : 'rgb(42 40 34)'
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-navy-rgb')
    .trim()
  const channels = raw || '42 40 34'
  return opacity < 1 ? `rgb(${channels} / ${opacity})` : `rgb(${channels})`
}

// ── ADR-021 §4 — Semantic chart color groups ──────────────────
//
// Estos tokens centralizan colores que antes estaban dispersos en T2, T7, T10.
// Son objetos hex estáticos (igual que CHART_PALETTE) porque Recharts no resuelve CSS vars.
// Fuente de verdad: tailwind.config.ts + index.css tokens semánticos.

/** Colores por cuadrante de influencia/adopción (T2 StakeholderMatrix) */
export const QUADRANT_COLORS = {
  critico:   { fill: '#C06060', bg: '#F5DEDE', bgDark: 'rgba(192,96,96,0.28)'   },
  decisor:   { fill: '#2A2822', bg: 'rgba(42,40,34,0.10)', bgDark: 'rgba(196,192,184,0.18)' },
  reticente: { fill: '#D4A85C', bg: '#FAF0D7', bgDark: 'rgba(212,168,92,0.28)'  },
  adoptador: { fill: '#5FAF8A', bg: '#D4EDE3', bgDark: 'rgba(95,175,138,0.28)'  },
} as const

/** Colores por cuadrante de la Opportunity Matrix (T3 ValueStreamMap) */
export const T3_QUADRANT_COLORS = {
  pilotarYa:       '#5FAF8A',  // success-dark  — alto impacto + alto readiness
  prepararTerreno: '#D4A85C',  // warning-dark  — alto impacto + bajo readiness
  quickWins:       '#9AAEC8',  // info-medium   — bajo impacto + alto readiness
  evaluar:         '#94A3B8',  // neutral slate — bajo impacto + bajo readiness
  border:          '#D4D0C8',  // warm-200      — bordes y líneas guía (antes #E5E7EB frío)
  axisLabel:       '#9A9790',  // warm-500      — etiquetas de eje (antes #9CA3AF frío)
} as const

/** barColor por valueContribution (T3 StagesTab / StageModal — usable en SVG fill) */
export const T3_VALUE_BAR_COLORS: Record<'alta' | 'media' | 'baja' | 'nula', string> = {
  alta:  '#5FAF8A',  // success-dark
  media: '#6A90C0',  // info-dark
  baja:  '#D4A85C',  // warning-dark
  nula:  '#C06060',  // danger-dark
} as const

/** bg tint activo por valueContribution (T3 StageModal selector) */
export const T3_VALUE_ACTIVE_BG: Record<'alta' | 'media' | 'baja' | 'nula', string> = {
  alta:  '#D4EDE3',  // success-light
  media: '#DDE8F5',  // info-light
  baja:  '#FAF0D7',  // warning-light
  nula:  '#F5DEDE',  // danger-light
} as const

/** Segmentos de la curva de Rogers (T7 AdoptionHeatmap, T10 AIValueDashboard) */
export const ROGERS_SEGMENT_COLORS = {
  innovadores:   '#5FAF8A',  // success-dark — adopción temprana
  earlyMajority: '#6A90C0',  // info-dark    — masa crítica
  rezagados:     '#C4C0B8',  // warm-100     — rezagados / neutro
} as const

/** Dominios funcionales de IA (T5 AITaxonomyCanvas) */
export const DOMAIN_COLORS = {
  automatizacion: '#C8860A',  // gold    — procesos automatizados
  augmentation:   '#6A90C0',  // info-dark — herramientas de apoyo a personas
  analytics:      '#5FAF8A',  // success-dark — análisis y predicción
  generative:     '#D4A85C',  // warning-dark — IA generativa
} as const

/**
 * Devuelve un color hex según un score 0–100 (semáforo rojo/ámbar/verde).
 * Uso: componentes de métricas tipo HeroMetric (T10) y badges de estado.
 *
 * @param score - Valor 0–100, o undefined para color neutro (gold)
 */
export function getHeroColor(score?: number): string {
  if (score == null) return '#C8860A'  // gold neutro
  if (score < 30)   return '#C05035'  // danger-dark (rojo)
  if (score < 60)   return '#C8860A'  // gold (ámbar)
  return '#2A7A52'                    // success verde oscuro
}

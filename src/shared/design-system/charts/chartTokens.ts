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
  'success-light': '#E8F5EE',
  'warning':       '#E8C281',
  'warning-dark':  '#D4A85C',
  'warning-light': '#FEF6E8',
  'danger':        '#D89090',
  'danger-dark':   '#C06060',
  'danger-light':  '#FDECEC',
  'info':          '#9BB5D9',
  'info-dark':     '#6A90C0',
  'info-light':    '#EBF2FA',
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
  critico:   { fill: '#C06060', bg: '#FDECEC', bgDark: 'rgba(192,96,96,0.28)'   },
  decisor:   { fill: '#2A2822', bg: 'rgba(42,40,34,0.10)', bgDark: 'rgba(196,192,184,0.18)' },
  reticente: { fill: '#D4A85C', bg: '#FEF6E8', bgDark: 'rgba(212,168,92,0.28)'  },
  adoptador: { fill: '#5FAF8A', bg: '#E8F5EE', bgDark: 'rgba(95,175,138,0.28)'  },
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
  alta:  '#E8F5EE',  // success-light
  media: '#EBF2FA',  // info-light
  baja:  '#FEF6E8',  // warning-light
  nula:  '#FDECEC',  // danger-light
} as const

/** Segmentos de la curva de Rogers (T7 AdoptionHeatmap, T10 AIValueDashboard) */
export const ROGERS_SEGMENT_COLORS = {
  innovadores:   '#5FAF8A',  // success-dark — adopción temprana
  earlyMajority: '#6A90C0',  // info-dark    — masa crítica
  rezagados:     '#C4C0B8',  // warm-100     — rezagados / neutro
} as const

/** Dominios funcionales de IA — fuente de verdad única para T3, T4, T5, T10 */
export const DOMAIN_COLORS = {
  automatizacion_rpa:         '#6A90C0',  // info-dark       — azul DS cálido
  automatizacion_inteligente: '#C8860A',  // gold            — acento de marca
  analitica_predictiva:       '#5FAF8A',  // success-dark    — verde DS
  asistente_ia:               '#7890B0',  // slate-blue cálido — diferenciado de gold/teal
  optimizacion_proceso:       '#C06060',  // danger-dark     — coral DS
  'agéntica':                 '#7A6FAB',  // purple-warm     — diferenciado de gold/ámbar
} as const

/**
 * Paleta de 10 colores para gráficos multi-serie (donuts, barras apiladas, leyendas).
 * Derivados del DS warm — sin colisionar con los 4 colores de fase
 * (warning-dark, info-dark, success-dark, navy).
 * Índice estable: usar siempre por posición para consistencia cross-panel.
 */
export const CHART_SERIES_COLORS = [
  '#D4973A',  // 0  gold-pastel    — acento de marca, cálido
  '#C47E7E',  // 1  coral-pastel   — rojo suavizado
  '#8F85C2',  // 2  lavender-warm  — violeta pastel
  '#B08A6A',  // 3  sand-warm      — terracota clara
  '#5FA8A8',  // 4  teal-pastel    — azul-verde suave
  '#B87EA0',  // 5  mauve-pastel   — rosa-lila
  '#8AA06A',  // 6  sage-warm      — verde salvia
  '#C49B58',  // 7  amber-pastel   — ámbar medio
  '#7A9AB0',  // 8  slate-pastel   — azul grisáceo
  '#A8A49C',  // 9  warm-neutral   — gris cálido
] as const

/**
 * Progresión cromática 0→100: silver-warm (#9A9790) → gold (#C8860A).
 * Misma escala que maturityHex() de T1, adaptada a 0-100.
 * score=undefined devuelve gold (valor máximo — métrica sin umbral).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHeroColor(score?: number, _dangerBelow = 30, _warningBelow = 60): string {
  if (score == null) return '#C8860A'
  const t = Math.max(0, Math.min(score, 100)) / 100
  const r = Math.round(154 + (200 - 154) * t)
  const g = Math.round(151 + (134 - 151) * t)
  const b = Math.round(144 + ( 10 - 144) * t)
  return `rgb(${r},${g},${b})`
}

/**
 * Escala monocromática warm para leyendas de 4+ categorías de estado
 * (Activas / Validando / Backlog / Paradas, etc.)
 * Orden: gold → warm-400 → warm-300 → warm-200
 */
export const MONO_STATUS_COLORS = [
  '#C8860A',  // gold       — categoría 1 (activa / positiva)
  '#9A9790',  // warm-400   — categoría 2
  '#B8B4AB',  // warm-300   — categoría 3
  '#D4D0C8',  // warm-200   — categoría 4
] as const

/** Colores de Rogers para DeptBar (3 segmentos de adopción) */
export const DEPT_ADOPTION_COLORS = {
  innovadores: '#C8860A',  // gold
  early:       '#8A857C',  // warm-500
  rezagados:   '#D4D0C8',  // warm-200
} as const

/** Colores por departamento — fuente única cross-módulo (T5, T7, T8, T10) */
export const DEPT_COLORS = {
  direction:  '#C8860A',  // Dirección General — gold (acento de marca)
  it:         '#4A8A8A',  // IT / Tecnología   — teal-warm
  ops:        '#C06060',  // Operaciones       — coral
  marketing:  '#5A8C6A',  // Marketing         — pine-green cálido (H≈140°, contrasta con gold direction)
  hr:         '#A06090',  // RRHH              — mauve-warm
  finance:    '#8A6C50',  // Finanzas          — warm-brown
  legal:      '#6A7A50',  // Legal             — olive-warm
  logistics:  '#7A6FAB',  // Logística         — purple-warm
  purchasing: '#507890',  // Compras           — slate-warm
  fallback:   '#C4C0B8',  // Otros             — warm-neutral
} as const

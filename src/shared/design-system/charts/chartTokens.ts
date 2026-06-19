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

// ADR-021 — Design System Charter
//
// Lee tokens de color definidos en src/index.css :root / html.dark.
// Uso exclusivo en componentes NO-chart. Para Recharts usar CHART_PALETTE.
//
// Ejemplo:
//   style={{ color: token('gold') }}        // ✅ componente inline
//   <Line stroke={CHART_PALETTE.navy} />    // ✅ Recharts
//   <Line stroke={token('navy')} />         // ❌ Recharts no resuelve CSS vars

export function token(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim()
}

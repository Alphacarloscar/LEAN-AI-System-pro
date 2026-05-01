// ============================================================
// AlphaLogo — Logo oficial de Alpha Consulting Solutions
//
// Monograma "AC": A en primer plano, C en segundo plano con overlap.
// Texto "ALPHA CONSULTING" centrado en peso light con tracking.
//
// Usado en:
//   · AppLayout (header sticky)  → size="sm"
//   · LoginView (hero centrado)  → size="lg"
//
// Swap a archivo real (cuando esté disponible como SVG/PNG):
//   <img src="/logo-alpha.svg" alt="Alpha Consulting Solutions"
//        className={size === 'sm' ? 'h-7' : 'h-16'} />
// ============================================================

interface AlphaLogoProps {
  /** 'sm' → header compacto. 'lg' → login hero. */
  size?: 'sm' | 'lg'
  /** Forzar variante oscura: blanco sobre fondo oscuro. */
  dark?: boolean
}

// ── Monograma AC — SVG inline ──────────────────────────────────
//
// El logo usa letras en peso Black con overlap:
//   1. "C" se pinta primero (atrás)
//   2. "A" se pinta después (delante, tapando el overlap)
//
// viewBox calibrado para que las letras ocupen el espacio natural
// sin padding innecesario.
//
function ACMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 195 138"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* ── C en segundo plano ── */}
      <text
        x="72"
        y="126"
        fontFamily="'Inter', 'Arial', Helvetica, sans-serif"
        fontSize="126"
        fontWeight="900"
        fill={color}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        C
      </text>

      {/* ── A en primer plano ── */}
      <text
        x="2"
        y="126"
        fontFamily="'Inter', 'Arial', Helvetica, sans-serif"
        fontSize="126"
        fontWeight="900"
        fill={color}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        A
      </text>

      {/* ── ALPHA CONSULTING — centrado, peso light ── */}
      <text
        x="97"
        y="78"
        textAnchor="middle"
        fontFamily="'Inter', 'Arial', Helvetica, sans-serif"
        fontSize="12.5"
        fontWeight="300"
        letterSpacing="3.8"
        fill={color}
      >
        ALPHA CONSULTING
      </text>
    </svg>
  )
}

// ── Componente público ──────────────────────────────────────────
export function AlphaLogo({ size = 'sm', dark = false }: AlphaLogoProps) {
  // Claro: negro (matching el logo blanco oficial).
  // Oscuro: blanco (matching el logo negro oficial).
  const logoColor = dark ? '#ffffff' : '#0D0D0D'

  if (size === 'sm') {
    // Header: monograma compacto, ~48px de ancho
    return (
      <div
        style={{ width: 48, height: 34, flexShrink: 0 }}
        aria-label="Alpha Consulting Solutions"
        title="Alpha Consulting Solutions"
      >
        <ACMark color={logoColor} />
      </div>
    )
  }

  // Login hero: logo grande + nombre del producto debajo
  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Logo AC a tamaño prominente */}
      <div
        style={{ width: 176, height: 124 }}
        aria-label="Alpha Consulting Solutions"
      >
        <ACMark color={logoColor} />
      </div>

      {/* Nombre del producto */}
      <div className="text-center leading-none space-y-0.5">
        <p
          className="text-xl font-semibold tracking-tight"
          style={{ color: dark ? '#f1f5f9' : '#1B2A4E' }}
        >
          L.E.A.N. AI System
        </p>
        <p
          className="text-xs"
          style={{ color: dark ? '#64748b' : '#9ca3af' }}
        >
          Enterprise Edition
        </p>
      </div>
    </div>
  )
}

// ============================================================
// AlphaLogo — Logo oficial de Alpha Consulting Solutions
//
// Monograma "AC":
//   · C pintada primero (segundo plano)
//   · A pintada encima (primer plano)
//   · La "A" entra profundamente dentro de la apertura de la "C"
//     (overlap ≈ 50% del ancho de la A — fiel al logo original)
//   · "ALPHA CONSULTING" en peso light, centrado entre ambas letras
//
// Usado en:
//   · AppLayout (header sticky)  → size="sm"
//   · LoginView (hero centrado)  → size="lg"
//
// ── Swap a archivo real ──────────────────────────────────────
// Cuando esté disponible el SVG/PNG oficial, sustituir el
// contenido de <ACMark> por:
//   <img src="/logo-alpha.svg" alt="Alpha Consulting Solutions"
//        style={{ width, height, objectFit: 'contain' }} />
// ============================================================

interface AlphaLogoProps {
  size?: 'sm' | 'lg'
  dark?: boolean
}

// ── ACMark SVG ─────────────────────────────────────────────────
//
// viewBox calibrado para el overlap correcto:
//   A starts x=10, extends ~96px → ends x=106
//   C starts x=53, extends ~92px → ends x=145
//   Overlap: x=53–106 = 53px (≈55% del ancho de A)
//
// El overlap entre letras se ajustará automáticamente al
// font-metrics reales de Inter; si Inter no está cargado,
// fallback a Arial (métricas similares).
//
function ACMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 185 148"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      {/* ── C — segundo plano (painted first) ── */}
      <text
        x="53"
        y="134"
        fontFamily="'Inter', 'Arial', Helvetica, sans-serif"
        fontSize="132"
        fontWeight="900"
        fill={color}
      >C</text>

      {/* ── A — primer plano (painted on top) ── */}
      <text
        x="10"
        y="134"
        fontFamily="'Inter', 'Arial', Helvetica, sans-serif"
        fontSize="132"
        fontWeight="900"
        fill={color}
      >A</text>

      {/* ── ALPHA CONSULTING — light, tracked, centrado ── */}
      <text
        x="92"
        y="81"
        textAnchor="middle"
        fontFamily="'Inter', 'Arial', Helvetica, sans-serif"
        fontSize="12"
        fontWeight="300"
        letterSpacing="2.8"
        fill={color}
      >ALPHA CONSULTING</text>
    </svg>
  )
}

// ── Componente exportado ────────────────────────────────────────
export function AlphaLogo({ size = 'sm', dark = false }: AlphaLogoProps) {
  // Light mode → negro del logo oficial (#0D0D0D)
  // Dark mode  → blanco del logo oficial (#FFFFFF)
  const logoColor = dark ? '#FFFFFF' : '#0D0D0D'

  if (size === 'sm') {
    return (
      <div
        aria-label="Alpha Consulting Solutions"
        title="Alpha Consulting Solutions"
        style={{ width: 56, height: 45, flexShrink: 0 }}
      >
        <ACMark color={logoColor} />
      </div>
    )
  }

  // Login hero — logo grande + nombre del producto
  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ gap: 16 }}
    >
      <div
        aria-label="Alpha Consulting Solutions"
        style={{ width: 185, height: 148 }}
      >
        <ACMark color={logoColor} />
      </div>

      <div className="text-center" style={{ lineHeight: 1 }}>
        <p
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: dark ? '#f1f5f9' : '#1B2A4E',
            marginBottom: 4,
          }}
        >
          L.E.A.N. AI System
        </p>
        <p
          style={{
            fontSize: 11,
            color: dark ? '#64748b' : '#9ca3af',
          }}
        >
          Enterprise Edition
        </p>
      </div>
    </div>
  )
}

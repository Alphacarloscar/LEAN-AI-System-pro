// ============================================================
// AlphaLogo — Logo oficial de Alpha Consulting Solutions
//
// Usa los archivos PNG originales del logo:
//   · /logos/logo-alpha-light.png  → AC negro sobre blanco (light mode)
//   · /logos/logo-alpha-dark.png   → AC blanco sobre negro (dark mode)
//
// Para actualizar el logo: sustituir solo los PNG en public/logos/.
// Todas las pantallas se actualizan automáticamente.
//
// Usado en:
//   · AppLayout (header sticky)  → size="sm"
//   · LoginView (hero centrado)  → size="lg"
// ============================================================

interface AlphaLogoProps {
  size?: 'sm' | 'lg'
  dark?: boolean
}

export function AlphaLogo({ size = 'sm', dark = false }: AlphaLogoProps) {
  const src = dark ? '/logos/logo-alpha-dark.png' : '/logos/logo-alpha-light.png'

  if (size === 'sm') {
    return (
      <img
        src={src}
        alt="Alpha Consulting Solutions"
        title="Alpha Consulting Solutions"
        style={{
          width:      48,
          height:     'auto',
          flexShrink: 0,
          display:    'block',
        }}
      />
    )
  }

  // Login hero — logo grande + nombre del producto
  return (
    <div className="flex flex-col items-center select-none" style={{ gap: 16 }}>
      <img
        src={src}
        alt="Alpha Consulting Solutions"
        style={{
          width:   160,
          height:  'auto',
          display: 'block',
        }}
      />

      <div className="text-center" style={{ lineHeight: 1 }}>
        <p
          style={{
            fontSize:      20,
            fontWeight:    600,
            letterSpacing: '-0.02em',
            color:         dark ? '#F0EDE8' : '#1C1A16',  // warm-50 / warm near-black
            marginBottom:  4,
          }}
        >
          L.E.A.N. AI System
        </p>
        <p
          style={{
            fontSize: 11,
            color:    dark ? '#64748b' : '#9ca3af',
          }}
        >
          Enterprise Edition
        </p>
      </div>
    </div>
  )
}

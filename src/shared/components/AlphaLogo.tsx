// ============================================================
// AlphaLogo — Logo oficial de Alpha Consulting Solutions
//
// En light mode: PNG negro con mix-blend-mode:multiply
//   → el blanco desaparece ópticamente sobre cualquier fondo claro.
// En dark mode: PNG con filtro invert(1) para invertir a blanco.
//
// Para actualizar el logo: sustituir /public/logos/logo-alpha-light.png.
// ============================================================

interface AlphaLogoProps {
  size?: 'sm' | 'lg'
  dark?: boolean
}

export function AlphaLogo({ size = 'sm', dark = false }: AlphaLogoProps) {
  const width  = size === 'sm' ? 52 : 160
  const filter = dark ? 'invert(1)' : 'none'

  const imgStyle: React.CSSProperties = {
    width,
    height:     'auto',
    display:    'block',
    flexShrink: 0,
    filter,
    // Elimina el blanco del PNG en light mode fundiéndolo con el fondo
    mixBlendMode: dark ? 'normal' : 'multiply',
  }

  if (size === 'sm') {
    return (
      <img
        src="/logos/logo-alpha-light.png"
        alt="Alpha Consulting Solutions"
        title="Alpha Consulting Solutions"
        style={imgStyle}
      />
    )
  }

  return (
    <div className="flex flex-col items-center select-none" style={{ gap: 16 }}>
      <img
        src="/logos/logo-alpha-light.png"
        alt="Alpha Consulting Solutions"
        style={imgStyle}
      />

      <div className="text-center" style={{ lineHeight: 1 }}>
        <p
          style={{
            fontSize:      20,
            fontWeight:    600,
            letterSpacing: '-0.02em',
            color:         dark ? '#F0EDE8' : '#1C1A16',
            marginBottom:  4,
          }}
        >
          GOBY
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

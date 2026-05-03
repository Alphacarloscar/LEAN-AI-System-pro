// ============================================================
// ErrorBoundary — captura errores de renderizado React
//
// Clase componente requerida por la API de React.
// Envuelve el <Outlet> en AppLayout para que cualquier crash
// en una vista hija muestre el error en pantalla en vez de
// dejar la pantalla en blanco.
//
// En producción: muestra el mensaje de error con stack trace.
// En dev: React ya muestra su propio overlay — esto sirve como
//          fallback cuando el overlay no está disponible.
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error:    Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Render crash:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      const msg   = this.state.error?.message   ?? 'Error desconocido'
      const stack = this.state.error?.stack      ?? ''

      return (
        <div style={{
          margin:       24,
          padding:      24,
          borderRadius: 10,
          border:       '2px solid #C06060',
          background:   '#fff5f5',
          fontFamily:   'ui-monospace, monospace',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#C06060', marginBottom: 12 }}>
            ❌ Error de renderizado — L.E.A.N. AI System
          </p>
          <p style={{ fontSize: 12, color: '#333', marginBottom: 16, whiteSpace: 'pre-wrap' }}>
            {msg}
          </p>
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 11, color: '#666', cursor: 'pointer', marginBottom: 6 }}>
              Stack trace
            </summary>
            <pre style={{ fontSize: 10, color: '#666', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
              {stack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop:    16,
              padding:      '6px 14px',
              borderRadius: 6,
              border:       '1px solid #C06060',
              background:   'transparent',
              color:        '#C06060',
              fontSize:     11,
              cursor:       'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================
// GOBY — ResetPasswordView
//
// Vista pública accesible en /reset-password.
// Supabase redirige aquí tras el email de "¿Olvidaste contraseña?"
// o el email de invitación (primer acceso del usuario).
//
// Flujo:
//   1. Usuario hace clic en el link del email → llega a /reset-password
//   2. Supabase incrusta el token en la URL (#access_token=...)
//   3. El SDK de Supabase lo procesa automáticamente (onAuthStateChange)
//   4. El formulario llama a supabase.auth.updateUser({ password })
//   5. Redirección a / tras éxito
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { getAuthSession, subscribeToAuthChanges, updateAuthUser } from '@services/auth.service'
import { useAuthStore }        from './store'
import { Spinner }             from '@shared/design-system/components'

// ── Logo GOBY inline ──────────────────────────────────────────

function GobyLogo() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#C8860A" />
        <path
          d="M16 8C11.6 8 8 11.6 8 16s3.6 8 8 8c2.8 0 5.2-1.4 6.7-3.5H16v-2.5h8v1.5c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8c2.2 0 4.2.9 5.7 2.3l-1.8 1.8C18.8 12.7 17.5 12 16 12z"
          fill="white"
        />
      </svg>
      <span className="text-lean-black dark:text-warm-50" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
        GOBY
      </span>
    </div>
  )
}

// ── Tipos de estado ───────────────────────────────────────────

type ViewState = 'loading' | 'form' | 'success' | 'error_no_session'

// ── Componente principal ──────────────────────────────────────

export function ResetPasswordView() {
  const navigate             = useNavigate()
  const { clearPasswordUpdate } = useAuthStore()

  const [viewState,  setViewState]  = useState<ViewState>('loading')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Fix de timing: el evento SIGNED_IN/PASSWORD_RECOVERY puede dispararse
  // durante initialize() (en App.tsx) ANTES de que este componente monte
  // su listener. Por eso comprobamos la sesión directamente al montar,
  // además de escuchar eventos futuros.
  useEffect(() => {
    // Comprobación inmediata — cubre el caso de token ya procesado
    getAuthSession().then(({ data: { session } }) => {
      if (session) setViewState('form')
    })

    // Listener para eventos que llegan mientras el componente ya está montado
    const { data: { subscription } } = subscribeToAuthChanges((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setViewState('form')
      }
    })

    // Si tras 4s no hay sesión → enlace inválido o expirado
    const timeout = setTimeout(() => {
      setViewState((s) => s === 'loading' ? 'error_no_session' : s)
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    // Actualiza contraseña Y borra el metadato needs_password_reset en auth.users
    const { error: updateError } = await updateAuthUser({
      password,
      data: { needs_password_reset: false },
    })

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    // Limpiar el flag del store para que ProtectedRoute no vuelva a redirigir aquí
    clearPasswordUpdate()
    setViewState('success')
    setTimeout(() => navigate('/', { replace: true }), 2500)
  }

  // ── Estados de la vista ───────────────────────────────────────

  if (viewState === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-warm-950">
      <div className="text-center">
        <Spinner size="md" label="Verificando enlace…" className="text-gold mx-auto mb-3" />
        <p className="text-sm text-text-muted dark:text-warm-200">Verificando enlace…</p>
      </div>
    </div>
  )

  if (viewState === 'error_no_session') return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-warm-950 px-4">
      <div className="bg-white dark:bg-warm-800 rounded-xl shadow-sm border border-border dark:border-warm-600/30 p-8 w-full max-w-sm text-center">
        <GobyLogo />
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 6v4M10 14h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-lean-black dark:text-warm-50 mb-2">Enlace inválido o expirado</h2>
        <p className="text-sm text-text-muted dark:text-warm-200 mb-6">
          El enlace de recuperación ha caducado. Solicita uno nuevo desde la pantalla de acceso.
        </p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="w-full h-10 rounded-lg bg-gold text-white text-sm font-medium hover:opacity-90 transition-colors"
        >
          Volver al acceso
        </button>
      </div>
    </div>
  )

  if (viewState === 'success') return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-warm-950 px-4">
      <div className="bg-white dark:bg-warm-800 rounded-xl shadow-sm border border-border dark:border-warm-600/30 p-8 w-full max-w-sm text-center">
        <GobyLogo />
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 10l2 2 4-4M19 10a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-lean-black dark:text-warm-50 mb-2">Contraseña actualizada</h2>
        <p className="text-sm text-text-muted dark:text-warm-200">Redirigiendo a la plataforma…</p>
      </div>
    </div>
  )

  // ── Formulario principal ──────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-warm-950 px-4">
      <div className="bg-white dark:bg-warm-800 rounded-xl shadow-sm border border-border dark:border-warm-600/30 p-8 w-full max-w-sm">
        <GobyLogo />

        <h1 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-1">
          Establece tu contraseña
        </h1>
        <p className="text-sm text-text-muted dark:text-warm-200 mb-6">
          Elige una contraseña segura para tu cuenta GOBY.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted dark:text-warm-200">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              className="h-10 px-3 rounded-lg border border-border dark:border-warm-600/40 text-sm text-lean-black dark:text-warm-50
                         bg-warm-50 dark:bg-warm-700 outline-none focus:border-gold/60 dark:focus:border-gold/60 focus:bg-white dark:focus:bg-warm-700
                         transition-colors placeholder:text-text-subtle dark:placeholder:text-warm-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted dark:text-warm-200">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null) }}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              required
              className="h-10 px-3 rounded-lg border border-border dark:border-warm-600/40 text-sm text-lean-black dark:text-warm-50
                         bg-warm-50 dark:bg-warm-700 outline-none focus:border-gold/60 dark:focus:border-gold/60 focus:bg-white dark:focus:bg-warm-700
                         transition-colors placeholder:text-text-subtle dark:placeholder:text-warm-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !password || !confirm}
            className="h-10 rounded-lg bg-gold text-white text-sm font-medium
                       hover:opacity-90 disabled:opacity-40 transition-colors mt-1"
          >
            {submitting ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

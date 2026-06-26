// ============================================================
// LoginView — Pantalla de acceso al GOBY
//
// Sprint 3: login async con Supabase Auth.
// La UI es idéntica al Sprint 2 — solo cambia el submit handler.
// ============================================================

import { useState, useEffect, FormEvent } from 'react'
import { useNavigate }                          from 'react-router-dom'
import { useAuthStore }                         from './store'
import { subscribeToAuthChanges, resetPasswordForEmail, updateAuthUser } from '@services/auth.service'
import { AlphaLogo }                            from '@/shared/components/AlphaLogo'
import { Spinner }                        from '@shared/design-system/components'

// ── Campo de formulario ───────────────────────────────────────
function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label:         string
  type:          string
  value:         string
  onChange:      (v: string) => void
  placeholder?:  string
  autoComplete?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-muted dark:text-warm-200">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={[
          'w-full px-4 py-2.5 rounded-lg text-sm text-lean-black dark:text-warm-50',
          'bg-warm-50 dark:bg-warm-800 border border-border dark:border-warm-600/40',
          'placeholder:text-text-subtle dark:placeholder:text-warm-400',
          'focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy dark:focus:border-navy/60',
          'transition-all duration-150',
        ].join(' ')}
      />
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────
export function LoginView() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  // Forgot password flow
  const [isForgot,     setIsForgot]     = useState(false)
  const [forgotEmail,  setForgotEmail]  = useState('')
  const [forgotSent,   setForgotSent]   = useState(false)
  const [forgotError,  setForgotError]  = useState('')
  // Recovery flow
  const [isRecovery,   setIsRecovery]   = useState(false)
  const [newPass,      setNewPass]      = useState('')
  const [newPass2,     setNewPass2]     = useState('')
  const [recError,     setRecError]     = useState('')
  const [recOk,        setRecOk]        = useState(false)

  const { login, error, clearError, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // Si ya estaba autenticado → ir al dashboard directamente
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  // Detectar evento PASSWORD_RECOVERY de Supabase (llega al abrir el enlace del email)
  useEffect(() => {
    const { data: { subscription } } = subscribeToAuthChanges((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault()
    if (!forgotEmail) return
    setLoading(true)
    setForgotError('')
    const redirectTo = `${window.location.origin}/reset-password`
    const { error: err } = await resetPasswordForEmail(forgotEmail, { redirectTo })
    setLoading(false)
    if (err) { setForgotError(err.message); return }
    setForgotSent(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    clearError()

    try {
      const ok = await login(email, password)
      if (ok) {
        navigate('/', { replace: true })
        return
      }
    } catch (err) {
      // login() rechazó inesperadamente (error de red, timeout de Supabase…).
      // El store puede no haber seteado un mensaje — establecemos uno genérico.
      // No llamamos reportError aquí porque store.login() ya lo hará.
      if (!useAuthStore.getState().error) {
        useAuthStore.setState({ error: 'Error de conexión. Inténtalo de nuevo.' })
      }
      console.error('[LoginView] handleSubmit unexpected rejection', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePassword(e: FormEvent) {
    e.preventDefault()
    setRecError('')
    if (newPass.length < 6) { setRecError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (newPass !== newPass2) { setRecError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    const { error: err } = await updateAuthUser({ password: newPass })
    setLoading(false)
    if (err) { setRecError(err.message); return }
    setRecOk(true)
    setTimeout(() => { setIsRecovery(false); setRecOk(false); setNewPass(''); setNewPass2('') }, 2000)
  }

  // ── Formulario "olvidé mi contraseña" ────────────────────────
  if (isForgot) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-950 flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, rgba(42,40,34,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,40,34,0.03) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="relative w-full max-w-sm">
          <div className="bg-white dark:bg-warm-800 rounded-xl border border-border dark:border-warm-600/30 shadow-md px-8 py-10 space-y-8">
            <AlphaLogo size="lg" />
            {forgotSent ? (
              <div className="text-center space-y-3">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">✓ Enlace enviado</p>
                <p className="text-xs text-text-muted dark:text-warm-200">Revisa tu bandeja de entrada y sigue el enlace para crear una nueva contraseña.</p>
                <button onClick={() => { setIsForgot(false); setForgotSent(false); setForgotEmail('') }} className="text-xs text-navy dark:text-gold underline underline-offset-2 mt-2">
                  Volver al acceso
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-text-muted dark:text-warm-200 text-center">Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
                <Field label="Email" type="email" value={forgotEmail} onChange={setForgotEmail} placeholder="tu@empresa.com" autoComplete="email" />
                {forgotError && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40">
                    <p className="text-xs text-red-600 dark:text-red-400">{forgotError}</p>
                  </div>
                )}
                <button type="submit" disabled={loading || !forgotEmail} className={['w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150', loading || !forgotEmail ? 'bg-warm-100 dark:bg-warm-700 text-warm-300 dark:text-warm-500 cursor-not-allowed' : 'bg-navy-metallic dark:bg-gold-metallic text-white dark:text-lean-black hover:bg-navy-metallic-hover dark:hover:bg-gold-metallic-hover active:scale-[0.98] shadow-sm'].join(' ')}>
                  {loading ? 'Enviando…' : 'Enviar enlace'}
                </button>
                <button type="button" onClick={() => setIsForgot(false)} className="w-full text-xs text-text-subtle dark:text-warm-300 hover:text-text-muted dark:hover:text-warm-100 transition-colors pt-1">
                  Volver al acceso
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario de nueva contraseña (recovery) ─────────────────
  if (isRecovery) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-950 flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, rgba(42,40,34,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,40,34,0.03) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="relative w-full max-w-sm">
          <div className="bg-white dark:bg-warm-800 rounded-xl border border-border dark:border-warm-600/30 shadow-md px-8 py-10 space-y-8">
            <AlphaLogo size="lg" />
            {recOk ? (
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">✓ Contraseña actualizada</p>
                <p className="text-xs text-text-subtle dark:text-warm-300">Redirigiendo al login…</p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <p className="text-xs text-text-muted dark:text-warm-200 text-center">Introduce tu nueva contraseña.</p>
                <Field label="Nueva contraseña" type="password" value={newPass} onChange={setNewPass} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                <Field label="Repite la contraseña" type="password" value={newPass2} onChange={setNewPass2} placeholder="••••••••" autoComplete="new-password" />
                {recError && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40">
                    <p className="text-xs text-red-600 dark:text-red-400">{recError}</p>
                  </div>
                )}
                <button type="submit" disabled={loading || !newPass || !newPass2} className={['w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150', loading || !newPass || !newPass2 ? 'bg-warm-100 dark:bg-warm-700 text-warm-300 dark:text-warm-500 cursor-not-allowed' : 'bg-navy-metallic text-white hover:bg-navy-metallic-hover'].join(' ')}>
                  {loading ? 'Guardando…' : 'Guardar contraseña'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-950 flex items-center justify-center px-4">

      {/* Fondo sutil — grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(13,27,42,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(13,27,42,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Card central */}
      <div className="relative w-full max-w-sm">
        <div className="bg-white dark:bg-warm-800 rounded-xl border border-border dark:border-warm-600/30 shadow-md px-8 py-10 space-y-8">

          <AlphaLogo size="lg" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="tu@empresa.com"
              autoComplete="email"
            />
            <div className="space-y-1">
              <Field
                label="Contraseña"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setIsForgot(true); setForgotEmail(email) }}
                  className="text-[11px] text-text-subtle dark:text-warm-300 hover:text-navy dark:hover:text-gold transition-colors underline underline-offset-2"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                <svg className="h-4 w-4 text-red-400 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={[
                'w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150',
                loading || !email || !password
                  ? 'bg-warm-100 text-warm-300 cursor-not-allowed'
                  : 'bg-navy-metallic dark:bg-gold-metallic text-white dark:text-lean-black hover:bg-navy-metallic-hover dark:hover:bg-gold-metallic-hover active:scale-[0.98] shadow-sm',
              ].join(' ')}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" label="Accediendo…" />
                  Accediendo…
                </span>
              ) : 'Acceder'}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-text-subtle dark:text-warm-400 mt-6 font-mono">
          Alpha Consulting Solutions S.L. · Uso interno
        </p>
      </div>

    </div>
  )
}

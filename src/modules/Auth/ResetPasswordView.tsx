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
import { supabase }            from '@/lib/supabase'

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
      <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#2A2822', letterSpacing: '-0.01em' }}>
        GOBY
      </span>
    </div>
  )
}

// ── Tipos de estado ───────────────────────────────────────────

type ViewState = 'loading' | 'form' | 'success' | 'error_no_session'

// ── Componente principal ──────────────────────────────────────

export function ResetPasswordView() {
  const navigate = useNavigate()

  const [viewState,  setViewState]  = useState<ViewState>('loading')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Esperar a que Supabase procese el token de la URL
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setViewState('form')
      }
    })

    // Si tras 3s no hay sesión → enlace inválido o expirado
    const timeout = setTimeout(() => {
      setViewState((s) => s === 'loading' ? 'error_no_session' : s)
    }, 3000)

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
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    setViewState('success')
    setTimeout(() => navigate('/', { replace: true }), 2500)
  }

  // ── Estados de la vista ───────────────────────────────────────

  if (viewState === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE]">
      <div className="text-center">
        <svg className="animate-spin h-6 w-6 text-[#C8860A] mx-auto mb-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-500">Verificando enlace…</p>
      </div>
    </div>
  )

  if (viewState === 'error_no_session') return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-black/8 p-8 w-full max-w-sm text-center">
        <GobyLogo />
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 6v4M10 14h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#2A2822] mb-2">Enlace inválido o expirado</h2>
        <p className="text-sm text-gray-500 mb-6">
          El enlace de recuperación ha caducado. Solicita uno nuevo desde la pantalla de acceso.
        </p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="w-full h-10 rounded-lg bg-[#C8860A] text-white text-sm font-medium hover:bg-[#B57609] transition-colors"
        >
          Volver al acceso
        </button>
      </div>
    </div>
  )

  if (viewState === 'success') return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-black/8 p-8 w-full max-w-sm text-center">
        <GobyLogo />
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 10l2 2 4-4M19 10a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#2A2822] mb-2">Contraseña actualizada</h2>
        <p className="text-sm text-gray-500">Redirigiendo a la plataforma…</p>
      </div>
    </div>
  )

  // ── Formulario principal ──────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-black/8 p-8 w-full max-w-sm">
        <GobyLogo />

        <h1 className="text-lg font-semibold text-[#2A2822] mb-1">
          Establece tu contraseña
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Elige una contraseña segura para tu cuenta GOBY.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-800
                         bg-gray-50 outline-none focus:border-[#C8860A]/60 focus:bg-white
                         transition-colors placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null) }}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              required
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-800
                         bg-gray-50 outline-none focus:border-[#C8860A]/60 focus:bg-white
                         transition-colors placeholder:text-gray-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !password || !confirm}
            className="h-10 rounded-lg bg-[#C8860A] text-white text-sm font-medium
                       hover:bg-[#B57609] disabled:opacity-40 transition-colors mt-1"
          >
            {submitting ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

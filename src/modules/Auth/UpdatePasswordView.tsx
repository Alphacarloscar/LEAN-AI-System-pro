// ============================================================
// GOBY — UpdatePasswordView
//
// Vista protegida accesible en /update-password.
// Se activa cuando needsPasswordUpdate=true en el auth store:
//   - Usuario invitado en su primer acceso (SIGNED_IN + needs_password_reset=true)
//   - Usuario con contraseña caducada forzado por el superadmin
//
// A diferencia de ResetPasswordView, el usuario YA ESTÁ autenticado
// cuando llega aquí (ProtectedRoute lo redirige). No hay token en la
// URL que procesar — se llama directamente a updateUser().
//
// Flujo:
//   1. Superadmin invita usuario → email con link → usuario hace clic
//   2. Supabase autentica (SIGNED_IN) → auth store detecta needs_password_reset=true
//   3. ProtectedRoute redirige a /update-password (esta vista)
//   4. Usuario establece contraseña → updateUser() borra el flag
//   5. clearPasswordUpdate() → ProtectedRoute ya no intercepta → redirect a /
// ============================================================

import { useState }    from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase }    from '@/lib/supabase'
import { useAuthStore } from './store'

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

// ── Componente principal ──────────────────────────────────────

export function UpdatePasswordView() {
  const navigate              = useNavigate()
  const { clearPasswordUpdate, user } = useAuthStore()

  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState<string | null>(null)

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

    // Actualiza contraseña y elimina el flag needs_password_reset
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { needs_password_reset: false },
    })

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    // Limpia el flag del store → ProtectedRoute ya no redirigirá aquí
    clearPasswordUpdate()
    setDone(true)
    setTimeout(() => navigate('/', { replace: true }), 2000)
  }

  // ── Estado de éxito ───────────────────────────────────────

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-black/8 p-8 w-full max-w-sm text-center">
        <GobyLogo />
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 10l2 2 4-4M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#2A2822] mb-2">Contraseña establecida</h2>
        <p className="text-sm text-gray-500">Accediendo a la plataforma…</p>
      </div>
    </div>
  )

  // ── Formulario principal ──────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-black/8 p-8 w-full max-w-sm">
        <GobyLogo />

        <h1 className="text-lg font-semibold text-[#2A2822] mb-1">
          Bienvenido{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Antes de continuar, establece una contraseña segura para tu cuenta.
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
              autoFocus
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
            {submitting ? 'Guardando…' : 'Acceder a GOBY'}
          </button>
        </form>
      </div>
    </div>
  )
}

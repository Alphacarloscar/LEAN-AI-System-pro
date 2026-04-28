// ============================================================
// LoginView — Pantalla de acceso al L.E.A.N. AI System
//
// Sprint 3: login async con Supabase Auth.
// La UI es idéntica al Sprint 2 — solo cambia el submit handler.
// ============================================================

import { useState, useEffect, FormEvent } from 'react'
import { useNavigate }                    from 'react-router-dom'
import { useAuthStore }                   from './store'

// ── Icono L.E.A.N. ───────────────────────────────────────────
function LeanLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-12 w-12 rounded-xl bg-[#0D1B2A] flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-xl tracking-tight select-none">α</span>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">
          Alpha Consulting Solutions
        </p>
        <h1 className="text-xl font-semibold text-gray-900 mt-0.5">
          L.E.A.N. AI System
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Enterprise Edition</p>
      </div>
    </div>
  )
}

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
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={[
          'w-full px-4 py-2.5 rounded-lg text-sm text-gray-900',
          'bg-white border border-gray-200',
          'placeholder:text-gray-300',
          'focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/20 focus:border-[#0D1B2A]',
          'transition-all duration-150',
        ].join(' ')}
      />
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────
export function LoginView() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const { login, error, clearError, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // Si ya estaba autenticado → ir al dashboard directamente
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    clearError()

    const ok = await login(email, password)
    if (ok) {
      navigate('/', { replace: true })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 px-8 py-10 space-y-8">

          <LeanLogo />

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="tu@empresa.com"
              autoComplete="email"
            />
            <Field
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
            />

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
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-[#0D1B2A] text-white hover:bg-[#1a2e44] active:scale-[0.98] shadow-sm',
              ].join(' ')}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Accediendo…
                </span>
              ) : 'Acceder'}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-300 mt-6 font-mono">
          Alpha Consulting Solutions S.L. · Uso interno
        </p>
      </div>

    </div>
  )
}

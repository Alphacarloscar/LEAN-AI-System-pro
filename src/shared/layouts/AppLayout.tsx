// ============================================================
// AppLayout — Layout persistente de la aplicación (Sprint 10)
//
// Sprint 10:
//   — Monta ProjectRuntimeProvider (orquesta cargas críticas en BG).
//   — Header restructurado: GOBY · projectName · companyName
//   — Eliminado prop `phases` (ya no viene de DemoContext).
//   — AppSidebar recibe phases = [] — sidebar gestiona sus propias fases.
//
// Envuelve TODAS las vistas autenticadas.
// Garantiza que el header y el sidebar toggle sean siempre
// visibles, independientemente de qué herramienta esté activa.
//
// Estructura:
//   <header sticky> — GOBY · proyecto activo · nombre empresa
//   <AppSidebar>    — toggle + panel lateral (siempre montado)
//   <main>          — <Outlet /> con la vista activa
// ============================================================

import { useEffect, useRef, useState }             from 'react'
import { useLocation }                            from 'react-router-dom'
import { Spinner }                                from '@shared/design-system/components'
import { Outlet }                                 from 'react-router-dom'
import type { AppLayoutContext }                  from './AppLayout.hooks'
import { AppSidebar }                             from '@/shared/components/AppSidebar'
import { AlphaLogo }                              from '@/shared/components/AlphaLogo'
import { EngagementSelector }                     from '@/shared/components/EngagementSelector'
import { useDarkMode }                            from '@/shared/hooks/useDarkMode'
import { useAuthStore }                           from '@/modules/Auth'
import type { SessionRecoveryState }              from '@/modules/Auth/store'
import { useEngagementStore }                     from '@/modules/Engagement/store'
import { ErrorBoundary }                          from '@/shared/components/ErrorBoundary'
import { DebugPanel }                             from '@/shared/components/DebugPanel'
import { getProjectWithCompany }                  from '@/services/projects.service'
import { ProjectRuntimeProvider }                 from '@/shared/providers/ProjectRuntimeProvider'
import { useNavigate }                            from 'react-router-dom'

// ── Dark mode toggle ──────────────────────────────────────────
function DarkModeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={[
        'h-8 w-8 rounded-full flex items-center justify-center',
        'transition-colors duration-200',
        dark
          ? 'bg-white/10 hover:bg-white/20 text-gold-hover/80'
          : 'bg-black/5 hover:bg-black/10 text-warm-500',
      ].join(' ')}
    >
      {dark ? (
        /* Sol — indica que al pulsar se activa el modo claro */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2"  x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2"  y1="12" x2="5"  y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
          <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
          <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22" />
        </svg>
      ) : (
        /* Luna — indica que al pulsar se activa el modo oscuro */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  )
}

// ── Botón de logout ───────────────────────────────────────────
function LogoutButton({ dark }: { dark: boolean }) {
  const { logout, user } = useAuthStore()
  const navigate         = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <button
      onClick={handleLogout}
      title={`Cerrar sesión${user ? ` (${user.name})` : ''}`}
      className={[
        'h-8 px-3 rounded-full flex items-center gap-1.5',
        'text-[10px] font-mono uppercase tracking-wide transition-colors duration-200',
        dark
          ? 'text-white/60 hover:text-white/85 hover:bg-white/8'
          : 'text-black/50 hover:text-black/75 hover:bg-black/6',
      ].join(' ')}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" />
      </svg>
      <span className="hidden sm:inline">{user?.name ?? 'Salir'}</span>
    </button>
  )
}

// ── Breadcrumb de contexto: GOBY · proyecto · empresa ─────────
// Muestra la jerarquía de contexto activo en el header.
// — GOBY: marca fija del software.
// — projectName: nombre del proyecto activo (EngagementSelector).
// — companyName: nombre de la empresa del perfil activo.
function ContextBreadcrumb({ dark }: { dark: boolean }) {
  const { activeEngagementId } = useEngagementStore()
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    if (!activeEngagementId) { setCompanyName(null); return }
    getProjectWithCompany(activeEngagementId)
      .then((d) => setCompanyName(d.company_name || null))
      .catch(() => setCompanyName(null))
  }, [activeEngagementId])

  return (
    <div className="flex items-center gap-2 select-none min-w-0">
      {/* GOBY — marca fija */}
      <span
        className="text-[13px] font-bold font-mono uppercase tracking-widest shrink-0"
        style={{ color: dark ? 'rgba(200,134,10,0.95)' : '#C8860A' }}
      >
        GOBY
      </span>

      {/* nombre empresa en mayúsculas */}
      {companyName && (
        <>
          <span
            className="text-[11px]"
            style={{ color: dark ? 'rgba(255,255,255,0.30)' : 'rgba(28,26,22,0.30)' }}
          >·</span>
          <span
            className="text-[12px] font-mono uppercase tracking-widest font-semibold truncate max-w-[200px]"
            style={{ color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(28,26,22,0.85)' }}
          >
            {companyName}
          </span>
        </>
      )}
    </div>
  )
}

// ── SessionRecoveryBanner — overlay de estado de sesión ───────
// 'reconnecting' → banner sutil "Reconectando…" mientras se recargan stores.
// 'expired'      → overlay bloqueante "Sesión expirada" con botón de re-login.
function SessionRecoveryBanner({ state, onReLogin }: {
  state:     SessionRecoveryState
  onReLogin: () => void
}) {
  if (state === 'idle') return null

  if (state === 'reconnecting') {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2.5 rounded-full
        bg-warm-900/90 dark:bg-warm-700/90 text-white text-[12px] font-medium
        shadow-sm backdrop-blur-sm border border-white/10"
      >
        <Spinner size="sm" label="Reconectando…" className="text-gold" />
        Reconectando y actualizando datos…
      </div>
    )
  }

  // state === 'expired'
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-warm-800 rounded-xl
        border border-border shadow-md p-6 text-center space-y-4"
      >
        <div className="h-12 w-12 rounded-full bg-gold/5 dark:bg-gold/20
          flex items-center justify-center mx-auto"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-lean-black dark:text-warm-50 mb-1">
            La sesión ha expirado
          </h3>
          <p className="text-[12px] text-text-subtle leading-relaxed">
            Tu sesión se cerró por inactividad. Vuelve a iniciar sesión para continuar.
            Los datos no guardados en este momento pueden haberse perdido.
          </p>
        </div>
        <button
          onClick={onReLogin}
          className="w-full py-2.5 rounded-xl text-sm font-semibold
            bg-navy-metallic dark:bg-gold-metallic text-white dark:text-lean-black hover:bg-navy-metallic-hover dark:hover:bg-gold-metallic-hover
            transition-colors shadow-sm"
        >
          Volver a iniciar sesión
        </button>
      </div>
    </div>
  )
}

// ── Layout principal ──────────────────────────────────────────
export function AppLayout() {
  const { dark, toggle }                        = useDarkMode()
  const { user, sessionRecoveryState, clearSessionExpired } = useAuthStore()
  const { loadMyProjects }                      = useEngagementStore()
  const navigate                                = useNavigate()
  const location                                = useLocation()

  // Cargar engagements del usuario en cuanto esté autenticado
  useEffect(() => {
    if (user) loadMyProjects()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Foco al contenido principal + scroll to top en cada navegación
  useEffect(() => {
    const main = document.getElementById('main-content')
    main?.focus({ preventScroll: true })
    // Reset scroll de window y del contenedor main si tiene scroll propio
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    main?.scrollTo?.({ top: 0, left: 0 })
  }, [location.pathname])

  // ResizeObserver: mide la altura real del header y la expone como --header-h
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height
      document.documentElement.style.setProperty('--header-h', `${height}px`)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleReLogin() {
    clearSessionExpired()
    navigate('/login', { replace: true })
  }

  return (
    <ProjectRuntimeProvider>
      <div className="flex flex-col min-h-screen bg-surface dark:bg-warm-900">

        {/* ── Skip link — accesibilidad teclado ── */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200]
            focus:px-4 focus:py-2 focus:rounded-lg focus:bg-gold focus:text-white
            focus:text-sm focus:font-semibold focus:shadow-md focus:outline-none"
        >
          Saltar al contenido principal
        </a>

        {/* ── Header sticky — siempre visible ── */}
        <header ref={headerRef} className={[
          'sticky top-0 z-20 flex items-center justify-between px-6',
          'h-16 shrink-0 relative',
          'backdrop-blur-sm border-b',
          dark
            ? 'bg-warm-900/92 border-warm-600/20'
            : 'bg-[rgba(247,244,238,0.95)] border-[rgba(28,26,22,0.12)]',
        ].join(' ')}>

          {/* ── Izquierda: logo + selector de proyecto ── */}
          <div className="flex items-center gap-3 shrink-0">
            <AlphaLogo dark={dark} />
            <EngagementSelector dark={dark} />
          </div>

          {/* ── Centro: breadcrumb GOBY · empresa — centrado absolutamente ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ContextBreadcrumb dark={dark} />
          </div>

          {/* ── Derecha: controles de sesión ── */}
          <div className="flex items-center gap-3 shrink-0">
            <LogoutButton dark={dark} />
            <DarkModeToggle dark={dark} onToggle={toggle} />
          </div>

        </header>

        {/* ── Sidebar — siempre montado, toggle visible en todas las rutas ── */}
        <AppSidebar />

        {/* ── Contenido de la ruta activa ── */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col focus:outline-none"
        >
          <div aria-live="polite" aria-atomic="false" className="flex flex-col flex-1">
            <ErrorBoundary>
              <Outlet context={{ dark } satisfies AppLayoutContext} />
            </ErrorBoundary>
          </div>
        </main>

        {/* ── Debug Panel — solo en desarrollo ── */}
        {import.meta.env.DEV && <DebugPanel />}

        {/* ── Session Recovery Banner — overlay de sesión expirada o reconectando ── */}
        <SessionRecoveryBanner
          state={sessionRecoveryState}
          onReLogin={handleReLogin}
        />

      </div>
    </ProjectRuntimeProvider>
  )
}

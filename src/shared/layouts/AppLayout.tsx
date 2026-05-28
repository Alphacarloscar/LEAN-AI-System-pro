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

import { useEffect }                              from 'react'
import { Outlet, useOutletContext }               from 'react-router-dom'
import { AppSidebar }                             from '@/shared/components/AppSidebar'
import { AlphaLogo }                              from '@/shared/components/AlphaLogo'
import { EngagementSelector }                     from '@/shared/components/EngagementSelector'
import { useDarkMode }                            from '@/shared/hooks/useDarkMode'
import { useAuthStore }                           from '@/modules/Auth'
import { useEngagementStore }                     from '@/modules/Engagement/store'
import { useCompanyProfileStore }                 from '@/modules/CompanyProfile/store'
import { ErrorBoundary }                          from '@/shared/components/ErrorBoundary'
import { DebugPanel }                             from '@/shared/components/DebugPanel'
import { ProjectRuntimeProvider }                 from '@/shared/providers/ProjectRuntimeProvider'
import { useNavigate }                            from 'react-router-dom'

// ── Contexto compartido hacia las rutas hijas ─────────────────
export interface AppLayoutContext {
  dark: boolean
}

export function useAppLayout() {
  return useOutletContext<AppLayoutContext>()
}

// ── Dark mode toggle ──────────────────────────────────────────
function DarkModeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className={[
        'h-8 w-8 rounded-full flex items-center justify-center',
        'transition-colors duration-200',
        dark
          ? 'bg-white/10 hover:bg-white/20 text-white/70'
          : 'bg-black/5 hover:bg-black/10 text-black/40',
      ].join(' ')}
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="7.5" cy="7.5" r="2.5" />
          <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.2 3.2l1 1M10.8 10.8l1 1M10.8 3.2l-1 1M3.2 10.8l1-1" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 9A6 6 0 015 2a6 6 0 100 10 6 6 0 007-3z" />
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
          ? 'text-white/40 hover:text-white/70 hover:bg-white/8'
          : 'text-black/30 hover:text-black/60 hover:bg-black/6',
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
  const { projects, activeEngagementId } = useEngagementStore()
  const { profile }                      = useCompanyProfileStore()

  const activeProject = projects.find((p) => p.id === activeEngagementId)
  const projectName   = activeProject?.name ?? null
  const companyName   = profile.nombre || null

  const dimText = dark ? 'rgba(255,255,255,0.25)' : 'rgba(28,26,22,0.25)'
  const sepText = dark ? 'rgba(255,255,255,0.15)' : 'rgba(28,26,22,0.15)'

  return (
    <div className="flex items-center gap-1.5 select-none min-w-0">
      {/* GOBY — marca fija */}
      <span
        className="text-[11px] font-bold font-mono uppercase tracking-widest shrink-0"
        style={{ color: dark ? 'rgba(200,134,10,0.85)' : '#C8860A' }}
      >
        GOBY
      </span>

      {/* proyecto activo */}
      {projectName && (
        <>
          <span className="text-[10px]" style={{ color: sepText }}>·</span>
          <span
            className="text-[11px] font-medium truncate max-w-[160px]"
            style={{ color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(28,26,22,0.55)' }}
          >
            {projectName}
          </span>
        </>
      )}

      {/* nombre empresa */}
      {companyName && (
        <>
          <span className="text-[10px]" style={{ color: sepText }}>·</span>
          <span
            className="text-[10px] font-mono uppercase tracking-wide truncate max-w-[140px]"
            style={{ color: dimText }}
          >
            {companyName}
          </span>
        </>
      )}
    </div>
  )
}

// ── Layout principal ──────────────────────────────────────────
export function AppLayout() {
  const { dark, toggle }   = useDarkMode()
  const { user }           = useAuthStore()
  const { loadMyProjects } = useEngagementStore()

  // Cargar engagements del usuario en cuanto esté autenticado
  useEffect(() => {
    if (user) loadMyProjects()
  }, [user?.id])

  return (
    <ProjectRuntimeProvider>
      <div className="min-h-screen bg-surface dark:bg-warm-900">

        {/* ── Header sticky — siempre visible ── */}
        <header className={[
          'sticky top-0 z-20 flex items-center justify-between px-6 py-3 gap-4',
          'backdrop-blur-sm border-b',
          dark
            ? 'bg-warm-900/92 border-warm-600/20'
            : 'bg-[rgba(247,244,238,0.95)] border-[rgba(28,26,22,0.12)]',
        ].join(' ')}>

          {/* ── Izquierda: logo + selector de proyecto ── */}
          <div className="flex items-center gap-3 min-w-0">
            <AlphaLogo dark={dark} />
            <EngagementSelector dark={dark} />
          </div>

          {/* ── Centro: breadcrumb GOBY · proyecto · empresa ── */}
          <div className="flex-1 flex justify-center px-4 min-w-0 max-w-sm mx-auto">
            <ContextBreadcrumb dark={dark} />
          </div>

          {/* ── Derecha: controles de sesión ── */}
          <div className="flex items-center gap-3 shrink-0">
            <LogoutButton dark={dark} />
            <DarkModeToggle dark={dark} onToggle={toggle} />
          </div>

        </header>

        {/* ── Sidebar — siempre montado, toggle visible en todas las rutas ── */}
        <AppSidebar phases={[]} />

        {/* ── Contenido de la ruta activa ── */}
        <main>
          <ErrorBoundary>
            <Outlet context={{ dark } satisfies AppLayoutContext} />
          </ErrorBoundary>
        </main>

        {/* ── Debug Panel — solo en desarrollo ── */}
        {import.meta.env.DEV && <DebugPanel />}

      </div>
    </ProjectRuntimeProvider>
  )
}

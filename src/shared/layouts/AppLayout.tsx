// ============================================================
// AppLayout — Layout persistente de la aplicación
//
// Envuelve TODAS las vistas autenticadas.
// Garantiza que el header y el sidebar toggle sean siempre
// visibles, independientemente de qué herramienta esté activa.
//
// Estructura:
//   <header sticky> — logo Alpha + nombre + dark mode + logo cliente
//   <AppSidebar>    — toggle + panel lateral (siempre montado)
//   <main>          — <Outlet /> con la vista activa
// ============================================================

import { Outlet, useOutletContext, useNavigate } from 'react-router-dom'
import { AppSidebar }                            from '@/shared/components/AppSidebar'
import { useDarkMode }                           from '@/shared/hooks/useDarkMode'
import { useAuthStore }                          from '@/modules/Auth'
import type { LeanPhase }                        from '@/shared/components/PhaseRoadmap'

// ── Contexto compartido hacia las rutas hijas ─────────────────
export interface AppLayoutContext {
  dark: boolean
}

export function useAppLayout() {
  return useOutletContext<AppLayoutContext>()
}

// ── Props ─────────────────────────────────────────────────────
interface AppLayoutProps {
  phases: LeanPhase[]
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

// ── Logo placeholder ──────────────────────────────────────────
function LogoSlot({ alt, align = 'left' }: { alt: string; align?: 'left' | 'right' }) {
  return (
    <div className={[
      'flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed',
      'border-black/20 dark:border-white/15 text-[10px] font-mono text-black/30 dark:text-white/25 select-none',
      align === 'right' ? 'flex-row-reverse' : '',
    ].join(' ')}>
      <svg className="h-3.5 w-3.5 opacity-50" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="3" width="14" height="10" rx="1.5" />
        <circle cx="5.5" cy="7" r="1.5" />
        <path d="M1 11l4-3 3 2.5 3-3 4 3.5" />
      </svg>
      {alt}
    </div>
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

// ── Layout principal ──────────────────────────────────────────
export function AppLayout({ phases }: AppLayoutProps) {
  const { dark, toggle } = useDarkMode()

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950">

      {/* ── Header sticky — siempre visible ── */}
      <header className={[
        'sticky top-0 z-20 flex items-center justify-between px-8 py-3',
        'backdrop-blur-sm border-b',
        dark
          ? 'bg-gray-950/90 border-white/8'
          : 'bg-white/90 border-black/6',
      ].join(' ')}>
        <LogoSlot alt="Logo Alpha" align="left" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-black/25 dark:text-white/25">
          L.E.A.N. AI System
        </span>
        <div className="flex items-center gap-3">
          <LogoutButton dark={dark} />
          <DarkModeToggle dark={dark} onToggle={toggle} />
          <LogoSlot alt="Logo Cliente" align="right" />
        </div>
      </header>

      {/* ── Sidebar — siempre montado, toggle visible en todas las rutas ── */}
      <AppSidebar phases={phases} />

      {/* ── Contenido de la ruta activa ── */}
      <main>
        <Outlet context={{ dark } satisfies AppLayoutContext} />
      </main>

    </div>
  )
}

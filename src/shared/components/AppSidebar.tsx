// ============================================================
// AppSidebar — Menú lateral colapsable
//
// Sprint 10: navegación estática T1–T12.
//   — Eliminado prop `phases` (dependía de DemoContext).
//   — La lista T1–T12 es una constante del producto, no datos
//     cargados de Supabase ni del proyecto activo.
//   — El item activo se detecta por location.pathname.
//   — Siempre visible cuando hay sesión; no depende de cargas.
// ============================================================

import { useState }                   from 'react'
import { useNavigate, useLocation }   from 'react-router-dom'
import { useEngagementStore }         from '@/modules/Engagement/store'
import { isPackageNavEnabled }        from '@/config/featureFlags'
import { PackageNav }                 from '@/shared/components/PackageNav'
import { toolLabel }                  from '@/config/toolMetadata'
import type { ToolCode }              from '@/types'

// ── Registro estático del producto ───────────────────────────
// Fuente de verdad de la navegación. NUNCA debe depender de:
//   DemoContext, Supabase, CompanyProfileStore, ni datos cargados.

interface ToolNavItem {
  code:  ToolCode
  label: string
  path:  string
}

// Códigos + path base de navegación. El label SIEMPRE se deriva de
// toolMetadata (fuente única, FDR-002): flag-on y flag-off muestran el
// mismo texto → cero divergencia de nombres entre las dos navegaciones.
// La ruta final se construye dinámicamente con el engagementId activo.
const TOOL_NAV_BASE: Array<{ code: ToolCode; path: string }> = [
  { code: 'T1',  path: '/t1'  },
  { code: 'T2',  path: '/t2'  },
  { code: 'T3',  path: '/t3'  },
  { code: 'T4',  path: '/t4'  },
  { code: 'T5',  path: '/t5'  },
  { code: 'T6',  path: '/t6'  },
  { code: 'T7',  path: '/t7'  },
  { code: 'T8',  path: '/t8'  },
  { code: 'T9',  path: '/t9'  },
  { code: 'T10', path: '/'    },
  { code: 'T11', path: '/t11' },
  { code: 'T12', path: '/t12' },
]

const TOOL_NAVIGATION_BASE: ToolNavItem[] = TOOL_NAV_BASE.map((t) => ({
  code:  t.code,
  label: toolLabel(t.code),
  path:  t.path,
}))

// ── Sidebar ────────────────────────────────────────────────────
export function AppSidebar() {
  const [open, setOpen]  = useState(false)
  const navigate         = useNavigate()
  const location         = useLocation()
  const engagementId     = useEngagementStore((s) => s.activeEngagementId)
  const packageNav       = isPackageNavEnabled()

  // Construye la ruta final: T1–T12 incluyen el engagementId en la URL.
  // T10 (path '/') no lleva engagementId porque es el dashboard raíz.
  const TOOL_NAVIGATION = TOOL_NAVIGATION_BASE.map((tool) =>
    tool.path !== '/' && engagementId
      ? { ...tool, path: `${tool.path}/${engagementId}` }
      : tool
  )

  function goTo(path: string) {
    navigate(path)
    setOpen(false)
  }

  const isCompanyProfileActive = location.pathname === '/company-profile'

  return (
    <>
      {/* ── Toggle — siempre visible ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        className={[
          'fixed top-[72px] left-0 z-30',
          'flex items-center justify-center',
          'h-10 w-10 rounded-r-xl',
          'bg-white dark:bg-warm-800 border border-l-0 border-black/10 dark:border-warm-600/30 shadow-sm',
          'hover:bg-[#F0EDE8] dark:hover:bg-warm-700 transition-colors duration-150',
        ].join(' ')}
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3E3B35" strokeWidth="1.8" strokeLinecap="round" className="dark:stroke-warm-100">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3E3B35" strokeWidth="1.8" strokeLinecap="round" className="dark:stroke-warm-100">
            <path d="M2 4h10M2 7h10M2 10h10" />
          </svg>
        )}
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Panel lateral ── */}
      <aside
        className={[
          'fixed top-[57px] left-0 z-30 h-[calc(100vh-57px)]',
          'w-64 bg-white dark:bg-warm-900 border-r border-black/8 dark:border-warm-600/20 shadow-xl',
          'flex flex-col overflow-hidden',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/6 dark:border-white/6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-black/30 dark:text-white/30">
            {packageNav ? 'Paquetes' : 'Herramientas'}
          </span>
          <span className="text-[10px] font-mono text-black/25 dark:text-white/20">
            {packageNav ? 'GOBY' : 'T1 – T12'}
          </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-2">

          {/* ── Perfil de Empresa — acceso global ── */}
          <button
            onClick={() => goTo('/company-profile')}
            className={[
              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100',
              isCompanyProfileActive
                ? 'bg-navy/8 dark:bg-navy/20'
                : 'hover:bg-black/3 dark:hover:bg-white/4',
            ].join(' ')}
          >
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: isCompanyProfileActive ? 'rgba(42,40,34,0.12)' : '#F0EDE8',
                border: `1.5px solid ${isCompanyProfileActive ? '#2A2822' : '#D4D0C8'}`,
                color:  isCompanyProfileActive ? '#2A2822' : '#6B6864',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="10" height="10" rx="1" />
                <path d="M5 13V9h4v4M2 6h10" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold truncate ${isCompanyProfileActive ? 'text-navy dark:text-warm-100' : 'text-black/70 dark:text-gray-300'}`}>
                Perfil de Empresa
              </p>
              <p className="text-[10px] text-black/30 dark:text-white/25 font-mono mt-0.5">
                Contexto · Fricciones
              </p>
            </div>
          </button>

          {/* Separador */}
          <div className="mx-4 my-2 border-t border-black/6 dark:border-white/6" />

          {/* ── Navegación principal ──
              flag ON  → paquetes comerciales (FDR-002)
              flag OFF → lista plana T1–T12 (comportamiento legacy intacto) */}
          {packageNav ? (
            <PackageNav onNavigate={goTo} />
          ) : (
          <div className="px-3 space-y-0.5">
            {TOOL_NAVIGATION.map((tool) => {
              const isActive = location.pathname === tool.path ||
                               (tool.path !== '/' && location.pathname.startsWith(tool.path))

              return (
                <button
                  key={tool.code}
                  onClick={() => goTo(tool.path)}
                  className={[
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left',
                    'transition-all duration-100',
                    isActive
                      ? 'bg-[#C8860A]/10 dark:bg-[#C8860A]/15'
                      : 'hover:bg-black/3 dark:hover:bg-white/4',
                  ].join(' ')}
                >
                  <span
                    className="font-mono text-[10px] shrink-0 w-7 text-center"
                    style={{ color: isActive ? '#C8860A' : '#9ca3af' }}
                  >
                    {tool.code}
                  </span>
                  <span
                    className={[
                      'text-xs truncate',
                      isActive
                        ? 'font-semibold text-[#C8860A] dark:text-amber-400'
                        : 'text-black/65 dark:text-gray-300',
                    ].join(' ')}
                  >
                    {tool.label}
                  </span>
                </button>
              )
            })}
          </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-black/6 dark:border-white/6">
          <p className="text-[10px] font-mono text-black/20 dark:text-white/15 text-center">
            GOBY · Alpha Consulting
          </p>
        </div>
      </aside>
    </>
  )
}

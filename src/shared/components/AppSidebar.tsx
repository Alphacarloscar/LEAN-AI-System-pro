// ============================================================
// AppSidebar — Menú lateral overlay colapsable (todos los tamaños)
//
// Comportamiento:
//   — El sidebar es siempre un overlay fixed. Nunca desplaza
//     el contenido de la página (main nunca tiene ml-*).
//   — Se abre con el botón hamburguesa (fixed, visible siempre).
//   — Se cierra al:
//       · pulsar sobre el backdrop translúcido
//       · seleccionar cualquier herramienta de la lista
//   — El backdrop oscurece levemente el contenido pero NO lo
//     desplaza ni redimensiona.
// ============================================================

import { useNavigate, useLocation }   from 'react-router-dom'
import { useUnsavedChanges }          from '@/shared/hooks/useUnsavedChanges'
import { useSidebar }                 from '@/shared/hooks/useSidebar'
import { UnsavedChangesModal }        from '@/shared/components/UnsavedChangesModal'
import { useState }                   from 'react'

// ── Registro estático del producto ───────────────────────────

interface ToolNavItem {
  code:  string
  label: string
  path:  string
}

const TOOL_NAVIGATION: ToolNavItem[] = [
  { code: 'T1',  label: 'AI Readiness Assessment',   path: '/t1'  },
  { code: 'T2',  label: 'Stakeholder Matrix',         path: '/t2'  },
  { code: 'T3',  label: 'Value Stream Map',           path: '/t3'  },
  { code: 'T4',  label: 'Use Case Priority Board',    path: '/t4'  },
  { code: 'T5',  label: 'AI Taxonomy Canvas',         path: '/t5'  },
  { code: 'T6',  label: 'Risk & Governance',          path: '/t6'  },
  { code: 'T7',  label: 'Adoption Heatmap',           path: '/t7'  },
  { code: 'T8',  label: 'Communication Map',          path: '/t8'  },
  { code: 'T9',  label: 'AI Roadmap',                 path: '/t9'  },
  { code: 'T10', label: 'AI Value Dashboard',         path: '/'    },
  { code: 'T11', label: 'Operating Rhythm',           path: '/t11' },
  { code: 'T12', label: 'ISO 42001 Assessment',       path: '/t12' },
]

// ── Panel interior ────────────────────────────────────────────
function SidebarPanel({ onNav }: { onNav: (path: string) => void }) {
  const location = useLocation()
  const isCompanyProfileActive = location.pathname === '/company-profile'

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/6 dark:border-white/6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-black/30 dark:text-white/30">
          Herramientas
        </span>
        <span className="text-[10px] font-mono text-black/25 dark:text-white/20">
          T1 – T12
        </span>
      </div>

      {/* Navegación */}
      <nav aria-label="Herramientas metodológicas T1 a T12" className="flex-1 overflow-y-auto py-2">

        {/* ── Perfil de Empresa ── */}
        <button
          onClick={() => onNav('/company-profile')}
          aria-current={isCompanyProfileActive ? 'page' : undefined}
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
            <p className={`text-xs font-semibold truncate ${isCompanyProfileActive ? 'text-navy dark:text-warm-100' : 'text-warm-700 dark:text-warm-100'}`}>
              Perfil de Empresa
            </p>
            <p className="text-[10px] text-black/30 dark:text-white/25 font-mono mt-0.5">
              Contexto · Fricciones
            </p>
          </div>
        </button>

        {/* Separador */}
        <div className="mx-4 my-2 border-t border-black/6 dark:border-white/6" />

        {/* ── T1–T12 ── */}
        <div className="px-3 space-y-0.5">
          {TOOL_NAVIGATION.map((tool) => {
            const isActive = location.pathname === tool.path ||
                             (tool.path !== '/' && location.pathname.startsWith(tool.path + '/'))

            return (
              <button
                key={tool.code}
                onClick={() => onNav(tool.path)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left',
                  'transition-all duration-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  isActive
                    ? 'bg-gold/10 dark:bg-gold/15'
                    : 'hover:bg-black/3 dark:hover:bg-white/4',
                ].join(' ')}
              >
                <span
                  className={[
                    'font-mono text-[10px] shrink-0 w-7 text-center',
                    isActive ? 'text-gold' : 'text-warm-400',
                  ].join(' ')}
                >
                  {tool.code}
                </span>
                <span
                  className={[
                    'text-xs truncate',
                    isActive
                      ? 'font-semibold text-gold dark:text-gold-hover'
                      : 'text-warm-700 dark:text-warm-100',
                  ].join(' ')}
                >
                  {tool.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-black/6 dark:border-white/6">
        <p className="text-[10px] font-mono text-black/20 dark:text-white/15 text-center">
          GOBY · Alpha Consulting
        </p>
      </div>
    </>
  )
}

// ── Sidebar ────────────────────────────────────────────────────
export function AppSidebar() {
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const navigate                      = useNavigate()
  const { isDirty, clearDirty }       = useUnsavedChanges()
  const { open, toggle, setOpen }     = useSidebar()

  function goTo(path: string) {
    // Cierra el sidebar inmediatamente al seleccionar
    setOpen(false)
    if (isDirty) {
      setPendingPath(path)
      return
    }
    navigate(path)
  }

  function confirmDiscard() {
    if (!pendingPath) return
    clearDirty()
    navigate(pendingPath)
    setPendingPath(null)
  }

  return (
    <>
      {/* Botón hamburguesa — siempre visible, no forma parte del sidebar */}
      <button
        onClick={toggle}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        style={{ top: 'var(--header-h, 64px)', height: '48px' }}
        className={[
          'fixed left-0 z-40',
          'flex items-center justify-center',
          'w-10 rounded-r-xl',
          'bg-white dark:bg-warm-800 border border-l-0 border-black/10 dark:border-warm-600/30 shadow-sm',
          'hover:bg-[#F0EDE8] dark:hover:bg-warm-700 transition-colors duration-150',
        ].join(' ')}
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-warm-700)" strokeWidth="1.8" strokeLinecap="round" className="dark:stroke-warm-100">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-warm-700)" strokeWidth="1.8" strokeLinecap="round" className="dark:stroke-warm-100">
            <path d="M2 4h10M2 7h10M2 10h10" />
          </svg>
        )}
      </button>

      {/* Backdrop — cierra el sidebar al pulsar fuera, no afecta al layout */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel lateral — overlay puro, nunca desplaza el contenido */}
      <aside
        aria-label="Navegación principal de la plataforma"
        aria-hidden={!open}
        className={[
          'fixed top-0 left-0 z-40 w-64',
          'h-[calc(100vh-var(--header-h,64px))]',
          'mt-[var(--header-h,64px)]',
          'bg-white dark:bg-warm-900 border-r border-black/8 dark:border-warm-600/20 shadow-md',
          'flex flex-col overflow-hidden',
          'transition-transform duration-250 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarPanel onNav={goTo} />
      </aside>

      <UnsavedChangesModal
        open={pendingPath !== null}
        onCancel={() => setPendingPath(null)}
        onDiscard={confirmDiscard}
        message="Si cambias de herramienta ahora, los cambios en curso se perderán."
      />
    </>
  )
}

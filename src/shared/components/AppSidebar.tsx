// ============================================================
// AppSidebar — Menú lateral colapsable (responsive)
//
// Sprint 10: navegación estática T1–T12.
//   — Eliminado prop `phases` (dependía de DemoContext).
//   — La lista T1–T12 es una constante del producto, no datos
//     cargados de Supabase ni del proyecto activo.
//   — El item activo se detecta por location.pathname.
//   — Siempre visible cuando hay sesión; no depende de cargas.
//
// Responsive (Fase 2 ADR-020):
//   — >= lg (1024 px): sidebar inline, reserva w-64 en el grid.
//     El toggle desaparece; el sidebar nunca se colapsa.
//   — <  lg           : comportamiento original — fixed, backdrop,
//     toggle visible, colapsable.
// ============================================================

import { useState }                   from 'react'
import { useNavigate, useLocation }   from 'react-router-dom'
import { useMediaQuery }              from '@/shared/hooks/useMediaQuery'
import { useUnsavedChanges }          from '@/shared/hooks/useUnsavedChanges'
import { useSidebar }                 from '@/shared/hooks/useSidebar'
import { Modal, Button }              from '@shared/design-system/components'

// ── Registro estático del producto ───────────────────────────
// Fuente de verdad de la navegación. NUNCA debe depender de:
//   DemoContext, Supabase, CompanyProfileStore, ni datos cargados.

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

// ── Panel interior — compartido por ambos modos ───────────────
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
      <nav className="flex-1 overflow-y-auto py-2">

        {/* ── Perfil de Empresa — acceso global ── */}
        <button
          onClick={() => onNav('/company-profile')}
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

        {/* ── T1–T12 — lista estática del producto ── */}
        <div className="px-3 space-y-0.5">
          {TOOL_NAVIGATION.map((tool) => {
            const isActive = location.pathname === tool.path ||
                             (tool.path !== '/' && location.pathname.startsWith(tool.path))

            return (
              <button
                key={tool.code}
                onClick={() => onNav(tool.path)}
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
  const [open,         setOpen]        = useState(false)
  const [pendingPath,  setPendingPath] = useState<string | null>(null)
  const navigate        = useNavigate()
  const isLg            = useMediaQuery('(min-width: 1024px)')
  const { isDirty, clearDirty } = useUnsavedChanges()
  const { open: lgOpen, toggle: lgToggle, setOpen: lgSetOpen } = useSidebar()

  function goTo(path: string) {
    if (isDirty) {
      setPendingPath(path)
      return
    }
    navigate(path)
    setOpen(false)
    if (lgOpen) lgSetOpen(false)
  }

  function confirmDiscard() {
    if (!pendingPath) return
    clearDirty()
    navigate(pendingPath)
    setPendingPath(null)
    setOpen(false)
    if (lgOpen) lgSetOpen(false)
  }

  // ── Modo inline >= lg ────────────────────────────────────────
  if (isLg) {
    return (
      <>
        {/* Backdrop — cierra el sidebar al pulsar fuera */}
        {lgOpen && (
          <div
            className="fixed inset-0 z-20"
            onClick={lgToggle}
            aria-hidden="true"
          />
        )}

        <aside
          className={[
            'fixed top-0 left-0 z-30 w-64',
            'h-[calc(100vh-var(--header-h,57px))]',
            'mt-[var(--header-h,57px)]',
            'bg-white dark:bg-warm-900 border-r border-black/8 dark:border-warm-600/20',
            'flex flex-col overflow-hidden',
            'transition-transform duration-300 ease-in-out',
            lgOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <SidebarPanel onNav={goTo} />
        </aside>

        {/* Botón hamburguesa — solo visible cuando el sidebar está cerrado */}
        {!lgOpen && (
          <button
            onClick={lgToggle}
            aria-label="Abrir menú"
            className={[
              'fixed top-[72px] left-0 z-30',
              'flex items-center justify-center',
              'h-10 w-10 rounded-r-xl',
              'bg-white dark:bg-warm-800 border border-l-0 border-black/10 dark:border-warm-600/30 shadow-sm',
              'hover:bg-[#F0EDE8] dark:hover:bg-warm-700 transition-colors duration-150',
            ].join(' ')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3E3B35" strokeWidth="1.8" strokeLinecap="round" className="dark:stroke-warm-100">
              <path d="M2 4h10M2 7h10M2 10h10" />
            </svg>
          </button>
        )}

        <UnsavedChangesModal
          open={pendingPath !== null}
          onCancel={() => setPendingPath(null)}
          onDiscard={confirmDiscard}
        />
      </>
    )
  }

  // ── Modo overlay < lg ────────────────────────────────────────
  return (
    <>
      {/* Toggle */}
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

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel lateral */}
      <aside
        className={[
          'fixed top-0 left-0 z-30 w-64',
          'h-[calc(100vh-var(--header-h,57px))]',
          'mt-[var(--header-h,57px)]',
          'bg-white dark:bg-warm-900 border-r border-black/8 dark:border-warm-600/20 shadow-xl',
          'flex flex-col overflow-hidden',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarPanel onNav={goTo} />
      </aside>

      <UnsavedChangesModal
        open={pendingPath !== null}
        onCancel={() => setPendingPath(null)}
        onDiscard={confirmDiscard}
      />
    </>
  )
}

// ── Modal de confirmación de cambios sin guardar ──────────────
function UnsavedChangesModal({
  open, onCancel, onDiscard,
}: { open: boolean; onCancel: () => void; onDiscard: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Cambios sin guardar"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" onClick={onDiscard}>Descartar y continuar</Button>
        </div>
      }
    >
      <p className="text-sm text-text-muted">
        Tienes cambios sin guardar. ¿Deseas descartarlos y continuar navegando?
      </p>
    </Modal>
  )
}

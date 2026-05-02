// ============================================================
// AppSidebar — Menú lateral colapsable
//
// Sprint 2: usa React Router (useNavigate + useLocation)
// para navegar entre herramientas y módulos transversales.
// El toggle button es siempre visible en todas las páginas.
// ============================================================

import { useState }               from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { LeanPhase, PhaseTool } from './PhaseRoadmap'

export interface AppSidebarProps {
  phases:          LeanPhase[]
  activeToolCode?: string
}

// ── Paleta de fases (índice 0–5) ──────────────────────────────
const PHASE_COLORS = [
  '#2A2822', // f1 Listen — warm charcoal (era navy)
  '#2D6A4F', // f2 Evaluate — green dark
  '#E29B3B', // f3 Activate — amber
  '#7B5EA7', // f4 Normalize — purple
  '#C0392B', // f5 — red
  '#888888', // f6 — gray (locked)
]

// ── Mapeo tool.code → ruta ────────────────────────────────────
const TOOL_ROUTES: Record<string, string> = {
  T1: '/t1', T2: '/t2', T3: '/t3',
  T4: '/t4', T5: '/t5', T6: '/t6',
  T7: '/t7', T8: '/t8', T9: '/t9',
  T10: '/t10', T11: '/t11', T12: '/t12', T13: '/t13',
}

// ── Iconos SVG por fase ───────────────────────────────────────
function PhaseIcon({ index, size = 14 }: { index: number; size?: number }) {
  const icons = [
    <svg key={0} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="4" /><path d="M9.5 9.5L13 13" />
    </svg>,
    <svg key={1} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="3" r="1.5" /><circle cx="3" cy="11" r="1.5" /><circle cx="11" cy="11" r="1.5" />
      <path d="M7 4.5L3 9.5M7 4.5L11 9.5M3 11h8" />
    </svg>,
    <svg key={2} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.5" /><path d="M6 4.5l4 2.5-4 2.5V4.5Z" fill="currentColor" stroke="none" />
    </svg>,
    <svg key={3} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7l3 3 5-6" /><path d="M6 7l3 3 5-6" />
    </svg>,
    <svg key={4} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 12V3M3.5 6.5L7 3l3.5 3.5" />
    </svg>,
    <svg key={5} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M11.5 7A4.5 4.5 0 107 11.5" /><path d="M11.5 4.5v3h-3" />
    </svg>,
  ]
  return icons[index] ?? icons[0]
}

// ── Status dot ────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  complete:    '#22c55e',
  in_progress: '#f59e0b',
  pending:     '#d1d5db',
  blocked:     '#ef4444',
}

// ── Sidebar ────────────────────────────────────────────────────
export function AppSidebar({ phases, activeToolCode }: AppSidebarProps) {
  const [open, setOpen]              = useState(false)
  const [expandedPhase, setExpanded] = useState<string | null>(null)
  const navigate                     = useNavigate()
  const location                     = useLocation()

  function togglePhase(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

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
            Herramientas
          </span>
          <span className="text-[10px] font-mono text-black/25 dark:text-white/20">
            T1 – T13
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
              {/* Icono edificio */}
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

          {/* ── Fases + herramientas ── */}
          <div className="relative">
            {phases.map((phase, phaseIdx) => {
              const color      = PHASE_COLORS[phaseIdx] ?? '#888'
              const isExpanded = expandedPhase === phase.id
              const isLocked   = phase.status === 'locked'

              return (
                <div key={phase.id} className="relative">
                  {phaseIdx < phases.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute left-[27px] top-[38px] w-px"
                      style={{ height: 'calc(100% - 14px)', backgroundColor: color, opacity: isLocked ? 0.2 : 0.35 }}
                    />
                  )}

                  {/* Fila de fase */}
                  <button
                    onClick={() => !isLocked && togglePhase(phase.id)}
                    disabled={isLocked}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100',
                      isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black/3 dark:hover:bg-white/4 cursor-pointer',
                    ].join(' ')}
                  >
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 relative z-10"
                      style={{
                        backgroundColor: isLocked ? '#f3f4f6' : `${color}15`,
                        color,
                        border: `1.5px solid ${color}`,
                        opacity: isLocked ? 0.5 : 1,
                      }}
                    >
                      <PhaseIcon index={phaseIdx} size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: isLocked ? '#9ca3af' : '#111' }}>
                        {phase.label}
                      </p>
                      {phase.duration && (
                        <p className="text-[10px] text-black/30 dark:text-white/25 font-mono mt-0.5">
                          {phase.duration}
                        </p>
                      )}
                    </div>
                    {!isLocked && phase.tools.length > 0 && (
                      <svg
                        width="10" height="10" viewBox="0 0 10 10" fill="none"
                        stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"
                        className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <path d="M2 3.5L5 6.5 8 3.5" />
                      </svg>
                    )}
                  </button>

                  {/* Herramientas */}
                  {isExpanded && phase.tools.length > 0 && (
                    <div className="ml-10 mr-3 mb-1 space-y-0.5">
                      {phase.tools.map((tool: PhaseTool) => {
                        const toolRoute = TOOL_ROUTES[tool.code]
                        const isActive  = tool.code === activeToolCode ||
                                          (toolRoute && location.pathname === toolRoute)
                        return (
                          <button
                            key={tool.code}
                            onClick={() => toolRoute && goTo(toolRoute)}
                            className={[
                              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
                              'transition-all duration-100 text-xs',
                              isActive
                                ? 'bg-black/6 dark:bg-white/8 font-semibold'
                                : 'hover:bg-black/3 dark:hover:bg-white/4',
                            ].join(' ')}
                          >
                            <span className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: STATUS_DOT[tool.status] ?? '#d1d5db' }} />
                            <span className="font-mono text-[10px] text-black/30 dark:text-white/25 shrink-0">
                              {tool.code}
                            </span>
                            <span className="truncate text-black/70 dark:text-gray-300">{tool.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-black/6 dark:border-white/6">
          <p className="text-[10px] font-mono text-black/20 dark:text-white/15 text-center">
            L.E.A.N. AI System · Alpha Consulting
          </p>
        </div>
      </aside>
    </>
  )
}

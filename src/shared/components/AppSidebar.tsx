import { useState } from 'react'
import type { LeanPhase, PhaseTool } from './PhaseRoadmap'

// ─────────────────────────────────────────────────────────────
// AppSidebar — Menú lateral colapsable con Metro Map
//
// Agrupa las herramientas T1–T13 por fase.
// Cada fase tiene un color de acento y un icono hiperminimalista.
// Cerrado por defecto (ideal para demos: el primer impacto es
// el dashboard limpio; el sidebar se despliega como reveal).
// ─────────────────────────────────────────────────────────────

export interface AppSidebarProps {
  phases:         LeanPhase[]
  activeToolCode?: string
  onToolSelect?:  (phase: LeanPhase, tool: PhaseTool) => void
}

// ── Paleta de fases (índice 0–5) ──────────────────────────────
// Colores de acento por fase: trazo de metro
const PHASE_COLORS = [
  '#1B2A4E', // f1 Diagnóstico — navy
  '#2D6A4F', // f2 Arquitectura — green dark
  '#E29B3B', // f3 Piloto — amber
  '#7B5EA7', // f4 Validación — purple
  '#C0392B', // f5 Despliegue — red
  '#888888', // f6 Optimización — gray (locked)
]

// ── Iconos SVG hiperminimalistas por fase ─────────────────────
function PhaseIcon({ index, size = 14 }: { index: number; size?: number }) {
  const icons = [
    // 0 Diagnóstico — lupa
    <svg key={0} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="4" />
      <path d="M9.5 9.5L13 13" />
    </svg>,
    // 1 Arquitectura — nodos
    <svg key={1} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="3" r="1.5" />
      <circle cx="3" cy="11" r="1.5" />
      <circle cx="11" cy="11" r="1.5" />
      <path d="M7 4.5L3 9.5M7 4.5L11 9.5M3 11h8" />
    </svg>,
    // 2 Piloto — play
    <svg key={2} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M6 4.5l4 2.5-4 2.5V4.5Z" fill="currentColor" stroke="none" />
    </svg>,
    // 3 Validación — check doble
    <svg key={3} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7l3 3 5-6" />
      <path d="M6 7l3 3 5-6" />
    </svg>,
    // 4 Despliegue — flecha arriba
    <svg key={4} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 12V3M3.5 6.5L7 3l3.5 3.5" />
    </svg>,
    // 5 Optimización — bucle
    <svg key={5} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M11.5 7A4.5 4.5 0 107 11.5" />
      <path d="M11.5 4.5v3h-3" />
    </svg>,
  ]
  return icons[index] ?? icons[0]
}

// ── Tool status dot ────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  complete:    '#22c55e',
  in_progress: '#f59e0b',
  pending:     '#d1d5db',
  blocked:     '#ef4444',
}

// ── Sidebar ────────────────────────────────────────────────────

export function AppSidebar({ phases, activeToolCode, onToolSelect }: AppSidebarProps) {
  const [open, setOpen]           = useState(false)
  const [expandedPhase, setExpanded] = useState<string | null>(null)

  function togglePhase(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  return (
    <>
      {/* ── Toggle button — siempre visible ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú de herramientas'}
        className={[
          'fixed top-[72px] left-0 z-30',
          'flex items-center justify-center',
          'h-10 w-10 rounded-r-xl',
          'bg-white border border-l-0 border-black/10 shadow-sm',
          'hover:bg-gray-50 transition-colors duration-150',
        ].join(' ')}
      >
        {open ? (
          // X
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1B2A4E" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        ) : (
          // Hamburger / metro icon
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1B2A4E" strokeWidth="1.8" strokeLinecap="round">
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
          'w-64 bg-white border-r border-black/8 shadow-xl',
          'flex flex-col overflow-hidden',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-black/30">
            Herramientas
          </span>
          <span className="text-[10px] font-mono text-black/25">
            T1 – T13
          </span>
        </div>

        {/* Lista de fases + herramientas */}
        <nav className="flex-1 overflow-y-auto py-2">

          {/* Línea de metro vertical */}
          <div className="relative">

            {phases.map((phase, phaseIdx) => {
              const color        = PHASE_COLORS[phaseIdx] ?? '#888'
              const isExpanded   = expandedPhase === phase.id
              const isLocked     = phase.status === 'locked'

              return (
                <div key={phase.id} className="relative">

                  {/* Línea vertical de metro (conecta fases) */}
                  {phaseIdx < phases.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute left-[27px] top-[38px] w-px"
                      style={{
                        height:          'calc(100% - 14px)',
                        backgroundColor: color,
                        opacity:         isLocked ? 0.2 : 0.35,
                      }}
                    />
                  )}

                  {/* Fila de fase */}
                  <button
                    onClick={() => !isLocked && togglePhase(phase.id)}
                    disabled={isLocked}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                      'transition-colors duration-100',
                      isLocked
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-black/3 cursor-pointer',
                    ].join(' ')}
                  >
                    {/* Estación de metro */}
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 relative z-10"
                      style={{
                        backgroundColor: isLocked ? '#f3f4f6' : `${color}15`,
                        color,
                        border:          `1.5px solid ${color}`,
                        opacity:         isLocked ? 0.5 : 1,
                      }}
                    >
                      <PhaseIcon index={phaseIdx} size={12} />
                    </div>

                    {/* Label */}
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: isLocked ? '#9ca3af' : '#111' }}
                      >
                        {phase.label}
                      </p>
                      {phase.duration && (
                        <p className="text-[10px] text-black/30 font-mono mt-0.5">
                          {phase.duration}
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    {!isLocked && phase.tools.length > 0 && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <path d="M2 3.5L5 6.5 8 3.5" />
                      </svg>
                    )}
                  </button>

                  {/* Herramientas de la fase */}
                  {isExpanded && phase.tools.length > 0 && (
                    <div className="ml-10 mr-3 mb-1 space-y-0.5">
                      {phase.tools.map((tool) => {
                        const isActive = tool.code === activeToolCode
                        return (
                          <button
                            key={tool.code}
                            onClick={() => {
                              onToolSelect?.(phase, tool)
                              setOpen(false)
                            }}
                            className={[
                              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
                              'transition-all duration-100 text-xs',
                              isActive
                                ? 'bg-black/6 font-semibold'
                                : 'hover:bg-black/3',
                            ].join(' ')}
                          >
                            {/* Status dot */}
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: STATUS_DOT[tool.status] ?? '#d1d5db' }}
                            />
                            {/* Code */}
                            <span className="font-mono text-[10px] text-black/30 shrink-0">
                              {tool.code}
                            </span>
                            {/* Name */}
                            <span className="truncate text-black/70">{tool.name}</span>
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
        <div className="px-4 py-3 border-t border-black/6">
          <p className="text-[10px] font-mono text-black/20 text-center">
            L.E.A.N. AI System · Alpha Consulting
          </p>
        </div>
      </aside>
    </>
  )
}

// ============================================================
// IntervieweeSelector — Collapsible list of interviewees for T1
// ============================================================

import { useState } from 'react'
import { TOTAL_SUBDIMENSIONS } from '../constants'
import { countScoredSubdimensions } from '../types'
import type { T1DimensionState } from '../types'
import type { T1IntervieweeContext } from '../types'

interface IntervieweeSelectorProps {
  interviewees:      T1IntervieweeContext[]
  activeId:          string
  dimensionStates:   Record<string, T1DimensionState[]>
  isReadOnly:        boolean
  onSelect:          (id: string) => void
  onDelete:          (id: string) => void
}

export function IntervieweeSelector({
  interviewees,
  activeId,
  dimensionStates,
  isReadOnly,
  onSelect,
  onDelete,
}: IntervieweeSelectorProps) {
  const [showInterviewees, setShowInterviewees] = useState(false)

  const activeInterviewee = interviewees.find((i) => i.id === activeId)

  return (
    <div className="max-w-7xl mx-auto px-8 py-3">
      <div className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

        {/* Toggle bar */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => setShowInterviewees((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
              Entrevistado activo
            </span>
            <span className="px-2 py-0.5 rounded-full bg-navy/8 dark:bg-navy/15 text-[10px] font-semibold text-navy dark:text-warm-100">
              {interviewees.length} entrevistados
            </span>
            <span className="text-[10px] text-text-subtle">
              {interviewees.filter((i) => i.type === 'it').length} IT ·{' '}
              {interviewees.filter((i) => i.type !== 'it').length} BIZ
            </span>
            {activeInterviewee && (
              <span className="text-[10px] text-text-muted">
                Puntuando: <span className="font-semibold text-lean-black dark:text-gray-200">
                  {activeInterviewee.name}
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <svg
              className={`h-3.5 w-3.5 text-text-subtle transition-transform duration-200 ${showInterviewees ? 'rotate-180' : ''}`}
              viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>

        {/* Expandido: lista de entrevistados */}
        {showInterviewees && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex gap-2 flex-wrap">
              {interviewees.map((person) => {
                const personDims   = dimensionStates[person.id] ?? []
                const personScored = countScoredSubdimensions(personDims)
                const isActive     = person.id === activeId
                const isComplete   = personScored === TOTAL_SUBDIMENSIONS

                return (
                  <div
                    key={person.id}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all duration-150 group',
                      isActive
                        ? 'bg-navy-metallic text-white border-navy shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-border hover:border-navy/30 hover:bg-gray-50 dark:hover:bg-gray-800',
                    ].join(' ')}
                  >
                    {/* Selección del entrevistado */}
                    <button
                      onClick={() => onSelect(person.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <span className={[
                        'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
                        isActive
                          ? 'bg-white/20 text-white'
                          : person.type === 'it'
                            ? 'bg-navy/10 text-navy dark:bg-navy/20 dark:text-warm-100'
                            : 'bg-warning-light text-warning-dark',
                      ].join(' ')}>
                        {person.type === 'it' ? 'IT' : 'BIZ'}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-lean-black dark:text-gray-100'}`}>
                          {person.name}
                        </p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
                          {person.role}
                        </p>
                      </div>
                      <span className={`text-[10px] tabular-nums shrink-0 ${isActive ? 'text-white/70' : 'text-text-subtle'}`}>
                        {isComplete ? (
                          <svg className="h-3.5 w-3.5 text-current" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.78 5.22a.75.75 0 010 1.06l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06L7.25 9.69l3.47-3.47a.75.75 0 011.06 0z" />
                          </svg>
                        ) : (
                          `${personScored}/${TOTAL_SUBDIMENSIONS}`
                        )}
                      </span>
                    </button>

                    {/* Botón eliminar (solo si hay más de un entrevistado) */}
                    {!isReadOnly && interviewees.length > 1 && (
                      <button
                        onClick={() => onDelete(person.id)}
                        title="Eliminar entrevistado"
                        className={[
                          'shrink-0 h-5 w-5 rounded-md flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100',
                          isActive
                            ? 'hover:bg-white/20 text-white/60 hover:text-white'
                            : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-text-subtle hover:text-red-500',
                        ].join(' ')}
                      >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M1 1l10 10M11 1L1 11" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

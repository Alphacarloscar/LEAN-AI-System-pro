// ============================================================
// T5 — DeptCategoryModal
//
// Modal que muestra los proyectos de un departamento específico
// en una categoría/dominio IA concreto.
// ============================================================

import { useT3Store }             from '@/modules/T3_ValueStreamMap'
import { useT4Store }             from '@/modules/T4_UseCasePriorityBoard'
import {
  T5_DOMAIN_CONFIG,
  T5_RECOMMENDATION_CONFIG,
} from '../constants'
import type { T5DomainCode, T5Canvas } from '../types'
import { UC_STATUS_LABEL, UC_STATUS_STYLE, PHASE_LABEL } from './t5StatusMaps'

interface DeptCategoryModalProps {
  department: string
  domainCode: T5DomainCode
  canvas:     T5Canvas
  onClose:    () => void
}

export function DeptCategoryModal({
  department,
  domainCode,
  canvas,
  onClose,
}: DeptCategoryModalProps) {
  const processes  = useT3Store(s => s.processes)
  const useCases   = useT4Store(s => s.useCases)
  const domCfg     = T5_DOMAIN_CONFIG[domainCode]
  const assessment = canvas.domains[domainCode]
  const recCfg     = T5_RECOMMENDATION_CONFIG[assessment.recommendation]

  const filteredUCs   = useCases.filter(uc => uc.aiCategory === domainCode && uc.department === department)
  const filteredProcs = processes.filter(p  => p.aiCategory  === domainCode && p.department  === department)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[82vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55` }}
            >
              {domCfg.icon}
            </div>
            <div>
              <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">{department}</p>
              <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">{domCfg.label}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-lean-black dark:hover:text-gray-200 transition-colors text-lg w-7 h-7 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Quadrant / Recommendation summary */}
          <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${recCfg.badgeBg} ${recCfg.badgeText}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: recCfg.hex }} />
                {recCfg.label}
              </span>
              <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                {assessment.priorityScore}
                <span className="text-[10px] text-text-subtle font-normal">/100</span>
              </span>
            </div>
            <div className="flex gap-4">
              <span className="text-[10px] text-text-subtle">
                Valor negocio: <strong className="text-lean-black dark:text-gray-200">{assessment.scores.businessValue}</strong>
              </span>
              <span className="text-[10px] text-text-subtle">
                Madurez técnica: <strong className="text-lean-black dark:text-gray-200">{assessment.scores.technicalReady}</strong>
              </span>
              <span className="text-[10px] text-text-subtle">
                Org readiness: <strong className="text-lean-black dark:text-gray-200">{assessment.scores.orgReadiness}</strong>
              </span>
            </div>
          </div>

          {/* T4 use cases */}
          {filteredUCs.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Casos de uso — T4 ({filteredUCs.length})
              </p>
              <div className="flex flex-col gap-2">
                {filteredUCs.map(uc => {
                  const style = UC_STATUS_STYLE[uc.status] ?? UC_STATUS_STYLE.candidato
                  return (
                    <div key={uc.id} className="px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{uc.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${style.bg} ${style.text}`}>
                            {UC_STATUS_LABEL[uc.status] ?? uc.status}
                          </span>
                          <span className="text-[10px] font-bold tabular-nums text-lean-black dark:text-gray-200 w-7 text-right">
                            {uc.priorityScore}
                          </span>
                        </div>
                      </div>
                      {uc.description && (
                        <p className="text-[10px] text-text-subtle leading-relaxed mt-0.5">{uc.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* T3 processes */}
          {filteredProcs.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Procesos — T3 ({filteredProcs.length})
              </p>
              <div className="flex flex-col gap-2">
                {filteredProcs.map(p => (
                  <div key={p.id} className="px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{p.name}</p>
                      <span className="text-[10px] text-text-subtle shrink-0 capitalize">
                        {PHASE_LABEL[p.phase] ?? p.phase}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-[10px] text-text-subtle leading-relaxed mt-0.5">{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredUCs.length === 0 && filteredProcs.length === 0 && (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 mb-3">
                <svg className="w-5 h-5 text-text-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M15 15l3 3" />
                </svg>
              </div>
              <p className="text-sm text-text-muted">
                Sin proyectos en <strong>{department.split('/')[0].trim()}</strong> para este dominio.
              </p>
              <p className="text-[11px] text-text-subtle mt-1">
                Completa el diagnóstico T3 y prioriza casos de uso en T4.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

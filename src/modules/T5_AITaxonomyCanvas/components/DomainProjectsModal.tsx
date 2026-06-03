// ============================================================
// T5 — DomainProjectsModal
//
// Modal que lista los casos de uso (T4) y procesos (T3)
// asociados a un dominio IA.
// ============================================================

import { useT3Store } from '@/modules/T3_ValueStreamMap'
import { useT4Store } from '@/modules/T4_UseCasePriorityBoard'
import { T5_DOMAIN_CONFIG } from '../constants'
import type { T5DomainCode } from '../types'
import { UC_STATUS_LABEL, UC_STATUS_STYLE, PHASE_LABEL } from './t5StatusMaps'

interface DomainProjectsModalProps {
  domainCode: T5DomainCode
  onClose:    () => void
}

export function DomainProjectsModal({ domainCode, onClose }: DomainProjectsModalProps) {
  const processes = useT3Store(s => s.processes)
  const useCases  = useT4Store(s => s.useCases)
  const domCfg    = T5_DOMAIN_CONFIG[domainCode]

  const domainUCs   = useCases.filter(uc => uc.aiCategory === domainCode)
  const domainProcs = processes.filter(p  => p.aiCategory  === domainCode)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">

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
              <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Proyectos identificados</p>
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

          {/* T4 use cases */}
          {domainUCs.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Casos de uso — T4 ({domainUCs.length})
              </p>
              <div className="flex flex-col gap-2">
                {domainUCs.map(uc => {
                  const style = UC_STATUS_STYLE[uc.status] ?? UC_STATUS_STYLE.candidato
                  return (
                    <div key={uc.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{uc.name}</p>
                        <p className="text-[10px] text-text-subtle mt-0.5">{uc.department}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${style.bg} ${style.text}`}>
                          {UC_STATUS_LABEL[uc.status] ?? uc.status}
                        </span>
                        <span className="text-[10px] font-bold tabular-nums text-lean-black dark:text-gray-200 w-8 text-right">
                          {uc.priorityScore}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* T3 processes */}
          {domainProcs.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Procesos — T3 ({domainProcs.length})
              </p>
              <div className="flex flex-col gap-2">
                {domainProcs.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-text-subtle mt-0.5">{p.department}</p>
                    </div>
                    <span className="text-[10px] text-text-subtle shrink-0 capitalize">
                      {PHASE_LABEL[p.phase] ?? p.phase}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {domainUCs.length === 0 && domainProcs.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 mb-3">
                <svg className="w-5 h-5 text-text-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M15 15l3 3" />
                </svg>
              </div>
              <p className="text-sm text-text-muted">No hay proyectos identificados en este dominio todavía.</p>
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

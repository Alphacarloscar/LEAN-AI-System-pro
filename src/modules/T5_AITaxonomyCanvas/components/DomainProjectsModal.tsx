// ============================================================
// T5 — DomainProjectsModal
//
// Modal que lista los casos de uso (T4) y procesos (T3)
// asociados a un dominio IA.
// ============================================================

import { useT3Store } from '@/modules/T3_ValueStreamMap'
import { useT4Store } from '@/modules/T4_UseCasePriorityBoard'
import { T5_DOMAIN_CONFIG } from '../constants'
import { Modal, Button, Badge, Card } from '@shared/design-system/components'
import type { T5DomainCode } from '../types'
import { UC_STATUS_LABEL, UC_STATUS_VARIANT, UC_COMPLETADO_STYLE, PHASE_LABEL } from './t5StatusMaps'

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

  const footer = (
    <Button variant="ghost" size="sm" fullWidth onClick={onClose}>Cerrar</Button>
  )

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={domCfg.label}
      size="lg"
      footer={footer}
    >
      {/* Domain icon + subtitle */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55` }}
        >
          {domCfg.icon}
        </div>
        <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Proyectos identificados</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* T4 use cases */}
        {domainUCs.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
              Casos de uso — T4 ({domainUCs.length})
            </p>
            <div className="flex flex-col gap-2">
              {domainUCs.map(uc => (
                <Card
                  key={uc.id}
                  variant="flat"
                  padding="none"
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{uc.name}</p>
                    <p className="text-[10px] text-text-subtle mt-0.5">{uc.department}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={UC_STATUS_VARIANT[uc.status] ?? 'default'}
                      shape="pill"
                      size="xs"
                      style={uc.status === 'completado' ? UC_COMPLETADO_STYLE : undefined}
                    >
                      {UC_STATUS_LABEL[uc.status] ?? uc.status}
                    </Badge>
                    <span className="text-[10px] font-bold tabular-nums text-lean-black dark:text-gray-200 w-8 text-right">
                      {uc.priorityScore}
                    </span>
                  </div>
                </Card>
              ))}
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
                <Card
                  key={p.id}
                  variant="flat"
                  padding="none"
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-text-subtle mt-0.5">{p.department}</p>
                  </div>
                  <span className="text-[10px] text-text-subtle shrink-0 capitalize">
                    {PHASE_LABEL[p.phase] ?? p.phase}
                  </span>
                </Card>
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
    </Modal>
  )
}

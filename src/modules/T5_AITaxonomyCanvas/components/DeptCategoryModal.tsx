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
import { Modal, Button, Badge, Card } from '@shared/design-system/components'
import type { T5DomainCode, T5Canvas } from '../types'
import { UC_STATUS_LABEL, UC_STATUS_VARIANT, UC_COMPLETADO_STYLE, PHASE_LABEL } from './t5StatusMaps'

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
      {/* Domain icon + department subtitle */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55` }}
        >
          {domCfg.icon}
        </div>
        <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">{department}</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Quadrant / Recommendation summary */}
        <Card variant="flat" padding="none" className="rounded-xl border border-border bg-warm-50 dark:bg-warm-800/50 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Badge
              shape="pill"
              size="sm"
              style={{ backgroundColor: `${recCfg.hex}22`, color: recCfg.hex }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: recCfg.hex }} aria-hidden="true" />
              {recCfg.label}
            </Badge>
            <span className="text-xl font-bold tabular-nums text-lean-black dark:text-warm-50">
              {assessment.priorityScore}
              <span className="text-[10px] text-text-subtle font-normal">/100</span>
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] text-text-subtle">
              Valor negocio: <strong className="text-lean-black dark:text-warm-100">{assessment.scores.businessValue}</strong>
            </span>
            <span className="text-[10px] text-text-subtle">
              Madurez técnica: <strong className="text-lean-black dark:text-warm-100">{assessment.scores.technicalReady}</strong>
            </span>
            <span className="text-[10px] text-text-subtle">
              Org readiness: <strong className="text-lean-black dark:text-warm-100">{assessment.scores.orgReadiness}</strong>
            </span>
          </div>
        </Card>

        {/* T4 use cases */}
        {filteredUCs.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
              Casos de uso — T4 ({filteredUCs.length})
            </p>
            <div className="flex flex-col gap-2">
              {filteredUCs.map(uc => (
                <Card
                  key={uc.id}
                  variant="flat"
                  padding="none"
                  className="px-3 py-2.5 rounded-xl border border-border bg-warm-50 dark:bg-warm-800/50"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-xs font-medium text-lean-black dark:text-warm-100 truncate">{uc.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={UC_STATUS_VARIANT[uc.status] ?? 'default'}
                        shape="pill"
                        size="xs"
                        style={uc.status === 'completado' ? UC_COMPLETADO_STYLE : undefined}
                      >
                        {UC_STATUS_LABEL[uc.status] ?? uc.status}
                      </Badge>
                      <span className="text-[10px] font-bold tabular-nums text-lean-black dark:text-warm-100 w-7 text-right">
                        {uc.priorityScore}
                      </span>
                    </div>
                  </div>
                  {uc.description && (
                    <p className="text-[10px] text-text-subtle leading-relaxed mt-0.5">{uc.description}</p>
                  )}
                </Card>
              ))}
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
                <Card
                  key={p.id}
                  variant="flat"
                  padding="none"
                  className="px-3 py-2.5 rounded-xl border border-border bg-warm-50 dark:bg-warm-800/50"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-xs font-medium text-lean-black dark:text-warm-100 truncate">{p.name}</p>
                    <span className="text-[10px] text-text-subtle shrink-0 capitalize">
                      {PHASE_LABEL[p.phase] ?? p.phase}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-[10px] text-text-subtle leading-relaxed mt-0.5">{p.description}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredUCs.length === 0 && filteredProcs.length === 0 && (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-warm-100 dark:bg-warm-800 mb-3">
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
    </Modal>
  )
}

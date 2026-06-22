// ============================================================
// T5 — EditModal
//
// Modal para editar los scores de evaluación de un dominio IA.
// Sliders por dimensión con preview de recomendación resultante.
// ============================================================

import { Settings, Cpu, TrendingUp, MessageSquare, RefreshCw, Network } from 'lucide-react'
import { useForm }          from 'react-hook-form'
import { zodResolver }      from '@hookform/resolvers/zod'
import { usePermissions }   from '@/modules/Auth'
import { useUnsavedGuard }  from '@/shared/hooks/useUnsavedGuard'
import { Modal, Button, Badge, Card } from '@shared/design-system/components'
import {
  T5_DOMAIN_CONFIG,
  T5_RECOMMENDATION_CONFIG,
  T5_DIMENSION_CONFIG,
  computeT5Recommendation,
} from '../constants'
import { T5DomainScoresSchema }        from '@/lib/schemas/t5.schemas'
import type { T5DomainScoresFormValues } from '@/lib/schemas/t5.schemas'
import type { T5DomainCode, T5DomainScores, T5DomainAssessment } from '../types'

const DOMAIN_ICON_MAP: Record<string, React.ReactElement> = {
  settings:         <Settings      size={18} strokeWidth={1.5} />,
  cpu:              <Cpu           size={18} strokeWidth={1.5} />,
  'trending-up':    <TrendingUp    size={18} strokeWidth={1.5} />,
  'message-square': <MessageSquare size={18} strokeWidth={1.5} />,
  'refresh-cw':     <RefreshCw     size={18} strokeWidth={1.5} />,
  network:          <Network       size={18} strokeWidth={1.5} />,
}

interface EditModalProps {
  domainCode: T5DomainCode
  assessment: T5DomainAssessment
  onSave:     (scores: T5DomainScores) => void
  onCancel:   () => void
}

export function EditModal({ domainCode, assessment, onSave, onCancel }: EditModalProps) {
  const { isReadOnly } = usePermissions()

  const { register, handleSubmit, watch, formState } = useForm<T5DomainScoresFormValues>({
    resolver:      zodResolver(T5DomainScoresSchema),
    defaultValues: { ...assessment.scores },
  })

  useUnsavedGuard(formState.isDirty, 'T5_EditModal')

  const scores = watch()
  const rec    = computeT5Recommendation(scores as T5DomainScores)
  const recCfg = T5_RECOMMENDATION_CONFIG[rec]
  const domCfg = T5_DOMAIN_CONFIG[domainCode]

  const footer = (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
      {!isReadOnly && (
        <Button type="submit" form="t5-edit-modal-form" variant="primary" size="sm">
          Guardar evaluación
        </Button>
      )}
    </div>
  )

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={domCfg.label}
      size="lg"
      footer={footer}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55`, color: domCfg.hex }}
        >
          {DOMAIN_ICON_MAP[domCfg.icon] ?? <Settings size={18} strokeWidth={1.5} />}
        </div>
        <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Editar evaluación</p>
      </div>

      <form id="t5-edit-modal-form" onSubmit={handleSubmit(onSave)}>
        {/* Sliders */}
        <div className="flex flex-col gap-5 mb-5">
          {(Object.entries(T5_DIMENSION_CONFIG) as Array<[keyof T5DomainScores, (typeof T5_DIMENSION_CONFIG)[keyof T5DomainScores]]>).map(([key, cfg]) => {
            const val    = scores[key] ?? 0
            const lblIdx = Math.min(4, Math.floor(val / 20))
            return (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-semibold text-lean-black dark:text-gray-200">{cfg.label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: cfg.hex }}>
                    {val} — {cfg.scaleLabels[lblIdx]}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  className="w-full cursor-pointer"
                  style={{ accentColor: cfg.hex }}
                  {...register(key, { valueAsNumber: true })}
                />
                <p className="text-[9px] text-text-subtle mt-1">{cfg.description}</p>
              </div>
            )
          })}
        </div>
      </form>

      {/* Preview */}
      <Card variant="flat" padding="none" className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5">
        <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-1.5">
          Recomendación resultante
        </p>
        <Badge
          shape="pill"
          size="sm"
          style={{ backgroundColor: `${recCfg.hex}22`, color: recCfg.hex }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: recCfg.hex }} aria-hidden="true" />
          {recCfg.label}
        </Badge>
      </Card>
    </Modal>
  )
}

// ============================================================
// T5 — EditModal
//
// Modal para editar los scores de evaluación de un dominio IA.
// Sliders por dimensión con preview de recomendación resultante.
// ============================================================

import { useState }      from 'react'
import { usePermissions }  from '@/modules/Auth'
import { Modal, Button, Badge, Card } from '@shared/design-system/components'
import {
  T5_DOMAIN_CONFIG,
  T5_RECOMMENDATION_CONFIG,
  T5_DIMENSION_CONFIG,
  computeT5Recommendation,
} from '../constants'
import type { T5DomainCode, T5DomainScores, T5DomainAssessment } from '../types'

interface EditModalProps {
  domainCode: T5DomainCode
  assessment: T5DomainAssessment
  onSave:     (scores: T5DomainScores) => void
  onCancel:   () => void
}

export function EditModal({ domainCode, assessment, onSave, onCancel }: EditModalProps) {
  const { isReadOnly } = usePermissions()
  const [scores, setScores] = useState<T5DomainScores>({ ...assessment.scores })
  const domCfg = T5_DOMAIN_CONFIG[domainCode]
  const rec    = computeT5Recommendation(scores)
  const recCfg = T5_RECOMMENDATION_CONFIG[rec]

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
      {!isReadOnly && (
        <Button variant="primary" size="sm" onClick={() => onSave(scores)}>
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
        <span className="text-xl">{domCfg.icon}</span>
        <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Editar evaluación</p>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-5 mb-5">
        {(Object.entries(T5_DIMENSION_CONFIG) as Array<[keyof T5DomainScores, (typeof T5_DIMENSION_CONFIG)[keyof T5DomainScores]]>).map(([key, cfg]) => {
          const val    = scores[key]
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
                value={val}
                onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full cursor-pointer"
                style={{ accentColor: cfg.hex }}
              />
              <p className="text-[9px] text-text-subtle mt-1">{cfg.description}</p>
            </div>
          )
        })}
      </div>

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

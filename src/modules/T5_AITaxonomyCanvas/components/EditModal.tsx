// ============================================================
// T5 — EditModal
//
// Modal para editar los scores de evaluación de un dominio IA.
// Sliders por dimensión con preview de recomendación resultante.
// ============================================================

import { useState }      from 'react'
import { usePermissions }  from '@/modules/Auth'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xl">{domCfg.icon}</span>
            <div>
              <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Editar evaluación</p>
              <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">{domCfg.label}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-text-subtle hover:text-lean-black dark:hover:text-gray-200 transition-colors text-lg w-7 h-7 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Sliders */}
        <div className="px-6 py-5 flex flex-col gap-5">
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
        <div className="mx-6 mb-4 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5">
          <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-1.5">
            Recomendación resultante
          </p>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${recCfg.badgeBg} ${recCfg.badgeText}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: recCfg.hex }} />
            {recCfg.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          {!isReadOnly && (
            <button
              onClick={() => onSave(scores)}
              className="px-4 py-2 rounded-xl bg-navy-metallic text-white text-sm font-medium hover:bg-navy-metallic-hover transition-colors shadow-sm"
            >
              Guardar evaluación
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

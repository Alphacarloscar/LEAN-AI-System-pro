// ============================================================
// ControlCard — Expandable control card for T12View
// ============================================================

import { useState } from 'react'
import { T12_STATUS_CONFIG, T12_CLAUSE_CONFIG } from '../constants'
import type { T12Control, T12Status } from '../types'
import { Card } from '@shared/design-system/components'
import { usePermissions } from '@/modules/Auth'

// ── StatusBadge ───────────────────────────────────────────────

export function StatusBadge({ status }: { status: T12Status }) {
  const cfg = T12_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      <span>{cfg.dot}</span>
      {cfg.label}
    </span>
  )
}

// ── ControlCard ───────────────────────────────────────────────

interface ControlCardProps {
  control:       T12Control
  forceExpanded: boolean
  onUpdate:      (id: string, patch: Partial<Pick<T12Control, 'status' | 'evidence' | 'reviewNote'>>) => void
}

export function ControlCard({ control, forceExpanded, onUpdate }: ControlCardProps) {
  const { isReadOnly } = usePermissions()
  const [localExpanded, setLocalExpanded] = useState(false)
  const expanded = forceExpanded || localExpanded

  const cfg       = T12_STATUS_CONFIG[control.status]
  const clauseCfg = T12_CLAUSE_CONFIG[control.clause]
  const nextCfg   = control.status !== 'aprobado' ? T12_STATUS_CONFIG[cfg.next!] : null

  return (
    <Card
      variant="outlined"
      padding="none"
      className={[
        'rounded-xl transition-all duration-200',
        expanded ? 'shadow-sm' : 'hover:border-border-hover',
      ].join(' ')}
    >
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        onClick={() => setLocalExpanded((v) => !v)}
      >
        <span
          className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shrink-0"
          style={{ backgroundColor: clauseCfg.hex }}
        >
          {control.code}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-lean-black dark:text-warm-50 leading-snug">
              {control.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {control.importedFromT6 && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-warm-100 dark:bg-warm-700/60 text-gold dark:text-gold border border-warm-200 dark:border-warm-600">
                  T6
                </span>
              )}
              <StatusBadge status={control.status} />
              <svg
                className={`h-3 w-3 text-text-subtle transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </div>
          </div>
          {!expanded && control.evidence && (
            <p className="text-[10px] text-text-subtle mt-1 italic line-clamp-1">
              {control.evidence}
            </p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-4 py-4 space-y-4">
          <p className="text-[11px] text-text-muted leading-relaxed">{control.description}</p>

          <div>
            <label className="block text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
              Evidencia / Notas del consultor
            </label>
            <textarea
              value={control.evidence}
              onChange={(e) => onUpdate(control.id, { evidence: e.target.value })}
              aria-label={`Evidencia del control ${control.code}`}
              placeholder="Documenta aquí la evidencia de implementación, referencias a documentos, responsables, fechas…"
              rows={3}
              className="w-full text-[11px] text-lean-black dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-border rounded-lg px-3 py-2 placeholder:text-text-subtle resize-none focus:outline-none focus:ring-1 focus:ring-navy/30"
            />
          </div>

          {(control.status === 'pendiente_revision' || control.status === 'aprobado') && (
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
                {control.status === 'aprobado' ? 'Nota del revisor' : 'Nota para el revisor (opcional)'}
              </label>
              <textarea
                value={control.reviewNote}
                onChange={(e) => onUpdate(control.id, { reviewNote: e.target.value })}
                aria-label={`Nota del revisor para el control ${control.code}`}
                placeholder="Observaciones para el revisor o notas de la aprobación…"
                rows={2}
                className="w-full text-[11px] text-lean-black dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-border rounded-lg px-3 py-2 placeholder:text-text-subtle resize-none focus:outline-none focus:ring-1 focus:ring-navy/30"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div>
              {!isReadOnly && control.status !== 'no_iniciado' && (
                <button
                  onClick={() => {
                    const order: T12Status[] = ['no_iniciado', 'en_progreso', 'pendiente_revision', 'aprobado']
                    const idx = order.indexOf(control.status)
                    if (idx > 0) onUpdate(control.id, { status: order[idx - 1] })
                  }}
                  className="text-[10px] text-text-subtle hover:text-text-muted transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ← Retroceder
                </button>
              )}
            </div>

            {!isReadOnly && cfg.next && nextCfg && (
              <button
                onClick={() => onUpdate(control.id, { status: cfg.next as T12Status })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                style={{ backgroundColor: nextCfg.hex }}
              >
                {cfg.nextLabel}
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 6h8M6 2l4 4-4 4" />
                </svg>
              </button>
            )}

            {control.status === 'aprobado' && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-success-dark dark:text-green-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 4L6 11l-3-3" />
                </svg>
                Control aprobado
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

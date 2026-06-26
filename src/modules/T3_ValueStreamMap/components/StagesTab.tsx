// ============================================================
// T3 — Etapas del proceso (VSM swimlane)
//
// Visualiza las etapas del proceso seleccionado como un
// swimlane horizontal:
//   • KPI strip: eficiencia de flujo, ciclo total, valor
//     añadido y handoffs totales.
//   • Cards por etapa: nombre, responsable, sistema,
//     tiempos (proc + espera), barra proporcional.
//   • Color por valueContribution (alta/media/baja/nula).
//   • Marcador de cuello de botella (Flame icon — mayor waitTime).
//   • Modal add/edit/delete de etapas.
// ============================================================

import { useState } from 'react'
import { User, Settings, Flame } from 'lucide-react'
import { Button, Card } from '@shared/design-system/components'
import { T3_VALUE_BAR_COLORS } from '@shared/design-system/charts/chartTokens'
import type { ProcessStage } from '../types'
import { StageModal } from './StageModal'

// ── Paleta de valor ──────────────────────────────────────────

const VALUE_CONFIG = {
  alta:  { label: 'Valor alto',  barColor: T3_VALUE_BAR_COLORS.alta,  chipBg: 'bg-success-light',  chipText: 'text-success-dark'  },
  media: { label: 'Valor medio', barColor: T3_VALUE_BAR_COLORS.media, chipBg: 'bg-info-light',     chipText: 'text-info-dark'     },
  baja:  { label: 'Valor bajo',  barColor: T3_VALUE_BAR_COLORS.baja,  chipBg: 'bg-warning-light',  chipText: 'text-warning-dark'  },
  nula:  { label: 'Sin valor',   barColor: T3_VALUE_BAR_COLORS.nula,  chipBg: 'bg-danger-light',   chipText: 'text-danger-dark'   },
} as const

// ── Helpers ───────────────────────────────────────────────────

function fmtHours(h: number): string {
  if (h === 0)    return '0h'
  if (h < 1)      return `${Math.round(h * 60)}min`
  if (h % 1 === 0) return `${h}h`
  return `${h.toFixed(1)}h`
}

// ── StagesTab ─────────────────────────────────────────────────

interface StagesTabProps {
  processId: string
  stages:    ProcessStage[]
}

export function StagesTab({ processId, stages }: StagesTabProps) {
  const [modalStage, setModalStage] = useState<ProcessStage | 'new' | null>(null)

  // ── KPI computations ──────────────────────────────────────────
  const totalProc      = stages.reduce((s, st) => s + st.procTimeHours, 0)
  const totalWait      = stages.reduce((s, st) => s + st.waitTimeHours, 0)
  const totalCycle     = totalProc + totalWait
  const flowEff        = totalCycle > 0 ? (totalProc / totalCycle) * 100 : 0
  const valueAddedTime = stages
    .filter((st) => st.valueContribution === 'alta')
    .reduce((s, st) => s + st.procTimeHours, 0)
  const totalHandoffs  = stages.reduce((s, st) => s + st.handoffs, 0)

  const bottleneckId = stages.length > 0 && stages.some((s) => s.waitTimeHours > 0)
    ? stages.reduce((prev, curr) =>
        curr.waitTimeHours > prev.waitTimeHours ? curr : prev
      ).id
    : null

  const effColor =
    flowEff >= 30 ? 'text-success-dark' :
    flowEff >= 15 ? 'text-warning-dark' :
                    'text-danger-dark'

  // ── Empty state ───────────────────────────────────────────────
  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="h-14 w-14 rounded-xl bg-navy/5 dark:bg-navy/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-text-subtle"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="1" /></svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-lean-black dark:text-warm-50 mb-1">
            Sin etapas definidas
          </p>
          <p className="text-xs text-text-muted max-w-sm leading-relaxed">
            Mapea las etapas del proceso para visualizar el Value Stream, detectar cuellos
            de botella y calcular la eficiencia de flujo.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalStage('new')}>
          + Añadir primera etapa
        </Button>
        {modalStage === 'new' && (
          <StageModal processId={processId} onClose={() => setModalStage(null)} />
        )}
      </div>
    )
  }

  const bottleneck = bottleneckId
    ? stages.find((s) => s.id === bottleneckId) ?? null
    : null
  const bnWaitRatio = bottleneck && totalCycle > 0
    ? (bottleneck.waitTimeHours / totalCycle) * 100
    : 0

  return (
    <>
      {/* ── KPI strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

        <Card variant="outlined" padding="none" className="rounded-xl px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            Eficiencia de flujo
          </p>
          <p className={`text-2xl font-bold tabular-nums leading-none ${effColor}`}>
            {flowEff.toFixed(1)}
            <span className="text-sm font-normal text-text-subtle">%</span>
          </p>
          <p className="text-[10px] text-text-muted mt-1">Tiempo útil / ciclo total</p>
        </Card>

        <Card variant="outlined" padding="none" className="rounded-xl px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
            Ciclo total
          </p>
          <p className="text-2xl font-bold text-lean-black dark:text-warm-50 tabular-nums leading-none">
            {fmtHours(totalCycle)}
          </p>
          <p className="text-[10px] text-text-muted mt-1">Proceso + espera acumulados</p>
        </Card>

        <Card variant="outlined" padding="none" className="rounded-xl px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
            Tiempo valor añadido
          </p>
          <p className="text-2xl font-bold text-lean-black dark:text-warm-50 tabular-nums leading-none">
            {fmtHours(valueAddedTime)}
          </p>
          <p className="text-[10px] text-text-muted mt-1">Etapas de valor alto</p>
        </Card>

        <Card variant="outlined" padding="none" className="rounded-xl px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
            Handoffs totales
          </p>
          <p className="text-2xl font-bold text-lean-black dark:text-warm-50 tabular-nums leading-none">
            {totalHandoffs}
          </p>
          <p className="text-[10px] text-text-muted mt-1">Transferencias entre pasos</p>
        </Card>
      </div>

      {/* ── Header swimlane ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
          Mapa de etapas — {stages.length} etapa{stages.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-text-subtle">
            <span className="inline-block w-3 h-1.5 rounded-sm bg-info-dark" />
            Proceso
          </span>
          <span className="flex items-center gap-1 text-[10px] text-text-subtle">
            <span className="inline-block w-3 h-1.5 rounded-sm bg-warm-200 dark:bg-warm-700" />
            Espera
          </span>
          <Button variant="primary" size="sm" onClick={() => setModalStage('new')}>
            + Etapa
          </Button>
        </div>
      </div>

      {/* ── Swimlane ──────────────────────────────────────────── */}
      <div className="overflow-x-auto pb-3">
        <div className="flex items-stretch gap-0 min-w-max">
          {stages.map((stage, idx) => {
            const cfg          = VALUE_CONFIG[stage.valueContribution]
            const stageTotal   = stage.procTimeHours + stage.waitTimeHours
            const procPct      = stageTotal > 0
              ? (stage.procTimeHours / stageTotal) * 100
              : 50
            const isBottleneck = stage.id === bottleneckId
            const widthPx = Math.max(
              180,
              Math.round((stageTotal / Math.max(totalCycle, 1)) * 900)
            )

            return (
              <div key={stage.id} className="flex items-stretch">
                <div
                  style={{ width: `${widthPx}px` }}
                  onClick={() => setModalStage(stage)}
                  className="relative flex flex-col rounded-xl border border-border dark:border-white/6
                    bg-white dark:bg-warm-900 overflow-hidden cursor-pointer
                    hover:border-navy/30 hover:shadow-sm transition-all"
                >
                  <div className="h-1.5 w-full shrink-0" style={{ background: cfg.barColor }} />

                  <div className="flex flex-col flex-1 p-3 gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <span className="text-[9px] font-mono text-text-muted shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-semibold text-lean-black dark:text-warm-50 leading-tight line-clamp-2">
                          {stage.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isBottleneck && (
                          <Flame size={16} strokeWidth={1.5} aria-label="Cuello de botella — mayor tiempo de espera" className="text-danger-dark shrink-0" />
                        )}
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${cfg.chipBg} ${cfg.chipText}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {(stage.responsible || stage.system) && (
                      <div className="space-y-0.5">
                        {stage.responsible && (
                          <p className="text-[10px] text-text-muted truncate leading-none flex items-center gap-1 min-w-0">
                            <User size={10} strokeWidth={1.5} className="shrink-0" />
                            <span className="truncate">{stage.responsible}</span>
                          </p>
                        )}
                        {stage.system && (
                          <p className="text-[10px] text-text-muted truncate leading-none flex items-center gap-1 min-w-0">
                            <Settings size={10} strokeWidth={1.5} className="shrink-0" />
                            <span className="truncate">{stage.system}</span>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-auto space-y-1.5">
                      <div className="flex items-center gap-3 text-[10px] text-text-subtle">
                        <span>
                          <span className="font-semibold text-lean-black dark:text-warm-100">
                            {fmtHours(stage.procTimeHours)}
                          </span>
                          {' '}proc
                        </span>
                        <span>
                          <span className={`font-semibold ${isBottleneck ? 'text-danger-dark' : 'text-lean-black dark:text-warm-100'}`}>
                            {fmtHours(stage.waitTimeHours)}
                          </span>
                          {' '}espera
                        </span>
                        <span>
                          <span className="font-semibold text-lean-black dark:text-warm-100">
                            {stage.handoffs}
                          </span>
                          {' '}HO
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-warm-100 dark:bg-warm-700 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${procPct}%`, background: cfg.barColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {idx < stages.length - 1 && (
                  <div className="flex items-center px-1 text-warm-300 dark:text-warm-600 shrink-0">
                    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                      <path d="M1 8h14M11 2l6 6-6 6"
                        stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottleneck callout ─────────────────────────────────── */}
      {bottleneck && bottleneck.waitTimeHours > 0 && (
        <div className="mt-4 rounded-xl bg-danger-light border border-danger-light dark:border-danger/20 px-4 py-3 flex items-start gap-3">
          <Flame size={20} strokeWidth={1.5} className="text-danger-dark shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-danger-dark mb-0.5">
              Cuello de botella detectado — {bottleneck.name}
            </p>
            <p className="text-[11px] text-danger-dark/80 leading-relaxed">
              {fmtHours(bottleneck.waitTimeHours)} de espera
              ({bnWaitRatio.toFixed(0)}% del ciclo total).
              {bottleneck.responsible && ` Responsable: ${bottleneck.responsible}.`}
              {' '}Prioridad de automatización IA.
            </p>
          </div>
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────── */}
      {modalStage !== null && (
        <StageModal
          processId={processId}
          stage={modalStage === 'new' ? undefined : modalStage}
          onClose={() => setModalStage(null)}
        />
      )}
    </>
  )
}

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
//   • Marcador de cuello de botella (🔥 — mayor waitTime).
//   • Modal add/edit/delete de etapas.
//
// Sprint 3: datos en Zustand. Sprint 4: migrar a Supabase.
// ============================================================

import { useState } from 'react'
import { useT3Store } from '../store'
import type { ProcessStage } from '../types'

// ── Paleta de valor ──────────────────────────────────────────

const VALUE_CONFIG = {
  alta:  { label: 'Valor alto',  barColor: '#5FAF8A', chipBg: 'bg-success-light',  chipText: 'text-success-dark'  },
  media: { label: 'Valor medio', barColor: '#6A90C0', chipBg: 'bg-info-light',     chipText: 'text-info-dark'     },
  baja:  { label: 'Valor bajo',  barColor: '#D4A85C', chipBg: 'bg-warning-light',  chipText: 'text-warning-dark'  },
  nula:  { label: 'Sin valor',   barColor: '#C06060', chipBg: 'bg-danger-light',   chipText: 'text-danger-dark'   },
} as const

// ── Helpers ───────────────────────────────────────────────────

function fmtHours(h: number): string {
  if (h === 0)    return '0h'
  if (h < 1)      return `${Math.round(h * 60)}min`
  if (h % 1 === 0) return `${h}h`
  return `${h.toFixed(1)}h`
}

// ── Stage modal ───────────────────────────────────────────────

const EMPTY_FORM = {
  name:              '',
  responsible:       '',
  department:        '',
  system:            '',
  procTimeHours:     0.5,
  waitTimeHours:     1,
  handoffs:          0,
  valueContribution: 'media' as ProcessStage['valueContribution'],
  notes:             '',
}

interface StageModalProps {
  processId: string
  stage?:    ProcessStage   // undefined = add mode
  onClose:   () => void
}

function StageModal({ processId, stage, onClose }: StageModalProps) {
  const { addStage, updateStage, removeStage } = useT3Store()

  const [form, setForm] = useState(
    stage
      ? {
          name:              stage.name,
          responsible:       stage.responsible       ?? '',
          department:        stage.department        ?? '',
          system:            stage.system            ?? '',
          procTimeHours:     stage.procTimeHours,
          waitTimeHours:     stage.waitTimeHours,
          handoffs:          stage.handoffs,
          valueContribution: stage.valueContribution,
          notes:             stage.notes             ?? '',
        }
      : { ...EMPTY_FORM }
  )

  const isEdit = !!stage
  const setF   = (k: keyof typeof form, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }))

  function handleSave() {
    if (!form.name.trim()) return
    const payload = {
      name:              form.name.trim(),
      responsible:       form.responsible  || undefined,
      department:        form.department   || undefined,
      system:            form.system       || undefined,
      procTimeHours:     Number(form.procTimeHours),
      waitTimeHours:     Number(form.waitTimeHours),
      handoffs:          Number(form.handoffs),
      valueContribution: form.valueContribution,
      notes:             form.notes        || undefined,
    }
    if (isEdit) updateStage(processId, stage!.id, payload)
    else        addStage(processId, payload)
    onClose()
  }

  function handleDelete() {
    if (!stage) return
    removeStage(processId, stage.id)
    onClose()
  }

  const inputCls =
    'w-full rounded-xl border border-border dark:border-white/10 bg-white dark:bg-gray-800 ' +
    'px-3 py-2 text-sm text-lean-black dark:text-gray-100 ' +
    'focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/50 transition-colors'

  const labelCls =
    'block text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4
        border border-border dark:border-white/10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-border dark:border-white/6">
          <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">
            {isEdit ? 'Editar etapa' : 'Añadir etapa'}
          </h3>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-text-subtle
              hover:text-text-default hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Nombre */}
          <div>
            <label className={labelCls}>Nombre de la etapa *</label>
            <input
              value={form.name}
              onChange={(e) => setF('name', e.target.value)}
              placeholder="Ej: Clasificación y routing"
              className={inputCls}
            />
          </div>

          {/* Responsable + Departamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Responsable</label>
              <input
                value={form.responsible}
                onChange={(e) => setF('responsible', e.target.value)}
                placeholder="Ej: Técnico L1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Departamento</label>
              <input
                value={form.department}
                onChange={(e) => setF('department', e.target.value)}
                placeholder="Ej: IT"
                className={inputCls}
              />
            </div>
          </div>

          {/* Sistema */}
          <div>
            <label className={labelCls}>Sistema / Herramienta</label>
            <input
              value={form.system}
              onChange={(e) => setF('system', e.target.value)}
              placeholder="Ej: ServiceDesk Pro, SAP, Excel"
              className={inputCls}
            />
          </div>

          {/* Tiempos + Handoffs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Tiempo proceso (h)</label>
              <input
                type="number" min="0" step="0.25"
                value={form.procTimeHours}
                onChange={(e) => setF('procTimeHours', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tiempo espera (h)</label>
              <input
                type="number" min="0" step="0.25"
                value={form.waitTimeHours}
                onChange={(e) => setF('waitTimeHours', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Handoffs</label>
              <input
                type="number" min="0" step="1"
                value={form.handoffs}
                onChange={(e) => setF('handoffs', parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Contribución de valor */}
          <div>
            <label className={labelCls}>Contribución de valor</label>
            <div className="grid grid-cols-2 gap-2">
              {(['alta', 'media', 'baja', 'nula'] as const).map((v) => {
                const cfg     = VALUE_CONFIG[v]
                const selected = form.valueContribution === v
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setF('valueContribution', v)}
                    className={[
                      'px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                      selected
                        ? `${cfg.chipBg} ${cfg.chipText} border-transparent ring-2 ring-offset-1 ring-gray-300`
                        : 'border-border dark:border-white/10 text-text-muted hover:border-gray-300',
                    ].join(' ')}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className={labelCls}>Notas (opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setF('notes', e.target.value)}
              rows={2}
              placeholder="Observaciones, mejoras potenciales..."
              className={inputCls + ' resize-none'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4
          border-t border-border dark:border-white/6">
          {isEdit ? (
            <button
              onClick={handleDelete}
              className="text-xs text-danger-dark hover:underline font-medium"
            >
              Eliminar etapa
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-text-muted
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-navy text-white
                hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isEdit ? 'Guardar cambios' : 'Añadir etapa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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

  // Bottleneck: stage with max waitTimeHours (only relevant if > 0)
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
        <div className="h-14 w-14 rounded-3xl bg-navy/5 dark:bg-navy/10 flex items-center
          justify-center text-2xl">
          ◎
        </div>
        <div>
          <p className="text-sm font-semibold text-lean-black dark:text-gray-100 mb-1">
            Sin etapas definidas
          </p>
          <p className="text-xs text-text-muted max-w-sm leading-relaxed">
            Mapea las etapas del proceso para visualizar el Value Stream, detectar cuellos
            de botella y calcular la eficiencia de flujo.
          </p>
        </div>
        <button
          onClick={() => setModalStage('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white
            text-xs font-medium hover:bg-navy/90 transition-colors"
        >
          + Añadir primera etapa
        </button>

        {modalStage === 'new' && (
          <StageModal processId={processId} onClose={() => setModalStage(null)} />
        )}
      </div>
    )
  }

  // ── Bottleneck data ───────────────────────────────────────────
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

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50
          border border-border dark:border-white/6 px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            Eficiencia de flujo
          </p>
          <p className={`text-2xl font-bold tabular-nums leading-none ${effColor}`}>
            {flowEff.toFixed(1)}
            <span className="text-sm font-normal text-text-subtle">%</span>
          </p>
          <p className="text-[10px] text-text-subtle mt-1">Tiempo útil / ciclo total</p>
        </div>

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50
          border border-border dark:border-white/6 px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            Ciclo total
          </p>
          <p className="text-2xl font-bold text-lean-black dark:text-gray-100 tabular-nums leading-none">
            {fmtHours(totalCycle)}
          </p>
          <p className="text-[10px] text-text-subtle mt-1">Proceso + espera acumulados</p>
        </div>

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50
          border border-border dark:border-white/6 px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            Tiempo valor añadido
          </p>
          <p className="text-2xl font-bold text-lean-black dark:text-gray-100 tabular-nums leading-none">
            {fmtHours(valueAddedTime)}
          </p>
          <p className="text-[10px] text-text-subtle mt-1">Etapas de valor alto</p>
        </div>

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50
          border border-border dark:border-white/6 px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            Handoffs totales
          </p>
          <p className="text-2xl font-bold text-lean-black dark:text-gray-100 tabular-nums leading-none">
            {totalHandoffs}
          </p>
          <p className="text-[10px] text-text-subtle mt-1">Transferencias entre pasos</p>
        </div>
      </div>

      {/* ── Header swimlane ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Mapa de etapas — {stages.length} etapa{stages.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-text-subtle">
            <span className="inline-block w-3 h-1.5 rounded-sm bg-[#6A90C0]" />
            Proceso
          </span>
          <span className="flex items-center gap-1 text-[10px] text-text-subtle">
            <span className="inline-block w-3 h-1.5 rounded-sm bg-gray-200 dark:bg-gray-700" />
            Espera
          </span>
          <button
            onClick={() => setModalStage('new')}
            className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-navy text-white text-[10px] font-medium hover:bg-navy/90 transition-colors"
          >
            + Etapa
          </button>
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

            // Width proportional to share of total cycle, min 180px
            const widthPx = Math.max(
              180,
              Math.round((stageTotal / Math.max(totalCycle, 1)) * 900)
            )

            return (
              <div key={stage.id} className="flex items-stretch">

                {/* Stage card */}
                <div
                  style={{ width: `${widthPx}px` }}
                  onClick={() => setModalStage(stage)}
                  className="relative flex flex-col rounded-2xl border border-border dark:border-white/6
                    bg-white dark:bg-gray-900 overflow-hidden cursor-pointer
                    hover:border-navy/30 hover:shadow-sm transition-all"
                >
                  {/* Top color band */}
                  <div className="h-1.5 w-full shrink-0" style={{ background: cfg.barColor }} />

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-3 gap-2">

                    {/* Stage number + name + badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <span className="text-[9px] font-mono text-text-subtle shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-semibold text-lean-black dark:text-gray-100
                          leading-tight break-words">
                          {stage.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isBottleneck && (
                          <span title="Cuello de botella — mayor tiempo de espera"
                            className="text-sm leading-none">🔥</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold
                          ${cfg.chipBg} ${cfg.chipText}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Responsible + System */}
                    {(stage.responsible || stage.system) && (
                      <div className="space-y-0.5">
                        {stage.responsible && (
                          <p className="text-[10px] text-text-muted truncate leading-none">
                            👤 {stage.responsible}
                          </p>
                        )}
                        {stage.system && (
                          <p className="text-[10px] text-text-subtle truncate leading-none">
                            ⚙ {stage.system}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Stats + bar — pushed to bottom */}
                    <div className="mt-auto space-y-1.5">
                      <div className="flex items-center gap-3 text-[10px] text-text-subtle">
                        <span>
                          <span className="font-semibold text-lean-black dark:text-gray-200">
                            {fmtHours(stage.procTimeHours)}
                          </span>
                          {' '}proc
                        </span>
                        <span>
                          <span className={`font-semibold ${isBottleneck
                            ? 'text-danger-dark'
                            : 'text-lean-black dark:text-gray-200'}`}>
                            {fmtHours(stage.waitTimeHours)}
                          </span>
                          {' '}espera
                        </span>
                        <span>
                          <span className="font-semibold text-lean-black dark:text-gray-200">
                            {stage.handoffs}
                          </span>
                          {' '}HO
                        </span>
                      </div>
                      {/* Proportional bar: proc (color) + wait (gray) */}
                      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${procPct}%`, background: cfg.barColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow connector between cards */}
                {idx < stages.length - 1 && (
                  <div className="flex items-center px-1 text-gray-300 dark:text-gray-600 shrink-0">
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
        <div className="mt-4 rounded-2xl bg-danger-light border border-red-100
          dark:border-red-900/20 px-4 py-3 flex items-start gap-3">
          <span className="text-lg shrink-0 leading-none mt-0.5">🔥</span>
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

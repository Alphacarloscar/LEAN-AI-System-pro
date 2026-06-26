// ============================================================
// T4 — ImportFromT3Modal
//
// Lista los procesos del store de T3 y permite seleccionar
// cuáles importar como candidatos en T4.
//
// Pre-rellena en cada caso de uso importado:
//   - name, department, aiCategory  →  del proceso T3
//   - importedFromT3               →  referencia al proceso origen
//   - kpiImpact                    →  opportunityScore T3 * 1.25, clamped 1-5
//   - feasibility / aiRisk / dataDependency → 3 (neutral, para workshop)
//   - status                       → 'candidato'
//
// Procesos ya importados se muestran como deshabilitados.
// ============================================================

import { useState }                                      from 'react'
import { Check }                                         from 'lucide-react'
import { useT3Store }                                    from '../../T3_ValueStreamMap/store'
import { useT4Store }                                    from '../store'
import { AI_CATEGORY_CONFIG }                            from '../../T3_ValueStreamMap/constants'
import { computePriorityScore, T3_HOURS_FROM_ANSWER }   from '../constants'
import { Modal, Button, Badge }                          from '@shared/design-system/components'
import type { UseCase, UseCaseEconomics }                from '../types'

interface ImportFromT3ModalProps {
  onClose: () => void
}

export function ImportFromT3Modal({ onClose }: ImportFromT3ModalProps) {
  const { processes }              = useT3Store()
  const { useCases, addUseCase }   = useT4Store()
  const [selected, setSelected]    = useState<Set<string>>(new Set())
  const [importing, setImporting]  = useState(false)
  const [done, setDone]            = useState(false)

  // IDs de procesos T3 ya importados
  const alreadyImported = new Set(
    useCases
      .filter((uc) => uc.importedFromT3)
      .map((uc) => uc.importedFromT3!.processId)
  )

  function toggle(processId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(processId)) next.delete(processId)
      else next.add(processId)
      return next
    })
  }

  function selectAll() {
    const available = processes.filter((p) => !alreadyImported.has(p.id)).map((p) => p.id)
    setSelected(new Set(available))
  }

  function clearAll() {
    setSelected(new Set())
  }

  function handleImport() {
    setImporting(true)

    const toImport = processes.filter(
      (p) => selected.has(p.id) && !alreadyImported.has(p.id)
    )

    toImport.forEach((process) => {
      const oppScore  = process.interview?.opportunityScore ?? 2
      const kpiImpact = Math.min(100, Math.max(0, Math.round(oppScore * 25)))

      const q6Answer    = process.interview?.answers?.[6]
      const hoursFromT3 = q6Answer ? (T3_HOURS_FROM_ANSWER[q6Answer] ?? 10) : 10

      const scores = {
        kpiImpact,
        feasibility:    50,
        aiRisk:         50,
        dataDependency: 50,
      }

      const economics: UseCaseEconomics = {
        processHoursPerWeek:    hoursFromT3,
        headcount:              2,
        efficiencyGain:         0.40,
        efficiencyGainMode:     'benchmark',
        hourlyRate:             45,
        hourlyRateMode:         'preset',
        hourlyRatePreset:       'tecnico',
        implementationCost:     20_000,
        implementationCostMode: 'benchmark',
      }

      const newUseCase: Omit<UseCase, 'id' | 'createdAt'> = {
        name:        process.name,
        description: process.description,
        department:  process.department,
        aiCategory:  process.aiCategory,
        status:      'candidato',
        importedFromT3: {
          processId:        process.id,
          processName:      process.name,
          opportunityScore: process.interview?.opportunityScore ?? 0,
          aiCategory:       process.aiCategory,
        },
        stakeholderScores: [],
        scores,
        priorityScore: computePriorityScore(scores),
        economics,
      }

      addUseCase(newUseCase)
    })

    setImporting(false)
    setDone(true)
  }

  const availableProcesses = processes.filter((p) => !alreadyImported.has(p.id))
  const importCount        = [...selected].filter((id) => !alreadyImported.has(id)).length

  const footer = !done ? (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-text-subtle">
        {importCount > 0
          ? `${importCount} proceso${importCount !== 1 ? 's' : ''} seleccionado${importCount !== 1 ? 's' : ''}`
          : 'Ningún proceso seleccionado'}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
        <Button
          variant="primary"
          size="sm"
          disabled={importCount === 0 || importing}
          loading={importing}
          onClick={handleImport}
        >
          {importing
            ? 'Importando…'
            : `Importar ${importCount > 0 ? importCount : ''} candidato${importCount !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  ) : undefined

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Importar procesos desde T3"
      size="xl"
      footer={footer}
    >
      <p className="text-xs text-text-muted mb-4">
        Selecciona qué procesos del Value Stream Map pasan como candidatos al Priority Board.
      </p>

      {!done ? (
        <>
          {/* Acciones rápidas */}
          {availableProcesses.length > 0 && (
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border dark:border-white/8
              bg-warm-50 dark:bg-warm-900/50 -mx-6 px-6 -mt-2 pt-2">
              <span className="text-[10px] text-text-subtle">
                {availableProcesses.length} proceso{availableProcesses.length !== 1 ? 's' : ''} disponibles
              </span>
              <Button variant="link" className="text-[10px]" onClick={selectAll}>
                Seleccionar todos
              </Button>
              {selected.size > 0 && (
                <Button variant="link" className="text-[10px]" onClick={clearAll}>
                  Limpiar
                </Button>
              )}
            </div>
          )}

          {/* Lista de procesos */}
          <div className="flex flex-col gap-2.5">

            {processes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-text-subtle"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="1" /></svg>
                </div>
                <p className="text-sm font-medium text-text-muted">Sin procesos en T3</p>
                <p className="text-xs text-text-subtle max-w-xs leading-relaxed">
                  Completa el Value Stream Map (T3) primero para poder importar procesos aquí.
                </p>
              </div>
            )}

            {/* Procesos disponibles para importar */}
            {availableProcesses.map((process) => {
              const isSelected = selected.has(process.id)
              const catCfg     = AI_CATEGORY_CONFIG[process.aiCategory]
              const oppScore   = process.interview?.opportunityScore ?? null
              const kpiHint    = oppScore !== null
                ? Math.min(100, Math.max(0, Math.round(oppScore * 25)))
                : 50

              return (
                <button
                  key={process.id}
                  onClick={() => toggle(process.id)}
                  className={[
                    'w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-150',
                    'flex items-start gap-3',
                    isSelected
                      ? 'border-navy/40 bg-navy/5 dark:bg-navy/10 ring-1 ring-navy/20'
                      : 'border-border dark:border-white/8 bg-white dark:bg-warm-900 hover:border-warm-300 dark:hover:border-white/14',
                  ].join(' ')}
                >
                  {/* Checkbox */}
                  <div className={[
                    'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5',
                    isSelected
                      ? 'border-navy bg-navy'
                      : 'border-warm-300 dark:border-warm-600',
                  ].join(' ')}>
                    {isSelected && (
                      <svg viewBox="0 0 10 8" width={10} height={8} fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Info del proceso */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="text-xs font-bold text-lean-black dark:text-warm-100
                        leading-tight flex-1">
                        {process.name}
                      </p>
                      {oppScore !== null && (
                        <span className="shrink-0 text-[10px] font-bold text-info-dark tabular-nums">
                          T3: {oppScore.toFixed(2)}/4
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-text-subtle mt-0.5 mb-2">
                      {process.department}
                      {process.owner && ` · ${process.owner}`}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        shape="pill"
                        size="xs"
                        style={{
                          backgroundColor: `${catCfg.hex ?? '#94A3B8'}22`,
                          color: catCfg.hex ?? '#64748B',
                        }}
                      >
                        {catCfg.label}
                      </Badge>

                      <span className="text-[9px] text-text-subtle">
                        → KPI inicial: <strong>{kpiHint}/100</strong>
                        {' '}(desde T3 opp. score)
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Procesos ya importados (deshabilitados) */}
            {processes.filter((p) => alreadyImported.has(p.id)).length > 0 && (
              <>
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle
                  mt-4 mb-1 px-1">
                  Ya importados
                </p>
                {processes
                  .filter((p) => alreadyImported.has(p.id))
                  .map((process) => {
                    const catCfg = AI_CATEGORY_CONFIG[process.aiCategory]
                    return (
                      <div
                        key={process.id}
                        className="rounded-xl border border-border dark:border-white/6
                          px-4 py-3 opacity-40 flex items-center gap-3"
                      >
                        <div className="h-4 w-4 rounded border-2 border-success-dark
                          bg-success-dark flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 10 8" width={10} height={8} fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-lean-black dark:text-warm-100
                            leading-tight">
                            {process.name}
                          </p>
                          <p className="text-[10px] text-text-subtle">
                            {process.department} · {catCfg.label}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-success-dark shrink-0">
                          Importado <Check size={10} strokeWidth={1.5} />
                        </span>
                      </div>
                    )
                  })}
              </>
            )}
          </div>
        </>
      ) : (
        /* Estado: importación completada */
        <div className="flex flex-col items-center justify-center py-8 px-2 text-center gap-5">
          <div className="h-14 w-14 rounded-xl bg-success-light flex items-center justify-center text-success-dark">
            <Check size={28} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-semibold text-lean-black dark:text-warm-50 mb-1">
              {importCount} caso{importCount !== 1 ? 's' : ''} de uso importado{importCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              Los procesos aparecen ahora en el Priority Board con estado <strong>candidato</strong>.
              Ajusta los scores en el taller para completar la priorización.
            </p>
          </div>
          <Button variant="primary" onClick={onClose}>
            Ver el Priority Board
          </Button>
        </div>
      )}
    </Modal>
  )
}

import { useState } from 'react'
import { useT4Store } from '../store'
import { usePermissions } from '@/modules/Auth'
import {
  IMPLEMENTATION_COST_BENCHMARKS,
  EFFICIENCY_GAIN_BENCHMARKS,
  HOURLY_RATE_PRESETS,
  computeROIFromEconomics,
  AI_CATEGORY_LABELS,
} from '../constants'
import { fmtEur } from './T4Badges.constants'
import { Button, Card } from '@shared/design-system/components'
import type { UseCase, UseCaseEconomics } from '../types'

export function EconomicsTab({ useCase }: { useCase: UseCase }) {
  const { updateUseCase } = useT4Store()
  const { isReadOnly }    = usePermissions()
  const [editing, setEditing] = useState(false)

  const benchmarkCost = IMPLEMENTATION_COST_BENCHMARKS[useCase.aiCategory]
  const benchmarkEff  = EFFICIENCY_GAIN_BENCHMARKS[useCase.aiCategory]

  const defaultEcon: UseCaseEconomics = {
    kpiPrincipal:           '',
    processHoursPerWeek:    10,
    headcount:              2,
    efficiencyGain:         benchmarkEff?.value ?? 0.40,
    efficiencyGainMode:     'benchmark',
    hourlyRate:             HOURLY_RATE_PRESETS.tecnico.rate,
    hourlyRateMode:         'preset',
    hourlyRatePreset:       'tecnico',
    implementationCost:     benchmarkCost?.suggested ?? 20_000,
    implementationCostMode: 'benchmark',
  }

  const [local, setLocal] = useState<UseCaseEconomics>(useCase.economics ?? defaultEcon)

  function patch<K extends keyof UseCaseEconomics>(key: K, val: UseCaseEconomics[K]) {
    setLocal((prev) => ({ ...prev, [key]: val }))
  }

  function handleSave() {
    updateUseCase(useCase.id, { economics: local })
    setEditing(false)
  }

  const econ          = editing ? local : (useCase.economics ?? local)
  const roiDisplay    = computeROIFromEconomics(econ)
  const ROI_PILL_COLOR =
    roiDisplay.roi3year > 300
      ? 'text-success-dark bg-success-light'
      : roiDisplay.roi3year > 0
      ? 'text-warning-dark bg-warning-light'
      : 'text-danger-dark bg-danger-light'

  return (
    <div className="flex flex-col gap-6">

      {/* ROI summary boxes */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Ahorro anual estimado',
            value: fmtEur(roiDisplay.annualSaving),
            sub:   `${econ.processHoursPerWeek}h/sem × ${econ.headcount} personas × ${Math.round(econ.efficiencyGain * 100)}% ef.`,
            color: 'text-success-dark',
          },
          {
            label: 'Payback estimado',
            value: roiDisplay.paybackMonths > 0 ? `${roiDisplay.paybackMonths.toFixed(1)} meses` : '—',
            sub:   `${fmtEur(econ.implementationCost)} inversión`,
            color: 'text-lean-black dark:text-gray-100',
          },
          {
            label: 'ROI 3 años',
            value: roiDisplay.roi3year > 0 ? `${Math.round(roiDisplay.roi3year)}%` : '—',
            sub:   `${fmtEur(roiDisplay.annualSaving * 3 - econ.implementationCost)} beneficio neto`,
            color: ROI_PILL_COLOR.split(' ')[0],
          },
        ].map((kpi) => (
          <Card
            key={kpi.label}
            variant="flat"
            padding="none"
            className="rounded-2xl bg-warm-50 dark:bg-warm-800/40 border border-border dark:border-white/6 px-4 py-3"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
              {kpi.label}
            </p>
            <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-text-subtle mt-0.5 leading-snug">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      {/* Benchmark context */}
      {benchmarkCost && !editing && (
        <div className="rounded-2xl border border-navy/15 bg-navy/3 dark:bg-navy/8 px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-navy/60 mb-1">
            Benchmark · {AI_CATEGORY_LABELS[useCase.aiCategory] ?? useCase.aiCategory}
          </p>
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-[10px] text-text-subtle">Coste de implementación</p>
              <p className="text-xs font-bold text-lean-black dark:text-gray-200">{benchmarkCost.label}</p>
            </div>
            {benchmarkEff && (
              <div>
                <p className="text-[10px] text-text-subtle">Ganancia de eficiencia</p>
                <p className="text-xs font-bold text-lean-black dark:text-gray-200">{benchmarkEff.label}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit / save toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Datos del caso de uso
        </p>
        {!editing ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setLocal(useCase.economics ?? defaultEcon); setEditing(true) }}
          >
            ✎ Editar
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            {!isReadOnly && (
              <Button variant="primary" size="sm" onClick={handleSave}>
                Guardar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Fields grid */}
      <Card variant="flat" padding="none" className="rounded-2xl border border-border dark:border-white/8 bg-warm-50 dark:bg-warm-900/50 px-5 py-4 flex flex-col gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* KPI principal */}
          <div className="lg:col-span-2">
            <p className="text-[10px] font-mono text-text-subtle mb-1">KPI principal a impactar</p>
            {editing ? (
              <input
                type="text"
                value={local.kpiPrincipal ?? ''}
                onChange={(e) => patch('kpiPrincipal', e.target.value)}
                placeholder="ej. Tiempo de resolución L1, Coste por contratación..."
                className="w-full px-3 py-2 rounded-xl border border-border dark:border-white/10
                  bg-white dark:bg-warm-800 text-xs text-lean-black dark:text-gray-200
                  focus:outline-none focus:ring-1 focus:ring-navy/30"
              />
            ) : (
              <p className="text-xs font-medium text-lean-black dark:text-gray-200">
                {econ.kpiPrincipal || <span className="italic text-text-subtle">Sin definir</span>}
              </p>
            )}
          </div>

          {/* Horas/semana */}
          <div>
            <p className="text-[10px] font-mono text-text-subtle mb-1">Horas/semana del proceso actual</p>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={168} step={1}
                  value={local.processHoursPerWeek}
                  onChange={(e) => patch('processHoursPerWeek', Number(e.target.value))}
                  className="w-20 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                    bg-white dark:bg-warm-800 text-xs text-lean-black dark:text-gray-200
                    focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums"
                />
                <span className="text-[10px] text-text-subtle">horas por semana</span>
              </div>
            ) : (
              <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
                {econ.processHoursPerWeek}
                <span className="text-xs font-normal text-text-subtle ml-1">h/semana</span>
              </p>
            )}
          </div>

          {/* Headcount */}
          <div>
            <p className="text-[10px] font-mono text-text-subtle mb-1">Personas involucradas</p>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} max={500} step={1}
                  value={local.headcount}
                  onChange={(e) => patch('headcount', Number(e.target.value))}
                  className="w-20 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                    bg-white dark:bg-warm-800 text-xs text-lean-black dark:text-gray-200
                    focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums"
                />
                <span className="text-[10px] text-text-subtle">personas</span>
              </div>
            ) : (
              <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
                {econ.headcount}
                <span className="text-xs font-normal text-text-subtle ml-1">personas</span>
              </p>
            )}
          </div>

          {/* Ganancia de eficiencia */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-mono text-text-subtle">Ganancia de eficiencia</p>
              {editing && (
                <div className="flex items-center gap-1">
                  {(['benchmark', 'manual'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        patch('efficiencyGainMode', mode)
                        if (mode === 'benchmark' && benchmarkEff) {
                          patch('efficiencyGain', benchmarkEff.value)
                        }
                      }}
                      className={[
                        'px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all',
                        local.efficiencyGainMode === mode
                          ? 'bg-navy text-white'
                          : 'bg-warm-100 dark:bg-warm-700 text-text-muted',
                      ].join(' ')}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={100} step={5}
                  value={Math.round(local.efficiencyGain * 100)}
                  onChange={(e) => patch('efficiencyGain', Number(e.target.value) / 100)}
                  disabled={local.efficiencyGainMode === 'benchmark'}
                  className="w-20 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                    bg-white dark:bg-warm-800 text-xs text-lean-black dark:text-gray-200
                    focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-text-subtle">%</span>
                {local.efficiencyGainMode === 'benchmark' && benchmarkEff && (
                  <span className="text-[9px] text-navy/60">(benchmark)</span>
                )}
              </div>
            ) : (
              <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
                {Math.round(econ.efficiencyGain * 100)}%
                {econ.efficiencyGainMode === 'benchmark' && (
                  <span className="text-[10px] font-normal text-text-subtle ml-1">benchmark</span>
                )}
              </p>
            )}
          </div>

          {/* Coste por hora */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-mono text-text-subtle">Coste/hora cargado</p>
              {editing && (
                <div className="flex items-center gap-1">
                  {(['preset', 'manual'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => patch('hourlyRateMode', mode)}
                      className={[
                        'px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all',
                        local.hourlyRateMode === mode
                          ? 'bg-navy text-white'
                          : 'bg-warm-100 dark:bg-warm-700 text-text-muted',
                      ].join(' ')}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {editing ? (
              local.hourlyRateMode === 'preset' ? (
                <div className="flex flex-col gap-1.5">
                  {(
                    Object.entries(HOURLY_RATE_PRESETS) as [
                      string,
                      (typeof HOURLY_RATE_PRESETS)[keyof typeof HOURLY_RATE_PRESETS],
                    ][]
                  ).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => {
                        patch('hourlyRatePreset', key as 'administrativo' | 'tecnico' | 'directivo')
                        patch('hourlyRate', p.rate)
                      }}
                      className={[
                        'text-left px-3 py-2 rounded-xl border text-[10px] transition-all',
                        local.hourlyRatePreset === key
                          ? 'border-navy/40 bg-navy/5 text-lean-black dark:text-gray-200'
                          : 'border-border dark:border-white/8 text-text-muted hover:border-gray-300',
                      ].join(' ')}
                    >
                      <span className="font-bold">{p.label}</span>
                      <span className="ml-2 opacity-70">{p.hint}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-subtle">€</span>
                  <input
                    type="number" min={10} max={500} step={5}
                    value={local.hourlyRate}
                    onChange={(e) => patch('hourlyRate', Number(e.target.value))}
                    className="w-24 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                      bg-white dark:bg-warm-800 text-xs text-lean-black dark:text-gray-200
                      focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums"
                  />
                  <span className="text-[10px] text-text-subtle">/hora</span>
                </div>
              )
            ) : (
              <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
                €{econ.hourlyRate}/h
                {econ.hourlyRateMode === 'preset' && econ.hourlyRatePreset && (
                  <span className="text-[10px] font-normal text-text-subtle ml-1">
                    {HOURLY_RATE_PRESETS[econ.hourlyRatePreset]?.label}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Coste de implementación */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-mono text-text-subtle">Coste de implementación estimado</p>
              {editing && (
                <div className="flex items-center gap-1">
                  {(['benchmark', 'manual'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        patch('implementationCostMode', mode)
                        if (mode === 'benchmark' && benchmarkCost) {
                          patch('implementationCost', benchmarkCost.suggested)
                        }
                      }}
                      className={[
                        'px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all',
                        local.implementationCostMode === mode
                          ? 'bg-navy text-white'
                          : 'bg-warm-100 dark:bg-warm-700 text-text-muted',
                      ].join(' ')}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {editing ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-text-subtle">€</span>
                <input
                  type="number" min={0} max={2_000_000} step={1000}
                  value={local.implementationCost}
                  onChange={(e) => patch('implementationCost', Number(e.target.value))}
                  disabled={local.implementationCostMode === 'benchmark'}
                  className="w-32 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                    bg-white dark:bg-warm-800 text-xs text-lean-black dark:text-gray-200
                    focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-text-subtle">euros (coste total del proyecto)</span>
                {local.implementationCostMode === 'benchmark' && benchmarkCost && (
                  <span className="text-[9px] text-navy/60">Rango benchmark: {benchmarkCost.label}</span>
                )}
              </div>
            ) : (
              <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
                {fmtEur(econ.implementationCost)}
                {econ.implementationCostMode === 'benchmark' && benchmarkCost && (
                  <span className="text-[10px] font-normal text-text-subtle ml-1">
                    benchmark · rango: {benchmarkCost.label}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

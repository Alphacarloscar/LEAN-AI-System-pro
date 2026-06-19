// ============================================================
// T4 — ScoringTabContent
// ============================================================

import { Check, X } from 'lucide-react'
import { Button, Card } from '@shared/design-system/components'
import { DIMENSION_CONFIG, STATUS_CONFIG, STATUS_ORDER } from '../constants'
import type { UseCase, UseCaseScores } from '../types'
import { PriorityMatrix }            from './PriorityMatrix'
import { T4ScoreBars, ScoreInput }   from './T4ScoreEditors'
import { LowScoreRecommendations }   from './LowScoreRecommendations'
import { priorityScoreColor }        from './T4Badges.constants'

interface ScoringTabProps {
  useCase:        UseCase
  allUseCases:    UseCase[]
  onSelect:       (id: string) => void
  isReadOnly:     boolean
  editingScore:   boolean
  localScores:    UseCaseScores
  previewScore:   number
  onEditStart:    () => void
  onEditCancel:   () => void
  onSaveScores:   () => void
  onScoreChange:  (dim: keyof UseCaseScores, v: number) => void
}

export function ScoringTabContent({
  useCase, allUseCases, onSelect,
  isReadOnly, editingScore, localScores, previewScore,
  onEditStart, onEditCancel, onSaveScores, onScoreChange,
}: ScoringTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Posición en la matriz de prioridad
        </p>
        <PriorityMatrix useCases={allUseCases} activeId={useCase.id} onSelect={onSelect} />
        <div className="flex flex-wrap gap-3">
          {STATUS_ORDER.filter((st) => allUseCases.some((uc) => uc.status === st)).map((st) => (
            <div key={st} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[st].dotBg}`} />
              <span className="text-[9px] text-text-subtle">{STATUS_CONFIG[st].label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            Dimensiones de scoring
          </p>
          {!editingScore ? (
            <Button variant="primary" size="sm" onClick={onEditStart}>
              ✎ Editar scores
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onEditCancel}>Cancelar</Button>
              {!isReadOnly && <Button variant="primary" size="sm" onClick={onSaveScores}>Guardar</Button>}
            </div>
          )}
        </div>

        {!editingScore ? (
          <>
            <T4ScoreBars scores={useCase.scores} />
            <Card variant="flat" padding="none" className="mt-5 rounded-2xl bg-warm-50 dark:bg-warm-800/40 border border-border dark:border-white/6 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">Score compuesto · ponderado</p>
              <p className="text-2xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                {useCase.priorityScore.toFixed(1)}<span className="text-sm font-normal text-text-subtle">/100</span>
              </p>
              <p className="text-[10px] text-text-subtle mt-0.5">KPI 35% · facilidad 30% · riesgo IA 20% · dep. datos 15%</p>
            </Card>
            <LowScoreRecommendations useCase={useCase} />
          </>
        ) : (
          <div className="flex flex-col gap-5 mt-2">
            <p className="text-[10px] text-text-subtle">
              Ajusta los scores del taller (0 = mínimo, 100 = máximo).
              Para riesgo y dependencia de datos, valores altos indican mayor riesgo/dependencia.
            </p>
            <ScoreInput label={DIMENSION_CONFIG.kpiImpact.label} description="Mayor valor = mayor impacto en KPIs de negocio" value={localScores.kpiImpact} onChange={(v) => onScoreChange('kpiImpact', v)} hex={DIMENSION_CONFIG.kpiImpact.hex} />
            <ScoreInput label={DIMENSION_CONFIG.feasibility.label} description="Mayor valor = más fácil de implementar" value={localScores.feasibility} onChange={(v) => onScoreChange('feasibility', v)} hex={DIMENSION_CONFIG.feasibility.hex} />
            <ScoreInput label={DIMENSION_CONFIG.aiRisk.label} description="Mayor valor = mayor riesgo (peor para el score)" value={localScores.aiRisk} onChange={(v) => onScoreChange('aiRisk', v)} isNegative hex={DIMENSION_CONFIG.aiRisk.hex} />
            <ScoreInput label={DIMENSION_CONFIG.dataDependency.label} description="Mayor valor = mayor dependencia bloqueante (peor)" value={localScores.dataDependency} onChange={(v) => onScoreChange('dataDependency', v)} isNegative hex={DIMENSION_CONFIG.dataDependency.hex} />
            <Card variant="flat" padding="none" className="rounded-xl bg-navy/5 dark:bg-navy/10 px-4 py-2.5 border border-navy/10">
              <p className="text-[10px] text-text-subtle">Preview score</p>
              <p className={`text-xl font-bold tabular-nums ${priorityScoreColor(previewScore)}`}>{previewScore.toFixed(1)}/100</p>
            </Card>
          </div>
        )}

        {useCase.stakeholderScores.length > 0 && !editingScore && (
          <div className="mt-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">Scores por stakeholder</p>
            <div className="flex flex-col gap-2">
              {useCase.stakeholderScores.map((ss) => (
                <Card key={ss.id} variant="outlined" padding="none" className="rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-navy/10 dark:bg-navy/20 flex items-center justify-center text-[9px] font-bold text-navy dark:text-warm-100 shrink-0">
                      {ss.stakeholderName.charAt(0)}
                    </div>
                    <p className="text-xs font-semibold text-lean-black dark:text-gray-200">{ss.stakeholderName}</p>
                    <p className="text-[10px] text-text-subtle">{ss.stakeholderRole}</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {(['kpiImpact', 'feasibility', 'aiRisk', 'dataDependency'] as const).map((dim) => (
                      <div key={dim} className="flex items-center gap-1">
                        <span className="text-[9px] text-text-subtle" style={{ color: DIMENSION_CONFIG[dim].hex }}>{DIMENSION_CONFIG[dim].label.split(' ')[0]}:</span>
                        <span className="text-[10px] font-bold text-lean-black dark:text-gray-200">{ss.scores[dim]}</span>
                      </div>
                    ))}
                  </div>
                  {ss.notes && <p className="text-[10px] text-text-subtle italic mt-1 leading-relaxed">"{ss.notes}"</p>}
                </Card>
              ))}
            </div>
          </div>
        )}

        {useCase.goNoGo && !editingScore && (
          <div className={`mt-5 rounded-2xl px-4 py-3 border ${
            useCase.goNoGo.decision === 'go'    ? 'border-success-dark/20 bg-success-light/8 dark:bg-success-dark/5' :
            useCase.goNoGo.decision === 'no_go' ? 'border-danger-dark/20 bg-danger-light/8' :
            'border-border dark:border-white/8 bg-warm-50 dark:bg-warm-800/40'
          }`}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Decisión go/no-go</p>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 text-xs font-bold ${useCase.goNoGo.decision === 'go' ? 'text-success-dark' : useCase.goNoGo.decision === 'no_go' ? 'text-danger-dark' : 'text-warning-dark'}`}>
                {useCase.goNoGo.decision === 'go'
                  ? <><Check size={14} strokeWidth={1.75} /> GO</>
                  : useCase.goNoGo.decision === 'no_go'
                  ? <><X size={14} strokeWidth={1.75} /> NO-GO</>
                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="1" /></svg> PENDIENTE</>
                }
              </span>
              {useCase.goNoGo.decidedBy && <span className="text-[10px] text-text-subtle">· {useCase.goNoGo.decidedBy}</span>}
            </div>
            {useCase.goNoGo.rationale && <p className="text-[11px] text-text-muted leading-relaxed italic">{useCase.goNoGo.rationale}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

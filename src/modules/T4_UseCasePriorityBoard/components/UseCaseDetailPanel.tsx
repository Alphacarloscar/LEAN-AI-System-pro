import { useState } from 'react'
import { useT4Store } from '../store'
import { usePermissions } from '@/modules/Auth'
import {
  computePriorityScore,
  getGoNoGoRecommendation,
  AI_CATEGORY_HEX,
  STATUS_CONFIG,
  STATUS_ORDER,
} from '../constants'
import { priorityScoreColor } from './T4Badges'
import type { UseCase, UseCaseStatus, UseCaseScores, AIActClassification } from '../types'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import { Button, Badge, Card, Tabs } from '@shared/design-system/components'
import { StatusBadge, CategoryBadge } from './T4Badges'
import { EconomicsTab }              from './EconomicsTab'
import { AIActClassificationModal, AIACT_RISK_CONFIG, AIACT_SCOPE_LABELS } from './AIActClassificationModal'
import { ScoringTabContent }         from './ScoringTabContent'
import { RoadmapTabContent }         from './RoadmapTabContent'
import { ContextoTabContent }        from './ContextoTabContent'

type DetailTab = 'scoring' | 'economia' | 'roadmap' | 'contexto' | 'regulatorio'

export function UseCaseDetailPanel({
  useCase,
  allUseCases,
  onSelect,
  autoT1Context,
  autoT2Context,
}: {
  useCase:        UseCase
  allUseCases:    UseCase[]
  onSelect:       (id: string) => void
  autoT1Context?: { weakDimensions: string[]; total: number } | null
  autoT2Context?: { champions: Stakeholder[]; blockers: Stakeholder[] } | null
}) {
  const { updateUseCase, recalcScore, updateAIActClassification } = useT4Store()
  const { isReadOnly } = usePermissions()
  const [tab, setTab]                   = useState<DetailTab>('scoring')
  const [editingScore, setEditingScore] = useState(false)
  const [localScores, setLocalScores]   = useState<UseCaseScores>(useCase.scores)
  const [pendingStatus, setPendingStatus]   = useState<UseCaseStatus | null>(null)
  const [showAIActModal, setShowAIActModal] = useState(false)

  const recommendation = getGoNoGoRecommendation(useCase.priorityScore)
  const catHex         = AI_CATEGORY_HEX[useCase.aiCategory] ?? '#94A3B8'

  function handleSaveScores() {
    updateUseCase(useCase.id, { scores: localScores })
    recalcScore(useCase.id)
    setEditingScore(false)
  }

  function handleScoreChange(dim: keyof UseCaseScores, v: number) {
    setLocalScores((prev) => ({ ...prev, [dim]: v }))
  }

  function handleStatusChange(newStatus: UseCaseStatus) {
    const requiresClassification = newStatus === 'go' || newStatus === 'priorizado'
    if (requiresClassification && !useCase.aiActClassification) {
      setPendingStatus(newStatus)
      setShowAIActModal(true)
    } else {
      updateUseCase(useCase.id, { status: newStatus })
    }
  }

  function handleAIActSave(classification: AIActClassification) {
    updateAIActClassification(useCase.id, classification)
    if (pendingStatus) updateUseCase(useCase.id, { status: pendingStatus })
    setPendingStatus(null)
    setShowAIActModal(false)
    setTab('regulatorio')
  }

  const previewScore = computePriorityScore(localScores)

  return (
    <div className="border-t border-border dark:border-white/6 bg-surface dark:bg-warm-950">

      {/* Panel header */}
      <div className="flex items-start gap-6 px-8 py-5 border-b border-border dark:border-white/6">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            {useCase.department}
            {useCase.importedFromT3 && ` · Importado desde T3`}
            {useCase.sponsorName && ` · ${useCase.sponsorName}`}
          </p>
          <h2 className="text-lg font-semibold text-lean-black dark:text-gray-100 leading-tight mb-2">
            {useCase.name}
          </h2>
          <div className="flex flex-wrap gap-1.5 items-center">
            <StatusBadge status={useCase.status} />
            <CategoryBadge category={useCase.aiCategory} />
            {useCase.roadmap?.quarter && (
              <Badge shape="pill" size="xs" style={{ backgroundColor: 'rgba(42,40,34,0.08)', color: '#2A2822' }}>
                {useCase.roadmap.quarter}
              </Badge>
            )}
            {(() => {
              const risk = useCase.aiActClassification?.riskLevel ?? 'sin_clasificar'
              const cfg  = AIACT_RISK_CONFIG[risk]
              return (
                <button
                  onClick={() => setTab('regulatorio')}
                  title="Ver clasificación AI Act"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Badge shape="pill" size="xs" style={{ backgroundColor: `${cfg.hex}22`, color: cfg.hex }}>
                    {cfg.icon} {cfg.label}
                  </Badge>
                </button>
              )
            })()}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-text-subtle shrink-0">Estado:</span>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((st) => {
                const cfg      = STATUS_CONFIG[st]
                const isActive = useCase.status === st
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={isActive}
                    className={[
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-100',
                      isActive
                        ? `${cfg.badgeBg} ${cfg.badgeText} border-transparent cursor-default ring-2 ring-offset-1 ring-current/20`
                        : 'bg-white dark:bg-warm-800/60 border-border dark:border-white/10 text-text-muted hover:border-gray-300 dark:hover:border-white/20 hover:text-lean-black dark:hover:text-gray-200',
                    ].join(' ')}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
          {useCase.description && (
            <p className="text-xs text-text-muted mt-2 leading-relaxed max-w-2xl">
              {useCase.description}
            </p>
          )}
          {useCase.importedFromT3 && (
            <p className="text-[10px] font-mono text-text-subtle mt-1.5">
              T3 origen: {useCase.importedFromT3.processName}
              {' · '}Opp. T3: <span className="font-bold">{useCase.importedFromT3.opportunityScore.toFixed(2)}/4.0</span>
            </p>
          )}
        </div>

        {/* Score hero */}
        <div className="shrink-0 text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">Score</p>
          <p className={`text-4xl font-bold tabular-nums leading-none ${priorityScoreColor(useCase.priorityScore)}`}>
            {useCase.priorityScore.toFixed(0)}
          </p>
          <p className="text-[10px] text-text-subtle">/100</p>
          <div
            className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold
              ${recommendation.badgeBg} ${recommendation.badgeText}`}
          >
            {recommendation.label.replace('Recomendación: ', '')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 py-3 border-b border-border dark:border-white/6">
        <Tabs
          aria-label="Secciones del caso de uso"
          value={tab}
          onChange={(v) => setTab(v as DetailTab)}
          tabs={[
            { value: 'scoring',     label: 'Scoring' },
            { value: 'economia',    label: 'Economía' },
            { value: 'roadmap',     label: 'Hoja de ruta' },
            { value: 'contexto',    label: 'Contexto T1/T2' },
            {
              value: 'regulatorio',
              label: `⚖️ AI Act${useCase.aiActClassification
                ? ` · ${AIACT_RISK_CONFIG[useCase.aiActClassification.riskLevel].label}`
                : ''}`,
            },
          ]}
        />
      </div>

      {/* Tab content */}
      <div className="px-8 py-6">

        {/* ── TAB: SCORING ──────────────────────────────────── */}
        {tab === 'scoring' && (
          <ScoringTabContent
            useCase={useCase}
            allUseCases={allUseCases}
            onSelect={onSelect}
            isReadOnly={isReadOnly}
            editingScore={editingScore}
            localScores={localScores}
            previewScore={previewScore}
            onEditStart={() => { setEditingScore(true); setLocalScores(useCase.scores) }}
            onEditCancel={() => setEditingScore(false)}
            onSaveScores={handleSaveScores}
            onScoreChange={handleScoreChange}
          />
        )}

        {/* ── TAB: REGULATORIO (AI Act) ──────────────────────── */}
        {tab === 'regulatorio' && (() => {
          const cls = useCase.aiActClassification
          if (!cls) {
            return (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <span className="text-4xl">⚖️</span>
                <div>
                  <p className="text-sm font-semibold text-lean-black dark:text-gray-100 mb-1">
                    Sin clasificación AI Act
                  </p>
                  <p className="text-xs text-text-muted max-w-sm leading-relaxed">
                    Clasifica este caso de uso para evaluar su nivel de riesgo regulatorio según el EU AI Act y el RGPD.
                  </p>
                </div>
                <Button variant="primary" onClick={() => setShowAIActModal(true)}>
                  Clasificar ahora
                </Button>
              </div>
            )
          }

          const riskCfg    = AIACT_RISK_CONFIG[cls.riskLevel]
          const scopeLabel = AIACT_SCOPE_LABELS[cls.scope]

          return (
            <div className="flex flex-col gap-5 max-w-2xl">
              <div className={`rounded-2xl border px-5 py-4 ${riskCfg.badgeBg}`}>
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-2"
                  style={{ color: riskCfg.hex }}
                >
                  Nivel de riesgo EU AI Act
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{riskCfg.icon}</span>
                    <div>
                      <p className="text-lg font-bold" style={{ color: riskCfg.hex }}>{riskCfg.label}</p>
                      <p className="text-[10px] text-text-subtle mt-0.5">
                        Clasificado el {new Date(cls.classifiedAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setShowAIActModal(true)}>
                    Reclasificar
                  </Button>
                </div>
              </div>

              <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4 flex flex-col gap-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                  Respuestas del cuestionario
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-0.5">P1 · Ámbito</p>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200 leading-tight">{scopeLabel}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-0.5">P2 · Impacto en personas</p>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200">
                      {cls.personImpact === 'no'           ? 'No afecta a personas físicas'
                      : cls.personImpact === 'human_review' ? 'Sí, con revisión humana'
                      :                                       'Sí, de forma autónoma'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-0.5">P3 · Datos sensibles</p>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200">
                      {cls.sensitiveData ? '⚠️ Sí — datos RGPD Art. 9' : '✓ No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-0.5">P4 · Explicabilidad</p>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200">
                      {cls.explainability === 'yes' ? '✓ Sistema explicable / trazable' : '✕ Output opaco'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                  Obligaciones regulatorias aplicables
                </p>
                {cls.riskLevel === 'prohibido' && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                      🚫 Sistema potencialmente prohibido — Art. 5 AI Act
                    </p>
                    <p className="text-[10px] text-red-600 dark:text-red-400 leading-relaxed">
                      Detener el desarrollo e iniciar revisión legal inmediata.
                    </p>
                  </div>
                )}
                {cls.riskLevel === 'alto' && (
                  <ul className="flex flex-col gap-2">
                    {[
                      'Evaluación de conformidad antes del despliegue (Annex III)',
                      'Sistema de gestión de riesgos documentado',
                      'Datos de entrenamiento y gobernanza documentados',
                      'Registro en la base de datos EU de sistemas de alto riesgo',
                      'Supervisión humana obligatoria definida y operativa',
                      'Transparencia hacia usuarios afectados',
                    ].map((o, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-warning-dark shrink-0 mt-0.5">▶</span>
                        <span className="text-xs text-text-muted leading-tight">{o}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {cls.riskLevel === 'limitado' && (
                  <ul className="flex flex-col gap-2">
                    {[
                      'Obligación de transparencia hacia los usuarios (Art. 50)',
                      'Indicar que el contenido es generado por IA si aplica',
                      'Política de uso aceptable documentada',
                    ].map((o, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-warning-dark shrink-0 mt-0.5">▶</span>
                        <span className="text-xs text-text-muted leading-tight">{o}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {cls.riskLevel === 'minimo' && (
                  <p className="text-xs text-success-dark leading-relaxed">
                    ✓ Sin obligaciones regulatorias específicas del AI Act. Se recomienda documentar el uso en el catálogo corporativo de IA como buena práctica de gobernanza.
                  </p>
                )}
              </Card>
            </div>
          )
        })()}

        {/* ── TAB: ECONOMÍA ──────────────────────────────────── */}
        {tab === 'economia' && <EconomicsTab useCase={useCase} />}

        {/* ── TAB: HOJA DE RUTA ──────────────────────────────── */}
        {tab === 'roadmap' && (
          <RoadmapTabContent
            useCase={useCase}
            onUpdateRoadmap={(patch) => {
              const rm = useCase.roadmap ?? {}
              updateUseCase(useCase.id, { roadmap: { ...rm, ...patch } as typeof useCase.roadmap })
            }}
          />
        )}

        {/* ── TAB: CONTEXTO T1/T2 ──────────────────────────────── */}
        {tab === 'contexto' && (
          <ContextoTabContent
            useCase={useCase}
            catHex={catHex}
            autoT1Context={autoT1Context}
            autoT2Context={autoT2Context}
          />
        )}
      </div>

      {showAIActModal && (
        <AIActClassificationModal
          useCaseName={useCase.name}
          onSave={handleAIActSave}
          onCancel={() => { setShowAIActModal(false); setPendingStatus(null) }}
        />
      )}
    </div>
  )
}

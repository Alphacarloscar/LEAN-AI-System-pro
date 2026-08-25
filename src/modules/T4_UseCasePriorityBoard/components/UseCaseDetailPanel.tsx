import { useState, useEffect, useMemo } from 'react'
import { useT4Store } from '../store'
import { usePermissions } from '@/modules/Auth'
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard'
import { useDomainFramework } from '@/shared/hooks/useDomainFramework'
import {
  computePriorityScore,
  getGoNoGoRecommendation,
  AI_CATEGORY_HEX,
  STATUS_CONFIG,
  STATUS_ORDER,
} from '../constants'
import { priorityScoreColor } from './T4Badges.constants'
import type { UseCase, UseCaseStatus, UseCaseScores, AIActClassification } from '../types'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import { AlertTriangle, Check, X, Ban } from 'lucide-react'
import { Button, Badge, Card, Tabs, SegmentedControl } from '@shared/design-system/components'
import { UnsavedChangesModal }       from '@/shared/components/UnsavedChangesModal'
import { StatusBadge, CategoryBadge } from './T4Badges'
import { EconomicsTab }              from './EconomicsTab'
import { AIActClassificationModal } from './AIActClassificationModal'
import { AIACT_RISK_CONFIG, AIACT_SCOPE_LABELS, AIACT_ICON_MAP } from './AIActClassificationModal.constants'
import { ScoringTabContent }         from './ScoringTabContent'
import { RoadmapTabContent }         from './RoadmapTabContent'
import { ContextoTabContent }        from './ContextoTabContent'

type DetailTab = 'scoring' | 'economia' | 'roadmap' | 'contexto' | 'regulatorio'

export function UseCaseDetailPanel({
  useCase,
  allUseCases,
  onSelect,
  pendingNavigateTo,
  onClearPendingNavigate,
  onEditingChange,
  autoT1Context,
  autoT2Context,
}: {
  useCase:                  UseCase
  allUseCases:              UseCase[]
  onSelect:                 (id: string) => void
  pendingNavigateTo?:       string | null
  onClearPendingNavigate?:  () => void
  onEditingChange?:         (isEditing: boolean) => void
  autoT1Context?: { weakDimensions: string[]; total: number } | null
  autoT2Context?: { champions: Stakeholder[]; blockers: Stakeholder[] } | null
}) {
  const { updateUseCase, recalcScore, updateAIActClassification } = useT4Store()
  const { isReadOnly } = usePermissions()
  const { getLabel } = useDomainFramework()
  const [tab, setTab]                   = useState<DetailTab>('scoring')
  const [editingScore, setEditingScore] = useState(false)
  const [localScores, setLocalScores]   = useState<UseCaseScores>(useCase.scores)
  const [pendingStatus, setPendingStatus]       = useState<UseCaseStatus | null>(null)
  const [showAIActModal, setShowAIActModal]     = useState(false)
  const [localPendingSelectId, setLocalPendingSelectId] = useState<string | null>(null)
  const [pendingTab, setPendingTab]             = useState<DetailTab | null>(null)
  const [isSavingScores, setIsSavingScores]     = useState(false)
  const [editingEconomics, setEditingEconomics] = useState(false)
  const [economicsIsDirty, setEconomicsIsDirty] = useState(false)
  const [economicsSaveRequested, setEconomicsSaveRequested] = useState(false)

  const pendingSelectId = localPendingSelectId ?? pendingNavigateTo ?? null
  const showUnsavedModal = pendingSelectId !== null || pendingTab !== null

  const isEditingAny = editingScore || editingEconomics

  const hasUnsavedChanges = useMemo(() => {
    if (editingScore) {
      const s = useCase.scores
      return (
        localScores.kpiImpact      !== s.kpiImpact      ||
        localScores.feasibility    !== s.feasibility    ||
        localScores.aiRisk         !== s.aiRisk         ||
        localScores.dataDependency !== s.dataDependency
      )
    }
    if (editingEconomics) return economicsIsDirty
    return false
  }, [editingScore, localScores, useCase.scores, editingEconomics, economicsIsDirty])

  // Notifica al padre cuando el estado de edición cambia (para guardar back/import).
  useEffect(() => { onEditingChange?.(isEditingAny) }, [isEditingAny, onEditingChange])

  // Guard triggers whenever scoring editor is open, not just when values changed.
  // This prevents switching use cases mid-edit without user confirmation.
  useUnsavedGuard(editingScore, 'T4_Scoring')

  // Sincroniza localScores cuando cambia el caso activo o cuando el store
  // recibe los scores reales de Supabase. Se omite durante la edición para
  // no pisar los sliders del usuario mientras está ajustando valores.
  useEffect(() => {
    if (!editingScore) {
      setLocalScores(useCase.scores)
    }
  }, [useCase.id, useCase.scores.kpiImpact, useCase.scores.feasibility, useCase.scores.aiRisk, useCase.scores.dataDependency, editingScore])

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

  function handleGuardedSelect(id: string) {
    if (isEditingAny) {
      setLocalPendingSelectId(id)
    } else {
      onSelect(id)
    }
  }

  function handleGuardedTabChange(newTab: DetailTab) {
    if (isEditingAny && newTab !== tab) {
      setPendingTab(newTab)
    } else {
      setTab(newTab)
    }
  }

  async function handleModalSaveAndContinue() {
    if (editingScore) {
      setIsSavingScores(true)
      try {
        updateUseCase(useCase.id, { scores: localScores })
        recalcScore(useCase.id)
        setEditingScore(false)
      } finally {
        setIsSavingScores(false)
      }
    } else if (editingEconomics) {
      setEconomicsSaveRequested(true)
      // La navegación se completa en handleEconomicsSaveHandled
      return
    }
    const targetSelect = pendingSelectId
    const targetTab    = pendingTab
    setLocalPendingSelectId(null)
    setPendingTab(null)
    onClearPendingNavigate?.()
    if (targetSelect) onSelect(targetSelect)
    if (targetTab)    setTab(targetTab)
  }

  function handleEconomicsSaveHandled() {
    setEconomicsSaveRequested(false)
    const targetSelect = pendingSelectId
    const targetTab    = pendingTab
    setLocalPendingSelectId(null)
    setPendingTab(null)
    onClearPendingNavigate?.()
    if (targetSelect) onSelect(targetSelect)
    if (targetTab)    setTab(targetTab)
  }

  function handleModalDiscard() {
    setLocalScores(useCase.scores)
    setEditingScore(false)
    setEditingEconomics(false)
    setEconomicsIsDirty(false)
    const targetSelect = pendingSelectId
    const targetTab    = pendingTab
    setLocalPendingSelectId(null)
    setPendingTab(null)
    onClearPendingNavigate?.()
    if (targetSelect) onSelect(targetSelect)
    if (targetTab)    setTab(targetTab)
  }

  function handleModalCancel() {
    setLocalPendingSelectId(null)
    setPendingTab(null)
    onClearPendingNavigate?.()
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
          <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 leading-tight mb-2">
            {useCase.name}
          </h2>
          <div className="flex flex-wrap gap-1.5 items-center">
            <StatusBadge status={useCase.status} />
            <CategoryBadge category={useCase.aiCategory} />
            {useCase.roadmap?.quarter && (
              <Badge shape="pill" size="xs" className="bg-warm-100 text-warm-700 dark:bg-gold/20 dark:text-gold border border-warm-200 dark:border-gold/30">
                {useCase.roadmap.quarter}
              </Badge>
            )}
            {(() => {
              const risk = useCase.aiActClassification?.riskLevel ?? 'sin_clasificar'
              const cfg  = AIACT_RISK_CONFIG[risk]
              return (
                <button
                  onClick={() => handleGuardedTabChange('regulatorio')}
                  title={getLabel('ai_act_tooltip')}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Badge shape="pill" size="xs" style={{ backgroundColor: `${cfg.hex}22`, color: cfg.hex }}>
                    <span className="inline-flex items-center gap-1">
                      {(() => { const Icon = AIACT_ICON_MAP[cfg.icon] ?? AlertTriangle; return <Icon size={11} strokeWidth={1.5} /> })()}
                      {cfg.label}
                    </span>
                  </Badge>
                </button>
              )
            })()}
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle shrink-0">Estado:</span>
            <SegmentedControl
              aria-label="Estado del caso de uso"
              size="sm"
              value={useCase.status}
              onChange={(v) => handleStatusChange(v as UseCaseStatus)}
              options={STATUS_ORDER.map((st) => ({
                value:       st,
                label:       STATUS_CONFIG[st].label,
                activeColor: STATUS_CONFIG[st].hex,
              }))}
            />
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
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-0.5">Score</p>
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

      {/* Tabs de navegación */}
      <div className="px-8 border-b border-border dark:border-white/6">
        <Tabs
          aria-label="Secciones del caso de uso"
          variant="underline"
          value={tab}
          onChange={(v) => handleGuardedTabChange(v as DetailTab)}
          tabs={[
            { value: 'scoring',     label: 'Scoring' },
            { value: 'economia',    label: 'Economía' },
            { value: 'roadmap',     label: 'Hoja de ruta' },
            { value: 'contexto',    label: 'Contexto T1/T2' },
            {
              value: 'regulatorio',
              label: `${getLabel('ai_act_tab')}${useCase.aiActClassification
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
            onSelect={handleGuardedSelect}
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
                <AlertTriangle size={32} strokeWidth={1.5} className="text-text-subtle" />
                <div>
                  <p className="text-sm font-semibold text-lean-black dark:text-warm-50 mb-1">
                    {getLabel('ai_act_empty')}
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
              <div className={`rounded-xl border px-5 py-4 ${riskCfg.badgeBg}`}>
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-2"
                  style={{ color: riskCfg.hex }}
                >
                  {getLabel('ai_act_risk_level')}
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3" style={{ color: riskCfg.hex }}>
                    {(() => { const Icon = AIACT_ICON_MAP[riskCfg.icon] ?? AlertTriangle; return <Icon size={32} strokeWidth={1.5} /> })()}
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

              <Card variant="outlined" padding="none" className="rounded-xl px-5 py-4 flex flex-col gap-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                  Respuestas del cuestionario
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-0.5">P1 · Ámbito</p>
                    <p className="text-xs font-medium text-lean-black dark:text-warm-100 leading-tight">{scopeLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-0.5">P2 · Impacto en personas</p>
                    <p className="text-xs font-medium text-lean-black dark:text-warm-100">
                      {cls.personImpact === 'no'           ? 'No afecta a personas físicas'
                      : cls.personImpact === 'human_review' ? 'Sí, con revisión humana'
                      :                                       'Sí, de forma autónoma'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-0.5">P3 · Datos sensibles</p>
                    <p className="text-xs font-medium text-lean-black dark:text-warm-100">
                      {cls.sensitiveData
                        ? <span className="inline-flex items-center gap-1"><AlertTriangle size={12} strokeWidth={1.5} className="text-warning-dark" /> Sí — datos RGPD Art. 9</span>
                        : <span className="inline-flex items-center gap-1"><Check size={12} strokeWidth={1.5} className="text-success-dark" /> No</span>
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-0.5">P4 · Explicabilidad</p>
                    <p className="text-xs font-medium text-lean-black dark:text-warm-100">
                      {cls.explainability === 'yes'
                        ? <span className="inline-flex items-center gap-1"><Check size={12} strokeWidth={1.5} className="text-success-dark" /> Sistema explicable / trazable</span>
                        : <span className="inline-flex items-center gap-1"><X size={12} strokeWidth={1.5} className="text-danger-dark" /> Output opaco</span>
                      }
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="outlined" padding="none" className="rounded-xl px-5 py-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                  Obligaciones regulatorias aplicables
                </p>
                {cls.riskLevel === 'prohibido' && (
                  <div className="rounded-xl bg-danger-light dark:bg-danger/20 border border-danger-light dark:border-danger px-4 py-3">
                    <p className="text-xs font-semibold text-danger-dark dark:text-danger mb-1 flex items-center gap-1.5">
                      <Ban size={14} strokeWidth={1.5} className="shrink-0" />
                      {getLabel('ai_act_prohibited')}
                    </p>
                    <p className="text-[10px] text-danger-dark dark:text-danger leading-relaxed">
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
                  <p className="text-xs text-success-dark leading-relaxed flex items-start gap-1.5">
                    <Check size={14} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                    {getLabel('ai_act_no_obligations')}
                  </p>
                )}
              </Card>
            </div>
          )
        })()}

        {/* ── TAB: ECONOMÍA ──────────────────────────────────── */}
        {tab === 'economia' && (
          <EconomicsTab
            useCase={useCase}
            onEditingChange={(editing, dirty) => {
              setEditingEconomics(editing)
              setEconomicsIsDirty(dirty)
            }}
            saveRequested={economicsSaveRequested}
            onSaveRequestHandled={handleEconomicsSaveHandled}
          />
        )}

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

      <UnsavedChangesModal
        open={showUnsavedModal}
        onCancel={handleModalCancel}
        onDiscard={handleModalDiscard}
        message={
          `Tienes abierta la edición de ${editingEconomics ? 'datos económicos' : 'scoring'} de "${useCase.name}".`
        }
        onSave={hasUnsavedChanges ? handleModalSaveAndContinue : undefined}
        isSaving={isSavingScores}
      />
    </div>
  )
}

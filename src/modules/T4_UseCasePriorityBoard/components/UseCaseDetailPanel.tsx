import { useState } from 'react'
import { useT4Store } from '../store'
import { usePermissions } from '@/modules/Auth'
import {
  computePriorityScore,
  getGoNoGoRecommendation,
  AI_CATEGORY_HEX,
  DIMENSION_CONFIG,
  STATUS_CONFIG,
  STATUS_ORDER,
  ROADMAP_QUARTERS,
} from '../constants'
import type { UseCase, UseCaseStatus, UseCaseScores, AIActClassification } from '../types'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import { Button, Badge, Card, FormField, Tabs } from '@shared/design-system/components'
import { StatusBadge, CategoryBadge, priorityScoreColor } from './T4Badges'
import { PriorityMatrix } from './PriorityMatrix'
import { T4ScoreBars, ScoreInput } from './T4ScoreEditors'
import { EconomicsTab } from './EconomicsTab'
import { LowScoreRecommendations } from './LowScoreRecommendations'
import {
  AIACT_RISK_CONFIG,
  AIACT_SCOPE_LABELS,
  AIActClassificationModal,
} from './AIActClassificationModal'

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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setEditingScore(true); setLocalScores(useCase.scores) }}
                  >
                    ✎ Editar scores
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingScore(false)}>
                      Cancelar
                    </Button>
                    {!isReadOnly && (
                      <Button variant="primary" size="sm" onClick={handleSaveScores}>
                        Guardar
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {!editingScore ? (
                <>
                  <T4ScoreBars scores={useCase.scores} />
                  <Card variant="flat" padding="none" className="mt-5 rounded-2xl bg-warm-50 dark:bg-warm-800/40 border border-border dark:border-white/6 px-4 py-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
                      Score compuesto · ponderado
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                      {useCase.priorityScore.toFixed(1)}
                      <span className="text-sm font-normal text-text-subtle">/100</span>
                    </p>
                    <p className="text-[10px] text-text-subtle mt-0.5">
                      KPI 35% · facilidad 30% · riesgo IA 20% · dep. datos 15%
                    </p>
                  </Card>
                  <LowScoreRecommendations useCase={useCase} />
                </>
              ) : (
                <div className="flex flex-col gap-5 mt-2">
                  <p className="text-[10px] text-text-subtle">
                    Ajusta los scores del taller (0 = mínimo, 100 = máximo).
                    Para riesgo y dependencia de datos, valores altos indican mayor riesgo/dependencia.
                  </p>
                  <ScoreInput
                    label={DIMENSION_CONFIG.kpiImpact.label}
                    description="Mayor valor = mayor impacto en KPIs de negocio"
                    value={localScores.kpiImpact}
                    onChange={(v) => handleScoreChange('kpiImpact', v)}
                    hex={DIMENSION_CONFIG.kpiImpact.hex}
                  />
                  <ScoreInput
                    label={DIMENSION_CONFIG.feasibility.label}
                    description="Mayor valor = más fácil de implementar"
                    value={localScores.feasibility}
                    onChange={(v) => handleScoreChange('feasibility', v)}
                    hex={DIMENSION_CONFIG.feasibility.hex}
                  />
                  <ScoreInput
                    label={DIMENSION_CONFIG.aiRisk.label}
                    description="Mayor valor = mayor riesgo (peor para el score)"
                    value={localScores.aiRisk}
                    onChange={(v) => handleScoreChange('aiRisk', v)}
                    isNegative
                    hex={DIMENSION_CONFIG.aiRisk.hex}
                  />
                  <ScoreInput
                    label={DIMENSION_CONFIG.dataDependency.label}
                    description="Mayor valor = mayor dependencia bloqueante (peor)"
                    value={localScores.dataDependency}
                    onChange={(v) => handleScoreChange('dataDependency', v)}
                    isNegative
                    hex={DIMENSION_CONFIG.dataDependency.hex}
                  />
                  <Card variant="flat" padding="none" className="rounded-xl bg-navy/5 dark:bg-navy/10 px-4 py-2.5 border border-navy/10">
                    <p className="text-[10px] text-text-subtle">Preview score</p>
                    <p className={`text-xl font-bold tabular-nums ${priorityScoreColor(previewScore)}`}>
                      {previewScore.toFixed(1)}/100
                    </p>
                  </Card>
                </div>
              )}

              {useCase.stakeholderScores.length > 0 && !editingScore && (
                <div className="mt-6">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                    Scores por stakeholder
                  </p>
                  <div className="flex flex-col gap-2">
                    {useCase.stakeholderScores.map((ss) => (
                      <Card
                        key={ss.id}
                        variant="outlined"
                        padding="none"
                        className="rounded-xl px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-5 w-5 rounded-full bg-navy/10 dark:bg-navy/20 flex items-center justify-center text-[9px] font-bold text-navy dark:text-warm-100 shrink-0">
                            {ss.stakeholderName.charAt(0)}
                          </div>
                          <p className="text-xs font-semibold text-lean-black dark:text-gray-200">
                            {ss.stakeholderName}
                          </p>
                          <p className="text-[10px] text-text-subtle">{ss.stakeholderRole}</p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          {(['kpiImpact', 'feasibility', 'aiRisk', 'dataDependency'] as const).map((dim) => (
                            <div key={dim} className="flex items-center gap-1">
                              <span
                                className="text-[9px] text-text-subtle"
                                style={{ color: DIMENSION_CONFIG[dim].hex }}
                              >
                                {DIMENSION_CONFIG[dim].label.split(' ')[0]}:
                              </span>
                              <span className="text-[10px] font-bold text-lean-black dark:text-gray-200">
                                {ss.scores[dim]}
                              </span>
                            </div>
                          ))}
                        </div>
                        {ss.notes && (
                          <p className="text-[10px] text-text-subtle italic mt-1 leading-relaxed">
                            "{ss.notes}"
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {useCase.goNoGo && !editingScore && (
                <div
                  className={`mt-5 rounded-2xl px-4 py-3 border ${
                    useCase.goNoGo.decision === 'go'
                      ? 'border-success-dark/20 bg-success-light/8 dark:bg-success-dark/5'
                      : useCase.goNoGo.decision === 'no_go'
                      ? 'border-danger-dark/20 bg-danger-light/8'
                      : 'border-border dark:border-white/8 bg-warm-50 dark:bg-warm-800/40'
                  }`}
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
                    Decisión go/no-go
                  </p>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-xs font-bold ${
                        useCase.goNoGo.decision === 'go'    ? 'text-success-dark' :
                        useCase.goNoGo.decision === 'no_go' ? 'text-danger-dark'  : 'text-warning-dark'
                      }`}
                    >
                      {useCase.goNoGo.decision === 'go' ? '✓ GO' :
                       useCase.goNoGo.decision === 'no_go' ? '✕ NO-GO' : '◎ PENDIENTE'}
                    </span>
                    {useCase.goNoGo.decidedBy && (
                      <span className="text-[10px] text-text-subtle">· {useCase.goNoGo.decidedBy}</span>
                    )}
                  </div>
                  {useCase.goNoGo.rationale && (
                    <p className="text-[11px] text-text-muted leading-relaxed italic">
                      {useCase.goNoGo.rationale}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
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
        {tab === 'roadmap' && (() => {
          const rm = useCase.roadmap ?? {}
          function saveRoadmap(patch: Partial<typeof rm>) {
            updateUseCase(useCase.id, { roadmap: { ...rm, ...patch } as typeof useCase.roadmap })
          }
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                    Quarter de implementación
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(ROADMAP_QUARTERS as readonly string[]).map((q) => {
                      const isActive = rm.quarter === q
                      return (
                        <button
                          key={q}
                          onClick={() => saveRoadmap({ quarter: isActive ? undefined : q })}
                          className={[
                            'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                            isActive
                              ? 'bg-navy text-white border-navy shadow-sm'
                              : 'border-border dark:border-white/10 text-text-muted hover:border-navy/40 hover:text-lean-black dark:hover:text-gray-200',
                          ].join(' ')}
                        >
                          {q}
                        </button>
                      )
                    })}
                  </div>
                  {rm.quarter && (
                    <p className="mt-2 text-[10px] text-text-subtle">
                      Click en el quarter activo para quitar la asignación.
                    </p>
                  )}
                </div>

                <FormField
                  id="rm-duration"
                  label="Duración estimada"
                  value={rm.estimatedDuration ?? ''}
                  onChange={(e) => saveRoadmap({ estimatedDuration: e.target.value || undefined })}
                  placeholder="ej. 6 semanas, 3 meses…"
                />

                <FormField
                  id="rm-start-date"
                  label="Fecha de inicio"
                  type="date"
                  value={rm.startDate ?? ''}
                  onChange={(e) => saveRoadmap({ startDate: e.target.value || undefined })}
                  hint="Si se especifica, tiene prioridad sobre el quarter en el Roadmap T9."
                />

                <FormField
                  id="rm-end-date"
                  label="Fecha de fin"
                  type="date"
                  value={rm.endDate ?? ''}
                  onChange={(e) => saveRoadmap({ endDate: e.target.value || undefined })}
                />

                <FormField
                  id="rm-owner"
                  label="Responsable de implementación"
                  value={rm.owner ?? ''}
                  onChange={(e) => saveRoadmap({ owner: e.target.value || undefined })}
                  placeholder="Nombre o rol responsable…"
                />
              </div>

              <div className="flex flex-col gap-6">
                <FormField
                  id="rm-next-steps"
                  label="Próximos pasos"
                  multiline
                  rows={4}
                  value={rm.nextSteps ?? ''}
                  onChange={(e) => saveRoadmap({ nextSteps: e.target.value || undefined })}
                  placeholder="Acciones concretas para arrancar este caso de uso…"
                />

                <FormField
                  id="rm-dependencies"
                  label="Dependencias"
                  multiline
                  rows={3}
                  value={rm.dependencies ?? ''}
                  onChange={(e) => saveRoadmap({ dependencies: e.target.value || undefined })}
                  placeholder="Dependencias con otros casos de uso, sistemas o equipos…"
                />

                {useCase.notes && (
                  <Card variant="flat" padding="none" className="rounded-2xl bg-warm-50 dark:bg-warm-800/40 border border-border dark:border-white/6 px-4 py-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                      Notas del consultor
                    </p>
                    <p className="text-xs text-text-muted leading-relaxed italic">{useCase.notes}</p>
                  </Card>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── TAB: CONTEXTO T1/T2 ──────────────────────────────── */}
        {tab === 'contexto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-navy/10 dark:bg-navy/20 flex items-center justify-center text-xs font-bold text-navy dark:text-warm-100">
                  T1
                </div>
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">
                  Contexto de madurez IA (T1)
                </p>
              </div>
              {useCase.t1Context ? (
                <>
                  {useCase.t1Context.relevantDimensions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-mono text-text-subtle mb-1.5">Dimensiones relevantes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {useCase.t1Context.relevantDimensions.map((d) => (
                          <Badge key={d} shape="pill" size="xs" style={{ backgroundColor: 'rgba(42,40,34,0.08)', color: '#2A2822' }}>
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {useCase.t1Context.maturityNotes && (
                    <p className="text-xs text-text-muted leading-relaxed">{useCase.t1Context.maturityNotes}</p>
                  )}
                </>
              ) : autoT1Context ? (
                <>
                  <p className="text-[10px] font-mono text-text-subtle mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-navy/40 inline-block" />
                    Auto-calculado desde T1 · {autoT1Context.total} dimensiones evaluadas
                  </p>
                  {autoT1Context.weakDimensions.length > 0 ? (
                    <div className="mb-2">
                      <p className="text-[10px] font-mono text-warning-dark mb-1.5">Dimensiones con madurez baja (≤2)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {autoT1Context.weakDimensions.map((d) => (
                          <Badge key={d} variant="warning" shape="pill" size="xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-success-dark">✓ Madurez IA suficiente en todas las dimensiones</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-text-subtle italic">Sin datos de T1. Completa el Madurez Radar primero.</p>
              )}
            </Card>

            <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-info-light flex items-center justify-center text-xs font-bold text-info-dark">
                  T2
                </div>
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">
                  Contexto de stakeholders (T2)
                </p>
              </div>
              {useCase.t2Context ? (
                <div className="flex flex-col gap-3">
                  {useCase.t2Context.championArchetype && (
                    <div>
                      <p className="text-[10px] font-mono text-text-subtle mb-0.5">Champion</p>
                      <p className="text-xs font-medium text-success-dark">✓ {useCase.t2Context.championArchetype}</p>
                    </div>
                  )}
                  {useCase.t2Context.blockerArchetypes?.length ? (
                    <div>
                      <p className="text-[10px] font-mono text-text-subtle mb-0.5">Posibles bloqueos</p>
                      {useCase.t2Context.blockerArchetypes.map((b) => (
                        <p key={b} className="text-xs font-medium text-danger-dark">▲ {b}</p>
                      ))}
                    </div>
                  ) : null}
                  {useCase.t2Context.stakeholderNotes && (
                    <p className="text-xs text-text-muted leading-relaxed">{useCase.t2Context.stakeholderNotes}</p>
                  )}
                </div>
              ) : autoT2Context ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-mono text-text-subtle flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-navy/40 inline-block" />
                    Auto-calculado desde T2 · {autoT2Context.champions.length + autoT2Context.blockers.length} stakeholders relevantes
                  </p>
                  {autoT2Context.champions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-success-dark mb-1">Champions potenciales</p>
                      {autoT2Context.champions.map((s) => (
                        <p key={s.id} className="text-xs font-medium text-success-dark">✓ {s.name} · {s.role}</p>
                      ))}
                    </div>
                  )}
                  {autoT2Context.blockers.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-danger-dark mb-1">Posibles bloqueos</p>
                      {autoT2Context.blockers.map((s) => (
                        <p key={s.id} className="text-xs font-medium text-danger-dark">▲ {s.name} · {s.role}</p>
                      ))}
                    </div>
                  )}
                  {autoT2Context.champions.length === 0 && autoT2Context.blockers.length === 0 && (
                    <p className="text-xs text-text-muted">Sin perfiles críticos detectados en T2</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-subtle italic">Sin datos de T2. Completa la Stakeholder Matrix primero.</p>
              )}
            </Card>

            <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: catHex }} />
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">Categoría IA</p>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: catHex }}>
                {useCase.aiCategory}
              </p>
              {useCase.importedFromT3 && (
                <div className="mt-2">
                  <p className="text-[10px] font-mono text-text-subtle mb-0.5">Proceso origen (T3)</p>
                  <p className="text-xs text-text-muted">{useCase.importedFromT3.processName}</p>
                  <p className="text-[10px] text-text-subtle mt-0.5">
                    Opp. score T3: <span className="font-bold">{useCase.importedFromT3.opportunityScore.toFixed(2)}/4.0</span>
                  </p>
                </div>
              )}
            </Card>
          </div>
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

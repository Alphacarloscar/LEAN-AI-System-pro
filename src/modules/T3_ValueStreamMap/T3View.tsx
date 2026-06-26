// ============================================================
// T3 — Value Stream Map
//
// Layout: 3 zonas verticales
//   1. HERO — Opportunity Matrix + Category Donut (interactivos)
//   2. BANNER — KPI de fases + lista de procesos (cards clicables)
//   3. DETALLE — Se despliega al seleccionar un proceso
// ============================================================

import { useState, useMemo, useEffect }    from 'react'
import { useNavigate, useParams }          from 'react-router-dom'
import { Button, Badge, Card, ToolHeader } from '@shared/design-system/components'
import { useT3Store }                      from './store'
import { useEngagementStore }              from '@/modules/Engagement/store'
import { useCompanyProfileStore }          from '@/modules/CompanyProfile/store'
import { useDepartmentStore }              from '@/modules/CompanyProfile/useDepartmentStore'
import { getProjectCompanyId }             from '@/services/projects.service'
import { PHASE_CONFIG, OPPORTUNITY_CONFIG, AI_CATEGORY_CONFIG } from './constants'
import { HeroOpportunityMatrix }           from './components/HeroOpportunityMatrix'
import { HeroCategoryDonut }               from './components/HeroCategoryDonut'
import { ProcessDetailPanel }              from './components/ProcessDetailPanel'
import { ProcessInterviewModal }           from './components/ProcessInterviewModal'
import { CAT_HEX, CAT_ORDER } from './components/T3Badges.constants'
import { PhaseBadge } from './components/T3Badges'
import { PhaseMiniMap }                    from '@/shared/components/PhaseMiniMap'
import { isDemoEnabled }                   from '@/lib/config'
import { usePermissions }                  from '@/modules/Auth'
import { ViewerEmptyState }                from '@/shared/components/ViewerEmptyState'
import type { ValueStream, ProcessPhase }  from './types'

const ALL_PHASES: ProcessPhase[] = ['idea', 'validacion', 'piloto', 'estandarizacion', 'escalado']

interface T3ViewProps {
  onBack?: () => void
}

export function T3View({ onBack }: T3ViewProps) {
  const navigate = useNavigate()
  const {
    processes, addProcess, initDemo, ensureLoaded,
    isLoading: isLoadingT3, hasData: hasDataT3, loadError: loadErrorT3,
  } = useT3Store()
  const { engagementId: urlId } = useParams<{ engagementId: string }>()
  const storeId                 = useEngagementStore((s) => s.activeEngagementId)
  const engagementId            = urlId ?? storeId
  const { fetchDepartments, reset: resetDepartments } = useDepartmentStore()
  const companyName  = useCompanyProfileStore((s) => s.profile.engagementName)
  const loadProfile  = useCompanyProfileStore((s) => s.loadProfile)
  const { isReadOnly } = usePermissions()

  useEffect(() => {
    if (engagementId) {
      ensureLoaded(engagementId, { reason: 'route_mount' })
      void loadProfile(engagementId)
    } else if (isDemoEnabled) {
      initDemo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  useEffect(() => {
    if (!engagementId) return
    let cancelled = false
    getProjectCompanyId(engagementId).then((companyId) => {
      if (cancelled || !companyId) return
      fetchDepartments(companyId)
    })
    return () => {
      cancelled = true
      resetDepartments()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  const [activeId,     setActiveId]     = useState<string | null>(null)
  const [showModal,    setShowModal]    = useState(false)
  const [filterPhase,  setFilterPhase]  = useState<ProcessPhase | null>(null)

  const activeProcess = useMemo(
    () => processes.find((p) => p.id === activeId) ?? null,
    [processes, activeId],
  )

  const filtered = useMemo(
    () => processes
      .filter((p) => !filterPhase || p.phase === filterPhase)
      .sort((a, b) => (b.interview?.opportunityScore ?? 0) - (a.interview?.opportunityScore ?? 0)),
    [processes, filterPhase],
  )

  const phaseCount = Object.fromEntries(
    ALL_PHASES.map((ph) => [ph, processes.filter((p) => p.phase === ph).length]),
  ) as Record<ProcessPhase, number>

  const totalCritica = processes.filter((p) => p.opportunityLevel === 'critica').length
  const totalAlta    = processes.filter((p) => p.opportunityLevel === 'alta').length

  function handleAddProcess(p: Omit<ValueStream, 'id' | 'createdAt'>) {
    addProcess(p, engagementId)
    setShowModal(false)
  }

  function handleSelectProcess(id: string) {
    setActiveId((prev) => prev === id ? null : id)
  }

  return (
    <div className="flex flex-col bg-surface dark:bg-warm-950 min-h-screen">

      {/* ── HEADER ── */}
      <ToolHeader
        sticky
        onBack={() => onBack ? onBack() : navigate('/')}
        toolCode="T3"
        title="Value Stream Map"
        subtitle={companyName}
        phaseMiniMap={<PhaseMiniMap phaseId="listen" toolCode="T3" />}
        chips={
          <div className="hidden md:flex items-center gap-5">
            {[
              { label: 'Opp crítica', value: hasDataT3 ? totalCritica : null, color: 'text-navy dark:text-warm-100' },
              { label: 'Opp alta',    value: hasDataT3 ? totalAlta    : null, color: 'text-info-dark' },
              { label: 'Total',       value: hasDataT3 ? processes.length : null, color: 'text-lean-black dark:text-warm-50' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold tabular-nums leading-none ${color}`}>
                  {value === null ? <span className="text-text-subtle text-base">—</span> : value}
                </p>
                <p className="text-[9px] text-text-subtle mt-0.5 whitespace-nowrap">{label}</p>
              </div>
            ))}
          </div>
        }
        cta={!isReadOnly ? (
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            + Proceso
          </Button>
        ) : undefined}
      />

      {/* ── Carga inicial ── */}
      {isLoadingT3 && !hasDataT3 && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-navy/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-xs text-text-muted">Cargando Value Stream Map…</p>
          </div>
        </div>
      )}

      {/* ── Error sin datos ── */}
      {!isLoadingT3 && !hasDataT3 && loadErrorT3 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-12 w-12 rounded-xl bg-danger-light dark:bg-danger/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-lean-black dark:text-warm-50 mb-1">Error al cargar los datos</p>
            <p className="text-xs text-text-subtle max-w-xs leading-relaxed mb-4">
              {loadErrorT3 === 'timeout' ? 'La conexión tardó demasiado. Revisa tu conexión a Supabase.' : 'No se pudieron cargar los procesos.'}
            </p>
            {engagementId && (
              <Button variant="primary" size="sm" onClick={() => ensureLoaded(engagementId, { force: true, reason: 'retry' })}>
                Reintentar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── 0 procesos ── */}
      {!isLoadingT3 && hasDataT3 && processes.length === 0 && !isReadOnly && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-12 w-12 rounded-xl bg-warm-100 dark:bg-warm-700 flex items-center justify-center text-2xl">◎</div>
          <p className="text-sm font-bold text-text-muted">No hay procesos todavía</p>
          <p className="text-xs text-text-subtle max-w-xs leading-relaxed text-center">
            Añade el primer proceso para comenzar el análisis de oportunidades IA.
          </p>
          <Button variant="primary" size="sm" className="mt-2" onClick={() => setShowModal(true)}>
            + Añadir primer proceso
          </Button>
        </div>
      )}

      {/* ── Contenido principal ── */}
      <div className={!hasDataT3 ? 'hidden' : ''}>

        {isLoadingT3 && (
          <div className="max-w-7xl mx-auto px-8 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-text-subtle">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Actualizando datos…
            </div>
          </div>
        )}

        <div className="flex-1 max-w-7xl mx-auto w-full px-8">

          {/* ZONA 1: HERO CHARTS */}
          <div className="py-8">
            <div className="grid grid-cols-2 gap-6 items-stretch">
              <Card variant="outlined" padding="none" className="rounded-xl p-6 flex flex-col">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mb-3">Matriz de oportunidad</p>
                <div className="flex-1 flex items-center justify-center">
                  <HeroOpportunityMatrix processes={filtered} activeId={activeId} onSelect={handleSelectProcess} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {CAT_ORDER.filter((c) => processes.some((p) => p.aiCategory === c)).map((c) => {
                    const cfg = AI_CATEGORY_CONFIG[c]
                    return (
                      <div key={c} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${cfg.dotBg} shrink-0`} />
                        <span className="text-[10px] text-text-subtle">{cfg.label}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card variant="outlined" padding="none" className="rounded-xl p-6 flex flex-col">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mb-3">Distribución por categoría IA</p>
                <div className="flex-1 flex items-center justify-center">
                  <HeroCategoryDonut processes={processes} activeId={activeId} onSelect={handleSelectProcess} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {CAT_ORDER.filter((c) => processes.some((p) => p.aiCategory === c)).map((c) => {
                    const cfg = AI_CATEGORY_CONFIG[c]
                    return (
                      <div key={c} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${cfg.dotBg} shrink-0`} />
                        <span className="text-[10px] text-text-subtle">{cfg.label}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>

          {/* ZONA 2: BANNER DE PROCESOS */}
          <div className="border-t border-border dark:border-white/6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mr-2 shrink-0">
                Procesos mapeados · {processes.length}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {ALL_PHASES.map((ph) => {
                  const cfg = PHASE_CONFIG[ph]
                  const cnt = phaseCount[ph]
                  return (
                    <button key={ph} onClick={() => setFilterPhase(filterPhase === ph ? null : ph)}
                      className={[
                        'flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border transition-all',
                        filterPhase === ph
                          ? `${cfg.badgeBg} ${cfg.badgeText} border-transparent`
                          : 'bg-transparent border-border dark:border-white/10 text-text-muted hover:border-warm-300',
                      ].join(' ')}>
                      <span className="tabular-nums font-bold">{cnt}</span>
                      <span>{cfg.label}</span>
                    </button>
                  )
                })}
                {filterPhase && (
                  <Button variant="link" className="text-[10px] ml-1" onClick={() => setFilterPhase(null)}>
                    Limpiar filtros ×
                  </Button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              isReadOnly ? <ViewerEmptyState /> : (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-warm-100 dark:bg-warm-700 flex items-center justify-center text-2xl">◎</div>
                  <p className="text-sm font-bold text-text-muted">Sin procesos mapeados</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filtered.map((p) => {
                  const isActive = p.id === activeId
                  const catCfg   = AI_CATEGORY_CONFIG[p.aiCategory]
                  const oppCfg   = OPPORTUNITY_CONFIG[p.opportunityLevel]

                  return (
                    <button key={p.id} onClick={() => handleSelectProcess(p.id)}
                      className={[
                        'w-full text-left rounded-xl px-4 py-3 transition-all duration-150 border flex flex-col gap-2',
                        isActive
                          ? 'border-navy/40 bg-navy/5 dark:bg-navy/10 shadow-sm ring-1 ring-navy/20'
                          : 'border-border dark:border-white/6 bg-white dark:bg-warm-800 hover:border-warm-300 dark:hover:border-white/14 hover:shadow-sm',
                      ].join(' ')}>
                      <div className="flex items-start gap-2.5">
                        <div className="shrink-0 w-1 h-6 rounded-full mt-0.5"
                          style={{ backgroundColor: CAT_HEX[p.aiCategory], opacity: isActive ? 1 : 0.6 }} />
                        <p className="flex-1 text-xs font-bold text-lean-black dark:text-warm-200 leading-tight line-clamp-2">{p.name}</p>
                        <span className={`shrink-0 text-text-subtle text-[10px] transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`}>↓</span>
                      </div>
                      <p className="text-[10px] text-text-subtle truncate pl-3.5">{p.department}</p>
                      <div className="flex items-center gap-1 flex-wrap pl-3.5">
                        <PhaseBadge phase={p.phase} />
                        <Badge
                          shape="pill"
                          size="xs"
                          style={{ backgroundColor: `${CAT_HEX[p.aiCategory]}22`, color: CAT_HEX[p.aiCategory] }}
                        >
                          {catCfg.label.split(' ')[0]}
                        </Badge>
                        {p.interview && (
                          <span className={`ml-auto text-xs font-bold tabular-nums ${oppCfg.badgeText}`}>
                            {p.interview.opportunityScore.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ZONA 3: DETALLE */}
        {activeProcess && (
          <div className="max-w-7xl mx-auto w-full px-8 pb-16">
            <ProcessDetailPanel process={activeProcess} />
          </div>
        )}

      </div>

      {showModal && (
        <ProcessInterviewModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddProcess}
        />
      )}
    </div>
  )
}

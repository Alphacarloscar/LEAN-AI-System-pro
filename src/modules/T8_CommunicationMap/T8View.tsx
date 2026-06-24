// ============================================================
// T8 — Communication Map (prescriptivo)
//
// Genera un plan de comunicación completo basado en:
//   - T2: stakeholders (arquetipo, resistencia, departamento)
//   - T4: casos de uso priorizados (go/no-go, names)
//   - Rogers segments (misma lógica que T7)
//
// 4 tabs:
//   1. Timeline de comunicación (3 fases × sprint 6M)
//   2. Mensajes por arquetipo (prescriptivos, basados en T2)
//   3. Materiales descargables (plantillas con datos reales)
//   4. Kit por departamento (readiness + acciones concretas)
// ============================================================

import { useState, useMemo, useEffect }  from 'react'
import { useNavigate, useParams }        from 'react-router-dom'
import { useT2Store }                    from '@/modules/T2_StakeholderMatrix/store'
import { useT4Store }                   from '@/modules/T4_UseCasePriorityBoard/store'
import { PhaseMiniMap }                 from '@/shared/components/PhaseMiniMap'
import { useCompanyProfileStore }       from '@/modules/CompanyProfile/store'
import { useEngagementStore }           from '@/modules/Engagement/store'
import { RecommendationPanel }          from '@/components/RecommendationPanel'
import { buildT8RecommendationContext, buildT8CommContext } from './t8ContextBuilder'
import { useT8Store }                   from './store'
import { useT8Generation }              from '@/hooks/useT8Generation'
import { PersistenceBanner }           from '@/shared/components/PersistenceBanner'
import { usePermissions }              from '@/modules/Auth'
import { generateCommPlan, generateArchetypeMessages, generateMaterials, generateDeptKits } from './T8Generators'
import { Tabs, Button, Card, ToolHeader, EmptyState } from '@shared/design-system/components'
import { TimelineTab }                 from './components/T8TimelineTab'
import { ArchetypeMessagesTab }        from './components/T8ArchetypeMessagesTab'
import { MaterialsTab }                from './components/T8MaterialsTab'
import { DeptKitTab }                  from './components/T8DeptKitTab'
import type { ArchetypeMessage }       from './types'

// ── T8View — Componente principal ─────────────────────────────

interface T8ViewProps {
  onBack: () => void
}

export function T8View({ onBack }: T8ViewProps) {
  const navigate                    = useNavigate()
  const { isReadOnly } = usePermissions()
  const stakeholders                = useT2Store(s => s.stakeholders)
  const loadT2                      = useT2Store(s => s.load)
  const isLoadingT2                 = useT2Store(s => s.isLoading)
  const t2Error                     = useT2Store(s => s.lastError)
  const useCases                    = useT4Store(s => s.useCases)
  const ensureLoadedT4              = useT4Store(s => s.ensureLoaded)
  const { profile: companyProfile } = useCompanyProfileStore()
  const companyName                 = companyProfile.engagementName
  const loadProfile                 = useCompanyProfileStore(s => s.loadProfile)
  const { engagementId: urlId }     = useParams<{ engagementId: string }>()
  const storeId                     = useEngagementStore((s) => s.activeEngagementId)
  const engagementId                = urlId ?? storeId
  const [activeTab, setActiveTab]  = useState<'timeline' | 'messages' | 'materials' | 'dept'>('timeline')

  // Cargar T2 al montar T8 (por si el usuario llega directamente sin pasar por T2).
  // Intencional: solo re-ejecutar cuando cambia el engagement, no cuando llegan los datos.
  // stable Zustand action (loadT2); stakeholders.length omitida intencionalmente para evitar
  // re-fetch en cada actualización de la lista — el guard `=== 0` cubre la lógica necesaria
  useEffect(() => {
    if (!engagementId) return
    if (stakeholders.length === 0) loadT2(engagementId)
    // Garantiza casos de uso reales aunque el usuario no haya pasado por T4
    void ensureLoadedT4(engagementId, { reason: 't8-mount' })
    void loadProfile(engagementId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  // T8 store — contenido generado por LLM (scoped al engagement)
  const { generatedContent, clearGeneratedContent, syncEngagement: syncT8, persistenceStatus, persistenceError, retrySave } = useT8Store()
  // stable Zustand action — mount-only: sincronizar al cambiar engagement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { syncT8(engagementId) }, [engagementId])

  // Hook de generación
  const { generate, isGenerating, error } = useT8Generation()

  // Contexto para la generación LLM
  const t8CommContext = useMemo(
    () => companyProfile
      ? buildT8CommContext(stakeholders, useCases, companyProfile, companyName)
      : null,
    [stakeholders, useCases, companyProfile, companyName],
  )

  // Casos de uso con decisión "go"
  const goUseCases = useMemo(
    () => useCases.filter(uc => uc.goNoGo?.decision === 'go').map(uc => uc.name),
    [useCases]
  )

  // Contenido — LLM si existe, estático como fallback
  const commActions       = useMemo(() => generateCommPlan(stakeholders, companyName, goUseCases), [stakeholders, companyName, goUseCases])
  const archetypeMessages = useMemo(
    () => (generatedContent?.archetypeMessages ?? generateArchetypeMessages(stakeholders)) as ArchetypeMessage[],
    [generatedContent, stakeholders]
  )
  const materials = useMemo(
    () => generateMaterials(companyName, goUseCases),
    [companyName, goUseCases]
  )
  const deptKits = useMemo(
    () => generateDeptKits(stakeholders),
    [stakeholders]
  )

  const t8LLMContext = useMemo(
    () => companyProfile
      ? buildT8RecommendationContext(commActions, archetypeMessages, companyProfile)
      : null,
    [commActions, archetypeMessages, companyProfile],
  )

  // Stats summary
  const totalActions  = commActions.length
  const highPriority  = commActions.filter(a => a.priority === 'alta').length
  const deptCount     = new Set(stakeholders.map(s => s.department)).size
  const isLLM         = !!generatedContent

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Header ── */}
      <ToolHeader
        onBack={onBack}
        backLabel="Volver al dashboard"
        toolCode="T8"
        title="Communication Map"
        subtitle={<p className="text-xs text-text-muted">{companyName} · Plan de comunicación</p>}
        phaseMiniMap={<PhaseMiniMap phaseId="activate" toolCode="T8" />}
        maxWidth="max-w-5xl"
        chips={
          <div className="flex items-center gap-3 flex-wrap">
            <Card variant="flat" padding="none" className="text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-warm-700 border border-border dark:border-white/6">
              <p className="text-lg font-bold text-lean-black dark:text-warm-50 tabular-nums">{totalActions}</p>
              <p className="text-[10px] text-text-subtle uppercase tracking-wide">Acciones</p>
            </Card>
            <Card variant="flat" padding="none" className="text-center px-3 py-2 rounded-lg bg-danger-light border border-danger-light">
              <p className="text-lg font-bold text-danger-dark tabular-nums">{highPriority}</p>
              <p className="text-[10px] text-danger-dark uppercase tracking-wide">Prioridad alta</p>
            </Card>
            <Card variant="flat" padding="none" className="text-center px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-lg font-bold text-indigo-700 tabular-nums">{goUseCases.length}</p>
              <p className="text-[10px] text-indigo-600 uppercase tracking-wide">Casos go</p>
            </Card>
            <Card variant="flat" padding="none" className="text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-warm-700 border border-border dark:border-white/6">
              <p className="text-lg font-bold text-lean-black dark:text-warm-50 tabular-nums">{deptCount}</p>
              <p className="text-[10px] text-text-subtle uppercase tracking-wide">Dptos.</p>
            </Card>
          </div>
        }
        cta={
          <div className="flex items-center gap-2">
            {isLLM && (
              <>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy/8 dark:bg-navy/20 border border-navy/20 text-[10px] font-semibold text-navy dark:text-warm-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-navy animate-pulse" />
                  Personalizado con IA · {generatedContent?.generatedAt
                    ? new Date(generatedContent.generatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
                {!isReadOnly && (
                  <Button variant="ghost" size="sm" onClick={clearGeneratedContent}>
                    Restaurar plantilla
                  </Button>
                )}
              </>
            )}
            {error && (
              <span className="text-xs text-danger-dark">{error}</span>
            )}
            {(persistenceStatus === 'error' || persistenceStatus === 'saving') && (
              <PersistenceBanner
                error={persistenceError}
                isRetrying={persistenceStatus === 'saving'}
                onRetry={() => engagementId && retrySave(engagementId)}
              />
            )}
            {!isReadOnly && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => t8CommContext && generate(t8CommContext as unknown as Record<string, unknown>, engagementId)}
                disabled={!t8CommContext || !engagementId || isGenerating}
                loading={isGenerating}
                icon={<svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.4 1.4M8.1 8.1l1.4 1.4M2.5 9.5l1.4-1.4M8.1 3.9l1.4-1.4"/></svg>}
              >
                {isGenerating ? 'Generando…' : isLLM ? 'Regenerar con IA' : 'Personalizar con IA'}
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-5xl mx-auto space-y-6 px-8 py-8">

      {/* Banner no bloqueante — stakeholders pendientes o error */}
      {(isLoadingT2 || t2Error || (!isLoadingT2 && stakeholders.length === 0)) && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600/40 px-4 py-3">
          <svg className="mt-0.5 shrink-0 text-amber-500" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M8 6v3.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {isLoadingT2 ? 'Cargando stakeholders…' : t2Error ? 'Error al cargar stakeholders.' : 'Stakeholders no cargados.'}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">
              {isLoadingT2
                ? 'La vista se actualizará automáticamente cuando terminen de cargar.'
                : t2Error
                  ? 'No se pudieron cargar los stakeholders. Comprueba tu conexión e inténtalo de nuevo.'
                  : 'Puedes ir a T2 para añadir stakeholders, reintentar la carga o continuar con datos vacíos.'}
            </p>
          </div>
          {!isLoadingT2 && engagementId && (
            <button
              onClick={() => loadT2(engagementId)}
              className="shrink-0 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:underline"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        aria-label="Communication map"
        value={activeTab}
        onChange={(v) => setActiveTab(v as typeof activeTab)}
        tabs={[
          { value: 'timeline',  label: 'Timeline 6M',          badge: String(totalActions) },
          { value: 'messages',  label: 'Mensajes por arquetipo',badge: String(archetypeMessages.length) },
          { value: 'materials', label: 'Materiales',            badge: String(materials.length) },
          { value: 'dept',      label: 'Kit por departamento',  badge: String(deptKits.length) },
        ]}
      />

      {/* Contenido */}
      {stakeholders.length === 0 ? (
        <EmptyState
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="7" r="3"/>
              <path d="M2 18v-1a5 5 0 0110 0v1"/>
              <circle cx="15" cy="7" r="2"/>
              <path d="M18 18v-1a3 3 0 00-4-2.8"/>
            </svg>
          }
          title="Sin stakeholders registrados"
          description="Completa T2 — AI Stakeholder Matrix para mapear al equipo antes de construir el plan de comunicación."
          action={<Button variant="ghost" size="sm" onClick={() => navigate(engagementId ? `/t2/${engagementId}` : '/t2')}>Ir a T2</Button>}
          className="py-12"
        />
      ) : (
        <>
          {activeTab === 'timeline'  && <TimelineTab actions={commActions} />}
          {activeTab === 'messages'  && <ArchetypeMessagesTab messages={archetypeMessages} />}
          {activeTab === 'materials' && <MaterialsTab materials={materials} />}
          {activeTab === 'dept'      && <DeptKitTab kits={deptKits} />}
        </>
      )}

      {/* ── RECOMENDACIONES IA ──────────────────────────────── */}
      {t8LLMContext && stakeholders.length > 0 && (
        <RecommendationPanel
          tool="t8"
          title="Recomendaciones IA — Plan de Comunicación"
          subtitle="Generadas por Claude · Específicas para este mapa de comunicación"
          context={t8LLMContext}
          engagementId={engagementId}
        />
      )}
      </div>
    </div>
  )
}

// ============================================================
// T5 — AI Domain Architecture Canvas
// ============================================================

import { useState, useMemo, useEffect }   from 'react'
import { useCompanyProfileStore }         from '@/modules/CompanyProfile/store'
import { useEngagementStore }             from '@/modules/Engagement/store'
import { RecommendationPanel }            from '@/components/RecommendationPanel'
import { buildT5RecommendationContext }   from './t5ContextBuilder'
import type { T5DomainCode, T5DomainScores } from './types'
import { useT5Store }    from './store'
import { useT3Store }    from '@/modules/T3_ValueStreamMap'
import { PhaseMiniMap }  from '@/shared/components/PhaseMiniMap'
import { isDemoEnabled } from '@/lib/config'

import { MaturityBadge }        from './components/MaturityBadge'
import { DomainCard }           from './components/DomainCard'
import { EditModal }            from './components/EditModal'
import { DomainProjectsModal }  from './components/DomainProjectsModal'
import { PortfolioMatrix }      from './components/PortfolioMatrix'
import { ActivationSequence }   from './components/ActivationSequence'

// ── Main View ─────────────────────────────────────────────────

export function T5View({
  onBack,
}: {
  onBack: () => void
}) {
  const { canvas, updateDomainScores, syncEngagement: syncT5 } = useT5Store()
  const processes                       = useT3Store(s => s.processes)
  const loadT3                          = useT3Store(s => s.load)
  const initT3Demo                      = useT3Store(s => s.initDemo)
  const { profile: companyProfile }     = useCompanyProfileStore()
  const companyName                     = companyProfile.engagementName
  const engagementId                    = useEngagementStore((s) => s.activeEngagementId)

  // F-02: sincronizar canvas con el engagement activo
  useEffect(() => { syncT5(engagementId) }, [engagementId])

  // Carga T3 si no hay procesos
  useEffect(() => {
    if (processes.length === 0) {
      if (engagementId)       loadT3(engagementId)
      else if (isDemoEnabled) initT3Demo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  const [selectedDomain,  setSelectedDomain]  = useState<T5DomainCode>('automatizacion_inteligente')
  const [editingDomain,   setEditingDomain]    = useState<T5DomainCode | null>(null)
  const [projectsDomain,  setProjectsDomain]   = useState<T5DomainCode | null>(null)

  const t5LLMContext = useMemo(
    () => companyProfile ? buildT5RecommendationContext(canvas, companyProfile) : null,
    [canvas, companyProfile],
  )

  return (
    <div className="max-w-[1200px] mx-auto space-y-5 px-8 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Volver
          </button>
          <div className="w-px h-5 bg-border" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white">
                T5
              </span>
              <h1 className="text-lg font-semibold text-lean-black dark:text-gray-100">
                AI Domain Architecture Canvas
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-text-subtle">{companyName}</p>
              <PhaseMiniMap phaseId="evaluate" toolCode="T5" />
            </div>
          </div>
        </div>
        <MaturityBadge level={canvas.maturityLevel} />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-12 gap-5 items-start">
        <div className="col-span-7">
          <PortfolioMatrix
            canvas={canvas}
            processes={processes}
            selectedDomain={selectedDomain}
            onSelectDomain={setSelectedDomain}
          />
        </div>
        <div className="col-span-5">
          <DomainCard
            assessment={canvas.domains[selectedDomain]}
            onEdit={() => setEditingDomain(selectedDomain)}
          />
        </div>
      </div>

      {/* ── Activation sequence ── */}
      <ActivationSequence
        canvas={canvas}
        onCardClick={setProjectsDomain}
      />

      {/* ── Modals ── */}
      {editingDomain && (
        <EditModal
          domainCode={editingDomain}
          assessment={canvas.domains[editingDomain]}
          onSave={(scores: T5DomainScores) => {
            updateDomainScores(editingDomain, scores)
            setEditingDomain(null)
          }}
          onCancel={() => setEditingDomain(null)}
        />
      )}

      {projectsDomain && (
        <DomainProjectsModal
          domainCode={projectsDomain}
          onClose={() => setProjectsDomain(null)}
        />
      )}

      {/* ── Recomendaciones IA ── */}
      {t5LLMContext && (
        <RecommendationPanel
          tool="t5"
          title="Recomendaciones IA — Arquitectura de Dominios"
          subtitle="Generadas por Claude · Específicas para este canvas"
          context={t5LLMContext}
          engagementId={engagementId}
        />
      )}
    </div>
  )
}

// ============================================================
// DebugPanel — Panel de diagnóstico flotante
//
// SOLO visible en entornos de desarrollo (import.meta.env.DEV).
// Muestra el estado crítico de la app para diagnosticar
// problemas de carga de stores y contexto de proyecto.
//
// Sprint 9 — Fix estructural arquitectura de carga
// ============================================================

import { useState }                  from 'react'
import { useEngagementStore }        from '@/modules/Engagement/store'
import { useCompanyProfileStore }    from '@/modules/CompanyProfile/store'
import { useT1Store }                from '@/modules/T1_MaturityRadar/store'
import { useT2Store }                from '@/modules/T2_StakeholderMatrix/store'
import { useT3Store }                from '@/modules/T3_ValueStreamMap/store'
import { useT4Store }                from '@/modules/T4_UseCasePriorityBoard/store'

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={[
        'inline-block w-2 h-2 rounded-full shrink-0',
        ok ? 'bg-green-400' : 'bg-amber-400 animate-pulse',
      ].join(' ')}
    />
  )
}

function Row({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <StatusDot ok={!loading} />
      <span className="text-[10px] text-white/50 shrink-0">{label}</span>
      <span className="text-[10px] font-mono text-white/90 truncate">{value}</span>
    </div>
  )
}

export function DebugPanel() {
  const [minimized, setMinimized] = useState(false)

  const { activeEngagementId }                      = useEngagementStore()
  const { profile, isLoadingData: loadingProfile }  = useCompanyProfileStore()
  const { isLoading: loadingT1 }                    = useT1Store()
  const { isLoading: loadingT2 }                    = useT2Store()
  const { isLoading: loadingT3 }                    = useT3Store()
  const { isLoading: loadingT4 }                    = useT4Store()

  const companyName   = profile.engagementName || '—'
  const nameSource    = loadingProfile ? 'cargando…' : profile.engagementName ? 'Supabase' : 'vacío'

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[9999] bg-black/80 text-white/60 text-[9px] font-mono px-2 py-1 rounded-md border border-white/10 hover:text-white/90 transition-colors"
        title="Debug Panel"
      >
        DBG
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] w-64 rounded-lg border border-white/10 bg-black/85 backdrop-blur-sm shadow-xl"
      style={{ fontFamily: 'monospace' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Debug</span>
        <button
          onClick={() => setMinimized(true)}
          className="text-white/30 hover:text-white/70 transition-colors text-xs leading-none"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-1.5">
        <Row
          label="projectId"
          value={activeEngagementId ? activeEngagementId.slice(0, 8) + '…' : '—'}
          loading={!activeEngagementId}
        />
        <Row
          label={`company (${nameSource})`}
          value={companyName}
          loading={loadingProfile}
        />
        <div className="my-1 border-t border-white/8" />
        <Row label="T1" value={loadingT1 ? 'loading…' : 'ready'} loading={loadingT1} />
        <Row label="T2" value={loadingT2 ? 'loading…' : 'ready'} loading={loadingT2} />
        <Row label="T3" value={loadingT3 ? 'loading…' : 'ready'} loading={loadingT3} />
        <Row label="T4" value={loadingT4 ? 'loading…' : 'ready'} loading={loadingT4} />
      </div>
    </div>
  )
}

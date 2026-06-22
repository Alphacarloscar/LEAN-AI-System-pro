// ============================================================
// CompanyProfile — Vista principal (Sprint 10: dos tabs)
//
// Tab "Empresa"  → datos inmutables a nivel company_id:
//                   sector, company_size, DepartmentManager
// Tab "Proyecto" → contexto temporal a nivel project_id:
//                   objetivo, horizonte, ecosistema,
//                   áreas prioritarias, fricciones y oportunidades
//
// Dos lógicas de guardado independientes:
//   - Empresa:  UPDATE companies SET sector, company_size
//   - Proyecto: UPSERT company_profiles (store existente)
// ============================================================

import { useState, useEffect }    from 'react'
import { useNavigate }            from 'react-router-dom'
import { Spinner }                from '@shared/design-system/components'
import { useCompanyProfileStore } from './store'
import { useDepartmentStore }     from './useDepartmentStore'
import { useEngagementStore }     from '@/modules/Engagement/store'
import { useAuthStore }           from '@/modules/Auth'
import { usePermissions }         from '@/modules/Auth'
import { getProjectWithCompany }  from '@/services/projects.service'
import { updateCompanySettings }  from '@/services/companies.service'
import { reportError }            from '@/lib/reportError'
import { isDemoEnabled }          from '@/lib/config'
import { EmpresaTab }             from './components/EmpresaTab'
import { ProyectoTab }            from './components/ProyectoTab'

// ── Tipos locales ─────────────────────────────────────────────

type ActiveTab = 'empresa' | 'proyecto'

interface CompanySettings {
  sector:       string
  company_size: string
}

// ── Vista principal ───────────────────────────────────────────

export function CompanyProfileView() {
  const navigate     = useNavigate()
  const { isReadOnly, canEditCompanySettings } = usePermissions()

  const {
    isDirty, isSaving, isLoadingData, saveError,
    loadProfile, saveProfile, resetProfile,
  } = useCompanyProfileStore()

  const { reset: resetDepartments, fetchDepartments } = useDepartmentStore()
  const engagementId = useEngagementStore((s) => s.activeEngagementId)
  const user         = useAuthStore((s) => s.user)
  const isAuth       = !!user

  // ── Estado local ──────────────────────────────────────────────
  const [activeTab,         setActiveTab]         = useState<ActiveTab>('empresa')
  const [companyName,       setCompanyName]       = useState<string>('')
  const [companyId,         setCompanyId]         = useState<string | null>(null)
  const [companySettings,   setCompanySettings]   = useState<CompanySettings>({ sector: '', company_size: '' })
  const [isCompanySaving,   setIsCompanySaving]   = useState(false)
  const [companySaveFlash,  setCompanySaveFlash]  = useState(false)
  const [companySaveError,  setCompanySaveError]  = useState<string | null>(null)
  const [savedFlash,        setSavedFlash]        = useState(false)

  // ── Carga al seleccionar proyecto ─────────────────────────────
  useEffect(() => {
    if (engagementId) {
      loadProfile(engagementId)
      getProjectWithCompany(engagementId).then((data) => {
        setCompanyName(data.company_name)
        setCompanyId(data.company_id)
        setCompanySettings({
          sector:       data.sector,
          company_size: data.company_size,
        })
        if (data.company_id) fetchDepartments(data.company_id)
      })
    } else {
      setCompanyName('')
      setCompanyId(null)
      setCompanySettings({ sector: '', company_size: '' })
      resetDepartments()
      if (isAuth) resetProfile()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, isAuth])

  // ── Guardar datos de empresa ──────────────────────────────────
  async function handleCompanySave() {
    if (!companyId) return
    setIsCompanySaving(true)
    setCompanySaveError(null)
    try {
      await updateCompanySettings(companyId, {
        sector:       companySettings.sector,
        company_size: companySettings.company_size,
      })
      setCompanySaveFlash(true)
      setTimeout(() => setCompanySaveFlash(false), 2000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar datos de empresa'
      reportError('[CompanyProfileView] handleCompanySave', err)
      setCompanySaveError(msg)
    } finally {
      setIsCompanySaving(false)
    }
  }

  // ── Guardar contexto del proyecto ─────────────────────────────
  async function handleProjectSave() {
    await saveProfile(engagementId ?? undefined)
    if (!saveError) {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    }
  }

  const savedDate = useCompanyProfileStore((s) => s.profile.savedAt)
    ? new Date(useCompanyProfileStore.getState().profile.savedAt!).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  // ── Guards ────────────────────────────────────────────────────
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="md" label="Cargando perfil…" className="text-navy dark:text-warm-200" />
          <p className="text-xs text-text-subtle dark:text-gray-500 font-mono">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (isAuth && !engagementId && !isDemoEnabled) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center">
        <div className="max-w-sm text-center space-y-3 px-6">
          <div className="h-12 w-12 mx-auto rounded-xl bg-navy/8 dark:bg-navy/20 border border-navy/15 dark:border-navy/30 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none" stroke="#2A2822" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-warm-200">
              <rect x="2" y="3" width="10" height="10" rx="1" />
              <path d="M5 13V9h4v4M2 6h10" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-lean-black dark:text-gray-100">Selecciona un proyecto</h2>
          <p className="text-xs text-text-muted dark:text-gray-500 leading-relaxed">
            El perfil de empresa está vinculado al proyecto activo.
            Usa el selector <span className="font-semibold text-lean-black dark:text-gray-300">▾ Proyecto</span> en la barra superior.
          </p>
          <button onClick={() => navigate('/')} className="mt-2 text-xs font-medium text-navy dark:text-warm-200 hover:underline">
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Header ── */}
      <div className="sticky top-[57px] z-10 bg-[rgba(247,244,238,0.95)] dark:bg-warm-900/95 backdrop-blur-sm border-b border-border dark:border-white/6 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-gray-400 hover:text-lean-black dark:hover:text-gray-200 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
              Volver al dashboard
            </button>
            <span className="text-text-subtle dark:text-gray-600">·</span>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-navy/10 dark:bg-navy/20 border border-navy/20 dark:border-navy/30 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#2A2822" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-warm-100">
                  <rect x="2" y="3" width="10" height="10" rx="1" />
                  <path d="M5 13V9h4v4M2 6h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-lean-black dark:text-gray-100">Perfil de Empresa</h1>
                {companyName && <p className="text-[11px] text-[#C8860A] font-medium mt-0.5">{companyName}</p>}
              </div>
            </div>
          </div>

          {/* Botón de guardado contextual */}
          <div className="flex items-center gap-3 shrink-0">
            {activeTab === 'proyecto' && (
              <>
                {saveError && <span className="text-[10px] text-red-500 font-mono max-w-[280px] truncate" title={saveError}>{saveError}</span>}
                {savedDate && !isDirty && !saveError && <span className="text-[10px] text-text-subtle dark:text-gray-600 font-mono">Guardado {savedDate}</span>}
                {isDirty && !isSaving && <span className="text-[10px] text-warning-dark font-mono animate-pulse">Cambios sin guardar</span>}
              </>
            )}
            {activeTab === 'empresa' && companySaveError && (
              <span className="text-[10px] text-red-500 font-mono max-w-[280px] truncate" title={companySaveError}>{companySaveError}</span>
            )}

            {canEditCompanySettings && activeTab === 'empresa' && (
              <button
                onClick={handleCompanySave}
                disabled={isCompanySaving || !companyId}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                  isCompanySaving || !companyId
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : companySaveFlash ? 'bg-success-dark text-white'
                    : 'bg-navy-metallic text-white hover:bg-navy-metallic-hover shadow-sm',
                ].join(' ')}
              >
                {isCompanySaving ? (<><Spinner size="sm" label="Guardando…" />Guardando...</>)
                  : companySaveFlash ? (<><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-7" /></svg>Guardado</>)
                  : 'Guardar empresa'}
              </button>
            )}

            {!isReadOnly && activeTab === 'proyecto' && (
              <button
                onClick={handleProjectSave}
                disabled={isSaving}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                  isSaving ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : savedFlash ? 'bg-success-dark text-white'
                    : 'bg-navy-metallic text-white hover:bg-navy-metallic-hover shadow-sm',
                ].join(' ')}
              >
                {isSaving ? (<><Spinner size="sm" label="Guardando…" />Guardando...</>)
                  : savedFlash ? (<><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-7" /></svg>Guardado</>)
                  : (<><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2H4L2 4v8a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1z" /><path d="M9 2v4H5V2" /><rect x="4" y="8" width="6" height="5" rx="0.5" /></svg>Guardar contexto</>)}
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="max-w-5xl mx-auto mt-3 flex gap-1">
          {([
            { id: 'empresa',  label: 'Empresa' },
            { id: 'proyecto', label: 'Contexto del proyecto' },
          ] as { id: ActiveTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-text-muted dark:text-gray-400 hover:text-lean-black dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        {activeTab === 'empresa' && (
          <EmpresaTab
            companyId={companyId}
            companySettings={companySettings}
            onSettingsChange={(patch) => setCompanySettings((s) => ({ ...s, ...patch }))}
            canEditCompanySettings={canEditCompanySettings}
          />
        )}
        {activeTab === 'proyecto' && <ProyectoTab />}
      </div>
    </div>
  )
}

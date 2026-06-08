// ============================================================
// CompanyProfile — Vista principal (Sprint 10: dos tabs)
//
// Tab "Empresa"  → datos inmutables a nivel company_id:
//                   sector, company_size, DepartmentManager
// Tab "Proyecto" → contexto temporal a nivel project_id:
//                   objetivo, horizonte, ecosistema,
//                   áreas prioritarias (chips desde useDepartmentStore),
//                   fricciones y oportunidades
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
import { DepartmentManager }      from './DepartmentManager'
import { useEngagementStore }     from '@/modules/Engagement/store'
import { useAuthStore }           from '@/modules/Auth'
import { usePermissions }         from '@/modules/Auth'
import { supabase }               from '@/lib/supabase'
import { isDemoEnabled }          from '@/lib/config'
import { reportError }            from '@/lib/reportError'
import {
  SECTOR_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  IA_OBJECTIVE_OPTIONS,
  VALUE_HORIZON_OPTIONS,
  TECH_ECOSYSTEM_OPTIONS,
  FRICTION_TYPE_OPTIONS,
  ALL_BUSINESS_AREAS as AREA_OPTIONS,
} from './types'
import type { FrictionFrequency, FrictionImpact, Friction } from './types'

// ── Tipos locales ──────────────────────────────────────────────

type ActiveTab = 'empresa' | 'proyecto'

interface CompanySettings {
  sector:       string
  company_size: string
}

// ── Helpers de UI ──────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle dark:text-gray-500 mb-3 flex items-center gap-2">
      <span className="inline-block h-px w-3 bg-current opacity-40" />
      {children}
    </p>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle dark:text-gray-500 mb-1.5">
      {children}
    </label>
  )
}

// ── Select genérico ───────────────────────────────────────────

function LeanSelect({
  value, onChange, options, placeholder, disabled,
}: {
  value:       string
  onChange:    (v: string) => void
  options:     readonly string[]
  placeholder: string
  disabled?:   boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={[
          'w-full appearance-none px-4 py-2.5 rounded-lg text-sm transition-colors duration-150',
          'bg-white dark:bg-gray-900',
          'border border-border dark:border-white/8',
          'focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20',
          !value ? 'text-text-subtle dark:text-gray-500' : 'text-lean-black dark:text-gray-100',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-subtle dark:text-gray-500"
        viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      >
        <path d="M3 5l4 4 4-4" />
      </svg>
    </div>
  )
}

// ── Chip de área prioritaria (string genérico) ────────────────

function AreaChip({
  label, selected, onToggle, disabled,
}: {
  label:    string
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={[
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
        selected
          ? 'bg-navy text-white border-navy shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 border-border dark:border-white/8 hover:border-navy/40 hover:text-lean-black dark:hover:text-gray-200',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ── Chip de frecuencia / impacto ──────────────────────────────

function ToggleChip<T extends string>({
  label, value, selected, onSelect, colorSelected,
}: {
  label:          T
  value:          T
  selected:       boolean
  onSelect:       (v: T) => void
  colorSelected?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={[
        'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 border',
        selected
          ? `border-transparent text-white ${colorSelected ?? 'bg-navy'}`
          : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 border-border dark:border-white/8 hover:border-gray-300 dark:hover:border-white/20',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ── Color maps ─────────────────────────────────────────────────

const FREQ_COLOR: Record<FrictionFrequency, string> = {
  Baja:  'bg-success-dark',
  Media: 'bg-warning-dark',
  Alta:  'bg-danger-dark',
}
const IMPACT_COLOR: Record<FrictionImpact, string> = {
  Bajo:  'bg-info-dark',
  Medio: 'bg-warning-dark',
  Alto:  'bg-danger-dark',
}

// ── Tarjeta de fricción ───────────────────────────────────────

function FrictionCard({
  index, friction, onUpdate, onRemove,
}: {
  index:    number
  friction: Friction
  onUpdate: (partial: Partial<Friction>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-border dark:border-white/6 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-navy/10 dark:bg-navy/20 border border-navy/20 dark:border-navy/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-navy dark:text-warm-100">{index + 1}</span>
          </div>
          <span className="text-xs font-semibold text-lean-black dark:text-gray-300">Fricción / Oportunidad</span>
        </div>
        <button
          onClick={onRemove}
          className="h-6 w-6 rounded flex items-center justify-center text-text-subtle dark:text-gray-600 hover:text-danger-dark hover:bg-danger-light/20 transition-colors"
          aria-label="Eliminar fricción"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tipo de problema</FieldLabel>
          <LeanSelect
            value={friction.tipo}
            onChange={(v) => onUpdate({ tipo: v })}
            options={FRICTION_TYPE_OPTIONS}
            placeholder="Seleccionar..."
          />
        </div>
        <div>
          <FieldLabel>Área funcional</FieldLabel>
          <LeanSelect
            value={friction.areaFuncional}
            onChange={(v) => onUpdate({ areaFuncional: v })}
            options={AREA_OPTIONS as unknown as string[]}
            placeholder="Opcional..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <FieldLabel>Frecuencia</FieldLabel>
          <div className="flex gap-1.5 flex-wrap">
            {(['Baja', 'Media', 'Alta'] as FrictionFrequency[]).map((f) => (
              <ToggleChip
                key={f} label={f} value={f}
                selected={friction.frecuencia === f}
                onSelect={(v) => onUpdate({ frecuencia: v })}
                colorSelected={FREQ_COLOR[f]}
              />
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Impacto</FieldLabel>
          <div className="flex gap-1.5 flex-wrap">
            {(['Bajo', 'Medio', 'Alto'] as FrictionImpact[]).map((i) => (
              <ToggleChip
                key={i} label={i} value={i}
                selected={friction.impacto === i}
                onSelect={(v) => onUpdate({ impacto: v })}
                colorSelected={IMPACT_COLOR[i]}
              />
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Notas adicionales</FieldLabel>
          <textarea
            value={friction.notas}
            onChange={(e) => onUpdate({ notas: e.target.value })}
            rows={2}
            placeholder="Descripción adicional..."
            className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-900 border border-border dark:border-white/8 text-lean-black dark:text-gray-200 placeholder-text-subtle dark:placeholder-gray-600 resize-none focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20 transition-colors"
          />
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────

export function CompanyProfileView() {
  const navigate     = useNavigate()
  const { isReadOnly, canEditCompanySettings } = usePermissions()

  // ── Stores ────────────────────────────────────────────────────
  const {
    profile, isDirty, isSaving, isLoadingData, saveError,
    loadProfile, updateField, toggleArea, saveProfile, resetProfile,
    addFriction, updateFriction, removeFriction,
  } = useCompanyProfileStore()

  const { departments, fetchDepartments, reset: resetDepartments } = useDepartmentStore()
  const engagementId = useEngagementStore((s) => s.activeEngagementId)
  const user         = useAuthStore((s) => s.user)
  const isAuth       = !!user

  // ── Estado local ──────────────────────────────────────────────
  const [activeTab,       setActiveTab]       = useState<ActiveTab>('empresa')
  const [companyName,     setCompanyName]     = useState<string>('')
  const [companyId,       setCompanyId]       = useState<string | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings>({ sector: '', company_size: '' })
  const [isCompanySaving, setIsCompanySaving] = useState(false)
  const [companySaveFlash, setCompanySaveFlash] = useState(false)
  const [companySaveError, setCompanySaveError] = useState<string | null>(null)
  const [savedFlash,      setSavedFlash]      = useState(false)

  // ── Carga al seleccionar proyecto ────────────────────────────
  useEffect(() => {
    if (engagementId) {
      loadProfile(engagementId)
      supabase
        .from('projects')
        .select('company_id, companies(name, sector, company_size)')
        .eq('id', engagementId)
        .single()
        .then(({ data }) => {
          const company = data?.companies as { name?: string; sector?: string; company_size?: string } | null
          const cid     = (data?.company_id as string | null) ?? null
          setCompanyName(company?.name ?? '')
          setCompanyId(cid)
          setCompanySettings({
            sector:       company?.sector       ?? '',
            company_size: company?.company_size ?? '',
          })
          if (cid) fetchDepartments(cid)
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

  // ── Guardar datos de empresa (Tab Empresa) ────────────────────
  async function handleCompanySave() {
    if (!companyId) return
    setIsCompanySaving(true)
    setCompanySaveError(null)
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          sector:       companySettings.sector,
          company_size: companySettings.company_size,
        })
        .eq('id', companyId)
      if (error) throw error
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

  // ── Guardar contexto del proyecto (Tab Proyecto) ──────────────
  async function handleProjectSave() {
    await saveProfile(engagementId ?? undefined)
    if (!saveError) {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    }
  }

  const savedDate = profile.savedAt
    ? new Date(profile.savedAt).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  // ── Guard 1: cargando ─────────────────────────────────────────
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

  // ── Guard 2: sin proyecto ─────────────────────────────────────
  if (isAuth && !engagementId && !isDemoEnabled) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center">
        <div className="max-w-sm text-center space-y-3 px-6">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-navy/8 dark:bg-navy/20 border border-navy/15 dark:border-navy/30 flex items-center justify-center">
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
                {companyName && (
                  <p className="text-[11px] text-[#C8860A] font-medium mt-0.5">{companyName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botón de guardado contextual según tab activo */}
          <div className="flex items-center gap-3 shrink-0">
            {activeTab === 'proyecto' && (
              <>
                {saveError && (
                  <span className="text-[10px] text-red-500 font-mono max-w-[280px] truncate" title={saveError}>
                    {saveError}
                  </span>
                )}
                {savedDate && !isDirty && !saveError && (
                  <span className="text-[10px] text-text-subtle dark:text-gray-600 font-mono">
                    Guardado {savedDate}
                  </span>
                )}
                {isDirty && !isSaving && (
                  <span className="text-[10px] text-warning-dark font-mono animate-pulse">
                    Cambios sin guardar
                  </span>
                )}
              </>
            )}
            {activeTab === 'empresa' && companySaveError && (
              <span className="text-[10px] text-red-500 font-mono max-w-[280px] truncate" title={companySaveError}>
                {companySaveError}
              </span>
            )}

            {canEditCompanySettings && activeTab === 'empresa' && (
              <button
                onClick={handleCompanySave}
                disabled={isCompanySaving || !companyId}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                  isCompanySaving || !companyId
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : companySaveFlash
                    ? 'bg-success-dark text-white'
                    : 'bg-navy-metallic text-white hover:bg-navy-metallic-hover shadow-sm',
                ].join(' ')}
              >
                {isCompanySaving ? (
                  <>
                    <Spinner size="sm" label="Guardando…" />
                    Guardando...
                  </>
                ) : companySaveFlash ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7l4 4 6-7" />
                    </svg>
                    Guardado
                  </>
                ) : (
                  'Guardar empresa'
                )}
              </button>
            )}

            {!isReadOnly && activeTab === 'proyecto' && (
              <button
                onClick={handleProjectSave}
                disabled={isSaving}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                  isSaving
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : savedFlash
                    ? 'bg-success-dark text-white'
                    : 'bg-navy-metallic text-white hover:bg-navy-metallic-hover shadow-sm',
                ].join(' ')}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" label="Guardando…" />
                    Guardando...
                  </>
                ) : savedFlash ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7l4 4 6-7" />
                    </svg>
                    Guardado
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 2H4L2 4v8a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1z" />
                      <path d="M9 2v4H5V2" /><rect x="4" y="8" width="6" height="5" rx="0.5" />
                    </svg>
                    Guardar contexto
                  </>
                )}
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

        {/* ════════════════════════════════════════════════════════
            TAB EMPRESA — sector, tamaño, departamentos
        ════════════════════════════════════════════════════════ */}
        {activeTab === 'empresa' && (
          <>
            {/* Sector y tamaño */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-6 space-y-5">
              <div>
                <SectionLabel>Datos de la empresa</SectionLabel>
                <p className="text-xs text-text-muted dark:text-gray-500 -mt-1">
                  Información permanente de la empresa, compartida entre todos sus proyectos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Sector</FieldLabel>
                  <LeanSelect
                    value={companySettings.sector}
                    onChange={(v) => setCompanySettings((s) => ({ ...s, sector: v }))}
                    options={SECTOR_OPTIONS}
                    placeholder="Seleccionar sector..."
                    disabled={!canEditCompanySettings || !companyId}
                  />
                </div>
                <div>
                  <FieldLabel>Tamaño de empresa</FieldLabel>
                  <LeanSelect
                    value={companySettings.company_size}
                    onChange={(v) => setCompanySettings((s) => ({ ...s, company_size: v }))}
                    options={COMPANY_SIZE_OPTIONS}
                    placeholder="Seleccionar tamaño..."
                    disabled={!canEditCompanySettings || !companyId}
                  />
                </div>
              </div>
            </div>

            {/* Departamentos */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-6 space-y-4">
              <div>
                <SectionLabel>Departamentos de la empresa</SectionLabel>
                <p className="text-xs text-text-muted dark:text-gray-500 -mt-1">
                  Lista centralizada compartida entre todos los proyectos.
                  Disponible como selector en T2, T3, T4 y T8.
                </p>
              </div>
              <DepartmentManager companyId={companyId} />
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB PROYECTO — contexto temporal del engagement
        ════════════════════════════════════════════════════════ */}
        {activeTab === 'proyecto' && (
          <>
            {/* Contexto del proyecto */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-6 space-y-6">
              <SectionLabel>Contexto del proyecto</SectionLabel>

              {/* Nombre del proyecto */}
              <div>
                <FieldLabel>Nombre del proyecto</FieldLabel>
                <input
                  type="text"
                  value={profile.engagementName}
                  onChange={(e) => updateField('engagementName', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Ej: Conecta Professional Services — Sprint LEAN Q2 2026"
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 border border-border dark:border-white/8 text-lean-black dark:text-gray-100 placeholder-text-subtle dark:placeholder-gray-600 focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20 transition-colors disabled:opacity-50"
                />
              </div>

              {/* Objetivo + Horizonte */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Objetivo principal con IA</FieldLabel>
                  <LeanSelect
                    value={profile.objetivoPrincipalIA}
                    onChange={(v) => updateField('objetivoPrincipalIA', v)}
                    options={IA_OBJECTIVE_OPTIONS}
                    placeholder="Seleccionar objetivo..."
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <FieldLabel>Horizonte esperado de valor</FieldLabel>
                  <LeanSelect
                    value={profile.horizonteEsperadoValor}
                    onChange={(v) => updateField('horizonteEsperadoValor', v)}
                    options={VALUE_HORIZON_OPTIONS}
                    placeholder="Seleccionar horizonte..."
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              {/* Ecosistema + Restricciones */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Ecosistema tecnológico principal</FieldLabel>
                  <LeanSelect
                    value={profile.ecosistemaTecnologico}
                    onChange={(v) => updateField('ecosistemaTecnologico', v)}
                    options={TECH_ECOSYSTEM_OPTIONS}
                    placeholder="Seleccionar ecosistema..."
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <FieldLabel>Restricciones relevantes</FieldLabel>
                  <textarea
                    value={profile.restriccionesRelevantes}
                    onChange={(e) => updateField('restriccionesRelevantes', e.target.value)}
                    disabled={isReadOnly}
                    rows={3}
                    placeholder="Ej: presupuesto limitado, sistemas legacy, GDPR sector financiero..."
                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 border border-border dark:border-white/8 text-lean-black dark:text-gray-100 placeholder-text-subtle dark:placeholder-gray-600 resize-none focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Áreas prioritarias — multi-select desde useDepartmentStore */}
              <div>
                <FieldLabel>Departamentos implicados en este proyecto</FieldLabel>
                {departments.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {departments.map((dept) => (
                        <AreaChip
                          key={dept.id}
                          label={dept.name}
                          selected={profile.areasPrioritarias.includes(dept.name)}
                          onToggle={() => toggleArea(dept.name)}
                          disabled={isReadOnly}
                        />
                      ))}
                    </div>
                    {profile.areasPrioritarias.length > 0 && (
                      <p className="mt-2 text-[10px] text-text-subtle dark:text-gray-600 font-mono">
                        {profile.areasPrioritarias.length} departamento{profile.areasPrioritarias.length !== 1 ? 's' : ''} seleccionado{profile.areasPrioritarias.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-text-subtle dark:text-gray-600 italic mt-1">
                    Configura primero los departamentos en la pestaña <span className="font-medium text-[#C8860A]">Empresa</span>.
                  </p>
                )}
              </div>
            </div>

            {/* Fricciones y oportunidades */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <SectionLabel>Fricciones y oportunidades detectadas</SectionLabel>
                  <p className="text-xs text-text-muted dark:text-gray-500 -mt-1">
                    Registra los problemas detectados durante las entrevistas.
                    Alimentan T4 (priorización) y T6 (governance).
                  </p>
                </div>
                {profile.fricciones.length > 0 && (
                  <span className="text-[10px] font-mono text-text-subtle dark:text-gray-500 shrink-0 ml-4">
                    {profile.fricciones.length} registro{profile.fricciones.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {profile.fricciones.length > 0 ? (
                <div className="space-y-3">
                  {profile.fricciones.map((friction, i) => (
                    <FrictionCard
                      key={friction.id} index={i} friction={friction}
                      onUpdate={(partial) => updateFriction(friction.id, partial)}
                      onRemove={() => removeFriction(friction.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border dark:border-white/10 py-8 text-center">
                  <p className="text-xs text-text-muted dark:text-gray-600">No hay fricciones registradas.</p>
                  <p className="text-[10px] text-text-subtle dark:text-gray-700 mt-1">Se registran durante las entrevistas de diagnóstico.</p>
                </div>
              )}

              {!isReadOnly && (
                <button
                  onClick={addFriction}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border dark:border-white/10 text-xs text-text-muted dark:text-gray-500 hover:border-navy/40 hover:text-navy dark:hover:text-gray-300 hover:bg-navy/3 dark:hover:bg-navy/5 transition-all duration-150"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M7 2v10M2 7h10" />
                  </svg>
                  Añadir fricción / oportunidad
                </button>
              )}

              {profile.fricciones.length >= 2 && (
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border dark:border-white/4 p-4 mt-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle dark:text-gray-600 mb-3">Resumen</p>
                  <div className="flex gap-6 text-xs">
                    <div>
                      <span className="text-text-muted dark:text-gray-500">Alta frecuencia</span>
                      <span className="ml-2 font-semibold text-danger-dark">{profile.fricciones.filter((f) => f.frecuencia === 'Alta').length}</span>
                    </div>
                    <div>
                      <span className="text-text-muted dark:text-gray-500">Alto impacto</span>
                      <span className="ml-2 font-semibold text-warning-dark">{profile.fricciones.filter((f) => f.impacto === 'Alto').length}</span>
                    </div>
                    <div>
                      <span className="text-text-muted dark:text-gray-500">Registradas</span>
                      <span className="ml-2 font-semibold text-lean-black dark:text-gray-300">{profile.fricciones.length}</span>
                    </div>
                    <div>
                      <span className="text-text-muted dark:text-gray-500">Sin completar</span>
                      <span className="ml-2 font-semibold text-text-subtle dark:text-gray-500">{profile.fricciones.filter((f) => !f.tipo || !f.frecuencia || !f.impacto).length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ============================================================
// CompanyProfile — Vista principal
//
// Módulo standalone accesible desde el menú lateral.
// Sigue el sistema de diseño: light mode por defecto, dark: prefijo.
// Ruta: /company-profile
// ============================================================

import { useState }               from 'react'
import { useNavigate }            from 'react-router-dom'
import { useCompanyProfileStore } from './store'
import {
  ALL_BUSINESS_AREAS,
  SECTOR_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  IA_OBJECTIVE_OPTIONS,
  VALUE_HORIZON_OPTIONS,
  TECH_ECOSYSTEM_OPTIONS,
  FRICTION_TYPE_OPTIONS,
  ALL_BUSINESS_AREAS as AREA_OPTIONS,
} from './types'
import type { FrictionFrequency, FrictionImpact, BusinessArea, Friction } from './types'

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
  value, onChange, options, placeholder,
}: {
  value:       string
  onChange:    (v: string) => void
  options:     readonly string[]
  placeholder: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'w-full appearance-none px-4 py-2.5 rounded-lg text-sm transition-colors duration-150',
          'bg-white dark:bg-gray-900',
          'border border-border dark:border-white/8',
          'focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20',
          !value
            ? 'text-text-subtle dark:text-gray-500'
            : 'text-lean-black dark:text-gray-100',
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

// ── Chip de área prioritaria ──────────────────────────────────
function AreaChip({
  label, selected, onToggle,
}: {
  label:    BusinessArea
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
        selected
          ? 'bg-navy text-white border-navy shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 border-border dark:border-white/8 hover:border-navy/40 hover:text-lean-black dark:hover:text-gray-200',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-navy/10 dark:bg-navy/20 border border-navy/20 dark:border-navy/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-navy dark:text-info-soft">{index + 1}</span>
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

      {/* Tipo + Área */}
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

      {/* Frecuencia + Impacto + Notas */}
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
  const navigate = useNavigate()
  const {
    profile, isDirty,
    updateField, toggleArea, saveProfile,
    addFriction, updateFriction, removeFriction,
  } = useCompanyProfileStore()

  const [savedFlash, setSavedFlash] = useState(false)

  function handleSave() {
    saveProfile()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const savedDate = profile.savedAt
    ? new Date(profile.savedAt).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950">

      {/* ── Header de herramienta ── */}
      <div className="sticky top-[57px] z-10 bg-white/90 dark:bg-gray-950/95 backdrop-blur-sm border-b border-border dark:border-white/6 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            {/* Botón volver */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-gray-400 hover:text-lean-black dark:hover:text-gray-200 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
              Metro Map
            </button>

            <span className="text-text-subtle dark:text-gray-600">·</span>

            {/* Título */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-navy/10 dark:bg-navy/20 border border-navy/20 dark:border-navy/30 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#1B2A4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-info-soft">
                  <rect x="2" y="3" width="10" height="10" rx="1" />
                  <path d="M5 13V9h4v4M2 6h10" />
                </svg>
              </div>
              <h1 className="text-sm font-semibold text-lean-black dark:text-gray-100">
                Perfil de Empresa
              </h1>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400">
              Contexto global del engagement
            </span>
          </div>

          {/* Guardar */}
          <div className="flex items-center gap-3 shrink-0">
            {savedDate && !isDirty && (
              <span className="text-[10px] text-text-subtle dark:text-gray-600 font-mono">
                Guardado {savedDate}
              </span>
            )}
            {isDirty && (
              <span className="text-[10px] text-warning-dark font-mono animate-pulse">
                Cambios sin guardar
              </span>
            )}
            <button
              onClick={handleSave}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                savedFlash
                  ? 'bg-success-dark text-white'
                  : 'bg-navy text-white hover:bg-navy-dark',
              ].join(' ')}
            >
              {savedFlash ? (
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
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

        {/* ═══════════════════════════════════════════════════════
            SECCIÓN 1 — Contexto del cliente
        ═══════════════════════════════════════════════════════ */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-6 space-y-6">
          <SectionLabel>Contexto del cliente</SectionLabel>

          {/* Nombre del engagement */}
          <div>
            <FieldLabel>Nombre del engagement</FieldLabel>
            <input
              type="text"
              value={profile.engagementName}
              onChange={(e) => updateField('engagementName', e.target.value)}
              placeholder="Ej: Conecta Professional Services — Sprint LEAN Q2 2026"
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 border border-border dark:border-white/8 text-lean-black dark:text-gray-100 placeholder-text-subtle dark:placeholder-gray-600 focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20 transition-colors"
            />
          </div>

          {/* Grid 2×2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Sector</FieldLabel>
              <LeanSelect value={profile.sector} onChange={(v) => updateField('sector', v)} options={SECTOR_OPTIONS} placeholder="Seleccionar sector..." />
            </div>
            <div>
              <FieldLabel>Tamaño de empresa</FieldLabel>
              <LeanSelect value={profile.tamanoEmpresa} onChange={(v) => updateField('tamanoEmpresa', v)} options={COMPANY_SIZE_OPTIONS} placeholder="Seleccionar tamaño..." />
            </div>
            <div>
              <FieldLabel>Objetivo principal con IA</FieldLabel>
              <LeanSelect value={profile.objetivoPrincipalIA} onChange={(v) => updateField('objetivoPrincipalIA', v)} options={IA_OBJECTIVE_OPTIONS} placeholder="Seleccionar objetivo..." />
            </div>
            <div>
              <FieldLabel>Horizonte esperado de valor</FieldLabel>
              <LeanSelect value={profile.horizonteEsperadoValor} onChange={(v) => updateField('horizonteEsperadoValor', v)} options={VALUE_HORIZON_OPTIONS} placeholder="Seleccionar horizonte..." />
            </div>
          </div>

          {/* Ecosistema + Restricciones */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Ecosistema tecnológico principal</FieldLabel>
              <LeanSelect value={profile.ecosistemaTecnologico} onChange={(v) => updateField('ecosistemaTecnologico', v)} options={TECH_ECOSYSTEM_OPTIONS} placeholder="Seleccionar ecosistema..." />
            </div>
            <div>
              <FieldLabel>Restricciones relevantes</FieldLabel>
              <textarea
                value={profile.restriccionesRelevantes}
                onChange={(e) => updateField('restriccionesRelevantes', e.target.value)}
                rows={3}
                placeholder="Ej: presupuesto limitado, sistemas legacy, GDPR sector financiero..."
                className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 border border-border dark:border-white/8 text-lean-black dark:text-gray-100 placeholder-text-subtle dark:placeholder-gray-600 resize-none focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20 transition-colors"
              />
            </div>
          </div>

          {/* Áreas prioritarias */}
          <div>
            <FieldLabel>Áreas prioritarias del negocio</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_BUSINESS_AREAS.map((area) => (
                <AreaChip
                  key={area} label={area}
                  selected={profile.areasPrioritarias.includes(area)}
                  onToggle={() => toggleArea(area)}
                />
              ))}
            </div>
            {profile.areasPrioritarias.length > 0 && (
              <p className="mt-2 text-[10px] text-text-subtle dark:text-gray-600 font-mono">
                {profile.areasPrioritarias.length} área{profile.areasPrioritarias.length !== 1 ? 's' : ''} seleccionada{profile.areasPrioritarias.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECCIÓN 2 — Fricciones y oportunidades
        ═══════════════════════════════════════════════════════ */}
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

          {/* Lista */}
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

          {/* Añadir */}
          <button
            onClick={addFriction}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border dark:border-white/10 text-xs text-text-muted dark:text-gray-500 hover:border-navy/40 hover:text-navy dark:hover:text-gray-300 hover:bg-navy/3 dark:hover:bg-navy/5 transition-all duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M7 2v10M2 7h10" />
            </svg>
            Añadir fricción / oportunidad
          </button>

          {/* Resumen */}
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

      </div>
    </div>
  )
}

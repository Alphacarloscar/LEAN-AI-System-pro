// ============================================================
// CompanyProfile — Tab Contexto del Proyecto
// ============================================================

import { useCompanyProfileStore } from '../store'
import { useDepartmentStore }     from '../useDepartmentStore'
import { usePermissions }         from '@/modules/Auth'
import { FrictionCard }           from './FrictionCard'
import { SectionLabel, FieldLabel, LeanSelect, AreaChip } from './CompanyProfileHelpers'
import {
  IA_OBJECTIVE_OPTIONS,
  VALUE_HORIZON_OPTIONS,
  TECH_ECOSYSTEM_OPTIONS,
} from '../types'

export function ProyectoTab() {
  const { isReadOnly } = usePermissions()
  const {
    profile, updateField, toggleArea,
    addFriction, updateFriction, removeFriction,
  } = useCompanyProfileStore()
  const { departments } = useDepartmentStore()

  return (
    <>
      {/* Contexto del proyecto */}
      <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-6">
        <SectionLabel>Contexto del proyecto</SectionLabel>

        <div>
          <FieldLabel>Nombre del proyecto</FieldLabel>
          <input
            type="text"
            value={profile.engagementName}
            onChange={(e) => updateField('engagementName', e.target.value)}
            disabled={isReadOnly}
            placeholder="Ej: Conecta Professional Services — Sprint LEAN Q2 2026"
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-warm-800 border border-border dark:border-white/8 text-lean-black dark:text-warm-50 placeholder-text-subtle dark:placeholder-warm-400 focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20 transition-colors disabled:opacity-50"
          />
        </div>

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
              aria-label="Restricciones relevantes del proyecto"
              placeholder="Ej: presupuesto limitado, sistemas legacy, GDPR sector financiero..."
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-warm-800 border border-border dark:border-white/8 text-lean-black dark:text-warm-50 placeholder-text-subtle dark:placeholder-warm-400 resize-none focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

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
                <p className="mt-2 text-[10px] text-text-subtle dark:text-warm-400 font-mono">
                  {profile.areasPrioritarias.length} departamento{profile.areasPrioritarias.length !== 1 ? 's' : ''} seleccionado{profile.areasPrioritarias.length !== 1 ? 's' : ''}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-text-subtle dark:text-warm-400 italic mt-1">
              Configura primero los departamentos en la pestaña <span className="font-medium text-[#C8860A]">Empresa</span>.
            </p>
          )}
        </div>
      </div>

      {/* Fricciones y oportunidades */}
      <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Fricciones y oportunidades detectadas</SectionLabel>
            <p className="text-xs text-text-muted dark:text-warm-400 -mt-1">
              Registra los problemas detectados durante las entrevistas.
              Alimentan T4 (priorización) y T6 (governance).
            </p>
          </div>
          {profile.fricciones.length > 0 && (
            <span className="text-[10px] font-mono text-text-subtle dark:text-warm-400 shrink-0 ml-4">
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
            <p className="text-xs text-text-muted dark:text-warm-400">No hay fricciones registradas.</p>
            <p className="text-[10px] text-text-subtle dark:text-warm-400 mt-1">Se registran durante las entrevistas de diagnóstico.</p>
          </div>
        )}

        {!isReadOnly && (
          <button
            onClick={addFriction}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border dark:border-white/10 text-xs text-text-muted dark:text-warm-400 hover:border-navy/40 hover:text-navy dark:hover:text-warm-300 hover:bg-navy/3 dark:hover:bg-navy/5 transition-all duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M7 2v10M2 7h10" />
            </svg>
            Añadir fricción / oportunidad
          </button>
        )}

        {profile.fricciones.length >= 2 && (
          <div className="rounded-xl bg-warm-50 dark:bg-warm-800 border border-border dark:border-white/4 p-4 mt-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle dark:text-warm-400 mb-3">Resumen</p>
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-text-muted dark:text-warm-400">Alta frecuencia</span>
                <span className="ml-2 font-semibold text-danger-dark">{profile.fricciones.filter((f) => f.frecuencia === 'Alta').length}</span>
              </div>
              <div>
                <span className="text-text-muted dark:text-warm-400">Alto impacto</span>
                <span className="ml-2 font-semibold text-warning-dark">{profile.fricciones.filter((f) => f.impacto === 'Alto').length}</span>
              </div>
              <div>
                <span className="text-text-muted dark:text-warm-400">Registradas</span>
                <span className="ml-2 font-semibold text-lean-black dark:text-warm-100">{profile.fricciones.length}</span>
              </div>
              <div>
                <span className="text-text-muted dark:text-warm-400">Sin completar</span>
                <span className="ml-2 font-semibold text-text-subtle dark:text-warm-400">{profile.fricciones.filter((f) => !f.tipo || !f.frecuencia || !f.impacto).length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

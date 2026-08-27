// ============================================================
// ProjectDetailView — Pantalla de edición de proyecto
//
// Muestra todos los campos del proyecto con edición completa:
// - Nombre, objetivo, restricciones, horizonte, ecosistema
// - Fricciones y oportunidades (registro estructurado)
// - Áreas prioritarias (departamentos)
//
// Solo superadmin/consultant pueden editar.
// Botones Guardar/Cancelar en la parte inferior.
// ============================================================

import { useState, useEffect } from 'react'
import { Spinner, Button } from '@shared/design-system/components'
import { getProjectById, updateProject } from '@/services/projects.service'
import { loadActiveDomains } from '@/services/domains.service'
import { useDepartmentStore } from './useDepartmentStore'
import { useEngagementStore } from '@/modules/Engagement/store'
import { PACKAGE_MODULES } from '@/config/packageModules'
import { usePermissions } from '@/modules/Auth'
import { reportError } from '@/lib/reportError'
import { FrictionCard } from './components/FrictionCard'
import { SectionLabel, FieldLabel, LeanSelect, AreaChip } from './components/CompanyProfileHelpers'
import {
  VALUE_HORIZON_OPTIONS,
  Friction,
} from './types'
import { getEcosystemOptions } from '@/modules/Admin/constants/ecosystemOptions'
import type { ProjectRow } from '@/types/database.types'
import type { GovernanceDomain } from '@/services/domains.service'
import { supabase }                  from '@/lib/supabase'

interface ExtendedProjectRow extends ProjectRow {
  objetivo_principal?: string | null
  restricciones?: string | null
  horizonte_valor?: string | null
  ecosistema_tecnologico?: string | null
  fricciones_oportunidades?: Friction[] | null
  areas_prioritarias?: string[] | null
}

interface ProjectDetailViewProps {
  projectId: string
  companyId: string
  onClose: () => void
}

export function ProjectDetailView({ projectId, onClose }: ProjectDetailViewProps) {
  const { isReadOnly } = usePermissions()
  const { departments } = useDepartmentStore()

  const [project, setProject] = useState<ExtendedProjectRow | null>(null)
  const [domains, setDomains] = useState<GovernanceDomain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [t1HasData, setT1HasData] = useState(false)

  // Campos editables
  const [name, setName] = useState('')
  const [domainId, setDomainId] = useState('')
  const [objetivoPrincipal, setObjetivoPrincipal] = useState('')
  const [restricciones, setRestricciones] = useState('')
  const [horizonteValor, setHorizonteValor] = useState('')
  const [ecosistemaTecnologico, setEcosistemaTecnologico] = useState('')
  const [fricciones, setFricciones] = useState<Friction[]>([])
  const [areasPrioritarias, setAreasPrioritarias] = useState<string[]>([])
  const [contractedPackages, setContractedPackages] = useState<string[]>([])

  // Cargar proyecto al montar
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const [proj, doms] = await Promise.all([
          getProjectById(projectId),
          loadActiveDomains(),
        ])
        const extendedProj = proj as ExtendedProjectRow
        setProject(extendedProj)
        setDomains(doms)

        // Llenar campos
        setName(extendedProj.name || '')
        setDomainId(extendedProj.domain_id || '')
        setObjetivoPrincipal(extendedProj.objetivo_principal || '')
        setRestricciones(extendedProj.restricciones || '')
        setHorizonteValor(extendedProj.horizonte_valor || '')
        setEcosistemaTecnologico(extendedProj.ecosistema_tecnologico || '')
        setAreasPrioritarias(extendedProj.areas_prioritarias || [])
        setContractedPackages((extendedProj as any).contracted_packages || [])

        // Fricciones: vienen como JSONB array
        if (extendedProj.fricciones_oportunidades && Array.isArray(extendedProj.fricciones_oportunidades)) {
          setFricciones(extendedProj.fricciones_oportunidades)
        }
        // Comprobar si T1 tiene datos (bloquea cambio de dominio)
        const { count } = await supabase
          .from('t1_dimension_scores')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
        setT1HasData((count ?? 0) > 0)
      } catch (err) {
        reportError('[ProjectDetailView] load', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Guardar cambios
  async function handleSave() {
    if (!name.trim() || !domainId) {
      setSaveError('Nombre y dominio son requeridos')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      await updateProject(projectId, {
        name: name.trim(),
        objetivoPrincipal: objetivoPrincipal.trim() || undefined,
        restricciones: restricciones.trim() || undefined,
        horizonteValor: horizonteValor || undefined,
        ecosistemaTecnologico: ecosistemaTecnologico || undefined,
        friccionesOportunidades: fricciones,
        areasPrioritarias,
        contractedPackages,
      })
      await useEngagementStore.getState().loadMyProjects()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar proyecto'
      reportError('[ProjectDetailView] handleSave', err)
      setSaveError(msg)
    } finally {
      setIsSaving(false)
    }
  }

  // Manejar fricciones
  function addFriction() {
    const newFriction: Friction = {
      id: crypto.randomUUID(),
      tipo: '',
      areaFuncional: '',
      frecuencia: null,
      impacto: null,
      notas: '',
    }
    setFricciones([...fricciones, newFriction])
  }

  function updateFriction(id: string, updates: Partial<Friction>) {
    setFricciones(fricciones.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  function removeFriction(id: string) {
    setFricciones(fricciones.filter(f => f.id !== id))
  }

  // Manejar áreas
  function toggleArea(areaName: string) {
    setAreasPrioritarias(prev =>
      prev.includes(areaName)
        ? prev.filter(a => a !== areaName)
        : [...prev, areaName]
    )
  }

  // Obtener opciones ecosistema según dominio
  const selectedDomain = domains.find(d => d.id === domainId)
  const ecosystemOptions = getEcosystemOptions(selectedDomain?.slug)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center">
        <Spinner size="md" label="Cargando proyecto…" className="text-navy dark:text-warm-200" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted dark:text-warm-400">Proyecto no encontrado</p>
          <button
            onClick={onClose}
            className="mt-4 text-sm text-navy dark:text-warm-200 hover:underline"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-surface dark:bg-warm-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[rgba(247,244,238,0.95)] dark:bg-warm-900/95 backdrop-blur-sm border-b border-border dark:border-white/6 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-warm-300 hover:text-lean-black dark:hover:text-warm-100 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
              Volver
            </button>
            <h1 className="text-sm font-semibold text-lean-black dark:text-warm-50">Editar proyecto: {name || 'Sin nombre'}</h1>
          </div>
          {saveError && <span className="text-[10px] text-danger font-mono">{saveError}</span>}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        {/* Datos básicos */}
        <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
          <SectionLabel>Datos del proyecto</SectionLabel>

          <div>
            <FieldLabel>Nombre del proyecto</FieldLabel>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isReadOnly}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-warm-800 border border-border dark:border-white/8 text-lean-black dark:text-warm-50 focus:outline-none focus:border-navy dark:focus:border-navy/60 disabled:opacity-50"
            />
          </div>

          <div>
            <FieldLabel>Dominio</FieldLabel>
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              disabled={isReadOnly || t1HasData}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-warm-800 border border-border dark:border-white/8 text-lean-black dark:text-warm-50 focus:outline-none focus:border-navy dark:focus:border-navy/60 disabled:opacity-50"
            >
              <option value="">Seleccionar dominio</option>
              {domains.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
            {t1HasData && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                El dominio está bloqueado porque ya existe una entrevista T1 guardada para este proyecto.
              </p>
            )}
          </div>
        </div>

        {/* Contexto del proyecto */}
        {domainId && (
          <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
            <SectionLabel>Contexto del proyecto</SectionLabel>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Objetivo principal</FieldLabel>
                <textarea
                  value={objetivoPrincipal}
                  onChange={(e) => setObjetivoPrincipal(e.target.value)}
                  disabled={isReadOnly}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-warm-800 border border-border dark:border-white/8 text-lean-black dark:text-warm-50 resize-none focus:outline-none focus:border-navy disabled:opacity-50"
                />
              </div>
              <div>
                <FieldLabel>Horizonte esperado</FieldLabel>
                <LeanSelect
                  value={horizonteValor}
                  onChange={(v) => setHorizonteValor(v)}
                  options={VALUE_HORIZON_OPTIONS}
                  placeholder="Seleccionar plazo..."
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Ecosistema tecnológico</FieldLabel>
                <select
                  value={ecosistemaTecnologico}
                  onChange={(e) => setEcosistemaTecnologico(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-warm-800 border border-border dark:border-white/8 text-lean-black dark:text-warm-50 focus:outline-none focus:border-navy disabled:opacity-50"
                >
                  <option value="">Seleccionar ecosistema</option>
                  {ecosystemOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Restricciones relevantes</FieldLabel>
                <textarea
                  value={restricciones}
                  onChange={(e) => setRestricciones(e.target.value)}
                  disabled={isReadOnly}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-warm-800 border border-border dark:border-white/8 text-lean-black dark:text-warm-50 resize-none focus:outline-none focus:border-navy disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Fricciones y oportunidades */}
        {domainId && (
          <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <SectionLabel>Fricciones y oportunidades</SectionLabel>
              {!isReadOnly && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addFriction}
                >
                  + Añadir
                </Button>
              )}
            </div>

            {fricciones.length > 0 ? (
              <div className="space-y-3">
                {fricciones.map((friction, index) => (
                  <FrictionCard
                    key={friction.id}
                    index={index}
                    friction={friction}
                    onUpdate={(updates) => updateFriction(friction.id, updates)}
                    onRemove={() => removeFriction(friction.id)}
                    areas={departments}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-subtle dark:text-warm-400 italic py-2">
                Sin fricciones registradas. Añade una para comenzar.
              </p>
            )}
          </div>
        )}

        {/* Departamentos implicados */}
        {domainId && (
          <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
            <SectionLabel>Departamentos implicados</SectionLabel>
            {departments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => (
                  <AreaChip
                    key={dept.id}
                    label={dept.name}
                    selected={areasPrioritarias.includes(dept.name)}
                    onToggle={() => toggleArea(dept.name)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-subtle dark:text-warm-400">
                No hay departamentos. Crea algunos en la sección Empresa.
              </p>
            )}
          </div>
        )}
      </div>


      {/* Paquetes contratados — solo superadmin/consultant */}
      {!isReadOnly && (
        <div className="px-8 pt-6 pb-2">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-500 dark:text-warm-400 mb-3">
              Paquetes contratados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(PACKAGE_MODULES) as string[]).map((pkg) => {
                const labels: Record<string, string> = {
                  boost_assessment:    'Boost Assessment (T1 · T2 · T7)',
                  portfolio_management:'Portfolio Management (T3 · T5 · T8 · T9 · T11)',
                  legal_compliance:    'Legal & Compliance (T6 · T12)',
                }
                const checked = contractedPackages.includes(pkg)
                return (
                  <label
                    key={pkg}
                    className={[
                      'flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors',
                      checked
                        ? 'border-gold/50 bg-gold/5 dark:bg-gold/10'
                        : 'border-border dark:border-white/10 hover:bg-black/2 dark:hover:bg-white/3',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setContractedPackages(prev =>
                          checked ? prev.filter(p => p !== pkg) : [...prev, pkg]
                        )
                      }}
                      className="mt-0.5 accent-gold"
                    />
                    <span className="text-xs text-warm-700 dark:text-warm-200 leading-snug">
                      {labels[pkg] ?? pkg}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer con botones */}
      {!isReadOnly && (
        <div className="sticky bottom-0 bg-[rgba(247,244,238,0.95)] dark:bg-warm-900/95 backdrop-blur-sm border-t border-border dark:border-white/6 px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || !name.trim() || !domainId}
              loading={isSaving}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

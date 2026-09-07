// ============================================================
// ProyectosTab — Gestión de proyectos de la empresa
//
// Listado de proyectos, crear nuevo, editar en pantalla detail.
// Solo superadmin/consultant pueden editar.
// ============================================================

import { useState, useEffect } from 'react'
import { Spinner, Button, Modal, FormField } from '@shared/design-system/components'
import {
  getEcosystemOptions,
  getFrictionTypes,
  HORIZON_OPTIONS
} from '@/modules/Admin/constants/ecosystemOptions'
import { listProjectsByCompany, createProject, deleteProject } from '@/services/projects.service'
import { usePermissions } from '@/modules/Auth'
import { useDepartmentStore } from '../useDepartmentStore'
import { reportError } from '@/lib/reportError'
import { ProjectDetailView } from '../ProjectDetailView'
import { ImpactWarningDialog } from '@/shared/components/ImpactWarningDialog'
import type { Friction } from '../types'

interface ProyectoItem {
  id: string
  name: string
}

interface ProyectosTabProps {
  companyId: string
}

export function ProyectosTab({ companyId }: ProyectosTabProps) {
  const { canEditCompanySettings } = usePermissions()
  const { departments } = useDepartmentStore()
  const [projects, setProjects] = useState<ProyectoItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Pantalla de edición
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Eliminar proyecto
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [deletingProjectName, setDeletingProjectName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [objetivoPrincipal, setObjetivoPrincipal] = useState('')
  const [restricciones, setRestricciones] = useState('')
  const [horizonteValor, setHorizonteValor] = useState('')
  const [ecosistemaTecnologico, setEcosistemaTecnologico] = useState('')
  const [fricciones, setFricciones] = useState<Friction[]>([])

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [companyId])

  async function loadProjects() {
    setIsLoading(true)
    try {
      const data = await listProjectsByCompany(companyId)
      setProjects(data)
    } catch (err) {
      reportError('[CompanyProjectsSection] loadProjects', err)
    } finally {
      setIsLoading(false)
    }
  }

  function resetCreateModal() {
    setShowCreateModal(false)
    setProjectName('')
    setObjetivoPrincipal('')
    setRestricciones('')
    setHorizonteValor('')
    setEcosistemaTecnologico('')
    setFricciones([])
    setCreateError(null)
    setCreateSuccess(false)
  }

  function addFriccion() {
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

  async function handleCreateProject() {
    if (!projectName.trim()) {
      setCreateError('El nombre del proyecto es requerido')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      await createProject({
        name: projectName.trim(),
        companyId,
        objetivoPrincipal: objetivoPrincipal.trim() || undefined,
        restricciones: restricciones.trim() || undefined,
        horizonteValor: horizonteValor || undefined,
        ecosistemaTecnologico: ecosistemaTecnologico || undefined,
        friccionesOportunidades: fricciones.length > 0 ? JSON.stringify(fricciones) : undefined,
      })

      setCreateSuccess(true)
      setTimeout(() => {
        loadProjects()
        resetCreateModal()
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear proyecto'
      reportError('[CompanyProjectsSection] handleCreateProject', err)
      setCreateError(msg)
    } finally {
      setIsCreating(false)
    }
  }

  const ecosystemOptions = getEcosystemOptions('ai_adoption')
  const frictionTypes = getFrictionTypes('ai_adoption')

  const textareaClass = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle resize-none"
  const selectClass = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white"

  return (
    <>
      {/* Sección de proyectos */}
      <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-lean-black dark:text-warm-50">Proyectos de la empresa</h3>
          <p className="text-xs text-text-muted dark:text-warm-400 -mt-1">
            Crea y gestiona los proyectos de esta empresa.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          Crear proyecto
        </Button>

        {isLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Spinner size="sm" label="Cargando proyectos…" className="text-text-subtle dark:text-warm-400" />
          </div>
        ) : projects.length > 0 ? (
          <div className="flex flex-col gap-2 mt-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border dark:border-white/6 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-lean-black dark:text-warm-100 truncate">{project.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    Editar
                  </Button>
                  {canEditCompanySettings && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDeletingProjectId(project.id)
                        setDeletingProjectName(project.name)
                        setShowDeleteConfirm(true)
                      }}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-subtle dark:text-warm-400 italic py-2">
            Sin proyectos. Crea el primero para comenzar.
          </p>
        )}
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <Modal
          open={true}
          onClose={resetCreateModal}
          title="Crear proyecto"
          size="lg"
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Nombre y dominio */}
            <FormField
              id="proyecto-nombre"
              label="Nombre del proyecto"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ej: Diagnóstico IA Q3 2026"
              required
            />

            {/* Campos extendidos */}
                <div>
                  <label htmlFor="proyecto-objetivo" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                    Objetivo principal del proyecto
                  </label>
                  <textarea
                    id="proyecto-objetivo"
                    value={objetivoPrincipal}
                    onChange={(e) => setObjetivoPrincipal(e.target.value)}
                    placeholder="Ej: Implementar soluciones de IA generativa para automatizar procesos de atención al cliente"
                    rows={2}
                    className={textareaClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="proyecto-horizonte" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                      Horizonte esperado
                    </label>
                    <select
                      id="proyecto-horizonte"
                      value={horizonteValor}
                      onChange={(e) => setHorizonteValor(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Seleccionar plazo</option>
                      {HORIZON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="proyecto-ecosistema" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                      Ecosistema tecnológico
                    </label>
                    <select
                      id="proyecto-ecosistema"
                      value={ecosistemaTecnologico}
                      onChange={(e) => setEcosistemaTecnologico(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Seleccionar opción</option>
                      {ecosystemOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
              </div>

                <div>
                  <label htmlFor="proyecto-restricciones" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                    Restricciones relevantes
                  </label>
                  <textarea
                    id="proyecto-restricciones"
                    value={restricciones}
                    onChange={(e) => setRestricciones(e.target.value)}
                    placeholder="Ej: Limitaciones regulatorias, presupuesto, capacidad técnica, timeline"
                    rows={2}
                    className={textareaClass}
                  />
                </div>

                {/* Fricciones estructuradas */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-medium text-text-subtle dark:text-warm-400 block flex-shrink-0">
                      Fricciones
                    </label>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={addFriccion}
                      className="whitespace-nowrap"
                    >
                      + Añadir
                    </Button>
                  </div>

                  {fricciones.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {fricciones.map((friction, idx) => (
                        <div key={friction.id} className="bg-warm-50 dark:bg-warm-900 p-3 rounded-lg border border-border dark:border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-text-subtle dark:text-warm-400">Fricción {idx + 1}</span>
                            <button
                              onClick={() => removeFriction(friction.id)}
                              className="text-xs text-danger-dark hover:bg-danger-light/20 px-2 py-1 rounded"
                            >
                              Eliminar
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <select
                                value={friction.tipo}
                                onChange={(e) => updateFriction(friction.id, { tipo: e.target.value })}
                                className="w-full px-2 py-1 rounded border border-border text-[11px] bg-white dark:bg-warm-800"
                              >
                                <option value="">Tipo</option>
                                {frictionTypes.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select
                                value={friction.areaFuncional}
                                onChange={(e) => updateFriction(friction.id, { areaFuncional: e.target.value })}
                                className="w-full px-2 py-1 rounded border border-border text-[11px] bg-white dark:bg-warm-800"
                              >
                                <option value="">Área</option>
                                {departments.length > 0 ? (
                                  departments.map(dept => (
                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                  ))
                                ) : (
                                  <option disabled>Sin departamentos</option>
                                )}
                              </select>
                            </div>
                            <div>
                              <select
                                value={friction.frecuencia || ''}
                                onChange={(e) => updateFriction(friction.id, { frecuencia: e.target.value as any })}
                                className="w-full px-2 py-1 rounded border border-border text-[11px] bg-white dark:bg-warm-800"
                              >
                                <option value="">Frecuencia</option>
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                              </select>
                            </div>
                            <div>
                              <select
                                value={friction.impacto || ''}
                                onChange={(e) => updateFriction(friction.id, { impacto: e.target.value as any })}
                                className="w-full px-2 py-1 rounded border border-border text-[11px] bg-white dark:bg-warm-800"
                              >
                                <option value="">Impacto</option>
                                <option value="Bajo">Bajo</option>
                                <option value="Medio">Medio</option>
                                <option value="Alto">Alto</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <textarea
                                value={friction.notas}
                                onChange={(e) => updateFriction(friction.id, { notas: e.target.value })}
                                placeholder="Notas..."
                                rows={1}
                                className="w-full px-2 py-1 rounded border border-border text-[11px] bg-white dark:bg-warm-800 resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-subtle dark:text-warm-400 italic py-2">
                      Sin fricciones. Usa el botón "Añadir" para empezar.
                    </p>
                  )}
            </div>

            {/* Error */}
            {createError && (
              <p className="text-xs text-danger-dark bg-danger-light/10 p-2 rounded-lg">{createError}</p>
            )}

            {/* Botones */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={resetCreateModal}
                disabled={isCreating || createSuccess}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateProject}
                disabled={!projectName.trim() || isCreating}
                loading={isCreating}
              >
                {createSuccess ? '✓ Creado' : 'Crear'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pantalla de edición de proyecto */}
      {selectedProjectId && (
        <ProjectDetailView
          projectId={selectedProjectId}
          companyId={companyId}
          onClose={() => {
            setSelectedProjectId(null)
            loadProjects()
          }}
        />
      )}

      {/* Dialog de confirmación para eliminar proyecto */}
      <ImpactWarningDialog
        isOpen={showDeleteConfirm}
        title="Eliminar proyecto"
        impactDescription={`¿Estás seguro de que quieres eliminar el proyecto "${deletingProjectName}"? Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al proyecto.`}
        onConfirm={async () => {
          if (!deletingProjectId) return
          setIsDeleting(true)
          try {
            await deleteProject(deletingProjectId)
            loadProjects()
            setShowDeleteConfirm(false)
            setDeletingProjectId(null)
            setDeletingProjectName('')
          } catch (err) {
            reportError('[ProyectosTab] deleteProject', err)
          } finally {
            setIsDeleting(false)
          }
        }}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeletingProjectId(null)
          setDeletingProjectName('')
        }}
        isLoading={isDeleting}
      />
    </>
  )
}

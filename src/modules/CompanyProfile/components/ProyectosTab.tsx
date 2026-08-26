// ============================================================
// ProyectosTab — Gestión de proyectos de la empresa
//
// Listado de proyectos, crear nuevo, editar en pantalla detail.
// Solo superadmin/consultant pueden editar.
// ============================================================

import { useState, useEffect } from 'react'
import { Spinner, Button, Modal, FormField } from '@shared/design-system/components'
import { getEcosystemOptions, getFrictionLabel, HORIZON_OPTIONS } from '@/modules/Admin/constants/ecosystemOptions'
import { listProjectsByCompany, createProject, deleteProject } from '@/services/projects.service'
import { loadActiveDomains } from '@/services/domains.service'
import { usePermissions } from '@/modules/Auth'
import { reportError } from '@/lib/reportError'
import { ProjectDetailView } from '../ProjectDetailView'
import { ImpactWarningDialog } from '@/shared/components/ImpactWarningDialog'
import type { GovernanceDomain } from '@/services/domains.service'

interface ProyectoItem {
  id: string
  name: string
}

interface ProyectosTabProps {
  companyId: string
}

export function ProyectosTab({ companyId }: ProyectosTabProps) {
  const { canEditCompanySettings } = usePermissions()
  const [projects, setProjects] = useState<ProyectoItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [domains, setDomains] = useState<GovernanceDomain[]>([])

  // Pantalla de edición
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Eliminar proyecto
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [deletingProjectName, setDeletingProjectName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [domainId, setDomainId] = useState('')
  const [objetivoPrincipal, setObjetivoPrincipal] = useState('')
  const [restricciones, setRestricciones] = useState('')
  const [horizonteValor, setHorizonteValor] = useState('')
  const [ecosistemaTecnologico, setEcosistemaTecnologico] = useState('')
  const [friccionesOportunidades, setFriccionesOportunidades] = useState('')

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  useEffect(() => {
    loadProjects()
    loadActiveDomains().then(setDomains).catch((err: unknown) => reportError('[CompanyProjectsSection]', err))
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
    setDomainId('')
    setObjetivoPrincipal('')
    setRestricciones('')
    setHorizonteValor('')
    setEcosistemaTecnologico('')
    setFriccionesOportunidades('')
    setCreateError(null)
    setCreateSuccess(false)
  }

  async function handleCreateProject() {
    if (!projectName.trim() || !domainId) {
      setCreateError('Nombre del proyecto y dominio son requeridos')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      await createProject({
        name: projectName.trim(),
        companyId,
        domainId,
        objetivoPrincipal: objetivoPrincipal.trim() || undefined,
        restricciones: restricciones.trim() || undefined,
        horizonteValor: horizonteValor || undefined,
        ecosistemaTecnologico: ecosistemaTecnologico || undefined,
        friccionesOportunidades: friccionesOportunidades.trim() || undefined,
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

  const selectedDomain = domains.find((d) => d.id === domainId)
  const selectedDomainSlug = selectedDomain?.slug
  const ecosystemOptions = getEcosystemOptions(selectedDomainSlug)
  const frictionLabel = getFrictionLabel(selectedDomainSlug)

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
          size="md"
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

            <div>
              <label htmlFor="proyecto-dominio" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                Dominio <span className="text-danger-dark">*</span>
              </label>
              <select
                id="proyecto-dominio"
                value={domainId}
                onChange={(e) => setDomainId(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">Seleccionar dominio</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Campos extendidos (solo si dominio seleccionado) */}
            {domainId && (
              <>
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
                      <option value="">Seleccionar ecosistema</option>
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

                <div>
                  <label htmlFor="proyecto-fricciones" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                    {frictionLabel}
                  </label>
                  <textarea
                    id="proyecto-fricciones"
                    value={friccionesOportunidades}
                    onChange={(e) => setFriccionesOportunidades(e.target.value)}
                    placeholder="Ej: Brecha de competencias, poca adopción de tecnología, resistencia al cambio, etc."
                    rows={2}
                    className={textareaClass}
                  />
                </div>
              </>
            )}

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
                disabled={!projectName.trim() || !domainId || isCreating}
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

// ============================================================
// CompanyProfile — Tab Organización
//
// Gestión de departamentos y personas de la empresa.
// Sección A: CRUD de departamentos (solo canEditCompanySettings)
// Sección B: Vista lista/organigrama de personas agrupadas por departamento
// ============================================================

import { useState, useEffect } from 'react'
import { usePermissions } from '@/modules/Auth'
import { Spinner, Badge } from '@shared/design-system/components'
import { reportError } from '@/lib/reportError'
import { fetchPersonsByCompany, getPersonImpact, deletePerson } from '@/services/company-person.service'
import { useDepartmentStore } from '../useDepartmentStore'
import type { CompanyPerson } from '../useCompanyPersonStore'
import { DepartmentManager } from '../DepartmentManager'
import { SectionLabel } from './CompanyProfileHelpers'
import { ImpactWarningDialog } from '@/shared/components/ImpactWarningDialog'
import { EditPersonModal } from './EditPersonModal'

interface OrganizacionTabProps {
  companyId: string
}

type ViewMode = 'lista' | 'organigrama'

export function OrganizacionTab({ companyId }: OrganizacionTabProps) {
  const { canEditCompanySettings } = usePermissions()
  const { departments } = useDepartmentStore()

  const [viewMode, setViewMode] = useState<ViewMode>('lista')
  const [personas, setPersonas] = useState<CompanyPerson[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingPerson, setEditingPerson] = useState<CompanyPerson | null>(null)
  const [deletingPerson, setDeletingPerson] = useState<CompanyPerson | null>(null)
  const [impactWarningOpen, setImpactWarningOpen] = useState(false)
  const [impactDescription, setImpactDescription] = useState('')

  // Cargar personas
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchPersonsByCompany(companyId)
        setPersonas(data)
      } catch (err) {
        reportError('[OrganizacionTab] loadPersonas', err)
        setError(err instanceof Error ? err.message : 'Error al cargar personas')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [companyId])

  // Agrupar personas por departamento
  const personasPorDept = personas.reduce((acc, p) => {
    const dept = p.department || 'Sin departamento'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(p)
    return acc
  }, {} as Record<string, CompanyPerson[]>)

  async function handleDeletePersonClick(person: CompanyPerson) {
    setDeletingPerson(person)
    try {
      const impact = await getPersonImpact(person.id)
      if (impact.activeProjects.length > 0) {
        const projectNames = impact.activeProjects.map(p => p.name).join(', ')
        setImpactDescription(
          `⚠️ Esta persona participa en ${impact.activeProjects.length} proyecto(s) activo(s): ${projectNames}.\n` +
          `¿Confirmas la eliminación?`
        )
      } else {
        setImpactDescription('¿Confirmas la eliminación de esta persona?')
      }
      setImpactWarningOpen(true)
    } catch (err) {
      reportError('[OrganizacionTab] handleDeletePersonClick', err)
      setError(err instanceof Error ? err.message : 'Error al verificar impacto')
    }
  }

  async function handleConfirmDelete() {
    if (!deletingPerson) return
    try {
      await deletePerson(deletingPerson.id)
      setPersonas(prev => prev.filter(p => p.id !== deletingPerson.id))
      setImpactWarningOpen(false)
      setDeletingPerson(null)
    } catch (err) {
      reportError('[OrganizacionTab] handleConfirmDelete', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar persona')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" label="Cargando…" />
      </div>
    )
  }

  return (
    <>
      {/* Sección A — Departamentos */}
      <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
        <div>
          <SectionLabel>Departamentos</SectionLabel>
          <p className="text-xs text-text-muted dark:text-warm-400 -mt-1">
            Estructura organizacional de la empresa. Disponible como selector en herramientas.
          </p>
        </div>
        <DepartmentManager companyId={companyId} />
      </div>

      {/* Separador */}
      <hr className="border-border dark:border-white/6" />

      {/* Sección B — Personas */}
      <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <SectionLabel>Personas</SectionLabel>
            <p className="text-xs text-text-muted dark:text-warm-400 -mt-1">
              Equipo de la empresa agrupado por departamento.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setViewMode('lista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'lista'
                  ? 'bg-navy text-white'
                  : 'text-text-muted hover:text-lean-black dark:text-warm-300 dark:hover:text-warm-100'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('organigrama')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'organigrama'
                  ? 'bg-navy text-white'
                  : 'text-text-muted hover:text-lean-black dark:text-warm-300 dark:hover:text-warm-100'
              }`}
            >
              Organigrama
            </button>
          </div>
        </div>

        {error && (
          <div className="text-xs text-danger bg-danger-light px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {personas.length === 0 ? (
          <p className="text-xs text-text-muted py-4">Sin personas registradas</p>
        ) : viewMode === 'lista' ? (
          // Vista Lista
          <div className="space-y-4">
            {Object.entries(personasPorDept).map(([deptName, deptPersonas]) => (
              <div key={deptName} className="space-y-2">
                <h3 className="text-xs font-semibold text-lean-black dark:text-warm-50">{deptName}</h3>
                <div className="space-y-2 pl-3 border-l-2 border-border dark:border-white/10">
                  {deptPersonas.map(persona => (
                    <div
                      key={persona.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-warm-50 dark:bg-warm-900 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-lean-black dark:text-warm-50">{persona.name}</p>
                        <p className="text-xs text-text-muted dark:text-warm-400">{persona.role}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {persona.source_tool === 'company_profile' && (
                          <Badge variant="gold">manual</Badge>
                        )}
                        {canEditCompanySettings && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingPerson(persona)}
                              className="p-1 text-text-muted hover:text-lean-black dark:text-warm-400 dark:hover:text-warm-100 transition-colors"
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDeletePersonClick(persona)}
                              className="p-1 text-text-muted hover:text-danger dark:text-warm-400 dark:hover:text-danger transition-colors"
                              title="Eliminar"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Vista Organigrama
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(personasPorDept).map(([deptName, deptPersonas]) => {
              const dept = departments.find(d => d.name === deptName)
              const deptColor = dept?.color || '#C8860A'
              return (
                <div
                  key={deptName}
                  className="rounded-lg border border-border dark:border-white/6 overflow-hidden"
                  style={{ borderLeftWidth: '4px', borderLeftColor: deptColor }}
                >
                  <div className="bg-warm-50 dark:bg-warm-900 p-3 space-y-2">
                    <h4 className="text-xs font-semibold text-lean-black dark:text-warm-50">{deptName}</h4>
                    <div className="space-y-1">
                      {deptPersonas.map(persona => (
                        <div key={persona.id} className="text-xs">
                          <p className="font-medium text-lean-black dark:text-warm-50">{persona.name}</p>
                          <p className="text-text-muted dark:text-warm-400">{persona.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modales */}
      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          departments={[]}
          onClose={() => {
            setEditingPerson(null)
            // Reload personas after edit
            async function reload() {
              const updated = await fetchPersonsByCompany(companyId)
              setPersonas(updated)
            }
            reload()
          }}
        />
      )}

      <ImpactWarningDialog
        isOpen={impactWarningOpen}
        title="Confirmar eliminación"
        impactDescription={impactDescription}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setImpactWarningOpen(false)
          setDeletingPerson(null)
        }}
      />
    </>
  )
}

// ============================================================
// CompanyPeopleSection — Personas en la empresa (company_persons)
//
// Lista las personas registradas en TODOS los proyectos de la
// empresa activa (nombre, cargo, departamento real, proyecto de
// origen, tool de origen) y permite añadir una nueva persona
// eligiendo primero el proyecto al que pertenece.
//
// Filtros por perfil (type de company_departments), departamento
// (nombre real) y proyecto, combinables sobre el listado ya
// cargado en cliente.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useCompanyPersonStore, type CompanyPerson } from '../useCompanyPersonStore'
import { useDepartmentStore, type DepartmentType } from '../useDepartmentStore'
import { usePermissions }        from '@/modules/Auth'
import { Spinner, Badge, Button, Modal, Select, FormField } from '@shared/design-system/components'
import type { SelectOption } from '@shared/design-system/components'
import { SectionLabel } from './CompanyProfileHelpers'
import { MergePersonsModal } from './MergePersonsModal'
import { EditPersonModal } from './EditPersonModal'
import { DEPARTMENT_TYPE_LABEL, DEPARTMENT_CHIP_CLASS, DEPARTMENT_DOT_CLASS } from '../departmentDisplay'
import { listProjectsByCompany } from '@/services/projects.service'
import { reportError } from '@/lib/reportError'

interface CompanyPeopleSectionProps {
  companyId: string | null
}

const ALL_VALUE = 'all'

export function CompanyPeopleSection({ companyId }: CompanyPeopleSectionProps) {
  const { canEditCompanySettings } = usePermissions()
  const { persons, isLoading, fetchPersonsByCompany, addPerson } = useCompanyPersonStore()
  const { departments, fetchDepartments } = useDepartmentStore()

  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([])
  const [profileFilter, setProfileFilter] = useState<DepartmentType | typeof ALL_VALUE>(ALL_VALUE)
  const [deptFilter,    setDeptFilter]    = useState<string>(ALL_VALUE)
  const [projectFilter, setProjectFilter] = useState<string>(ALL_VALUE)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addPersonProjectId, setAddPersonProjectId] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonRole, setNewPersonRole] = useState('')
  const [newPersonDept, setNewPersonDept] = useState('')
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<CompanyPerson | null>(null)

  function resetAddPersonModal() {
    setShowAddModal(false)
    setAddPersonProjectId('')
    setNewPersonName('')
    setNewPersonRole('')
    setNewPersonDept('')
  }

  async function handleAddPerson() {
    if (!newPersonName.trim() || !addPersonProjectId) return
    setIsAddingPerson(true)
    try {
      await addPerson({
        projectId:  addPersonProjectId,
        companyId:  companyId ?? undefined,
        name:       newPersonName.trim(),
        role:       newPersonRole.trim(),
        department: newPersonDept,
        sourceTool: 'company_profile',
      })
      resetAddPersonModal()
    } finally {
      setIsAddingPerson(false)
    }
  }

  useEffect(() => {
    if (!companyId) return
    void fetchPersonsByCompany(companyId)
    void fetchDepartments(companyId)
    listProjectsByCompany(companyId)
      .then(setProjectOptions)
      .catch((err) => reportError('[CompanyPeopleSection] listProjectsByCompany', err))
  }, [companyId, fetchPersonsByCompany, fetchDepartments])

  // Cruce departamento real: matchea person.department (texto libre)
  // contra company_departments.name de esta empresa.
  function matchDepartment(person: CompanyPerson) {
    const name = person.department.trim().toLowerCase()
    if (!name) return null
    return departments.find((d) => d.name.toLowerCase() === name) ?? null
  }

  const filteredPersons = useMemo(() => {
    return persons.filter((person) => {
      if (projectFilter !== ALL_VALUE && person.project_id !== projectFilter) return false
      if (deptFilter !== ALL_VALUE && person.department.toLowerCase() !== deptFilter.toLowerCase()) return false
      if (profileFilter !== ALL_VALUE) {
        const match = matchDepartment(person)
        if (!match || match.type !== profileFilter) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons, departments, profileFilter, deptFilter, projectFilter])

  if (!companyId) return null

  const profileOptions: SelectOption[] = [
    { value: ALL_VALUE, label: 'Todos los perfiles' },
    { value: 'it',          label: DEPARTMENT_TYPE_LABEL.it },
    { value: 'negocio_ops', label: DEPARTMENT_TYPE_LABEL.negocio_ops },
  ]
  const departmentOptions: SelectOption[] = [
    { value: ALL_VALUE, label: 'Todos los departamentos' },
    ...departments.map((d) => ({ value: d.name, label: d.name })),
  ]
  const projectFilterOptions: SelectOption[] = [
    { value: ALL_VALUE, label: 'Todos los proyectos' },
    ...projectOptions.map((p) => ({ value: p.id, label: p.name })),
  ]

  return (
    <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Personas en la empresa</SectionLabel>
          <p className="text-xs text-text-muted dark:text-warm-400 -mt-1">
            Personas registradas en todos los proyectos de esta empresa, reutilizables desde T1, T2, T3 y T9.
          </p>
        </div>
        {canEditCompanySettings && (
          <div className="flex items-center gap-2 shrink-0">
            {persons.length >= 2 && (
              <Button variant="ghost" size="sm" onClick={() => setShowMergeModal(true)}>
                Fusionar personas
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
              Añadir persona
            </Button>
          </div>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Select
          aria-label="Filtrar por perfil"
          options={profileOptions}
          value={profileFilter}
          onChange={(e) => setProfileFilter(e.target.value as DepartmentType | typeof ALL_VALUE)}
        />
        <Select
          aria-label="Filtrar por departamento"
          options={departmentOptions}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        />
        <Select
          aria-label="Filtrar por proyecto"
          options={projectFilterOptions}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-1">
          <Spinner size="sm" label="Cargando personas…" className="text-text-subtle dark:text-warm-400" />
          <span className="text-xs text-text-subtle dark:text-warm-400 font-mono">Cargando personas...</span>
        </div>
      ) : filteredPersons.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filteredPersons.map((person) => {
            const match = matchDepartment(person)
            return (
              <div
                key={person.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border dark:border-white/6 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-lean-black dark:text-warm-100 truncate">{person.name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-[10px] text-text-subtle dark:text-warm-400 truncate">
                      {person.role || 'Sin cargo'}
                    </span>
                    {match ? (
                      <span
                        title={DEPARTMENT_TYPE_LABEL[match.type]}
                        className={[
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          DEPARTMENT_CHIP_CLASS[match.type],
                        ].join(' ')}
                      >
                        <span className={['h-1 w-1 rounded-full shrink-0', DEPARTMENT_DOT_CLASS[match.type]].join(' ')} aria-hidden="true" />
                        {person.department}
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-subtle dark:text-warm-400 truncate">
                        · {person.department || 'Sin departamento'}
                      </span>
                    )}
                    {person.project_name && (
                      <span className="text-[10px] text-text-subtle dark:text-warm-400 truncate">
                        · Proyecto: {person.project_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="navy-ghost" size="xs" className="rounded-md font-mono uppercase tracking-wider">
                    {person.source_tool}
                  </Badge>
                  {canEditCompanySettings && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingPerson(person)}>
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-text-subtle dark:text-warm-400 italic py-1">
          {persons.length === 0
            ? 'Sin personas registradas. Añádelas aquí o desde T1, T2, T3 y T9.'
            : 'Ningún resultado con los filtros seleccionados.'}
        </p>
      )}

      {showAddModal && (
        <Modal
          open={true}
          onClose={resetAddPersonModal}
          title="Añadir persona"
          size="sm"
        >
          <div className="space-y-4">
            <Select
              label="Proyecto"
              placeholder="Selecciona el proyecto de esta persona"
              options={projectOptions.map((p) => ({ value: p.id, label: p.name }))}
              value={addPersonProjectId}
              onChange={(e) => setAddPersonProjectId(e.target.value)}
            />
            {addPersonProjectId && (
              <>
                <FormField
                  id="new-company-person-name"
                  label="Nombre completo"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  required
                />
                <FormField
                  id="new-company-person-role"
                  label="Cargo"
                  value={newPersonRole}
                  onChange={(e) => setNewPersonRole(e.target.value)}
                />
                <Select
                  label="Departamento"
                  placeholder="Selecciona un departamento"
                  options={departments.map((d) => ({ value: d.name, label: d.name }))}
                  value={newPersonDept}
                  onChange={(e) => setNewPersonDept(e.target.value)}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => void handleAddPerson()}
                  disabled={!newPersonName.trim()}
                  loading={isAddingPerson}
                >
                  Guardar persona
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}

      {showMergeModal && (
        <MergePersonsModal
          companyId={companyId}
          persons={persons}
          onClose={() => setShowMergeModal(false)}
        />
      )}

      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          departments={departments}
          onClose={() => setEditingPerson(null)}
        />
      )}
    </div>
  )
}

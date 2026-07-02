// ============================================================
// TeamSection — Equipo del proyecto (company_persons)
//
// Lista las personas registradas en el proyecto activo (nombre,
// cargo, departamento, tool de origen) y permite añadir una
// nueva persona via PersonSelectField en modo creación.
// ============================================================

import { useEffect, useState } from 'react'
import { useCompanyPersonStore } from '../useCompanyPersonStore'
import { usePermissions }        from '@/modules/Auth'
import { Spinner, Badge, Button, Modal, PersonSelectField } from '@shared/design-system/components'
import { SectionLabel } from './CompanyProfileHelpers'
import { MergePersonsModal } from './MergePersonsModal'

interface TeamSectionProps {
  projectId: string | null
  companyId: string | null
}

export function TeamSection({ projectId, companyId }: TeamSectionProps) {
  const { canEditCompanySettings } = usePermissions()
  const { persons, isLoading, fetchPersons } = useCompanyPersonStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)

  useEffect(() => {
    if (projectId) void fetchPersons(projectId)
  }, [projectId, fetchPersons])

  if (!projectId) return null

  return (
    <div className="rounded-xl bg-white dark:bg-warm-800 border border-border dark:border-white/6 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Equipo del proyecto</SectionLabel>
          <p className="text-xs text-text-muted dark:text-warm-400 -mt-1">
            Personas registradas en este proyecto, reutilizables desde T1, T2, T3 y T9.
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

      {isLoading ? (
        <div className="flex items-center gap-2 py-1">
          <Spinner size="sm" label="Cargando equipo…" className="text-text-subtle dark:text-warm-400" />
          <span className="text-xs text-text-subtle dark:text-warm-400 font-mono">Cargando equipo...</span>
        </div>
      ) : persons.length > 0 ? (
        <div className="flex flex-col gap-2">
          {persons.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border dark:border-white/6 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-lean-black dark:text-warm-100 truncate">{person.name}</p>
                <p className="text-[10px] text-text-subtle dark:text-warm-400 truncate">
                  {person.role || 'Sin cargo'} · {person.department || 'Sin departamento'}
                </p>
              </div>
              <Badge variant="navy-ghost" size="xs" className="rounded-md font-mono uppercase tracking-wider shrink-0">
                {person.source_tool}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-subtle dark:text-warm-400 italic py-1">
          Sin personas registradas. Añádelas aquí o desde T1, T2, T3 y T9.
        </p>
      )}

      {showAddModal && (
        <Modal open={true} onClose={() => setShowAddModal(false)} title="Añadir persona" size="sm">
          <PersonSelectField
            projectId={projectId}
            companyId={companyId ?? undefined}
            sourceTool="company_profile"
            label="Persona"
            onChange={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {showMergeModal && (
        <MergePersonsModal
          projectId={projectId}
          persons={persons}
          onClose={() => setShowMergeModal(false)}
        />
      )}
    </div>
  )
}

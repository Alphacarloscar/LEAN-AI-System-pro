// ============================================================
// ProjectMembersView — Gestión de miembros del proyecto
//
// Main screen for listing, adding, editing roles, and removing
// project members with role-based permissions (consultant/client_editor
// can write; client_viewer read-only; paused/archived/completed
// projects force read-only for all).
//
// Keeps under 400 lines (ADR-013); splits into sub-components
// for table and modal as needed.
// ============================================================

import { useEffect, useState } from 'react'
import { Card, Button, Spinner } from '@shared/design-system/components'
import { Plus } from 'lucide-react'
import { useProjectMembership } from '@/shared/guards/ProjectMembershipGuard'
import { useProjectMembersStore } from './store/useProjectMembersStore'
import { MembersTable } from './components/MembersTable'
import { AddMemberModal } from './components/AddMemberModal'

export function ProjectMembersView({ projectId }: { projectId: string }) {
  const { myRole, isProjectReadOnly } = useProjectMembership()
  const { members, loading, error, fetchMembers, clearError } = useProjectMembersStore()
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchMembers(projectId).catch(() => {
      // Error handled in store; displayed in UI
    })
  }, [projectId, fetchMembers])

  const canWrite = !isProjectReadOnly && myRole !== null && ['consultant', 'client_editor'].includes(myRole)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-950">Miembros del proyecto</h1>
          <p className="mt-1 text-sm text-warm-600">
            Gestiona quién tiene acceso a este proyecto y sus permisos
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="md"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Añadir miembro
          </Button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <div className="flex items-start justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-red-600 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" label="Cargando miembros…" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-warm-600">No hay miembros en este proyecto</p>
            {canWrite && (
              <Button
                onClick={() => setShowAddModal(true)}
                variant="secondary"
                size="sm"
                className="mt-4"
              >
                Añadir primer miembro
              </Button>
            )}
          </div>
        ) : (
          <MembersTable
            members={members}
            canWrite={canWrite}
            projectId={projectId}
          />
        )}
      </Card>

      {/* Add member modal */}
      {showAddModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

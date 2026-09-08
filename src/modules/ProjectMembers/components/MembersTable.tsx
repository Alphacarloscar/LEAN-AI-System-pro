// ============================================================
// MembersTable — Tabla de miembros del proyecto
//
// Columns: Nombre, Departamento, Rol en proyecto, Tiene cuenta, Acciones
// Actions: cambiar rol, eliminar (disabled cuando !canWrite)
// ============================================================

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useProjectMembersStore } from '../store/useProjectMembersStore'
import type { ProjectMember } from '@/services/project-members.service'

interface MembersTableProps {
  members: ProjectMember[]
  canWrite: boolean
  projectId: string
}

export function MembersTable({ members, canWrite, projectId }: MembersTableProps) {
  const { updateMemberRole, removeMember } = useProjectMembersStore()
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateMemberRole(
        projectId,
        userId,
        newRole as 'consultant' | 'client_editor' | 'client_viewer'
      )
    } catch {
      // Error handled in store
    }
  }

  const handleDelete = async (userId: string) => {
    if (!window.confirm('¿Eliminar este miembro del proyecto?')) {
      return
    }
    try {
      setDeletingUserId(userId)
      await removeMember(projectId, userId)
    } catch {
      // Error handled in store
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-warm-200 bg-warm-50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-warm-900">Nombre</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-warm-900">Email</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-warm-900">Rol en proyecto</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-warm-900">Tiene cuenta</th>
            {canWrite && <th className="px-4 py-3 text-left text-sm font-semibold text-warm-900">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.user_id} className="border-b border-warm-100 hover:bg-warm-50">
              <td className="px-4 py-3 text-sm">{member.profiles?.name || '—'}</td>
              <td className="px-4 py-3 text-sm text-warm-600">{member.profiles?.email || '—'}</td>
              <td className="px-4 py-3 text-sm">
                {canWrite ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                    className="rounded border border-warm-300 px-2 py-1 text-sm"
                  >
                    <option value="consultant">Consultor</option>
                    <option value="client_editor">Editor de cliente</option>
                    <option value="client_viewer">Visualizador</option>
                  </select>
                ) : (
                  <span className="inline-block rounded bg-warm-100 px-2 py-1 text-sm text-warm-900">
                    {member.role === 'consultant' ? 'Consultor' : member.role === 'client_editor' ? 'Editor' : 'Visualizador'}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {member.profiles?.id ? '✓ Sí' : '— No'}
              </td>
              {canWrite && (
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleDelete(member.user_id)}
                    disabled={deletingUserId === member.user_id}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-red-100 disabled:opacity-50"
                    aria-label="Eliminar miembro"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

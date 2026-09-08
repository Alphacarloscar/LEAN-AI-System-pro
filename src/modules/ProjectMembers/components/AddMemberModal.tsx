// ============================================================
// AddMemberModal — Modal para añadir miembro al proyecto
//
// Permite:
// 1. Seleccionar persona existente (reutilizando PersonSelectField)
// 2. Asignar rol en proyecto
// 3. Opcionalmente invitar cuenta de usuario
//
// Versión MVP: sin crear "nueva persona en el acto" aún
// (ese flujo se puede extender luego con EditPersonModal)
// ============================================================

import { useState } from 'react'
import { Button, Modal, Checkbox, Spinner } from '@shared/design-system/components'
import type { ProjectMemberRole } from '@/services/project-members.service'

interface AddMemberModalProps {
  projectId: string
  onClose: () => void
}

export function AddMemberModal({ projectId: _projectId, onClose }: AddMemberModalProps) {
  // const { inviteAndAddMember } = useProjectMembersStore()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<ProjectMemberRole>('client_viewer')
  const [createAccount, setCreateAccount] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !name) {
      setError('Email y nombre son requeridos')
      return
    }

    try {
      setLoading(true)
      // TODO: Implement actual invite + add member flow once edge function is ready
      if (createAccount) {
        setError('La función de invitar aún no está implementada. Por favor, crea la cuenta manualmente.')
      } else {
        setError('Debes seleccionar una persona existente o crear una nueva cuenta')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al añadir miembro'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Añadir miembro al proyecto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-warm-900">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-warm-300 px-3 py-2 text-sm focus:border-warm-500 focus:outline-none"
            placeholder="Juan Pérez"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-900">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-warm-300 px-3 py-2 text-sm focus:border-warm-500 focus:outline-none"
            placeholder="juan@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-900">Rol en proyecto</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ProjectMemberRole)}
            className="mt-1 w-full rounded border border-warm-300 px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="client_viewer">Visualizador (lectura)</option>
            <option value="client_editor">Editor (escritura limitada)</option>
            <option value="consultant">Consultor (acceso completo)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={createAccount}
            onChange={(e) => setCreateAccount(e.target.checked)}
            disabled={loading}
          />
          <label className="text-sm text-warm-700">
            Crear cuenta de usuario e invitar por email
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-warm-200 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading && <Spinner size="sm" />}
            {loading ? 'Añadiendo…' : 'Añadir'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

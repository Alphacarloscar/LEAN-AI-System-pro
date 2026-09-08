// ============================================================
// AccessDeniedView — 403 Forbidden screen
//
// Shown when a user does not have access to a resource
// (e.g., not a member of a project).
// ============================================================

import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/design-system/components'

export function AccessDeniedView({ returnPath = '/evaluation' }: { returnPath?: string }) {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen w-full items-center justify-center bg-warm-50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl font-bold text-warm-300">403</div>
        <h1 className="mb-2 text-2xl font-semibold text-warm-950">Acceso denegado</h1>
        <p className="mb-8 text-warm-700">
          No tienes permiso para acceder a este proyecto. Si crees que es un error,
          contacta con un administrador.
        </p>
        <Button
          onClick={() => navigate(returnPath)}
          variant="primary"
          size="md"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Volver
        </Button>
      </div>
    </div>
  )
}

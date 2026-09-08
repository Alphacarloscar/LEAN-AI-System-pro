// ============================================================
// UserProfileView — Página de perfil de usuario
//
// Muestra información del usuario autenticado:
//   — Email
//   — Nombre
//   — Rol
//   — Fecha de creación de cuenta
// Acciones disponibles:
//   — Cambiar contraseña (enlace a /update-password)
//   — Volver al dashboard
// ============================================================

import { useNavigate }           from 'react-router-dom'
import { useAuthStore }          from '@/modules/Auth'
import { Card, Button }          from '@shared/design-system/components'
import { DEFAULT_REDIRECT }      from '@/config/routes'

export function UserProfileView() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-text-subtle">No hay usuario autenticado</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-lean-black dark:text-warm-50 mb-2">
          Mi perfil
        </h1>
        <p className="text-sm text-text-subtle">
          Información de tu cuenta en GOBY
        </p>
      </div>

      {/* Contenido principal */}
      <div className="max-w-2xl">
        {/* Card de información */}
        <Card className="p-6 mb-6">
          <div className="space-y-6">
            {/* Avatar + nombre */}
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-semibold"
                style={{
                  backgroundColor: 'rgba(200, 134, 10, 0.1)',
                  color: '#C8860A',
                }}
              >
                {user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-lean-black dark:text-warm-50">
                  {user.name}
                </h2>
                <p className="text-sm text-text-subtle mt-1">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Detalles */}
            <div className="grid grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-2">
                  Email
                </label>
                <p className="text-sm text-lean-black dark:text-warm-100">
                  {user.email}
                </p>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-2">
                  Rol
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-lean-black dark:text-warm-100">
                    {user.role === 'superadmin' ? 'Administrador' : 'Usuario'}
                  </span>
                  {user.role === 'superadmin' && (
                    <span className="inline-block px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-mono font-semibold rounded">
                      SUPERADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de acciones */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-lean-black dark:text-warm-50 mb-4">
            Acciones
          </h3>
          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/update-password')}
              size="sm"
              className="w-full"
            >
              Cambiar contraseña
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(DEFAULT_REDIRECT)}
              size="sm"
              className="w-full"
            >
              Volver al dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

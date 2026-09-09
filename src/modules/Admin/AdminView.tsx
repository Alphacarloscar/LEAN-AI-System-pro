// ============================================================
// GOBY — AdminView (/admin)
//
// Sprint 9: panel de administración exclusivo para superadmin.
// Refactorizado como landing page (v2.2.1):
//   - 3 tarjetas de navegación que llevan a ListViews separadas
//   - AdminView es ahora solo la landing, no contiene tabs
//
// Roles del sistema (4 niveles):
//   superadmin    → Alpha platform admin — acceso global
//   consultant    → Consultor Alpha — acceso por project_members
//   client_editor → Cliente operativo — edita su empresa
//   client_viewer → Cliente directivo — solo lectura
// ============================================================

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, Folder } from 'lucide-react'
import { useAuthStore } from '@/modules/Auth'

interface NavCard {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  path: string
}

const NAV_CARDS: NavCard[] = [
  {
    id: 'companies',
    label: 'Empresas',
    description: 'Gestión de empresas, planes y configuración',
    icon: <Building2 size={24} strokeWidth={1.5} />,
    path: '/admin/companies',
  },
  {
    id: 'users',
    label: 'Usuarios',
    description: 'Gestión de usuarios, roles e invitaciones',
    icon: <Users size={24} strokeWidth={1.5} />,
    path: '/admin/users',
  },
  {
    id: 'projects',
    label: 'Proyectos',
    description: 'Visión global de todos los proyectos',
    icon: <Folder size={24} strokeWidth={1.5} />,
    path: '/admin/projects',
  },
]

export function AdminView() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Redirigir si no es superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') navigate('/', { replace: true })
  }, [user, navigate])

  if (!user || user.role !== 'superadmin') return null

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-12">
        <span className="text-xs font-mono uppercase tracking-widest text-gold">
          Platform Admin
        </span>
        <h1 className="text-3xl font-semibold text-lean-black dark:text-warm-50 mt-2">Administración</h1>
        <p className="text-sm text-text-muted mt-3">
          Panel de gestión de la plataforma GOBY
        </p>
      </div>

      {/* Grid de navegación — 3 tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {NAV_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => navigate(card.path)}
            className={[
              'flex flex-col gap-4 p-6 rounded-xl border transition-all',
              'bg-surface border-border hover:border-gold/40 hover:shadow-md',
              'text-left group',
            ].join(' ')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-warm-100 group-hover:bg-gold/10 transition-colors text-warm-700 group-hover:text-gold">
              {card.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-lean-black dark:text-warm-50">
                {card.label}
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {card.description}
              </p>
            </div>
            <div className="mt-auto text-xs text-text-subtle group-hover:text-gold transition-colors">
              Abrir →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

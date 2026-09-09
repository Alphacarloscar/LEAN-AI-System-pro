import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, AlertCircle, Check } from 'lucide-react'
import { Spinner } from '@shared/design-system/components'
import { useAuthStore } from '@/modules/Auth'
import { useIsDark } from '@/shared/hooks/useDarkMode'
import {
  listAllUsers,
  listCompanies,
  inviteUserToCompany,
  deleteUser,
} from '@/services/companies.service'
import type { CompanyRow, UserRole } from '@/types/database.types'

type UserProfile = {
  id: string
  email: string
  name: string
  role: UserRole
  company_id: string | null
  created_at: string
}

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; bgDark: string }> = {
  superadmin:    { label: 'Superadmin',      color: '#C8860A', bg: 'rgba(200,134,10,0.10)', bgDark: 'rgba(200,134,10,0.20)' },
  consultant:    { label: 'Consultor Alpha',  color: '#6A90C0', bg: '#EBF2FA',               bgDark: '#1A2840'                },
  client_editor: { label: 'Cliente editor',   color: '#5FAF8A', bg: '#E8F5EE',               bgDark: '#1A3328'                },
  client_viewer: { label: 'Cliente viewer',   color: '#9A9790', bg: '#F0EDE8',               bgDark: 'rgba(240,237,232,0.08)' },
}

function RoleBadge({ role }: { role: UserRole }) {
  const isDark = useIsDark()
  const meta = ROLE_META[role] ?? ROLE_META.client_viewer
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: meta.color, backgroundColor: isDark ? meta.bgDark : meta.bg }}
    >
      {meta.label}
    </span>
  )
}

function DeleteConfirmModal({
  user,
  deleting,
  onConfirm,
  onCancel,
}: {
  user: UserProfile
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-md border border-black/8 p-6 w-full max-w-sm dark:bg-warm-800 dark:border-white/10">
        <div className="w-10 h-10 rounded-full bg-danger-light flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={18} stroke="var(--color-danger-dark)" strokeWidth={1.5} />
        </div>
        <h2 className="text-base font-semibold text-lean-black dark:text-warm-50 text-center mb-1">
          ¿Revocar acceso?
        </h2>
        <p className="text-sm text-text-muted text-center mb-1">
          Vas a eliminar el acceso de:
        </p>
        <p className="text-sm font-medium text-lean-black dark:text-warm-50 text-center truncate mb-1">
          {user.name}
        </p>
        <p className="text-xs font-mono text-text-subtle text-center truncate mb-4">
          {user.email}
        </p>
        <p className="text-xs text-danger-dark bg-danger-light px-3 py-2 rounded-lg text-center mb-6">
          Esta acción eliminará al usuario de la plataforma. No se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-warm-700 hover:bg-warm-50 disabled:opacity-40 transition-colors dark:text-warm-300 dark:hover:bg-warm-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 h-9 rounded-lg bg-danger-dark text-white text-sm font-medium hover:bg-danger disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? <><Spinner /> Eliminando…</> : 'Revocar acceso'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'superadmin',
    label: 'Superadmin (Alpha)',
    description: 'Acceso global a todas las empresas y proyectos.',
  },
  {
    value: 'consultant',
    label: 'Consultor Alpha',
    description: 'Edita datos en los proyectos a los que se le asigne.',
  },
  {
    value: 'client_editor',
    label: 'Cliente editor',
    description: 'Solo ve y edita su propia empresa y proyectos.',
  },
  {
    value: 'client_viewer',
    label: 'Cliente viewer',
    description: 'Solo lectura de su propia empresa.',
  },
]

export function UsersListView() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState<UserRole>('client_viewer')
  const [inviting, setInviting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<UserRole | ''>('')
  const [filterCompany, setFilterCompany] = useState('')
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listAllUsers(), listCompanies()])
      .then(([u, c]) => {
        setUsers(u)
        setCompanies(c)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  const companyMap = useMemo(() => {
    return Object.fromEntries(companies.map((c) => [c.id, c.name]))
  }, [companies])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole && u.role !== filterRole) return false
      if (filterCompany && u.company_id !== filterCompany) return false
      return true
    })
  }, [users, filterRole, filterCompany])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !userName || !companyId) return
    setInviting(true)
    setError(null)
    try {
      await inviteUserToCompany({ email, name: userName, companyId, role })
      setEmail('')
      setUserName('')
      setCompanyId('')
      setRole('client_viewer')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      const updated = await listAllUsers()
      setUsers(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invitar usuario')
    } finally {
      setInviting(false)
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteUser(userToDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setUserToDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar usuario')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 text-sm text-text-subtle">
          <Spinner size="lg" />
          <span>Cargando usuarios…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Botón volver */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-warm-700 hover:text-warm-900 mb-8"
      >
        <ChevronLeft size={16} />
        Administración
      </button>

      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-gold">
          Platform Admin
        </span>
        <h1 className="text-2xl font-semibold text-lean-black dark:text-warm-50 mt-1">Usuarios</h1>
        <p className="text-sm text-text-muted mt-2">
          Gestión de usuarios, roles e invitaciones
        </p>
      </div>

      {/* Formulario de invitación */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">
          Invitar usuario
        </h2>
        <form onSubmit={handleInvite} className="flex flex-col gap-4 max-w-md">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email del usuario"
            required
            className="h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
          />
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Nombre completo"
            required
            className="h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
          />
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            className="h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60"
          >
            <option value="">Seleccionar empresa…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-warm-600">Rol del usuario</p>
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={[
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors',
                  role === opt.value
                    ? 'border-gold/40 bg-warning-light'
                    : 'border-border bg-warm-50 hover:bg-surface',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                  className="mt-0.5 accent-gold"
                />
                <div>
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50">{opt.label}</p>
                  <p className="text-xs text-text-muted">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-danger-dark bg-danger-light px-3 py-2 rounded-lg">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-xs text-success-dark bg-success-light px-3 py-2 rounded-lg">
              <Check size={14} strokeWidth={1.5} /> Invitación enviada correctamente.
            </div>
          )}

          <button
            type="submit"
            disabled={inviting || !email || !userName || !companyId}
            className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40 hover:bg-gold-hover transition-colors flex items-center justify-center gap-2"
          >
            {inviting ? <><Spinner /> Enviando…</> : 'Enviar invitación'}
          </button>
        </form>
      </div>

      {/* Lista de usuarios */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400">
            Usuarios registrados ({filteredUsers.length}{filteredUsers.length !== users.length ? ` de ${users.length}` : ''})
          </h4>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
              className="h-7 px-2 rounded-lg border border-border text-xs bg-warm-50 outline-none focus:border-gold/60"
            >
              <option value="">Todos los roles</option>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="h-7 px-2 rounded-lg border border-border text-xs bg-warm-50 outline-none focus:border-gold/60"
            >
              <option value="">Todas las empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {deleteError && (
          <p className="text-xs text-danger-dark bg-danger-light px-3 py-2 rounded-lg mb-3">{deleteError}</p>
        )}

        {users.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin usuarios registrados.</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin usuarios que coincidan con los filtros.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-warm-50 border border-border"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50 truncate">{u.name}</p>
                  <p className="text-xs font-mono text-text-subtle truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <RoleBadge role={u.role} />
                    <p className="text-xs text-text-subtle">
                      {u.company_id ? (companyMap[u.company_id] ?? 'Empresa desconocida') : 'Sin empresa'}
                    </p>
                  </div>
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => setUserToDelete(u)}
                      title="Revocar acceso"
                      className="p-1.5 rounded-lg text-warm-300 hover:text-danger-dark hover:bg-danger-light transition-colors"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          deleting={deleting}
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  )
}

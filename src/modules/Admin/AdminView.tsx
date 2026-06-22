// ============================================================
// GOBY — AdminView (/admin)
//
// Sprint 9: panel de administración exclusivo para superadmin.
//
// Arquitectura de datos:
//   AdminView fetcha companies + users UNA SOLA VEZ al montar.
//   Los datos se pasan como props a cada tab para evitar:
//     - race conditions en el selector de empresa
//     - re-fetch al cambiar de tab (tabs se remontan)
//     - selector vacío mientras llega la respuesta de Supabase
//
// Roles del sistema (4 niveles):
//   superadmin    → Alpha platform admin — acceso global
//   consultant    → Consultor Alpha — acceso por project_members
//   client_editor → Cliente operativo — edita su empresa
//   client_viewer → Cliente directivo — solo lectura
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { Check, Trash2, AlertCircle }   from 'lucide-react'
import { useAuthStore }                 from '@/modules/Auth'
import { Spinner }                      from '@shared/design-system/components'
import {
  listCompanies,
  createCompany,
  inviteUserToCompany,
  listAllUsers,
  deleteUser,
} from '@/services/companies.service'
import {
  listMyProjects,
  createProject,
} from '@/services/projects.service'
import type { CompanyRow, ProjectRow, UserRole } from '@/types/database.types'

// ── Tipos compartidos ─────────────────────────────────────────

type Tab = 'companies' | 'users' | 'projects'

type UserProfile = {
  id:         string
  email:      string
  name:       string
  role:       UserRole
  company_id: string | null
  created_at: string
}

// Props que pasan del padre a cada tab
type SharedProps = {
  companies:    CompanyRow[]
  onCompanyAdd: (c: CompanyRow) => void
}

type UsersTabProps = SharedProps & {
  users:         UserProfile[]
  currentUserId: string          // para evitar que el superadmin se autoelimine
  onUserAdded:   () => void
  onUserDelete:  (userId: string) => Promise<void>
}

type ProjectsTabProps = SharedProps

// ── Utilidades visuales ───────────────────────────────────────

// Badge de rol con color por nivel
const ROLE_META: Record<UserRole, { label: string; color: string; bg: string }> = {
  superadmin:    { label: 'Superadmin',      color: '#C8860A', bg: 'rgba(200,134,10,0.10)' },
  consultant:    { label: 'Consultor Alpha',  color: '#2563EB', bg: '#EFF6FF'               },
  client_editor: { label: 'Cliente editor',   color: '#059669', bg: '#ECFDF5'               },
  client_viewer: { label: 'Cliente viewer',   color: '#6B7280', bg: '#F3F4F6'               },
}

function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role] ?? ROLE_META.client_viewer
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.label}
    </span>
  )
}

// Modal de confirmación de borrado de usuario
function DeleteConfirmModal({
  user,
  deleting,
  onConfirm,
  onCancel,
}: {
  user:      UserProfile
  deleting:  boolean
  onConfirm: () => void
  onCancel:  () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      {/* Card */}
      <div className="relative bg-white rounded-xl shadow-lg border border-black/8 p-6 w-full max-w-sm">
        {/* Icono de advertencia */}
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={18} stroke="#DC2626" strokeWidth={1.5} />
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
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center mb-6">
          Esta acción eliminará al usuario de la plataforma. No se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-warm-700 hover:bg-warm-50 disabled:opacity-40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? <><Spinner /> Eliminando…</> : 'Revocar acceso'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Pantalla de carga global — mientras AdminView fetcha companies + users
function AdminLoadingScreen() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-gold">
          Platform Admin
        </span>
        <h1 className="text-xl font-semibold text-lean-black dark:text-warm-50 mt-1">Panel de administración</h1>
      </div>
      <div className="flex items-center gap-3 text-sm text-text-subtle mt-12">
        <Spinner size="lg" />
        <span>Cargando datos del panel…</span>
      </div>
    </div>
  )
}

// ── Tab: Empresas ─────────────────────────────────────────────
function CompaniesTab({ companies, onCompanyAdd }: SharedProps) {
  const [name,     setName]     = useState('')
  const [creating, setCreating] = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true); setError(null)
    try {
      const company = await createCompany({ name: name.trim() })
      onCompanyAdd(company)
      setName('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear empresa')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">Crear empresa cliente</h2>
        <form onSubmit={handleCreate} className="flex gap-3 max-w-md">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la empresa (ej: Nexus Industrial S.A.)"
            className="flex-1 h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40 hover:bg-gold-hover transition-colors flex items-center gap-2"
          >
            {creating ? <Spinner /> : success ? <Check size={14} strokeWidth={2} /> : null}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <div>
        <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-3">
          Empresas registradas ({companies.length})
        </h4>
        {companies.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin empresas todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {companies.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-warm-50 border border-border">
                <div>
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50">{c.name}</p>
                  <p className="text-xs font-mono text-text-subtle">{c.slug ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Usuarios ─────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  {
    value:       'superadmin',
    label:       'Superadmin (Alpha)',
    description: 'Acceso global a todas las empresas y proyectos.',
  },
  {
    value:       'consultant',
    label:       'Consultor Alpha',
    description: 'Edita datos en los proyectos a los que se le asigne.',
  },
  {
    value:       'client_editor',
    label:       'Cliente editor',
    description: 'Solo ve y edita su propia empresa y proyectos.',
  },
  {
    value:       'client_viewer',
    label:       'Cliente viewer',
    description: 'Solo lectura de su propia empresa.',
  },
]

function UsersTab({ companies, users, currentUserId, onUserAdded, onUserDelete }: UsersTabProps) {
  const [email,      setEmail]      = useState('')
  const [userName,   setUserName]   = useState('')
  const [companyId,  setCompanyId]  = useState('')
  const [role,       setRole]       = useState<UserRole>('client_viewer')
  const [inviting,   setInviting]   = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Estado del modal de eliminación
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState<string | null>(null)

  // Filtros de la lista
  const [filterRole,    setFilterRole]    = useState<UserRole | ''>('')
  const [filterCompany, setFilterCompany] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !userName.trim() || !companyId) return
    setInviting(true); setError(null)
    try {
      await inviteUserToCompany({
        email:     email.trim().toLowerCase(),
        name:      userName.trim(),
        companyId,
        role,
      })
      setEmail(''); setUserName(''); setCompanyId(''); setRole('client_viewer')
      setSuccess(true)
      onUserAdded()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invitar usuario')
    } finally {
      setInviting(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!userToDelete) return
    setDeleting(true); setDeleteError(null)
    try {
      await onUserDelete(userToDelete.id)
      setUserToDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar usuario')
    } finally {
      setDeleting(false)
    }
  }

  const companyMap = useMemo(() => {
    const m: Record<string, string> = {}
    companies.forEach((c) => { m[c.id] = c.name })
    return m
  }, [companies])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole && u.role !== filterRole) return false
      if (filterCompany && u.company_id !== filterCompany) return false
      return true
    })
  }, [users, filterRole, filterCompany])

  const inputClass = "w-full h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"

  return (
    <div className="flex flex-col gap-8">
      {/* Modal de confirmación de borrado */}
      {userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setUserToDelete(null); setDeleteError(null) }}
        />
      )}

      {/* Formulario de invitación */}
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-1">Invitar usuario</h2>
        <p className="text-xs text-text-muted mb-4">
          El usuario recibirá un email para crear su propia contraseña.
        </p>
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Nombre completo"
            required
            className={inputClass}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email corporativo"
            required
            className={inputClass}
          />

          {/* Selector de empresa — ya tiene datos porque viene del padre */}
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            aria-label="Seleccionar empresa"
            className={inputClass}
          >
            <option value="">Seleccionar empresa…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Selector de rol — 4 opciones con descripción */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-warm-600">Rol del usuario</p>
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={[
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors',
                  role === opt.value
                    ? 'border-gold/40 bg-amber-50'
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

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <Check size={14} strokeWidth={2} /> Invitación enviada correctamente.
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

      {/* Lista de usuarios existentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400">
            Usuarios registrados ({filteredUsers.length}{filteredUsers.length !== users.length ? ` de ${users.length}` : ''})
          </h4>
          {/* Filtros */}
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
              aria-label="Filtrar por rol"
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
              aria-label="Filtrar por empresa"
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
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{deleteError}</p>
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
                  {/* Botón de eliminar — oculto para el propio superadmin */}
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => setUserToDelete(u)}
                      title="Revocar acceso"
                      className="p-1.5 rounded-lg text-warm-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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
    </div>
  )
}

// ── Tab: Proyectos ────────────────────────────────────────────
function ProjectsTab({ companies }: ProjectsTabProps) {
  const [projects,  setProjects]  = useState<ProjectRow[]>([])
  const [name,      setName]      = useState('')
  const [companyId, setCompanyId] = useState('')
  const [creating,  setCreating]  = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    listMyProjects().then(setProjects)
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true); setError(null)
    try {
      const newProject = await createProject({ name: name.trim(), companyId: companyId || undefined })
      setProjects((prev) => [newProject, ...prev])
      setName(''); setCompanyId('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto')
    } finally {
      setCreating(false)
    }
  }

  const inputClass = "flex-1 h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">Crear proyecto</h2>
        <form onSubmit={handleCreate} className="flex gap-3 max-w-xl">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del proyecto (ej: Diagnóstico IA Q3 2026)"
            required
            className={inputClass}
          />
          {/* Selector de empresa — ya tiene datos porque viene del padre */}
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            aria-label="Seleccionar empresa para el proyecto"
            className="h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60"
          >
            <option value="">Sin empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40 hover:bg-gold-hover transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {creating ? <Spinner /> : success ? <Check size={14} strokeWidth={2} /> : null}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <div>
        <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-3">
          Proyectos activos ({projects.length})
        </h4>
        {projects.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin proyectos todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.filter(Boolean).map((p) => {
              const company = companies.find((c) => c.id === p.company_id)
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-warm-50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-lean-black dark:text-warm-50">{p.name}</p>
                    <p className="text-xs font-mono text-text-subtle">
                      {company ? company.name : 'Sin empresa'} · {p.current_phase}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
// Fetcha companies + users UNA VEZ al montar y los pasa a los tabs.
// Mientras carga: AdminLoadingScreen. Así los selects nunca están vacíos.

export function AdminView() {
  const { user }      = useAuthStore()
  const navigate      = useNavigate()
  const [tab, setTab] = useState<Tab>('companies')

  // ── Datos compartidos entre tabs ──────────────────────────
  const [companies,   setCompanies]   = useState<CompanyRow[]>([])
  const [users,       setUsers]       = useState<UserProfile[]>([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [loadError,   setLoadError]   = useState<string | null>(null)

  // Redirigir si no es superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') navigate('/', { replace: true })
  }, [user, navigate])

  // Fetch único al montar: companies + users en paralelo
  useEffect(() => {
    if (!user || user.role !== 'superadmin') return

    Promise.all([listCompanies(), listAllUsers()])
      .then(([c, u]) => {
        setCompanies(c)
        setUsers(u)
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Error al cargar datos del panel')
      })
      .finally(() => setInitialLoad(false))
  }, [user])

  if (!user || user.role !== 'superadmin') return null

  // Pantalla de carga inicial — hasta que companies y users estén listos
  if (initialLoad) return <AdminLoadingScreen />

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
          Error al cargar el panel: {loadError}
        </p>
      </div>
    )
  }

  // Callbacks que actualizan el estado del padre sin re-fetch
  function handleCompanyAdd(c: CompanyRow) {
    setCompanies((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))
  }

  // Elimina usuario de Supabase Auth y actualiza lista local
  async function handleUserDelete(userId: string) {
    await deleteUser(userId)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'companies', label: 'Empresas'  },
    { id: 'users',     label: 'Usuarios'  },
    { id: 'projects',  label: 'Proyectos' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-widest text-gold">
            Platform Admin
          </span>
        </div>
        <h1 className="text-xl font-semibold text-lean-black dark:text-warm-50">Panel de administración</h1>
        <p className="text-sm text-text-muted mt-1">
          Gestiona empresas, usuarios y proyectos de GOBY.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-surface rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-lean-black dark:text-warm-50 shadow-sm'
                : 'text-text-muted hover:text-warm-700',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido — los tabs reciben companies ya cargadas, sin re-fetch */}
      <div>
        {tab === 'companies' && (
          <CompaniesTab
            companies={companies}
            onCompanyAdd={handleCompanyAdd}
          />
        )}
        {tab === 'users' && (
          <UsersTab
            companies={companies}
            users={users}
            currentUserId={user.id}
            onCompanyAdd={handleCompanyAdd}
            onUserAdded={() => listAllUsers().then(setUsers)}
            onUserDelete={handleUserDelete}
          />
        )}
        {tab === 'projects' && (
          <ProjectsTab
            companies={companies}
            onCompanyAdd={handleCompanyAdd}
          />
        )}
      </div>
    </div>
  )
}

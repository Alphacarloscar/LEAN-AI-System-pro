// ============================================================
// GOBY — AdminView (/admin)
//
// Sprint 9: panel de administración exclusivo para superadmin.
// Permite gestionar empresas, usuarios y proyectos.
//
// Roles del sistema (4 niveles):
//   superadmin    → Alpha platform admin — acceso global
//   consultant    → Consultor Alpha — acceso por project_members
//   client_editor → Cliente operativo — edita su empresa
//   client_viewer → Cliente directivo — solo lectura
//
// Tabs:
//   1. Empresas  — crear y listar empresas cliente
//   2. Usuarios  — invitar usuario (MOCK), listar todos
//   3. Proyectos — crear proyecto, asignar a empresa
//
// ⚠ inviteUserToCompany está MOCKEADA (requiere Edge Function
//   con service role key — pendiente Sprint 10).
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { useAuthStore }                 from '@/modules/Auth'
import {
  listCompanies,
  createCompany,
  inviteUserToCompany,
  listAllUsers,
} from '@/services/companies.service'
import {
  listMyProjects,
  createProject,
} from '@/services/projects.service'
import type { CompanyRow, ProjectRow, UserRole } from '@/types/database.types'

// ── Tipos ─────────────────────────────────────────────────────

type Tab = 'companies' | 'users' | 'projects'

// ── Utilidades visuales ───────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3.5 3.5L13 4" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// Badge de rol con color por nivel
const ROLE_META: Record<UserRole, { label: string; color: string; bg: string }> = {
  superadmin:    { label: 'Superadmin',     color: '#C8860A', bg: 'rgba(200,134,10,0.10)' },
  consultant:    { label: 'Consultor Alpha', color: '#2563EB', bg: '#EFF6FF'               },
  client_editor: { label: 'Cliente editor',  color: '#059669', bg: '#ECFDF5'               },
  client_viewer: { label: 'Cliente viewer',  color: '#6B7280', bg: '#F3F4F6'               },
}

function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role] ?? ROLE_META.client_viewer
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.label}
    </span>
  )
}

// ── Tab: Empresas ─────────────────────────────────────────────
function CompaniesTab() {
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [name,      setName]      = useState('')
  const [creating,  setCreating]  = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    listCompanies().then(setCompanies).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true); setError(null)
    try {
      const company = await createCompany({ name: name.trim() })
      setCompanies((prev) => [...prev, company].sort((a, b) => a.name.localeCompare(b.name)))
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
        <h2 className="text-sm font-semibold text-[#2A2822] mb-4">Crear empresa cliente</h2>
        <form onSubmit={handleCreate} className="flex gap-3 max-w-md">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la empresa (ej: Nexus Industrial S.A.)"
            className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-[#C8860A]/60 focus:bg-white placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="h-9 px-4 rounded-lg bg-[#C8860A] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#B57609] transition-colors flex items-center gap-2"
          >
            {creating ? <Spinner /> : success ? <CheckIcon /> : null}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <div>
        <h3 className="text-xs font-mono uppercase tracking-wide text-gray-400 mb-3">
          Empresas registradas ({companies.length})
        </h3>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400"><Spinner /> Cargando…</div>
        ) : companies.length === 0 ? (
          <p className="text-sm text-gray-400">Sin empresas todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {companies.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-[#2A2822]">{c.name}</p>
                  <p className="text-[10px] font-mono text-gray-400">{c.slug ?? '—'}</p>
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

type UserProfile = {
  id: string
  email: string
  name: string
  role: UserRole
  company_id: string | null
  created_at: string
}

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

function UsersTab() {
  const [companies,  setCompanies]  = useState<CompanyRow[]>([])
  const [users,      setUsers]      = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [email,      setEmail]      = useState('')
  const [userName,   setUserName]   = useState('')
  const [companyId,  setCompanyId]  = useState('')
  const [role,       setRole]       = useState<UserRole>('client_viewer')
  const [inviting,   setInviting]   = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Filtros de la lista
  const [filterRole,    setFilterRole]    = useState<UserRole | ''>('')
  const [filterCompany, setFilterCompany] = useState('')

  useEffect(() => {
    listCompanies().then(setCompanies)
    listAllUsers().then(setUsers).finally(() => setLoadingUsers(false))
  }, [])

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
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invitar usuario')
    } finally {
      setInviting(false)
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

  const inputClass = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-[#C8860A]/60 focus:bg-white placeholder:text-gray-400"

  return (
    <div className="flex flex-col gap-8">
      {/* Formulario de invitación */}
      <div className="max-w-md">
        <h2 className="text-sm font-semibold text-[#2A2822] mb-1">Invitar usuario</h2>
        <p className="text-xs text-gray-500 mb-4">
          El usuario recibirá un email para crear su propia contraseña.{' '}
          <span className="text-amber-600 font-medium">(Envío mockeado — activar en Sprint 10)</span>
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
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Seleccionar empresa…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Selector de rol — 4 opciones con descripción */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-600">Rol del usuario</p>
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={[
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors',
                  role === opt.value
                    ? 'border-[#C8860A]/40 bg-amber-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                  className="mt-0.5 accent-[#C8860A]"
                />
                <div>
                  <p className="text-sm font-medium text-[#2A2822]">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <CheckIcon /> Invitación registrada (mock). Revisa la consola.
            </div>
          )}

          <button
            type="submit"
            disabled={inviting || !email || !userName || !companyId}
            className="h-9 px-4 rounded-lg bg-[#C8860A] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#B57609] transition-colors flex items-center justify-center gap-2"
          >
            {inviting ? <><Spinner /> Enviando…</> : 'Enviar invitación'}
          </button>
        </form>
      </div>

      {/* Lista de usuarios existentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wide text-gray-400">
            Usuarios registrados ({filteredUsers.length}{filteredUsers.length !== users.length ? ` de ${users.length}` : ''})
          </h3>
          {/* Filtros */}
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
              className="h-7 px-2 rounded-lg border border-gray-200 text-xs bg-gray-50 outline-none focus:border-[#C8860A]/60"
            >
              <option value="">Todos los roles</option>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="h-7 px-2 rounded-lg border border-gray-200 text-xs bg-gray-50 outline-none focus:border-[#C8860A]/60"
            >
              <option value="">Todas las empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingUsers ? (
          <div className="flex items-center gap-2 text-sm text-gray-400"><Spinner /> Cargando usuarios…</div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-400">Sin usuarios que coincidan con los filtros.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#2A2822] truncate">{u.name}</p>
                  <p className="text-[10px] font-mono text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                  <RoleBadge role={u.role} />
                  <p className="text-[10px] text-gray-400">
                    {u.company_id ? (companyMap[u.company_id] ?? 'Empresa desconocida') : 'Sin empresa'}
                  </p>
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
function ProjectsTab() {
  const [companies,  setCompanies]  = useState<CompanyRow[]>([])
  const [projects,   setProjects]   = useState<ProjectRow[]>([])
  const [name,       setName]       = useState('')
  const [companyId,  setCompanyId]  = useState('')
  const [creating,   setCreating]   = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listCompanies(), listMyProjects()]).then(([c, p]) => {
      setCompanies(c); setProjects(p)
    })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true); setError(null)
    try {
      const project = await createProject({ name: name.trim(), companyId: companyId || undefined })
      setProjects((prev) => [project, ...prev])
      setName(''); setCompanyId('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto')
    } finally {
      setCreating(false)
    }
  }

  const inputClass = "flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-[#C8860A]/60 focus:bg-white placeholder:text-gray-400"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-[#2A2822] mb-4">Crear proyecto</h2>
        <form onSubmit={handleCreate} className="flex gap-3 max-w-xl">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del proyecto (ej: Diagnóstico IA Q3 2026)"
            required
            className={inputClass}
          />
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-[#C8860A]/60"
          >
            <option value="">Sin empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="h-9 px-4 rounded-lg bg-[#C8860A] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#B57609] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {creating ? <Spinner /> : success ? <CheckIcon /> : null}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <div>
        <h3 className="text-xs font-mono uppercase tracking-wide text-gray-400 mb-3">
          Proyectos activos ({projects.length})
        </h3>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400">Sin proyectos todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => {
              const company = companies.find((c) => c.id === p.company_id)
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-[#2A2822]">{p.name}</p>
                    <p className="text-[10px] font-mono text-gray-400">
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

export function AdminView() {
  const { user }      = useAuthStore()
  const navigate      = useNavigate()
  const [tab, setTab] = useState<Tab>('companies')

  // Redirigir si no es superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') navigate('/', { replace: true })
  }, [user])

  if (!user || user.role !== 'superadmin') return null

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
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C8860A]">
            Platform Admin
          </span>
        </div>
        <h1 className="text-xl font-semibold text-[#2A2822]">Panel de administración</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona empresas, usuarios y proyectos de GOBY.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-[#2A2822] shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {tab === 'companies' && <CompaniesTab />}
        {tab === 'users'     && <UsersTab />}
        {tab === 'projects'  && <ProjectsTab />}
      </div>
    </div>
  )
}

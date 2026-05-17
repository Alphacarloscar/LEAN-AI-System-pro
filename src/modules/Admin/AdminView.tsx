// ============================================================
// GOBY — AdminView (/admin)
//
// Panel de administración exclusivo para platform_admin (role='admin').
// Permite gestionar empresas, usuarios y proyectos.
//
// Tabs:
//   1. Empresas — crear empresa cliente
//   2. Usuarios — invitar usuario, asignar empresa
//   3. Proyectos — crear proyecto, asignar a empresa
//
// La invitación usa Supabase inviteUserByEmail():
//   el usuario recibe un email con link para crear su contraseña.
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useAuthStore }        from '@/modules/Auth'
import {
  listCompanies,
  createCompany,
  inviteUserToCompany,
  listCompanyUsers,
  listCompanyProjects,
} from '@/services/companies.service'
import {
  listMyProjects,
  createProject,
  addProjectMember,
} from '@/services/projects.service'
import type { CompanyRow, ProjectRow } from '@/types/database.types'

// ── Tipos ─────────────────────────────────────────────────────

type Tab = 'companies' | 'users' | 'projects'

// ── Icono de check ────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3.5 3.5L13 4" />
    </svg>
  )
}

// ── Spinner ───────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
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
      setCompanies((prev) => [...prev, company])
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
                  <p className="text-[10px] font-mono text-gray-400">{c.slug}</p>
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
function UsersTab() {
  const [companies,  setCompanies]  = useState<CompanyRow[]>([])
  const [email,      setEmail]      = useState('')
  const [userName,   setUserName]   = useState('')
  const [companyId,  setCompanyId]  = useState('')
  const [role,       setRole]       = useState<'viewer' | 'consultant'>('viewer')
  const [inviting,   setInviting]   = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    listCompanies().then(setCompanies)
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
      setEmail(''); setUserName(''); setCompanyId('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invitar usuario')
    } finally {
      setInviting(false)
    }
  }

  const inputClass = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-[#C8860A]/60 focus:bg-white placeholder:text-gray-400"

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h2 className="text-sm font-semibold text-[#2A2822] mb-1">Invitar usuario</h2>
        <p className="text-xs text-gray-500 mb-4">
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
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="role" value="viewer" checked={role === 'viewer'} onChange={() => setRole('viewer')} />
              <span className="text-sm text-gray-700">Usuario cliente</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="role" value="consultant" checked={role === 'consultant'} onChange={() => setRole('consultant')} />
              <span className="text-sm text-gray-700">Consultor Alpha</span>
            </label>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <CheckIcon /> Invitación enviada correctamente.
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
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const [tab, setTab] = useState<Tab>('companies')

  // Redirigir si no es admin
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/', { replace: true })
  }, [user])

  if (!user || user.role !== 'admin') return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'companies', label: 'Empresas' },
    { id: 'users',     label: 'Usuarios' },
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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Spinner } from '@shared/design-system/components'
import { listMyProjects, createProject } from '@/services/projects.service'
import { listCompanies } from '@/services/companies.service'
import type { ProjectRow, CompanyRow } from '@/types/database.types'

export function ProjectsListView() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listMyProjects(), listCompanies()])
      .then(([p, c]) => {
        setProjects(p)
        setCompanies(c)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      const newProject = await createProject({ name: name.trim(), companyId: companyId || undefined })
      setProjects((prev) => [newProject, ...prev])
      setName('')
      setCompanyId('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 text-sm text-text-subtle">
          <Spinner size="lg" />
          <span>Cargando proyectos…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Botón volver */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-warm-300 hover:text-lean-black dark:hover:text-warm-100 transition-colors mb-8"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 12L6 8l4-4" />
        </svg>
        Volver a administración
      </button>

      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-gold">
          Platform Admin
        </span>
        <h1 className="text-2xl font-semibold text-lean-black dark:text-warm-50 mt-1">Proyectos</h1>
        <p className="text-sm text-text-muted mt-2">
          Visión global de todos los proyectos
        </p>
      </div>

      {/* Formulario de creación */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">
          Crear proyecto
        </h2>
        <form onSubmit={handleCreate} className="flex gap-3 max-w-xl">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del proyecto (ej: Diagnóstico IA Q3 2026)"
            required
            className="flex-1 h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
          />
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
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
            {creating ? <Spinner /> : success ? <Check size={14} strokeWidth={1.5} /> : null}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-danger-dark mt-2">{error}</p>}
      </div>

      {/* Lista de proyectos */}
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
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-warm-50 border border-border hover:border-gold/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/companies/${p.company_id}/projects/${p.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-lean-black dark:text-warm-50">{p.name}</p>
                    <p className="text-xs font-mono text-text-subtle">
                      {company ? company.name : 'Sin empresa'} · {p.current_phase}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-text-muted">→</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

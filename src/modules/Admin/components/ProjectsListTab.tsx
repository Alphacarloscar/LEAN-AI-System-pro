import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Spinner } from '@shared/design-system/components'
import { listAllProjectsByCompany, createProject } from '@/services/projects.service'
import type { ProjectRow } from '@/types/database.types'

interface ProjectsListTabProps {
  companyId: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-success-light', text: 'text-success-dark', label: 'Activo' },
  paused: { bg: 'bg-warning-light', text: 'text-warning-dark', label: 'Pausado' },
  archived: { bg: 'bg-gray-light', text: 'text-gray-dark', label: 'Archivado' },
  completed: { bg: 'bg-info-light', text: 'text-info-dark', label: 'Completado' },
}

export function ProjectsListTab({ companyId }: ProjectsListTabProps) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'archived' | 'completed'>('all')

  const [creatingProject, setCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  // Cargar proyectos al montar
  useEffect(() => {
    async function loadProjects() {
      setLoading(true)
      setError(null)
      try {
        const data = await listAllProjectsByCompany(companyId)
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar proyectos')
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [companyId])

  // Filtrar proyectos
  const filtered = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q)
    }
    return true
  })

  // Crear nuevo proyecto
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setCreatingProject(true)
    setError(null)
    try {
      await createProject({ name: newProjectName.trim(), companyId })
      const updated = await listAllProjectsByCompany(companyId)
      setProjects(updated)
      setNewProjectName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto')
    } finally {
      setCreatingProject(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-text-subtle">
        <Spinner size="lg" />
        <span>Cargando proyectos…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Formulario de creación */}
      <div>
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">Crear proyecto</h2>
        <form onSubmit={handleCreateProject} className="flex gap-3 max-w-md">
          <input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Nombre del proyecto (ej: Diagnóstico IA Q3)"
            className="flex-1 h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
          />
          <button
            type="submit"
            disabled={creatingProject || !newProjectName.trim()}
            className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40 hover:bg-gold-hover transition-colors flex items-center gap-2"
          >
            {creatingProject ? <Spinner /> : <Plus size={14} strokeWidth={1.5} />}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-danger-dark mt-2">{error}</p>}
      </div>

      {/* Filtros y búsqueda */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400">
            Proyectos ({filtered.length}{filtered.length !== projects.length ? ` de ${projects.length}` : ''})
          </h4>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
            />
          </div>

          <div className="flex gap-2">
            {[
              { value: 'all' as const, label: 'Todos' },
              { value: 'active' as const, label: 'Activos' },
              { value: 'paused' as const, label: 'Pausados' },
              { value: 'archived' as const, label: 'Archivados' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === opt.value
                    ? 'bg-gold text-white'
                    : 'bg-surface border border-border text-text-muted hover:text-warm-700',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de proyectos */}
        {filtered.length === 0 ? (
          <p className="text-sm text-text-subtle">
            {search.trim() || statusFilter !== 'all' ? 'No se encontraron proyectos.' : 'Sin proyectos todavía.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((p) => {
              const statusMeta = STATUS_COLORS[p.status] || STATUS_COLORS.active
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/admin/companies/${companyId}/projects/${p.id}`)}
                  className="px-4 py-3 rounded-xl bg-warm-50 border border-border hover:bg-warm-100 hover:border-warm-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-lean-black dark:text-warm-50">{p.name}</p>
                      <p className="text-xs text-text-muted mt-1">Fase: {p.current_phase}</p>
                    </div>

                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${statusMeta.bg} ${statusMeta.text}`}>
                        {statusMeta.label}
                      </span>
                    </div>
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

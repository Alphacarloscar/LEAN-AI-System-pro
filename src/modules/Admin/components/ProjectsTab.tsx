// ============================================================
// Admin — Tab Proyectos
// ============================================================

import { useState, useEffect }  from 'react'
import { Spinner }              from '@shared/design-system/components'
import { listMyProjects, createProject } from '@/services/projects.service'
import { CheckIcon }            from './AdminHelpers'
import type { ProjectsTabProps } from './AdminHelpers'
import type { ProjectRow }      from '@/types/database.types'

export function ProjectsTab({ companies }: ProjectsTabProps) {
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del proyecto (ej: Diagnóstico IA Q3 2026)" required className={inputClass} />
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-[#C8860A]/60">
            <option value="">Sin empresa</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" disabled={creating || !name.trim()}
            className="h-9 px-4 rounded-lg bg-[#C8860A] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#B57609] transition-colors flex items-center gap-2 whitespace-nowrap">
            {creating ? <Spinner /> : success ? <CheckIcon /> : null}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <div>
        <h3 className="text-xs font-mono uppercase tracking-wide text-gray-400 mb-3">Proyectos activos ({projects.length})</h3>
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
                    <p className="text-[10px] font-mono text-gray-400">{company ? company.name : 'Sin empresa'} · {p.current_phase}</p>
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

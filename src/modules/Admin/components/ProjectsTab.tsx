// ============================================================
// Admin — Tab Proyectos
// ============================================================

import { useState, useEffect }  from 'react'
import { Spinner }              from '@shared/design-system/components'
import { listMyProjects, createProject } from '@/services/projects.service'
import { CheckIcon }            from './AdminHelpers'
import { getEcosystemOptions, getFrictionLabel, HORIZON_OPTIONS } from '../constants/ecosystemOptions'
import type { ProjectsTabProps } from './AdminHelpers'
import type { ProjectRow }      from '@/types/database.types'

export function ProjectsTab({ companies }: ProjectsTabProps) {
  const [projects,  setProjects]  = useState<ProjectRow[]>([])
  const [name,      setName]      = useState('')
  const [companyId, setCompanyId] = useState('')

  const [objetivoPrincipal, setObjetivoPrincipal] = useState('')
  const [restricciones, setRestricciones] = useState('')
  const [horizonteValor, setHorizonteValor] = useState('')
  const [ecosistemaTecnologico, setEcosistemaTecnologico] = useState('')
  const [friccionesOportunidades, setFriccionesOportunidades] = useState('')

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
      const project = await createProject({
        name: name.trim(),
        companyId: companyId || undefined,
        objetivoPrincipal: objetivoPrincipal.trim() || undefined,
        restricciones: restricciones.trim() || undefined,
        horizonteValor: horizonteValor || undefined,
        ecosistemaTecnologico: ecosistemaTecnologico || undefined,
        friccionesOportunidades: friccionesOportunidades.trim() || undefined,
      })
      setProjects((prev) => [project, ...prev])
      setName('')
      setCompanyId('')
      setObjetivoPrincipal('')
      setRestricciones('')
      setHorizonteValor('')
      setEcosistemaTecnologico('')
      setFriccionesOportunidades('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto')
    } finally {
      setCreating(false)
    }
  }

  const inputClass = "flex-1 h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
  const textareaClass = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle resize-none"
  const selectClass = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white"

  const ecosystemOptions = getEcosystemOptions('ai_adoption')
  const frictionLabel = getFrictionLabel('ai_adoption')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">Crear proyecto</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4 max-w-2xl">
          {/* Row 1: Name, Company, Domain */}
          <div className="flex gap-3">
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
              aria-label="Seleccionar empresa para el proyecto"
              className="h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60"
            >
              <option value="">Sin empresa</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40 hover:bg-gold-hover transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {creating ? <Spinner /> : success ? <CheckIcon /> : null}
              Crear
            </button>
          </div>

          {/* Extended fields */}
          <div className="flex flex-col gap-3 pt-3 border-t border-border/50">
              <div>
                <label htmlFor="proyecto-objetivo" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                  Objetivo principal del proyecto
                </label>
                <textarea
                  id="proyecto-objetivo"
                  value={objetivoPrincipal}
                  onChange={(e) => setObjetivoPrincipal(e.target.value)}
                  placeholder="Ej: Implementar soluciones de IA generativa para automatizar procesos de atención al cliente"
                  rows={2}
                  className={textareaClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="proyecto-horizonte" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                    Horizonte esperado
                  </label>
                  <select
                    id="proyecto-horizonte"
                    value={horizonteValor}
                    onChange={(e) => setHorizonteValor(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Seleccionar plazo</option>
                    {HORIZON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="proyecto-ecosistema" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                    Ecosistema tecnológico
                  </label>
                  <select
                    id="proyecto-ecosistema"
                    value={ecosistemaTecnologico}
                    onChange={(e) => setEcosistemaTecnologico(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Seleccionar ecosistema</option>
                    {ecosystemOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="proyecto-restricciones" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                  Restricciones relevantes
                </label>
                <textarea
                  id="proyecto-restricciones"
                  value={restricciones}
                  onChange={(e) => setRestricciones(e.target.value)}
                  placeholder="Ej: Limitaciones regulatorias, presupuesto, capacidad técnica, timeline"
                  rows={2}
                  className={textareaClass}
                />
              </div>

              <div>
                <label htmlFor="proyecto-fricciones" className="text-xs font-medium text-text-subtle dark:text-warm-400 mb-1 block">
                  {frictionLabel}
                </label>
                <textarea
                  id="proyecto-fricciones"
                  value={friccionesOportunidades}
                  onChange={(e) => setFriccionesOportunidades(e.target.value)}
                  placeholder="Ej: Brecha de competencias, poca adopción de tecnología, resistencia al cambio, etc."
                  rows={2}
                  className={textareaClass}
                />
              </div>
          </div>

        </form>
        {error && <p className="text-xs text-danger-dark mt-2">{error}</p>}
      </div>

      <div>
        <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-3">Proyectos activos ({projects.length})</h4>
        {projects.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin proyectos todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => {
              const company = companies.find((c) => c.id === p.company_id)
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-warm-50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-lean-black dark:text-warm-50">{p.name}</p>
                    <p className="text-xs font-mono text-text-subtle">{company ? company.name : 'Sin empresa'} · {p.current_phase}</p>
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

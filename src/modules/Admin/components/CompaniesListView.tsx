import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Check } from 'lucide-react'
import { Spinner } from '@shared/design-system/components'
import { createCompany, listCompanies } from '@/services/companies.service'
import type { CompanyRow } from '@/types/database.types'

export function CompaniesListView() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    listCompanies()
      .then(setCompanies)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar empresas'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (statusFilter === 'active' && !c.is_active) return false
      if (statusFilter === 'inactive' && c.is_active) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || (c.slug ?? '').toLowerCase().includes(q)
      }
      return true
    })
  }, [companies, search, statusFilter])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 text-sm text-text-subtle">
          <Spinner size="lg" />
          <span>Cargando empresas…</span>
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
        <h1 className="text-2xl font-semibold text-lean-black dark:text-warm-50 mt-1">Empresas</h1>
        <p className="text-sm text-text-muted mt-2">
          Gestión de empresas, planes y configuración
        </p>
      </div>

      {/* Formulario de creación */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">
          Crear empresa cliente
        </h2>
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
            {creating ? <Spinner /> : success ? <Check size={14} strokeWidth={1.5} /> : null}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-danger-dark mt-2">{error}</p>}
      </div>

      {/* Lista de empresas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400">
            Empresas registradas ({filtered.length}{filtered.length !== companies.length ? ` de ${companies.length}` : ''})
          </h4>
        </div>

        <div className="flex flex-col gap-4 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o slug…"
              className="w-full pl-9 h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={[
                  'px-3 h-8 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-gold text-white'
                    : 'bg-warm-50 text-text-muted hover:text-warm-700',
                ].join(' ')}
              >
                {status === 'all' ? 'Todas' : status === 'active' ? 'Activas' : 'Inactivas'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin empresas que coincidan con los filtros.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-warm-50 border border-border hover:border-gold/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/companies/${company.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50">{company.name}</p>
                  <p className="text-xs font-mono text-text-subtle truncate">{company.id}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={['text-xs px-2 py-1 rounded-full', company.is_active ? 'bg-success-light text-success-dark' : 'bg-warm-100 text-text-muted'].join(' ')}>
                    {company.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  <span className="text-xs font-mono text-text-muted">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

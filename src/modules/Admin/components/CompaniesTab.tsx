// ============================================================
// Admin — Tab Empresas (Epic 3: Enhanced CRUD & Filters)
// ============================================================

import { useState, useMemo }          from 'react'
import { useNavigate }                 from 'react-router-dom'
import { Search, Check }               from 'lucide-react'
import { Spinner }                     from '@shared/design-system/components'
import { createCompany }               from '@/services/companies.service'
import type { CompanyRow }             from '@/types/database.types'
import type { SharedProps }            from './AdminHelpers'

interface EnhancedCompaniesTabProps extends SharedProps {
  companies: CompanyRow[]
}

export function CompaniesTab({ companies, onCompanyAdd }: EnhancedCompaniesTabProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros y búsqueda
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Filtrar y buscar
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
      {/* Formulario de creación */}
      <div>
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

      {/* Lista de empresas con filtros */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400">
            Empresas registradas ({filtered.length}{filtered.length !== companies.length ? ` de ${companies.length}` : ''})
          </h4>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o slug…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"
            />
          </div>

          <div className="flex gap-2">
            {[
              { value: 'all' as const, label: 'Todas' },
              { value: 'active' as const, label: 'Activas' },
              { value: 'inactive' as const, label: 'Inactivas' },
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

        {/* Tabla de empresas */}
        {filtered.length === 0 ? (
          <p className="text-sm text-text-subtle">
            {search.trim() || statusFilter !== 'all' ? 'No se encontraron empresas.' : 'Sin empresas todavía.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/admin/companies/${c.id}`)}
                className="px-4 py-3 rounded-xl bg-warm-50 border border-border hover:bg-warm-100 hover:border-warm-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-lean-black dark:text-warm-50">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-mono text-text-muted">{c.slug ?? '—'}</p>
                      {!c.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded bg-danger-light text-danger-dark font-medium">
                          Inactiva
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs text-text-muted ml-4 shrink-0">
                    <div>
                      {c.contracted_packages?.length ?? 0} paquete{c.contracted_packages?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

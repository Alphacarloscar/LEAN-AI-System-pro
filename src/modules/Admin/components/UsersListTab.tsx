import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Spinner } from '@shared/design-system/components'
import { listAllUsersWithStats } from '@/services/companies.service'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  company_id: string | null
  created_at: string
}

export function UsersListTab() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      try {
        const data = await listAllUsersWithStats()
        setUsers(data as any)
      } catch (err) {
        console.error('Error loading users:', err)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const filtered = users.filter((u) => {
    if (statusFilter === 'active' && !u.is_active) return false
    if (statusFilter === 'inactive' && u.is_active) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@')
    return `${local.slice(-3)}...@${domain}`
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-text-muted">
        <Spinner size="lg" />
        <span>Cargando usuarios…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">Usuarios de la plataforma</h2>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 placeholder:text-text-subtle"
            />
          </div>
          <button
            onClick={() => navigate('/admin/users/new')}
            className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-hover transition-colors flex items-center gap-2"
          >
            <Plus size={14} />
            Nuevo usuario
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'active', label: 'Activos' },
          { value: 'inactive', label: 'Inactivos' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value as any)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              statusFilter === opt.value
                ? 'bg-gold text-white'
                : 'bg-surface border border-border text-text-muted',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">
          Usuarios ({filtered.length})
        </p>
        {filtered.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin usuarios.</p>
        ) : (
          <div className="grid gap-2">
            {filtered.map((u) => (
              <div
                key={u.id}
                onClick={() => navigate(`/admin/users/${u.id}`)}
                className="px-4 py-3 rounded-lg bg-warm-50 border border-border hover:bg-warm-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lean-black dark:text-warm-50">{u.name}</p>
                    <p className="text-xs text-text-muted font-mono">{maskEmail(u.email)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-xs px-2 py-1 rounded bg-warm-100 text-warm-800">{u.role}</span>
                    {!u.is_active && <span className="text-xs px-2 py-1 rounded bg-danger-light text-danger-dark">Inactivo</span>}
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

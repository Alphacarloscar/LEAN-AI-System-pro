import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { Spinner } from '@shared/design-system/components'
import { getUserById, updateUserInfo, toggleUserActive } from '@/services/companies.service'
import { Breadcrumb } from './Breadcrumb'

export function UserDetailView() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  if (!userId) {
    return <div className="text-center py-8 text-danger-dark">ID de usuario no válido</div>
  }

  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      setError(null)
      try {
        const data = await getUserById(userId!)
        setUser(data)
        setEditName(data.name)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar usuario')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [userId])

  async function handleToggleActive() {
    if (!user) return
    setSaving(true)
    try {
      const updated = await toggleUserActive(userId!, !user.is_active)
      setUser(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateName() {
    if (!user || editName === user.name) {
      setEditingName(false)
      return
    }
    setSaving(true)
    try {
      const updated = await updateUserInfo(userId!, { name: editName })
      setUser(updated)
      setEditingName(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-text-muted">Cargando usuario…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-warm-700 hover:text-warm-900 mb-6"
        >
          <ChevronLeft size={16} />
          Volver a usuarios
        </button>
        <div className="text-danger-dark bg-danger-light px-4 py-3 rounded-lg">Usuario no encontrado</div>
      </div>
    )
  }

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@')
    return `${local.slice(-3)}...@${domain}`
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-warm-700 hover:text-warm-900 mb-6"
      >
        <ChevronLeft size={16} />
        Volver a usuarios
      </button>

      <Breadcrumb
        items={[
          { label: 'Usuarios', href: '/admin/users' },
          { label: user.name, href: `/admin/users/${userId}`, current: true },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            {editingName ? (
              <div className="flex gap-2 mb-4">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border text-sm bg-white outline-none focus:border-gold/60"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={saving}
                  className="h-10 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setEditName(user.name)
                  }}
                  disabled={saving}
                  className="h-10 px-4 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-semibold text-lean-black dark:text-warm-50">{user.name}</h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-warm-700 hover:text-warm-900"
                >
                  Editar
                </button>
              </div>
            )}
            <p className="text-sm text-text-muted font-mono">{maskEmail(user.email)}</p>
          </div>

          <button
            onClick={handleToggleActive}
            disabled={saving}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors',
              user.is_active
                ? 'bg-success-light text-success-dark hover:bg-success'
                : 'bg-danger-light text-danger-dark hover:bg-danger',
            ].join(' ')}
          >
            {user.is_active ? '✓ Activo' : '✕ Inactivo'}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-danger-dark bg-danger-light px-4 py-3 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Información de usuario */}
      <div className="grid gap-4 max-w-2xl">
        <div className="p-4 rounded-lg bg-surface border border-border">
          <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Email</p>
          <p className="text-sm text-lean-black dark:text-warm-50">{user.email}</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-border">
          <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Rol global</p>
          <p className="text-sm text-lean-black dark:text-warm-50">{user.role}</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-border">
          <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Creado</p>
          <p className="text-sm text-text-muted">
            {new Date(user.created_at ?? '').toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>
    </div>
  )
}

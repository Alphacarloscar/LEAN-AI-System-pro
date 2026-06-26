// ============================================================
// Admin — Tab Usuarios
// ============================================================

import { useState, useMemo }      from 'react'
import { Spinner }                from '@shared/design-system/components'
import { inviteUserToCompany }    from '@/services/companies.service'
import { CheckIcon, TrashIcon, RoleBadge, DeleteConfirmModal } from './AdminHelpers'
import type { UsersTabProps, UserProfile } from './AdminHelpers'
import type { UserRole }          from '@/types/database.types'

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'superadmin',    label: 'Superadmin (Alpha)',    description: 'Acceso global a todas las empresas y proyectos.'           },
  { value: 'consultant',    label: 'Consultor Alpha',       description: 'Edita datos en los proyectos a los que se le asigne.'      },
  { value: 'client_editor', label: 'Cliente editor',        description: 'Solo ve y edita su propia empresa y proyectos.'            },
  { value: 'client_viewer', label: 'Cliente viewer',        description: 'Solo lectura de su propia empresa.'                        },
]

export function UsersTab({ companies, users, currentUserId, onUserAdded, onUserDelete }: UsersTabProps) {
  const [email,      setEmail]      = useState('')
  const [userName,   setUserName]   = useState('')
  const [companyId,  setCompanyId]  = useState('')
  const [role,       setRole]       = useState<UserRole>('client_viewer')
  const [inviting,   setInviting]   = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState<string | null>(null)

  const [filterRole,    setFilterRole]    = useState<UserRole | ''>('')
  const [filterCompany, setFilterCompany] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !userName.trim() || !companyId) return
    setInviting(true); setError(null)
    try {
      await inviteUserToCompany({ email: email.trim().toLowerCase(), name: userName.trim(), companyId, role })
      setEmail(''); setUserName(''); setCompanyId(''); setRole('client_viewer')
      setSuccess(true)
      onUserAdded()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invitar usuario')
    } finally {
      setInviting(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!userToDelete) return
    setDeleting(true); setDeleteError(null)
    try {
      await onUserDelete(userToDelete.id)
      setUserToDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar usuario')
    } finally {
      setDeleting(false)
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

  const inputClass = "w-full h-9 px-3 rounded-lg border border-border text-sm bg-warm-50 outline-none focus:border-gold/60 focus:bg-white placeholder:text-text-subtle"

  return (
    <div className="flex flex-col gap-8">
      {userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setUserToDelete(null); setDeleteError(null) }}
        />
      )}

      {/* Formulario de invitación */}
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-1">Invitar usuario</h2>
        <p className="text-xs text-text-muted mb-4">El usuario recibirá un email para crear su propia contraseña.</p>
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nombre completo" required className={inputClass} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email corporativo" required className={inputClass} />
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required aria-label="Seleccionar empresa" className={inputClass}>
            <option value="">Seleccionar empresa…</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-warm-600">Rol del usuario</p>
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={['flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors', role === opt.value ? 'border-gold/40 bg-warning-light' : 'border-border bg-warm-50 hover:bg-warm-100'].join(' ')}
              >
                <input type="radio" name="role" value={opt.value} checked={role === opt.value} onChange={() => setRole(opt.value)} className="mt-0.5 accent-gold" />
                <div>
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50">{opt.label}</p>
                  <p className="text-xs text-text-muted">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-danger-dark bg-danger-light px-3 py-2 rounded-lg">{error}</p>}
          {success && <div className="flex items-center gap-2 text-xs text-success-dark bg-success-light px-3 py-2 rounded-lg"><CheckIcon /> Invitación enviada correctamente.</div>}

          <button type="submit" disabled={inviting || !email || !userName || !companyId}
            className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40 hover:bg-gold-hover transition-colors flex items-center justify-center gap-2">
            {inviting ? <><Spinner /> Enviando…</> : 'Enviar invitación'}
          </button>
        </form>
      </div>

      {/* Lista de usuarios */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400">
            Usuarios registrados ({filteredUsers.length}{filteredUsers.length !== users.length ? ` de ${users.length}` : ''})
          </h4>
          <div className="flex gap-2">
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as UserRole | '')} aria-label="Filtrar por rol" className="h-7 px-2 rounded-lg border border-border text-xs bg-warm-50 outline-none focus:border-gold/60">
              <option value="">Todos los roles</option>
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} aria-label="Filtrar por empresa" className="h-7 px-2 rounded-lg border border-border text-xs bg-warm-50 outline-none focus:border-gold/60">
              <option value="">Todas las empresas</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {deleteError && <p className="text-xs text-danger-dark bg-danger-light px-3 py-2 rounded-lg mb-3">{deleteError}</p>}

        {users.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin usuarios registrados.</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-text-subtle">Sin usuarios que coincidan con los filtros.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-warm-50 border border-border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50 truncate">{u.name}</p>
                  <p className="text-xs font-mono text-text-subtle truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <RoleBadge role={u.role} />
                    <p className="text-xs text-text-subtle">
                      {u.company_id ? (companyMap[u.company_id] ?? 'Empresa desconocida') : 'Sin empresa'}
                    </p>
                  </div>
                  {u.id !== currentUserId && (
                    <button onClick={() => setUserToDelete(u)} title="Revocar acceso" className="p-1.5 rounded-lg text-warm-300 hover:text-danger-dark hover:bg-danger-light transition-colors">
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

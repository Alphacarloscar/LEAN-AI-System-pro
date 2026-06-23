// ============================================================
// Admin — Tipos compartidos, iconos y helpers UI
// ============================================================

import { Spinner } from '@shared/design-system/components'
import type { CompanyRow, UserRole } from '@/types/database.types'

// ── Tipos compartidos ─────────────────────────────────────────

export type Tab = 'companies' | 'users' | 'projects'

export type UserProfile = {
  id:         string
  email:      string
  name:       string
  role:       UserRole
  company_id: string | null
  created_at: string
}

export type SharedProps = {
  companies:    CompanyRow[]
  onCompanyAdd: (c: CompanyRow) => void
}

export type UsersTabProps = SharedProps & {
  users:         UserProfile[]
  currentUserId: string
  onUserAdded:   () => void
  onUserDelete:  (userId: string) => Promise<void>
}

export type ProjectsTabProps = SharedProps

// ── Iconos ────────────────────────────────────────────────────

export function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3.5 3.5L13 4" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
    </svg>
  )
}

// ── DeleteConfirmModal ────────────────────────────────────────

export function DeleteConfirmModal({
  user, deleting, onConfirm, onCancel,
}: {
  user:      UserProfile
  deleting:  boolean
  onConfirm: () => void
  onCancel:  () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-md border border-black/8 p-6 w-full max-w-sm">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 6v4M10 14h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#2A2822] text-center mb-1">¿Revocar acceso?</h2>
        <p className="text-sm text-gray-500 text-center mb-1">Vas a eliminar el acceso de:</p>
        <p className="text-sm font-medium text-[#2A2822] text-center truncate mb-1">{user.name}</p>
        <p className="text-xs font-mono text-gray-400 text-center truncate mb-4">{user.email}</p>
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center mb-6">
          Esta acción eliminará al usuario de la plataforma. No se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? <><Spinner /> Eliminando…</> : 'Revocar acceso'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AdminLoadingScreen ────────────────────────────────────────

export function AdminLoadingScreen() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-[#C8860A]">Platform Admin</span>
        <h1 className="text-xl font-semibold text-[#2A2822] mt-1">Panel de administración</h1>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-400 mt-12">
        <Spinner size="lg" />
        <span>Cargando datos del panel…</span>
      </div>
    </div>
  )
}

// ── RoleBadge ─────────────────────────────────────────────────

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string }> = {
  superadmin:    { label: 'Superadmin',      color: '#C8860A', bg: 'rgba(200,134,10,0.10)' },
  consultant:    { label: 'Consultor Alpha',  color: '#2563EB', bg: '#EFF6FF'               },
  client_editor: { label: 'Cliente editor',   color: '#059669', bg: '#ECFDF5'               },
  client_viewer: { label: 'Cliente viewer',   color: '#6B7280', bg: '#F3F4F6'               },
}

export function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role] ?? ROLE_META.client_viewer
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: meta.color, backgroundColor: meta.bg }}>
      {meta.label}
    </span>
  )
}

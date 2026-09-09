import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader, AlertCircle, Copy } from 'lucide-react'
import { Spinner, Select } from '@shared/design-system/components'
import {
  getCompanyById,
  updateCompanyInfo,
  toggleCompanyActive,
  getCompanyStats,
  deleteCompany,
  listCompanyProjects,
  listCompanyUsers,
} from '@/services/companies.service'
import { SECTOR_OPTIONS, COMPANY_SIZE_OPTIONS } from '@/modules/CompanyProfile/types'
import { PlanesTab } from '@/modules/CompanyProfile/components/PlanesTab'
import { AuditTab } from './AuditTab'
import type { CompanyRow, UserRole } from '@/types/database.types'
import { Breadcrumb } from './Breadcrumb'

type Tab = 'info' | 'packages' | 'projects' | 'users' | 'audit'

interface CompanyStats {
  projectCount: number
  userCount: number
}

const SECTOR_SELECT_OPTIONS = SECTOR_OPTIONS.map((s) => ({ value: s, label: s }))
const COMPANY_SIZE_SELECT_OPTIONS = COMPANY_SIZE_OPTIONS.map((s) => ({ value: s, label: s }))

interface CompanyUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

export function CompanyDetailView() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('info')

  const [company, setCompany] = useState<CompanyRow | null>(null)
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edición de datos
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [editingSector, setEditingSector] = useState(false)
  const [editSector, setEditSector] = useState('')
  const [editingSize, setEditingSize] = useState(false)
  const [editSize, setEditSize] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (!companyId) {
    return <div className="text-center py-8 text-danger-dark">ID de empresa no válido</div>
  }

  // Cargar datos al montar
  useEffect(() => {
    if (!companyId) return

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [companyData, statsData, projectsData, usersData] = await Promise.all([
          getCompanyById(companyId!),
          getCompanyStats(companyId!),
          listCompanyProjects(companyId!),
          listCompanyUsers(companyId!) as Promise<CompanyUser[]>,
        ])
        setCompany(companyData)
        setStats(statsData)
        setProjects(projectsData)
        setUsers(usersData)
        setEditName(companyData.name)
        setEditSector(companyData.sector)
        setEditSize(companyData.company_size)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar empresa')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [companyId])

  async function handleUpdateField(field: 'name' | 'sector' | 'size') {
    if (!company || !companyId) return
    setSaving(true)
    setSaveError(null)
    try {
      const params: Parameters<typeof updateCompanyInfo>[1] = {}
      if (field === 'name' && editName !== company.name) {
        params.name = editName
      } else if (field === 'sector' && editSector !== company.sector) {
        params.sector = editSector
      } else if (field === 'size' && editSize !== company.company_size) {
        params.company_size = editSize
      }

      if (Object.keys(params).length === 0) {
        setEditingName(false)
        setEditingSector(false)
        setEditingSize(false)
        return
      }

      const cid = companyId // TypeScript narrowing
      const updated = await updateCompanyInfo(cid, params)
      setCompany(updated)
      setEditingName(false)
      setEditingSector(false)
      setEditingSize(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!company || !companyId) return
    setSaving(true)
    setSaveError(null)
    try {
      const cid = companyId // TypeScript narrowing
      const updated = await toggleCompanyActive(cid, !company.is_active)
      setCompany(updated)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al cambiar estado')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCompany() {
    if (!companyId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const cid = companyId // TypeScript narrowing
      await deleteCompany(cid)
      navigate('/admin/companies', { replace: true })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar empresa')
      setDeleting(false)
    }
  }


  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 text-sm text-text-subtle">
          <Spinner size="lg" />
          <span>Cargando empresa…</span>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/admin/companies')}
          className="flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-warm-300 hover:text-lean-black dark:hover:text-warm-100 transition-colors mb-6"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Volver a empresas
        </button>
        <div className="flex items-center gap-2 text-sm text-danger-dark bg-danger-light px-4 py-3 rounded-lg">
          <AlertCircle size={16} />
          Empresa no encontrada
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Botón volver */}
      <button
        onClick={() => navigate('/admin/companies')}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-warm-300 hover:text-lean-black dark:hover:text-warm-100 transition-colors mb-6"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 12L6 8l4-4" />
        </svg>
        Volver a empresas
      </button>

      <Breadcrumb
        items={[
          { label: 'Administración', href: '/admin' },
          { label: 'Empresas', href: '/admin/companies' },
          { label: company.name, current: true },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-lean-black dark:text-warm-50">
              {company.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
              <code className="font-mono">{company.id}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(company.id)
                }}
                className="p-1 hover:bg-warm-100 rounded"
                title="Copiar ID"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleToggleActive}
              disabled={saving}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                company.is_active
                  ? 'bg-success-light text-success-dark hover:bg-success disabled:opacity-40'
                  : 'bg-danger-light text-danger-dark hover:bg-danger disabled:opacity-40',
              ].join(' ')}
            >
              {company.is_active ? '✓ Activa' : '✕ Inactiva'}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-danger-light text-danger-dark text-sm font-medium hover:bg-danger disabled:opacity-40 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="px-4 py-3 rounded-lg bg-surface border border-border">
              <p className="text-xs text-text-muted mb-1">Proyectos</p>
              <p className="text-2xl font-semibold text-lean-black dark:text-warm-50">
                {stats.projectCount}
              </p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-surface border border-border">
              <p className="text-xs text-text-muted mb-1">Usuarios</p>
              <p className="text-2xl font-semibold text-lean-black dark:text-warm-50">
                {stats.userCount}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Errores */}
      {(error || saveError) && (
        <div className="mb-6 flex items-center gap-2 text-sm text-danger-dark bg-danger-light px-4 py-3 rounded-lg">
          <AlertCircle size={16} />
          {error || saveError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-surface rounded-xl p-1 w-fit">
        {[
          { id: 'info' as const, label: 'Información' },
          { id: 'packages' as const, label: 'Paquetes' },
          { id: 'projects' as const, label: `Proyectos (${projects.length})` },
          { id: 'users' as const, label: `Usuarios (${users.length})` },
          { id: 'audit' as const, label: 'Auditoría' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-lean-black dark:text-warm-50 shadow-sm'
                : 'text-text-muted hover:text-warm-700',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido de tabs */}
      <div>
        {/* Tab: Información */}
        {tab === 'info' && (
          <div className="flex flex-col gap-6 max-w-2xl">
            {/* Nombre */}
            <div className="bg-surface rounded-lg border border-border p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-3">
                Nombre de empresa
              </p>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg border border-border text-sm bg-white outline-none focus:border-gold/60"
                  />
                  <button
                    onClick={() => handleUpdateField('name')}
                    disabled={saving}
                    className="h-10 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40"
                  >
                    {saving ? <Loader size={14} className="animate-spin" /> : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false)
                      setEditName(company.name)
                    }}
                    disabled={saving}
                    className="h-10 px-4 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-lean-black dark:text-warm-50">{company.name}</p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-xs text-warm-700 hover:text-warm-900"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* Sector */}
            <div className="bg-surface rounded-lg border border-border p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-3">
                Sector
              </p>
              {editingSector ? (
                <div className="flex gap-2">
                  <Select
                    value={editSector}
                    onChange={(e) => setEditSector(e.target.value)}
                    options={SECTOR_SELECT_OPTIONS}
                    placeholder="Seleccionar sector…"
                    disabled={saving}
                    className="flex-1 h-10 text-sm"
                  />
                  <button
                    onClick={() => handleUpdateField('sector')}
                    disabled={saving}
                    className="h-10 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40"
                  >
                    {saving ? <Loader size={14} className="animate-spin" /> : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSector(false)
                      setEditSector(company.sector)
                    }}
                    disabled={saving}
                    className="h-10 px-4 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-lean-black dark:text-warm-50">{company.sector || '—'}</p>
                  <button
                    onClick={() => setEditingSector(true)}
                    className="text-xs text-warm-700 hover:text-warm-900"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* Tamaño de empresa */}
            <div className="bg-surface rounded-lg border border-border p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-3">
                Tamaño
              </p>
              {editingSize ? (
                <div className="flex gap-2">
                  <Select
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    options={COMPANY_SIZE_SELECT_OPTIONS}
                    placeholder="Seleccionar tamaño…"
                    disabled={saving}
                    className="flex-1 h-10 text-sm"
                  />
                  <button
                    onClick={() => handleUpdateField('size')}
                    disabled={saving}
                    className="h-10 px-4 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40"
                  >
                    {saving ? <Loader size={14} className="animate-spin" /> : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSize(false)
                      setEditSize(company.company_size)
                    }}
                    disabled={saving}
                    className="h-10 px-4 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-lean-black dark:text-warm-50">{company.company_size || '—'}</p>
                  <button
                    onClick={() => setEditingSize(true)}
                    className="text-xs text-warm-700 hover:text-warm-900"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* Fecha de creación */}
            <div className="bg-surface rounded-lg border border-border p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-3">
                Creada
              </p>
              <p className="text-sm text-text-muted">
                {new Date(company.created_at ?? '').toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}

        {/* Tab: Paquetes */}
        {tab === 'packages' && <PlanesTab companyId={companyId!} />}

        {/* Tab: Proyectos */}
        {tab === 'projects' && (
          <div className="flex flex-col gap-3">
            {projects.length === 0 ? (
              <p className="text-sm text-text-subtle">Sin proyectos activos.</p>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="px-4 py-3 rounded-lg bg-surface border border-border">
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50">{p.name}</p>
                  <p className="text-xs text-text-muted mt-1">Fase: {p.current_phase}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Usuarios */}
        {tab === 'users' && (
          <div className="flex flex-col gap-3">
            {users.length === 0 ? (
              <p className="text-sm text-text-subtle">Sin usuarios asignados.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="px-4 py-3 rounded-lg bg-surface border border-border">
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50">{u.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-text-muted font-mono">{u.email}</p>
                    <span className="text-xs px-2 py-1 rounded bg-warm-100 text-warm-800">{u.role}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Auditoría */}
        {tab === 'audit' && companyId && (
          <AuditTab companyId={companyId} />
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-md border border-black/8 p-6 w-full max-w-sm dark:bg-warm-900">
            <div className="w-10 h-10 rounded-full bg-danger-light flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={18} stroke="var(--color-danger-dark)" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-semibold text-lean-black dark:text-warm-50 text-center mb-2">
              ¿Eliminar empresa?
            </h2>
            <p className="text-sm text-text-muted text-center mb-1">
              Esta acción no se puede deshacer.
            </p>
            <p className="text-sm font-medium text-lean-black dark:text-warm-50 text-center truncate mb-4">
              {company.name}
            </p>
            {deleteError && (
              <p className="text-xs text-danger-dark bg-danger-light px-3 py-2 rounded-lg mb-4">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-warm-700 hover:bg-warm-50 disabled:opacity-40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={deleting}
                className="flex-1 h-9 rounded-lg bg-danger-dark text-white text-sm font-medium hover:bg-danger disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Spinner /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

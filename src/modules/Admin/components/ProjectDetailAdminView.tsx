import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader, AlertCircle, Trash2 } from 'lucide-react'
import { Spinner } from '@shared/design-system/components'
import {
  getProjectById,
  updateProjectStatus,
  updateProjectInfo,
  removeProjectMember,
  updateProjectMemberRole,
  getProjectMembers,
  deleteProject,
  addProjectMember,
} from '@/services/projects.service'
import { listCompanyUsers } from '@/services/companies.service'
import { fetchCompanyProfile, upsertCompanyProfile } from '@/services/company-profile.service'
import { fetchDepartments } from '@/services/department.service'
import { fetchPersonsByCompany } from '@/services/company-person.service'
import { AuditTab } from './AuditTab'
import type { ProjectRow, UserRole } from '@/types/database.types'
import type { CompanyPerson } from '@/modules/CompanyProfile/useCompanyPersonStore'
import type { Department } from '@/modules/CompanyProfile/useDepartmentStore'
import { Breadcrumb } from './Breadcrumb'
import { reportError } from '@/lib/reportError'

type Tab = 'info' | 'config' | 'packages' | 'members' | 'personas' | 'departamentos' | 'users' | 'audit'

interface ProjectMember {
  user_id: string
  role: string
  added_at: string | null
  profile: { id: string; email: string; name: string; role: string } | null
}

interface CompanyUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

const PACKAGE_OPTIONS = [
  { id: 'boost_assessment', label: 'T1·T2·T7 — Boost Assessment' },
  { id: 'portfolio_management', label: 'T3·T5·T8·T9·T11 — Portfolio Management' },
  { id: 'legal_compliance', label: 'T6·T12 — Legal & Compliance' },
] as const

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-success-light', text: 'text-success-dark', label: 'Activo' },
  paused: { bg: 'bg-warning-light', text: 'text-warning-dark', label: 'Pausado' },
  archived: { bg: 'bg-gray-light', text: 'text-gray-dark', label: 'Archivado' },
  completed: { bg: 'bg-info-light', text: 'text-info-dark', label: 'Completado' },
}

export function ProjectDetailAdminView() {
  const { companyId, projectId } = useParams<{ companyId: string; projectId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('info')

  const [project, setProject] = useState<ProjectRow | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [personas, setPersonas] = useState<CompanyPerson[]>([])
  const [departamentos, setDepartamentos] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'consultant' | 'viewer'>('viewer')

  // Config fields
  const [objetivo, setObjetivo] = useState('')
  const [restricciones, setRestricciones] = useState('')
  const [horizonte, setHorizonte] = useState('')
  const [ecosistema, setEcosistema] = useState('')
  const [editingConfig, setEditingConfig] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)

  if (!companyId || !projectId) {
    return <div className="text-center py-8 text-danger-dark">Parámetros inválidos</div>
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [projData, membersData, usersData, profileData, personasData, deptData] = await Promise.all([
          getProjectById(projectId!),
          getProjectMembers(projectId!),
          listCompanyUsers(companyId!) as Promise<CompanyUser[]>,
          fetchCompanyProfile(projectId!).catch(() => null),
          fetchPersonsByCompany(companyId!).catch(() => []),
          fetchDepartments(companyId!).catch(() => []),
        ])
        setProject(projData)
        setMembers(membersData)
        setCompanyUsers(usersData)
        setPersonas(personasData as CompanyPerson[])
        setDepartamentos(deptData as Department[])
        setEditName(projData.name)
        if (profileData?.profile) {
          setObjetivo(profileData.profile.objetivoPrincipalIA || '')
          setRestricciones(profileData.profile.restriccionesRelevantes || '')
          setHorizonte(profileData.profile.horizonteEsperadoValor || '')
          setEcosistema(profileData.profile.ecosistemaTecnologico || '')
        }
      } catch (err) {
        reportError('[ProjectDetailView] loadData', err)
        setError(err instanceof Error ? err.message : 'Error al cargar proyecto')
      } finally {
        setLoading(false)
      }
    }
    if (projectId && companyId) loadData()
  }, [projectId, companyId])

  async function handleUpdateStatus(newStatus: string) {
    if (!project) return
    setSaving(true)
    try {
      const updated = await updateProjectStatus(projectId!, newStatus as any)
      setProject(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateName() {
    if (!project || editName === project.name) {
      setEditingName(false)
      return
    }
    setSaving(true)
    try {
      const updated = await updateProjectInfo(projectId!, { name: editName })
      setProject(updated)
      setEditingName(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveConfig() {
    if (!projectId || !project) return
    setConfigSaving(true)
    try {
      await upsertCompanyProfile({
        engagementName: project.name,
        sector: '',
        tamanoEmpresa: '',
        objetivoPrincipalIA: objetivo,
        restriccionesRelevantes: restricciones,
        horizonteEsperadoValor: horizonte,
        ecosistemaTecnologico: ecosistema,
        areasPrioritarias: [],
        fricciones: [],
        savedAt: new Date().toISOString(),
      }, projectId)
      setEditingConfig(false)
    } catch (err) {
      reportError('[ProjectDetailView] handleSaveConfig', err)
      setError(err instanceof Error ? err.message : 'Error al guardar configuración')
    } finally {
      setConfigSaving(false)
    }
  }

  async function handleDeleteProject() {
    setSaving(true)
    try {
      await deleteProject(projectId!)
      navigate(`/admin/companies/${companyId!}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      setSaving(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    setSaving(true)
    try {
      await removeProjectMember(projectId!, userId)
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover miembro')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateMemberRole(userId: string, newRole: string) {
    setSaving(true)
    try {
      await updateProjectMemberRole(projectId!, userId, newRole as any)
      const updated = await getProjectMembers(projectId!)
      setMembers(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar rol')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddMember() {
    if (!selectedUserId || !projectId) return
    setSaving(true)
    try {
      await addProjectMember(projectId, selectedUserId, selectedRole)
      const updated = await getProjectMembers(projectId)
      setMembers(updated)
      setSelectedUserId('')
      setShowAddMemberModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar miembro')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-text-muted">Cargando proyecto…</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <button
          onClick={() => navigate(`/admin/companies/${companyId}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-warm-300 hover:text-lean-black dark:hover:text-warm-100 transition-colors mb-6"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Volver a empresa
        </button>
        <div className="text-danger-dark bg-danger-light px-4 py-3 rounded-lg">Proyecto no encontrado</div>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[project.status] || STATUS_STYLES.active

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-warm-300 hover:text-lean-black dark:hover:text-warm-100 transition-colors mb-6"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 12L6 8l4-4" />
        </svg>
        Volver a empresa
      </button>

      <Breadcrumb
        items={[
          { label: 'Administración', href: '/admin' },
          { label: 'Empresas', href: '/admin/companies' },
          { label: 'Empresa', href: `/admin/companies/${companyId!}` },
          { label: project.name, current: true },
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
                  {saving ? <Loader size={14} className="animate-spin" /> : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setEditName(project.name)
                  }}
                  disabled={saving}
                  className="h-10 px-4 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-semibold text-lean-black dark:text-warm-50">{project.name}</h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-warm-700 hover:text-warm-900"
                >
                  Editar
                </button>
              </div>
            )}
            <p className="text-sm text-text-muted">Fase: {project.current_phase}</p>
          </div>

          <div className="flex gap-2">
            <select
              value={project.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 ${statusStyle.bg} ${statusStyle.text}`}
            >
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="archived">Archivado</option>
              <option value="completed">Completado</option>
            </select>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-danger-light text-danger-dark text-sm font-medium hover:bg-danger disabled:opacity-40 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-danger-dark bg-danger-light px-4 py-3 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-surface rounded-xl p-1 w-fit flex-wrap">
        {[
          { id: 'info' as const, label: 'Información' },
          { id: 'config' as const, label: 'Configuración' },
          { id: 'packages' as const, label: 'Paquetes' },
          { id: 'members' as const, label: `Miembros (${members.length})` },
          { id: 'personas' as const, label: `Personas (${personas.length})` },
          { id: 'departamentos' as const, label: `Departamentos (${departamentos.length})` },
          { id: 'users' as const, label: `Usuarios (${companyUsers.length})` },
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

      {/* Tab Content */}
      <div>
        {tab === 'info' && (
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="p-4 rounded-lg bg-surface border border-border">
              <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Estado actual</p>
              <p className={`text-sm font-medium ${statusStyle.text}`}>{statusStyle.label}</p>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Fase actual</p>
              <p className="text-sm text-lean-black dark:text-warm-50">{project.current_phase}</p>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Creado</p>
              <p className="text-sm text-text-muted">
                {new Date(project.created_at ?? '').toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        )}

        {tab === 'packages' && (
          <div className="flex flex-col gap-3 max-w-2xl">
            {PACKAGE_OPTIONS.map((pkg) => (
              <label
                key={pkg.id}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors',
                  project.contracted_packages?.includes(pkg.id as any)
                    ? 'border-gold/40 bg-warning-light'
                    : 'border-border bg-surface hover:bg-warm-50',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={project.contracted_packages?.includes(pkg.id as any) ?? false}
                  disabled
                  className="accent-gold"
                />
                <span className="text-sm font-medium text-lean-black dark:text-warm-50">{pkg.label}</span>
              </label>
            ))}
          </div>
        )}

        {tab === 'members' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-fit px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-hover transition-colors"
            >
              + Agregar miembro
            </button>
            {members.length === 0 ? (
              <p className="text-sm text-text-subtle">Sin miembros asignados.</p>
            ) : (
              members.map((m) => (
                <div key={m.user_id} className="px-4 py-3 rounded-lg bg-surface border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-lean-black dark:text-warm-50">
                        {m.profile?.name ?? 'Usuario desconocido'}
                      </p>
                      <p className="text-xs text-text-muted font-mono">{m.profile?.email ?? m.user_id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateMemberRole(m.user_id, e.target.value)}
                        disabled={saving}
                        className="h-8 px-2 rounded text-xs border border-border bg-white disabled:opacity-40"
                      >
                        <option value="consultant">Consultor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        disabled={saving}
                        className="p-2 text-danger-dark hover:bg-danger-light rounded transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'config' && (
          <div className="flex flex-col gap-4 max-w-3xl">
            {editingConfig ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block">Objetivo Principal</label>
                  <textarea
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white outline-none focus:border-gold/60"
                    rows={3}
                    placeholder="Describir el objetivo principal del proyecto"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block">Restricciones</label>
                  <textarea
                    value={restricciones}
                    onChange={(e) => setRestricciones(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white outline-none focus:border-gold/60"
                    rows={3}
                    placeholder="Restricciones y limitaciones del proyecto"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block">Horizonte Temporal</label>
                  <select
                    value={horizonte}
                    onChange={(e) => setHorizonte(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white outline-none focus:border-gold/60"
                  >
                    <option value="">Seleccionar horizonte…</option>
                    <option value="corto">Corto plazo (&lt; 6 meses)</option>
                    <option value="medio">Medio plazo (6-18 meses)</option>
                    <option value="largo">Largo plazo (&gt; 18 meses)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block">Ecosistema Tecnológico</label>
                  <textarea
                    value={ecosistema}
                    onChange={(e) => setEcosistema(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white outline-none focus:border-gold/60"
                    rows={3}
                    placeholder="Descripción del ecosistema tecnológico actual"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveConfig}
                    disabled={configSaving}
                    className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40"
                  >
                    {configSaving ? <Loader size={14} className="animate-spin" /> : 'Guardar configuración'}
                  </button>
                  <button
                    onClick={() => setEditingConfig(false)}
                    disabled={configSaving}
                    className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-surface border border-border">
                  <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Objetivo</p>
                  <p className="text-sm text-lean-black dark:text-warm-50 whitespace-pre-wrap">{objetivo || '—'}</p>
                </div>
                <div className="p-4 rounded-lg bg-surface border border-border">
                  <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Restricciones</p>
                  <p className="text-sm text-lean-black dark:text-warm-50 whitespace-pre-wrap">{restricciones || '—'}</p>
                </div>
                <div className="p-4 rounded-lg bg-surface border border-border">
                  <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Horizonte</p>
                  <p className="text-sm text-lean-black dark:text-warm-50">{horizonte || '—'}</p>
                </div>
                <div className="p-4 rounded-lg bg-surface border border-border">
                  <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-2">Ecosistema</p>
                  <p className="text-sm text-lean-black dark:text-warm-50 whitespace-pre-wrap">{ecosistema || '—'}</p>
                </div>
                <button
                  onClick={() => setEditingConfig(true)}
                  className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-hover"
                >
                  Editar configuración
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'personas' && (
          <div className="flex flex-col gap-3">
            {personas.length === 0 ? (
              <p className="text-sm text-text-subtle">Sin personas registradas en esta empresa.</p>
            ) : (
              personas.map((p) => (
                <div key={p.id} className="px-4 py-3 rounded-lg bg-surface border border-border">
                  <p className="text-sm font-medium text-lean-black dark:text-warm-50">{p.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p className="text-xs text-text-muted font-mono">{p.role}</p>
                      {p.department && <p className="text-xs text-text-muted">{p.department}</p>}
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-warm-100 text-warm-800">{p.source_tool}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'departamentos' && (
          <div className="flex flex-col gap-3">
            {departamentos.length === 0 ? (
              <p className="text-sm text-text-subtle">Sin departamentos configurados.</p>
            ) : (
              departamentos.map((d) => (
                <div key={d.id} className="px-4 py-3 rounded-lg bg-surface border border-border">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-lean-black dark:text-warm-50">{d.name}</p>
                      {d.type && <p className="text-xs text-text-muted">{d.type}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="flex flex-col gap-3">
            {companyUsers.length === 0 ? (
              <p className="text-sm text-text-subtle">Sin usuarios en esta empresa.</p>
            ) : (
              companyUsers.map((u) => (
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
        {tab === 'audit' && projectId && companyId && (
          <AuditTab projectId={projectId} companyId={companyId} />
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowAddMemberModal(false)} />
          <div className="relative bg-white rounded-xl shadow-md border border-black/8 p-6 w-full max-w-sm dark:bg-warm-900">
            <h2 className="text-base font-semibold text-lean-black dark:text-warm-50 mb-4">Agregar miembro</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Usuario</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-white outline-none focus:border-gold/60"
                >
                  <option value="">Seleccionar usuario…</option>
                  {companyUsers
                    .filter((u) => !members.find((m) => m.user_id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Rol</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-white outline-none focus:border-gold/60"
                >
                  <option value="consultant">Consultor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  disabled={saving}
                  className="flex-1 h-9 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={saving || !selectedUserId}
                  className="flex-1 h-9 rounded-lg bg-gold text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saving ? <Spinner /> : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-md border border-black/8 p-6 w-full max-w-sm dark:bg-warm-900">
            <h2 className="text-base font-semibold text-lean-black dark:text-warm-50 text-center mb-2">
              ¿Eliminar proyecto?
            </h2>
            <p className="text-sm text-text-muted text-center mb-4">{project.name}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
                className="flex-1 h-9 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={saving}
                className="flex-1 h-9 rounded-lg bg-danger-dark text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Spinner /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

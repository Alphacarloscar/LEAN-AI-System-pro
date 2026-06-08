// ============================================================
// GOBY — AdminView (/admin)
//
// Sprint 9: panel de administración exclusivo para superadmin.
//
// Arquitectura de datos:
//   AdminView fetcha companies + users UNA SOLA VEZ al montar.
//   Los datos se pasan como props a cada tab para evitar:
//     - race conditions en el selector de empresa
//     - re-fetch al cambiar de tab (tabs se remontan)
//     - selector vacío mientras llega la respuesta de Supabase
// ============================================================

import { useState, useEffect }  from 'react'
import { useNavigate }          from 'react-router-dom'
import { useAuthStore }         from '@/modules/Auth'
import { listCompanies, listAllUsers, deleteUser } from '@/services/companies.service'
import { AdminLoadingScreen }   from './components/AdminHelpers'
import { CompaniesTab }         from './components/CompaniesTab'
import { UsersTab }             from './components/UsersTab'
import { ProjectsTab }          from './components/ProjectsTab'
import type { Tab, UserProfile } from './components/AdminHelpers'
import type { CompanyRow }      from '@/types/database.types'

export function AdminView() {
  const { user }      = useAuthStore()
  const navigate      = useNavigate()
  const [tab, setTab] = useState<Tab>('companies')

  const [companies,   setCompanies]   = useState<CompanyRow[]>([])
  const [users,       setUsers]       = useState<UserProfile[]>([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [loadError,   setLoadError]   = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== 'superadmin') navigate('/', { replace: true })
  // navigate is stable by spec (react-router)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'superadmin') return
    Promise.all([listCompanies(), listAllUsers()])
      .then(([c, u]) => { setCompanies(c); setUsers(u) })
      .catch((err) => { setLoadError(err instanceof Error ? err.message : 'Error al cargar datos del panel') })
      .finally(() => setInitialLoad(false))
  }, [user])

  if (!user || user.role !== 'superadmin') return null
  if (initialLoad) return <AdminLoadingScreen />

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
          Error al cargar el panel: {loadError}
        </p>
      </div>
    )
  }

  function handleCompanyAdd(c: CompanyRow) {
    setCompanies((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function handleUserDelete(userId: string) {
    await deleteUser(userId)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'companies', label: 'Empresas'  },
    { id: 'users',     label: 'Usuarios'  },
    { id: 'projects',  label: 'Proyectos' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C8860A]">Platform Admin</span>
        </div>
        <h1 className="text-xl font-semibold text-[#2A2822]">Panel de administración</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona empresas, usuarios y proyectos de GOBY.</p>
      </div>

      <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={['px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.id ? 'bg-white text-[#2A2822] shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'companies' && <CompaniesTab companies={companies} onCompanyAdd={handleCompanyAdd} />}
        {tab === 'users' && (
          <UsersTab
            companies={companies}
            users={users}
            currentUserId={user.id}
            onCompanyAdd={handleCompanyAdd}
            onUserAdded={() => listAllUsers().then(setUsers)}
            onUserDelete={handleUserDelete}
          />
        )}
        {tab === 'projects' && <ProjectsTab companies={companies} onCompanyAdd={handleCompanyAdd} />}
      </div>
    </div>
  )
}

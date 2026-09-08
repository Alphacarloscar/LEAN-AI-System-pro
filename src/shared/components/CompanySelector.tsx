import { useState, useRef, useEffect } from 'react'
import { Spinner } from '@shared/design-system/components'
import { useProjectStore } from '@/modules/Engagement/store'
import { listCompanies } from '@/services/companies.service'
import { listMyProjects } from '@/services/projects.service'
import { useNavigate, useLocation } from 'react-router-dom'
import type { CompanyRow } from '@/types/database.types'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 12 12" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={['transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  )
}

interface CompanySelectorProps {
  dark: boolean
}

export function CompanySelector({ dark }: CompanySelectorProps) {
  const { activeCompanyId, setActiveCompany, activeProjectId, selectProject } = useProjectStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isAdminRoute, setIsAdminRoute] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detectar si estamos en /admin
  useEffect(() => {
    setIsAdminRoute(location.pathname.startsWith('/admin'))
  }, [location.pathname])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Cargar empresas al montar
  useEffect(() => {
    async function loadCompanies() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await listCompanies()
        setCompanies(data)
        // Auto-select primera empresa si no hay activa
        if (!activeCompanyId && data.length > 0) {
          setActiveCompany(data[0].id)
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Error al cargar empresas')
      } finally {
        setLoading(false)
      }
    }
    loadCompanies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCompanyChange(companyId: string) {
    setActiveCompany(companyId)
    setOpen(false)

    // Si el proyecto activo NO pertenece a la nueva empresa, cambiar proyecto
    if (activeProjectId) {
      try {
        const allProjects = await listMyProjects()
        const projectInNewCompany = allProjects.find(
          (p) => p.id === activeProjectId && p.company_id === companyId
        )

        if (!projectInNewCompany) {
          // Proyecto no pertenece a la nueva empresa — seleccionar primer proyecto disponible
          const firstProjectInCompany = allProjects.find((p) => p.company_id === companyId)
          if (firstProjectInCompany) {
            selectProject(firstProjectInCompany.id)
            navigate(`/evaluation/projects/${firstProjectInCompany.id}/t10`)
          } else {
            selectProject(null)
            navigate('/')
          }
        }
      } catch (err) {
        console.error('Error al cambiar empresa:', err)
      }
    }
  }

  const activeCompany = companies.find((c) => c.id === activeCompanyId)
  const label = activeCompany?.name ?? (loading ? 'Cargando…' : 'Seleccionar empresa')

  if (isAdminRoute) {
    // En /admin, mostrar selector deshabilitado
    return (
      <div className={[
        'flex items-center gap-1.5 h-8 px-3 rounded-full opacity-50 cursor-not-allowed',
        'text-[10px] font-mono uppercase tracking-wide',
        dark ? 'text-white/65 bg-white/5' : 'text-black/55 bg-black/3',
      ].join(' ')}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
             stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="5" />
          <path d="M4 6h4" />
        </svg>
        <span style={{ opacity: 0.6 }}>Empresa</span>
        <span style={{ opacity: 0.45 }}>/</span>
        <span className="max-w-[120px] truncate font-semibold">{label}</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => !loading && setOpen((o) => !o)}
        disabled={loading}
        title="Cambiar empresa activa"
        aria-label="Selector de empresa"
        className={[
          'flex items-center gap-1.5 h-8 px-3 rounded-full disabled:opacity-50',
          'text-[10px] font-mono uppercase tracking-wide transition-colors duration-200',
          open
            ? dark
              ? 'bg-white/12 text-white/90'
              : 'bg-black/8 text-black/80'
            : dark
              ? 'text-white/65 hover:text-white/90 hover:bg-white/8'
              : 'text-black/55 hover:text-black/80 hover:bg-black/6',
        ].join(' ')}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="5" />
            <path d="M4 4l4 4M8 4l-4 4" />
          </svg>
        )}
        <span style={{ opacity: 0.6 }}>Empresa</span>
        <span style={{ opacity: open ? 0.7 : 0.45 }}>/</span>
        <span className="max-w-[120px] truncate font-semibold">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={[
          'absolute top-full left-0 mt-1.5 w-64 rounded-xl shadow-md border overflow-hidden z-50',
          dark ? 'bg-warm-800 border-white/10' : 'bg-white border-black/8',
        ].join(' ')}>
          {loadError && (
            <div className={['px-4 py-3 text-xs', dark ? 'text-danger' : 'text-danger'].join(' ')}>
              {loadError}
            </div>
          )}

          {companies.length > 0 ? (
            <div className="py-1">
              {companies.map((company) => {
                const isActive = company.id === activeCompanyId
                return (
                  <button
                    key={company.id}
                    onClick={() => handleCompanyChange(company.id)}
                    className={[
                      'w-full text-left px-4 py-2.5 text-xs transition-colors',
                      isActive
                        ? dark
                          ? 'bg-gold/20 text-gold-hover font-medium'
                          : 'bg-gold/5 text-gold font-medium'
                        : dark
                          ? 'text-warm-300 hover:bg-white/6'
                          : 'text-warm-500 hover:bg-warm-50',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">{company.name}</span>
                      {isActive && (
                        <span className="text-[10px] font-mono opacity-60">activo</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className={['px-4 py-3 text-xs', dark ? 'text-warm-500' : 'text-warm-400'].join(' ')}>
              Sin empresas disponibles
            </div>
          )}
        </div>
      )}
    </div>
  )
}

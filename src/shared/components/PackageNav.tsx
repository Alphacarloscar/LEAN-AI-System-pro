// ============================================================
// PackageNav — Navegación por paquetes comerciales (FDR-002, Fase 1)
//
// Se renderiza SOLO con VITE_PACKAGE_NAV_ENABLED=true, desde
// AppSidebar. Sustituye a la lista plana T1–T12 por:
//   — "Dashboard Global" (T10, standalone, en '/').
//   — 4 paquetes desplegables: cada uno con su dashboard + tools.
//
// Reglas FDR-002:
//   §5 Estado activo se DERIVA de la URL (useLocation), no del store.
//      El store solo guarda qué desplegables están abiertos.
//   §7 La ruta /packages/:packageId auto-expande ese paquete.
//   Paths SIEMPRE vía toolRoutes.ts (fuente única). URLs de paquete
//   limpias (sin engagementId): lo resuelve el guard + store.
// ============================================================

import { useEffect }              from 'react'
import { useLocation }            from 'react-router-dom'
import type { PackageId }         from '@/config/salesPackages'
import {
  SALES_PACKAGES,
  STANDALONE_TOOLS,
  isPackageId,
}                                 from '@/config/salesPackages'
import {
  buildPackageDashboardPath,
  buildPackageToolPath,
  buildStandaloneToolPath,
}                                 from '@/config/toolRoutes'
import { toolLabel }              from '@/config/toolMetadata'
import { usePackageNavStore }     from '@/shared/stores/packageNav.store'

interface PackageNavProps {
  /** Navega a un path y cierra el panel lateral (igual que la nav legacy). */
  onNavigate: (path: string) => void
}

// Extrae el packageId activo desde "/packages/:packageId(/...)".
// Devuelve PackageId válido o null: un id desconocido en la URL (entrada
// no confiable) NO debe tratarse como paquete activo.
function activePackageIdFromPath(pathname: string): PackageId | null {
  const match = pathname.match(/^\/packages\/([^/]+)/)
  if (!match) return null
  const candidate = match[1]
  return isPackageId(candidate) ? candidate : null
}

export function PackageNav({ onNavigate }: PackageNavProps) {
  const location           = useLocation()
  const expandedPackageIds = usePackageNavStore((s) => s.expandedPackageIds)
  const togglePackage      = usePackageNavStore((s) => s.togglePackageExpanded)
  const ensureExpanded     = usePackageNavStore((s) => s.ensurePackageExpanded)

  const pathname        = location.pathname
  const activePackageId = activePackageIdFromPath(pathname)
  const isGlobalActive  = pathname === '/'

  // §7 — auto-expandir el paquete activo al entrar por URL/deep-link.
  // activePackageId ya viene validado como PackageId (o null).
  useEffect(() => {
    if (activePackageId) {
      ensureExpanded(activePackageId)
    }
  // ensureExpanded es acción estable de Zustand
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePackageId])

  const globalTool     = STANDALONE_TOOLS[0] // T10 → '/'
  const standaloneTool = STANDALONE_TOOLS[1] // T12 → '/tools/t12'

  const standalonePath   = buildStandaloneToolPath(standaloneTool)
  const isStandaloneActive = pathname === standalonePath

  return (
    <div className="px-3 space-y-0.5">

      {/* ── Dashboard Global (T10, standalone) ── */}
      <button
        onClick={() => onNavigate('/')}
        className={[
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-100',
          isGlobalActive ? 'bg-[#C8860A]/10 dark:bg-[#C8860A]/15' : 'hover:bg-black/3 dark:hover:bg-white/4',
        ].join(' ')}
      >
        <span
          className="font-mono text-[10px] shrink-0 w-7 text-center"
          style={{ color: isGlobalActive ? '#C8860A' : '#9ca3af' }}
        >
          {globalTool}
        </span>
        <span className={[
          'text-xs truncate',
          isGlobalActive ? 'font-semibold text-[#C8860A] dark:text-amber-400' : 'text-black/65 dark:text-gray-300',
        ].join(' ')}>
          Dashboard Global
        </span>
      </button>

      {/* Separador */}
      <div className="mx-1 my-2 border-t border-black/6 dark:border-white/6" />

      {/* ── Paquetes desplegables ── */}
      {SALES_PACKAGES.map((pkg) => {
        const isExpanded       = expandedPackageIds.includes(pkg.id)
        const isPackageActive  = activePackageId === pkg.id
        const dashboardPath    = buildPackageDashboardPath(pkg.id)
        const isDashboardActive = pathname === dashboardPath

        return (
          <div key={pkg.id} className="space-y-0.5">

            {/* Cabecera del paquete — toggle de expansión (NO navega) */}
            <button
              onClick={() => togglePackage(pkg.id)}
              aria-expanded={isExpanded}
              className={[
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-100',
                isPackageActive ? 'bg-navy/8 dark:bg-navy/20' : 'hover:bg-black/3 dark:hover:bg-white/4',
              ].join(' ')}
            >
              {/* Chevron */}
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                className={[
                  'shrink-0 transition-transform duration-150',
                  isExpanded ? 'rotate-90' : '',
                  isPackageActive ? 'text-navy dark:text-amber-400' : 'text-black/40 dark:text-white/40',
                ].join(' ')}
              >
                <path d="M3 1.5L6.5 5L3 8.5" />
              </svg>
              <span className={[
                'text-xs font-semibold truncate flex-1',
                isPackageActive ? 'text-navy dark:text-warm-100' : 'text-black/70 dark:text-gray-300',
              ].join(' ')}>
                {pkg.commercialName}
              </span>
            </button>

            {/* Cuerpo del desplegable */}
            {isExpanded && (
              <div className="ml-3 pl-2 border-l border-black/8 dark:border-white/8 space-y-0.5">

                {/* Dashboard del paquete */}
                <button
                  onClick={() => onNavigate(dashboardPath)}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all duration-100',
                    isDashboardActive ? 'bg-[#C8860A]/10 dark:bg-[#C8860A]/15' : 'hover:bg-black/3 dark:hover:bg-white/4',
                  ].join(' ')}
                >
                  <span className="shrink-0 w-7 text-center" aria-hidden="true">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke={isDashboardActive ? '#C8860A' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                      <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" />
                      <rect x="8" y="1.5" width="4.5" height="4.5" rx="1" />
                      <rect x="1.5" y="8" width="4.5" height="4.5" rx="1" />
                      <rect x="8" y="8" width="4.5" height="4.5" rx="1" />
                    </svg>
                  </span>
                  <span className={[
                    'text-xs truncate',
                    isDashboardActive ? 'font-semibold text-[#C8860A] dark:text-amber-400' : 'text-black/60 dark:text-gray-400',
                  ].join(' ')}>
                    {pkg.dashboardLabel}
                  </span>
                </button>

                {/* Tools del paquete */}
                {pkg.tools.map((code) => {
                  const toolPath   = buildPackageToolPath(pkg.id, code)
                  const isToolActive = pathname === toolPath

                  return (
                    <button
                      key={code}
                      onClick={() => onNavigate(toolPath)}
                      className={[
                        'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all duration-100',
                        isToolActive ? 'bg-[#C8860A]/10 dark:bg-[#C8860A]/15' : 'hover:bg-black/3 dark:hover:bg-white/4',
                      ].join(' ')}
                    >
                      <span
                        className="font-mono text-[10px] shrink-0 w-7 text-center"
                        style={{ color: isToolActive ? '#C8860A' : '#9ca3af' }}
                      >
                        {code}
                      </span>
                      <span className={[
                        'text-xs truncate',
                        isToolActive ? 'font-semibold text-[#C8860A] dark:text-amber-400' : 'text-black/60 dark:text-gray-400',
                      ].join(' ')}>
                        {toolLabel(code)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Tool standalone (T12, fuera de paquete, suelta como T10) ── */}
      <div className="mx-1 my-2 border-t border-black/6 dark:border-white/6" />
      <button
        onClick={() => onNavigate(standalonePath)}
        className={[
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-100',
          isStandaloneActive ? 'bg-[#C8860A]/10 dark:bg-[#C8860A]/15' : 'hover:bg-black/3 dark:hover:bg-white/4',
        ].join(' ')}
      >
        <span
          className="font-mono text-[10px] shrink-0 w-7 text-center"
          style={{ color: isStandaloneActive ? '#C8860A' : '#9ca3af' }}
        >
          {standaloneTool}
        </span>
        <span className={[
          'text-xs truncate',
          isStandaloneActive ? 'font-semibold text-[#C8860A] dark:text-amber-400' : 'text-black/65 dark:text-gray-300',
        ].join(' ')}>
          {toolLabel(standaloneTool)}
        </span>
      </button>
    </div>
  )
}

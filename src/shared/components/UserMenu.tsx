// ============================================================
// UserMenu — Dropdown de usuario con opciones y logout
//
// Reemplaza LogoutButton. Muestra:
//   1. Perfil → /profile
//   2. Administración → /admin (solo si superadmin)
//   3. Ayuda → # (placeholder)
//   4. Cerrar sesión → logout + /login
// Footer: v[APP_VERSION] · BD [DB_VERSION]
// ============================================================

import { useEffect, useRef, useState }           from 'react'
import { useNavigate }                           from 'react-router-dom'
import { useAuthStore }                          from '@/modules/Auth'
import { PUBLIC_ROUTES }                         from '@/config/routes'
import { getDbVersion }                          from '@/services/schemaMetadata.service'

interface UserMenuProps {
  dark: boolean
}

export function UserMenu({ dark }: UserMenuProps) {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dbVersion, setDbVersion] = useState<string>('—')
  const menuRef = useRef<HTMLDivElement>(null)

  // Cargar DB_VERSION desde schema_metadata via el servicio centralizado
  // Si la tabla no existe o hay error, mostrar '—' como fallback
  useEffect(() => {
    async function loadDbVersion() {
      const version = await getDbVersion()
      setDbVersion(version ?? '—')
    }
    loadDbVersion()
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleLogout() {
    logout()
    navigate(PUBLIC_ROUTES.LOGIN, { replace: true })
  }

  const isSuperadmin = user?.role === 'superadmin'
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0'

  return (
    <div ref={menuRef} className="relative">
      {/* Botón toggle */}
      <button
        onClick={() => setOpen(!open)}
        title={user?.name}
        className={[
          'h-8 px-3 rounded-full flex items-center gap-2',
          'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          dark
            ? 'hover:bg-white/8'
            : 'hover:bg-black/6',
        ].join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
          style={{
            backgroundColor: dark ? 'rgba(200, 134, 10, 0.2)' : 'rgba(200, 134, 10, 0.1)',
            color: dark ? '#C8860A' : '#C8860A',
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        {/* Nombre */}
        <span
          className="text-xs font-medium hidden sm:inline truncate max-w-[100px]"
          style={{ color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(28,26,22,0.85)' }}
        >
          {user?.name ?? 'Usuario'}
        </span>
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={['transition-transform duration-200 shrink-0', open ? 'rotate-180' : ''].join(' ')}
          style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(28,26,22,0.5)' }}
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className={[
            'absolute right-0 mt-2 w-48 rounded-xl shadow-md border',
            'z-50 overflow-hidden',
            dark
              ? 'bg-warm-800 border-warm-600/30'
              : 'bg-white border-black/10',
          ].join(' ')}
          role="menu"
        >
          {/* Header con email */}
          <div
            className="px-4 py-3 border-b"
            style={{
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: dark ? 'rgba(255,255,255,0.9)' : 'rgba(28,26,22,0.9)' }}
            >
              {user?.name ?? 'Usuario'}
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(28,26,22,0.5)' }}
            >
              {user?.email}
            </p>
          </div>

          {/* Items del menú */}
          <nav className="flex flex-col" role="none">
            {/* Perfil */}
            <button
              onClick={() => {
                navigate('/profile')
                setOpen(false)
              }}
              className={[
                'w-full text-left px-4 py-2.5 text-xs font-medium',
                'transition-colors duration-100',
                'border-b',
                dark
                  ? 'hover:bg-warm-700 text-warm-100 border-warm-600/20'
                  : 'hover:bg-black/3 text-lean-black border-black/8',
              ].join(' ')}
              role="menuitem"
            >
              Perfil
            </button>

            {/* Administración — solo superadmin */}
            {isSuperadmin && (
              <button
                onClick={() => {
                  navigate('/admin')
                  setOpen(false)
                }}
                className={[
                  'w-full text-left px-4 py-2.5 text-xs font-medium',
                  'transition-colors duration-100',
                  'border-b',
                  dark
                    ? 'hover:bg-warm-700 text-warm-100 border-warm-600/20'
                    : 'hover:bg-black/3 text-lean-black border-black/8',
                ].join(' ')}
                role="menuitem"
              >
                Administración
              </button>
            )}

            {/* Ayuda */}
            <button
              onClick={() => {
                // TODO: definir destino final
                // navigate('#')
                setOpen(false)
              }}
              title="Sección de ayuda — próximamente"
              disabled
              className={[
                'w-full text-left px-4 py-2.5 text-xs font-medium',
                'transition-colors duration-100',
                'border-b',
                'cursor-not-allowed opacity-50',
                dark
                  ? 'text-warm-100 border-warm-600/20'
                  : 'text-lean-black border-black/8',
              ].join(' ')}
              role="menuitem"
            >
              Ayuda
            </button>

            {/* Cerrar sesión */}
            <button
              onClick={handleLogout}
              className={[
                'w-full text-left px-4 py-2.5 text-xs font-medium',
                'transition-colors duration-100',
                dark
                  ? 'hover:bg-warm-700 text-warm-100'
                  : 'hover:bg-black/3 text-lean-black',
              ].join(' ')}
              role="menuitem"
            >
              Cerrar sesión
            </button>
          </nav>

          {/* Footer — versión de app y BD */}
          <div
            className="px-4 py-2 text-center text-[10px] font-mono"
            style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(28,26,22,0.3)' }}
          >
            v{appVersion} · BD {dbVersion}
          </div>
        </div>
      )}
    </div>
  )
}

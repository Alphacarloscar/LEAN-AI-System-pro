// ============================================================
// EngagementSelector — Selector de engagement activo
//
// Vive en el header global (AppLayout).
// Muestra el engagement activo y permite cambiar entre ellos
// o crear uno nuevo directamente desde el header.
//
// Paleta: Obsidian Amber — warm charcoal + gold #C8860A
// ============================================================

import { useState, useRef, useEffect }   from 'react'
import { useEngagementStore }            from '@/modules/Engagement/store'
import { useAuthStore }                  from '@/modules/Auth'
import { isDemoEnabled }                 from '@/lib/config'

// ── Iconos ────────────────────────────────────────────────────

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

function PlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 2v8M2 6h8" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="10" height="10" viewBox="0 0 12 12"
         fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 1a5 5 0 11-5 5" strokeLinecap="round" />
    </svg>
  )
}

// ── Componente principal ──────────────────────────────────────

interface EngagementSelectorProps {
  dark: boolean
}

export function EngagementSelector({ dark }: EngagementSelectorProps) {
  const {
    projects,
    activeEngagementId,
    isLoading,
    selectEngagement,
    createAndSelect,
  } = useEngagementStore()
  const { user } = useAuthStore()
  const myUserId = user?.id ?? null

  const [open,        setOpen]        = useState(false)
  const [creating,    setCreating]    = useState(false)
  const [newName,     setNewName]     = useState('')
  const [createBusy,  setCreateBusy]  = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setNewName('')
        setCreateError(null)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Focus el input al abrir el formulario de creación
  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  const activeEngagement = projects.find((e) => e.id === activeEngagementId)
  // En modo demo: si no hay proyecto real seleccionado → label "Proyecto Demo"
  const label = activeEngagement?.name
    ?? (isDemoEnabled && !activeEngagementId ? 'Proyecto Demo' : 'Seleccionar proyecto')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setCreateBusy(true)
    setCreateError(null)
    try {
      await createAndSelect(name)
      setOpen(false)
      setCreating(false)
      setNewName('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear proyecto'
      console.error('[EngagementSelector] createAndSelect:', err)
      setCreateError(msg)
    } finally {
      setCreateBusy(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex items-center gap-1.5 h-8 px-3 rounded-full',
          'text-[10px] font-mono uppercase tracking-wide transition-colors duration-200',
          open
            ? dark
              ? 'bg-white/12 text-white/80'
              : 'bg-black/8 text-black/70'
            : dark
              ? 'text-white/40 hover:text-white/70 hover:bg-white/8'
              : 'text-black/30 hover:text-black/60 hover:bg-black/6',
        ].join(' ')}
      >
        {isLoading ? (
          <SpinnerIcon />
        ) : (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="10" height="8" rx="1" />
            <path d="M4 3V2a1 1 0 012 0v1M8 3V2a1 1 0 012 0v1" />
          </svg>
        )}
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={[
          'absolute top-full left-0 mt-1.5 w-60 rounded-xl shadow-lg border overflow-hidden z-50',
          dark
            ? 'bg-warm-800 border-white/10'
            : 'bg-white border-black/8',
        ].join(' ')}>

          {/* Opción "Proyecto Demo" — solo en entorno de staging (isDemoEnabled) */}
          {isDemoEnabled && (
            <>
              <div className="py-1">
                <button
                  onClick={() => { selectEngagement(null); setOpen(false) }}
                  className={[
                    'w-full text-left px-4 py-2.5 text-xs transition-colors',
                    !activeEngagementId
                      ? dark
                        ? 'bg-amber-900/30 text-amber-300 font-medium'
                        : 'bg-amber-50 text-[#C8860A] font-medium'
                      : dark
                        ? 'text-gray-300 hover:bg-white/6'
                        : 'text-gray-700 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex-shrink-0 text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(200,134,10,0.12)', color: '#C8860A' }}
                    >
                      Demo
                    </span>
                    <span className="truncate flex-1">Proyecto Demo</span>
                  </div>
                  {!activeEngagementId && (
                    <span className="text-[10px] font-mono opacity-60">activo</span>
                  )}
                </button>
              </div>
              {projects.length > 0 && (
                <div className={['border-t', dark ? 'border-white/8' : 'border-gray-100'].join(' ')} />
              )}
            </>
          )}

          {/* Lista de engagements */}
          {projects.length > 0 ? (
            <div className="py-1">
              {projects.map((eng) => {
                const isOwn     = !myUserId || eng.owner_id === myUserId
                const isActive  = eng.id === activeEngagementId
                return (
                  <button
                    key={eng.id}
                    onClick={() => { selectEngagement(eng.id); setOpen(false) }}
                    className={[
                      'w-full text-left px-4 py-2.5 text-xs transition-colors',
                      isActive
                        ? dark
                          ? 'bg-amber-900/30 text-amber-300 font-medium'
                          : 'bg-amber-50 text-[#C8860A] font-medium'
                        : dark
                          ? 'text-gray-300 hover:bg-white/6'
                          : 'text-gray-700 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate flex-1">{eng.name}</span>
                      {!isOwn && (
                        <span className={[
                          'flex-shrink-0 text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded',
                          dark ? 'bg-white/10 text-white/40' : 'bg-gray-100 text-gray-400',
                        ].join(' ')}>
                          Vista
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-mono opacity-60">
                        {isOwn ? 'activo' : 'activo · solo lectura'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className={['px-4 py-3 text-xs', dark ? 'text-gray-500' : 'text-gray-400'].join(' ')}>
              Sin proyectos disponibles
            </div>
          )}

          {/* Separador */}
          <div className={['border-t', dark ? 'border-white/8' : 'border-gray-100'].join(' ')} />

          {/* Crear nuevo engagement */}
          {creating ? (
            <div className="p-3 flex flex-col gap-1.5">
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setCreateError(null) }}
                  placeholder="Nombre del proyecto..."
                  className={[
                    'flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none',
                    createError
                      ? 'border-red-400 dark:border-red-500'
                      : dark
                        ? 'bg-white/8 border-white/12 text-white placeholder:text-gray-500 focus:border-amber-500/50'
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#C8860A]/50',
                  ].join(' ')}
                  disabled={createBusy}
                />
                <button
                  type="submit"
                  disabled={createBusy || !newName.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-[#C8860A] text-white text-xs font-medium disabled:opacity-40 hover:bg-[#B57609] transition-colors"
                >
                  {createBusy ? <SpinnerIcon /> : 'Crear'}
                </button>
              </form>
              {createError && (
                <p className="text-[10px] text-red-500 dark:text-red-400 px-0.5 leading-snug">
                  {createError}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className={[
                'w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors',
                dark
                  ? 'text-gray-400 hover:bg-white/6 hover:text-gray-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
              ].join(' ')}
            >
              <PlusIcon />
              Nuevo proyecto
            </button>
          )}
        </div>
      )}
    </div>
  )
}

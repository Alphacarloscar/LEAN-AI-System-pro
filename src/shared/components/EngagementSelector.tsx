// ============================================================
// EngagementSelector — Selector de proyecto activo
//
// Vive en el header global (AppLayout).
// Muestra el proyecto activo y permite cambiar entre ellos
// o crear uno nuevo directamente desde el header.
//
// Lógica de creación por rol:
//   superadmin / consultant → selector de empresa obligatorio
//   client_editor           → hereda company_id del perfil (sin selector)
//   client_viewer           → no puede crear proyectos (botón oculto)
//
// Paleta: Obsidian Amber — warm charcoal + gold #C8860A
// ============================================================

import { useState, useRef, useEffect }  from 'react'
import { Spinner }                      from '@shared/design-system/components'
import { useEngagementStore }           from '@/modules/Engagement/store'
import { useAuthStore }                 from '@/modules/Auth'
import { listCompanies }                from '@/services/companies.service'
import { isDemoEnabled }                from '@/lib/config'
import { reportError }                  from '@/lib/reportError'
import type { CompanyRow }              from '@/types/database.types'
import { useUnsavedChanges }            from '@/shared/hooks/useUnsavedChanges'
import { UnsavedChangesModal }          from '@/shared/components/UnsavedChangesModal'

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
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 2v8M2 6h8" />
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

  const myUserId = user?.id   ?? null
  const userRole = user?.role ?? 'client_viewer'

  // Solo superadmin elige empresa al crear — los demás heredan la suya del perfil
  const needsCompanySelector = userRole === 'superadmin'
  // client_viewer no puede crear proyectos
  const canCreateProject     = userRole !== 'client_viewer'

  const [open,           setOpen]          = useState(false)
  const [creating,       setCreating]      = useState(false)
  const [newName,        setNewName]       = useState('')
  const [createBusy,     setCreateBusy]    = useState(false)
  const [createError,    setCreateError]   = useState<string | null>(null)
  const [pendingId,      setPendingId]     = useState<string | null | undefined>(undefined)
  const { isDirty, clearDirty } = useUnsavedChanges()

  // Estado solo para superadmin/consultant
  const [companies,      setCompanies]      = useState<CompanyRow[]>([])
  const [loadingCo,      setLoadingCo]      = useState(false)
  const [selectedCompany, setSelectedCompany] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeCreate()
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Focus el input al abrir el formulario de creación
  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  // Para superadmin/consultant: cargar empresas al abrir el form de creación
  // companies.length y needsCompanySelector omitidos intencionalmente: el efecto solo debe
  // dispararse al abrir el formulario (creating → true). Los guards internos cubren idempotencia.
  // Añadirlos crearía un re-fetch cada vez que llegan datos o cambia el rol.
  useEffect(() => {
    if (!creating || !needsCompanySelector) return
    if (companies.length > 0) return // ya cargadas
    setLoadingCo(true)
    listCompanies()
      .then(setCompanies)
      .catch(() => setCreateError('No se pudieron cargar las empresas'))
      .finally(() => setLoadingCo(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creating])

  function closeCreate() {
    setCreating(false)
    setNewName('')
    setSelectedCompany('')
    setCreateError(null)
  }

  const activeEngagement = projects.find((e) => e.id === activeEngagementId)
  const label = activeEngagement?.name
    ?? (isDemoEnabled && !activeEngagementId ? 'Proyecto Demo' : 'Seleccionar proyecto')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    // Para superadmin/consultant, empresa obligatoria
    if (needsCompanySelector && !selectedCompany) {
      setCreateError('Selecciona una empresa antes de crear el proyecto.')
      return
    }
    setCreateBusy(true)
    setCreateError(null)
    try {
      // Pasamos companyId explícito para superadmin/consultant;
      // undefined para client_editor (el store lo infiere del perfil)
      await createAndSelect(name, needsCompanySelector ? selectedCompany : undefined)
      closeCreate()
      setOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear proyecto'
      reportError('[EngagementSelector] createAndSelect', err)
      setCreateError(msg)
    } finally {
      setCreateBusy(false)
    }
  }

  // Clases reutilizables para inputs inline del dropdown
  const inlineInputClass = [
    'flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none',
    dark
      ? 'bg-white/8 border-white/12 text-white placeholder:text-warm-400 focus:border-gold/50'
      : 'bg-warm-50 border-border text-lean-black placeholder:text-text-subtle focus:border-gold/50',
  ].join(' ')

  const inlineSelectClass = [
    'w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none',
    dark
      ? 'bg-white/8 border-white/12 text-white focus:border-gold/50'
      : 'bg-warm-50 border-border text-lean-black focus:border-gold/50',
  ].join(' ')

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Cambiar proyecto activo"
        aria-label="Selector de proyecto"
        className={[
          'flex items-center gap-1.5 h-8 px-3 rounded-full',
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
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="10" height="8" rx="1" />
            <path d="M4 3V2a1 1 0 012 0v1M8 3V2a1 1 0 012 0v1" />
          </svg>
        )}
        <span
          className="shrink-0"
          style={{ opacity: 0.6 }}
        >
          Proyecto
        </span>
        <span
          className="shrink-0"
          style={{ opacity: open ? 0.7 : 0.45 }}
        >
          /
        </span>
        <span className="max-w-[120px] truncate font-semibold">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={[
          'absolute top-full left-0 mt-1.5 w-64 rounded-xl shadow-md border overflow-hidden z-50',
          dark
            ? 'bg-warm-800 border-white/10'
            : 'bg-white border-black/8',
        ].join(' ')}>

          {/* Opción "Proyecto Demo" — solo en staging (isDemoEnabled) */}
          {isDemoEnabled && (
            <>
              <div className="py-1">
                <button
                  onClick={() => {
                      if (isDirty) { setPendingId(null); return }
                      selectEngagement(null); setOpen(false)
                    }}
                  className={[
                    'w-full text-left px-4 py-2.5 text-xs transition-colors',
                    !activeEngagementId
                      ? dark
                        ? 'bg-gold/20 text-gold-hover font-medium'
                        : 'bg-gold/5 text-gold font-medium'
                      : dark
                        ? 'text-warm-200 hover:bg-white/6'
                        : 'text-lean-black hover:bg-warm-50',
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
                <div className={['border-t', dark ? 'border-white/8' : 'border-warm-100'].join(' ')} />
              )}
            </>
          )}

          {/* Lista de proyectos */}
          {projects.length > 0 ? (
            <div className="py-1">
              {projects.map((eng) => {
                const isOwn    = !myUserId || eng.owner_id === myUserId
                const isActive = eng.id === activeEngagementId
                return (
                  <button
                    key={eng.id}
                    onClick={() => {
                        if (isDirty) { setPendingId(eng.id); return }
                        selectEngagement(eng.id); setOpen(false)
                      }}
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
                    <div className="flex items-center gap-2">
                      <span className="truncate flex-1">{eng.name}</span>
                      {!isOwn && (
                        <span className={[
                          'flex-shrink-0 text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded',
                          dark ? 'bg-white/10 text-white/40' : 'bg-warm-100 text-text-muted',
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
            <div className={['px-4 py-3 text-xs', dark ? 'text-warm-500' : 'text-warm-400'].join(' ')}>
              Sin proyectos disponibles
            </div>
          )}

          {/* Separador + formulario de creación — solo si puede crear */}
          {canCreateProject && (
            <>
              <div className={['border-t', dark ? 'border-white/8' : 'border-warm-100'].join(' ')} />

              {creating ? (
                <div className="p-3 flex flex-col gap-2">
                  <form onSubmit={handleCreate} className="flex flex-col gap-2">

                    {/* Nombre del proyecto */}
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        value={newName}
                        onChange={(e) => { setNewName(e.target.value); setCreateError(null) }}
                        placeholder="Nombre del proyecto..."
                        className={[
                          inlineInputClass,
                          createError ? (dark ? 'border-danger' : 'border-danger-dark') : '',
                        ].join(' ')}
                        disabled={createBusy}
                      />
                    </div>

                    {/* Selector de empresa — solo para superadmin/consultant */}
                    {needsCompanySelector && (
                      <div>
                        {loadingCo ? (
                          <div className={['flex items-center gap-1.5 text-xs px-1', dark ? 'text-warm-400' : 'text-warm-500'].join(' ')}>
                            <Spinner size="sm" /> Cargando empresas…
                          </div>
                        ) : (
                          <select
                            value={selectedCompany}
                            onChange={(e) => { setSelectedCompany(e.target.value); setCreateError(null) }}
                            required
                            disabled={createBusy}
                            className={[
                              inlineSelectClass,
                              !selectedCompany && createError ? (dark ? 'border-danger' : 'border-danger-dark') : '',
                            ].join(' ')}
                          >
                            <option value="">Empresa (obligatorio)…</option>
                            {companies.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Botón crear */}
                    <button
                      type="submit"
                      disabled={
                        createBusy ||
                        !newName.trim() ||
                        (needsCompanySelector && !selectedCompany)
                      }
                      className="w-full py-1.5 rounded-lg bg-[#C8860A] text-white text-xs font-medium disabled:opacity-40 hover:bg-[#B57609] transition-colors flex items-center justify-center gap-1.5"
                    >
                      {createBusy ? <><Spinner size="sm" /> Creando…</> : 'Crear proyecto'}
                    </button>
                  </form>

                  {createError && (
                    <p className={['text-[10px] px-0.5 leading-snug', dark ? 'text-danger' : 'text-danger'].join(' ')}>
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
                      ? 'text-warm-300 hover:bg-white/6 hover:text-warm-100'
                      : 'text-text-muted hover:bg-warm-50 hover:text-lean-black',
                  ].join(' ')}
                >
                  <PlusIcon />
                  Nuevo proyecto
                </button>
              )}
            </>
          )}
        </div>
      )}

      <UnsavedChangesModal
        open={pendingId !== undefined}
        onCancel={() => setPendingId(undefined)}
        onDiscard={() => {
          clearDirty()
          selectEngagement(pendingId ?? null)
          setPendingId(undefined)
          setOpen(false)
        }}
        message="Si cambias de proyecto ahora, los cambios en curso se perderán."
      />
    </div>
  )
}

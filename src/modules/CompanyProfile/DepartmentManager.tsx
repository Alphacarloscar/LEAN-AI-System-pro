// ============================================================
// DepartmentManager — Gestión de departamentos de empresa
//
// CRUD visual de company_departments para CompanyProfileView.
// - Chips Amber con botón de eliminar (hover reveal)
// - Input de texto limpio (sin sugerencias)
// - canEditCompanySettings: oculta controles de escritura para client_editor y client_viewer
// - Optimistic delete con rollback automático en error
// ============================================================

import { useState }          from 'react'
import { useDepartmentStore } from './useDepartmentStore'
import { usePermissions }     from '@/modules/Auth'
import { Spinner }            from '@shared/design-system/components'

// ── Props ─────────────────────────────────────────────────────

interface Props {
  /** company_id de la empresa activa. Si null, el componente no renderiza. */
  companyId: string | null
}

// ── Componente ────────────────────────────────────────────────

export function DepartmentManager({ companyId }: Props) {
  const { canEditCompanySettings } = usePermissions()
  const { departments, isLoading, error, addDepartment, deleteDepartment } =
    useDepartmentStore()

  const [inputValue, setInputValue] = useState('')
  const [isAdding,   setIsAdding]   = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // ── Handlers ──────────────────────────────────────────────

  async function handleAdd() {
    const toAdd = inputValue.trim()
    if (!toAdd || !companyId) return

    setIsAdding(true)
    setLocalError(null)

    try {
      await addDepartment(companyId, toAdd)
      // Solo limpiamos el input si no hubo error en el store
      if (!useDepartmentStore.getState().error) {
        setInputValue('')
      }
    } catch (err) {
      // Captura errores inesperados que escapen del store
      const msg = err instanceof Error ? err.message : 'Error inesperado al añadir departamento'
      console.error('[DepartmentManager] handleAdd:', err)
      setLocalError(msg)
    } finally {
      // Siempre apaga el spinner, pase lo que pase
      setIsAdding(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      setInputValue('')
      setLocalError(null)
    }
  }

  // Guard: sin empresa activa no renderizamos nada
  if (!companyId) return null

  // Mensaje de error activo: preferimos el del store (viene de Supabase),
  // y como fallback el local (excepción inesperada en el componente)
  const activeError = error ?? localError

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Lista de departamentos ── */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-1">
          <Spinner size="sm" label="Cargando departamentos…" className="text-text-subtle dark:text-gray-600" />
          <span className="text-xs text-text-subtle dark:text-gray-600 font-mono">
            Cargando departamentos...
          </span>
        </div>

      ) : departments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => (
            <span
              key={dept.id}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border border-[#C8860A]/30 bg-[#C8860A]/8 text-[#C8860A] dark:border-[#C8860A]/40 dark:bg-[#C8860A]/10 dark:text-[#E8A020]"
            >
              {dept.name}
              {canEditCompanySettings && (
                <button
                  type="button"
                  onClick={() => deleteDepartment(dept.id)}
                  aria-label={`Eliminar ${dept.name}`}
                  className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full opacity-0 group-hover:opacity-100 text-[#C8860A]/50 hover:text-danger-dark hover:bg-danger-light/30 transition-all duration-100"
                >
                  <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>

      ) : (
        <p className="text-xs text-text-subtle dark:text-gray-600 italic py-1">
          Sin departamentos configurados. Añade los departamentos de esta empresa para que estén disponibles en T2, T3, T4 y T8.
        </p>
      )}

      {/* ── Input de alta — solo visible para superadmin y consultant ── */}
      {canEditCompanySettings && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              if (localError) setLocalError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del departamento..."
            disabled={isAdding}
            className={[
              'flex-1 px-4 py-2 rounded-lg text-sm transition-colors duration-150',
              'bg-white dark:bg-gray-900',
              'border border-border dark:border-white/8',
              'text-lean-black dark:text-gray-100 placeholder-text-subtle dark:placeholder-gray-600',
              'focus:outline-none focus:border-[#C8860A]/60 focus:ring-2 focus:ring-[#C8860A]/15',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputValue.trim() || isAdding}
            className={[
              'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
              inputValue.trim() && !isAdding
                ? 'bg-[#C8860A] text-white hover:bg-[#B07709] shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-text-subtle dark:text-gray-600 cursor-not-allowed',
            ].join(' ')}
          >
            {isAdding ? (
              <Spinner size="sm" label="Añadiendo…" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M7 2v10M2 7h10" />
              </svg>
            )}
            Añadir
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {activeError && (
        <p className="text-[11px] text-danger-dark font-mono">{activeError}</p>
      )}

    </div>
  )
}

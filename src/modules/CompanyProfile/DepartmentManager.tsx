// ============================================================
// DepartmentManager — Gestión de departamentos de empresa
//
// CRUD visual de company_departments para CompanyProfileView.
// - Chips Amber con botón de eliminar (hover reveal)
// - Input con autocomplete contra ALL_BUSINESS_AREAS (sugerencias)
// - isReadOnly: oculta controles de escritura para Viewers
// - Optimistic delete con rollback automático en error
// ============================================================

import { useState, useMemo }   from 'react'
import { useDepartmentStore }  from './useDepartmentStore'
import { usePermissions }      from '@/modules/Auth'
import { ALL_BUSINESS_AREAS }  from './types'

// ── Props ─────────────────────────────────────────────────────

interface Props {
  /** company_id de la empresa activa. Si null, el componente no renderiza. */
  companyId: string | null
}

// ── Componente ────────────────────────────────────────────────

export function DepartmentManager({ companyId }: Props) {
  const { isReadOnly } = usePermissions()
  const { departments, isLoading, error, addDepartment, deleteDepartment } =
    useDepartmentStore()

  const [inputValue,      setInputValue]      = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isAdding,        setIsAdding]        = useState(false)

  // Sugerencias: ALL_BUSINESS_AREAS filtradas por lo que ya existe
  const unusedSuggestions = useMemo(() => {
    const existing = new Set(departments.map((d) => d.name.toLowerCase()))
    return ALL_BUSINESS_AREAS.filter((a) => !existing.has(a.toLowerCase()))
  }, [departments])

  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return unusedSuggestions
    return unusedSuggestions.filter((s) =>
      s.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [unusedSuggestions, inputValue])

  // ── Handlers ──────────────────────────────────────────────

  async function handleAdd(name?: string) {
    const toAdd = (name ?? inputValue).trim()
    if (!toAdd || !companyId) return
    setIsAdding(true)
    await addDepartment(companyId, toAdd)
    setInputValue('')
    setShowSuggestions(false)
    setIsAdding(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setInputValue('')
    }
  }

  // Guard: sin empresa activa no renderizamos nada
  if (!companyId) return null

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Lista de departamentos ── */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-1">
          <svg
            className="animate-spin h-3.5 w-3.5 text-text-subtle dark:text-gray-600"
            viewBox="0 0 24 24" fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
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
              {!isReadOnly && (
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

      {/* ── Input de alta — solo visible si no es ReadOnly ── */}
      {!isReadOnly && (
        <div className="relative">
          <div className="flex gap-2">

            {/* Input + dropdown de sugerencias */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={handleKeyDown}
                placeholder="Nombre del departamento..."
                className={[
                  'w-full px-4 py-2 rounded-lg text-sm transition-colors duration-150',
                  'bg-white dark:bg-gray-900',
                  'border border-border dark:border-white/8',
                  'text-lean-black dark:text-gray-100 placeholder-text-subtle dark:placeholder-gray-600',
                  'focus:outline-none focus:border-[#C8860A]/60 focus:ring-2 focus:ring-[#C8860A]/15',
                ].join(' ')}
              />

              {/* Dropdown sugerencias */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-border dark:border-white/10 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                  <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle dark:text-gray-600 border-b border-border dark:border-white/6">
                    Sugerencias habituales
                  </p>
                  <div className="max-h-44 overflow-y-auto">
                    {filteredSuggestions.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleAdd(area) }}
                        className="w-full text-left px-4 py-2 text-sm text-lean-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botón añadir */}
            <button
              type="button"
              onClick={() => handleAdd()}
              disabled={!inputValue.trim() || isAdding}
              className={[
                'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                inputValue.trim() && !isAdding
                  ? 'bg-[#C8860A] text-white hover:bg-[#B07709] shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-subtle dark:text-gray-600 cursor-not-allowed',
              ].join(' ')}
            >
              {isAdding ? (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 1a6 6 0 11-6 6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 2v10M2 7h10" />
                </svg>
              )}
              Añadir
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <p className="text-[11px] text-danger-dark font-mono">{error}</p>
      )}

    </div>
  )
}

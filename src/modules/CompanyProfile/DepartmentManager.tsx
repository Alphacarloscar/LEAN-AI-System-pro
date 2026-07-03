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
import { Pencil }             from 'lucide-react'
import { useDepartmentStore, type Department, type DepartmentType } from './useDepartmentStore'
import { usePermissions }     from '@/modules/Auth'
import { Spinner, SegmentedControl } from '@shared/design-system/components'
import { reportError }        from '@/lib/reportError'
import {
  DEPARTMENT_TYPE_LABEL,
  DEPARTMENT_CHIP_CLASS,
  DEPARTMENT_DOT_CLASS,
  DEPARTMENT_TYPE_ICON,
} from './departmentDisplay'

const TYPE_OPTIONS = [
  { value: 'it',          label: 'IT / Tecnología', icon: <DEPARTMENT_TYPE_ICON.it size={12} strokeWidth={1.5} /> },
  { value: 'negocio_ops', label: 'Negocio & Ops',   icon: <DEPARTMENT_TYPE_ICON.negocio_ops size={12} strokeWidth={1.5} /> },
]

// ── Props ─────────────────────────────────────────────────────

interface Props {
  /** company_id de la empresa activa. Si null, el componente no renderiza. */
  companyId: string | null
}

// ── Componente ────────────────────────────────────────────────

export function DepartmentManager({ companyId }: Props) {
  const { canEditCompanySettings } = usePermissions()
  const { departments, isLoading, error, addDepartment, updateDepartment, deleteDepartment } =
    useDepartmentStore()

  const [inputValue, setInputValue] = useState('')
  const [typeValue,  setTypeValue]  = useState<DepartmentType>('negocio_ops')
  const [isAdding,   setIsAdding]   = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName,  setEditName]  = useState('')
  const [editType,  setEditType]  = useState<DepartmentType>('negocio_ops')
  const [isSaving,  setIsSaving]  = useState(false)

  // ── Handlers ──────────────────────────────────────────────

  async function handleAdd() {
    const toAdd = inputValue.trim()
    if (!toAdd || !companyId) return

    setIsAdding(true)
    setLocalError(null)

    try {
      await addDepartment(companyId, toAdd, typeValue)
      // Solo limpiamos el input si no hubo error en el store
      if (!useDepartmentStore.getState().error) {
        setInputValue('')
        setTypeValue('negocio_ops')
      }
    } catch (err) {
      // Captura errores inesperados que escapen del store
      const msg = err instanceof Error ? err.message : 'Error inesperado al añadir departamento'
      reportError('[DepartmentManager] handleAdd', err)
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

  function startEditing(dept: Department) {
    setEditingId(dept.id)
    setEditName(dept.name)
    setEditType(dept.type)
    setLocalError(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditName('')
  }

  async function handleSaveEdit() {
    const trimmed = editName.trim()
    if (!trimmed || !editingId) return

    setIsSaving(true)
    setLocalError(null)

    try {
      await updateDepartment(editingId, { name: trimmed, type: editType })
      if (!useDepartmentStore.getState().error) {
        setEditingId(null)
        setEditName('')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al actualizar departamento'
      reportError('[DepartmentManager] handleSaveEdit', err)
      setLocalError(msg)
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
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
          <Spinner size="sm" label="Cargando departamentos…" className="text-text-subtle dark:text-warm-400" />
          <span className="text-xs text-text-subtle dark:text-warm-400 font-mono">
            Cargando departamentos...
          </span>
        </div>

      ) : departments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => {
            if (editingId === dept.id) {
              return (
                <div
                  key={dept.id}
                  className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8860A]/50 bg-white dark:bg-warm-800"
                >
                  <SegmentedControl
                    aria-label="Perfil del departamento"
                    size="sm"
                    value={editType}
                    onChange={(v) => setEditType(v as DepartmentType)}
                    options={TYPE_OPTIONS}
                  />
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    disabled={isSaving}
                    className="w-32 px-2 py-1 rounded-md text-xs bg-white dark:bg-warm-900 border border-border dark:border-white/8 text-lean-black dark:text-warm-50 focus:outline-none focus:border-[#C8860A]/60"
                  />
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!editName.trim() || isSaving}
                    aria-label={`Guardar ${dept.name}`}
                    className="text-xs font-semibold text-[#C8860A] hover:text-[#B07709] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Spinner size="sm" label="Guardando…" /> : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    aria-label="Cancelar edición"
                    className="text-xs text-text-subtle dark:text-warm-400 hover:text-lean-black dark:hover:text-warm-50"
                  >
                    Cancelar
                  </button>
                </div>
              )
            }

            const TypeIcon = DEPARTMENT_TYPE_ICON[dept.type]

            return (
              <span
                key={dept.id}
                title={DEPARTMENT_TYPE_LABEL[dept.type]}
                className={[
                  'group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
                  DEPARTMENT_CHIP_CLASS[dept.type],
                ].join(' ')}
              >
                <span className={['h-1.5 w-1.5 rounded-full shrink-0', DEPARTMENT_DOT_CLASS[dept.type]].join(' ')} aria-hidden="true" />
                <TypeIcon size={12} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
                {dept.name}
                {canEditCompanySettings && (
                  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-100">
                    <button
                      type="button"
                      onClick={() => startEditing(dept)}
                      aria-label={`Editar ${dept.name}`}
                      className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Pencil size={9} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDepartment(dept.id)}
                      aria-label={`Eliminar ${dept.name}`}
                      className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full hover:text-danger-dark hover:bg-danger-light/30 transition-all duration-100"
                    >
                      <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
                      </svg>
                    </button>
                  </span>
                )}
              </span>
            )
          })}
        </div>

      ) : (
        <p className="text-xs text-text-subtle dark:text-warm-400 italic py-1">
          Sin departamentos configurados. Añade los departamentos de esta empresa para que estén disponibles en T2, T3, T4 y T8.
        </p>
      )}

      {/* ── Input de alta — solo visible para superadmin y consultant ── */}
      {canEditCompanySettings && (
        <div className="flex flex-col gap-2 pt-3 border-t border-border dark:border-white/8">
          <span className="text-xs font-semibold text-text-subtle dark:text-warm-400">
            Añadir departamento
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-text-subtle dark:text-warm-400 shrink-0">
              Perfil
              <SegmentedControl
                aria-label="Perfil del departamento"
                value={typeValue}
                onChange={(v) => setTypeValue(v as DepartmentType)}
                options={TYPE_OPTIONS}
              />
            </label>

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
                'bg-white dark:bg-warm-800',
                'border border-border dark:border-white/8',
                'text-lean-black dark:text-warm-50 placeholder-text-subtle dark:placeholder-warm-400',
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
                  : 'bg-warm-100 dark:bg-warm-700 text-text-subtle dark:text-warm-400 cursor-not-allowed',
              ].join(' ')}
            >
              {isAdding ? (
                <Spinner size="sm" label="Añadiendo…" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M7 2v10M2 7h10" />
                </svg>
              )}
              Añadir
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {activeError && (
        <p className="text-[11px] text-danger-dark font-mono">{activeError}</p>
      )}

    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { Spinner } from '@shared/design-system/components'
import { listApplicationTexts, updateApplicationText } from '@/services/applicationTexts.service'
import type { ApplicationTextsRow } from '@/types/database.types'

type TextRow = ApplicationTextsRow & {
  edited?: boolean
  currentValues?: Partial<ApplicationTextsRow>
  isSaving?: boolean
  saveError?: string | null
}

// Módulos permitidos (ADR-029: multi-dominio + BKL-024)
const ALLOWED_MODULES = ['t1', 't10', 't11', 't12', 'admin', 'admin_auth', 'company_profile', 'navegacion'] as const

// Resuelve el texto a mostrar: si hay override, usa ese; si no, usa la clave
function resolveText(row: TextRow): string {
  const override = row.currentValues?.text_override ?? row.text_override
  return override?.trim() ? override : (row.text_key || '')
}

export function TextsEditorTab() {
  const [texts, setTexts] = useState<TextRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterModule, setFilterModule] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Load all texts once on mount
  useEffect(() => {
    setLoading(true)
    setError(null)
    listApplicationTexts()
      .then((data) => {
        console.log('[TextsEditorTab] Loaded', data.length, 'texts')
        setTexts(data.map((t) => ({ ...t, edited: false })))
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar textos'
        console.error('[TextsEditorTab] Error:', msg, err)
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  const modules = useMemo(() => {
    // Solo mostrar módulos permitidos (filtrar del dataset actual y limitar a ALLOWED_MODULES)
    const modulesInData = new Set(texts.map((t) => t.tool_module))
    return ALLOWED_MODULES.filter(m => modulesInData.has(m)).sort()
  }, [texts])

  const filteredTexts = useMemo(() => {
    return texts
      .filter((t) => ALLOWED_MODULES.includes(t.tool_module as any)) // Solo módulos permitidos
      .filter((t) => !filterModule || t.tool_module === filterModule)
  }, [texts, filterModule])

  const editedCount = texts.filter((t) => t.edited).length

  function updateField(id: string, field: keyof ApplicationTextsRow, value: any) {
    setTexts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        return {
          ...t,
          edited: true,
          currentValues: {
            ...t.currentValues,
            [field]: value === '' ? null : value, // Convertir '' a null para limpiar overrides
          },
        }
      })
    )
  }

  function getValue(row: TextRow, field: keyof ApplicationTextsRow): any {
    if (row.currentValues && field in row.currentValues) {
      return row.currentValues[field]
    }
    return row[field]
  }

  async function saveRow(id: string) {
    const row = texts.find((t) => t.id === id)
    if (!row || !row.currentValues || Object.keys(row.currentValues).length === 0) return

    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isSaving: true, saveError: null } : t))
    )

    try {
      await updateApplicationText(id, row.currentValues)
      setTexts((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          return {
            ...t,
            edited: false,
            currentValues: undefined,
            isSaving: false,
          }
        })
      )
      setEditingId(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setTexts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isSaving: false, saveError: msg } : t))
      )
    }
  }

  function cancelEdit(id: string) {
    setTexts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        return {
          ...t,
          edited: false,
          currentValues: undefined,
          saveError: null,
        }
      })
    )
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-text-subtle">
        <Spinner size="lg" />
        <span>Cargando textos…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-danger-dark bg-danger-light rounded-xl">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-2">
          Textos por herramienta
        </h2>
        <p className="text-xs text-text-muted">
          Edita los textos en la tabla. Los cambios se guardan automáticamente en la BD.
        </p>
      </div>

      {/* Filter by module */}
      <div className="flex gap-2 items-center">
        <label className="text-xs font-medium text-warm-600">Módulo:</label>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="h-8 px-2 rounded-lg border border-border text-xs bg-warm-50 outline-none focus:border-gold/60"
        >
          <option value="">Todos ({texts.length})</option>
          {modules.map((mod) => (
            <option key={mod} value={mod}>
              {mod} ({texts.filter((t) => t.tool_module === mod).length})
            </option>
          ))}
        </select>
        {editedCount > 0 && (
          <span className="ml-auto text-xs font-medium text-gold">{editedCount} cambios sin guardar</span>
        )}
      </div>

      {/* Table */}
      {filteredTexts.length === 0 ? (
        <p className="text-sm text-text-subtle">Sin textos para mostrar.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-warm-50 border-b border-border">
                  <th className="px-3 py-2 text-left font-medium text-warm-700">Módulo</th>
                  <th className="px-3 py-2 text-left font-medium text-warm-700">Clave</th>
                  <th className="px-3 py-2 text-left font-medium text-warm-700">Archivo</th>
                  <th className="px-3 py-2 text-left font-medium text-warm-700">Texto</th>
                  <th className="px-3 py-2 text-center font-medium text-warm-700">✎</th>
                </tr>
              </thead>
              <tbody>
                {filteredTexts.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.edited
                        ? 'border-b border-border bg-warning-light'
                        : 'border-b border-border hover:bg-warm-50'
                    }
                  >
                    <td className="px-3 py-2 text-warm-700 font-semibold">{row.tool_module}</td>

                    {/* Clave (readonly — texto original del código) */}
                    <td className="px-3 py-2 text-text-muted" title={row.text_key}>
                      <div className="line-clamp-2 text-xs">{row.text_key}</div>
                    </td>

                    {/* Archivo (readonly — file:line en código fuente) */}
                    <td className="px-3 py-2 text-text-muted" title={getValue(row, 'filename') || '—'}>
                      <span className="text-xs">{getValue(row, 'filename') || '—'}</span>
                    </td>

                    {/* Texto (editable override — si vacío, se usa Clave en renderizado) */}
                    <td className="px-3 py-2">
                      {editingId === row.id ? (
                        <input
                          type="text"
                          placeholder="(vacío = usar clave)"
                          value={getValue(row, 'text_override') ?? ''}
                          onChange={(e) => updateField(row.id, 'text_override', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gold/60 text-xs"
                        />
                      ) : (
                        <span title={resolveText(row)} className="text-text-muted line-clamp-2 text-xs">
                          {resolveText(row)}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2 text-center">
                      {editingId === row.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => saveRow(row.id)}
                            disabled={row.isSaving}
                            title="Guardar"
                            className="p-1 rounded text-success-dark hover:bg-success-light disabled:opacity-40 transition-colors"
                          >
                            {row.isSaving ? <Spinner /> : <Check size={14} strokeWidth={1.5} />}
                          </button>
                          <button
                            onClick={() => cancelEdit(row.id)}
                            disabled={row.isSaving}
                            title="Cancelar"
                            className="p-1 rounded text-danger-dark hover:bg-danger-light disabled:opacity-40 transition-colors"
                          >
                            <X size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingId(row.id)}
                          className="px-2.5 py-1 text-xs rounded border border-border hover:bg-warm-50 text-text-muted hover:text-warm-700 transition-colors"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

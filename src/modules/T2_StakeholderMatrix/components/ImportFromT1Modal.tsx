// ============================================================
// T2 — ImportFromT1Modal
//
// Lista los entrevistados del store de T1 y permite seleccionar
// cuáles importar como stakeholders en T2.
//
// Mapeo automático:
//   name, role          → directo desde T1
//   type 'it'           → archetype 'especialista', dept 'IT / Tecnología'
//   type 'business'     → archetype 'decisor',      dept 'Sin asignar'
//   resistance          → 'media' (neutro — ajustar tras importar)
//   department          → sobrescrito si el consultor edita en T2
//   notes               → 'Importado desde T1 — Madurez Radar'
//   manualOverride      → false
//
// Entrevistados ya presentes en T2 (por nombre) → deshabilitados.
// ============================================================

import { useState }             from 'react'
import { useT1Store }           from '@/modules/T1_MaturityRadar/store'
import { useT2Store }           from '../store'
import { useEngagementStore }   from '@/modules/Engagement/store'
import type { ArchetypeCode }   from '../types'

interface ImportFromT1ModalProps {
  onClose: () => void
}

export function ImportFromT1Modal({ onClose }: ImportFromT1ModalProps) {
  const interviewees              = useT1Store((s) => s.interviewees)
  const { stakeholders, addStakeholder } = useT2Store()
  const engagementId              = useEngagementStore((s) => s.activeEngagementId)

  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [done, setDone]           = useState(false)
  const [importCount, setImportCount] = useState(0)

  // Nombres ya presentes en T2 (comparación case-insensitive)
  const existingNames = new Set(
    stakeholders.map((s) => s.name.trim().toLowerCase())
  )

  const alreadyInT2 = (name: string) => existingNames.has(name.trim().toLowerCase())

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    const available = interviewees.filter((i) => !alreadyInT2(i.name)).map((i) => i.id)
    setSelected(new Set(available))
  }

  async function handleImport() {
    setImporting(true)

    const toImport = interviewees.filter(
      (i) => selected.has(i.id) && !alreadyInT2(i.name)
    )

    for (const person of toImport) {
      const archetype: ArchetypeCode = person.type === 'it' ? 'especialista' : 'decisor'
      const department  = person.type === 'it' ? 'IT / Tecnología' : 'Sin asignar'

      await addStakeholder(
        {
          name:       person.name,
          role:       person.role,
          department,
          archetype,
          resistance: 'media',
          notes:      'Importado desde T1 — Madurez Radar',
          manualOverride: false,
        },
        engagementId,
      )
    }

    setImportCount(toImport.length)
    setImporting(false)
    setDone(true)
  }

  const availableCount = interviewees.filter((i) => !alreadyInT2(i.name)).length
  const selectedCount  = [...selected].filter(
    (id) => !alreadyInT2(interviewees.find((i) => i.id === id)?.name ?? '')
  ).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-gray-950 rounded-3xl shadow-2xl
        border border-border dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-7 py-5 border-b border-border dark:border-white/8">
          <div className="flex-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">
              T1 → T2
            </p>
            <h2 className="text-base font-semibold text-lean-black dark:text-gray-100">
              Importar entrevistados desde T1
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Las personas del Madurez Radar pasan como stakeholders. Arquetipo y resistencia se asignan por defecto — edítalos tras importar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0
              text-text-subtle hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {!done ? (
          <>
            {/* Acciones rápidas */}
            {availableCount > 0 && (
              <div className="flex items-center gap-3 px-7 py-3 border-b border-border dark:border-white/8
                bg-gray-50 dark:bg-gray-900/50">
                <span className="text-[10px] text-text-subtle">
                  {availableCount} entrevistado{availableCount !== 1 ? 's' : ''} disponibles
                </span>
                <button
                  onClick={selectAll}
                  className="text-[10px] font-semibold text-navy dark:text-warm-100 hover:underline"
                >
                  Seleccionar todos
                </button>
                {selected.size > 0 && (
                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-[10px] text-text-muted hover:text-text-default"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            )}

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-7 py-4 flex flex-col gap-2.5">

              {interviewees.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800
                    flex items-center justify-center text-2xl">◎</div>
                  <p className="text-sm font-medium text-text-muted">Sin entrevistados en T1</p>
                  <p className="text-xs text-text-subtle max-w-xs leading-relaxed">
                    Añade entrevistados en el Madurez Radar (T1) primero para importarlos aquí.
                  </p>
                </div>
              )}

              {/* Disponibles */}
              {interviewees
                .filter((i) => !alreadyInT2(i.name))
                .map((person) => {
                  const isSelected  = selected.has(person.id)
                  const archetype   = person.type === 'it' ? 'Especialista' : 'Decisor'
                  const department  = person.type === 'it' ? 'IT / Tecnología' : 'Sin asignar'
                  const typeLabel   = person.type === 'it' ? 'IT' : 'Negocio'
                  const typeBg      = person.type === 'it'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'

                  return (
                    <button
                      key={person.id}
                      onClick={() => toggle(person.id)}
                      className={[
                        'w-full text-left rounded-2xl border px-4 py-3.5 transition-all duration-150',
                        'flex items-start gap-3',
                        isSelected
                          ? 'border-navy/40 bg-navy/5 dark:bg-navy/10 ring-1 ring-navy/20'
                          : 'border-border dark:border-white/8 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-white/14',
                      ].join(' ')}
                    >
                      {/* Checkbox */}
                      <div className={[
                        'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5',
                        isSelected
                          ? 'border-navy bg-navy'
                          : 'border-gray-300 dark:border-gray-600',
                      ].join(' ')}>
                        {isSelected && (
                          <svg viewBox="0 0 10 8" width={10} height={8} fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="text-xs font-bold text-lean-black dark:text-gray-200 leading-tight flex-1">
                            {person.name}
                          </p>
                          <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${typeBg}`}>
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-subtle mt-0.5 mb-2">{person.role}</p>
                        <div className="flex items-center gap-2 flex-wrap text-[9px] text-text-subtle">
                          <span>→ Arquetipo: <strong className="text-text-muted">{archetype}</strong></span>
                          <span>· Dept: <strong className="text-text-muted">{department}</strong></span>
                          <span>· Resistencia: <strong className="text-text-muted">Media</strong></span>
                        </div>
                      </div>
                    </button>
                  )
                })}

              {/* Ya importados */}
              {interviewees.filter((i) => alreadyInT2(i.name)).length > 0 && (
                <>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle
                    mt-4 mb-1 px-1">
                    Ya en T2
                  </p>
                  {interviewees
                    .filter((i) => alreadyInT2(i.name))
                    .map((person) => (
                      <div
                        key={person.id}
                        className="rounded-2xl border border-border dark:border-white/6
                          px-4 py-3 opacity-40 flex items-center gap-3"
                      >
                        <div className="h-4 w-4 rounded border-2 border-success-dark
                          bg-success-dark flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 10 8" width={10} height={8} fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-lean-black dark:text-gray-200 leading-tight">
                            {person.name}
                          </p>
                          <p className="text-[10px] text-text-subtle">{person.role}</p>
                        </div>
                        <span className="text-[9px] font-semibold text-success-dark shrink-0">
                          Ya en T2 ✓
                        </span>
                      </div>
                    ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 px-7 py-4
              border-t border-border dark:border-white/8">
              <p className="text-xs text-text-subtle">
                {selectedCount > 0
                  ? `${selectedCount} persona${selectedCount !== 1 ? 's' : ''} seleccionada${selectedCount !== 1 ? 's' : ''}`
                  : 'Ninguna seleccionada'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted
                    hover:text-text-default hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0 || importing}
                  className={[
                    'px-5 py-2 rounded-xl text-xs font-semibold transition-all',
                    selectedCount > 0 && !importing
                      ? 'bg-navy-metallic text-white hover:bg-navy-metallic-hover shadow-sm'
                      : 'bg-gray-200 dark:bg-gray-700 text-text-muted cursor-not-allowed',
                  ].join(' ')}
                >
                  {importing
                    ? 'Importando…'
                    : `Importar ${selectedCount > 0 ? selectedCount : ''} stakeholder${selectedCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Importación completada */
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-5">
            <div className="h-14 w-14 rounded-3xl bg-success-light flex items-center
              justify-center text-2xl text-success-dark">
              ✓
            </div>
            <div>
              <p className="text-base font-semibold text-lean-black dark:text-gray-100 mb-1">
                {importCount} stakeholder{importCount !== 1 ? 's' : ''} importado{importCount !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-text-muted leading-relaxed max-w-sm">
                Aparecen en la matriz con arquetipo y resistencia por defecto.
                Edita cada perfil para ajustar el arquetipo real y nivel de resistencia.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-navy-metallic text-white
                hover:bg-navy-metallic-hover transition-colors shadow-sm"
            >
              Ver la Stakeholder Matrix
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

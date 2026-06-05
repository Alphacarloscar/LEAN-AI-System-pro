// ============================================================
// T2 — ImportFromT1Modal
//
// Lista los entrevistados del store de T1 y permite seleccionar
// cuáles importar como stakeholders en T2.
//
// Mapeo automático:
//   name, role          → directo desde T1
//   type 'it'           → archetype 'reticente', dept 'IT / Tecnología'
//   type 'business'     → archetype 'decisor',      dept 'Sin asignar'
//   resistance          → 'media' (neutro — ajustar tras importar)
//   department          → sobrescrito si el consultor edita en T2
//   notes               → 'Importado desde T1 — Madurez Radar'
//   manualOverride      → false
//
// Entrevistados ya presentes en T2 (por nombre) → deshabilitados.
// ============================================================

import { useState }                       from 'react'
import { useT1Store }                     from '@/modules/T1_MaturityRadar/store'
import { useT2Store }                     from '../store'
import { useEngagementStore }             from '@/modules/Engagement/store'
import type { ArchetypeCode }             from '../types'
import { Modal, Button, Badge }           from '@shared/design-system/components'

// Colores de categoría IT/Negocio (data-driven — inline style, sin variante DS)
const TYPE_BADGE_STYLE: Record<'it' | 'business', React.CSSProperties> = {
  it:       { backgroundColor: '#e0e7ff', color: '#3730a3' },
  business: { backgroundColor: '#d1fae5', color: '#065f46' },
}

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

  // Clave nombre+cargo para detectar duplicados: dos personas con el mismo nombre
  // pero distinto cargo (ej. Pilar CTO vs Pilar RRHH) son personas distintas.
  const existingKeys = new Set(
    stakeholders.map((s) => `${s.name.trim().toLowerCase()}::${s.role.trim().toLowerCase()}`)
  )

  const alreadyInT2 = (name: string, role: string) =>
    existingKeys.has(`${name.trim().toLowerCase()}::${role.trim().toLowerCase()}`)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    const available = interviewees.filter((i) => !alreadyInT2(i.name, i.role)).map((i) => i.id)
    setSelected(new Set(available))
  }

  function handleImport() {
    setImporting(true)

    const toImport = interviewees.filter(
      (i) => selected.has(i.id) && !alreadyInT2(i.name, i.role)
    )

    // El optimistic update de addStakeholder es síncrono — la UI se actualiza
    // de inmediato. La sync a Supabase ocurre en background (fire-and-forget).
    // No bloqueamos el modal esperando cada insert individual.
    toImport.forEach((person) => {
      const archetype: ArchetypeCode = person.type === 'it' ? 'reticente' : 'decisor'
      // Usa el departamento capturado en T1; fallback sólo si está vacío (entrevistados legacy)
      const department = person.department || (person.type === 'it' ? 'IT / Tecnología' : 'Sin asignar')

      addStakeholder(
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
      ).catch((err) => console.error('[ImportFromT1] addStakeholder:', err))
    })

    setImportCount(toImport.length)
    setImporting(false)
    setDone(true)
  }

  const availableCount = interviewees.filter((i) => !alreadyInT2(i.name, i.role)).length
  const selectedCount  = [...selected].filter((id) => {
    const person = interviewees.find((i) => i.id === id)
    return person ? !alreadyInT2(person.name, person.role) : false
  }).length

  const footerEl = !done ? (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-text-subtle">
        {selectedCount > 0
          ? `${selectedCount} persona${selectedCount !== 1 ? 's' : ''} seleccionada${selectedCount !== 1 ? 's' : ''}`
          : 'Ninguna seleccionada'}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={selectedCount === 0 || importing}
          onClick={handleImport}
        >
          {importing
            ? 'Importando…'
            : `Importar ${selectedCount > 0 ? selectedCount : ''} stakeholder${selectedCount !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  ) : undefined

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Importar entrevistados desde T1"
      size="xl"
      footer={footerEl}
    >
      {!done ? (
        <div className="space-y-4">
          {/* Descripción */}
          <p className="text-xs text-text-muted leading-relaxed">
            Las personas del Madurez Radar pasan como stakeholders. IT → arquetipo Reticente · Negocio → arquetipo Decisor. El departamento capturado en T1 se transfiere automáticamente.
          </p>

          {/* Acciones rápidas */}
          {availableCount > 0 && (
            <div className="flex items-center gap-3 px-1">
              <span className="text-[10px] text-text-subtle">
                {availableCount} entrevistado{availableCount !== 1 ? 's' : ''} disponibles
              </span>
              <Button variant="link" className="text-[10px]" onClick={selectAll}>
                Seleccionar todos
              </Button>
              {selected.size > 0 && (
                <Button variant="link" className="text-[10px]" onClick={() => setSelected(new Set())}>
                  Limpiar
                </Button>
              )}
            </div>
          )}

          {/* Lista */}
          <div className="flex flex-col gap-2.5">

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
              .filter((i) => !alreadyInT2(i.name, i.role))
              .map((person) => {
                const isSelected  = selected.has(person.id)
                const archetype   = person.type === 'it' ? 'Reticente' : 'Decisor'
                const department  = person.department || (person.type === 'it' ? 'IT / Tecnología' : 'Sin asignar')
                const typeLabel   = person.type === 'it' ? 'IT' : 'Negocio'
                const typeStyle   = TYPE_BADGE_STYLE[person.type as 'it' | 'business'] ?? TYPE_BADGE_STYLE.business

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
                        <Badge
                          shape="pill"
                          size="sm"
                          className="!text-[9px] !font-semibold shrink-0"
                          style={typeStyle}
                        >
                          {typeLabel}
                        </Badge>
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
            {interviewees.filter((i) => alreadyInT2(i.name, i.role)).length > 0 && (
              <>
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle
                  mt-4 mb-1 px-1">
                  Ya en T2
                </p>
                {interviewees
                  .filter((i) => alreadyInT2(i.name, i.role))
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
        </div>
      ) : (
        /* Importación completada */
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-5">
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
          <Button variant="primary" onClick={onClose}>
            Ver la Stakeholder Matrix
          </Button>
        </div>
      )}
    </Modal>
  )
}

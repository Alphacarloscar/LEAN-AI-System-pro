// ============================================================
// MergePersonsModal — Fusionar personas del equipo del proyecto
//
// Flujo: elegir persona "principal" (se conserva) y persona
// "sustituible" (se elimina tras repuntar sus referencias
// reales en T1/T2/T3/T9). Operación atómica en backend
// (merge_company_persons) — si falla, no se aplica ningún
// cambio y se muestra un modal de error descriptivo.
// ============================================================

import { useState } from 'react'
import { useCompanyPersonStore, type CompanyPerson } from '../useCompanyPersonStore'
import { Modal, Button, Select } from '@shared/design-system/components'
import type { SelectOption } from '@shared/design-system/components'

interface MergePersonsModalProps {
  companyId: string | null
  persons:   CompanyPerson[]
  onClose:   () => void
}

export function MergePersonsModal({ companyId, persons, onClose }: MergePersonsModalProps) {
  const { mergePersons, isMerging, mergeError, clearMergeError } = useCompanyPersonStore()
  const [principalId, setPrincipalId] = useState('')
  const [replacedId,  setReplacedId]  = useState('')

  const options: SelectOption[] = persons.map((p) => ({
    value: p.id,
    label: `${p.name}${p.role ? ` — ${p.role}` : ''}`,
  }))
  const principalOptions = options.filter((o) => o.value !== replacedId)
  const replacedOptions  = options.filter((o) => o.value !== principalId)

  const canConfirm = !!principalId && !!replacedId && principalId !== replacedId && !isMerging

  async function handleConfirm() {
    if (!companyId) return
    const ok = await mergePersons(companyId, 'company', principalId, replacedId)
    if (ok) onClose()
  }

  if (mergeError) {
    return (
      <Modal open={true} onClose={() => { clearMergeError(); onClose() }} title="No se pudo fusionar" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-danger-dark bg-danger-light px-3 py-2.5 rounded-lg">
            {mergeError}
          </p>
          <p className="text-xs text-text-muted dark:text-warm-400">
            No se ha aplicado ningún cambio. Las personas de la empresa siguen igual que antes de intentar la fusión.
          </p>
          <Button variant="primary" size="sm" fullWidth onClick={() => { clearMergeError(); onClose() }}>
            Entendido
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={true} onClose={onClose} title="Fusionar personas" size="sm">
      <div className="space-y-4">
        <p className="text-xs text-text-muted dark:text-warm-400">
          Selecciona la persona principal (se conserva) y la persona a sustituir (se elimina).
          Todas las referencias de la persona sustituida en T1, T2, T3 y T9 pasarán a la principal.
        </p>

        <Select
          label="Persona principal (se conserva)"
          placeholder="Selecciona una persona"
          options={principalOptions}
          value={principalId}
          onChange={(e) => setPrincipalId(e.target.value)}
        />

        <Select
          label="Persona a sustituir (se elimina)"
          placeholder="Selecciona una persona"
          options={replacedOptions}
          value={replacedId}
          onChange={(e) => setReplacedId(e.target.value)}
        />

        {principalId && replacedId && (
          <p className="text-xs text-warning-dark bg-warning-light px-3 py-2 rounded-lg">
            Esta acción no se puede deshacer. La persona sustituida se eliminará del equipo.
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onClose} disabled={isMerging}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
            loading={isMerging}
          >
            Fusionar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

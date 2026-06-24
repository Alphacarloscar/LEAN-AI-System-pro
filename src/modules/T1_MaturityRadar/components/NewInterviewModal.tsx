// ============================================================
// NewInterviewModal — Modal to add a new interviewee to T1
// ============================================================

import { useState } from 'react'
import { Modal, Button, FormField, SegmentedControl } from '@/shared/design-system/components'
import { TOTAL_SUBDIMENSIONS } from '../constants'

export interface NewIntervieweeForm {
  name:       string
  role:       string
  type:       'it' | 'business'
  department: string
}

interface NewInterviewModalProps {
  onClose:     () => void
  onSubmit:    (form: NewIntervieweeForm) => Promise<void>
  departments: { name: string }[]
}

export function NewInterviewModal({ onClose, onSubmit, departments }: NewInterviewModalProps) {
  const [form, setForm]             = useState<NewIntervieweeForm>({
    name:       '',
    role:       '',
    type:       'business',
    department: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const canSubmit =
    form.name.trim().length > 0 &&
    form.role.trim().length > 0 &&
    form.department.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="Nueva entrevista" size="sm">
      <p className="text-[11px] text-text-subtle -mt-1 mb-3">
        Añade un nuevo entrevistado al assessment en curso
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">

        <FormField
          id="new-interviewee-name"
          label="Nombre"
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ej. Javier Morales"
          required
        />

        <FormField
          id="new-interviewee-role"
          label="Cargo"
          type="text"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          placeholder="Ej. CIO, Head of Digital, COO…"
          required
        />

        {/* Tipo IT / Negocio */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
            Perfil
          </span>
          <SegmentedControl
            aria-label="Perfil del entrevistado"
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v as 'it' | 'business' }))}
            options={[
              { value: 'it',       label: 'IT / Tecnología', activeColor: '#2A2822' },
              { value: 'business', label: 'Negocio / Ops',   activeColor: '#5FAF8A' },
            ]}
          />
        </div>

        {/* Departamento */}
        {departments.length > 0 ? (
          <div className="space-y-1.5">
            <label
              htmlFor="new-interviewee-dept"
              className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle"
            >
              Departamento <span className="text-danger-dark" aria-hidden="true">*</span>
            </label>
            <select
              id="new-interviewee-dept"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className={[
                'w-full px-3 py-2 rounded-lg text-sm text-lean-black dark:text-gray-100',
                'bg-gray-50 dark:bg-gray-800 border border-border',
                'focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40',
                'transition-all duration-150',
              ].join(' ')}
            >
              <option value="">Selecciona un departamento…</option>
              {departments.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <FormField
            id="new-interviewee-dept"
            label="Departamento"
            type="text"
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="Ej. Finanzas, Tecnología, RRHH…"
            required
          />
        )}

        <p className="text-[11px] text-text-subtle px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border/60">
          Se crearán <span className="font-medium text-text-muted">{TOTAL_SUBDIMENSIONS} subdimensiones</span> en blanco para este entrevistado. Puntúalas en la sesión.
        </p>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            loading={submitting}
            className="flex-1"
          >
            Crear entrevista
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import { Modal, Button } from '@shared/design-system/components'

interface UnsavedChangesModalProps {
  open:      boolean
  onCancel:  () => void
  onDiscard: () => void
  /** Optional message describing what will be lost */
  message?:  string
  /** If provided, shows a third "Save and continue" button */
  onSave?:   () => void
  savingLabel?: string
  isSaving?:    boolean
}

export function UnsavedChangesModal({
  open,
  onCancel,
  onDiscard,
  message,
  onSave,
  savingLabel = 'Guardando…',
  isSaving    = false,
}: UnsavedChangesModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Cambios sin guardar"
      size="sm"
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Seguir editando
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onDiscard}>
              Descartar cambios
            </Button>
            {onSave && (
              <Button
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? savingLabel : 'Guardar y continuar'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <div className="h-7 w-7 rounded-lg bg-warm-100 dark:bg-warm-700 flex items-center justify-center">
            <svg
              width="14" height="14" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              className="text-warm-500 dark:text-warm-300"
            >
              <path d="M8 2L14 13H2L8 2Z" />
              <path d="M8 6v3.5M8 11v.5" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          {message ?? 'Tienes cambios sin guardar que se perderán si continúas.'}
          {' '}¿Qué quieres hacer?
        </p>
      </div>
    </Modal>
  )
}

// ============================================================
// ImpactWarningDialog — Reusable confirmation for destructive actions
//
// Used for deleting departments/persons with impact summaries.
// Built from DS primitives (Modal + Button).
// ============================================================

import React from 'react'
import { Modal, Button, Alert } from '@/shared/design-system/components'

export interface ImpactWarningDialogProps {
  isOpen: boolean
  title: string
  impactDescription: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export const ImpactWarningDialog: React.FC<ImpactWarningDialogProps> = ({
  isOpen,
  title,
  impactDescription,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      title={title}
      size="md"
      closeOnOverlay={!isLoading}
    >
      <div className="space-y-4">
        <Alert variant="warning" className="text-sm">
          {impactDescription}
        </Alert>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={isLoading}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

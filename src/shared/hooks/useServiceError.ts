import { useCallback, createElement } from 'react'
import { useToast } from '@shared/design-system/components'
import { ServiceErrorToast } from '@shared/design-system/components/ServiceErrorToast'

// ─────────────────────────────────────────────────────────────
// useServiceError — dispara un ServiceErrorToast persistente
// desde cualquier store o componente, sin importar Supabase directamente.
//
// Uso:
//   const { notifyError } = useServiceError()
//   notifyError(err)
//   notifyError(err, 'No se pudo guardar la empresa')
// ─────────────────────────────────────────────────────────────

export interface UseServiceErrorReturn {
  /** Muestra un ServiceErrorToast persistente con el error técnico y mensaje opcional. */
  notifyError: (error: unknown, customMessage?: string) => void
}

export function useServiceError(): UseServiceErrorReturn {
  const { addNode, remove } = useToast()

  const notifyError = useCallback((error: unknown, customMessage?: string) => {
    const toastIdRef = { current: '' }

    const node = createElement(ServiceErrorToast, {
      message: customMessage,
      error,
      onClose: () => remove(toastIdRef.current),
    })

    toastIdRef.current = addNode(node)
  }, [addNode, remove])

  return { notifyError }
}

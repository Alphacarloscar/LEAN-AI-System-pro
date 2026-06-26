import { useEffect } from 'react'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'

/**
 * Sincroniza el estado "sucio" de una vista con el store global de cambios sin guardar.
 * El EngagementSelector y el AppSidebar leen ese store para interceptar la navegación.
 *
 * Uso en una vista:
 *   useUnsavedGuard(isDirty)      // isDirty viene del estado del formulario local
 *
 * Al desmontar la vista, limpia automáticamente el flag para no bloquear la navegación.
 *
 * @param isDirty - booleano que refleja si la vista tiene cambios pendientes de guardar
 * @param source  - etiqueta opcional para trazar qué módulo activó el guard (útil para debugging)
 */
export function useUnsavedGuard(isDirty: boolean, source = 'view'): void {
  const setDirty   = useUnsavedChanges((s) => s.setDirty)
  const clearDirty = useUnsavedChanges((s) => s.clearDirty)

  useEffect(() => {
    if (isDirty) {
      setDirty(source)
    } else {
      clearDirty()
    }
  }, [isDirty, source, setDirty, clearDirty])

  // Limpieza al desmontar: garantiza que salir del módulo nunca deja el flag activo
  useEffect(() => {
    return () => { clearDirty() }
  // clearDirty es estable (referencia Zustand), solo se ejecuta al desmontar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

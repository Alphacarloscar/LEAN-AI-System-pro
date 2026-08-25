import { useEffect, useState } from 'react'
import { useEngagementStore } from '@/modules/Engagement/store'
import { createClient } from '@supabase/supabase-js'

/**
 * Framework control loaded from governance_domains.framework_controls table.
 * Represents a domain-specific regulatory or methodological control (e.g., AI Act risk levels).
 */
interface FrameworkControl {
  control_id: string
  label: string
  category: string | null
}

/**
 * useDomainFramework — Carga controles de framework desde BD parametrizados por dominio.
 *
 * Fase 5 ADR-029: Los labels de frameworks regulatorios (AI Act, etc.) se leen de BD
 * según el domain_id del proyecto activo. Fallback a control_id si no hay datos en BD.
 *
 * Uso en componentes:
 *   const { getLabel } = useDomainFramework()
 *   <span>{getLabel('ai_act_dashboard')}</span>  // → "Dashboard AI Act" (desde BD)
 *
 * Resiliencia:
 * - Si no hay domainId (proyecto sin dominio asignado): devuelve control_id como label
 * - Si BD falla: devuelve control_id como label (fallback)
 * - Si control_id no existe en BD: devuelve control_id sin transformar
 */
export function useDomainFramework() {
  const projects = useEngagementStore((state) => state.projects)
  const activeId = useEngagementStore((state) => state.activeEngagementId)

  const [controls, setControls] = useState<FrameworkControl[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Extraer domainId del proyecto activo
  const domainId = projects.find((p) => p.id === activeId)?.domain_id

  // Cargar controles al cambiar domainId o activeId
  useEffect(() => {
    if (!domainId) {
      setControls([])
      setError(null)
      return
    }

    const loadControls = async () => {
      setLoading(true)
      setError(null)
      try {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL || '',
          import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        )
        const { data, error: queryError } = await supabase
          .from('framework_controls')
          .select('control_id, label, category')
          .eq('domain_id', domainId)
          .eq('is_active', true)

        if (queryError) {
          console.warn('[useDomainFramework] Query error:', queryError.message)
          setControls([])
          setError(queryError)
          return
        }

        setControls((data as FrameworkControl[]) || [])
        setError(null)
      } catch (err) {
        console.error('[useDomainFramework] Exception:', err)
        setControls([])
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    loadControls()
  }, [domainId])

  /**
   * Obtener label de un control por su ID.
   * Fallback: si no existe en BD, devuelve el controlId tal cual.
   */
  const getLabel = (controlId: string): string => {
    const control = controls.find((c) => c.control_id === controlId)
    if (control?.label) {
      return control.label
    }
    // Fallback: devolver el controlId si no hay datos en BD
    return controlId
  }

  /**
   * Obtener un control completo por ID (con label + category).
   */
  const getControl = (controlId: string): FrameworkControl | null => {
    return controls.find((c) => c.control_id === controlId) || null
  }

  return {
    controls,
    loading,
    error,
    domainId,
    getLabel,
    getControl,
  }
}

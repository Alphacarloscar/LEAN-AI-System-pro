import { useEffect, useState } from 'react'
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
 * useDomainFramework — Carga controles de framework desde BD (single-domain ai_adoption).
 *
 * ADR-029 reversal: Projects ya no tienen domain_id. Siempre usa 'ai_adoption'.
 * Los labels de frameworks regulatorios (AI Act, etc.) se leen de BD para ese dominio.
 *
 * Uso en componentes:
 *   const { getLabel } = useDomainFramework()
 *   <span>{getLabel('ai_act_dashboard')}</span>  // → "Dashboard AI Act" (desde BD)
 *
 * Resiliencia:
 * - Si BD falla: devuelve control_id como label (fallback)
 * - Si control_id no existe en BD: devuelve control_id sin transformar
 */
export function useDomainFramework() {
  const [controls, setControls] = useState<FrameworkControl[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Dominio fijo: ai_adoption
  const domainSlug = 'ai_adoption'

  // Cargar controles del dominio ai_adoption
  useEffect(() => {

    const loadControls = async () => {
      setLoading(true)
      setError(null)
      try {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL || '',
          import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        )
        // Obtener ID del dominio ai_adoption
        const { data: domainData, error: domainError } = await supabase
          .from('governance_domains')
          .select('id')
          .eq('slug', domainSlug)
          .single()

        if (domainError || !domainData) {
          console.warn('[useDomainFramework] No se encontró dominio:', domainSlug)
          setControls([])
          setError(domainError || new Error('Domain not found'))
          return
        }

        const { data, error: queryError } = await supabase
          .from('framework_controls')
          .select('control_id, label, category')
          .eq('domain_id', domainData.id)
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
  }, [domainSlug])

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
    getLabel,
    getControl,
  }
}

// ============================================================
// usePolicyGeneration — Hook de generación LLM de Política IA
//
// Llama a la Edge Function ai-recommend con tool='t6_policy'
// y persiste el resultado en el store de T6.
//
// Diseño:
//   - Trigger manual (botón "Generar política con IA").
//   - Sin auto-fetch: el consultor controla cuándo regenerar.
//   - En caso de error devuelve mensaje descriptivo sin romper la UI.
//   - La política generada persiste en localStorage via T6 store.
// ============================================================

import { useState, useCallback }      from 'react'
import { supabase }                    from '@/lib/supabase'
import { useT6Store }                  from '@/modules/T6_RiskGovernance/store'
import type { GeneratedPolicyContent } from '@/modules/T6_RiskGovernance/types'

// ── Tipos de contexto que necesita la generación ──────────────

export interface PolicyGenerationContext {
  company: {
    name:        string
    sector:      string
    tamano:      string
    objetivo:    string
    horizonte:   string
    ecosistema:  string
    restricciones: string
    areas:       string[]
  }
  aiActRisk: {
    total:         number
    prohibido:     number
    alto:          number
    limitado:      number
    minimo:        number
    sinClasificar: number
    highRiskCases: Array<{ name: string; department: string }>
  }
  useCases: {
    total:  number
    go:     number
    piloto: number
  }
  activeDomains: string[]
}

// ── Return type ───────────────────────────────────────────────

interface UsePolicyGenerationReturn {
  generate:    (context: PolicyGenerationContext, engagementId: string | null) => Promise<void>
  isGenerating: boolean
  error:        string | null
  clearError:   () => void
}

// ── Hook ─────────────────────────────────────────────────────

export function usePolicyGeneration(): UsePolicyGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const { saveGeneratedPolicy } = useT6Store()

  const generate = useCallback(async (
    context:      PolicyGenerationContext,
    engagementId: string | null,
  ) => {
    if (!engagementId) {
      setError('Necesitas un engagement activo para generar la política.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'ai-recommend',
        { body: { tool: 't6_policy', context, engagementId } },
      )

      if (fnError) {
        throw new Error(fnError.message ?? 'Error al llamar a la Edge Function')
      }

      if (result?.error) {
        throw new Error(result.error)
      }

      const policy = result?.data as GeneratedPolicyContent | null
      if (!policy) throw new Error('La Edge Function no devolvió contenido de política.')

      // Añadir metadatos de generación
      saveGeneratedPolicy({
        ...policy,
        generatedAt: new Date().toISOString(),
        sector:      context.company.sector,
        tamano:      context.company.tamano,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      console.error('[usePolicyGeneration]', err)
    } finally {
      setIsGenerating(false)
    }
  }, [saveGeneratedPolicy])

  const clearError = useCallback(() => setError(null), [])

  return { generate, isGenerating, error, clearError }
}

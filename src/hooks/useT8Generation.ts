// ============================================================
// useT8Generation — Hook de generación LLM del Communication Map
//
// Llama a la Edge Function ai-recommend con tool='t8_comms'
// y persiste el resultado en el store de T8.
//
// Diseño:
//   - Trigger manual (botón "Generar con IA").
//   - Sin auto-fetch: el consultor controla cuándo regenerar.
//   - En caso de error devuelve mensaje descriptivo sin romper la UI.
//   - El contenido generado persiste en localStorage via T8 store.
// ============================================================

import { useState, useCallback }    from 'react'
import { supabase }                  from '@/lib/supabase'
import { useT8Store }                from '@/modules/T8_CommunicationMap/store'
import type { GeneratedT8Content }   from '@/modules/T8_CommunicationMap/types'

// ── Return type ───────────────────────────────────────────────

interface UseT8GenerationReturn {
  generate:     (context: Record<string, unknown>, engagementId: string | null) => Promise<void>
  isGenerating: boolean
  error:        string | null
  clearError:   () => void
}

// ── Hook ─────────────────────────────────────────────────────

export function useT8Generation(): UseT8GenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const { saveGeneratedContent } = useT8Store()

  const generate = useCallback(async (
    context:      Record<string, unknown>,
    engagementId: string | null,
  ) => {
    if (!engagementId) {
      setError('Necesitas un engagement activo para generar el plan de comunicación.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // 90s: Haiku responde en <10s pero dejamos margen para cold starts y picos de carga
      const TIMEOUT_MS = 90_000

      const invokePromise = supabase.functions.invoke(
        'ai-recommend',
        { body: { tool: 't8_comms', context, engagementId } },
      )

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('La generación tardó demasiado (>90s). Inténtalo de nuevo.')), TIMEOUT_MS)
      )

      const { data: result, error: fnError } = await Promise.race([invokePromise, timeoutPromise])

      if (fnError) {
        throw new Error(fnError.message ?? 'Error al llamar a la Edge Function')
      }

      if (result?.error) {
        throw new Error(result.error)
      }

      const content = result?.data as GeneratedT8Content | null
      if (!content || !Array.isArray(content.archetypeMessages) || content.archetypeMessages.length === 0) {
        throw new Error('La Edge Function no devolvió mensajes por arquetipo válidos.')
      }

      saveGeneratedContent({
        ...content,
        generatedAt: new Date().toISOString(),
      }, engagementId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      console.error('[useT8Generation]', err)
    } finally {
      setIsGenerating(false)
    }
  }, [saveGeneratedContent])

  const clearError = useCallback(() => setError(null), [])

  return { generate, isGenerating, error, clearError }
}

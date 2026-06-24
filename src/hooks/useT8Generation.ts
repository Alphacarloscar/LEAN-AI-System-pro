import { useCallback }                  from 'react'
import { useT8Store }                    from '@/modules/T8_CommunicationMap/store'
import type { GeneratedT8Content }       from '@/modules/T8_CommunicationMap/types'
import { useEdgeFunctionInvoke }         from './useEdgeFunctionInvoke'

interface UseT8GenerationReturn {
  generate:     (context: Record<string, unknown>, engagementId: string | null) => Promise<void>
  isGenerating: boolean
  error:        string | null
  clearError:   () => void
}

export function useT8Generation(): UseT8GenerationReturn {
  const { saveGeneratedContent, setPersistence } = useT8Store()

  const onSuccess = useCallback((
    content:      GeneratedT8Content,
    engagementId: string,
  ) => {
    saveGeneratedContent({ ...content, generatedAt: new Date().toISOString() }, engagementId)
  }, [saveGeneratedContent])

  const onPersistence = useCallback((p: { saved: boolean; error?: string } | undefined) => {
    if (p?.saved === false) setPersistence('error', p.error ?? 'Error desconocido al guardar en la nube.')
    else setPersistence('saved')
  }, [setPersistence])

  const { invoke, isGenerating, error, clearError } = useEdgeFunctionInvoke<
    Record<string, unknown>,
    GeneratedT8Content
  >({
    tool:                't8_comms',
    timeoutMs:           90_000,
    noEngagementMessage: 'Necesitas un engagement activo para generar el plan de comunicación.',
    logPrefix:           '[useT8Generation]',
    validate: (data) => {
      const content = data as GeneratedT8Content | null
      if (!content || !Array.isArray(content.archetypeMessages) || content.archetypeMessages.length === 0) {
        throw new Error('La Edge Function no devolvió mensajes por arquetipo válidos.')
      }
      return content
    },
    onSuccess,
    onPersistence,
  })

  const generate = useCallback(
    (context: Record<string, unknown>, engagementId: string | null) =>
      invoke(context, engagementId),
    [invoke],
  )

  return { generate, isGenerating, error, clearError }
}

import { useState, useCallback } from 'react'
import { supabase }               from '@/lib/supabase'
import { reportError }            from '@/lib/reportError'

export interface EdgeFunctionPersistence {
  saved:  boolean
  error?: string
}

export interface UseEdgeFunctionInvokeOptions<TContext, TResult> {
  tool:                string
  timeoutMs?:          number
  noEngagementMessage: string
  /** Debe lanzar Error si el payload no es válido. */
  validate:            (data: unknown) => TResult
  onSuccess:           (result: TResult, engagementId: string, context: TContext) => void
  onPersistence?:      (persistence: EdgeFunctionPersistence | undefined) => void
  logPrefix?:          string
}

export type EdgeFunctionState = 'idle' | 'pending' | 'success' | 'error'

export interface UseEdgeFunctionInvokeReturn<TContext> {
  invoke:       (context: TContext, engagementId: string | null) => Promise<void>
  isGenerating: boolean
  state:        EdgeFunctionState
  error:        string | null
  clearError:   () => void
}

export function useEdgeFunctionInvoke<TContext, TResult>(
  options: UseEdgeFunctionInvokeOptions<TContext, TResult>,
): UseEdgeFunctionInvokeReturn<TContext> {
  const {
    tool,
    timeoutMs          = 90_000,
    noEngagementMessage,
    validate,
    onSuccess,
    onPersistence,
    logPrefix          = `[useEdgeFunctionInvoke:${tool}]`,
  } = options

  const [isGenerating, setIsGenerating] = useState(false)
  const [state,        setState]        = useState<EdgeFunctionState>('idle')
  const [error,        setError]        = useState<string | null>(null)

  const invoke = useCallback(async (
    context:      TContext,
    engagementId: string | null,
  ) => {
    if (!engagementId) {
      setError(noEngagementMessage)
      setState('error')
      return
    }

    setIsGenerating(true)
    setState('pending')
    setError(null)

    try {
      const invokePromise = supabase.functions.invoke(
        'ai-recommend',
        { body: { tool, context, engagementId } },
      )

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('La generación tardó demasiado. Inténtalo de nuevo.')),
          timeoutMs,
        ),
      )

      const { data: result, error: fnError } = await Promise.race([invokePromise, timeoutPromise])

      if (fnError) {
        const isGeneric = fnError.message?.includes('non-2xx')
        throw new Error(isGeneric
          ? 'El servidor tardó demasiado o encontró un error. Inténtalo de nuevo.'
          : (fnError.message ?? 'Error al llamar a la Edge Function'),
        )
      }

      if (result?.error) throw new Error(result.error)

      const validated = validate(result?.data)
      onSuccess(validated, engagementId, context)
      setState('success')

      if (onPersistence) {
        onPersistence(result?.persistence as EdgeFunctionPersistence | undefined)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      setState('error')
      reportError(logPrefix, err)
    } finally {
      setIsGenerating(false)
    }
  }, [tool, timeoutMs, noEngagementMessage, validate, onSuccess, onPersistence, logPrefix])

  const clearError = useCallback(() => {
    setError(null)
    setState('idle')
  }, [])

  return { invoke, isGenerating, state, error, clearError }
}

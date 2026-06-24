import { useCallback }                     from 'react'
import { useT6Store }                       from '@/modules/T6_RiskGovernance/store'
import type { GeneratedPolicyContent }      from '@/modules/T6_RiskGovernance/types'
import { useEdgeFunctionInvoke }            from './useEdgeFunctionInvoke'

export interface PolicyGenerationContext {
  company: {
    name:          string
    sector:        string
    tamano:        string
    objetivo:      string
    horizonte:     string
    ecosistema:    string
    restricciones: string
    areas:         string[]
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

interface UsePolicyGenerationReturn {
  generate:     (context: PolicyGenerationContext, engagementId: string | null) => Promise<void>
  isGenerating: boolean
  error:        string | null
  clearError:   () => void
}

export function usePolicyGeneration(): UsePolicyGenerationReturn {
  const { saveGeneratedPolicy, setPersistence } = useT6Store()

  const onSuccess = useCallback((
    policy:       GeneratedPolicyContent,
    _engagementId: string,
    context:      PolicyGenerationContext,
  ) => {
    saveGeneratedPolicy({
      ...policy,
      generatedAt: new Date().toISOString(),
      sector:      context.company.sector,
      tamano:      context.company.tamano,
    })
  }, [saveGeneratedPolicy])

  const onPersistence = useCallback((p: { saved: boolean; error?: string } | undefined) => {
    if (p?.saved === false) setPersistence('error', p.error ?? 'Error desconocido al guardar en la nube.')
    else setPersistence('saved')
  }, [setPersistence])

  const { invoke, isGenerating, error, clearError } = useEdgeFunctionInvoke<
    PolicyGenerationContext,
    GeneratedPolicyContent
  >({
    tool:                't6_policy',
    noEngagementMessage: 'Necesitas un engagement activo para generar la política.',
    logPrefix:           '[usePolicyGeneration]',
    validate: (data) => {
      const policy = data as GeneratedPolicyContent | null
      if (!policy) throw new Error('La Edge Function no devolvió contenido de política.')
      return policy
    },
    onSuccess,
    onPersistence,
  })

  const generate = useCallback(
    (context: PolicyGenerationContext, engagementId: string | null) =>
      invoke(context, engagementId),
    [invoke],
  )

  return { generate, isGenerating, error, clearError }
}

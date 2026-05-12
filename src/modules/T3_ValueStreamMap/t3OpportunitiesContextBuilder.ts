// ============================================================
// T3 — Context builder para recomendaciones IA personalizadas
//
// Construye el objeto de contexto que recibe la Edge Function
// ai-recommend con tool='t3_opportunities'.
//
// Señales clave para la LLM:
//   process.stages[].system → herramientas ya en uso (más valiosa)
//   company.techEcosystem   → ecosistema dominante
//   process.department      → función de negocio
//   process.orgReadiness    → calibra complejidad
//   maturityScore           → madurez IA global de la empresa
// ============================================================

import type { ValueStream }  from './types'
import type { CompanyProfile } from '@/modules/CompanyProfile/types'

export interface T3OpportunitiesContext {
  process: {
    name:             string
    department:       string
    aiCategory:       string
    orgReadiness:     string
    description?:     string
    opportunityScore?: number
    stages: Array<{
      name:        string
      system?:     string
      description?: string
    }>
  }
  company: {
    sector:          string
    size:            string
    techEcosystem:   string
    mainAIObjective: string
  }
  maturityScore?: number
}

/**
 * Construye el contexto para la Edge Function 't3_opportunities'.
 *
 * @param process       Proceso a analizar (de T3 store)
 * @param profile       Perfil de empresa (de CompanyProfile store)
 * @param maturityScore Score global T1 (0–4). Undefined si T1 no completado.
 */
export function buildT3OpportunitiesContext(
  process:       ValueStream,
  profile:       CompanyProfile,
  maturityScore?: number,
): T3OpportunitiesContext {
  return {
    process: {
      name:             process.name,
      department:       process.department,
      aiCategory:       process.aiCategory,
      orgReadiness:     process.orgReadiness,
      description:      process.description,
      opportunityScore: process.interview?.opportunityScore,
      stages: (process.stages ?? []).map((s) => ({
        name:    s.name,
        system:  s.system,
      })),
    },
    company: {
      sector:          profile.sector          || 'No especificado',
      size:            profile.tamanoEmpresa   || 'No especificado',
      techEcosystem:   profile.ecosistemaTecnologico  || 'No especificado',
      mainAIObjective: profile.objetivoPrincipalIA    || 'No especificado',
    },
    maturityScore,
  }
}

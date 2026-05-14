// ============================================================
// T2 Context Builder
//
// Ensambla el objeto de contexto que se envía a la Edge Function
// ai-recommend para el tool T2.
//
// Analiza el mapa de stakeholders y extrae:
//   - Resumen de composición (por arquetipo, por resistencia)
//   - Stakeholders críticos (riesgo alto para el proyecto)
//   - Cobertura del mapa (arquetipos sin representar, sponsor)
// ============================================================

import type { Stakeholder, ArchetypeCode, ResistanceLevel } from './types'
import { ARCHETYPE_CONFIG }                                  from './constants'
import type { CompanyProfile }                               from '@/modules/CompanyProfile/types'

// ── Tipos de contexto ─────────────────────────────────────────

export interface T2RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
    valueHorizon:    string
  }
  stakeholders: {
    total:               number
    withInterview:       number
    withManualOverride:  number
    byArchetype: {
      archetype:      ArchetypeCode
      label:          string
      count:          number
      avgResistance:  string
    }[]
    byResistance: {
      level: ResistanceLevel
      count: number
    }[]
    critical: {
      name:          string
      role:          string
      department:    string
      archetype:     string
      resistance:    ResistanceLevel
      hasInterview:  boolean
      manualOverride: boolean
    }[]
  }
  coverage: {
    hasSponsor:             boolean
    hasCritic:              boolean
    missingArchetypes:      string[]
    departmentsRepresented: string[]
  }
}

// ── Helper: resistencia media como texto ──────────────────────

const RESISTANCE_WEIGHT: Record<ResistanceLevel, number> = { baja: 1, media: 2, alta: 3 }
const RESISTANCE_LABEL:  Record<number, string>          = { 1: 'baja', 2: 'media', 3: 'alta' }

function avgResistanceLabel(stakeholders: Stakeholder[]): string {
  if (stakeholders.length === 0) return 'media'
  const avg = stakeholders.reduce((sum, s) => sum + RESISTANCE_WEIGHT[s.resistance], 0) / stakeholders.length
  return RESISTANCE_LABEL[Math.round(avg)] ?? 'media'
}

// ── Builder ───────────────────────────────────────────────────

export function buildT2RecommendationContext(
  stakeholders: Stakeholder[],
  profile:      CompanyProfile,
): T2RecommendationContext {

  // ── Por arquetipo ──
  const archetypeCodes: ArchetypeCode[] = ['decisor', 'ambassador', 'adoptador', 'critico', 'reticente']

  const byArchetype = archetypeCodes
    .map((archetype) => {
      const group = stakeholders.filter((s) => s.archetype === archetype)
      return {
        archetype,
        label:        (ARCHETYPE_CONFIG[archetype] ?? ARCHETYPE_CONFIG.adoptador).label,
        count:        group.length,
        avgResistance: avgResistanceLabel(group),
      }
    })
    .filter((a) => a.count > 0)

  // ── Por nivel de resistencia ──
  const resistanceLevels: ResistanceLevel[] = ['alta', 'media', 'baja']
  const byResistance = resistanceLevels
    .map((level) => ({
      level,
      count: stakeholders.filter((s) => s.resistance === level).length,
    }))
    .filter((r) => r.count > 0)

  // ── Stakeholders críticos ──
  // Criterio: resistencia alta, o arquetipo 'critico', o decisor con resistencia media/alta
  const critical = stakeholders
    .filter((s) =>
      s.resistance === 'alta' ||
      s.archetype  === 'critico' ||
      (s.archetype === 'decisor' && s.resistance !== 'baja')
    )
    .map((s) => ({
      name:          s.name,
      role:          s.role,
      department:    s.department,
      archetype:     (ARCHETYPE_CONFIG[s.archetype] ?? ARCHETYPE_CONFIG.adoptador).label,
      resistance:    s.resistance,
      hasInterview:  !!s.interview,
      manualOverride: !!s.manualOverride,
    }))

  // ── Cobertura ──
  const presentArchetypes = new Set(stakeholders.map((s) => s.archetype))
  const missingArchetypes = archetypeCodes
    .filter((a) => !presentArchetypes.has(a))
    .map((a) => (ARCHETYPE_CONFIG[a] ?? ARCHETYPE_CONFIG.adoptador).label)

  // Sponsor = decisor con resistencia baja (o ambassador con baja)
  const hasSponsor = stakeholders.some(
    (s) => (s.archetype === 'decisor' || s.archetype === 'ambassador') && s.resistance === 'baja'
  )

  const hasCritic = stakeholders.some((s) => s.archetype === 'critico')

  const departmentsRepresented = [...new Set(stakeholders.map((s) => s.department))]

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
      valueHorizon:    profile.horizonteEsperadoValor,
    },
    stakeholders: {
      total:              stakeholders.length,
      withInterview:      stakeholders.filter((s) => !!s.interview).length,
      withManualOverride: stakeholders.filter((s) => !!s.manualOverride).length,
      byArchetype,
      byResistance,
      critical,
    },
    coverage: {
      hasSponsor,
      hasCritic,
      missingArchetypes,
      departmentsRepresented,
    },
  }
}

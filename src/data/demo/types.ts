// ============================================================
// LEAN AI System — Tipos del sistema de datos demo
//
// Arquitectura: fixtures estáticos tipados contra los mismos
// tipos que usan los componentes UI. Cuando VITE_DEMO_MODE=true,
// el demoAdapter devuelve estos fixtures en lugar de llamar a
// Supabase. La coincidencia de tipos garantiza cero divergencia.
//
// Sprint 1 — creado para demos con prospects (Javier+Susana y cold leads)
// ============================================================

import type { LeanPhase }        from '@/shared/components/PhaseRoadmap'
import type { RadarDimension }   from '@/shared/components/charts/LeanRadarChart'
import type { MetricHeroProps }  from '@/shared/components/MetricHero'

// ── Identificadores de patrón ──────────────────────────────────

/**
 * Los 5 patrones de gestión que usa L.E.A.N. para segmentar demos.
 * No son verticales de industria — son patrones de disfunción
 * transversales a cualquier sector.
 */
export type DemoPattern =
  | 'data-visibility'    // Visibilidad del dato — IA activa pero sin métricas de ROI
  | 'slow-decisions'     // Toma de decisión lenta — procesos de aprobación IA eternos
  | 'vendor-sprawl'      // Vendor sprawl — compra departamental sin coordinación
  | 'change-resistance'  // Resistencia al cambio — la tecnología puede, la cultura no
  | 'pilot-chaos'        // Gestión de pilotos — experimentos sin metodología ni gobierno

// ── Perfil de empresa ficticia ────────────────────────────────

export interface DemoCompanyProfile {
  /** Nombre de empresa ficticio pero creíble */
  name:       string
  industry:   string
  employees:  number
  country:    string
  /** Contexto de negocio en 1-2 frases — humaniza la empresa */
  context:    string
}

// ── Narrativa por patrón ──────────────────────────────────────

export interface DemoNarrative {
  /**
   * 1 frase gancho para abrir la demo.
   * Debe generar reconocimiento inmediato en el comprador.
   * Ejemplo: "Tenéis 7 pilotos en marcha y ninguno llegará a producción este año."
   */
  hook:         string
  /**
   * El problema articulado desde la perspectiva del cliente.
   * 2-3 frases. Nunca habla de la solución.
   */
  problem:      string
  /**
   * Qué hace L.E.A.N. que no puedes hacer sin él.
   * Diferencial demostrable, no declarado.
   */
  unlock:       string
  /**
   * Dato cuantificable del dolor — el número que duele.
   * Opcional pero muy efectivo en demos.
   */
  proofPoint?:  string
}

// ── Quick Win Preview — output simulado ───────────────────────

/**
 * Fila de una tabla de Licence Waste Report (QW4).
 * Representa una categoría de herramienta IA con contratos duplicados.
 */
export interface QwLicenceItem {
  /** Categoría de herramienta IA */
  category:     string
  /** Número de contratos activos */
  contracts:    number
  /** Departamentos comprando independientemente */
  departments:  number
  /** Gasto duplicado estimado en €/año */
  annualWaste:  number
  /** Nivel de riesgo de la situación */
  risk:         'low' | 'medium' | 'high'
  /** Ejemplos de herramientas concretas */
  examples:     string[]
}

/**
 * Preview simulado de un Quick Win.
 * Se usa en la demo para mostrar un output real antes de ejecutar
 * el sprint completo. Actúa como "prueba social" de la herramienta.
 */
export interface QuickWinPreview {
  /** Código del quick win, ej. 'QW4' */
  qwCode:         string
  /** Título del entregable */
  title:          string
  /** Subtítulo de contexto */
  subtitle:       string
  /** Valor total estimado en texto, ej. "€185K/año" */
  totalValue?:    string
  /** Descripción del impacto — frase ejecutiva */
  impactSummary?: string
  /** Items para QW4-type (Licence Waste Reports) */
  licenceItems?:  QwLicenceItem[]
}

// ── Escenario demo completo ───────────────────────────────────

/**
 * Un DemoScenario es la representación completa de un engagement
 * ficticio diseñado para resonar con un patrón de dolor específico.
 *
 * Todos los campos usan los mismos tipos que los componentes UI,
 * por lo que se pueden pasar directamente sin conversión.
 */
export interface DemoScenario {
  /** Identificador único del patrón */
  id:             DemoPattern

  /** Nombre del patrón para UI (ej. "Vendor Sprawl") */
  label:          string

  /** Tagline de 1 frase del patrón */
  tagline:        string

  /** Empresa ficticia que protagoniza el escenario */
  company:        DemoCompanyProfile

  /**
   * Datos del radar T1 (AI Readiness Assessment).
   * 8 dimensiones: Estrategia, Datos, Tecnología, Talento,
   * Procesos, Cultura, Gobernanza, Liderazgo.
   * Cada patrón tiene una "firma" única reconocible visualmente.
   */
  t1Radar:        RadarDimension[]

  /**
   * Métricas hero para el panel ejecutivo.
   * Tipadas como MetricHeroProps → se pasan directamente
   * a <MetricHeroGrid metrics={...} />
   */
  heroMetrics:    MetricHeroProps[]

  /**
   * Fases del Metro Map con sus herramientas y estados.
   * Representa dónde está este cliente ficticio en su sprint L.E.A.N.
   * Tipado como LeanPhase[] → se pasa directamente a <PhaseRoadmap />
   */
  phases:         LeanPhase[]

  /** Narrativa de la demo para usar en presentación */
  narrative:      DemoNarrative

  /**
   * Preview del Quick Win más relevante para este patrón.
   * Opcional: no todos los patrones tienen QW preview en Sprint 1.
   */
  quickWinPreview?: QuickWinPreview

  /**
   * Código del quick win principal de este patrón, ej. 'QW4'
   * Para resaltar en la UI durante la demo.
   */
  primaryQw:      string

  /**
   * Herramientas más relevantes para este patrón.
   * Se usan para destacarlas en el Metro Map durante la demo.
   */
  keyTools:       string[]
}

// ============================================================
// T5 — Zustand store con persist
//
// Demo data: Industrias Nexus S.A. — 6 dominios evaluados.
// Sprint 3+: leer/escribir desde Supabase.
// ============================================================

import { create }   from 'zustand'
import { persist }  from 'zustand/middleware'
import type { T5Canvas, T5DomainAssessment, T5DomainCode, T5DomainScores } from './types'
import {
  computeT5DomainScore,
  computeT5Recommendation,
  computeMaturityLevel,
  computeActivationSequence,
} from './constants'

// ── Helper ────────────────────────────────────────────────────

function mkDomain(
  domainCode: T5DomainCode,
  scores: T5DomainScores,
  governance: {
    suggestedOwner:       string
    primaryKPI:           string
    activationConditions: string[]
    governanceNotes?:     string
  },
  useCaseCount: number,
): T5DomainAssessment {
  return {
    domainCode,
    scores,
    priorityScore:  computeT5DomainScore(scores),
    recommendation: computeT5Recommendation(scores),
    ...governance,
    useCaseCount,
    assessedAt: new Date('2026-04-20').toISOString(),
  }
}

// ── Demo data ─────────────────────────────────────────────────

const DEMO_DOMAINS: Record<T5DomainCode, T5DomainAssessment> = {

  automatizacion_rpa: mkDomain(
    'automatizacion_rpa',
    { businessValue: 65, technicalReady: 75, orgReadiness: 60, riskLevel: 20 },
    {
      suggestedOwner:       'Head of Digital Operations / IT Operations',
      primaryKPI:           'Horas de trabajo manual eliminadas por semana',
      activationConditions: [
        'Inventario de procesos repetitivos documentado (mín. 3 procesos)',
        'Acceso a sistemas fuente confirmado con IT',
        'Sponsor IT designado con presupuesto asignado',
      ],
    },
    1,
  ),

  automatizacion_inteligente: mkDomain(
    'automatizacion_inteligente',
    { businessValue: 85, technicalReady: 65, orgReadiness: 58, riskLevel: 30 },
    {
      suggestedOwner:       'CIO / Head of IT',
      primaryKPI:           'Reducción de tickets L1 sin intervención humana (%)',
      activationConditions: [
        'Dataset de entrenamiento disponible (mín. 6 meses de histórico)',
        'Infraestructura básica de MLOps disponible o contratada',
        'Owner de datos designado por cada dominio de proceso',
      ],
    },
    2,
  ),

  analitica_predictiva: mkDomain(
    'analitica_predictiva',
    { businessValue: 80, technicalReady: 50, orgReadiness: 42, riskLevel: 25 },
    {
      suggestedOwner:       'CDO / Head of Analytics',
      primaryKPI:           'Precisión de predicción vs. baseline histórico (%)',
      activationConditions: [
        'Data warehouse operativo con datos limpios (mín. 2 años)',
        'Equipo de data science disponible o contratado',
        'KPI objetivo definido, medible y con baseline documentado',
        'Buy-in del CFO o COO como sponsor de negocio',
      ],
    },
    2,
  ),

  asistente_ia: mkDomain(
    'asistente_ia',
    { businessValue: 60, technicalReady: 82, orgReadiness: 72, riskLevel: 22 },
    {
      suggestedOwner:       'CTO / Head of Digital Products',
      primaryKPI:           'Reducción de tiempo en tarea asistida por empleado (%)',
      activationConditions: [
        'Política corporativa de uso de IA generativa aprobada',
        'Formación básica al equipo completada (≥80% del target)',
        'Herramienta LLM seleccionada y validada por seguridad y legal',
      ],
    },
    2,
  ),

  optimizacion_proceso: mkDomain(
    'optimizacion_proceso',
    { businessValue: 78, technicalReady: 35, orgReadiness: 32, riskLevel: 28 },
    {
      suggestedOwner:       'COO / Director de Operaciones',
      primaryKPI:           'OEE (Overall Equipment Effectiveness) o equivalente de productividad',
      activationConditions: [
        'Datos de proceso disponibles en tiempo real (sensores, ERP o MES)',
        'Buy-in explícito del COO y mandos medios operacionales',
        'Baseline de KPI operativo documentado y acordado',
        'Capacidad de integración IT/OT evaluada y confirmada',
      ],
      governanceNotes: 'Alta resistencia del COO actual. Requiere evidencia operacional de piloto antes de despliegue en producción.',
    },
    0,
  ),

  'agéntica': mkDomain(
    'agéntica',
    { businessValue: 90, technicalReady: 28, orgReadiness: 25, riskLevel: 70 },
    {
      suggestedOwner:       'CTO + Chief AI Officer (rol a designar)',
      primaryKPI:           'Tareas complejas multi-paso ejecutadas sin supervisión humana (%)',
      activationConditions: [
        'Marco de governance de IA autónoma aprobado por Dirección',
        'Política de supervisión humana (Human-in-the-Loop) definida y documentada',
        'Inventario de riesgos regulatorios (EU AI Act) completado',
        'Infraestructura de orquestación de agentes disponible y testeada',
        'Red team de seguridad IA realizado por tercero independiente',
      ],
      governanceNotes: 'Mayor potencial transformacional a 18-36 meses. EU AI Act puede clasificar sistemas agénticos como riesgo alto — compliance formal requerido antes de despliegue.',
    },
    0,
  ),
}

function buildDemoCanvas(): T5Canvas {
  return {
    id:                 'demo-t5-001',
    companyName:        'Industrias Nexus S.A.',
    createdAt:          new Date('2026-04-20').toISOString(),
    updatedAt:          new Date('2026-04-20').toISOString(),
    domains:            DEMO_DOMAINS,
    maturityLevel:      computeMaturityLevel(DEMO_DOMAINS),
    activationSequence: computeActivationSequence(DEMO_DOMAINS),
  }
}

// ── Store ─────────────────────────────────────────────────────

interface T5Store {
  canvas:             T5Canvas
  updateDomainScores: (code: T5DomainCode, scores: T5DomainScores) => void
  resetCanvas:        () => void
}

export const useT5Store = create<T5Store>()(
  persist(
    (set) => ({
      canvas: buildDemoCanvas(),

      updateDomainScores: (code, scores) =>
        set((state) => {
          const updatedDomains = {
            ...state.canvas.domains,
            [code]: {
              ...state.canvas.domains[code],
              scores,
              priorityScore:  computeT5DomainScore(scores),
              recommendation: computeT5Recommendation(scores),
              assessedAt:     new Date().toISOString(),
            },
          }
          return {
            canvas: {
              ...state.canvas,
              domains:            updatedDomains,
              maturityLevel:      computeMaturityLevel(updatedDomains),
              activationSequence: computeActivationSequence(updatedDomains),
              updatedAt:          new Date().toISOString(),
            },
          }
        }),

      resetCanvas: () => set({ canvas: buildDemoCanvas() }),
    }),
    { name: 'lean-t5-canvas', version: 1 },
  ),
)

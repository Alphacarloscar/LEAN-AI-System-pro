// ============================================================
// T3 — Zustand store con Supabase
//
// Sprint 5: Supabase como fuente de verdad.
// Eliminado: persist middleware (localStorage).
// Añadido: load(engagementId) + mutaciones optimistas con sync.
//
// Modo demo (engagementId = null): estado local sin persistencia.
// Modo real (engagementId presente): Supabase.
//
// Nota: stages se guarda como JSONB dentro del value stream.
// Mutaciones de stages actualizan el campo stages del proceso
// correspondiente en Supabase.
// ============================================================

import { create }                        from 'zustand'
import type { ValueStream, ProcessStage } from './types'
import {
  fetchValueStreams,
  insertValueStream,
  updateValueStreamInDb,
  deleteValueStreamFromDb,
} from '@/services/t3.service'

// ── Demo data — 7 procesos en 5 departamentos ─────────────────

const DEMO_PROCESSES: ValueStream[] = [
  // ── IT / Tecnología ──────────────────────────────────────────
  {
    id:               'demo-vs-001',
    name:             'Triaje y resolución de incidencias TI',
    department:       'IT / Tecnología',
    owner:            'Marcos Ibáñez',
    ownerRole:        'CIO',
    description:      'Proceso de recepción, clasificación, priorización y resolución de incidencias y solicitudes de servicio TI.',
    phase:            'piloto',
    aiCategory:       'automatizacion_inteligente',
    orgReadiness:     'alta',
    opportunityLevel: 'critica',
    notes:            'Proceso con mayor volumen del departamento. 150+ tickets/semana. 40% resolución L1 podría automatizarse completamente.',
    createdAt:        new Date('2026-04-10').toISOString(),
    stages: [
      { id: 'demo-s001-001', name: 'Recepción incidencia', department: 'IT / Tecnología', responsible: 'Portal ITSM', system: 'ServiceDesk Pro', procTimeHours: 0.08, waitTimeHours: 0.25, handoffs: 0, valueContribution: 'alta' },
      { id: 'demo-s001-002', name: 'Clasificación L1', department: 'IT / Tecnología', responsible: 'Técnico L1', system: 'ServiceDesk Pro', procTimeHours: 0.25, waitTimeHours: 1.5, handoffs: 1, valueContribution: 'media' },
      { id: 'demo-s001-003', name: 'Resolución L1', department: 'IT / Tecnología', responsible: 'Técnico L1', system: 'ServiceDesk Pro', procTimeHours: 0.75, waitTimeHours: 4, handoffs: 0, valueContribution: 'alta' },
      { id: 'demo-s001-004', name: 'Escalado a L2', department: 'IT / Tecnología', responsible: 'Gestor L2', system: 'JIRA', procTimeHours: 0.25, waitTimeHours: 8, handoffs: 2, valueContribution: 'baja', notes: 'Punto crítico — representa el 50%+ del ciclo total.' },
      { id: 'demo-s001-005', name: 'Cierre y registro', department: 'IT / Tecnología', responsible: 'Técnico L1', system: 'ServiceDesk Pro', procTimeHours: 0.17, waitTimeHours: 0.5, handoffs: 1, valueContribution: 'media' },
    ],
    interview: { answers: { 1: 'A', 2: 'A', 3: 'A', 4: 'B', 5: 'A', 6: 'A' }, automationScore: 4.00, dataScore: 4.00, volumeScore: 4.00, impactScore: 3.14, readinessScore: 4.00, opportunityScore: 3.83, aiCategory: 'automatizacion_inteligente', orgReadiness: 'alta', computedAt: new Date('2026-04-10').toISOString() },
    opportunities: [
      { id: 'demo-vs-001-opp-0', title: 'Automatización end-to-end del flujo de tickets L1', description: 'Orquestación del proceso completo con IA.', effort: 'medio', impact: 'alto', status: 'validada' },
      { id: 'demo-vs-001-opp-1', title: 'Clasificación y routing inteligente', description: 'Clasificación automática de incidencias.', effort: 'bajo', impact: 'alto', status: 'validada' },
      { id: 'demo-vs-001-opp-2', title: 'Base de conocimiento auto-actualizada', description: 'IA que extrae soluciones de tickets resueltos.', effort: 'bajo', impact: 'medio', status: 'sugerida' },
    ],
  },
  {
    id:               'demo-vs-002',
    name:             'Evaluación y onboarding de proveedores IA',
    department:       'IT / Tecnología',
    owner:            'Claudia Ros',
    ownerRole:        'Head of IT Operations',
    description:      'Proceso de evaluación técnica, due diligence y onboarding de nuevos proveedores de herramientas IA.',
    phase:            'validacion',
    aiCategory:       'analitica_predictiva',
    orgReadiness:     'media',
    opportunityLevel: 'media',
    notes:            'Proceso semi-estructurado con alta variabilidad.',
    createdAt:        new Date('2026-04-10').toISOString(),
    interview: { answers: { 1: 'C', 2: 'B', 3: 'C', 4: 'A', 5: 'B', 6: 'B' }, automationScore: 1.60, dataScore: 2.50, volumeScore: 1.50, impactScore: 3.43, readinessScore: 2.50, opportunityScore: 2.17, aiCategory: 'analitica_predictiva', orgReadiness: 'media', computedAt: new Date('2026-04-10').toISOString() },
    opportunities: [
      { id: 'demo-vs-002-opp-0', title: 'Scoring automatizado de proveedores', description: 'Modelo de evaluación de proveedores.', effort: 'alto', impact: 'alto', status: 'sugerida' },
      { id: 'demo-vs-002-opp-1', title: 'Extracción inteligente de contratos', description: 'IA que extrae cláusulas clave de contratos.', effort: 'medio', impact: 'alto', status: 'sugerida' },
    ],
  },
  // ── Operaciones ───────────────────────────────────────────────
  {
    id:               'demo-vs-003',
    name:             'Control de calidad en producción',
    department:       'Operaciones',
    owner:            'Javier Morales',
    ownerRole:        'COO',
    description:      'Inspección, registro y gestión de desviaciones de calidad en líneas de producción.',
    phase:            'validacion',
    aiCategory:       'analitica_predictiva',
    orgReadiness:     'baja',
    opportunityLevel: 'alta',
    notes:            'Gran volumen de datos de sensores. Javier (COO) exige evidencia operacional antes de piloto.',
    createdAt:        new Date('2026-04-11').toISOString(),
    interview: { answers: { 1: 'B', 2: 'A', 3: 'A', 4: 'A', 5: 'C', 6: 'B' }, automationScore: 2.40, dataScore: 4.00, volumeScore: 4.00, impactScore: 3.43, readinessScore: 1.50, opportunityScore: 3.33, aiCategory: 'analitica_predictiva', orgReadiness: 'baja', computedAt: new Date('2026-04-11').toISOString() },
    opportunities: [
      { id: 'demo-vs-003-opp-0', title: 'Detección predictiva de defectos', description: 'Modelo predictivo de defectos en tiempo real.', effort: 'alto', impact: 'alto', status: 'sugerida' },
      { id: 'demo-vs-003-opp-1', title: 'Visión artificial para inspección', description: 'Sistema de visión por computador.', effort: 'alto', impact: 'alto', status: 'sugerida' },
    ],
  },
  // ── Legal / Administración ───────────────────────────────────
  {
    id:               'demo-vs-004',
    name:             'Gestión documental y contratos',
    department:       'Legal / Administración',
    owner:            'Susana Prats',
    ownerRole:        'Head of Digital Ops',
    description:      'Recepción, clasificación, archivo y gestión del ciclo de vida de contratos.',
    phase:            'piloto',
    aiCategory:       'automatizacion_rpa',
    orgReadiness:     'media',
    opportunityLevel: 'alta',
    notes:            'Proceso altamente repetitivo. Susana preocupada por impacto en su equipo.',
    createdAt:        new Date('2026-04-11').toISOString(),
    stages: [
      { id: 'demo-s004-001', name: 'Recepción y entrada', department: 'Legal / Administración', responsible: 'Administrativo', system: 'Email / Escáner', procTimeHours: 0.25, waitTimeHours: 2, handoffs: 0, valueContribution: 'media' },
      { id: 'demo-s004-002', name: 'Clasificación manual', department: 'Legal / Administración', responsible: 'Administrativo', system: 'SharePoint', procTimeHours: 0.5, waitTimeHours: 3, handoffs: 1, valueContribution: 'baja' },
      { id: 'demo-s004-003', name: 'Revisión legal', department: 'Legal / Administración', responsible: 'Abogado interno', system: 'iManage', procTimeHours: 2, waitTimeHours: 24, handoffs: 2, valueContribution: 'alta', notes: 'Cuello de botella principal.' },
      { id: 'demo-s004-004', name: 'Archivo y registro', department: 'Legal / Administración', responsible: 'Administrativo', system: 'SharePoint', procTimeHours: 0.25, waitTimeHours: 1, handoffs: 1, valueContribution: 'media' },
    ],
    interview: { answers: { 1: 'A', 2: 'C', 3: 'B', 4: 'B', 5: 'B', 6: 'A' }, automationScore: 4.00, dataScore: 1.50, volumeScore: 2.50, impactScore: 3.14, readinessScore: 2.50, opportunityScore: 2.90, aiCategory: 'automatizacion_rpa', orgReadiness: 'media', computedAt: new Date('2026-04-11').toISOString() },
    opportunities: [
      { id: 'demo-vs-004-opp-0', title: 'Robot de clasificación documental', description: 'RPA de clasificación automática.', effort: 'bajo', impact: 'medio', status: 'validada' },
      { id: 'demo-vs-004-opp-1', title: 'Extracción inteligente de contratos', description: 'IA que extrae datos clave de contratos.', effort: 'medio', impact: 'alto', status: 'sugerida' },
    ],
  },
  // ── Marketing & Comercial ─────────────────────────────────────
  {
    id:               'demo-vs-005',
    name:             'Generación de contenido de campaña',
    department:       'Marketing & Comercial',
    owner:            'Rafael Molina',
    ownerRole:        'CMO',
    description:      'Creación, revisión y publicación de contenido para campañas digitales.',
    phase:            'estandarizacion',
    aiCategory:       'asistente_ia',
    orgReadiness:     'alta',
    opportunityLevel: 'media',
    notes:            'Rafael ya usa IA para contenido.',
    createdAt:        new Date('2026-04-12').toISOString(),
    interview: { answers: { 1: 'D', 2: 'B', 3: 'B', 4: 'A', 5: 'A', 6: 'B' }, automationScore: 0.40, dataScore: 2.50, volumeScore: 2.50, impactScore: 3.43, readinessScore: 4.00, opportunityScore: 1.95, aiCategory: 'asistente_ia', orgReadiness: 'alta', computedAt: new Date('2026-04-12').toISOString() },
    opportunities: [
      { id: 'demo-vs-005-opp-0', title: 'Copilot de contenido', description: 'Asistente IA integrado en el flujo creativo.', effort: 'bajo', impact: 'medio', status: 'validada' },
    ],
  },
  // ── Finanzas ──────────────────────────────────────────────────
  {
    id:               'demo-vs-006',
    name:             'Conciliación financiera mensual',
    department:       'Finanzas',
    owner:            'Pedro Saura',
    ownerRole:        'CFO',
    description:      'Proceso de cierre contable mensual: conciliación de cuentas y reporting.',
    phase:            'idea',
    aiCategory:       'automatizacion_inteligente',
    orgReadiness:     'baja',
    opportunityLevel: 'critica',
    notes:            'Pedro (CFO) es crítico. El proceso consume 3 días/mes del equipo financiero.',
    createdAt:        new Date('2026-04-12').toISOString(),
    manualOverride:   true,
    interview: { answers: { 1: 'A', 2: 'A', 3: 'C', 4: 'B', 5: 'D', 6: 'A' }, automationScore: 4.00, dataScore: 4.00, volumeScore: 1.50, impactScore: 3.14, readinessScore: 0.00, opportunityScore: 3.33, aiCategory: 'automatizacion_inteligente', orgReadiness: 'baja', computedAt: new Date('2026-04-12').toISOString() },
    opportunities: [
      { id: 'demo-vs-006-opp-0', title: 'Automatización de conciliación', description: 'Robot de conciliación contable.', effort: 'medio', impact: 'alto', status: 'sugerida' },
    ],
  },
  // ── RRHH ─────────────────────────────────────────────────────
  {
    id:               'demo-vs-007',
    name:             'Criba y scoring de candidatos',
    department:       'RRHH',
    owner:            'Laura Giménez',
    ownerRole:        'Head of Growth',
    description:      'Revisión de CVs, cribado inicial y coordinación de entrevistas.',
    phase:            'validacion',
    aiCategory:       'asistente_ia',
    orgReadiness:     'media',
    opportunityLevel: 'media',
    notes:            'Proceso con alto volumen en picos de contratación.',
    createdAt:        new Date('2026-04-13').toISOString(),
    interview: { answers: { 1: 'C', 2: 'B', 3: 'C', 4: 'B', 5: 'B', 6: 'B' }, automationScore: 1.60, dataScore: 2.50, volumeScore: 1.50, impactScore: 2.57, readinessScore: 2.50, opportunityScore: 2.00, aiCategory: 'asistente_ia', orgReadiness: 'media', computedAt: new Date('2026-04-13').toISOString() },
    opportunities: [
      { id: 'demo-vs-007-opp-0', title: 'Scoring automático de CVs', description: 'IA que evalúa candidatos.', effort: 'bajo', impact: 'medio', status: 'sugerida' },
    ],
  },
]

// ── Store ─────────────────────────────────────────────────────

interface T3Store {
  processes:  ValueStream[]
  isLoading:  boolean

  /** Carga value streams desde Supabase para el engagement activo */
  load: (engagementId: string) => Promise<void>

  /** Inicializa con datos demo (sin engagement activo) */
  initDemo: () => void

  addProcess:    (p: Omit<ValueStream, 'id' | 'createdAt'>, engagementId: string | null) => Promise<void>
  updateProcess: (id: string, updates: Partial<Omit<ValueStream, 'id'>>, engagementId: string | null) => Promise<void>
  removeProcess: (id: string, engagementId: string | null) => Promise<void>

  /** Stage management — modifica stages dentro del proceso y sincroniza */
  addStage:    (processId: string, stage: Omit<ProcessStage, 'id'>, engagementId: string | null) => Promise<void>
  updateStage: (processId: string, stageId: string, updates: Partial<Omit<ProcessStage, 'id'>>, engagementId: string | null) => Promise<void>
  removeStage: (processId: string, stageId: string, engagementId: string | null) => Promise<void>

  reset: () => void
}

export const useT3Store = create<T3Store>()((set, get) => ({
  processes: [],
  isLoading: false,

  // ── load ───────────────────────────────────────────────────
  load: async (engagementId) => {
    set({ isLoading: true })
    try {
      const processes = await fetchValueStreams(engagementId)
      set({ processes, isLoading: false })
    } catch (err) {
      console.error('[T3Store] load:', err)
      set({ isLoading: false })
    }
  },

  // ── initDemo ───────────────────────────────────────────────
  initDemo: () => set({ processes: DEMO_PROCESSES, isLoading: false }),

  // ── addProcess ─────────────────────────────────────────────
  addProcess: async (p, engagementId) => {
    const newProcess: ValueStream = {
      ...p,
      id:        `vs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({ processes: [...state.processes, newProcess] }))

    if (engagementId) {
      try {
        await insertValueStream(newProcess, engagementId)
      } catch (err) {
        console.error('[T3Store] addProcess sync:', err)
        set((state) => ({ processes: state.processes.filter((p) => p.id !== newProcess.id) }))
      }
    }
  },

  // ── updateProcess ──────────────────────────────────────────
  updateProcess: async (id, updates, engagementId) => {
    const prev = get().processes.find((p) => p.id === id)

    set((state) => ({
      processes: state.processes.map((p) => p.id === id ? { ...p, ...updates } : p),
    }))

    if (engagementId) {
      try {
        await updateValueStreamInDb(id, engagementId, updates)
      } catch (err) {
        console.error('[T3Store] updateProcess sync:', err)
        if (prev) set((state) => ({ processes: state.processes.map((p) => p.id === id ? prev : p) }))
      }
    }
  },

  // ── removeProcess ──────────────────────────────────────────
  removeProcess: async (id, engagementId) => {
    const prev = get().processes

    set((state) => ({ processes: state.processes.filter((p) => p.id !== id) }))

    if (engagementId) {
      try {
        await deleteValueStreamFromDb(id, engagementId)
      } catch (err) {
        console.error('[T3Store] removeProcess sync:', err)
        set({ processes: prev })
      }
    }
  },

  // ── addStage ────────────────────────────────────────────────
  addStage: async (processId, stage, engagementId) => {
    const newStage: ProcessStage = {
      ...stage,
      id: `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    }

    let updatedStages: ProcessStage[] = []
    set((state) => {
      const updated = state.processes.map((p) => {
        if (p.id !== processId) return p
        updatedStages = [...(p.stages ?? []), newStage]
        return { ...p, stages: updatedStages }
      })
      return { processes: updated }
    })

    if (engagementId) {
      try {
        await updateValueStreamInDb(processId, engagementId, { stages: updatedStages })
      } catch (err) {
        console.error('[T3Store] addStage sync:', err)
      }
    }
  },

  // ── updateStage ─────────────────────────────────────────────
  updateStage: async (processId, stageId, updates, engagementId) => {
    let updatedStages: ProcessStage[] = []
    set((state) => {
      const updated = state.processes.map((p) => {
        if (p.id !== processId) return p
        updatedStages = (p.stages ?? []).map((s) => s.id !== stageId ? s : { ...s, ...updates })
        return { ...p, stages: updatedStages }
      })
      return { processes: updated }
    })

    if (engagementId) {
      try {
        await updateValueStreamInDb(processId, engagementId, { stages: updatedStages })
      } catch (err) {
        console.error('[T3Store] updateStage sync:', err)
      }
    }
  },

  // ── removeStage ─────────────────────────────────────────────
  removeStage: async (processId, stageId, engagementId) => {
    let updatedStages: ProcessStage[] = []
    set((state) => {
      const updated = state.processes.map((p) => {
        if (p.id !== processId) return p
        updatedStages = (p.stages ?? []).filter((s) => s.id !== stageId)
        return { ...p, stages: updatedStages }
      })
      return { processes: updated }
    })

    if (engagementId) {
      try {
        await updateValueStreamInDb(processId, engagementId, { stages: updatedStages })
      } catch (err) {
        console.error('[T3Store] removeStage sync:', err)
      }
    }
  },

  // ── reset ──────────────────────────────────────────────────
  reset: () => set({ processes: [], isLoading: false }),
}))

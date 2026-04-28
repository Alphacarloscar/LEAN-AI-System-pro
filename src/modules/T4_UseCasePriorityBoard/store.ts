// ============================================================
// T4 — Zustand store con Supabase sync (Sprint 3)
//
// Patrón: optimistic update + async sync a Supabase.
// El ID se genera localmente (UUID v4-style) → UI sin latencia.
// La escritura a Supabase es fire-and-forget con log de error.
//
// loadEngagement(id): hidrata el store desde Supabase.
//   Si no hay datos → carga demo data (primer engagement nuevo).
//
// Demo data (8 casos): solo se usa si no hay datos en Supabase.
// ============================================================

import { create }               from 'zustand'
import { persist }              from 'zustand/middleware'
import { computePriorityScore } from './constants'
import type { UseCase, AIActClassification } from './types'
import { computeAIActRisk }     from './types'
import {
  fetchUseCases,
  insertUseCase,
  updateUseCaseInDb,
  deleteUseCaseFromDb,
  bulkInsertUseCases,
} from '@/services/t4.service'

// ── Generador de ID local ────────────────────────────────────
function genId(): string {
  return `uc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Demo data — 8 casos (Industrias Nexus S.A.) ──────────────
const s = computePriorityScore

const DEMO_USE_CASES: UseCase[] = [
  {
    id: 'demo-uc-001', name: 'Automatización del triaje de incidencias TI',
    description: 'Clasificación, priorización y resolución automática de tickets L1 mediante IA. Elimina el 40% del volumen manual del Service Desk.',
    department: 'IT / Tecnología', aiCategory: 'automatizacion_inteligente', status: 'go',
    sponsorName: 'Marcos Ibáñez (CIO)', responsibleItData: 'Claudia Ros',
    businessObjective: 'Eficiencia operativa TI — liberar capacidad L1 para tareas de mayor valor',
    importedFromT3: { processId: 'demo-vs-001', processName: 'Triaje y resolución de incidencias TI', opportunityScore: 3.83, aiCategory: 'automatizacion_inteligente' },
    stakeholderScores: [
      { id: 'demo-uc-001-ss-1', stakeholderName: 'Marcos Ibáñez', stakeholderRole: 'CIO', archetypeCode: 'innovador', scores: { kpiImpact: 90, feasibility: 75, aiRisk: 25, dataDependency: 30 }, notes: '150 tickets/semana. ROI muy claro.', scoredAt: new Date('2026-04-15').toISOString() },
      { id: 'demo-uc-001-ss-2', stakeholderName: 'Claudia Ros', stakeholderRole: 'Head of IT Operations', scores: { kpiImpact: 90, feasibility: 80, aiRisk: 20, dataDependency: 30 }, notes: 'El equipo L1 ya pide una solución.', scoredAt: new Date('2026-04-15').toISOString() },
    ],
    scores: { kpiImpact: 90, feasibility: 78, aiRisk: 23, dataDependency: 30 },
    priorityScore: s({ kpiImpact: 90, feasibility: 78, aiRisk: 23, dataDependency: 30 }),
    economics: { kpiPrincipal: 'Reducción MTTR incidencias L1', processHoursPerWeek: 25, headcount: 4, efficiencyGain: 0.55, efficiencyGainMode: 'benchmark', hourlyRate: 45, hourlyRateMode: 'preset', hourlyRatePreset: 'tecnico', implementationCost: 30_000, implementationCostMode: 'benchmark' },
    goNoGo: { decision: 'go', rationale: 'Alto impacto, alta factibilidad, datos disponibles en ITSM. Piloto en 4 semanas.', decidedAt: new Date('2026-04-17').toISOString(), decidedBy: 'Marcos Ibáñez (CIO)' },
    roadmap: { quarter: 'Q2 2026', estimatedDuration: '6 semanas', owner: 'Claudia Ros', nextSteps: 'Conectar ITSM al modelo de clasificación.', dependencies: 'Acceso a API del ITSM.' },
    t1Context: { relevantDimensions: ['Datos y analítica', 'Infraestructura tecnológica'], maturityNotes: 'Madurez en datos (3.4/4) suficiente para arrancar.' },
    t2Context: { championArchetype: 'CIO (innovador proactivo)', blockerArchetypes: [], stakeholderNotes: 'Sin bloqueos identificados.' },
    aiActClassification: { scope: 'operaciones_internas', personImpact: 'no', sensitiveData: false, explainability: 'yes', riskLevel: computeAIActRisk('operaciones_internas', 'no', false, 'yes'), classifiedAt: new Date('2026-04-17').toISOString() },
    notes: 'Primer caso de uso. Genera evidencia interna de ROI.',
    createdAt: new Date('2026-04-14').toISOString(),
  },
  {
    id: 'demo-uc-002', name: 'Scoring automatizado de proveedores IA',
    description: 'Evaluación automática de proveedores de soluciones IA contra criterios técnicos, de seguridad y regulatorios.',
    department: 'IT / Tecnología', aiCategory: 'analitica_predictiva', status: 'no_go',
    sponsorName: 'Marcos Ibáñez (CIO)',
    importedFromT3: { processId: 'demo-vs-002', processName: 'Evaluación y onboarding de proveedores IA', opportunityScore: 2.17, aiCategory: 'analitica_predictiva' },
    stakeholderScores: [{ id: 'demo-uc-002-ss-1', stakeholderName: 'Marcos Ibáñez', stakeholderRole: 'CIO', archetypeCode: 'innovador', scores: { kpiImpact: 35, feasibility: 35, aiRisk: 75, dataDependency: 80 }, notes: 'Datos en silos. Requiere integración previa.', scoredAt: new Date('2026-04-15').toISOString() }],
    scores: { kpiImpact: 35, feasibility: 35, aiRisk: 75, dataDependency: 80 },
    priorityScore: s({ kpiImpact: 35, feasibility: 35, aiRisk: 75, dataDependency: 80 }),
    economics: { kpiPrincipal: 'Tiempo de evaluación de proveedores', processHoursPerWeek: 5, headcount: 2, efficiencyGain: 0.30, efficiencyGainMode: 'benchmark', hourlyRate: 45, hourlyRateMode: 'preset', hourlyRatePreset: 'tecnico', implementationCost: 40_000, implementationCostMode: 'benchmark' },
    goNoGo: { decision: 'no_go', rationale: 'Score insuficiente. Alta dependencia de datos dispersos. Retomar en Q4 2026.', decidedAt: new Date('2026-04-17').toISOString(), decidedBy: 'Marcos Ibáñez (CIO)' },
    roadmap: { quarter: 'Q4 2026', nextSteps: 'Consolidar repositorio documental primero.' },
    notes: 'Descartado. Retomar tras madurar el dato.',
    createdAt: new Date('2026-04-14').toISOString(),
  },
  {
    id: 'demo-uc-003', name: 'Sistema predictivo de calidad en producción',
    description: 'Detección predictiva de defectos en líneas de producción usando sensores y visión artificial.',
    department: 'Operaciones', aiCategory: 'analitica_predictiva', status: 'candidato',
    sponsorName: 'Javier Morales (COO)',
    importedFromT3: { processId: 'demo-vs-003', processName: 'Control de calidad en producción', opportunityScore: 3.33, aiCategory: 'analitica_predictiva' },
    stakeholderScores: [{ id: 'demo-uc-003-ss-1', stakeholderName: 'Javier Morales', stakeholderRole: 'COO', archetypeCode: 'esceptico', scores: { kpiImpact: 85, feasibility: 30, aiRisk: 65, dataDependency: 85 }, notes: 'Impacto enorme pero datos de sensores no integrados.', scoredAt: new Date('2026-04-16').toISOString() }],
    scores: { kpiImpact: 85, feasibility: 30, aiRisk: 65, dataDependency: 85 },
    priorityScore: s({ kpiImpact: 85, feasibility: 30, aiRisk: 65, dataDependency: 85 }),
    economics: { kpiPrincipal: 'OEE y % defectos en línea', processHoursPerWeek: 20, headcount: 6, efficiencyGain: 0.30, efficiencyGainMode: 'benchmark', hourlyRate: 35, hourlyRateMode: 'preset', hourlyRatePreset: 'tecnico', implementationCost: 55_000, implementationCostMode: 'benchmark' },
    notes: 'Alto potencial. El COO exige evidencia. Candidato para Q3 2026.',
    createdAt: new Date('2026-04-14').toISOString(),
  },
  {
    id: 'demo-uc-004', name: 'Gestión documental y contratos inteligente',
    description: 'Clasificación automática y extracción de cláusulas de contratos corporativos.',
    department: 'Legal / Administración', aiCategory: 'automatizacion_rpa', status: 'go',
    sponsorName: 'Susana Prats (Head of Digital Ops)', responsibleItData: 'Marcos Ibáñez',
    businessObjective: 'Reducción de riesgo contractual y eficiencia administrativa',
    importedFromT3: { processId: 'demo-vs-004', processName: 'Gestión documental y contratos', opportunityScore: 2.90, aiCategory: 'automatizacion_rpa' },
    stakeholderScores: [
      { id: 'demo-uc-004-ss-1', stakeholderName: 'Susana Prats', stakeholderRole: 'Head of Digital Ops', scores: { kpiImpact: 60, feasibility: 80, aiRisk: 15, dataDependency: 35 }, notes: 'Si amplifica al equipo, apoyo total.', scoredAt: new Date('2026-04-16').toISOString() },
      { id: 'demo-uc-004-ss-2', stakeholderName: 'Marcos Ibáñez', stakeholderRole: 'CIO', scores: { kpiImpact: 65, feasibility: 90, aiRisk: 10, dataDependency: 30 }, notes: 'Tecnología madura. Podemos desplegar en semanas.', scoredAt: new Date('2026-04-16').toISOString() },
    ],
    scores: { kpiImpact: 63, feasibility: 85, aiRisk: 13, dataDependency: 33 },
    priorityScore: s({ kpiImpact: 63, feasibility: 85, aiRisk: 13, dataDependency: 33 }),
    economics: { kpiPrincipal: 'Tiempo de revisión documental', processHoursPerWeek: 12, headcount: 3, efficiencyGain: 0.70, efficiencyGainMode: 'benchmark', hourlyRate: 25, hourlyRateMode: 'preset', hourlyRatePreset: 'administrativo', implementationCost: 18_000, implementationCostMode: 'benchmark' },
    goNoGo: { decision: 'go', rationale: 'Alta facilidad, riesgo muy bajo, equipo alineado.', decidedAt: new Date('2026-04-17').toISOString(), decidedBy: 'Susana Prats + Marcos Ibáñez' },
    roadmap: { quarter: 'Q2 2026', estimatedDuration: '4 semanas', owner: 'Susana Prats', nextSteps: 'Definir taxonomía documental.', dependencies: 'Acceso a SharePoint.' },
    t2Context: { championArchetype: 'Head of Digital Ops', blockerArchetypes: [], stakeholderNotes: 'Proponer co-piloto vs. automatización total.' },
    aiActClassification: { scope: 'operaciones_internas', personImpact: 'no', sensitiveData: false, explainability: 'yes', riskLevel: computeAIActRisk('operaciones_internas', 'no', false, 'yes'), classifiedAt: new Date('2026-04-17').toISOString() },
    notes: 'Habilita el futuro caso de scoring de proveedores.',
    createdAt: new Date('2026-04-14').toISOString(),
  },
  {
    id: 'demo-uc-005', name: 'Copilot de contenido para equipo de marketing',
    description: 'Asistente IA para generar borradores y adaptar mensajes por audiencia.',
    department: 'Marketing & Comercial', aiCategory: 'asistente_ia', status: 'go',
    sponsorName: 'Rafael Molina (CMO)', responsibleItData: 'Marcos Ibáñez',
    businessObjective: 'Aceleración time-to-market y reducción de costes creativos',
    importedFromT3: { processId: 'demo-vs-005', processName: 'Generación de contenido de campaña', opportunityScore: 1.95, aiCategory: 'asistente_ia' },
    stakeholderScores: [{ id: 'demo-uc-005-ss-1', stakeholderName: 'Rafael Molina', stakeholderRole: 'CMO', archetypeCode: 'innovador', scores: { kpiImpact: 65, feasibility: 95, aiRisk: 15, dataDependency: 10 }, notes: 'El equipo ya usa IA. Podemos arrancar esta semana.', scoredAt: new Date('2026-04-16').toISOString() }],
    scores: { kpiImpact: 65, feasibility: 95, aiRisk: 15, dataDependency: 10 },
    priorityScore: s({ kpiImpact: 65, feasibility: 95, aiRisk: 15, dataDependency: 10 }),
    economics: { kpiPrincipal: 'Tiempo de producción de contenido', processHoursPerWeek: 14, headcount: 3, efficiencyGain: 0.40, efficiencyGainMode: 'benchmark', hourlyRate: 45, hourlyRateMode: 'preset', hourlyRatePreset: 'tecnico', implementationCost: 12_000, implementationCostMode: 'benchmark' },
    goNoGo: { decision: 'go', rationale: 'Máxima facilidad. Riesgo mínimo. Quick win efecto demostrador.', decidedAt: new Date('2026-04-17').toISOString(), decidedBy: 'Rafael Molina (CMO)' },
    roadmap: { quarter: 'Q2 2026', estimatedDuration: '2 semanas', owner: 'Rafael Molina', nextSteps: 'Seleccionar herramienta (Claude, GPT-4o).', dependencies: 'Ninguna.' },
    t2Context: { championArchetype: 'CMO (innovador activo)', blockerArchetypes: [], stakeholderNotes: 'Equipo completo proactivo.' },
    aiActClassification: { scope: 'cliente_marketing', personImpact: 'no', sensitiveData: false, explainability: 'yes', riskLevel: computeAIActRisk('cliente_marketing', 'no', false, 'yes'), classifiedAt: new Date('2026-04-17').toISOString() },
    notes: 'Quick win. Genera evidencia positiva en menos de 2 semanas.',
    createdAt: new Date('2026-04-14').toISOString(),
  },
  {
    id: 'demo-uc-006', name: 'Automatización de conciliación financiera mensual',
    description: 'Robot de conciliación que ejecuta el cierre mensual y detecta discrepancias.',
    department: 'Finanzas', aiCategory: 'automatizacion_inteligente', status: 'priorizado',
    sponsorName: 'Pedro Saura (CFO)', responsibleItData: 'Marcos Ibáñez',
    businessObjective: 'Reducción del ciclo de cierre financiero',
    importedFromT3: { processId: 'demo-vs-006', processName: 'Conciliación financiera mensual', opportunityScore: 3.33, aiCategory: 'automatizacion_inteligente' },
    stakeholderScores: [{ id: 'demo-uc-006-ss-1', stakeholderName: 'Pedro Saura', stakeholderRole: 'CFO', archetypeCode: 'resistente', scores: { kpiImpact: 90, feasibility: 40, aiRisk: 50, dataDependency: 35 }, notes: 'No me fío de que la IA tome decisiones contables sin supervisión.', scoredAt: new Date('2026-04-16').toISOString() }],
    scores: { kpiImpact: 90, feasibility: 40, aiRisk: 50, dataDependency: 35 },
    priorityScore: s({ kpiImpact: 90, feasibility: 40, aiRisk: 50, dataDependency: 35 }),
    economics: { kpiPrincipal: 'Días de ciclo de cierre mensual', processHoursPerWeek: 18, headcount: 2, efficiencyGain: 0.55, efficiencyGainMode: 'benchmark', hourlyRate: 45, hourlyRateMode: 'preset', hourlyRatePreset: 'tecnico', implementationCost: 28_000, implementationCostMode: 'benchmark' },
    notes: 'Pedro (CFO) resistente. La IA debe actuar como asistente, no decisor autónomo.',
    createdAt: new Date('2026-04-14').toISOString(),
  },
  {
    id: 'demo-uc-007', name: 'Scoring automático de candidatos en selección',
    description: 'IA que evalúa CVs contra el perfil buscado y genera un ranking justificado.',
    department: 'RRHH', aiCategory: 'asistente_ia', status: 'priorizado',
    sponsorName: 'Laura Giménez (Head of Growth)', responsibleItData: 'Marcos Ibáñez',
    importedFromT3: { processId: 'demo-vs-007', processName: 'Criba y scoring de candidatos', opportunityScore: 2.00, aiCategory: 'asistente_ia' },
    stakeholderScores: [{ id: 'demo-uc-007-ss-1', stakeholderName: 'Laura Giménez', stakeholderRole: 'Head of Growth', scores: { kpiImpact: 75, feasibility: 70, aiRisk: 40, dataDependency: 55 }, notes: 'En picos: 200+ CVs por posición. Con IA: horas vs. días.', scoredAt: new Date('2026-04-16').toISOString() }],
    scores: { kpiImpact: 75, feasibility: 70, aiRisk: 40, dataDependency: 55 },
    priorityScore: s({ kpiImpact: 75, feasibility: 70, aiRisk: 40, dataDependency: 55 }),
    economics: { kpiPrincipal: 'Tiempo de criba de candidatos', processHoursPerWeek: 10, headcount: 2, efficiencyGain: 0.40, efficiencyGainMode: 'benchmark', hourlyRate: 45, hourlyRateMode: 'preset', hourlyRatePreset: 'tecnico', implementationCost: 12_000, implementationCostMode: 'benchmark' },
    aiActClassification: { scope: 'rrhh', personImpact: 'human_review', sensitiveData: false, explainability: 'yes', riskLevel: computeAIActRisk('rrhh', 'human_review', false, 'yes'), classifiedAt: new Date('2026-04-17').toISOString() },
    notes: 'Laura motivada. Pendiente alinear con DPO para datos RGPD.',
    createdAt: new Date('2026-04-14').toISOString(),
  },
  {
    id: 'demo-uc-008', name: 'Dashboard de inteligencia de demanda comercial',
    description: 'Panel predictivo que anticipa demanda combinando datos de ventas y señales de mercado.',
    department: 'Marketing & Comercial', aiCategory: 'analitica_predictiva', status: 'candidato',
    sponsorName: 'Rafael Molina (CMO)',
    stakeholderScores: [{ id: 'demo-uc-008-ss-1', stakeholderName: 'Rafael Molina', stakeholderRole: 'CMO', scores: { kpiImpact: 75, feasibility: 55, aiRisk: 35, dataDependency: 65 }, notes: 'Datos de ventas en CRM pero no están limpios.', scoredAt: new Date('2026-04-16').toISOString() }],
    scores: { kpiImpact: 75, feasibility: 55, aiRisk: 35, dataDependency: 65 },
    priorityScore: s({ kpiImpact: 75, feasibility: 55, aiRisk: 35, dataDependency: 65 }),
    economics: { kpiPrincipal: 'Precisión de forecast comercial (MAPE)', processHoursPerWeek: 8, headcount: 2, efficiencyGain: 0.30, efficiencyGainMode: 'benchmark', hourlyRate: 45, hourlyRateMode: 'preset', hourlyRatePreset: 'tecnico', implementationCost: 35_000, implementationCostMode: 'benchmark' },
    notes: 'Añadido en taller. Requiere limpieza previa del CRM. Candidato Q3 2026.',
    createdAt: new Date('2026-04-15').toISOString(),
  },
]

// ── Store ─────────────────────────────────────────────────────

interface T4Store {
  useCases:     UseCase[]
  engagementId: string | null
  isLoading:    boolean

  /** Carga casos de uso desde Supabase para el engagement dado */
  loadEngagement: (engagementId: string) => Promise<void>

  /** Crea un caso de uso (local inmediato + sync Supabase) */
  addUseCase: (uc: Omit<UseCase, 'id' | 'createdAt'>) => string

  /** Actualiza un caso de uso (local inmediato + sync Supabase) */
  updateUseCase: (id: string, updates: Partial<Omit<UseCase, 'id'>>) => void

  /** Elimina un caso de uso (local inmediato + sync Supabase) */
  removeUseCase: (id: string) => void

  /** Recalcula el priorityScore tras editar scores */
  recalcScore: (id: string) => void

  /** Guarda la clasificación AI Act */
  updateAIActClassification: (id: string, classification: AIActClassification) => void
}

export const useT4Store = create<T4Store>()(
  persist(
    (set, get) => ({
      useCases:     DEMO_USE_CASES,
      engagementId: null,
      isLoading:    false,

      // ── loadEngagement ──────────────────────────────────────
      loadEngagement: async (engagementId) => {
        set({ isLoading: true, engagementId })
        try {
          const useCases = await fetchUseCases(engagementId)
          if (useCases.length > 0) {
            // Hay datos reales en Supabase → usarlos
            set({ useCases, isLoading: false })
          } else {
            // Primer engagement nuevo → sembrar con demo data
            set({ useCases: DEMO_USE_CASES, isLoading: false })
            // Persistir demo data en Supabase para que el viewer también la vea
            bulkInsertUseCases(DEMO_USE_CASES, engagementId).catch((err) =>
              console.error('[T4] seed demo data:', err)
            )
          }
        } catch (err) {
          console.error('[T4] loadEngagement:', err)
          set({ isLoading: false })
        }
      },

      // ── addUseCase ──────────────────────────────────────────
      addUseCase: (uc) => {
        const id        = genId()
        const createdAt = new Date().toISOString()
        const full: UseCase = { ...uc, id, createdAt }

        set((state) => ({ useCases: [...state.useCases, full] }))

        const { engagementId } = get()
        if (engagementId) {
          insertUseCase(full, engagementId).catch((err) =>
            console.error('[T4] addUseCase sync:', err)
          )
        }
        return id
      },

      // ── updateUseCase ───────────────────────────────────────
      updateUseCase: (id, updates) => {
        set((state) => ({
          useCases: state.useCases.map((uc) =>
            uc.id === id ? { ...uc, ...updates } : uc
          ),
        }))

        const { engagementId } = get()
        if (engagementId) {
          updateUseCaseInDb(id, engagementId, updates).catch((err) =>
            console.error('[T4] updateUseCase sync:', err)
          )
        }
      },

      // ── removeUseCase ───────────────────────────────────────
      removeUseCase: (id) => {
        set((state) => ({
          useCases: state.useCases.filter((uc) => uc.id !== id),
        }))

        const { engagementId } = get()
        if (engagementId) {
          deleteUseCaseFromDb(id, engagementId).catch((err) =>
            console.error('[T4] removeUseCase sync:', err)
          )
        }
      },

      // ── recalcScore ─────────────────────────────────────────
      recalcScore: (id) => {
        const uc = get().useCases.find((u) => u.id === id)
        if (!uc) return
        const newScore = computePriorityScore(uc.scores)
        set((state) => ({
          useCases: state.useCases.map((u) =>
            u.id === id ? { ...u, priorityScore: newScore } : u
          ),
        }))

        const { engagementId } = get()
        if (engagementId) {
          updateUseCaseInDb(id, engagementId, { priorityScore: newScore }).catch((err) =>
            console.error('[T4] recalcScore sync:', err)
          )
        }
      },

      // ── updateAIActClassification ───────────────────────────
      updateAIActClassification: (id, classification) => {
        set((state) => ({
          useCases: state.useCases.map((uc) =>
            uc.id === id ? { ...uc, aiActClassification: classification } : uc
          ),
        }))

        const { engagementId } = get()
        if (engagementId) {
          updateUseCaseInDb(id, engagementId, { aiActClassification: classification }).catch((err) =>
            console.error('[T4] updateAIAct sync:', err)
          )
        }
      },
    }),
    {
      name:    'lean-t4-usecases',
      version: 3,  // bumped: añadido engagementId + Supabase sync
    }
  )
)

// ============================================================
// T4 — Zustand store con persist
//
// Gestiona los casos de uso del engagement activo.
// MVP: datos demo pre-cargados.
// Sprint 3+: leer/escribir desde Supabase tabla `use_cases`.
//
// Demo data: 8 casos de uso (empresa Industrias Nexus S.A.)
// derivados del taller de priorización tras el T3 del engagement.
// Distribución: 3 go, 2 priorizado, 2 candidato, 1 no-go.
// ============================================================

import { create }          from 'zustand'
import { persist }         from 'zustand/middleware'
import { computePriorityScore } from './constants'
import type { UseCase }    from './types'

// ── Demo data — 8 casos de uso priorización ──────────────────
//
// Scoring: kpiImpact 1-5 (mayor=mejor), feasibility 1-5 (mayor=mejor),
//   aiRisk 1-5 (mayor=peor, se invierte), dataDependency 1-5 (mayor=peor, se invierte)
//
// priorityScore = (kpi*0.35 + feas*0.30 + (6-risk)*0.20 + (6-dep)*0.15) / 5 * 100
//   → max=100, min=20
//
// Cuadrante (X=feasibility/5, Y=kpiImpact/5, umbral 0.60):
//   TOP-RIGHT  (implementar ya): TI Triaje (0.80,1.00), Dashboard Demanda (0.60,0.80)
//   TOP-LEFT   (planificar):     Calidad Producción (0.40,1.00), Conciliación (0.40,1.00)
//   BOTTOM-RIGHT (quick win):    Documental (0.80,0.60), Marketing Copilot (1.00,0.60)
//   BOTTOM-LEFT  (revisar):      Scoring Proveedores (0.40,0.40)
//   MID-RIGHT:                   RRHH Scoring (0.80,0.80)

const s = computePriorityScore  // alias

const DEMO_USE_CASES: UseCase[] = [

  // ── IT / Tecnología ──────────────────────────────────────────

  {
    id:          'demo-uc-001',
    name:        'Automatización del triaje de incidencias TI',
    description: 'Clasificación, priorización y resolución automática de tickets L1 mediante IA. Elimina el 40% del volumen manual del Service Desk.',
    department:  'IT / Tecnología',
    aiCategory:  'automatizacion_inteligente',
    status:      'go',
    importedFromT3: {
      processId:        'demo-vs-001',
      processName:      'Triaje y resolución de incidencias TI',
      opportunityScore: 3.83,
      aiCategory:       'automatizacion_inteligente',
    },
    stakeholderScores: [
      {
        id:              'demo-uc-001-ss-1',
        stakeholderName: 'Marcos Ibáñez',
        stakeholderRole: 'CIO',
        archetypeCode:   'innovador',
        scores:          { kpiImpact: 5, feasibility: 4, aiRisk: 2, dataDependency: 2 },
        notes:           '150 tickets/semana. ROI muy claro. Datos disponibles en ITSM.',
        scoredAt:        new Date('2026-04-15').toISOString(),
      },
      {
        id:              'demo-uc-001-ss-2',
        stakeholderName: 'Claudia Ros',
        stakeholderRole: 'Head of IT Operations',
        scores:          { kpiImpact: 5, feasibility: 4, aiRisk: 2, dataDependency: 2 },
        notes:           'El equipo L1 ya pide una solución. Fácil de pilotar.',
        scoredAt:        new Date('2026-04-15').toISOString(),
      },
    ],
    scores:        { kpiImpact: 5, feasibility: 4, aiRisk: 2, dataDependency: 2 },
    priorityScore: s({ kpiImpact: 5, feasibility: 4, aiRisk: 2, dataDependency: 2 }),  // 87.0
    goNoGo: {
      decision:   'go',
      rationale:  'Alto impacto, alta factibilidad, datos disponibles en ITSM. Riesgo IA muy bajo (clasificación objetiva). Piloto en 4 semanas.',
      decidedAt:  new Date('2026-04-17').toISOString(),
      decidedBy:  'Marcos Ibáñez (CIO)',
    },
    roadmap: {
      quarter:           'Q2 2026',
      estimatedDuration: '6 semanas',
      owner:             'Claudia Ros',
      nextSteps:         'Conectar ITSM al modelo de clasificación. Definir categorías L1 automatizables. Configurar escalado automático a L2.',
      dependencies:      'Acceso a API del ITSM. Aprobación de Seguridad TI para el modelo.',
    },
    t1Context: {
      relevantDimensions: ['Datos y analítica', 'Infraestructura tecnológica'],
      maturityNotes:      'Madurez en datos (3.4/4) y en infraestructura (3.2/4) suficiente para arrancar sin inversión previa en plataforma.',
    },
    t2Context: {
      championArchetype: 'CIO (innovador proactivo)',
      blockerArchetypes: [],
      stakeholderNotes:  'El equipo de IT Operations está alineado. Sin bloqueos identificados.',
    },
    notes:     'Primer caso de uso a implementar. Genera evidencia interna de ROI que facilita el resto de la hoja de ruta.',
    createdAt: new Date('2026-04-14').toISOString(),
  },

  {
    id:          'demo-uc-002',
    name:        'Scoring automatizado de proveedores IA',
    description: 'Evaluación automática de proveedores de soluciones IA contra criterios técnicos, de seguridad y regulatorios. Extracción inteligente de contratos.',
    department:  'IT / Tecnología',
    aiCategory:  'analitica_predictiva',
    status:      'no_go',
    importedFromT3: {
      processId:        'demo-vs-002',
      processName:      'Evaluación y onboarding de proveedores IA',
      opportunityScore: 2.17,
      aiCategory:       'analitica_predictiva',
    },
    stakeholderScores: [
      {
        id:              'demo-uc-002-ss-1',
        stakeholderName: 'Marcos Ibáñez',
        stakeholderRole: 'CIO',
        archetypeCode:   'innovador',
        scores:          { kpiImpact: 2, feasibility: 2, aiRisk: 4, dataDependency: 4 },
        notes:           'Proceso muy fragmentado. Datos en silos (emails, Excel, contratos PDF). Requiere trabajo previo de integración.',
        scoredAt:        new Date('2026-04-15').toISOString(),
      },
    ],
    scores:        { kpiImpact: 2, feasibility: 2, aiRisk: 4, dataDependency: 4 },
    priorityScore: s({ kpiImpact: 2, feasibility: 2, aiRisk: 4, dataDependency: 4 }),  // 40.0
    goNoGo: {
      decision:   'no_go',
      rationale:  'Score insuficiente. Alta dependencia de datos dispersos y riesgo regulatorio por tratamiento de contratos con proveedores externos. Retomar en Q4 2026 tras unificación de repositorio documental.',
      decidedAt:  new Date('2026-04-17').toISOString(),
      decidedBy:  'Marcos Ibáñez (CIO)',
    },
    roadmap: {
      quarter:      'Q4 2026',
      nextSteps:    'Primero consolidar repositorio documental (caso de uso T4-UC-003). Retomar evaluación en Q4 2026.',
      dependencies: 'Requiere implementación previa del caso de uso de Gestión Documental.',
    },
    notes:     'Descartado para este sprint. La fragmentación de datos bloquea cualquier implementación IA de calidad. Retomar tras madurar el dato.',
    createdAt: new Date('2026-04-14').toISOString(),
  },

  // ── Operaciones ───────────────────────────────────────────────

  {
    id:          'demo-uc-003',
    name:        'Sistema predictivo de calidad en producción',
    description: 'Detección predictiva de defectos en líneas de producción usando sensores y visión artificial. Reduce retrabajo y aumenta OEE.',
    department:  'Operaciones',
    aiCategory:  'analitica_predictiva',
    status:      'candidato',
    importedFromT3: {
      processId:        'demo-vs-003',
      processName:      'Control de calidad en producción',
      opportunityScore: 3.33,
      aiCategory:       'analitica_predictiva',
    },
    stakeholderScores: [
      {
        id:              'demo-uc-003-ss-1',
        stakeholderName: 'Javier Morales',
        stakeholderRole: 'COO',
        archetypeCode:   'esceptico',
        scores:          { kpiImpact: 5, feasibility: 2, aiRisk: 4, dataDependency: 5 },
        notes:           'El impacto es enorme pero los datos de sensores no están integrados. Necesito pruebas piloto antes de comprometer más.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 5, feasibility: 2, aiRisk: 4, dataDependency: 5 },
    priorityScore: s({ kpiImpact: 5, feasibility: 2, aiRisk: 4, dataDependency: 5 }),  // 55.0
    notes:     'Alto potencial a largo plazo. El COO (Javier) es escéptico y exige evidencia. Candidato para Q3 2026 tras integración de datos de sensores.',
    createdAt: new Date('2026-04-14').toISOString(),
  },

  // ── Legal / Administración ───────────────────────────────────

  {
    id:          'demo-uc-004',
    name:        'Gestión documental y contratos inteligente',
    description: 'Clasificación automática, extracción de cláusulas y gestión del ciclo de vida de contratos corporativos. Elimina la revisión manual de documentos.',
    department:  'Legal / Administración',
    aiCategory:  'automatizacion_rpa',
    status:      'go',
    importedFromT3: {
      processId:        'demo-vs-004',
      processName:      'Gestión documental y contratos',
      opportunityScore: 2.90,
      aiCategory:       'automatizacion_rpa',
    },
    stakeholderScores: [
      {
        id:              'demo-uc-004-ss-1',
        stakeholderName: 'Susana Prats',
        stakeholderRole: 'Head of Digital Ops',
        scores:          { kpiImpact: 3, feasibility: 4, aiRisk: 1, dataDependency: 2 },
        notes:           'Si la IA amplifica al equipo, no reemplaza, apoyo total. Tenemos 5.000+ docs archivados a clasificar.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
      {
        id:              'demo-uc-004-ss-2',
        stakeholderName: 'Marcos Ibáñez',
        stakeholderRole: 'CIO',
        scores:          { kpiImpact: 3, feasibility: 5, aiRisk: 1, dataDependency: 2 },
        notes:           'Tecnología madura. Podemos desplegar en semanas.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 3, feasibility: 4.5, aiRisk: 1, dataDependency: 2 },
    priorityScore: s({ kpiImpact: 3, feasibility: 4.5, aiRisk: 1, dataDependency: 2 }),  // 82.0
    goNoGo: {
      decision:   'go',
      rationale:  'Alta facilidad de implementación, riesgo IA muy bajo, equipo alineado. El impacto en KPI es moderado pero el ROI es inmediato.',
      decidedAt:  new Date('2026-04-17').toISOString(),
      decidedBy:  'Susana Prats + Marcos Ibáñez',
    },
    roadmap: {
      quarter:           'Q2 2026',
      estimatedDuration: '4 semanas',
      owner:             'Susana Prats',
      nextSteps:         'Definir taxonomía documental. Conectar repositorio actual. Configurar extracción de cláusulas para contratos tipo A y B.',
      dependencies:      'Acceso al repositorio documental SharePoint. Aprobación de Compliance para procesamiento de contratos.',
    },
    t2Context: {
      championArchetype: 'Head of Digital Ops (abierta a IA si amplifica equipo)',
      blockerArchetypes: [],
      stakeholderNotes:  'Susana necesita ver demostración de que el equipo conserva el control. Proponer co-piloto vs. automatización total.',
    },
    notes:     'Segundo caso de uso en secuencia. También habilita el futuro caso de scoring de proveedores (demo-uc-002).',
    createdAt: new Date('2026-04-14').toISOString(),
  },

  // ── Marketing & Comercial ─────────────────────────────────────

  {
    id:          'demo-uc-005',
    name:        'Copilot de contenido para equipo de marketing',
    description: 'Asistente IA integrado en el flujo de trabajo del equipo creativo para generar borradores, adaptar mensajes por audiencia y proponer variaciones de contenido.',
    department:  'Marketing & Comercial',
    aiCategory:  'asistente_ia',
    status:      'go',
    importedFromT3: {
      processId:        'demo-vs-005',
      processName:      'Generación de contenido de campaña',
      opportunityScore: 1.95,
      aiCategory:       'asistente_ia',
    },
    stakeholderScores: [
      {
        id:              'demo-uc-005-ss-1',
        stakeholderName: 'Rafael Molina',
        stakeholderRole: 'CMO',
        archetypeCode:   'innovador',
        scores:          { kpiImpact: 3, feasibility: 5, aiRisk: 1, dataDependency: 1 },
        notes:           'El equipo ya usa IA. Queremos un flujo estructurado. Podemos arrancar esta semana.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 3, feasibility: 5, aiRisk: 1, dataDependency: 1 },
    priorityScore: s({ kpiImpact: 3, feasibility: 5, aiRisk: 1, dataDependency: 1 }),  // 86.0
    goNoGo: {
      decision:   'go',
      rationale:  'Máxima facilidad de implementación (equipo ya adoptado). Riesgo mínimo. Quick win con alta probabilidad de éxito y efecto demostrador.',
      decidedAt:  new Date('2026-04-17').toISOString(),
      decidedBy:  'Rafael Molina (CMO)',
    },
    roadmap: {
      quarter:           'Q2 2026',
      estimatedDuration: '2 semanas',
      owner:             'Rafael Molina',
      nextSteps:         'Definir flujo estructurado de generación. Seleccionar herramienta (Claude, GPT-4o). Establecer guías de uso y validación humana.',
      dependencies:      'Ninguna dependencia técnica crítica.',
    },
    t2Context: {
      championArchetype: 'CMO (innovador activo, ya experimenta con IA)',
      blockerArchetypes: [],
      stakeholderNotes:  'El equipo completo de marketing está proactivo. Implementación más rápida del portfolio.',
    },
    notes:     'Quick win con mayor facilidad del portfolio. Genera evidencia positiva interna en menos de 2 semanas.',
    createdAt: new Date('2026-04-14').toISOString(),
  },

  // ── Finanzas ──────────────────────────────────────────────────

  {
    id:          'demo-uc-006',
    name:        'Automatización de conciliación financiera mensual',
    description: 'Robot de conciliación que ejecuta el proceso de cierre mensual, detecta discrepancias y genera el informe ejecutivo automáticamente. Ahorra 3 días/mes del equipo financiero.',
    department:  'Finanzas',
    aiCategory:  'automatizacion_inteligente',
    status:      'priorizado',
    importedFromT3: {
      processId:        'demo-vs-006',
      processName:      'Conciliación financiera mensual',
      opportunityScore: 3.33,
      aiCategory:       'automatizacion_inteligente',
    },
    stakeholderScores: [
      {
        id:              'demo-uc-006-ss-1',
        stakeholderName: 'Pedro Saura',
        stakeholderRole: 'CFO',
        archetypeCode:   'resistente',
        scores:          { kpiImpact: 5, feasibility: 2, aiRisk: 3, dataDependency: 2 },
        notes:           'El ahorro es enorme pero no me fío de que la IA tome decisiones contables sin supervisión. Necesito ver auditoría completa.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 5, feasibility: 2, aiRisk: 3, dataDependency: 2 },
    priorityScore: s({ kpiImpact: 5, feasibility: 2, aiRisk: 3, dataDependency: 2 }),  // 74.0
    notes:     'Pedro (CFO) resistente. La IA debe actuar como asistente de revisión, nunca como decisor autónomo. Priorizado para Q3 tras gestión del stakeholder.',
    createdAt: new Date('2026-04-14').toISOString(),
  },

  // ── RRHH ─────────────────────────────────────────────────────

  {
    id:          'demo-uc-007',
    name:        'Scoring automático de candidatos en procesos de selección',
    description: 'IA que evalúa CVs contra el perfil buscado, genera un ranking con justificación y propone preguntas personalizadas para la entrevista.',
    department:  'RRHH',
    aiCategory:  'asistente_ia',
    status:      'priorizado',
    importedFromT3: {
      processId:        'demo-vs-007',
      processName:      'Criba y scoring de candidatos',
      opportunityScore: 2.00,
      aiCategory:       'asistente_ia',
    },
    stakeholderScores: [
      {
        id:              'demo-uc-007-ss-1',
        stakeholderName: 'Laura Giménez',
        stakeholderRole: 'Head of Growth',
        scores:          { kpiImpact: 4, feasibility: 4, aiRisk: 2, dataDependency: 3 },
        notes:           'En picos de contratación procesamos 200+ CVs por posición. Tiempo de criba: 3 días. Con IA: horas.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 4, feasibility: 4, aiRisk: 2, dataDependency: 3 },
    priorityScore: s({ kpiImpact: 4, feasibility: 4, aiRisk: 2, dataDependency: 3 }),  // 78.0
    notes:     'Laura está muy motivada. Pendiente de alinear con el DPO para gestión de datos de candidatos bajo RGPD antes de confirmar go.',
    createdAt: new Date('2026-04-14').toISOString(),
  },

  // ── Manual (sin origen T3) ────────────────────────────────────

  {
    id:          'demo-uc-008',
    name:        'Dashboard de inteligencia de demanda comercial',
    description: 'Panel predictivo que combina datos históricos de ventas, señales de mercado y estacionalidad para anticipar demanda y apoyar decisiones comerciales.',
    department:  'Marketing & Comercial',
    aiCategory:  'analitica_predictiva',
    status:      'candidato',
    stakeholderScores: [
      {
        id:              'demo-uc-008-ss-1',
        stakeholderName: 'Rafael Molina',
        stakeholderRole: 'CMO',
        scores:          { kpiImpact: 4, feasibility: 3, aiRisk: 2, dataDependency: 3 },
        notes:           'Muy útil para planificación de campañas. Los datos de ventas están en el CRM pero no están limpios.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 4, feasibility: 3, aiRisk: 2, dataDependency: 3 },
    priorityScore: s({ kpiImpact: 4, feasibility: 3, aiRisk: 2, dataDependency: 3 }),  // 74.0
    notes:     'Añadido en el taller por Rafael. No venía de T3. Requiere limpieza previa del CRM. Candidato para Q3 2026.',
    createdAt: new Date('2026-04-15').toISOString(),
  },
]

// ── Store ─────────────────────────────────────────────────────

interface T4Store {
  useCases:       UseCase[]
  addUseCase:     (uc: Omit<UseCase, 'id' | 'createdAt'>) => string
  updateUseCase:  (id: string, updates: Partial<Omit<UseCase, 'id'>>) => void
  removeUseCase:  (id: string) => void
  /** Recalcula el priorityScore de un caso de uso tras editar sus scores */
  recalcScore:    (id: string) => void
}

export const useT4Store = create<T4Store>()(
  persist(
    (set, get) => ({
      useCases: DEMO_USE_CASES,

      addUseCase: (uc) => {
        const id = `uc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        set((state) => ({
          useCases: [
            ...state.useCases,
            {
              ...uc,
              id,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },

      updateUseCase: (id, updates) =>
        set((state) => ({
          useCases: state.useCases.map((uc) =>
            uc.id === id ? { ...uc, ...updates } : uc
          ),
        })),

      removeUseCase: (id) =>
        set((state) => ({
          useCases: state.useCases.filter((uc) => uc.id !== id),
        })),

      recalcScore: (id) => {
        const uc = get().useCases.find((u) => u.id === id)
        if (!uc) return
        const newScore = computePriorityScore(uc.scores)
        set((state) => ({
          useCases: state.useCases.map((u) =>
            u.id === id ? { ...u, priorityScore: newScore } : u
          ),
        }))
      },
    }),
    {
      name:    'lean-t4-usecases',
      version: 1,
    }
  )
)

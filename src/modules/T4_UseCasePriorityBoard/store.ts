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
//
// Escala de scoring: 0-100 (continua, slider en taller).
// Score fórmula: kpi×0.35 + feas×0.30 + (100-risk)×0.20 + (100-dep)×0.15
// Umbrales: ≥70 GO, ≥50 PENDING, <50 NO-GO.
// ============================================================

import { create }          from 'zustand'
import { persist }         from 'zustand/middleware'
import { computePriorityScore } from './constants'
import type { UseCase }    from './types'

// ── Demo data — 8 casos de uso priorización ──────────────────
//
// Scoring 0-100:
//   kpiImpact, feasibility   → mayor = mejor
//   aiRisk, dataDependency   → mayor = peor (se invierte en fórmula)
//
// Score compuesto:
//   kpi×0.35 + feas×0.30 + (100-risk)×0.20 + (100-dep)×0.15
//
// Cuadrante (X=feas/100, Y=kpi/100, umbral 0.60):
//   TOP-RIGHT  (implementar ya): TI Triaje, Marketing Copilot
//   TOP-LEFT   (planificar):     Calidad Producción, Conciliación
//   BOTTOM-RIGHT (quick win):    Documental
//   BOTTOM-LEFT  (revisar):      Scoring Proveedores
//   MID:                         RRHH, Dashboard Demanda

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
    sponsorName:       'Marcos Ibáñez (CIO)',
    responsibleItData: 'Claudia Ros',
    businessObjective: 'Eficiencia operativa TI — liberar capacidad L1 para tareas de mayor valor',
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
        scores:          { kpiImpact: 90, feasibility: 75, aiRisk: 25, dataDependency: 30 },
        notes:           '150 tickets/semana. ROI muy claro. Datos disponibles en ITSM.',
        scoredAt:        new Date('2026-04-15').toISOString(),
      },
      {
        id:              'demo-uc-001-ss-2',
        stakeholderName: 'Claudia Ros',
        stakeholderRole: 'Head of IT Operations',
        scores:          { kpiImpact: 90, feasibility: 80, aiRisk: 20, dataDependency: 30 },
        notes:           'El equipo L1 ya pide una solución. Fácil de pilotar.',
        scoredAt:        new Date('2026-04-15').toISOString(),
      },
    ],
    scores:        { kpiImpact: 90, feasibility: 78, aiRisk: 23, dataDependency: 30 },
    priorityScore: s({ kpiImpact: 90, feasibility: 78, aiRisk: 23, dataDependency: 30 }),  // ~80.7
    economics: {
      kpiPrincipal:          'Reducción MTTR incidencias L1 (horas → minutos)',
      processHoursPerWeek:   25,
      headcount:             4,
      efficiencyGain:        0.55,
      efficiencyGainMode:    'benchmark',
      hourlyRate:            45,
      hourlyRateMode:        'preset',
      hourlyRatePreset:      'tecnico',
      implementationCost:    30_000,
      implementationCostMode: 'benchmark',
    },
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
    sponsorName: 'Marcos Ibáñez (CIO)',
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
        scores:          { kpiImpact: 35, feasibility: 35, aiRisk: 75, dataDependency: 80 },
        notes:           'Proceso muy fragmentado. Datos en silos (emails, Excel, contratos PDF). Requiere trabajo previo de integración.',
        scoredAt:        new Date('2026-04-15').toISOString(),
      },
    ],
    scores:        { kpiImpact: 35, feasibility: 35, aiRisk: 75, dataDependency: 80 },
    priorityScore: s({ kpiImpact: 35, feasibility: 35, aiRisk: 75, dataDependency: 80 }),  // ~28.5
    economics: {
      kpiPrincipal:          'Tiempo de evaluación de proveedores (días/proceso)',
      processHoursPerWeek:   5,
      headcount:             2,
      efficiencyGain:        0.30,
      efficiencyGainMode:    'benchmark',
      hourlyRate:            45,
      hourlyRateMode:        'preset',
      hourlyRatePreset:      'tecnico',
      implementationCost:    40_000,
      implementationCostMode: 'benchmark',
    },
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
    sponsorName: 'Javier Morales (COO)',
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
        scores:          { kpiImpact: 85, feasibility: 30, aiRisk: 65, dataDependency: 85 },
        notes:           'El impacto es enorme pero los datos de sensores no están integrados. Necesito pruebas piloto antes de comprometer más.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 85, feasibility: 30, aiRisk: 65, dataDependency: 85 },
    priorityScore: s({ kpiImpact: 85, feasibility: 30, aiRisk: 65, dataDependency: 85 }),  // ~46.5
    economics: {
      kpiPrincipal:          'OEE (Overall Equipment Effectiveness) y % defectos en línea',
      processHoursPerWeek:   20,
      headcount:             6,
      efficiencyGain:        0.30,
      efficiencyGainMode:    'benchmark',
      hourlyRate:            35,
      hourlyRateMode:        'preset',
      hourlyRatePreset:      'tecnico',
      implementationCost:    55_000,
      implementationCostMode: 'benchmark',
    },
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
    sponsorName:       'Susana Prats (Head of Digital Ops)',
    responsibleItData: 'Marcos Ibáñez',
    businessObjective: 'Reducción de riesgo contractual y eficiencia administrativa',
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
        scores:          { kpiImpact: 60, feasibility: 80, aiRisk: 15, dataDependency: 35 },
        notes:           'Si la IA amplifica al equipo, no reemplaza, apoyo total. Tenemos 5.000+ docs archivados a clasificar.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
      {
        id:              'demo-uc-004-ss-2',
        stakeholderName: 'Marcos Ibáñez',
        stakeholderRole: 'CIO',
        scores:          { kpiImpact: 65, feasibility: 90, aiRisk: 10, dataDependency: 30 },
        notes:           'Tecnología madura. Podemos desplegar en semanas.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 63, feasibility: 85, aiRisk: 13, dataDependency: 33 },
    priorityScore: s({ kpiImpact: 63, feasibility: 85, aiRisk: 13, dataDependency: 33 }),  // ~76.6
    economics: {
      kpiPrincipal:          'Tiempo de revisión/clasificación documental (días → horas)',
      processHoursPerWeek:   12,
      headcount:             3,
      efficiencyGain:        0.70,
      efficiencyGainMode:    'benchmark',
      hourlyRate:            25,
      hourlyRateMode:        'preset',
      hourlyRatePreset:      'administrativo',
      implementationCost:    18_000,
      implementationCostMode: 'benchmark',
    },
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
    sponsorName:       'Rafael Molina (CMO)',
    responsibleItData: 'Marcos Ibáñez',
    businessObjective: 'Aceleración time-to-market de campañas y reducción de costes de producción creativa',
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
        scores:          { kpiImpact: 65, feasibility: 95, aiRisk: 15, dataDependency: 10 },
        notes:           'El equipo ya usa IA. Queremos un flujo estructurado. Podemos arrancar esta semana.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 65, feasibility: 95, aiRisk: 15, dataDependency: 10 },
    priorityScore: s({ kpiImpact: 65, feasibility: 95, aiRisk: 15, dataDependency: 10 }),  // ~82.3
    economics: {
      kpiPrincipal:          'Tiempo de producción de contenido (días/campaña)',
      processHoursPerWeek:   14,
      headcount:             3,
      efficiencyGain:        0.40,
      efficiencyGainMode:    'benchmark',
      hourlyRate:            45,
      hourlyRateMode:        'preset',
      hourlyRatePreset:      'tecnico',
      implementationCost:    12_000,
      implementationCostMode: 'benchmark',
    },
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
    sponsorName:       'Pedro Saura (CFO)',
    responsibleItData: 'Marcos Ibáñez',
    businessObjective: 'Reducción del ciclo de cierre financiero mensual y mejora de auditabilidad',
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
        scores:          { kpiImpact: 90, feasibility: 40, aiRisk: 50, dataDependency: 35 },
        notes:           'El ahorro es enorme pero no me fío de que la IA tome decisiones contables sin supervisión. Necesito ver auditoría completa.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 90, feasibility: 40, aiRisk: 50, dataDependency: 35 },
    priorityScore: s({ kpiImpact: 90, feasibility: 40, aiRisk: 50, dataDependency: 35 }),  // ~64.3
    economics: {
      kpiPrincipal:          'Días de ciclo de cierre mensual y horas de revisión manual',
      processHoursPerWeek:   18,
      headcount:             2,
      efficiencyGain:        0.55,
      efficiencyGainMode:    'benchmark',
      hourlyRate:            45,
      hourlyRateMode:        'preset',
      hourlyRatePreset:      'tecnico',
      implementationCost:    28_000,
      implementationCostMode: 'benchmark',
    },
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
    sponsorName:       'Laura Giménez (Head of Growth)',
    responsibleItData: 'Marcos Ibáñez',
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
        scores:          { kpiImpact: 75, feasibility: 70, aiRisk: 40, dataDependency: 55 },
        notes:           'En picos de contratación procesamos 200+ CVs por posición. Tiempo de criba: 3 días. Con IA: horas.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 75, feasibility: 70, aiRisk: 40, dataDependency: 55 },
    priorityScore: s({ kpiImpact: 75, feasibility: 70, aiRisk: 40, dataDependency: 55 }),  // ~65.3
    economics: {
      kpiPrincipal:          'Tiempo de criba de candidatos (días/proceso) y coste por contratación',
      processHoursPerWeek:   10,
      headcount:             2,
      efficiencyGain:        0.40,
      efficiencyGainMode:    'benchmark',
      hourlyRate:            45,
      hourlyRateMode:        'preset',
      hourlyRatePreset:      'tecnico',
      implementationCost:    12_000,
      implementationCostMode: 'benchmark',
    },
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
    sponsorName: 'Rafael Molina (CMO)',
    stakeholderScores: [
      {
        id:              'demo-uc-008-ss-1',
        stakeholderName: 'Rafael Molina',
        stakeholderRole: 'CMO',
        scores:          { kpiImpact: 75, feasibility: 55, aiRisk: 35, dataDependency: 65 },
        notes:           'Muy útil para planificación de campañas. Los datos de ventas están en el CRM pero no están limpios.',
        scoredAt:        new Date('2026-04-16').toISOString(),
      },
    ],
    scores:        { kpiImpact: 75, feasibility: 55, aiRisk: 35, dataDependency: 65 },
    priorityScore: s({ kpiImpact: 75, feasibility: 55, aiRisk: 35, dataDependency: 65 }),  // ~59.3
    economics: {
      kpiPrincipal:          'Precisión de forecast comercial (MAPE) y tiempo de planificación',
      processHoursPerWeek:   8,
      headcount:             2,
      efficiencyGain:        0.30,
      efficiencyGainMode:    'benchmark',
      hourlyRate:            45,
      hourlyRateMode:        'preset',
      hourlyRatePreset:      'tecnico',
      implementationCost:    35_000,
      implementationCostMode: 'benchmark',
    },
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
      version: 2,  // bumped: escala de scores migrada de 1-5 a 0-100
    }
  )
)

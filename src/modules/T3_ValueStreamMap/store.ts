// ============================================================
// T3 — Zustand store con persist
//
// Gestiona la lista de procesos del engagement activo.
// MVP: datos demo pre-cargados para mostrar T3 poblado.
// Sprint 3+: leer/escribir desde Supabase tabla `value_stream`.
// ============================================================

import { create }                        from 'zustand'
import { persist }                       from 'zustand/middleware'
import type { ValueStream, ProcessStage } from './types'

// ── Demo data — 7 procesos en 5 departamentos ─────────────────
// Distribución realista para el patrón 'vendor-sprawl'.
// Scores computados con el algoritmo actual (constants.ts).
// MAX: automation=5, data=4, volume=4, impact=7, readiness=4.
//
// Cuadrante (X=readiness, Y=opportunity):
//   TOP-RIGHT  (pilotar ahora): Triaje IT, Gestión Documental
//   TOP-LEFT   (preparar terreno): Control Calidad, Conciliación
//   MID        (analizar): Evaluación Proveedores, Criba RRHH
//   BOT-RIGHT  (quick win): Contenido Marketing

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
      {
        id: 'demo-s001-001', name: 'Recepción incidencia',
        department: 'IT / Tecnología', responsible: 'Portal ITSM', system: 'ServiceDesk Pro',
        procTimeHours: 0.08, waitTimeHours: 0.25, handoffs: 0, valueContribution: 'alta',
      },
      {
        id: 'demo-s001-002', name: 'Clasificación L1',
        department: 'IT / Tecnología', responsible: 'Técnico L1', system: 'ServiceDesk Pro',
        procTimeHours: 0.25, waitTimeHours: 1.5, handoffs: 1, valueContribution: 'media',
      },
      {
        id: 'demo-s001-003', name: 'Resolución L1',
        department: 'IT / Tecnología', responsible: 'Técnico L1', system: 'ServiceDesk Pro',
        procTimeHours: 0.75, waitTimeHours: 4, handoffs: 0, valueContribution: 'alta',
      },
      {
        id: 'demo-s001-004', name: 'Escalado a L2',
        department: 'IT / Tecnología', responsible: 'Gestor L2', system: 'JIRA',
        procTimeHours: 0.25, waitTimeHours: 8, handoffs: 2, valueContribution: 'baja',
        notes: 'Punto crítico — representa el 50%+ del ciclo total. Candidato prioritario a automatización.',
      },
      {
        id: 'demo-s001-005', name: 'Cierre y registro',
        department: 'IT / Tecnología', responsible: 'Técnico L1', system: 'ServiceDesk Pro',
        procTimeHours: 0.17, waitTimeHours: 0.5, handoffs: 1, valueContribution: 'media',
      },
    ],
    interview: {
      answers:          { 1: 'A', 2: 'A', 3: 'A', 4: 'B', 5: 'A', 6: 'A' },
      automationScore:  4.00,
      dataScore:        4.00,
      volumeScore:      4.00,
      impactScore:      3.14,
      readinessScore:   4.00,
      opportunityScore: 3.83,
      aiCategory:       'automatizacion_inteligente',
      orgReadiness:     'alta',
      computedAt:       new Date('2026-04-10').toISOString(),
    },
    opportunities: [
      {
        id:          'demo-vs-001-opp-0',
        title:       'Automatización end-to-end del flujo de tickets L1',
        description: 'Orquestación del proceso completo con IA clasificando, priorizando y resolviendo tickets de nivel 1 sin intervención humana.',
        effort: 'medio', impact: 'alto', status: 'validada',
      },
      {
        id:          'demo-vs-001-opp-1',
        title:       'Clasificación y routing inteligente',
        description: 'Clasificación automática de incidencias y asignación al técnico o cola correcta según historial y patrones.',
        effort: 'bajo', impact: 'alto', status: 'validada',
      },
      {
        id:          'demo-vs-001-opp-2',
        title:       'Base de conocimiento auto-actualizada',
        description: 'IA que extrae soluciones de tickets resueltos y mantiene la base de conocimiento actualizada en tiempo real.',
        effort: 'bajo', impact: 'medio', status: 'sugerida',
      },
    ],
  },

  {
    id:               'demo-vs-002',
    name:             'Evaluación y onboarding de proveedores IA',
    department:       'IT / Tecnología',
    owner:            'Claudia Ros',
    ownerRole:        'Head of IT Operations',
    description:      'Proceso de evaluación técnica, due diligence y onboarding de nuevos proveedores de herramientas IA y software.',
    phase:            'validacion',
    aiCategory:       'analitica_predictiva',
    orgReadiness:     'media',
    opportunityLevel: 'media',
    notes:            'Proceso semi-estructurado con alta variabilidad. Datos disponibles pero fragmentados entre emails, Excel y contratos PDF.',
    createdAt:        new Date('2026-04-10').toISOString(),
    interview: {
      answers:          { 1: 'C', 2: 'B', 3: 'C', 4: 'A', 5: 'B', 6: 'B' },
      automationScore:  1.60,
      dataScore:        2.50,
      volumeScore:      1.50,
      impactScore:      3.43,
      readinessScore:   2.50,
      opportunityScore: 2.17,
      aiCategory:       'analitica_predictiva',
      orgReadiness:     'media',
      computedAt:       new Date('2026-04-10').toISOString(),
    },
    opportunities: [
      {
        id:          'demo-vs-002-opp-0',
        title:       'Scoring automatizado de proveedores',
        description: 'Modelo que evalúa proveedores contra criterios técnicos, de seguridad y regulatorios y genera un score de idoneidad.',
        effort: 'alto', impact: 'alto', status: 'sugerida',
      },
      {
        id:          'demo-vs-002-opp-1',
        title:       'Extracción inteligente de contratos',
        description: 'IA que extrae automáticamente cláusulas clave, SLAs y riesgos de contratos de proveedores para su validación.',
        effort: 'medio', impact: 'alto', status: 'sugerida',
      },
      {
        id:          'demo-vs-002-opp-2',
        title:       'Dashboard de inteligencia de proveedores',
        description: 'Panel unificado con métricas de rendimiento, coste y riesgo de todos los proveedores IA activos.',
        effort: 'medio', impact: 'medio', status: 'sugerida',
      },
    ],
  },

  // ── Operaciones ───────────────────────────────────────────────
  {
    id:               'demo-vs-003',
    name:             'Control de calidad en producción',
    department:       'Operaciones',
    owner:            'Javier Morales',
    ownerRole:        'COO',
    description:      'Inspección, registro y gestión de desviaciones de calidad en líneas de producción. Incluye control estadístico y reporte.',
    phase:            'validacion',
    aiCategory:       'analitica_predictiva',
    orgReadiness:     'baja',
    opportunityLevel: 'alta',
    notes:            'Gran volumen de datos de sensores y registros. El equipo es técnico pero escéptico. Javier (COO) exige evidencia operacional antes de piloto.',
    createdAt:        new Date('2026-04-11').toISOString(),
    interview: {
      answers:          { 1: 'B', 2: 'A', 3: 'A', 4: 'A', 5: 'C', 6: 'B' },
      automationScore:  2.40,
      dataScore:        4.00,
      volumeScore:      4.00,
      impactScore:      3.43,
      readinessScore:   1.50,
      opportunityScore: 3.33,
      aiCategory:       'analitica_predictiva',
      orgReadiness:     'baja',
      computedAt:       new Date('2026-04-11').toISOString(),
    },
    opportunities: [
      {
        id:          'demo-vs-003-opp-0',
        title:       'Detección predictiva de defectos',
        description: 'Modelo que analiza datos de sensores en tiempo real y predice defectos antes de que ocurran, reduciendo el retrabajo.',
        effort: 'alto', impact: 'alto', status: 'sugerida',
      },
      {
        id:          'demo-vs-003-opp-1',
        title:       'Visión artificial para inspección visual',
        description: 'Sistema de visión por computador que inspecciona piezas automáticamente y detecta anomalías con mayor precisión que el ojo humano.',
        effort: 'alto', impact: 'alto', status: 'sugerida',
      },
      {
        id:          'demo-vs-003-opp-2',
        title:       'Dashboard de inteligencia operacional de calidad',
        description: 'Panel en tiempo real con predicciones de calidad, alertas tempranas y análisis de causa raíz automatizado.',
        effort: 'medio', impact: 'alto', status: 'sugerida',
      },
    ],
  },

  // ── Legal / Administración ───────────────────────────────────
  {
    id:               'demo-vs-004',
    name:             'Gestión documental y contratos',
    department:       'Legal / Administración',
    owner:            'Susana Prats',
    ownerRole:        'Head of Digital Ops',
    description:      'Recepción, clasificación, archivo y gestión del ciclo de vida de contratos, acuerdos y documentación corporativa.',
    phase:            'piloto',
    aiCategory:       'automatizacion_rpa',
    orgReadiness:     'media',
    opportunityLevel: 'alta',
    notes:            'Proceso altamente repetitivo. Susana preocupada por impacto en su equipo de analistas. Oportunidad de demostrar que IA amplifica, no reemplaza.',
    createdAt:        new Date('2026-04-11').toISOString(),
    stages: [
      {
        id: 'demo-s004-001', name: 'Recepción y entrada',
        department: 'Legal / Administración', responsible: 'Administrativo', system: 'Email / Escáner',
        procTimeHours: 0.25, waitTimeHours: 2, handoffs: 0, valueContribution: 'media',
      },
      {
        id: 'demo-s004-002', name: 'Clasificación manual',
        department: 'Legal / Administración', responsible: 'Administrativo', system: 'SharePoint',
        procTimeHours: 0.5, waitTimeHours: 3, handoffs: 1, valueContribution: 'baja',
      },
      {
        id: 'demo-s004-003', name: 'Revisión legal',
        department: 'Legal / Administración', responsible: 'Abogado interno', system: 'iManage',
        procTimeHours: 2, waitTimeHours: 24, handoffs: 2, valueContribution: 'alta',
        notes: 'Cuello de botella principal. 24h de espera por carga de trabajo legal. Alta prioridad para asistente IA de revisión contractual.',
      },
      {
        id: 'demo-s004-004', name: 'Archivo y registro',
        department: 'Legal / Administración', responsible: 'Administrativo', system: 'SharePoint',
        procTimeHours: 0.25, waitTimeHours: 1, handoffs: 1, valueContribution: 'media',
      },
    ],
    interview: {
      answers:          { 1: 'A', 2: 'C', 3: 'B', 4: 'B', 5: 'B', 6: 'A' },
      automationScore:  4.00,
      dataScore:        1.50,
      volumeScore:      2.50,
      impactScore:      3.14,
      readinessScore:   2.50,
      opportunityScore: 2.90,
      aiCategory:       'automatizacion_rpa',
      orgReadiness:     'media',
      computedAt:       new Date('2026-04-11').toISOString(),
    },
    opportunities: [
      {
        id:          'demo-vs-004-opp-0',
        title:       'Robot de clasificación y archivo documental',
        description: 'RPA que clasifica automáticamente documentos entrantes, los etiqueta y archiva según tipología y área.',
        effort: 'bajo', impact: 'medio', status: 'validada',
      },
      {
        id:          'demo-vs-004-opp-1',
        title:       'Extracción inteligente de datos de contratos',
        description: 'IA que extrae automáticamente fechas clave, partes, obligaciones y cláusulas críticas de contratos en PDF.',
        effort: 'medio', impact: 'alto', status: 'sugerida',
      },
      {
        id:          'demo-vs-004-opp-2',
        title:       'Orquestador de aprobaciones contractuales',
        description: 'Sistema que gestiona el flujo de revisión y aprobación de contratos, notifica a responsables y registra el histórico.',
        effort: 'medio', impact: 'medio', status: 'sugerida',
      },
    ],
  },

  // ── Marketing & Comercial ─────────────────────────────────────
  {
    id:               'demo-vs-005',
    name:             'Generación de contenido de campaña',
    department:       'Marketing & Comercial',
    owner:            'Rafael Molina',
    ownerRole:        'CMO',
    description:      'Creación, revisión y publicación de contenido para campañas digitales: copies, imágenes, vídeos cortos y materiales de venta.',
    phase:            'estandarizacion',
    aiCategory:       'asistente_ia',
    orgReadiness:     'alta',
    opportunityLevel: 'media',
    notes:            'Rafael ya usa IA para contenido. El equipo está muy dispuesto. Oportunidad de implementar flujo estructurado con IA vs. uso ad-hoc.',
    createdAt:        new Date('2026-04-12').toISOString(),
    interview: {
      answers:          { 1: 'D', 2: 'B', 3: 'B', 4: 'A', 5: 'A', 6: 'B' },
      automationScore:  0.40,
      dataScore:        2.50,
      volumeScore:      2.50,
      impactScore:      3.43,
      readinessScore:   4.00,
      opportunityScore: 1.95,
      aiCategory:       'asistente_ia',
      orgReadiness:     'alta',
      computedAt:       new Date('2026-04-12').toISOString(),
    },
    opportunities: [
      {
        id:          'demo-vs-005-opp-0',
        title:       'Copilot de contenido para el equipo creativo',
        description: 'Asistente IA integrado en el flujo de trabajo que genera borradores de copies, adapta mensajes por audiencia y propone variaciones.',
        effort: 'bajo', impact: 'medio', status: 'validada',
      },
      {
        id:          'demo-vs-005-opp-1',
        title:       'Generación automatizada de materiales de campaña',
        description: 'IA que genera automáticamente variaciones de creatividades, copies y materiales de venta a partir de un brief estructurado.',
        effort: 'bajo', impact: 'medio', status: 'sugerida',
      },
      {
        id:          'demo-vs-005-opp-2',
        title:       'Análisis predictivo de rendimiento de contenido',
        description: 'Modelo que predice el rendimiento esperado de un contenido antes de publicarlo basándose en histórico de campañas.',
        effort: 'medio', impact: 'medio', status: 'sugerida',
      },
    ],
  },

  // ── Finanzas ──────────────────────────────────────────────────
  {
    id:               'demo-vs-006',
    name:             'Conciliación financiera mensual',
    department:       'Finanzas',
    owner:            'Pedro Saura',
    ownerRole:        'CFO',
    description:      'Proceso de cierre contable mensual: conciliación de cuentas, revisión de desviaciones, validación de asientos y generación de reporting financiero.',
    phase:            'idea',
    aiCategory:       'automatizacion_inteligente',
    orgReadiness:     'baja',
    opportunityLevel: 'critica',
    notes:            'Pedro (CFO) es crítico. El proceso consume 3 días/mes del equipo financiero. Alto potencial técnico pero máxima resistencia del responsable.',
    createdAt:        new Date('2026-04-12').toISOString(),
    manualOverride:   true,  // algoritmo: automatizacion_inteligente — override mantenido, readiness real más baja
    interview: {
      answers:          { 1: 'A', 2: 'A', 3: 'C', 4: 'B', 5: 'D', 6: 'A' },
      automationScore:  4.00,
      dataScore:        4.00,
      volumeScore:      1.50,
      impactScore:      3.14,
      readinessScore:   0.00,
      opportunityScore: 3.33,
      aiCategory:       'automatizacion_inteligente',
      orgReadiness:     'baja',
      computedAt:       new Date('2026-04-12').toISOString(),
    },
    opportunities: [
      {
        id:          'demo-vs-006-opp-0',
        title:       'Automatización del proceso de conciliación',
        description: 'Robot que ejecuta la conciliación contable automáticamente, detecta discrepancias y genera el informe de excepciones para revisión humana.',
        effort: 'medio', impact: 'alto', status: 'sugerida',
      },
      {
        id:          'demo-vs-006-opp-1',
        title:       'Detección de anomalías en asientos contables',
        description: 'Modelo que identifica asientos anómalos o potencialmente erróneos antes del cierre, reduciendo el riesgo de retrabajos.',
        effort: 'alto', impact: 'alto', status: 'sugerida',
      },
      {
        id:          'demo-vs-006-opp-2',
        title:       'Reporting financiero ejecutivo auto-generado',
        description: 'IA que genera automáticamente el informe de cierre mensual con narrativa, variaciones y comparativas vs. objetivos.',
        effort: 'bajo', impact: 'medio', status: 'sugerida',
      },
    ],
  },

  // ── RRHH ─────────────────────────────────────────────────────
  {
    id:               'demo-vs-007',
    name:             'Criba y scoring de candidatos',
    department:       'RRHH',
    owner:            'Laura Giménez',
    ownerRole:        'Head of Growth',
    description:      'Revisión de CVs, cribado inicial, scoring de candidatos y coordinación de entrevistas para posiciones abiertas.',
    phase:            'validacion',
    aiCategory:       'asistente_ia',
    orgReadiness:     'media',
    opportunityLevel: 'media',
    notes:            'Laura conecta bien con IT y negocio. Proceso con alto volumen en picos de contratación. Datos parcialmente estructurados (CVs en PDF).',
    createdAt:        new Date('2026-04-13').toISOString(),
    interview: {
      answers:          { 1: 'C', 2: 'B', 3: 'C', 4: 'B', 5: 'B', 6: 'B' },
      automationScore:  1.60,
      dataScore:        2.50,
      volumeScore:      1.50,
      impactScore:      2.57,
      readinessScore:   2.50,
      opportunityScore: 2.00,
      aiCategory:       'asistente_ia',
      orgReadiness:     'media',
      computedAt:       new Date('2026-04-13').toISOString(),
    },
    opportunities: [
      {
        id:          'demo-vs-007-opp-0',
        title:       'Scoring automático de CVs',
        description: 'IA que evalúa candidatos contra criterios del perfil buscado y genera un ranking con justificación para el equipo de RRHH.',
        effort: 'bajo', impact: 'medio', status: 'sugerida',
      },
      {
        id:          'demo-vs-007-opp-1',
        title:       'Asistente de entrevista estructurada',
        description: 'Copilot que propone preguntas personalizadas por candidato y registra automáticamente las evaluaciones del entrevistador.',
        effort: 'bajo', impact: 'medio', status: 'sugerida',
      },
      {
        id:          'demo-vs-007-opp-2',
        title:       'Análisis de embudo de selección',
        description: 'Dashboard que analiza el embudo de selección, detecta cuellos de botella y predice tiempo de cobertura de posiciones.',
        effort: 'medio', impact: 'bajo', status: 'sugerida',
      },
    ],
  },
]

// ── Store ─────────────────────────────────────────────────────

interface T3Store {
  processes:       ValueStream[]
  addProcess:      (p: Omit<ValueStream, 'id' | 'createdAt'>) => void
  updateProcess:   (id: string, updates: Partial<Omit<ValueStream, 'id'>>) => void
  removeProcess:   (id: string) => void

  /** Stage management — modifica stages dentro del proceso correspondiente */
  addStage:    (processId: string, stage: Omit<ProcessStage, 'id'>) => void
  updateStage: (processId: string, stageId: string, updates: Partial<Omit<ProcessStage, 'id'>>) => void
  removeStage: (processId: string, stageId: string) => void
}

export const useT3Store = create<T3Store>()(
  persist(
    (set) => ({
      processes: DEMO_PROCESSES,

      addProcess: (p) =>
        set((state) => ({
          processes: [
            ...state.processes,
            {
              ...p,
              id:        `vs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateProcess: (id, updates) =>
        set((state) => ({
          processes: state.processes.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removeProcess: (id) =>
        set((state) => ({
          processes: state.processes.filter((p) => p.id !== id),
        })),

      // ── Stage management ────────────────────────────────────────

      addStage: (processId, stage) =>
        set((state) => ({
          processes: state.processes.map((p) =>
            p.id !== processId ? p : {
              ...p,
              stages: [
                ...(p.stages ?? []),
                {
                  ...stage,
                  id: `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                },
              ],
            }
          ),
        })),

      updateStage: (processId, stageId, updates) =>
        set((state) => ({
          processes: state.processes.map((p) =>
            p.id !== processId ? p : {
              ...p,
              stages: (p.stages ?? []).map((s) =>
                s.id !== stageId ? s : { ...s, ...updates }
              ),
            }
          ),
        })),

      removeStage: (processId, stageId) =>
        set((state) => ({
          processes: state.processes.map((p) =>
            p.id !== processId ? p : {
              ...p,
              stages: (p.stages ?? []).filter((s) => s.id !== stageId),
            }
          ),
        })),
    }),
    {
      name:    'lean-t3-processes',
      version: 1,
    }
  )
)

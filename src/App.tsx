// ============================================================
// LEAN AI System — App root (demo PhaseRoadmap)
//
// Sprint 0.5: preview del Metro Map de fases L.E.A.N.
// Sprint 1 añadirá: BrowserRouter + rutas reales + AuthProvider.
// ============================================================

import { PhaseRoadmap, type LeanPhase }       from '@/shared/components/PhaseRoadmap'
import { ChartWrapper, LeanRadarChart, LeanBarChart, DEMO_RADAR_DATA, DEMO_KPI_DATA } from '@/shared/components/charts'
import { MetricHeroGrid }                      from '@/shared/components/MetricHero'

// ── Datos de demo — sprint L.E.A.N. 6 meses ──────────────────
const DEMO_PHASES: LeanPhase[] = [
  {
    id:          'f1',
    label:       'Diagnóstico',
    shortLabel:  'Diagnóstico',
    status:      'complete',
    duration:    'Semanas 1–3',
    description: 'Evaluación de madurez IA y mapa de oportunidades',
    tools: [
      { code: 'T1', name: 'AI Readiness Assessment', status: 'complete', output: 'Informe de madurez IA' },
      { code: 'T2', name: 'Stakeholder Map',          status: 'complete', output: 'Mapa de stakeholders' },
      { code: 'T3', name: 'Process Value Chain',      status: 'complete', output: 'Value chain annotado' },
    ],
  },
  {
    id:          'f2',
    label:       'Arquitectura',
    shortLabel:  'Arq.',
    status:      'complete',
    duration:    'Semanas 4–6',
    description: 'Diseño de la arquitectura de datos e IA',
    tools: [
      { code: 'T4', name: 'Data Journey Map',        status: 'complete', output: 'Mapa de flujos de datos' },
      { code: 'T5', name: 'Vendor Selection Matrix', status: 'complete', output: 'Matriz de selección' },
      { code: 'T6', name: 'IT Governance Framework', status: 'complete', output: 'Framework de gobierno' },
    ],
  },
  {
    id:          'f3',
    label:       'Piloto',
    shortLabel:  'Piloto',
    status:      'active',
    duration:    'Semanas 7–12',
    description: 'Implementación piloto en 1–2 procesos críticos',
    tools: [
      { code: 'T7',  name: 'Use Case Prioritizer',   status: 'in_progress', output: 'Backlog priorizado' },
      { code: 'T8',  name: 'Pilot Sprint Canvas',    status: 'in_progress', output: 'Plan de piloto' },
      { code: 'T9',  name: 'KPI Dashboard Setup',    status: 'pending',     output: 'Dashboard de seguimiento' },
      { code: 'T10', name: 'Change Management Plan', status: 'pending',     output: 'Plan de comunicación' },
    ],
  },
  {
    id:          'f4',
    label:       'Validación',
    shortLabel:  'Valid.',
    status:      'upcoming',
    duration:    'Semanas 13–16',
    description: 'Medición de impacto y ajuste del modelo',
    tools: [
      { code: 'T11', name: 'Impact Measurement',      status: 'pending', output: 'Informe de impacto' },
      { code: 'T12', name: 'Model Optimization Loop', status: 'pending', output: 'Modelo ajustado' },
    ],
  },
  {
    id:          'f5',
    label:       'Despliegue',
    shortLabel:  'Deploy',
    status:      'upcoming',
    duration:    'Semanas 17–22',
    description: 'Escalado a toda la organización',
    tools: [
      { code: 'T13', name: 'Rollout Playbook', status: 'pending', output: 'Guía de despliegue' },
    ],
  },
  {
    id:          'f6',
    label:       'Optimización',
    shortLabel:  'Optim.',
    status:      'locked',
    duration:    'Semanas 23–24',
    description: 'Revisión final y entrega de la operación al cliente',
    tools: [],
  },
]

export default function App() {
  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
            Alpha Corp — Sprint L.E.A.N.
          </p>
          <h1 className="text-xl font-semibold text-lean-black dark:text-gray-100">
            Roadmap de adopción IA
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Haz click en cualquier fase para ver el detalle de herramientas y entregables.
          </p>
        </div>

        {/* MetricHero — E6 demo */}
        <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 px-8 py-6 shadow-sm">
          <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-5">Resumen ejecutivo</p>
          <MetricHeroGrid
            cols={4}
            metrics={[
              { value: 3.2,  suffix: '/ 5',  label: 'Madurez IA global',      delta: +0.4, deltaLabel: 'vs. diagnóstico inicial' },
              { value: 61,   unit: '%',       label: 'Procesos automatizados', delta: +18,  deltaLabel: 'este sprint' },
              { value: '€ 127K', label: 'Ahorro estimado',        trend: 'up', sublabel: 'anualizado' },
              { value: 4,    suffix: '/ 13',  label: 'Herramientas activas',   trend: 'neutral', deltaLabel: 'en curso' },
            ]}
          />
        </div>

        {/* Metro Map */}
        <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 p-8 shadow-sm">
          <PhaseRoadmap
            phases={DEMO_PHASES}
            onToolClick={(phase, tool) => {
              console.log('[PhaseRoadmap]', phase.label, tool.code, tool.name)
            }}
          />
        </div>

        {/* Charts — E5 demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper
            title="AI Readiness Assessment"
            subtitle="T1 — Madurez IA por dimensión (escala 0–5)"
            height={320}
          >
            <LeanRadarChart data={DEMO_RADAR_DATA} showTarget />
          </ChartWrapper>

          <ChartWrapper
            title="KPI Dashboard"
            subtitle="T9 — Impacto medido vs. objetivo (%)"
            height={320}
          >
            <LeanBarChart
              data={DEMO_KPI_DATA}
              keys={['actual', 'target']}
              unit="%"
              referenceValue={70}
              referenceLabel="Umbral éxito"
            />
          </ChartWrapper>
        </div>

      </div>
    </div>
  )
}

// ============================================================
// LEAN AI System — App root (Sprint 3)
//
// Sprint 3: Supabase Auth real + persistencia en BD.
// initialize() restaura sesión al recargar página.
// isInitializing evita flash de /login mientras se comprueba.
// ============================================================

import { useState, createContext, useContext, useEffect }  from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppLayout }                            from '@/shared/layouts/AppLayout'
import { LoginView, useAuthStore }              from '@/modules/Auth'
import { PhaseRoadmap }                         from '@/shared/components/PhaseRoadmap'
import { ChartWrapper, LeanRadarChart, LeanBarChart, DEMO_KPI_DATA } from '@/shared/components/charts'
import { MetricHeroGrid }                       from '@/shared/components/MetricHero'
import { T1View }                               from '@/modules/T1_MaturityRadar'
import { T2View }                               from '@/modules/T2_StakeholderMatrix'
import { T3View }                               from '@/modules/T3_ValueStreamMap'
import { T4View }                               from '@/modules/T4_UseCasePriorityBoard'
import { T5View }                               from '@/modules/T5_AITaxonomyCanvas'
import { T6View }                               from '@/modules/T6_RiskGovernance'
import { T7View }                               from '@/modules/T7_AdoptionHeatmap'
import { CompanyProfileView }                   from '@/modules/CompanyProfile'
import {
  DEMO_SCENARIOS,
  DEFAULT_DEMO_SCENARIO,
  getDemoScenario,
  type DemoPattern,
  type DemoScenario,
} from '@/data/demo'

// ── Contexto de demo — accesible desde rutas hijas ────────────

interface DemoCtx {
  scenario:   DemoScenario
  setPattern: (p: DemoPattern) => void
}

const DemoContext = createContext<DemoCtx>({
  scenario:   DEFAULT_DEMO_SCENARIO,
  setPattern: () => undefined,
})

export function useDemoContext() {
  return useContext(DemoContext)
}

// ── Selector de patrón de demo ────────────────────────────────

function ScenarioSelector({
  active, onChange,
}: {
  active:   DemoPattern
  onChange: (p: DemoPattern) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mr-1">
        Patrón demo
      </span>
      {DEMO_SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={[
            'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
            active === s.id
              ? 'bg-navy text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-700',
          ].join(' ')}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ── Tarjeta de empresa ────────────────────────────────────────

function CompanyCard({ scenario }: { scenario: DemoScenario }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 px-8 py-6 border border-border dark:border-white/6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
            Empresa demo — {scenario.company.industry}
          </p>
          <h2 className="text-lg font-semibold text-lean-black dark:text-gray-100">
            {scenario.company.name}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {scenario.company.employees.toLocaleString('es-ES')} empleados · {scenario.company.country}
          </p>
        </div>
        <div className="max-w-md">
          <p className="text-sm text-text-muted leading-relaxed italic">
            "{scenario.narrative.hook}"
          </p>
        </div>
      </div>
    </div>
  )
}

// ── QW4 Licence Waste Report ──────────────────────────────────

function QuickWinCard({ scenario }: { scenario: DemoScenario }) {
  const qw = scenario.quickWinPreview
  if (!qw?.licenceItems?.length) return null

  const riskColors = {
    low:    'text-success-dark bg-success-light',
    medium: 'text-warning-dark bg-warning-light',
    high:   'text-danger-dark  bg-danger-light',
  } as const

  const riskLabels = { low: 'Bajo', medium: 'Medio', high: 'Alto' } as const
  const total = qw.licenceItems.reduce((acc, item) => acc + item.annualWaste, 0)

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 px-8 py-6 border border-border dark:border-white/6">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy text-white">
              {qw.qwCode}
            </span>
            <p className="text-xs font-mono uppercase tracking-widest text-text-subtle">
              Quick Win — generado automáticamente
            </p>
          </div>
          <h3 className="text-base font-semibold text-lean-black dark:text-gray-100">{qw.title}</h3>
          <p className="text-xs text-text-muted mt-0.5">{qw.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-lean-black dark:text-gray-100 tabular-nums">{qw.totalValue}</p>
          <p className="text-xs text-text-subtle">ahorro potencial anual</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-white/6">
              <th className="text-left py-2 pr-4 text-xs font-medium text-text-subtle">Categoría</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-text-subtle">Contratos</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-text-subtle">Dptos.</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-text-subtle">Coste duplicado/año</th>
              <th className="text-center py-2 pl-3 text-xs font-medium text-text-subtle">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {qw.licenceItems.map((item, i) => (
              <tr key={i} className="border-b border-border/50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-lean-black dark:text-gray-200">{item.category}</p>
                  <p className="text-[11px] text-text-subtle mt-0.5">
                    {item.examples.slice(0, 3).join(' · ')}{item.examples.length > 3 ? ` +${item.examples.length - 3}` : ''}
                  </p>
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums font-medium text-lean-black dark:text-gray-200">{item.contracts}</td>
                <td className="py-2.5 px-3 text-center tabular-nums text-text-muted">{item.departments}</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-lean-black dark:text-gray-200">
                  €{item.annualWaste.toLocaleString('es-ES')}
                </td>
                <td className="py-2.5 pl-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${riskColors[item.risk]}`}>
                    {riskLabels[item.risk]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border dark:border-white/10">
              <td colSpan={3} className="py-3 pr-4 text-xs font-medium text-text-muted">Total estimado de gasto duplicado</td>
              <td className="py-3 px-3 text-right tabular-nums text-base font-bold text-lean-black dark:text-gray-100">
                €{total.toLocaleString('es-ES')}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {qw.impactSummary && (
        <p className="mt-4 text-xs text-text-muted border-t border-border dark:border-white/6 pt-4">{qw.impactSummary}</p>
      )}
    </div>
  )
}

// ── Dashboard view ────────────────────────────────────────────

function DashboardView() {
  const { scenario, setPattern } = useDemoContext()
  const navigate                 = useNavigate()

  function handleToolClick(_phase: unknown, tool: { code: string }) {
    if (tool.code === 'T1') navigate('/t1')
    if (tool.code === 'T2') navigate('/t2')
    if (tool.code === 'T3') navigate('/t3')
    if (tool.code === 'T4') navigate('/t4')
    if (tool.code === 'T5') navigate('/t5')
    if (tool.code === 'T6') navigate('/t6')
    if (tool.code === 'T7') navigate('/t7')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-8 py-8">

      {/* Sub-header + selector */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
            {scenario.company.name} · Sprint L.E.A.N.
          </p>
          <h1 className="text-xl font-semibold text-lean-black dark:text-gray-100">
            Roadmap de adopción IA
          </h1>
        </div>
        <ScenarioSelector active={scenario.id} onChange={setPattern} />
      </div>

      <CompanyCard scenario={scenario} />

      {/* MetricHero */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 px-8 py-6 border border-border dark:border-white/6">
        <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-5">
          Indicadores de situación actual
        </p>
        <MetricHeroGrid cols={4} metrics={scenario.heroMetrics} />
      </div>

      {/* Metro Map */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 border border-border dark:border-white/6">
        <PhaseRoadmap phases={scenario.phases} onToolClick={handleToolClick} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="AI Readiness Assessment — T1" subtitle={`Madurez IA por dimensión · ${scenario.company.name}`} height={320}>
          <LeanRadarChart data={scenario.t1Radar} showTarget maxValue={4} />
        </ChartWrapper>
        <ChartWrapper title="KPI Dashboard" subtitle="Impacto medido vs. objetivo (%)" height={320}>
          <LeanBarChart data={DEMO_KPI_DATA} keys={['actual', 'target']} unit="%" referenceValue={70} referenceLabel="Umbral éxito" />
        </ChartWrapper>
      </div>

      <QuickWinCard scenario={scenario} />
    </div>
  )
}

// ── ProtectedRoute — redirige a /login si no autenticado ──────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuthStore()
  // Mientras se comprueba la sesión de Supabase no redirigimos
  if (isInitializing) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <svg className="animate-spin h-6 w-6 text-[#0D1B2A]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ── T1 route wrapper ──────────────────────────────────────────

function T1RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T1View scenario={scenario} onBack={() => navigate('/')} />
}

// ── T2 route wrapper ──────────────────────────────────────────

function T2RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T2View companyName={scenario.company.name} onBack={() => navigate('/')} />
}

// ── T3 route wrapper ──────────────────────────────────────────

function T3RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T3View companyName={scenario.company.name} onBack={() => navigate('/')} />
}

// ── T4 route wrapper ──────────────────────────────────────────

function T4RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T4View companyName={scenario.company.name} onBack={() => navigate('/')} />
}

// ── T5 route wrapper ──────────────────────────────────────────

function T5RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T5View companyName={scenario.company.name} onBack={() => navigate('/')} />
}

// ── T6 route wrapper ──────────────────────────────────────────

function T6RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T6View companyName={scenario.company.name} onBack={() => navigate('/')} />
}

// ── T7 route wrapper ──────────────────────────────────────────

function T7RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T7View companyName={scenario.company.name} onBack={() => navigate('/')} />
}

// ── App root ──────────────────────────────────────────────────

export default function App() {
  const [activePattern, setActivePattern] = useState<DemoPattern>(DEFAULT_DEMO_SCENARIO.id)
  const scenario = getDemoScenario(activePattern)

  // Sprint 3: restaurar sesión Supabase al montar la app
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [initialize])

  return (
    <DemoContext.Provider value={{ scenario, setPattern: setActivePattern }}>
      <Routes>
        {/* Ruta pública — Login (sin AppLayout) */}
        <Route path="login" element={<LoginView />} />

        {/* Rutas protegidas — AppLayout persistente (header + sidebar) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout phases={scenario.phases} />
            </ProtectedRoute>
          }
        >
          <Route index                 element={<DashboardView />} />
          <Route path="company-profile" element={<CompanyProfileView />} />
          <Route path="t1"             element={<T1RouteView />} />
          <Route path="t2"             element={<T2RouteView />} />
          <Route path="t3"             element={<T3RouteView />} />
          <Route path="t4"             element={<T4RouteView />} />
          <Route path="t5"             element={<T5RouteView />} />
          <Route path="t6"             element={<T6RouteView />} />
          <Route path="t7"             element={<T7RouteView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DemoContext.Provider>
  )
}

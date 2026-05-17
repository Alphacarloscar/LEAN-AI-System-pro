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
import { LoginView, ResetPasswordView, useAuthStore } from '@/modules/Auth'
import { AdminView }                              from '@/modules/Admin'
import { T1View }                               from '@/modules/T1_MaturityRadar'
import { T2View }                               from '@/modules/T2_StakeholderMatrix'
import { T3View }                               from '@/modules/T3_ValueStreamMap'
import { T4View }                               from '@/modules/T4_UseCasePriorityBoard'
import { T5View }                               from '@/modules/T5_AITaxonomyCanvas'
import { T6View }                               from '@/modules/T6_RiskGovernance'
import { T7View }                               from '@/modules/T7_AdoptionHeatmap'
import { T8View }                               from '@/modules/T8_CommunicationMap'
import { T9View }                               from '@/modules/T9_AIRoadmap'
import { T10View }                              from '@/modules/T10_AIValueDashboard'
import { T11View }                              from '@/modules/T11_OperatingRhythm'
import { T12View }                              from '@/modules/T12_ISOAssessment'
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

// ── T10 route view — AI Value Dashboard (home screen) ────────

function T10RouteView() {
  const { scenario, setPattern } = useDemoContext()
  const navigate                 = useNavigate()
  return (
    <T10View
      companyName={scenario.company.name}
      sector={scenario.company.industry}
      employees={scenario.company.employees}
      t1Radar={scenario.t1Radar}
      onNavigate={(path) => navigate(path)}
      demoPattern={scenario.id}
      demoScenarios={DEMO_SCENARIOS.map(s => ({ id: s.id, label: s.label }))}
      onPatternChange={(p) => setPattern(p as DemoPattern)}
    />
  )
}

// ── ProtectedRoute — redirige a /login si no autenticado ──────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuthStore()
  // Mientras se comprueba la sesión de Supabase no redirigimos
  if (isInitializing) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <svg className="animate-spin h-6 w-6 text-navy" viewBox="0 0 24 24" fill="none">
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

// ── T8 route wrapper ──────────────────────────────────────────

function T8RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T8View companyName={scenario.company.name} onBack={() => navigate('/')} />
}

// ── T9 route wrapper ──────────────────────────────────────────

function T9RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T9View companyName={scenario.company.name} onBack={() => navigate('/')} />
}

// ── T11 route wrapper ─────────────────────────────────────────

function T11RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return (
    <T11View
      companyName={scenario.company.name}
      t1Radar={scenario.t1Radar}
      employees={scenario.company.employees}
      onBack={() => navigate('/')}
    />
  )
}

// ── T12 route wrapper ─────────────────────────────────────────

function T12RouteView() {
  const { scenario } = useDemoContext()
  const navigate     = useNavigate()
  return <T12View companyName={scenario.company.name} onBack={() => navigate('/')} />
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
        {/* Rutas públicas — sin AppLayout */}
        <Route path="login"          element={<LoginView />} />
        <Route path="reset-password" element={<ResetPasswordView />} />

        {/* Rutas protegidas — AppLayout persistente (header + sidebar) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout phases={scenario.phases} />
            </ProtectedRoute>
          }
        >
          <Route index                 element={<T10RouteView />} />
          <Route path="company-profile" element={<CompanyProfileView />} />
          <Route path="t1"             element={<T1RouteView />} />
          <Route path="t2"             element={<T2RouteView />} />
          <Route path="t3"             element={<T3RouteView />} />
          <Route path="t4"             element={<T4RouteView />} />
          <Route path="t5"             element={<T5RouteView />} />
          <Route path="t6"             element={<T6RouteView />} />
          <Route path="t7"             element={<T7RouteView />} />
          <Route path="t8"             element={<T8RouteView />} />
          <Route path="t9"             element={<T9RouteView />} />
          <Route path="t11"            element={<T11RouteView />} />
          <Route path="t12"            element={<T12RouteView />} />
          <Route path="admin"          element={<AdminView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DemoContext.Provider>
  )
}

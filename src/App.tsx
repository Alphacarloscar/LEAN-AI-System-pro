// ============================================================
// GOBY — App root (Sprint 10)
//
// Sprint 10: Erradicación nuclear de DemoContext.
//   — DemoContext eliminado. Cada View lee companyName directamente de CompanyProfileStore.
//   — T10RouteView pasa solo onNavigate; T10View se autoabastece.
//   — ProjectRuntimeProvider orquesta el contexto base de proyecto.
// ============================================================

import { useEffect }                            from 'react'
import { Spinner, ToastProvider }               from '@shared/design-system/components'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppLayout }                            from '@/shared/layouts/AppLayout'
import { LoginView, ResetPasswordView, UpdatePasswordView, useAuthStore } from '@/modules/Auth'
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

// ── ProtectedRoute — redirige a /login si no autenticado ──────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing, needsPasswordUpdate } = useAuthStore()
  console.debug('[ROUTE] ProtectedRoute render — isInitializing:', isInitializing, 'isAuthenticated:', isAuthenticated)
  if (isInitializing) return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-warm-950">
      <Spinner size="lg" label="Inicializando aplicación…" className="text-navy" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (needsPasswordUpdate) return <Navigate to="/update-password" replace />
  return <>{children}</>
}

// ── Route wrappers — sin DemoContext, sin companyName prop ────
// Cada View lee companyName directamente de CompanyProfileStore.

function T1RouteView() {
  const navigate = useNavigate()
  return <T1View onBack={() => navigate('/')} />
}

function T2RouteView() {
  const navigate = useNavigate()
  return <T2View onBack={() => navigate('/')} />
}

function T3RouteView() {
  const navigate = useNavigate()
  return <T3View onBack={() => navigate('/')} />
}

function T4RouteView() {
  const navigate = useNavigate()
  return <T4View onBack={() => navigate('/')} />
}

function T5RouteView() {
  const navigate = useNavigate()
  return <T5View onBack={() => navigate('/')} />
}

function T6RouteView() {
  const navigate = useNavigate()
  return <T6View onBack={() => navigate('/')} />
}

function T7RouteView() {
  const navigate = useNavigate()
  return <T7View onBack={() => navigate('/')} />
}

function T8RouteView() {
  const navigate = useNavigate()
  return <T8View onBack={() => navigate('/')} />
}

function T9RouteView() {
  const navigate = useNavigate()
  return <T9View onBack={() => navigate('/')} />
}

function T10RouteView() {
  const navigate = useNavigate()
  return <T10View onNavigate={(path) => navigate(path)} />
}

function T11RouteView() {
  const navigate = useNavigate()
  return <T11View onBack={() => navigate('/')} />
}

function T12RouteView() {
  const navigate = useNavigate()
  return <T12View onBack={() => navigate('/')} />
}

// ── App root ──────────────────────────────────────────────────

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [initialize])

  return (
    <ToastProvider>
    <Routes>
      {/* Rutas públicas — sin AppLayout */}
      <Route path="login"            element={<LoginView />} />
      <Route path="reset-password"   element={<ResetPasswordView />} />
      <Route path="update-password"  element={<UpdatePasswordView />} />

      {/* Rutas protegidas — AppLayout persistente (header + sidebar) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index                  element={<T10RouteView />} />
        <Route path="company-profile" element={<CompanyProfileView />} />
        <Route path="t1"              element={<T1RouteView />} />
        <Route path="t2"              element={<T2RouteView />} />
        <Route path="t3"              element={<T3RouteView />} />
        <Route path="t4"              element={<T4RouteView />} />
        <Route path="t5"              element={<T5RouteView />} />
        <Route path="t6"              element={<T6RouteView />} />
        <Route path="t7"              element={<T7RouteView />} />
        <Route path="t8"              element={<T8RouteView />} />
        <Route path="t9"              element={<T9RouteView />} />
        <Route path="t11"             element={<T11RouteView />} />
        <Route path="t12"             element={<T12RouteView />} />
        <Route path="admin"           element={<AdminView />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ToastProvider>
  )
}

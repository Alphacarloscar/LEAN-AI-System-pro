// ============================================================
// GOBY — App root (Sprint 10)
//
// Sprint 10: Erradicación nuclear de DemoContext.
//   — DemoContext eliminado. Cada View lee companyName directamente de CompanyProfileStore.
//   — T10RouteView pasa solo onNavigate; T10View se autoabastece.
//   — ProjectRuntimeProvider orquesta el contexto base de proyecto.
// ============================================================

import { useEffect }                                        from 'react'
import { Spinner, ToastProvider }                           from '@shared/design-system/components'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useProjectStore }                              from '@/modules/Engagement/store'
import { AppLayout }                            from '@/shared/layouts/AppLayout'
import { ProjectMembershipGuard }                from '@/shared/guards/ProjectMembershipGuard'
import { LoginView, ResetPasswordView, UpdatePasswordView, useAuthStore } from '@/modules/Auth'
import { AdminView, CompanyDetailView, ProjectDetailView, UserDetailView } from '@/modules/Admin'
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
import { UserProfileView }                      from '@/modules/UserProfile'
import { ProjectMembersRouteView }              from '@/modules/ProjectMembers'
import { PUBLIC_ROUTES, EVALUATION_ROUTES, EVALUATION_ROUTE_PATTERNS, ADMIN_ROUTES, DEFAULT_REDIRECT } from '@/config/routes'

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

// ── useProjectSync — sincroniza el store con el param de la URL ──
// Garantiza que el store global refleje siempre el project de la URL.
// Es un hook interno de App; no se exporta ni se reutiliza fuera de aquí.
function useProjectSync() {
  const { projectId } = useParams<{ projectId: string }>()
  const selectProject = useProjectStore((s) => s.selectProject)
  const storeProjectId = useProjectStore((s) => s.activeProjectId)

  useEffect(() => {
    if (projectId && projectId !== storeProjectId) {
      selectProject(projectId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])
}

// ── Route wrappers — sin DemoContext, sin companyName prop ────
// Cada RouteView sincroniza el store desde la URL y delega al View.

function T1RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T1View onBack={() => navigate('/')} />
}

function T2RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T2View onBack={() => navigate('/')} />
}

function T3RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T3View onBack={() => navigate('/')} />
}

function T4RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T4View onBack={() => navigate('/')} />
}

function T5RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T5View onBack={() => navigate('/')} />
}

function T6RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T6View onBack={() => navigate('/')} />
}

function T7RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T7View onBack={() => navigate('/')} />
}

function T8RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T8View onBack={() => navigate('/')} />
}

function T9RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T9View onBack={() => navigate('/')} />
}

function T10RouteView() {
  const navigate = useNavigate()
  return <T10View onNavigate={(path) => navigate(path)} />
}

function T11RouteView() {
  useProjectSync()
  const navigate = useNavigate()
  return <T11View onBack={() => navigate('/')} />
}

function T12RouteView() {
  useProjectSync()
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
      <Route path={PUBLIC_ROUTES.LOGIN}           element={<LoginView />} />
      <Route path={PUBLIC_ROUTES.RESET_PASSWORD}  element={<ResetPasswordView />} />
      <Route path={PUBLIC_ROUTES.UPDATE_PASSWORD} element={<UpdatePasswordView />} />

      {/* Rutas protegidas — AppLayout persistente (header + sidebar) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard / Evaluación */}
        <Route path={EVALUATION_ROUTES.ROOT}     element={<T10RouteView />} />
        <Route path={EVALUATION_ROUTES.PROFILE}  element={<UserProfileView />} />
        <Route path="/company-profile"           element={<CompanyProfileView />} />

        {/* Herramientas T1-T12 — bajo guarda de membresía de proyecto */}
        <Route path={EVALUATION_ROUTE_PATTERNS.PROJECT_ROOT} element={<ProjectMembershipGuard />}>
          <Route path={EVALUATION_ROUTE_PATTERNS.T1}  element={<T1RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T2}  element={<T2RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T3}  element={<T3RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T4}  element={<T4RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T5}  element={<T5RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T6}  element={<T6RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T7}  element={<T7RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T8}  element={<T8RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T9}  element={<T9RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T10} element={<T10RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T11} element={<T11RouteView />} />
          <Route path={EVALUATION_ROUTE_PATTERNS.T12} element={<T12RouteView />} />
          {/* Gestión de miembros del proyecto */}
          <Route path={EVALUATION_ROUTE_PATTERNS.MEMBERS} element={<ProjectMembersRouteView />} />
        </Route>

        {/* Admin */}
        <Route path={ADMIN_ROUTES.ROOT} element={<AdminView />} />
        <Route path="/admin/companies/:companyId" element={<CompanyDetailView />} />
        <Route path="/admin/companies/:companyId/projects/:projectId" element={<ProjectDetailView />} />
        <Route path="/admin/users/:userId" element={<UserDetailView />} />
      </Route>

      {/* Fallback — redirigir a /evaluation */}
      <Route path="*" element={<Navigate to={DEFAULT_REDIRECT} replace />} />
    </Routes>
    </ToastProvider>
  )
}

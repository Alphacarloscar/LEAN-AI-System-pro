// ============================================================
// GOBY — App root (Sprint 10)
//
// Sprint 10: Erradicación nuclear de DemoContext.
//   — DemoContext eliminado. Cada View lee companyName directamente de CompanyProfileStore.
//   — T10RouteView pasa solo onNavigate; T10View se autoabastece.
//   — ProjectRuntimeProvider orquesta el contexto base de proyecto.
// ============================================================

import { useEffect }                                        from 'react'
import { Spinner }                                          from '@shared/design-system/components'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEngagementStore }                              from '@/modules/Engagement/store'
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
import { PackageDashboardView }                 from '@/modules/Packages/PackageDashboardView'
import { PackageEngagementGuard }               from '@/shared/components/PackageEngagementGuard'
import { isPackageNavEnabled }                  from '@/config/featureFlags'
import type { ToolCode }                        from '@/types'
import {
  isPackageId,
  isToolAllowedInPackage,
  STANDALONE_TOOLS,
}                                               from '@/config/salesPackages'
import {
  toolCodeFromSlug,
  buildPackageDashboardPath,
  getToolRouteDefinition,
}                                               from '@/config/toolRoutes'

// ── ProtectedRoute — redirige a /login si no autenticado ──────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing, needsPasswordUpdate } = useAuthStore()
  console.debug('[ROUTE] ProtectedRoute render — isInitializing:', isInitializing, 'isAuthenticated:', isAuthenticated)
  if (isInitializing) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size="lg" label="Inicializando aplicación…" className="text-navy" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (needsPasswordUpdate) return <Navigate to="/update-password" replace />
  return <>{children}</>
}

// ── useEngagementSync — sincroniza el store con el param de la URL ──
// Garantiza que el store global refleje siempre el engagement de la URL.
// Es un hook interno de App; no se exporta ni se reutiliza fuera de aquí.
function useEngagementSync() {
  const { engagementId }  = useParams<{ engagementId: string }>()
  const selectEngagement  = useEngagementStore((s) => s.selectEngagement)
  const storeId           = useEngagementStore((s) => s.activeEngagementId)

  useEffect(() => {
    if (engagementId && engagementId !== storeId) {
      selectEngagement(engagementId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])
}

// ── Route wrappers — sin DemoContext, sin companyName prop ────
// Cada RouteView sincroniza el store desde la URL y delega al View.

function T1RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T1View onBack={() => navigate('/')} />
}

function T2RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T2View onBack={() => navigate('/')} />
}

function T3RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T3View onBack={() => navigate('/')} />
}

function T4RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T4View onBack={() => navigate('/')} />
}

function T5RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T5View onBack={() => navigate('/')} />
}

function T6RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T6View onBack={() => navigate('/')} />
}

function T7RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T7View onBack={() => navigate('/')} />
}

function T8RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T8View onBack={() => navigate('/')} />
}

function T9RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T9View onBack={() => navigate('/')} />
}

function T10RouteView() {
  const navigate = useNavigate()
  return <T10View onNavigate={(path) => navigate(path)} />
}

function T11RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T11View onBack={() => navigate('/')} />
}

function T12RouteView() {
  useEngagementSync()
  const navigate = useNavigate()
  return <T12View onBack={() => navigate('/')} />
}

// ============================================================
// FDR-002 · Bloque 2 — Routing aditivo de paquetes (Opción D)
//
// Rutas LIMPIAS, sin engagementId visible: el engagement lo resuelve
// el store (PackageEngagementGuard lo garantiza). NO se llama a
// useEngagementSync aquí (no hay param que sincronizar).
//
// Solo se registran con flag ON. Con flag OFF, cualquier /packages/*
// o /tools/* cae al fallback '*' → Navigate '/'. Cero rutas nuevas.
// ============================================================

// Registro tool → render(onBack). Excluye T10 (índice, API onNavigate;
// nunca vive en paquete ni como /tools standalone).
type PackagedToolCode = Exclude<ToolCode, 'T10'>
const TOOL_VIEW_BY_CODE: Record<PackagedToolCode, (onBack: () => void) => JSX.Element> = {
  T1:  (onBack) => <T1View  onBack={onBack} />,
  T2:  (onBack) => <T2View  onBack={onBack} />,
  T3:  (onBack) => <T3View  onBack={onBack} />,
  T4:  (onBack) => <T4View  onBack={onBack} />,
  T5:  (onBack) => <T5View  onBack={onBack} />,
  T6:  (onBack) => <T6View  onBack={onBack} />,
  T7:  (onBack) => <T7View  onBack={onBack} />,
  T8:  (onBack) => <T8View  onBack={onBack} />,
  T9:  (onBack) => <T9View  onBack={onBack} />,
  T11: (onBack) => <T11View onBack={onBack} />,
  T12: (onBack) => <T12View onBack={onBack} />,
}

// Las 3 RouteView solo VALIDAN la URL y eligen vista. El engagement
// activo lo garantiza el guard de layout padre (PackageEngagementGuard),
// no cada vista → cero duplicación.

// Dashboard de paquete: /packages/:packageId
function PackageDashboardRouteView() {
  const { packageId } = useParams<{ packageId: string }>()
  if (!packageId || !isPackageId(packageId)) return <Navigate to="/" replace />
  return <PackageDashboardView packageId={packageId} />
}

// Tool dentro de un paquete: /packages/:packageId/tools/:toolSlug
function PackageToolRouteView() {
  const { packageId, toolSlug } = useParams<{ packageId: string; toolSlug: string }>()
  const navigate = useNavigate()

  if (!packageId || !isPackageId(packageId)) return <Navigate to="/" replace />
  const code = toolSlug ? toolCodeFromSlug(toolSlug) : null
  // Combinación inválida (slug inexistente o tool fuera del paquete) → fuera.
  if (!code || !isToolAllowedInPackage(packageId, code)) return <Navigate to="/" replace />

  const render = TOOL_VIEW_BY_CODE[code as PackagedToolCode]
  if (!render) return <Navigate to="/" replace />

  // "Volver" en contexto de paquete → al dashboard del paquete.
  return render(() => navigate(buildPackageDashboardPath(packageId)))
}

// Tool standalone fuera de paquete: /tools/:toolSlug (hoy solo T12).
function StandaloneToolRouteView() {
  const { toolSlug } = useParams<{ toolSlug: string }>()
  const navigate = useNavigate()

  const code = toolSlug ? toolCodeFromSlug(toolSlug) : null
  // Debe ser standalone (STANDALONE_TOOLS) y NO una ruta índice (T10 vive
  // en '/', nunca en /tools). Rechazo semántico vía isIndexRoute, no por
  // string hardcodeado: si mañana otra tool fuera índice, sigue protegido.
  if (!code || !STANDALONE_TOOLS.includes(code) || getToolRouteDefinition(code).isIndexRoute) {
    return <Navigate to="/" replace />
  }

  const render = TOOL_VIEW_BY_CODE[code as PackagedToolCode]
  if (!render) return <Navigate to="/" replace />

  return render(() => navigate('/'))
}

// ── App root ──────────────────────────────────────────────────

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [initialize])

  return (
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
        <Route path="t1/:engagementId"  element={<T1RouteView />} />
        <Route path="t2/:engagementId"  element={<T2RouteView />} />
        <Route path="t3/:engagementId"  element={<T3RouteView />} />
        <Route path="t4/:engagementId"  element={<T4RouteView />} />
        <Route path="t5/:engagementId"  element={<T5RouteView />} />
        <Route path="t6/:engagementId"  element={<T6RouteView />} />
        <Route path="t7/:engagementId"  element={<T7RouteView />} />
        <Route path="t8/:engagementId"  element={<T8RouteView />} />
        <Route path="t9/:engagementId"  element={<T9RouteView />} />
        <Route path="t11/:engagementId" element={<T11RouteView />} />
        <Route path="t12/:engagementId" element={<T12RouteView />} />
        <Route path="admin"           element={<AdminView />} />

        {/* FDR-002 · Bloque 2 — rutas de paquete SOLO con flag ON.
            Flag OFF → estas rutas no existen → fallback '*' redirige a '/'.
            Guard de engagement como ruta padre (Outlet): se aplica una sola
            vez a las 3 rutas → nada renderiza T1–T9/T11/T12 sin engagement. */}
        {isPackageNavEnabled() && (
          <Route element={<PackageEngagementGuard />}>
            <Route path="packages/:packageId"                  element={<PackageDashboardRouteView />} />
            <Route path="packages/:packageId/tools/:toolSlug"  element={<PackageToolRouteView />} />
            <Route path="tools/:toolSlug"                      element={<StandaloneToolRouteView />} />
          </Route>
        )}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

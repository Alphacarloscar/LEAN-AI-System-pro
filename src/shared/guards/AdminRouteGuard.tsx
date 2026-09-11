import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/modules/Auth'
import { canAccessAdmin } from '@/modules/Auth/usePermissions'

export function AdminRouteGuard() {
  const { user } = useAuthStore()

  if (!canAccessAdmin(user?.role)) {
    return <Navigate to="/evaluation" replace />
  }

  return <Outlet />
}

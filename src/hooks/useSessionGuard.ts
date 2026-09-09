// ============================================================
// useSessionGuard — Invalidar sesión si proyecto no está activo
//
// Epic 10: Cascading delete and entity lifecycle
// Implementa invalidación de sesión en tiempo real.
//
// Comportamiento:
// Si project.status !== 'active' → logout()
// Se ejecuta periódicamente mientras hay un proyecto seleccionado
// ============================================================

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/modules/Auth'
import { useEngagementStore } from '@/modules/Engagement/store'
import { useNavigate } from 'react-router-dom'
import { PUBLIC_ROUTES } from '@/config/routes'
import { supabase } from '@/lib/supabase'

/**
 * Hook que valida que el proyecto activo sigue en estado 'active'.
 * Si cambia a paused/archived/completed, cierra automáticamente la sesión.
 * Se ejecuta periódicamente (cada 5 segundos) mientras hay sesión activa.
 */
export function useSessionGuard() {
  const { user, logout } = useAuthStore()
  const { activeProjectId } = useEngagementStore()
  const navigate = useNavigate()
  const checkingRef = useRef(false)

  useEffect(() => {
    if (!user || !activeProjectId) {
      return
    }

    const checkProjectStatus = async () => {
      if (checkingRef.current) return
      checkingRef.current = true

      try {
        // Consultar estado actual del proyecto en BD
        const { data: project, error } = await supabase
          .from('projects')
          .select('id, name, status')
          .eq('id', activeProjectId)
          .single()

        if (error) {
          console.warn('[useSessionGuard] Error fetching project:', error.message)
          checkingRef.current = false
          return
        }

        // Si el proyecto no está active → logout
        if (project && project.status !== 'active') {
          console.warn('[useSessionGuard] Proyecto no activo, cerrando sesión:', {
            projectId: activeProjectId,
            projectName: project.name,
            status: project.status,
          })

          await logout()
          navigate(PUBLIC_ROUTES.LOGIN, { replace: true })
        }
      } catch (err) {
        console.warn('[useSessionGuard] Error en verificación de sesión:', err)
      } finally {
        checkingRef.current = false
      }
    }

    // Ejecutar verificación inmediatamente y luego cada 5 segundos
    checkProjectStatus()
    const interval = setInterval(checkProjectStatus, 5000)

    return () => clearInterval(interval)
  }, [user, activeProjectId, logout, navigate])
}

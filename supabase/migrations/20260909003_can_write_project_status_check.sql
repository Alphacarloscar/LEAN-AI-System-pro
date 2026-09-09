-- ============================================================
-- Migration: Actualizar can_write_project para verificar status activo
-- Fecha: 2026-09-09
--
-- PROPÓSITO:
--   Modificar la función can_write_project() para que devuelva FALSE
--   si el proyecto está en estado no-activo (paused, archived, completed).
--
--   Esto hace que todos los INSERT/UPDATE/DELETE fallen con 403
--   para cualquier rol cuando el proyecto no esté en estado 'active'.
--
-- NOTA: Esta función se utiliza en todas las RLS policies de escritura
--       en tablas vinculadas a proyectos (project_members, company_profiles,
--       t1_dimension_scores, etc.).
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_write_project(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    -- El proyecto debe estar en estado 'active'
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = pid AND status = 'active'
    )
    AND
    (
      -- Creador del proyecto puede escribir
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE  id = pid AND owner_id = auth.uid()
      )
      OR
      -- Consultor asignado explícitamente puede escribir
      EXISTS (
        SELECT 1 FROM public.project_members
        WHERE  project_id = pid
          AND  user_id    = auth.uid()
          AND  role       = 'consultant'
      )
      OR
      -- Platform admin puede escribir todo
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
    );
$$;

COMMENT ON FUNCTION public.can_write_project(pid uuid) IS
  'Función de RLS que verifica si el usuario puede escribir en un proyecto. '
  'Retorna FALSE si el proyecto NO está en estado "active". '
  'De lo contrario, verifica que el usuario es: creator, assigned consultant, o platform admin. '
  'Actualizado en migración 20260909 para incluir verificación de estado.';

-- Verificación post-migration
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'can_write_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260909_003 OK] can_write_project actualizado para verificar project.status';
  ELSE
    RAISE EXCEPTION '[20260909_003 FAIL] can_write_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;

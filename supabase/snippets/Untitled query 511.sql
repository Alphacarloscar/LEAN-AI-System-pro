-- ============================================================
-- Migration: Crear RPC delete_project para eliminar proyectos
-- Fecha: 2026-08-28
--
-- PROPÓSITO:
--   Permitir que superadmin/consultant eliminen proyectos.
--   Limpia project_members y company_profiles asociados.
--   Solo el propietario o un superadmin pueden eliminar.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_project_owner uuid;
BEGIN
  -- ── Autorización ──────────────────────────────────────────────
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'delete_project: usuario no autenticado o sin perfil en public.profiles';
  END IF;

  IF v_caller_role NOT IN ('superadmin', 'consultant') THEN
    RAISE EXCEPTION 'delete_project: acceso denegado. Rol % no está autorizado a eliminar proyectos.', v_caller_role;
  END IF;

  -- ── Validar que el proyecto existe ─────────────────────────────
  SELECT owner_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL THEN
    RAISE EXCEPTION 'delete_project: proyecto % no existe', p_project_id;
  END IF;

  -- ── Autorización a nivel de proyecto ────────────────────────────
  IF v_caller_role = 'consultant' AND v_project_owner != auth.uid() THEN
    RAISE EXCEPTION 'delete_project: consultant solo puede eliminar sus propios proyectos';
  END IF;

  -- ── Limpiar datos asociados ────────────────────────────────────
  -- Eliminar company_profiles asociados al proyecto
  DELETE FROM public.company_profiles
  WHERE engagement_id = p_project_id;

  -- Eliminar project_members asociados
  DELETE FROM public.project_members
  WHERE project_id = p_project_id;

  -- ── Eliminar el proyecto ──────────────────────────────────────
  DELETE FROM public.projects
  WHERE id = p_project_id;
END;
$$;

COMMENT ON FUNCTION public.delete_project(uuid) IS
  'Elimina un proyecto y sus datos asociados (company_profiles, project_members). '
  'Superadmin puede eliminar cualquier proyecto. '
  'Consultant solo puede eliminar sus propios proyectos.';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.delete_project(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_project(uuid) TO authenticated;

-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'delete_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260828 OK] delete_project creado con limpieza de datos asociados';
  ELSE
    RAISE EXCEPTION '[20260828 FAIL] delete_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;

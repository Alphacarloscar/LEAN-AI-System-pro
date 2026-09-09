-- ============================================================
-- Migration: RPC delete_company con validación de condiciones previas
-- Fecha: 2026-09-09
--
-- PROPÓSITO:
--   Permitir que superadmin elimine empresas solo si:
--   1. COUNT(projects WHERE company_id = X) = 0
--   2. COUNT(user_company_assignments WHERE company_id = X AND role != 'superadmin') = 0
--
--   Si no se cumplen, devolver error descriptivo.
--   Si se cumplen, eliminar en transacción:
--   - DELETE FROM departments WHERE company_id = X
--   - DELETE FROM persons WHERE company_id = X
--   - DELETE FROM companies WHERE id = X
--
-- RETURNS: jsonb con {success: bool, message: text, company_id: uuid}
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_company(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_projects_count integer;
  v_non_admin_users_count integer;
  v_company_name text;
  v_result jsonb;
BEGIN
  -- ── Autorización: solo superadmin puede borrar empresas ──────────
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'delete_company: usuario no autenticado o sin perfil en public.profiles';
  END IF;

  IF v_caller_role != 'superadmin' THEN
    RAISE EXCEPTION 'delete_company: acceso denegado. Solo superadmin puede eliminar empresas.';
  END IF;

  -- ── Validar que la empresa existe ──────────────────────────────
  SELECT name INTO v_company_name
  FROM public.companies
  WHERE id = p_company_id;

  IF v_company_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Empresa no encontrada: ' || p_company_id,
      'company_id', p_company_id
    );
  END IF;

  -- ── Condición 1: verificar que no hay proyectos ────────────────
  SELECT COUNT(*) INTO v_projects_count
  FROM public.projects
  WHERE company_id = p_company_id;

  IF v_projects_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format(
        'No se puede eliminar la empresa "%s". Tiene %s proyecto(s) activo(s). Elimine primero todos los proyectos.',
        v_company_name,
        v_projects_count
      ),
      'company_id', p_company_id,
      'blocking_entity', 'projects',
      'blocking_count', v_projects_count
    );
  END IF;

  -- ── Condición 2: verificar que no hay usuarios no-admin asignados ────
  -- user_company_assignments es una tabla que vincula usuarios a empresas con rol específico
  -- Si NO existe esa tabla, contar los perfiles con company_id
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_company_assignments'
  ) THEN
    SELECT COUNT(*) INTO v_non_admin_users_count
    FROM public.user_company_assignments
    WHERE company_id = p_company_id AND role != 'superadmin';
  ELSE
    -- Fallback: contar profiles sin role admin/superadmin
    SELECT COUNT(*) INTO v_non_admin_users_count
    FROM public.profiles
    WHERE company_id = p_company_id AND role NOT IN ('admin', 'superadmin');
  END IF;

  IF v_non_admin_users_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format(
        'No se puede eliminar la empresa "%s". Tiene %s usuario(s) asignado(s). Desasigne primero todos los usuarios.',
        v_company_name,
        v_non_admin_users_count
      ),
      'company_id', p_company_id,
      'blocking_entity', 'users',
      'blocking_count', v_non_admin_users_count
    );
  END IF;

  -- ── Ejecutar cascada de borrado en transacción ──────────────────
  BEGIN
    -- Paso 1: Eliminar departamentos
    DELETE FROM public.departments
    WHERE company_id = p_company_id;

    -- Paso 2: Eliminar personas
    DELETE FROM public.persons
    WHERE company_id = p_company_id;

    -- Paso 3: Eliminar empresa
    DELETE FROM public.companies
    WHERE id = p_company_id;

    -- ── Log de auditoría (si existe tabla audit_log) ──────────────
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'audit_log'
    ) THEN
      INSERT INTO public.audit_log (
        entity_type,
        entity_id,
        action,
        actor_id,
        changes,
        created_at
      )
      VALUES (
        'company',
        p_company_id,
        'delete',
        auth.uid(),
        jsonb_build_object(
          'deleted_company', v_company_name,
          'reason', 'Eliminación solicitada por superadmin'
        ),
        now()
      );
    END IF;

    v_result := jsonb_build_object(
      'success', true,
      'message', format('Empresa "%s" eliminada correctamente.', v_company_name),
      'company_id', p_company_id
    );

    RETURN v_result;

  EXCEPTION WHEN OTHERS THEN
    -- Rollback automático por transacción anidada en la función
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error al eliminar empresa: ' || SQLERRM,
      'company_id', p_company_id,
      'error_code', SQLSTATE
    );
  END;
END;
$$;

COMMENT ON FUNCTION public.delete_company(uuid) IS
  'Elimina una empresa solo si: (1) no tiene proyectos, (2) no tiene usuarios no-admin asignados. '
  'Ejecuta cascada: departamentos → personas → empresa. '
  'Solo superadmin. '
  'RETURNS jsonb con {success: bool, message: text, company_id: uuid}.';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.delete_company(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_company(uuid) TO authenticated;


-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'delete_company'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260909_001 OK] delete_company creado con validación de condiciones previas';
  ELSE
    RAISE EXCEPTION '[20260909_001 FAIL] delete_company no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;

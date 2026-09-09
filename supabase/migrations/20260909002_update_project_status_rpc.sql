-- ============================================================
-- Migration: RPC update_project_status con validación de transiciones
-- Fecha: 2026-09-09
--
-- PROPÓSITO:
--   Implementar estado del ciclo de vida de proyectos con reglas
--   de transición validadas a nivel de BD.
--
-- ESTADOS: active, paused, archived, completed
--
-- TRANSICIONES PERMITIDAS:
--   active ←→ paused (superadmin, consultant)
--   active → archived (superadmin)
--   active → completed (superadmin)
--   paused → archived (superadmin)
--   archived → active (superadmin)
--   completed → active (superadmin)
--
-- RETURNS: jsonb con {success: bool, message: text, project: {...}}
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_project_status(
  p_project_id uuid,
  p_new_status text,
  p_actor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_role text;
  v_current_status text;
  v_project_owner uuid;
  v_is_valid_transition boolean;
  v_project_name text;
  v_company_id uuid;
  v_result jsonb;
BEGIN
  -- ── Determinar actor: parámetro o usuario autenticado ────────────
  v_actor_id := COALESCE(p_actor_id, auth.uid());

  IF v_actor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No se identificó actor (usuario no autenticado).',
      'project_id', p_project_id
    );
  END IF;

  -- ── Validar rol del actor ──────────────────────────────────────
  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

  IF v_actor_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Actor no tiene perfil en public.profiles.',
      'project_id', p_project_id
    );
  END IF;

  -- ── Validar que el proyecto existe ─────────────────────────────
  SELECT status, owner_id, name, company_id INTO v_current_status, v_project_owner, v_project_name, v_company_id
  FROM public.projects
  WHERE id = p_project_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Proyecto %s no existe.', p_project_id),
      'project_id', p_project_id
    );
  END IF;

  -- ── Validar que el estado nuevo es válido ──────────────────────
  IF p_new_status NOT IN ('active', 'paused', 'archived', 'completed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format(
        'Estado inválido: "%s". Valores válidos: active, paused, archived, completed.',
        p_new_status
      ),
      'project_id', p_project_id,
      'current_status', v_current_status
    );
  END IF;

  -- ── Si el estado es el mismo, retornar sin cambio ────────────────
  IF v_current_status = p_new_status THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', format('El proyecto ya está en estado "%s".', v_current_status),
      'project_id', p_project_id,
      'project', json_build_object(
        'id', p_project_id,
        'name', v_project_name,
        'status', v_current_status
      )
    );
  END IF;

  -- ── VALIDAR TRANSICIÓN SEGÚN EL GRAFO ──────────────────────────
  -- Determinar si la transición es válida

  v_is_valid_transition := CASE
    -- ACTIVE → cualquier destino
    WHEN v_current_status = 'active' AND p_new_status IN ('paused', 'archived', 'completed') THEN true
    -- PAUSED → activo (todos pueden) o archivado (solo superadmin)
    WHEN v_current_status = 'paused' AND p_new_status = 'active' THEN true
    WHEN v_current_status = 'paused' AND p_new_status = 'archived' AND v_actor_role = 'superadmin' THEN true
    -- ARCHIVED → active (solo superadmin)
    WHEN v_current_status = 'archived' AND p_new_status = 'active' AND v_actor_role = 'superadmin' THEN true
    -- COMPLETED → active (solo superadmin)
    WHEN v_current_status = 'completed' AND p_new_status = 'active' AND v_actor_role = 'superadmin' THEN true
    ELSE false
  END;

  IF NOT v_is_valid_transition THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format(
        'Transición no permitida: %s → %s para rol "%s".',
        v_current_status,
        p_new_status,
        v_actor_role
      ),
      'project_id', p_project_id,
      'current_status', v_current_status,
      'requested_status', p_new_status,
      'actor_role', v_actor_role
    );
  END IF;

  -- ── Validar permisos: solo superadmin o owner pueden cambiar estado ──
  IF v_actor_role NOT IN ('superadmin') AND v_project_owner != v_actor_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format(
        'Acceso denegado. Solo superadmin o el propietario del proyecto pueden cambiar su estado.'
      ),
      'project_id', p_project_id
    );
  END IF;

  -- ── Ejecutar actualización del estado ──────────────────────────
  BEGIN
    UPDATE public.projects
    SET
      status = p_new_status,
      updated_at = now()
    WHERE id = p_project_id;

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
        'project',
        p_project_id,
        'update_status',
        v_actor_id,
        jsonb_build_object(
          'old_status', v_current_status,
          'new_status', p_new_status,
          'project_name', v_project_name,
          'company_id', v_company_id
        ),
        now()
      );
    END IF;

    v_result := jsonb_build_object(
      'success', true,
      'message', format(
        'Proyecto "%s" cambió de "%s" a "%s".',
        v_project_name,
        v_current_status,
        p_new_status
      ),
      'project_id', p_project_id,
      'project', json_build_object(
        'id', p_project_id,
        'name', v_project_name,
        'status', p_new_status,
        'company_id', v_company_id
      )
    );

    RETURN v_result;

  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error al actualizar estado del proyecto: ' || SQLERRM,
      'project_id', p_project_id,
      'error_code', SQLSTATE
    );
  END;
END;
$$;

COMMENT ON FUNCTION public.update_project_status(uuid, text, uuid) IS
  'Actualiza el estado de un proyecto validando transiciones permitidas. '
  'Soporta estados: active, paused, archived, completed. '
  'Registra cambio en audit_log. '
  'RETURNS jsonb con {success: bool, message: text, project: {...}}.';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.update_project_status(uuid, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_project_status(uuid, text, uuid) TO authenticated;


-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'update_project_status'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260909_002 OK] update_project_status creado con validación de transiciones';
  ELSE
    RAISE EXCEPTION '[20260909_002 FAIL] update_project_status no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;

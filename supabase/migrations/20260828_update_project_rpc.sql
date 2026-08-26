-- ============================================================
-- Migration: Crear RPC update_project para editar proyectos
-- Fecha: 2026-08-28
--
-- PROPÓSITO:
--   Permitir que superadmin/consultant actualicen campos de un proyecto:
--   - name
--   - objetivo_principal
--   - restricciones
--   - horizonte_valor
--   - ecosistema_tecnologico
--   - fricciones_oportunidades (JSONB array)
--   - areas_prioritarias (TEXT[] de nombres de departamentos)
--
--   Solo el propietario del proyecto o un superadmin puede actualizarlo.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_project(
  p_project_id uuid,
  p_name text DEFAULT NULL,
  p_objetivo_principal text DEFAULT NULL,
  p_restricciones text DEFAULT NULL,
  p_horizonte_valor text DEFAULT NULL,
  p_ecosistema_tecnologico text DEFAULT NULL,
  p_fricciones_oportunidades jsonb DEFAULT NULL,
  p_areas_prioritarias text[] DEFAULT NULL
)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_project_owner uuid;
  v_project projects;
BEGIN
  -- ── Autorización ──────────────────────────────────────────────
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'update_project: usuario no autenticado o sin perfil en public.profiles';
  END IF;

  IF v_caller_role NOT IN ('superadmin', 'consultant') THEN
    RAISE EXCEPTION 'update_project: acceso denegado. Rol % no está autorizado a actualizar proyectos.', v_caller_role;
  END IF;

  -- ── Validar que el proyecto existe ─────────────────────────────
  SELECT owner_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL THEN
    RAISE EXCEPTION 'update_project: proyecto % no existe', p_project_id;
  END IF;

  -- ── Autorización a nivel de proyecto ────────────────────────────
  -- Superadmin puede actualizar cualquier proyecto
  -- Consultant solo puede actualizar sus propios proyectos
  IF v_caller_role = 'consultant' AND v_project_owner != auth.uid() THEN
    RAISE EXCEPTION 'update_project: consultant solo puede actualizar sus propios proyectos';
  END IF;

  -- ── Actualizar campos ──────────────────────────────────────────
  UPDATE public.projects
  SET
    name = COALESCE(NULLIF(p_name, ''), name),
    objetivo_principal = CASE WHEN p_objetivo_principal IS NOT NULL THEN trim(p_objetivo_principal) ELSE objetivo_principal END,
    restricciones = CASE WHEN p_restricciones IS NOT NULL THEN trim(p_restricciones) ELSE restricciones END,
    horizonte_valor = COALESCE(p_horizonte_valor, horizonte_valor),
    ecosistema_tecnologico = COALESCE(p_ecosistema_tecnologico, ecosistema_tecnologico),
    fricciones_oportunidades = COALESCE(p_fricciones_oportunidades, fricciones_oportunidades),
    areas_prioritarias = COALESCE(p_areas_prioritarias, areas_prioritarias),
    updated_at = now()
  WHERE id = p_project_id
  RETURNING * INTO v_project;

  RETURN v_project;
END;
$$;

COMMENT ON FUNCTION public.update_project(uuid, text, text, text, text, text, jsonb, text[]) IS
  'Actualiza campos de un proyecto existente. '
  'Superadmin puede actualizar cualquier proyecto. '
  'Consultant solo puede actualizar sus propios proyectos. '
  'p_fricciones_oportunidades es JSONB array de fricciones estructuradas.';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.update_project(uuid, text, text, text, text, text, jsonb, text[]) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_project(uuid, text, text, text, text, text, jsonb, text[]) TO authenticated;

-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'update_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260828 OK] update_project creado con soporte para fricciones JSONB';
  ELSE
    RAISE EXCEPTION '[20260828 FAIL] update_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;

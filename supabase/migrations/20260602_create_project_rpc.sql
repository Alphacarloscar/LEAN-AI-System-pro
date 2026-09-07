-- ================================================================
-- Migration: create_project RPC
-- Fecha: 2026-06-02
--
-- PROPÓSITO:
--   Formaliza la función public.create_project(uuid, text, text)
--   que existe en producción (gobytech_pro) pero fue añadida
--   manualmente durante la migración de Sprint 10.
--
--   Firma validada en producción:
--     create_project(uuid, text, text) → SETOF projects
--
--   El frontend la invoca como:
--     supabase.rpc('create_project', { p_company_id, p_name, p_phase })
--   Ver: src/services/projects.service.ts → createProject()
--
-- AUTORIZACIÓN:
--   Solo superadmin y consultant pueden crear proyectos.
--   client_editor y client_viewer son rechazados con EXCEPTION.
--
-- SEGURO: idempotente — CREATE OR REPLACE. No toca auth.users.
-- ================================================================


-- ── Dependencias previas ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    RAISE EXCEPTION '[create_project migration] ABORTADO: tabla public.projects no existe.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'project_members'
  ) THEN
    RAISE EXCEPTION '[create_project migration] ABORTADO: tabla public.project_members no existe.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION '[create_project migration] ABORTADO: tabla public.profiles no existe.';
  END IF;
END $$;


-- ── Función principal ─────────────────────────────────────────────
-- Firma: create_project(uuid, text, text) — coincide con gobytech_pro validado.
-- Parámetros en orden FK-primero para alinearse con la firma de producción.
CREATE OR REPLACE FUNCTION public.create_project(
  p_company_id uuid    DEFAULT NULL,
  p_name       text    DEFAULT NULL,
  p_phase      text    DEFAULT 'listen'
)
RETURNS SETOF public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_project_id  uuid;
  v_now         timestamptz := now();
BEGIN
  -- ── Autorización explícita ─────────────────────────────────────
  -- SECURITY DEFINER bypasa RLS. La autorización queda aquí dentro.
  -- Solo superadmin y consultant pueden crear proyectos.
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'create_project: usuario no autenticado o sin perfil en public.profiles';
  END IF;

  IF v_caller_role NOT IN ('superadmin', 'consultant') THEN
    RAISE EXCEPTION 'create_project: acceso denegado. Rol % no está autorizado a crear proyectos.', v_caller_role;
  END IF;

  -- ── Validaciones de input ──────────────────────────────────────
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'create_project: p_name no puede estar vacío';
  END IF;

  IF p_phase NOT IN ('listen', 'evaluate', 'activate', 'normalize', 'closed') THEN
    RAISE EXCEPTION 'create_project: p_phase inválido: %. Valores válidos: listen, evaluate, activate, normalize, closed', p_phase;
  END IF;

  -- ── Crear el proyecto ──────────────────────────────────────────
  INSERT INTO public.projects (
    id,
    name,
    owner_id,
    company_id,
    status,
    current_phase,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    trim(p_name),
    auth.uid(),
    p_company_id,
    'active',
    p_phase,
    v_now,
    v_now
  )
  RETURNING id INTO v_project_id;

  -- ── Añadir creador como project_member ────────────────────────
  INSERT INTO public.project_members (project_id, user_id, role, added_at)
  VALUES (v_project_id, auth.uid(), 'consultant', v_now);

  -- ── Devolver la fila completa ─────────────────────────────────
  RETURN QUERY
    SELECT * FROM public.projects WHERE id = v_project_id;
END;
$$;

COMMENT ON FUNCTION public.create_project(uuid, text, text) IS
  'Crea un proyecto y añade al creador como project_member (consultant). '
  'Solo superadmin y consultant pueden invocarla — client_editor y client_viewer '
  'son rechazados explícitamente dentro de la función. '
  'SECURITY DEFINER para escribir en project_members sin conflicto de RLS. '
  'Formalizada en migración 20260602 desde parche manual en gobytech_pro. '
  'Firma: create_project(uuid, text, text) → validada en producción.';


-- ── Permisos ──────────────────────────────────────────────────────
-- GRANT a authenticated: cualquier autenticado puede llamarla.
-- La autorización real (superadmin/consultant) está dentro de la función.
REVOKE ALL     ON FUNCTION public.create_project(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_project(uuid, text, text) TO authenticated;


-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'create_project'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260602 OK] public.create_project(uuid, text, text) creada/actualizada correctamente';
  ELSE
    RAISE EXCEPTION '[20260602 FAIL] public.create_project no encontrada tras CREATE OR REPLACE';
  END IF;
END $$;

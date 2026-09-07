-- ============================================================
-- Migration: Remover domain_id de projects (ADR-029 reversal)
-- Fecha: 2026-09-07
--
-- PROPÓSITO:
--   Revertir multi-dominio: projects vuelve a single-domain (ai_adoption).
--   - Remover columna domain_id de projects
--   - Remover index idx_projects_domain_id
--   - Remover foreign key projects_domain_id_fkey
--   - Actualizar create_project RPC para no aceptar p_domain_id
--
-- NOTAS:
--   - governance_domains table se mantiene (usada por otras features)
--   - evaluation_dimensions, framework_controls, governance_configurations siguen siendo multi-dominio
--   - Proyectos existentes perderán domain_id (todos asumirán 'ai_adoption')
--
-- ============================================================

-- ── 1. Remover índice ─────────────────────────────────────
DROP INDEX IF EXISTS public.idx_projects_domain_id;

-- ── 2. Remover foreign key constraint ──────────────────────
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_domain_id_fkey;

-- ── 3. Remover columna ────────────────────────────────────
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS domain_id;

-- ── 4. Actualizar create_project RPC (versión simplificada) ─
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

  -- ── Crear el proyecto (sin domain_id) ──────────────────────────
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
  'Crea un proyecto (single-domain ai_adoption). '
  'Solo superadmin y consultant pueden invocarla. '
  'SECURITY DEFINER para escribir en project_members sin conflicto de RLS. '
  'Firma simplificada en migración 20260907 — removido p_domain_id (ADR-029 reversal).';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.create_project(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_project(uuid, text, text) TO authenticated;


-- ── 5. Remover función antigua si existe ──────────────────────────
-- (la versión con p_domain_id puede quedar huérfana; se intenta remover)
DROP FUNCTION IF EXISTS public.create_project(uuid, text, uuid, text);


-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_has_domain_id boolean;
  v_func_exists boolean;
BEGIN
  -- Verificar que domain_id fue removido
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'domain_id'
  ) INTO v_has_domain_id;

  IF v_has_domain_id THEN
    RAISE EXCEPTION '[20260907 FAIL] domain_id aún existe en projects';
  END IF;

  -- Verificar que create_project (sin domain_id) existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'create_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_func_exists;

  IF NOT v_func_exists THEN
    RAISE EXCEPTION '[20260907 FAIL] create_project no encontrado tras actualización';
  END IF;

  RAISE NOTICE '[20260907 OK] domain_id removido de projects. ADR-029 reversal complete.';
END $$;

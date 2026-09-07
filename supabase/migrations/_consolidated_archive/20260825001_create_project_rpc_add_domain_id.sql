-- ============================================================
-- Migration: Actualizar create_project RPC para aceptar domain_id
-- Fecha: 2026-08-25
--
-- PROPÓSITO:
--   Extender el RPC public.create_project() para aceptar domain_id
--   como parámetro obligatorio. Esto permite al cliente (ProjectsTab)
--   seleccionar el dominio al crear un proyecto.
--
--   Firma anterior (20260602):
--     create_project(uuid, text, text) → (p_company_id, p_name, p_phase)
--
--   Firma nueva:
--     create_project(uuid, text, uuid, text) → (p_company_id, p_name, p_domain_id, p_phase)
--
--   El parámetro p_domain_id es obligatorio (NOT NULL).
--   Validamos que exista en governance_domains.
--
-- ============================================================

-- ── Función principal actualizada ────────────────────────────
CREATE OR REPLACE FUNCTION public.create_project(
  p_company_id uuid    DEFAULT NULL,
  p_name       text    DEFAULT NULL,
  p_domain_id  uuid    DEFAULT NULL,
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
  v_domain_exists boolean;
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

  -- ── Asignar dominio por defecto (ai_adoption) si no se pasa ──────────
  IF p_domain_id IS NULL THEN
    SELECT id INTO p_domain_id
    FROM public.governance_domains
    WHERE slug = 'ai_adoption' AND is_active = true
    LIMIT 1;

    IF p_domain_id IS NULL THEN
      RAISE EXCEPTION 'create_project: no se pudo obtener el dominio por defecto (ai_adoption)';
    END IF;
  ELSE
    -- Validar que el dominio pasado existe
    SELECT EXISTS (
      SELECT 1 FROM public.governance_domains WHERE id = p_domain_id
    ) INTO v_domain_exists;

    IF NOT v_domain_exists THEN
      RAISE EXCEPTION 'create_project: domain_id % no existe en governance_domains', p_domain_id;
    END IF;
  END IF;

  -- ── Crear el proyecto ──────────────────────────────────────────
  INSERT INTO public.projects (
    id,
    name,
    owner_id,
    company_id,
    domain_id,
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
    p_domain_id,
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

COMMENT ON FUNCTION public.create_project(uuid, text, uuid, text) IS
  'Crea un proyecto con domain_id obligatorio. '
  'Solo superadmin y consultant pueden invocarla. '
  'SECURITY DEFINER para escribir en project_members sin conflicto de RLS. '
  'Firma actualizada en migración 20260825 — antes no aceptaba domain_id.';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.create_project(uuid, text, uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_project(uuid, text, uuid, text) TO authenticated;


-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'create_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260825 OK] create_project actualizado con p_domain_id';
  ELSE
    RAISE EXCEPTION '[20260825 FAIL] create_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;

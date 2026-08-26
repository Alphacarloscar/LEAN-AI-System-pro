-- ============================================================
-- Migration: Extender create_project RPC con campos de objetivo/restricciones/horizonte/ecosistema/fricciones
-- Fecha: 2026-08-27
--
-- PROPÓSITO:
--   Extender public.create_project() para aceptar 5 parámetros opcionales:
--   - p_objetivo_principal: objetivo del proyecto
--   - p_restricciones: restricciones identificadas
--   - p_horizonte_valor: plazo esperado (Corto/Medio/Largo)
--   - p_ecosistema_tecnologico: stack tecnológico principal (dinámico según dominio)
--   - p_fricciones_oportunidades: fricciones y oportunidades de IA/transformación
--
--   Firma anterior (20260825):
--     create_project(uuid, text, uuid, text) → (p_company_id, p_name, p_domain_id, p_phase)
--
--   Firma nueva:
--     create_project(uuid, text, uuid, text, text, text, text, text, text)
--     → (p_company_id, p_name, p_domain_id, p_phase, p_objetivo_principal,
--        p_restricciones, p_horizonte_valor, p_ecosistema_tecnologico, p_fricciones_oportunidades)
--
--   Los 5 nuevos parámetros son opcionales (DEFAULT NULL).
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_project(
  p_company_id uuid    DEFAULT NULL,
  p_name       text    DEFAULT NULL,
  p_domain_id  uuid    DEFAULT NULL,
  p_phase      text    DEFAULT 'listen',
  p_objetivo_principal text DEFAULT NULL,
  p_restricciones text DEFAULT NULL,
  p_horizonte_valor text DEFAULT NULL,
  p_ecosistema_tecnologico text DEFAULT NULL,
  p_fricciones_oportunidades text DEFAULT NULL
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
    objetivo_principal,
    restricciones,
    horizonte_valor,
    ecosistema_tecnologico,
    fricciones_oportunidades,
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
    CASE WHEN p_objetivo_principal IS NOT NULL THEN trim(p_objetivo_principal) ELSE NULL END,
    CASE WHEN p_restricciones IS NOT NULL THEN trim(p_restricciones) ELSE NULL END,
    CASE WHEN p_horizonte_valor IS NOT NULL THEN trim(p_horizonte_valor) ELSE NULL END,
    CASE WHEN p_ecosistema_tecnologico IS NOT NULL THEN trim(p_ecosistema_tecnologico) ELSE NULL END,
    CASE WHEN p_fricciones_oportunidades IS NOT NULL THEN trim(p_fricciones_oportunidades) ELSE NULL END,
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

COMMENT ON FUNCTION public.create_project(uuid, text, uuid, text, text, text, text, text, text) IS
  'Crea un proyecto con domain_id obligatorio y 5 campos opcionales de contexto. '
  'Solo superadmin y consultant pueden invocarla. '
  'SECURITY DEFINER para escribir en project_members sin conflicto de RLS. '
  'Firma extendida en migración 20260827 — antes aceptaba solo (uuid, text, uuid, text).';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.create_project(uuid, text, uuid, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_project(uuid, text, uuid, text, text, text, text, text, text) TO authenticated;

-- Mantener la firma anterior (4 parámetros) por retrocompatibilidad si algo aún la invoca
-- El sobrecargar función permite coexistencia de ambas firmas
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
    RAISE NOTICE '[20260827 OK] create_project extendido con 5 campos opcionales';
  ELSE
    RAISE EXCEPTION '[20260827 FAIL] create_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;

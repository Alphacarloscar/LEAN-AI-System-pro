-- ============================================================
-- Migration 20260617_002_audit_fix_search_path.sql
--
-- Fix: error 42P01 "relation v_caller_email does not exist"
-- en log_audit_access() y get_audit_logs().
--
-- Causa: SET search_path = public excluye el schema auth.
-- PostgreSQL no puede resolver auth.users en el SELECT INTO
-- y lo interpreta como nombre de tabla en algunos builds de
-- Supabase Cloud, causando el error 42P01.
--
-- Solución: añadir extensions al search_path y leer user_email
-- directamente desde auth.jwt() (disponible sin acceso a auth.users)
-- o incluir auth en el search_path explícitamente.
-- ============================================================


-- ── Fix log_audit_access ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_audit_access(
  p_query_filters jsonb    DEFAULT '{}',
  p_rows_returned integer  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id    uuid := auth.uid();
  v_caller_email text := auth.jwt() ->> 'email';
  v_caller_role  text;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'log_audit_access: caller must be authenticated (got null uid)';
  END IF;

  SELECT p.role INTO v_caller_role
  FROM   public.profiles p
  WHERE  p.id = v_caller_id;

  INSERT INTO public.audit_access_logs (
    user_id, user_email, user_role, query_filters, rows_returned
  ) VALUES (
    v_caller_id,
    v_caller_email,
    v_caller_role,
    COALESCE(p_query_filters, '{}'),
    p_rows_returned
  );
END;
$$;

REVOKE ALL     ON FUNCTION public.log_audit_access(jsonb, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.log_audit_access(jsonb, integer) TO authenticated;


-- ── Fix get_audit_logs ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_audit_logs(
  filters jsonb DEFAULT '{}'
)
RETURNS SETOF public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id    uuid    := auth.uid();
  v_caller_email text    := auth.jwt() ->> 'email';
  v_caller_role  text;
  v_limit        integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'get_audit_logs: caller must be authenticated (got null uid)';
  END IF;

  SELECT p.role INTO v_caller_role
  FROM   public.profiles p
  WHERE  p.id = v_caller_id;

  IF v_caller_role IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION
      'get_audit_logs: permission denied — superadmin role required (caller role: %)',
      COALESCE(v_caller_role, 'null');
  END IF;

  INSERT INTO public.audit_access_logs (
    user_id, user_email, user_role, query_filters
  ) VALUES (
    v_caller_id, v_caller_email, v_caller_role, COALESCE(filters, '{}')
  );

  v_limit := LEAST(COALESCE((filters->>'limit')::integer, 500), 1000);

  RETURN QUERY
  SELECT *
  FROM   public.audit_logs al
  WHERE
    (filters->>'userId'        IS NULL OR al.user_id        = (filters->>'userId')::uuid)
    AND (filters->>'serviceName'   IS NULL OR al.service_name   = filters->>'serviceName')
    AND (filters->>'status'        IS NULL OR al.status         = filters->>'status')
    AND (filters->>'fromDate'      IS NULL OR al.created_at    >= (filters->>'fromDate')::timestamptz)
    AND (filters->>'toDate'        IS NULL OR al.created_at    <= (filters->>'toDate')::timestamptz)
    AND (filters->>'correlationId' IS NULL OR al.correlation_id = filters->>'correlationId')
  ORDER BY al.created_at DESC
  LIMIT  v_limit;
END;
$$;

REVOKE ALL     ON FUNCTION public.get_audit_logs(jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_audit_logs(jsonb) TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ════════════════════════════════════════════════════════════════
--
-- Confirmar search_path de las funciones corregidas:
--   SELECT proname, proconfig
--   FROM   pg_proc
--   WHERE  proname IN ('log_audit_access', 'get_audit_logs');
--   -- proconfig debe incluir 'search_path=public,auth,extensions'

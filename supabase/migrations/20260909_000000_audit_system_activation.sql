-- ================================================================
-- 20260909_000000_audit_system_activation.sql
--
-- GOBY — Audit System Activation + Épica 9 Extensions
-- Autor: Alpha Consulting / Claude Code
-- Fecha: 2026-09-09
-- Branch: feat/adr-029-multi-domain (Épica 9)
--
-- BASE: release-audit-system-complete.sql v1.0 (2026-06-17)
-- EXTENSIONES ÉPICA 9:
--   · event_type / entity_type para eventos de negocio
--   · company_id / project_id para filtrado por entidad
--   · Índices de búsqueda
--   · RPC get_audit_logs mejorada con paginación + filtros de negocio
--   · Seed audit_intensive_mode en schema_metadata
--
-- PROPIEDADES DE DESPLIEGUE:
--   ✅ Idempotente (re-ejecutable N veces sin romper la BD)
--   ✅ Transaccional donde aplica (DDL fuera de TX en PG por naturaleza)
--   ✅ Auto-documentado (inline) — no requiere docs externos para ejecutar
--
-- PRERREQUISITOS (antes de ejecutar):
--   1. pg_cron HABILITADO:
--        Dashboard → Database → Extensions → pg_cron → Enable
--   2. pgcrypto HABILITADO (se activa en §0 del script):
--        O bien: Dashboard → Database → Extensions → pgcrypto → Enable
--   3. Secreto Vault configurado:
--        a) Generar:  SELECT encode(gen_random_bytes(32), 'hex');
--        b) Guardar:  Dashboard → Project Settings → Vault → New Secret
--                     Name: audit_pepper  /  Value: <hex 64 chars>
--        c) Activar:  ALTER DATABASE postgres SET app.audit_pepper = '<valor>';
--   4. schema_metadata tabla debe existir (Épica 7):
--        Verificar: SELECT 1 FROM pg_tables WHERE tablename = 'schema_metadata';
--
-- RELACIONADO: ADR-017 · ADR-018 · ADR-019 · Épica 9
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- §0  EXTENSIONES
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ════════════════════════════════════════════════════════════════
-- §1  TABLAS — activación base + extensiones Épica 9
-- ════════════════════════════════════════════════════════════════

-- ── §1a  audit_logs — ventana activa 90 días ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz NOT NULL DEFAULT now(),

  user_id          uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email       text,
  user_role        text,

  service_name     text        NOT NULL,
  method_name      text        NOT NULL,

  args_payload     jsonb       NOT NULL DEFAULT '{}',

  status           text        NOT NULL DEFAULT 'success'
                               CHECK (status IN ('success', 'error')),
  response_payload jsonb,
  error_message    text,
  error_stack      text,

  duration_ms      integer     NOT NULL DEFAULT 0,
  resource_id      text,
  correlation_id   text,

  metadata         jsonb       NOT NULL DEFAULT '{}'
);

-- Columnas que pueden llegar por migraciones previas — ADD IF NOT EXISTS es idempotente
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS correlation_id text,
  ADD COLUMN IF NOT EXISTS event_type    text,   -- 'user.login', 'project.status_changed', etc. (NULL para trazas técnicas)
  ADD COLUMN IF NOT EXISTS entity_type   text,   -- 'company', 'project', 'user', etc.
  ADD COLUMN IF NOT EXISTS company_id    uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id    uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Constraint anti payload-stuffing: idempotente via DO-guard en pg_constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE  conname = 'chk_audit_logs_resource_id_length'
  ) THEN
    ALTER TABLE public.audit_logs
      ADD CONSTRAINT chk_audit_logs_resource_id_length
      CHECK (resource_id IS NULL OR length(resource_id) <= 256);
  END IF;
END $$;

COMMENT ON COLUMN public.audit_logs.correlation_id IS
  'UUID generado por withCorrelationId() en la UI. Agrupa todas las trazas '
  'de una misma interacción de usuario. NULL para eventos de sistema o Edge Functions.';

COMMENT ON COLUMN public.audit_logs.event_type IS
  'Evento de negocio explícito (''user.login'', ''project.status_changed'', etc.). '
  'NULL para trazas técnicas genéricas del Proxy makeAuditable (service_name/method_name).';

COMMENT ON COLUMN public.audit_logs.entity_type IS
  'Tipo de entidad afectada (''company'', ''project'', ''user'', etc.). '
  'Permite filtrado de auditoría por tipo de recurso en panel admin.';

COMMENT ON COLUMN public.audit_logs.company_id IS
  'ID de la empresa afectada (si aplica). Permite filtrado de auditoría a nivel company. '
  'NULL para eventos globales o de sistema.';

COMMENT ON COLUMN public.audit_logs.project_id IS
  'ID del proyecto afectado (si aplica). Permite filtrado de auditoría a nivel project. '
  'NULL para eventos de company-level o sistema.';

-- Índices de rendimiento (todos idempotentes)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_service_method
  ON public.audit_logs (service_name, method_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_errors
  ON public.audit_logs (created_at DESC, service_name)
  WHERE status = 'error';

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id
  ON public.audit_logs (resource_id)
  WHERE resource_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id
  ON public.audit_logs (correlation_id)
  WHERE correlation_id IS NOT NULL;

-- Índices para Épica 9 — panel admin
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type
  ON public.audit_logs (event_type, created_at DESC)
  WHERE event_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id
  ON public.audit_logs (company_id, created_at DESC)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id
  ON public.audit_logs (project_id, created_at DESC)
  WHERE project_id IS NOT NULL;


-- ── §1b  audit_logs_archive — cumplimiento legal 5 años ──────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id      uuid        NOT NULL,
  created_at       timestamptz NOT NULL,
  archived_at      timestamptz NOT NULL DEFAULT now(),

  user_id          uuid,
  user_email_hash  text,
  user_role        text,

  service_name     text        NOT NULL,
  method_name      text        NOT NULL,

  status           text        NOT NULL CHECK (status IN ('success', 'error')),
  duration_ms      integer,
  resource_id      text,
  error_message    text,
  correlation_id   text,

  ai_provider      text,
  ai_model         text,
  ai_total_tokens  integer,

  UNIQUE (original_id)
);

-- Columnas que pueden llegar por drift de migraciones previas
ALTER TABLE public.audit_logs_archive
  ADD COLUMN IF NOT EXISTS correlation_id    text,
  ADD COLUMN IF NOT EXISTS user_email_hash   text,
  ADD COLUMN IF NOT EXISTS ai_provider       text,
  ADD COLUMN IF NOT EXISTS ai_model          text,
  ADD COLUMN IF NOT EXISTS ai_total_tokens   integer;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE  conname = 'chk_audit_archive_resource_id_length'
  ) THEN
    ALTER TABLE public.audit_logs_archive
      ADD CONSTRAINT chk_audit_archive_resource_id_length
      CHECK (resource_id IS NULL OR length(resource_id) <= 256);
  END IF;
END $$;

COMMENT ON COLUMN public.audit_logs_archive.user_email_hash IS
  'HMAC-SHA256(user_email, pepper) — nunca PII en frío (GDPR).';

COMMENT ON COLUMN public.audit_logs_archive.correlation_id IS
  'Propagado desde audit_logs durante el archivado. Permite correlación histórica.';

CREATE INDEX IF NOT EXISTS idx_audit_archive_created_at
  ON public.audit_logs_archive (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_archive_user_id
  ON public.audit_logs_archive (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_archive_user_email_hash
  ON public.audit_logs_archive (user_email_hash)
  WHERE user_email_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_archive_service_method
  ON public.audit_logs_archive (service_name, method_name);

CREATE INDEX IF NOT EXISTS idx_audit_archive_archived_at
  ON public.audit_logs_archive (archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_archive_ai_model
  ON public.audit_logs_archive (ai_model, ai_total_tokens)
  WHERE ai_model IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_archive_correlation_id
  ON public.audit_logs_archive (correlation_id)
  WHERE correlation_id IS NOT NULL;


-- ── §1c  audit_access_logs — meta-auditoría (auditar al administrador) ───

CREATE TABLE IF NOT EXISTS public.audit_access_logs (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_at   timestamptz NOT NULL DEFAULT now(),

  user_id       uuid        NOT NULL,
  user_email    text,
  user_role     text,

  query_filters jsonb       NOT NULL DEFAULT '{}',
  rows_returned integer
);

COMMENT ON TABLE public.audit_access_logs IS
  'Meta-auditoría: registra cada vez que un superadmin consulta audit_logs. '
  'Escritura exclusiva vía SECURITY DEFINER — inmutable desde la aplicación. '
  'Implementa ADR-019.';

CREATE INDEX IF NOT EXISTS idx_audit_access_accessed_at
  ON public.audit_access_logs (accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_access_user_id
  ON public.audit_access_logs (user_id, accessed_at DESC);


-- ════════════════════════════════════════════════════════════════
-- §2  ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_access_logs  ENABLE ROW LEVEL SECURITY;


-- ── §2a  Políticas audit_logs ─────────────────────────────────────────────

DROP POLICY IF EXISTS "audit_logs_insert_own"  ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own"  ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own_or_superadmin" ON public.audit_logs;

CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- ── §2b  Políticas audit_logs_archive ────────────────────────────────────

DROP POLICY IF EXISTS "audit_archive_select_superadmin" ON public.audit_logs_archive;

CREATE POLICY "audit_archive_select_superadmin"
  ON public.audit_logs_archive
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );


-- ── §2c  Políticas audit_access_logs ─────────────────────────────────────

DROP POLICY IF EXISTS "audit_access_logs_select_superadmin" ON public.audit_access_logs;

CREATE POLICY "audit_access_logs_select_superadmin"
  ON public.audit_access_logs
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );


-- ════════════════════════════════════════════════════════════════
-- §3  FUNCIÓN AUXILIAR: hmac_email_hash
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hmac_email_hash(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pepper text;
BEGIN
  IF p_email IS NULL THEN
    RETURN NULL;
  END IF;

  v_pepper := current_setting('app.audit_pepper', false);

  IF v_pepper IS NULL OR trim(v_pepper) = '' THEN
    RAISE EXCEPTION
      'hmac_email_hash: app.audit_pepper is not set. '
      'Configure the secret in Supabase Vault before running purge_old_audit_logs().';
  END IF;

  RETURN encode(hmac(p_email, v_pepper, 'sha256'), 'hex');
END;
$$;

REVOKE ALL     ON FUNCTION public.hmac_email_hash(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hmac_email_hash(text) TO service_role;

COMMENT ON FUNCTION public.hmac_email_hash(text) IS
  'Pseudonimiza un email con HMAC-SHA256 usando app.audit_pepper del Vault. '
  'SECURITY DEFINER — solo service_role puede invocarla. '
  'Devuelve NULL si p_email es NULL.';


-- ════════════════════════════════════════════════════════════════
-- §4  FUNCIÓN SECURITY DEFINER: log_audit_access
-- ════════════════════════════════════════════════════════════════

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
  v_caller_role  text := (SELECT role FROM public.profiles WHERE id = auth.uid());
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'log_audit_access: caller must be authenticated (got null uid)';
  END IF;

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


-- ════════════════════════════════════════════════════════════════
-- §5  FUNCIÓN SECURITY DEFINER: get_audit_logs (acceso superadmin)
--     MEJORADA PARA ÉPICA 9 — filtros de negocio + paginación
-- ════════════════════════════════════════════════════════════════
--
-- ÚNICO canal de acceso de superadmin a audit_logs (ADR-019).
--
-- Filtros soportados (camelCase, consistencia con TypeScript):
--   userId · serviceName · status · fromDate · toDate · correlationId
--   eventType · entityType · companyId · projectId (Épica 9)
--   limit (default 500, techo 1000) · offset (default 0)
--
-- Paginación: LIMIT + OFFSET en lugar de solo LIMIT.

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
  v_caller_role  text    := (SELECT role FROM public.profiles WHERE id = auth.uid());
  v_limit        integer;
  v_offset       integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'get_audit_logs: caller must be authenticated (got null uid)';
  END IF;

  IF v_caller_role IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION
      'get_audit_logs: permission denied — superadmin role required (caller role: %)',
      COALESCE(v_caller_role, 'null');
  END IF;

  -- INSERT OBLIGATORIO: traza emitida ANTES del SELECT.
  INSERT INTO public.audit_access_logs (
    user_id, user_email, user_role, query_filters
  ) VALUES (
    v_caller_id, v_caller_email, v_caller_role, COALESCE(filters, '{}')
  );

  v_limit  := LEAST(COALESCE((filters->>'limit')::integer, 500), 1000);
  v_offset := COALESCE((filters->>'offset')::integer, 0);

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
    AND (filters->>'eventType'     IS NULL OR al.event_type     = filters->>'eventType')
    AND (filters->>'entityType'    IS NULL OR al.entity_type    = filters->>'entityType')
    AND (filters->>'companyId'     IS NULL OR al.company_id     = (filters->>'companyId')::uuid)
    AND (filters->>'projectId'     IS NULL OR al.project_id     = (filters->>'projectId')::uuid)
  ORDER BY al.created_at DESC
  LIMIT  v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL     ON FUNCTION public.get_audit_logs(jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_audit_logs(jsonb) TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- §6  FUNCIÓN SECURITY DEFINER: purge_old_audit_logs
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.purge_old_audit_logs(
  p_cutoff_days integer DEFAULT 90,
  p_batch_size  integer DEFAULT 5000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff  timestamptz := now() - (p_cutoff_days || ' days')::interval;
  v_start   timestamptz := clock_timestamp();
  v_deleted integer;
BEGIN
  WITH rows_to_purge AS (
    SELECT id
    FROM   public.audit_logs
    WHERE  created_at < v_cutoff
    LIMIT  p_batch_size
  ),
  archived AS (
    INSERT INTO public.audit_logs_archive (
      original_id,
      created_at,
      user_id,
      user_email_hash,
      user_role,
      service_name,
      method_name,
      status,
      duration_ms,
      resource_id,
      error_message,
      correlation_id,
      ai_provider,
      ai_model,
      ai_total_tokens
    )
    SELECT
      al.id,
      al.created_at,
      al.user_id,
      public.hmac_email_hash(al.user_email),
      al.user_role,
      al.service_name,
      al.method_name,
      al.status,
      al.duration_ms,
      al.resource_id,
      al.error_message,
      al.correlation_id,
      al.metadata->>'provider',
      al.metadata->>'model_responded',
      (al.metadata->>'total_tokens')::integer
    FROM public.audit_logs al
    WHERE al.id IN (SELECT id FROM rows_to_purge)
    ON CONFLICT (original_id) DO NOTHING
    RETURNING original_id
  )
  DELETE FROM public.audit_logs
  WHERE id IN (SELECT original_id FROM archived);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'cutoff',      v_cutoff,
    'archived',    v_deleted,
    'deleted',     v_deleted,
    'batch_size',  p_batch_size,
    'duration_ms', ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000),
    'ran_at',      now()
  );
END;
$$;

REVOKE ALL     ON FUNCTION public.purge_old_audit_logs(integer, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.purge_old_audit_logs(integer, integer) TO service_role;


-- ════════════════════════════════════════════════════════════════
-- §7  FUNCIÓN SECURITY DEFINER: purge_old_audit_archive
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.purge_old_audit_archive()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff  timestamptz := now() - interval '5 years';
  v_start   timestamptz := clock_timestamp();
  v_deleted integer;
BEGIN
  DELETE FROM public.audit_logs_archive
  WHERE created_at < v_cutoff;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'cutoff',      v_cutoff,
    'deleted',     v_deleted,
    'duration_ms', ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000),
    'ran_at',      now()
  );
END;
$$;

REVOKE ALL     ON FUNCTION public.purge_old_audit_archive() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.purge_old_audit_archive() TO service_role;


-- ════════════════════════════════════════════════════════════════
-- §8  JOBS pg_cron — purga automática
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
  PERFORM cron.unschedule('purge-audit-logs-90d');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('purge-audit-archive-5y');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Job 1: archivado + purga diaria de la ventana activa (02:00 UTC)
SELECT cron.schedule(
  'purge-audit-logs-90d',
  '0 2 * * *',
  $$ SELECT public.purge_old_audit_logs() $$
);

-- Job 2: eliminación mensual del archivo histórico > 5 años (03:00 UTC, día 1)
SELECT cron.schedule(
  'purge-audit-archive-5y',
  '0 3 1 * *',
  $$ SELECT public.purge_old_audit_archive() $$
);


-- ════════════════════════════════════════════════════════════════
-- §9  ÉPICA 9 — SEED audit_intensive_mode en schema_metadata
-- ════════════════════════════════════════════════════════════════
-- Requiere que schema_metadata exista (Épica 7, migración 20260908_000000).
-- Inicializa a 'false': modo normal activo, modo intensivo desactivado.
-- El toggle en /admin puede cambiarlo dinámicamente.

INSERT INTO public.schema_metadata (key, value)
VALUES ('audit_intensive_mode', 'false')
ON CONFLICT (key) DO NOTHING;

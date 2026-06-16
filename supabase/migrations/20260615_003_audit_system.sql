-- ============================================================
-- Migration 20260615_003_audit_system.sql  (CONSOLIDADA — PRE-ready)
--
-- Reemplaza las cinco migraciones históricas 003–007 en una única
-- definición final idempotente.  El histórico de cambios vive en Git.
--
-- Estructura desplegada:
--   Tablas    : audit_logs · audit_logs_archive · audit_access_logs
--   Funciones : hmac_email_hash · purge_old_audit_logs
--               purge_old_audit_archive · log_audit_access · get_audit_logs
--   Jobs      : purge-audit-logs-90d (diario 02:00 UTC)
--               purge-audit-archive-5y (mensual 03:00 UTC día 1)
--
-- GDPR / PII:
--   audit_logs (90 días) : user_email en texto — legitimación interés legítimo
--   audit_logs_archive   : user_email_hash HMAC-SHA256 con pepper (Vault)
--
-- PRERREQUISITOS:
--   1. pg_cron habilitado: Dashboard → Database → Extensions → pg_cron
--   2. Secreto en Vault:
--        SELECT encode(gen_random_bytes(32), 'hex');   -- generar
--        Dashboard → Project Settings → Vault → Add new secret
--        Name: audit_pepper  /  Value: <hex 64 chars>
--
-- Ejecutar en Supabase SQL Editor (PRE y DEV por separado).
-- Relacionado: ADR-017 · ADR-018 · ADR-019
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 0. EXTENSIÓN
-- ════════════════════════════════════════════════════════════════

-- pgcrypto: requerido para hmac() y encode(digest()) — idempotente en Supabase
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ════════════════════════════════════════════════════════════════
-- 1. TABLAS
-- ════════════════════════════════════════════════════════════════

-- ── 1a. audit_logs — ventana activa 90 días ───────────────────────────────

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

  -- Metadatos extensibles: AI metrics, tool_code, engagement_id, etc.
  metadata         jsonb       NOT NULL DEFAULT '{}'
);

-- Constraint anti payload-stuffing (idempotente via DO $$)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_audit_logs_resource_id_length'
  ) THEN
    ALTER TABLE public.audit_logs
      ADD CONSTRAINT chk_audit_logs_resource_id_length
      CHECK (resource_id IS NULL OR length(resource_id) <= 256);
  END IF;
END $$;

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

COMMENT ON COLUMN public.audit_logs.correlation_id IS
  'UUID generado por withCorrelationId() en la UI. Agrupa todas las trazas '
  'de una misma interacción de usuario. NULL para eventos de sistema o Edge Functions.';


-- ── 1b. audit_logs_archive — cumplimiento legal 5 años ────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id      uuid        NOT NULL,
  created_at       timestamptz NOT NULL,
  archived_at      timestamptz NOT NULL DEFAULT now(),

  user_id          uuid,
  user_email_hash  text,        -- HMAC-SHA256(user_email, pepper) — nunca PII en frío (GDPR)
  user_role        text,

  service_name     text        NOT NULL,
  method_name      text        NOT NULL,

  status           text        NOT NULL CHECK (status IN ('success', 'error')),
  duration_ms      integer,
  resource_id      text,
  error_message    text,
  correlation_id   text,

  ai_provider      text,        -- metadata->>'provider'
  ai_model         text,        -- metadata->>'model_responded'
  ai_total_tokens  integer,     -- metadata->>'total_tokens'

  UNIQUE (original_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_audit_archive_resource_id_length'
  ) THEN
    ALTER TABLE public.audit_logs_archive
      ADD CONSTRAINT chk_audit_archive_resource_id_length
      CHECK (resource_id IS NULL OR length(resource_id) <= 256);
  END IF;
END $$;

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

COMMENT ON COLUMN public.audit_logs_archive.correlation_id IS
  'Propagado desde audit_logs durante el archivado. Permite correlación histórica.';


-- ── 1c. audit_access_logs — meta-auditoría (auditar al administrador) ─────
--
-- Canal independiente de audit_logs. Append-only desde la perspectiva
-- de la aplicación: solo log_audit_access() (SECURITY DEFINER) inserta filas.

CREATE TABLE IF NOT EXISTS public.audit_access_logs (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_at     timestamptz NOT NULL DEFAULT now(),

  user_id         uuid        NOT NULL,
  user_email      text,
  user_role       text,

  query_filters   jsonb       NOT NULL DEFAULT '{}',
  rows_returned   integer
);

COMMENT ON TABLE public.audit_access_logs IS
  'Meta-auditoría: registra cada vez que un superadmin consulta audit_logs. '
  'Canal independiente con escritura exclusiva vía SECURITY DEFINER. '
  'Inmutable desde la aplicación (sin políticas de INSERT/UPDATE/DELETE para usuarios).';

CREATE INDEX IF NOT EXISTS idx_audit_access_accessed_at
  ON public.audit_access_logs (accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_access_user_id
  ON public.audit_access_logs (user_id, accessed_at DESC);


-- ════════════════════════════════════════════════════════════════
-- 2. RLS
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_access_logs  ENABLE ROW LEVEL SECURITY;


-- ── 2a. Políticas audit_logs ──────────────────────────────────────────────

-- Las políticas no tienen IF NOT EXISTS — se usa DROP … IF EXISTS antes de
-- recrear para garantizar idempotencia en re-ejecuciones sobre el mismo entorno.

DROP POLICY IF EXISTS "audit_logs_insert_own"             ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own_or_superadmin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own"             ON public.audit_logs;

-- INSERT: usuarios autenticados solo pueden insertar registros propios.
-- Las Edge Functions insertan usando supabaseAdmin (service_role → bypass RLS).
CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- SELECT: cada usuario ve solo sus filas.
-- El superadmin accede EXCLUSIVAMENTE vía get_audit_logs() (SECURITY DEFINER, sección 4).
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No se otorgan políticas de UPDATE ni DELETE.
-- Los registros son inmutables desde la aplicación.
-- Solo purge_old_audit_logs() (SECURITY DEFINER) puede eliminarlos.


-- ── 2b. Políticas audit_logs_archive ─────────────────────────────────────

DROP POLICY IF EXISTS "audit_archive_select_superadmin" ON public.audit_logs_archive;

-- Solo el superadmin puede consultar el archivo histórico.
CREATE POLICY "audit_archive_select_superadmin"
  ON public.audit_logs_archive
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );


-- ── 2c. Políticas audit_access_logs ──────────────────────────────────────

DROP POLICY IF EXISTS "audit_access_logs_select_superadmin" ON public.audit_access_logs;

-- Solo el superadmin puede leer el registro de accesos.
CREATE POLICY "audit_access_logs_select_superadmin"
  ON public.audit_access_logs
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- ¡INTENCIONAL! No hay políticas de INSERT, UPDATE ni DELETE para usuarios.
-- La única vía de inserción es log_audit_access() y get_audit_logs() (SECURITY DEFINER).


-- ════════════════════════════════════════════════════════════════
-- 3. FUNCIONES AUXILIARES
-- ════════════════════════════════════════════════════════════════

-- ── 3a. hmac_email_hash — pseudonimización GDPR ──────────────────────────
--
-- Encapsula HMAC-SHA256 con pepper gestionado en Supabase Vault.
-- Garantías:
--   a) SECURITY DEFINER: el secreto via current_setting() solo accesible con
--      privilegios del propietario.
--   b) Fallo ruidoso si app.audit_pepper no está configurado.
--   c) NULL input → NULL output (no hashear ausencias).

CREATE OR REPLACE FUNCTION public.hmac_email_hash(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_pepper text;
BEGIN
  IF p_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_pepper
  FROM   vault.decrypted_secrets
  WHERE  name = 'audit_pepper'
  LIMIT  1;

  IF v_pepper IS NULL OR trim(v_pepper) = '' THEN
    RAISE EXCEPTION
      'hmac_email_hash: secreto "audit_pepper" no encontrado en Vault. '
      'Añádelo en Dashboard → Project Settings → Vault → Add new secret.';
  END IF;

  RETURN encode(hmac(p_email, v_pepper, 'sha256'), 'hex');
END;
$$;

REVOKE ALL     ON FUNCTION public.hmac_email_hash(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hmac_email_hash(text) TO service_role;

COMMENT ON FUNCTION public.hmac_email_hash(text) IS
  'Pseudonimiza un email con HMAC-SHA256 usando app.audit_pepper del Vault. '
  'SECURITY DEFINER. Solo service_role puede invocarla. '
  'Devuelve NULL si p_email es NULL.';


-- ── 3b. log_audit_access — registro SECURITY DEFINER ─────────────────────
--
-- SECURITY DEFINER: ejecuta con los privilegios del propietario de la función,
-- por lo que puede insertar en audit_access_logs aunque el usuario llamante
-- no tenga políticas INSERT.
-- El user_id, email y role se resuelven server-side — el cliente no puede
-- falsificar su identidad (a diferencia de pasar los valores como parámetros).

CREATE OR REPLACE FUNCTION public.log_audit_access(
  p_query_filters jsonb    DEFAULT '{}',
  p_rows_returned integer  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_caller_id    uuid := auth.uid();
  v_caller_email text;
  v_caller_role  text;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'log_audit_access: caller must be authenticated (got null uid)';
  END IF;

  SELECT u.email INTO v_caller_email
  FROM   auth.users u
  WHERE  u.id = v_caller_id;

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


-- ════════════════════════════════════════════════════════════════
-- 4. FUNCIONES DE RETENCIÓN (SECURITY DEFINER)
-- ════════════════════════════════════════════════════════════════

-- ── 4a. purge_old_audit_logs — archivado diario con HMAC-SHA256 ──────────
--
-- Archiva y elimina en una operación atómica via CTE encadenado.
-- La DELETE solo actúa sobre los IDs que se archivaron con éxito,
-- garantizando que ningún registro se pierda ni quede huérfano.
-- ON CONFLICT DO NOTHING garantiza idempotencia total.
--
-- Parámetros:
--   p_cutoff_days — ventana de retención activa (default: 90)
--   p_batch_size  — máximo de filas por ejecución (default: 5000)
--
-- Retorna jsonb con: cutoff, archived, deleted, batch_size, duration_ms, ran_at

CREATE OR REPLACE FUNCTION public.purge_old_audit_logs(
  p_cutoff_days integer DEFAULT 90,
  p_batch_size  integer DEFAULT 5000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_cutoff   timestamptz := now() - (p_cutoff_days || ' days')::interval;
  v_start    timestamptz := clock_timestamp();
  v_deleted  integer;
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
      user_email_hash,      -- HMAC-SHA256(user_email, pepper) — GDPR pseudonimización
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


-- ── 4b. purge_old_audit_archive — eliminación mensual archivo > 5 años ───
--
-- Se ejecuta el día 1 de cada mes a las 03:00 UTC.
-- Sin batching: el volumen mensual es mínimo comparado con el job diario.

CREATE OR REPLACE FUNCTION public.purge_old_audit_archive()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cutoff   timestamptz := now() - interval '5 years';
  v_start    timestamptz := clock_timestamp();
  v_deleted  integer;
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
-- 5. FUNCIÓN DE ACCESO SEGURO: get_audit_logs
-- ════════════════════════════════════════════════════════════════
--
-- Único canal de acceso superadmin a audit_logs.
--
-- Garantías de diseño:
--   a) Verificación de autenticación: rechaza llamadas anónimas.
--   b) Verificación de autorización: solo superadmin (server-side).
--   c) INSERT INMUTABLE en audit_access_logs ANTES del SELECT.
--      Si falla la traza, falla la consulta — imposible leer sin dejar rastro.
--   d) SECURITY DEFINER: exento de RLS → puede leer todas las filas.
--   e) SET search_path = public: previene inyección de search_path.
--
-- Filtros soportados (todos opcionales, claves camelCase por consistencia TypeScript):
--   userId · serviceName · status · fromDate · toDate · correlationId · limit

CREATE OR REPLACE FUNCTION public.get_audit_logs(
  filters jsonb DEFAULT '{}'
)
RETURNS SETOF public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_caller_id    uuid    := auth.uid();
  v_caller_email text;
  v_caller_role  text;
  v_limit        integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'get_audit_logs: caller must be authenticated (got null uid)';
  END IF;

  SELECT u.email INTO v_caller_email
  FROM   auth.users u
  WHERE  u.id = v_caller_id;

  SELECT p.role INTO v_caller_role
  FROM   public.profiles p
  WHERE  p.id = v_caller_id;

  IF v_caller_role IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION
      'get_audit_logs: permission denied — superadmin role required (caller role: %)',
      COALESCE(v_caller_role, 'null');
  END IF;

  -- INSERT OBLIGATORIO: traza de acceso emitida ANTES del SELECT.
  -- No hay EXCEPTION handler: si el INSERT falla, la excepción propaga
  -- y el SELECT nunca se ejecuta. Imposible leer sin quedar registrado.
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
-- 6. JOBS pg_cron — idempotentes via unschedule previo
-- ════════════════════════════════════════════════════════════════
--
-- Se llama a cron.unschedule() dentro de un bloque DO con manejo de excepción
-- para que la operación sea segura tanto si el job ya existía (lo elimina)
-- como si no existía todavía (silencia el error y continúa).

DO $$
BEGIN
  PERFORM cron.unschedule('purge-audit-logs-90d');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job no existía — continúa sin error
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('purge-audit-archive-5y');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Job 1: purga y archivado diario (02:00 UTC)
SELECT cron.schedule(
  'purge-audit-logs-90d',
  '0 2 * * *',
  $$ SELECT public.purge_old_audit_logs() $$
);

-- Job 2: eliminación mensual del archivo histórico > 5 años (03:00 UTC día 1)
SELECT cron.schedule(
  'purge-audit-archive-5y',
  '0 3 1 * *',
  $$ SELECT public.purge_old_audit_archive() $$
);


-- ════════════════════════════════════════════════════════════════
-- 7. VERIFICACIÓN POST-DESPLIEGUE (ejecutar manualmente tras aplicar)
-- ════════════════════════════════════════════════════════════════
--
-- A. Tablas y RLS activo:
--      SELECT tablename, rowsecurity FROM pg_tables
--      WHERE tablename IN ('audit_logs','audit_logs_archive','audit_access_logs');
--
-- B. Políticas vigentes (deben ser exactamente las de esta migración):
--      SELECT tablename, policyname, cmd FROM pg_policies
--      WHERE tablename IN ('audit_logs','audit_logs_archive','audit_access_logs')
--      ORDER BY tablename, policyname;
--
-- C. Jobs registrados:
--      SELECT jobid, jobname, schedule, active FROM cron.job
--      WHERE jobname IN ('purge-audit-logs-90d','purge-audit-archive-5y');
--
-- D. Funciones SECURITY DEFINER:
--      SELECT proname, prosecdef FROM pg_proc
--      WHERE proname IN (
--        'hmac_email_hash','purge_old_audit_logs',
--        'purge_old_audit_archive','log_audit_access','get_audit_logs'
--      );
--      -- prosecdef = true en todas
--
-- E. Test HMAC (requiere secreto 'audit_pepper' en Vault):
--      SELECT public.hmac_email_hash('user@example.com');  -- hex 64 chars
--
-- F. Test acceso superadmin (sesión activa con rol superadmin):
--      SELECT * FROM public.get_audit_logs('{"limit": 5}'::jsonb);
--      -- Devuelve filas Y genera 1 entrada en audit_access_logs
--
-- G. Test rechazo usuario no-superadmin:
--      SELECT * FROM public.get_audit_logs('{}');
--      -- "get_audit_logs: permission denied — superadmin role required"

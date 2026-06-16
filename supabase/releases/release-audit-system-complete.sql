-- ================================================================
-- release-audit-system-complete.sql
--
-- GOBY — Audit System · Release consolidado v1.0
-- Autor  : DBA Principal / Alpha Consulting
-- Fecha  : 2026-06-17
-- Branch : feat/release-audit-system-complete
--
-- Fuente de verdad única para despliegue en PRE y PRO.
-- Consolida y supera a:
--   · 20260615_003_audit_system.sql
--   · 20260616_004_audit_schema_drift.sql
--   · 20260617_002_audit_fix_search_path.sql  (fix search_path auth)
--
-- PROPIEDADES DE DESPLIEGUE:
--   ✅ Idempotente (re-ejecutable N veces sin romper la BD)
--   ✅ Transaccional donde aplica (DDL fuera de TX en PG por naturaleza)
--   ✅ Auto-documentado (inline) — no requiere docs externos para ejecutar
--   ✅ Verificación incluida al final (bloque comentado, ejecutar aparte)
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
--
-- RELACIONADO: ADR-017 · ADR-018 · ADR-019
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- §0  EXTENSIONES
-- ════════════════════════════════════════════════════════════════
-- pgcrypto: requerido por hmac() y encode(digest()) — siempre idempotente
-- pg_cron:  debe estar habilitado en Dashboard (no activable via SQL en Supabase Cloud)

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ════════════════════════════════════════════════════════════════
-- §1  TABLAS
-- ════════════════════════════════════════════════════════════════

-- ── §1a  audit_logs — ventana activa 90 días ─────────────────────────────
--
-- Payload completo: args, response, error_stack, correlation_id.
-- PII: user_email en texto plano (legitimación interés legítimo, borrado a 90 días).
-- Escritura: Edge Function log-audit-event con service_role (bypass RLS).
-- Lectura:   solo via get_audit_logs() SECURITY DEFINER (ADR-019).

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

  -- Metadatos extensibles: AI tokens, tool_code, engagement_id, etc.
  metadata         jsonb       NOT NULL DEFAULT '{}'
);

-- Columnas que pueden llegar por migraciones previas — ADD IF NOT EXISTS es idempotente
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS correlation_id text;

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


-- ── §1b  audit_logs_archive — cumplimiento legal 5 años ──────────────────
--
-- Payload reducido: sin args_payload, response_payload ni error_stack.
-- PII eliminada: user_email sustituido por user_email_hash (HMAC-SHA256 + pepper).
-- Solo superadmin puede leer (RLS §3b).

CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id      uuid        NOT NULL,
  created_at       timestamptz NOT NULL,
  archived_at      timestamptz NOT NULL DEFAULT now(),

  user_id          uuid,
  user_email_hash  text,        -- HMAC-SHA256(user_email, pepper) — GDPR pseudonimización
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
--
-- Canal independiente de audit_logs. Append-only desde la perspectiva
-- de la aplicación: ÚNICAMENTE log_audit_access() y get_audit_logs()
-- (ambas SECURITY DEFINER) pueden insertar filas.
-- No hay política INSERT/UPDATE/DELETE para usuarios — inmutable desde app.

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
-- ENABLE es idempotente: no falla si RLS ya estaba activo.

ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_access_logs  ENABLE ROW LEVEL SECURITY;


-- ── §2a  Políticas audit_logs ─────────────────────────────────────────────
-- DROP … IF EXISTS garantiza idempotencia en re-ejecuciones.

DROP POLICY IF EXISTS "audit_logs_insert_own"  ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own"  ON public.audit_logs;
-- Alias histórico presente en algunos entornos — limpiar si existe
DROP POLICY IF EXISTS "audit_logs_select_own_or_superadmin" ON public.audit_logs;

-- INSERT: usuarios autenticados solo pueden insertar registros propios.
-- Las Edge Functions usan supabaseAdmin (service_role → bypass RLS).
CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- SELECT: cada usuario ve solo sus propias filas.
-- El superadmin accede EXCLUSIVAMENTE vía get_audit_logs() (§5, SECURITY DEFINER).
-- No existe política SELECT para superadmin directo — es la garantía de ADR-019.
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- UPDATE / DELETE: sin políticas → bloqueados para todos los roles de aplicación.
-- Solo purge_old_audit_logs() (SECURITY DEFINER, §4a) puede eliminar filas.


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

-- ¡INTENCIONAL! Sin políticas INSERT/UPDATE/DELETE para usuarios.
-- Único canal de escritura: get_audit_logs() y log_audit_access() (SECURITY DEFINER).


-- ════════════════════════════════════════════════════════════════
-- §3  FUNCIÓN AUXILIAR: hmac_email_hash
-- ════════════════════════════════════════════════════════════════
--
-- Pseudonimización GDPR: HMAC-SHA256 con pepper desde Supabase Vault.
--
-- Garantías:
--   a) SECURITY DEFINER: current_setting() solo accesible con privs del owner.
--   b) Fallo ruidoso si app.audit_pepper no está configurado.
--   c) NULL input → NULL output (no hashear ausencias de dato).
--
-- search_path = public: previene inyección de funciones homónimas en otros schemas.
-- Solo service_role puede invocarla (usada internamente por purge_old_audit_logs).

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
--
-- Registra accesos a audit_logs sin que el cliente pueda falsificar identidad.
-- user_id, email y role se resuelven server-side desde auth.users y profiles.
--
-- Fix vs. versión 20260617_002: se usa auth.jwt() ->> 'email' para resolver
-- el email sin tocar auth.users directamente (evita error 42P01 en algunos
-- builds de Supabase Cloud con search_path restringido).
-- search_path = public, extensions evita resolución ambigua de auth schema.

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
-- ════════════════════════════════════════════════════════════════
--
-- ÚNICO canal de acceso de superadmin a audit_logs (ADR-019).
--
-- Garantías de diseño:
--   a) Verifica autenticación: rechaza uid null.
--   b) Verifica autorización: solo superadmin (server-side desde profiles).
--   c) INSERT INMUTABLE en audit_access_logs ANTES del SELECT.
--      Si falla la traza, falla toda la consulta — imposible leer sin rastro.
--   d) SECURITY DEFINER: exento de RLS → lee todas las filas.
--   e) search_path = public, extensions: previene 42P01 y path injection.
--
-- Fix vs. 20260617_002: email resuelto con auth.jwt() ->> 'email' (sin JOIN
-- a auth.users en context con search_path restringido).
--
-- Filtros soportados (camelCase, consistencia con TypeScript):
--   userId · serviceName · status · fromDate · toDate · correlationId · limit
-- Límite: default 500, techo 1000.

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
  -- Sin handler de excepción: si el INSERT falla, el SELECT nunca ocurre.
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
-- §6  FUNCIÓN SECURITY DEFINER: purge_old_audit_logs
-- ════════════════════════════════════════════════════════════════
--
-- Archiva y elimina transaccionalmente en una CTE encadenada.
-- DELETE solo actúa sobre IDs que se archivaron con éxito — ningún
-- registro se pierde ni queda huérfano.
-- ON CONFLICT DO NOTHING garantiza idempotencia ante re-ejecuciones.
--
-- Parámetros:
--   p_cutoff_days — ventana de retención activa (default: 90)
--   p_batch_size  — máximo de filas por ejecución (default: 5000)
--
-- Retorna jsonb: { cutoff, archived, deleted, batch_size, duration_ms, ran_at }
-- Ejecutable solo por service_role (job pg_cron, no desde cliente).

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
--
-- Elimina registros > 5 años del archivo histórico.
-- Ejecutada mensualmente por pg_cron (día 1 a 03:00 UTC).
-- Sin batching: el volumen mensual es mínimo.
--
-- Retorna jsonb: { cutoff, deleted, duration_ms, ran_at }

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
--
-- Bloque de limpieza obligatorio antes de (re)crear cada job.
-- cron.unschedule() dentro de DO con EXCEPTION WHEN OTHERS previene
-- fallo si el job no existía todavía (primera ejecución en entorno nuevo).

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
-- §9  VERIFICACIÓN POST-DESPLIEGUE
-- ════════════════════════════════════════════════════════════════
-- Ejecutar cada bloque manualmente en Supabase SQL Editor tras aplicar.
-- Todos deben devolver resultados sin errores.
-- ════════════════════════════════════════════════════════════════

-- A. Tablas con RLS activo (rowsecurity = true en las 3):
--
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE  tablename IN ('audit_logs','audit_logs_archive','audit_access_logs')
--   ORDER BY tablename;

-- B. Políticas vigentes (deben coincidir exactamente con §2):
--
--   SELECT tablename, policyname, cmd, roles
--   FROM   pg_policies
--   WHERE  tablename IN ('audit_logs','audit_logs_archive','audit_access_logs')
--   ORDER BY tablename, policyname;

-- C. Jobs pg_cron registrados y activos:
--
--   SELECT jobid, jobname, schedule, active
--   FROM   cron.job
--   WHERE  jobname IN ('purge-audit-logs-90d','purge-audit-archive-5y');

-- D. Funciones SECURITY DEFINER (prosecdef = true en todas):
--
--   SELECT proname, prosecdef, proconfig
--   FROM   pg_proc
--   WHERE  proname IN (
--     'hmac_email_hash','log_audit_access','get_audit_logs',
--     'purge_old_audit_logs','purge_old_audit_archive'
--   )
--   ORDER BY proname;
--   -- proconfig debe incluir 'search_path=public,extensions'
--   -- en log_audit_access y get_audit_logs

-- E. Columnas de audit_logs (debe incluir correlation_id):
--
--   SELECT column_name, data_type, is_nullable
--   FROM   information_schema.columns
--   WHERE  table_schema = 'public' AND table_name = 'audit_logs'
--   ORDER BY ordinal_position;

-- F. Columnas de audit_logs_archive (debe incluir user_email_hash, ai_*):
--
--   SELECT column_name, data_type, is_nullable
--   FROM   information_schema.columns
--   WHERE  table_schema = 'public' AND table_name = 'audit_logs_archive'
--   ORDER BY ordinal_position;

-- G. Test HMAC (requiere app.audit_pepper configurado en Vault):
--
--   SET app.audit_pepper = 'test-pepper-verificacion-local';
--   SELECT public.hmac_email_hash('user@example.com');
--   -- Debe devolver cadena hex de 64 caracteres
--   RESET app.audit_pepper;

-- H. Test get_audit_logs como superadmin (sesión autenticada con rol superadmin):
--
--   SELECT * FROM public.get_audit_logs('{"limit": 5}'::jsonb);
--   -- Devuelve filas Y genera 1 entrada en audit_access_logs
--   SELECT * FROM public.audit_access_logs ORDER BY accessed_at DESC LIMIT 1;

-- I. Test rechazo de usuario no-superadmin:
--
--   SELECT * FROM public.get_audit_logs('{}');
--   -- Debe lanzar: "get_audit_logs: permission denied — superadmin role required"

-- J. Test idempotencia (re-ejecutar el script completo):
--
--   -- Re-ejecutar este archivo completo no debe producir errores.
--   -- Las únicas salidas esperadas son los SELECT de cron.schedule()
--   -- que devuelven el jobid asignado.

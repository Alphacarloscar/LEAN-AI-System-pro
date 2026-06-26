-- ================================================================
-- release-v2.2.0-pre-pro.sql
--
-- GOBY — Release consolidado v2.2.0
-- Autor  : DBA Principal / Alpha Consulting
-- Fecha  : 2026-06-26
-- Branch : refactor/ux-ui-adr020-consolidation
--
-- ALCANCE: Este release cubre los cambios de BD pendientes de
-- aplicar en PRE (proyecto mkypmakmkxpecuezofkk) y PRO
-- (proyecto vbpgsgxsslccctjhuegt).
--
-- ANÁLISIS DE CAMBIOS POR ENTORNO:
--   PRE: Migraciones 20260615_003, 20260615_007, 20260616_004
--        NO han sido ejecutadas. Estado actual: ✅ solo en DEV.
--   PRO: Mismas migraciones pendientes.
--   → Un único SQL idempotente válido para ambos entornos.
--
-- NOTA SOBRE LA RAMA v2.2.0 (UX/UI):
--   La rama refactor/ux-ui-adr020-consolidation es 100% frontend.
--   No introduce nuevas tablas, columnas, funciones ni índices.
--   Los cambios de BD de este release corresponden al sistema de
--   auditoría (ADR-017/018/019) que quedó pendiente de aplicar
--   en PRE y PRO desde el sprint de auditoría (v2.1.0).
--
-- CONSOLIDA:
--   · 20260615_003_audit_system.sql    — tablas + RLS + funciones + cron
--   · 20260615_007_perf_profiles_idx.sql — índice explícito en profiles.id
--   · 20260616_004_audit_schema_drift.sql — columnas de drift
--
-- PROPIEDADES:
--   ✅ Idempotente — re-ejecutable N veces sin romper datos existentes
--   ✅ Un único archivo — ejecutar de una vez en Supabase SQL Editor
--   ✅ Sin diferencias PRE/PRO — mismo script, mismo resultado
--   ✅ Verificación incluida al final (§V — ejecutar aparte o conjuntamente)
--
-- PRERREQUISITOS (verificar ANTES de ejecutar):
--   1. pg_cron HABILITADO en el proyecto:
--        Dashboard → Database → Extensions → pg_cron → Enable
--   2. Secreto Vault configurado en el proyecto:
--        a) Generar valor:
--             SELECT encode(gen_random_bytes(32), 'hex');
--        b) Guardar en Vault:
--             Dashboard → Project Settings → Vault → New Secret
--             Name: audit_pepper  /  Value: <hex 64 chars>
--        c) Activar como parámetro de sesión:
--             ALTER DATABASE postgres SET app.audit_pepper = '<valor>';
--        (hacer esto por separado para cada proyecto: PRE y PRO)
--   3. Edge Function log-audit-event desplegada en el proyecto.
--        (si aún no está: Dashboard → Edge Functions → Deploy)
--
-- PROTOCOLO DE EJECUCIÓN:
--   1. Aplicar primero en PRE — verificar con §V
--   2. Confirmar con Carlos que PRE funciona correctamente
--   3. Aplicar en PRO — verificar con §V
--   Solo Carlos ejecuta en PRO (ADR-005).
--
-- RELACIONADO: ADR-017 · ADR-018 · ADR-019
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- §PRE  VERIFICACIÓN DE PRERREQUISITOS
-- ════════════════════════════════════════════════════════════════
--
-- Este bloque comprueba los 3 prerrequisitos ANTES de ejecutar
-- el resto del script. Si alguno falla, lanza un error claro y
-- detiene la ejecución. Corregir el problema y volver a ejecutar.
--
-- ┌─────────────────────────────────────────────────────────────┐
-- │  PRERREQUISITO 1 — pg_cron habilitado                       │
-- │  Si falla: Dashboard → Database → Extensions → pg_cron      │
-- │            → Enable → guardar                               │
-- ├─────────────────────────────────────────────────────────────┤
-- │  PRERREQUISITO 2 — Vault secret "audit_pepper" configurado  │
-- │  Pasos si falta:                                            │
-- │  a) Generar valor (ejecutar en SQL Editor):                 │
-- │       SELECT encode(gen_random_bytes(32), 'hex');           │
-- │  b) Guardar en Vault:                                       │
-- │       Dashboard → Project Settings → Vault → New Secret     │
-- │       Name: audit_pepper  /  Value: <hex 64 chars>         │
-- │  c) Activar como parámetro de BD (ejecutar en SQL Editor):  │
-- │       ALTER DATABASE postgres                               │
-- │         SET app.audit_pepper = '<valor hex>';               │
-- │  (repetir a/b/c para cada proyecto: PRE y PRO por separado) │
-- ├─────────────────────────────────────────────────────────────┤
-- │  PRERREQUISITO 3 — Edge Function log-audit-event desplegada │
-- │  Si falta: Dashboard → Edge Functions → Deploy              │
-- │  (el SQL puede ejecutarse sin ella, pero los eventos de     │
-- │   auditoría no se escribirán en BD hasta que esté activa)   │
-- └─────────────────────────────────────────────────────────────┘

-- CHECK 1: pg_cron instalado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    RAISE EXCEPTION
      E'PRERREQUISITO FALTANTE: pg_cron no está habilitado.\n'
      'Ir a: Dashboard → Database → Extensions → pg_cron → Enable\n'
      'Después volver a ejecutar este script.';
  END IF;
END $$;

-- CHECK 2: audit_pepper configurado y no vacío
DO $$
DECLARE
  v_pepper text;
BEGIN
  v_pepper := current_setting('app.audit_pepper', true);
  IF v_pepper IS NULL OR trim(v_pepper) = '' THEN
    RAISE EXCEPTION
      E'PRERREQUISITO FALTANTE: app.audit_pepper no está configurado.\n'
      'Pasos:\n'
      '  1. Generar valor:  SELECT encode(gen_random_bytes(32), ''hex'');\n'
      '  2. Guardar en Vault: Dashboard → Project Settings → Vault → New Secret\n'
      '     Name: audit_pepper  /  Value: <hex 64 chars>\n'
      '  3. Activar:  ALTER DATABASE postgres SET app.audit_pepper = ''<valor>'';\n'
      'Después volver a ejecutar este script.';
  END IF;
  RAISE NOTICE 'CHECK 2 OK: app.audit_pepper está configurado (longitud: % chars).', length(v_pepper);
END $$;

-- CHECK 3 (informativo): Edge Function log-audit-event
--   No bloqueable desde SQL — la función es externa. Se muestra aviso.
DO $$
BEGIN
  RAISE NOTICE
    'CHECK 3 (manual): Verificar que la Edge Function log-audit-event está desplegada '
    'en Dashboard → Edge Functions antes de usar la aplicación.';
END $$;

RAISE NOTICE '§PRE completado — todos los prerrequisitos verificados. Continuando con el despliegue.';


-- ════════════════════════════════════════════════════════════════
-- §0  EXTENSIONES
-- ════════════════════════════════════════════════════════════════
-- pgcrypto: requerido por hmac() y encode(digest())
-- pg_cron:  debe estar habilitado en Dashboard previamente (§PRERREQUISITOS)

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ════════════════════════════════════════════════════════════════
-- §1  TABLAS
-- ════════════════════════════════════════════════════════════════

-- ── §1a  audit_logs — ventana activa 90 días ─────────────────────────────
--
-- Escritura: Edge Function log-audit-event con service_role (bypass RLS).
-- Lectura:   solo via get_audit_logs() SECURITY DEFINER (ADR-019).
-- PII:       user_email en texto plano — legitimación interés legítimo,
--            purga automática a 90 días via pg_cron.

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

-- Constraint anti payload-stuffing (idempotente via DO-guard)
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

-- Columnas que pueden faltar si la tabla fue creada por una versión anterior
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS correlation_id text;

-- Índices (todos idempotentes)
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
-- PII eliminada: user_email → user_email_hash (HMAC-SHA256 + pepper Vault).
-- Solo superadmin puede leer (RLS §2b).

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

-- Constraint idempotente
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

-- Columnas que pueden faltar si la tabla fue creada por una versión anterior
ALTER TABLE public.audit_logs_archive
  ADD COLUMN IF NOT EXISTS correlation_id    text,
  ADD COLUMN IF NOT EXISTS user_email_hash   text,
  ADD COLUMN IF NOT EXISTS ai_provider       text,
  ADD COLUMN IF NOT EXISTS ai_model          text,
  ADD COLUMN IF NOT EXISTS ai_total_tokens   integer;

-- Índices
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


-- ── §1c  audit_access_logs — meta-auditoría de accesos al log ────────────
--
-- Registra quién y cuándo consultó audit_logs via get_audit_logs().
-- ADR-019: auditar al auditor.

CREATE TABLE IF NOT EXISTS public.audit_access_logs (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_at  timestamptz NOT NULL DEFAULT now(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email   text,
  user_role    text,
  query_filters jsonb      NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_access_accessed_at
  ON public.audit_access_logs (accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_access_user_id
  ON public.audit_access_logs (user_id)
  WHERE user_id IS NOT NULL;


-- ── §1d  profiles — índice explícito en id ───────────────────────────────
--
-- Asegura lookups rápidos por id aunque el índice implícito de PK
-- no sea usado eficientemente por el query planner en Supabase Cloud.

CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);


-- ════════════════════════════════════════════════════════════════
-- §2  ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_access_logs  ENABLE ROW LEVEL SECURITY;


-- ── §2a  Políticas audit_logs ─────────────────────────────────────────────

-- Limpiar políticas previas para garantizar idempotencia
DROP POLICY IF EXISTS "audit_logs_insert_own"              ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own"              ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own_or_superadmin" ON public.audit_logs;

-- INSERT: cualquier usuario autenticado puede insertar sus propias filas.
-- (La Edge Function usa service_role — bypass automático de RLS.)
CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SELECT: cada usuario ve solo sus propias filas.
-- Superadmin accede EXCLUSIVAMENTE vía get_audit_logs() SECURITY DEFINER (ADR-019).
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- DELETE bloqueado para todos (solo purge_old_audit_logs() puede borrar).


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
--
-- Genera el hash HMAC-SHA256 del email con el pepper del Vault.
-- Usar para pseudonimización GDPR antes de archivar a 5 años.
-- search_path = public: previene inyección de funciones homónimas.

CREATE OR REPLACE FUNCTION public.hmac_email_hash(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pepper text;
BEGIN
  v_pepper := current_setting('app.audit_pepper', true);
  IF v_pepper IS NULL OR v_pepper = '' THEN
    RETURN NULL;  -- Sin pepper configurado: no generar hash (fallo silencioso)
  END IF;
  RETURN encode(
    hmac(p_email::bytea, v_pepper::bytea, 'sha256'),
    'hex'
  );
END;
$$;

REVOKE ALL     ON FUNCTION public.hmac_email_hash(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hmac_email_hash(text) TO service_role;


-- ════════════════════════════════════════════════════════════════
-- §4  FUNCIÓN SECURITY DEFINER: log_audit_access
-- ════════════════════════════════════════════════════════════════
--
-- Registra en audit_access_logs quién consultó los logs de auditoría.
-- Llamada internamente por get_audit_logs() — no expuesta al cliente.
-- search_path = public, extensions: evita resolución ambigua de auth schema
-- en builds de Supabase Cloud con search_path restringido.

CREATE OR REPLACE FUNCTION public.log_audit_access(
  p_user_id    uuid,
  p_filters    jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text;
  v_role  text;
BEGIN
  v_email := auth.jwt() ->> 'email';
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  INSERT INTO public.audit_access_logs (
    user_id, user_email, user_role, query_filters
  ) VALUES (
    p_user_id, v_email, v_role, COALESCE(p_filters, '{}')
  );
END;
$$;

REVOKE ALL     ON FUNCTION public.log_audit_access(uuid, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.log_audit_access(uuid, jsonb) TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- §5  FUNCIÓN SECURITY DEFINER: get_audit_logs (acceso superadmin)
-- ════════════════════════════════════════════════════════════════
--
-- ÚNICO canal de acceso superadmin a audit_logs (ADR-019).
-- Rechaza llamadas de usuarios sin rol 'superadmin'.
-- Registra el acceso en audit_access_logs via log_audit_access().
-- Filtros opcionales via JSON: userId, serviceName, status, fromDate,
--   toDate, correlationId, limit (max 1000).
-- search_path = public, extensions: previene 42P01 y path injection.

CREATE OR REPLACE FUNCTION public.get_audit_logs(
  filters jsonb DEFAULT '{}'
)
RETURNS SETOF public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id    uuid;
  v_caller_email text;
  v_caller_role  text;
  v_limit        integer;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'get_audit_logs: authentication required';
  END IF;

  v_caller_email := auth.jwt() ->> 'email';
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

  IF v_caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'get_audit_logs: permission denied — superadmin role required';
  END IF;

  -- Registrar el acceso (meta-auditoría)
  PERFORM public.log_audit_access(v_caller_id, filters);

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
-- Purga audit_logs con más de 90 días, archivando en audit_logs_archive
-- con pseudonimización HMAC del email (GDPR).
-- Ejecutable solo por service_role (job pg_cron — no desde cliente).

CREATE OR REPLACE FUNCTION public.purge_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff   timestamptz := now() - INTERVAL '90 days';
  v_archived integer     := 0;
  v_deleted  integer     := 0;
  rec        public.audit_logs%ROWTYPE;
BEGIN
  -- 1. Archivar filas > 90 días en audit_logs_archive (pseudonimizando email)
  FOR rec IN
    SELECT * FROM public.audit_logs
    WHERE created_at < v_cutoff
  LOOP
    INSERT INTO public.audit_logs_archive (
      original_id,  created_at,     archived_at,
      user_id,      user_email_hash, user_role,
      service_name, method_name,
      status,       duration_ms,    resource_id,
      error_message, correlation_id,
      ai_provider,  ai_model,       ai_total_tokens
    ) VALUES (
      rec.id,       rec.created_at, now(),
      rec.user_id,  public.hmac_email_hash(rec.user_email), rec.user_role,
      rec.service_name, rec.method_name,
      rec.status,   rec.duration_ms, rec.resource_id,
      rec.error_message, rec.correlation_id,
      rec.metadata->>'provider',
      rec.metadata->>'model_responded',
      (rec.metadata->>'total_tokens')::integer
    )
    ON CONFLICT (original_id) DO NOTHING;

    v_archived := v_archived + 1;
  END LOOP;

  -- 2. Eliminar las filas ya archivadas (solo las que superan el cutoff)
  DELETE FROM public.audit_logs
  WHERE  created_at < v_cutoff;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE NOTICE 'purge_old_audit_logs: % filas archivadas, % filas eliminadas (cutoff: %)',
    v_archived, v_deleted, v_cutoff;

  RETURN v_deleted;
END;
$$;

REVOKE ALL     ON FUNCTION public.purge_old_audit_logs() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.purge_old_audit_logs() TO service_role;


-- ════════════════════════════════════════════════════════════════
-- §7  FUNCIÓN SECURITY DEFINER: purge_old_audit_archive
-- ════════════════════════════════════════════════════════════════
--
-- Elimina entradas del archivo histórico con más de 5 años.
-- Ejecutada mensualmente por pg_cron (día 1 a 03:00 UTC).

CREATE OR REPLACE FUNCTION public.purge_old_audit_archive()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff  timestamptz := now() - INTERVAL '5 years';
  v_deleted integer     := 0;
BEGIN
  DELETE FROM public.audit_logs_archive
  WHERE  created_at < v_cutoff;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE NOTICE 'purge_old_audit_archive: % filas eliminadas del archivo histórico (cutoff: %)',
    v_deleted, v_cutoff;

  RETURN v_deleted;
END;
$$;

REVOKE ALL     ON FUNCTION public.purge_old_audit_archive() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.purge_old_audit_archive() TO service_role;


-- ════════════════════════════════════════════════════════════════
-- §8  JOBS pg_cron — purga automática
-- ════════════════════════════════════════════════════════════════
--
-- Requiere: pg_cron habilitado en el proyecto (ver §PRERREQUISITOS).
-- DO con EXCEPTION WHEN OTHERS: seguro si el job no existía previamente.

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

-- Job 1: purga y archivado diario a las 02:00 UTC
SELECT cron.schedule(
  'purge-audit-logs-90d',
  '0 2 * * *',
  $$ SELECT public.purge_old_audit_logs() $$
);

-- Job 2: eliminación mensual del archivo histórico > 5 años (día 1, 03:00 UTC)
SELECT cron.schedule(
  'purge-audit-archive-5y',
  '0 3 1 * *',
  $$ SELECT public.purge_old_audit_archive() $$
);


-- ════════════════════════════════════════════════════════════════
-- §V  VERIFICACIÓN POST-DESPLIEGUE
-- ════════════════════════════════════════════════════════════════
--
-- Ejecutar estos bloques manualmente tras aplicar el script,
-- para confirmar que todo quedó correctamente instalado.
--
-- V1. Tablas y RLS activo (debe devolver rowsecurity=true en las 3):
--
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename IN ('audit_logs','audit_logs_archive','audit_access_logs')
--   ORDER BY tablename;
--
-- V2. Columnas de audit_logs (debe incluir correlation_id):
--
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'audit_logs'
--   ORDER BY ordinal_position;
--
-- V3. Columnas de audit_logs_archive (debe incluir todas las de §1b):
--
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'audit_logs_archive'
--   ORDER BY ordinal_position;
--
-- V4. Políticas vigentes (exactamente las de §2):
--
--   SELECT tablename, policyname, cmd
--   FROM pg_policies
--   WHERE tablename IN ('audit_logs','audit_logs_archive','audit_access_logs')
--   ORDER BY tablename, policyname;
--
-- V5. Funciones SECURITY DEFINER (prosecdef debe ser true en todas):
--
--   SELECT proname, prosecdef
--   FROM pg_proc
--   WHERE proname IN (
--     'hmac_email_hash','purge_old_audit_logs',
--     'purge_old_audit_archive','log_audit_access','get_audit_logs'
--   )
--   ORDER BY proname;
--
-- V6. Jobs pg_cron registrados (debe devolver 2 filas, active=true):
--
--   SELECT jobid, jobname, schedule, active
--   FROM cron.job
--   WHERE jobname IN ('purge-audit-logs-90d','purge-audit-archive-5y');
--
-- V7. Índice en profiles.id (debe devolver 1 fila):
--
--   SELECT indexname FROM pg_indexes
--   WHERE tablename = 'profiles' AND indexname = 'profiles_id_idx';
--
-- V8. Test HMAC (requiere pepper configurado — ver §PRERREQUISITOS paso 2c):
--
--   SELECT public.hmac_email_hash('test@example.com');
--   -- debe devolver una cadena hex de 64 caracteres
--   -- si devuelve NULL: el pepper no está configurado
--
-- V9. Test acceso superadmin (sesión activa con rol superadmin):
--
--   SELECT * FROM public.get_audit_logs('{"limit": 5}'::jsonb);
--   -- debe devolver filas (o vacío si no hay logs aún)
--   -- Y registrar 1 entrada en audit_access_logs
--
-- V10. Test rechazo non-superadmin (sesión con rol consultant o client_*):
--
--   SELECT * FROM public.get_audit_logs('{}');
--   -- debe lanzar: "get_audit_logs: permission denied — superadmin role required"

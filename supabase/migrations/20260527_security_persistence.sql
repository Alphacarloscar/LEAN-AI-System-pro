-- ================================================================
-- GOBY — Script SQL Maestro
-- Migración: Seguridad + Persistencia
-- Fecha: 2026-05-27
--
-- Secciones:
--   A. Rate Limiting   — tabla ai_rate_limit_log + RPC atómica
--   B. tool_outputs    — estado + outputs LLM unificados (T5/T6/T7/T8/T12)
--   C. T9 granular     — t9_overrides + t9_free_items
--   D. Helper RLS      — user_has_project_access()
--   E. RLS completo    — políticas por tabla
--   F. Trigger shared  — set_updated_at()
--
-- PREREQUISITOS (verificar antes de ejecutar):
--   - Tabla 'projects'      con columnas: id uuid, company_id uuid
--   - Tabla 'company_users' con columnas: user_id uuid, company_id uuid
--     (ajustar nombre en la sección D si difiere: profiles, user_roles, etc.)
-- ================================================================

-- ================================================================
-- F. TRIGGER COMPARTIDO set_updated_at()
--    (declarado primero porque lo referencian las tablas siguientes)
-- ================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ================================================================
-- A. RATE LIMITING
-- ================================================================

-- ── Tabla de log ──────────────────────────────────────────────
-- Solo escribe la RPC (SECURITY DEFINER). Ningún usuario tiene
-- acceso directo: RLS habilitado sin políticas de usuario.

CREATE TABLE IF NOT EXISTS public.ai_rate_limit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  project_id  uuid        NOT NULL REFERENCES public.projects(id)  ON DELETE CASCADE,
  tool_code   text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_rate_limit_log IS
  'Log de llamadas a la Edge Function ai-recommend. Acceso exclusivo vía RPC (SECURITY DEFINER). Limpiar registros > 24h con pg_cron.';

-- Índice para la ventana temporal por usuario (query del RPC)
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_created
  ON public.ai_rate_limit_log (user_id, created_at DESC);

-- Índice auxiliar para limpieza periódica
CREATE INDEX IF NOT EXISTS idx_rate_limit_created
  ON public.ai_rate_limit_log (created_at);

-- RLS: tabla bloqueada para todos los usuarios del frontend.
ALTER TABLE public.ai_rate_limit_log ENABLE ROW LEVEL SECURITY;
-- (sin políticas de usuario: acceso denegado por defecto)


-- ── RPC atómica: check_and_log_ai_call ───────────────────────
--
-- Llamada desde Edge Function con service_role.
-- Serializa peticiones concurrentes del mismo usuario con
-- pg_advisory_xact_lock → imposible race condition entre
-- el COUNT y el INSERT.
--
-- Parámetros:
--   p_user_id    — auth.uid() del usuario autenticado
--   p_project_id — engagement activo (validado por RLS antes de llegar aquí)
--   p_tool_code  — herramienta IA invocada ('t6_policy', 't7_plan', ...)
--
-- Retorna jsonb:
--   { allowed: true,  calls_in_window: N, limit: 10 }
--   { allowed: false, reason: 'rate_limit_exceeded', retry_after_seconds: 60 }

CREATE OR REPLACE FUNCTION public.check_and_log_ai_call(
  p_user_id    uuid,
  p_project_id uuid,
  p_tool_code  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count        int;
  v_window_start timestamptz  := now() - interval '1 minute';
  v_limit        constant int := 10;   -- máx llamadas por minuto por usuario
BEGIN
  -- Advisory lock a nivel de transacción, con scope por user_id.
  -- hashtext() → int → cast bigint (suficiente distribución para este volumen).
  -- El lock se libera automáticamente al commit/rollback de la transacción.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text)::bigint);

  -- Contar llamadas en la ventana de 1 minuto (ahora serializado por el lock)
  SELECT COUNT(*)
    INTO v_count
    FROM public.ai_rate_limit_log
   WHERE user_id    = p_user_id
     AND created_at > v_window_start;

  -- Rechazar si supera el límite
  IF v_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed',             false,
      'reason',              'rate_limit_exceeded',
      'calls_in_window',     v_count,
      'limit',               v_limit,
      'retry_after_seconds', 60
    );
  END IF;

  -- Registrar la llamada (dentro del mismo advisory lock)
  INSERT INTO public.ai_rate_limit_log (user_id, project_id, tool_code)
  VALUES (p_user_id, p_project_id, p_tool_code);

  RETURN jsonb_build_object(
    'allowed',         true,
    'calls_in_window', v_count + 1,
    'limit',           v_limit
  );
END;
$$;

COMMENT ON FUNCTION public.check_and_log_ai_call IS
  'RPC atómica de rate limit. Usar advisory lock para serializar concurrencia por usuario. Solo llamar desde Edge Function con service_role.';

-- ── Limpieza periódica (ejecutar como Supabase Scheduled Job) ─
-- Ejemplo para pg_cron (activar extensión si no está activa):
--
-- SELECT cron.schedule(
--   'cleanup-rate-limit-log',
--   '0 3 * * *',    -- 03:00 UTC diario
--   $$DELETE FROM public.ai_rate_limit_log
--     WHERE created_at < now() - interval '24 hours'$$
-- );


-- ================================================================
-- B. TOOL_OUTPUTS — tabla unificada (T5, T6, T7, T8, T12)
-- ================================================================
--
-- Cubre dos tipos de datos:
--   Estado interactivo : T5 canvas, T12 controles ISO
--   Outputs LLM        : T6 política, T7 plan de cambio, T8 comunicaciones
--
-- Versionado:
--   - Los outputs LLM nunca se borran: se archivan (archived = true)
--     antes de insertar la versión nueva.
--   - El estado interactivo se actualiza in-place (UPDATE donde archived = false).
--   - El índice parcial uniq_tool_outputs_active garantiza
--     exactamente UN registro activo (archived = false) por (project_id, tool_code).
--
-- Frescura:
--   - stale_after: fecha a partir de la cual el consultor debería regenerar.
--     Outputs LLM: now() + 90 days al guardar. Estado: NULL (no expira).
--   - El frontend consulta: is_stale = stale_after IS NOT NULL AND stale_after < now()

CREATE TABLE IF NOT EXISTS public.tool_outputs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_code    text        NOT NULL,
  -- Valores esperados:
  --   't5_canvas'  — canvas de activación (T5)
  --   't6_policy'  — política corporativa IA generada (T6)
  --   't7_plan'    — plan de cambio generado (T7)
  --   't8_comms'   — comunicaciones generadas (T8)
  --   't12_iso'    — controles ISO 42001 (T12)
  payload      jsonb       NOT NULL DEFAULT '{}',
  version      int         NOT NULL DEFAULT 1 CHECK (version >= 1),
  status       text        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'archived', 'draft')),
  stale_after  timestamptz,
  -- NULL  → no expira (estado interactivo)
  -- valor → outputs LLM: sugerencia de regeneración tras esa fecha
  archived     boolean     NOT NULL DEFAULT false,
  -- false → registro activo (uno por project_id + tool_code, forzado por índice parcial)
  -- true  → versión histórica, nunca borrar
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL
  -- quién guardó esta versión; la Edge Function o el frontend setean auth.uid()
);

COMMENT ON TABLE  public.tool_outputs             IS 'Estado persistido y outputs LLM para T5, T6, T7, T8 y T12. Outputs archivados se conservan indefinidamente.';
COMMENT ON COLUMN public.tool_outputs.tool_code   IS 'Clave de herramienta: t5_canvas | t6_policy | t7_plan | t8_comms | t12_iso';
COMMENT ON COLUMN public.tool_outputs.payload     IS 'JSON del estado completo. Estructura específica por tool_code.';
COMMENT ON COLUMN public.tool_outputs.version     IS 'Contador incremental. Sube con cada nueva versión activa.';
COMMENT ON COLUMN public.tool_outputs.stale_after IS 'Outputs LLM: fecha sugerida de regeneración. NULL = nunca caduca.';
COMMENT ON COLUMN public.tool_outputs.archived    IS 'true = versión histórica (inmutable). false = versión activa.';

-- Índice de consulta principal: registro activo de una herramienta en un proyecto
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tool_outputs_active
  ON public.tool_outputs (project_id, tool_code)
  WHERE archived = false;
-- Este índice es la clave de todo el diseño:
-- garantiza max 1 fila activa por (project, tool) a nivel de motor,
-- sin necesidad de lógica de deduplicación en el frontend.

-- Índice para historial completo por proyecto (vista de auditoría)
CREATE INDEX IF NOT EXISTS idx_tool_outputs_project_created
  ON public.tool_outputs (project_id, created_at DESC);

-- Trigger updated_at
CREATE TRIGGER trg_tool_outputs_updated_at
  BEFORE UPDATE ON public.tool_outputs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.tool_outputs ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- C. T9 — TABLAS GRANULARES
-- ================================================================

-- ── t9_overrides ──────────────────────────────────────────────
-- Una fila por caso de uso cuya posición/responsable ha sido editada
-- en el Gantt. UPSERT on conflict (project_id, use_case_id).

CREATE TABLE IF NOT EXISTS public.t9_overrides (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  use_case_id   text        NOT NULL,
  -- UUID del UseCase en T4 (text para no acoplar FK a otra tabla)
  start_month   smallint    NOT NULL CHECK (start_month BETWEEN 0 AND 11),
  end_month     smallint    NOT NULL CHECK (end_month   BETWEEN 0 AND 11),
  responsible   text        NOT NULL DEFAULT '',
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT t9_overrides_end_gte_start CHECK (end_month >= start_month),
  UNIQUE (project_id, use_case_id)
);

COMMENT ON TABLE public.t9_overrides IS
  'Posiciones y responsables editados manualmente en el Gantt de T9. UPSERT on (project_id, use_case_id).';

CREATE INDEX IF NOT EXISTS idx_t9_overrides_project
  ON public.t9_overrides (project_id);

CREATE TRIGGER trg_t9_overrides_updated_at
  BEFORE UPDATE ON public.t9_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.t9_overrides ENABLE ROW LEVEL SECURITY;


-- ── t9_free_items ─────────────────────────────────────────────
-- Iniciativas libres añadidas al Gantt (no proceden de T4).

CREATE TABLE IF NOT EXISTS public.t9_free_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name          text        NOT NULL CHECK (length(trim(name)) > 0),
  department    text        NOT NULL DEFAULT '',
  responsible   text        NOT NULL DEFAULT '',
  start_month   smallint    NOT NULL CHECK (start_month BETWEEN 0 AND 11),
  end_month     smallint    NOT NULL CHECK (end_month   BETWEEN 0 AND 11),
  risk_level    text        NOT NULL DEFAULT 'bajo'
                            CHECK (risk_level IN ('bajo', 'medio', 'alto')),
  status        text        NOT NULL DEFAULT 'pendiente'
                            CHECK (status IN ('pendiente', 'en_curso', 'completado')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT t9_free_items_end_gte_start CHECK (end_month >= start_month)
);

COMMENT ON TABLE public.t9_free_items IS
  'Iniciativas libres del Gantt T9 (no provienen de T4). CRUD estándar.';

CREATE INDEX IF NOT EXISTS idx_t9_free_items_project
  ON public.t9_free_items (project_id);

CREATE TRIGGER trg_t9_free_items_updated_at
  BEFORE UPDATE ON public.t9_free_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.t9_free_items ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- D. HELPER RLS — user_has_project_access(p_project_id)
-- ================================================================
--
-- Verifica si el usuario autenticado (auth.uid()) pertenece a la
-- empresa dueña del proyecto indicado.
--
-- SECURITY DEFINER: puede leer company_users y projects sin que
-- el llamador necesite permisos directos sobre esas tablas.
--
-- STABLE: PostgreSQL puede cachear el resultado dentro de la misma
-- transacción (múltiples evaluaciones RLS = 1 sola query).
--
-- ⚠️ AJUSTAR si la tabla de membresía usa otro nombre:
--    company_users → profiles / user_companies / memberships / etc.

CREATE OR REPLACE FUNCTION public.user_has_project_access(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.projects      p
    JOIN   public.company_users cu ON cu.company_id = p.company_id
    WHERE  p.id       = p_project_id
      AND  cu.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.user_has_project_access IS
  'Helper RLS: true si auth.uid() pertenece a la empresa del proyecto. STABLE → cacheado por transacción.';


-- ================================================================
-- E. RLS — POLÍTICAS COMPLETAS
-- ================================================================
--
-- Principio: cliente frontend usa ANON_KEY + JWT del usuario →
-- RLS se aplica automáticamente con auth.uid().
-- El helper user_has_project_access() centraliza la lógica de acceso.

-- ── tool_outputs ──────────────────────────────────────────────

-- SELECT: activos e históricos (archived = true/false) del propio proyecto
CREATE POLICY "tool_outputs_select"
  ON public.tool_outputs
  FOR SELECT
  USING (public.user_has_project_access(project_id));

-- INSERT: debe pertenecer al proyecto + updated_by = propio uid (o null)
CREATE POLICY "tool_outputs_insert"
  ON public.tool_outputs
  FOR INSERT
  WITH CHECK (
    public.user_has_project_access(project_id)
    AND (updated_by IS NULL OR updated_by = auth.uid())
  );

-- UPDATE: cualquier miembro del proyecto puede actualizar
-- (el frontend es responsable de setear updated_by = auth.uid())
CREATE POLICY "tool_outputs_update"
  ON public.tool_outputs
  FOR UPDATE
  USING  (public.user_has_project_access(project_id))
  WITH CHECK (public.user_has_project_access(project_id));

-- DELETE: prohibido para todos — outputs LLM son inmutables,
-- los estados se archivan, nunca se borran.
CREATE POLICY "tool_outputs_no_delete"
  ON public.tool_outputs
  FOR DELETE
  USING (false);


-- ── t9_overrides ──────────────────────────────────────────────

CREATE POLICY "t9_overrides_select"
  ON public.t9_overrides
  FOR SELECT
  USING (public.user_has_project_access(project_id));

CREATE POLICY "t9_overrides_insert"
  ON public.t9_overrides
  FOR INSERT
  WITH CHECK (public.user_has_project_access(project_id));

CREATE POLICY "t9_overrides_update"
  ON public.t9_overrides
  FOR UPDATE
  USING  (public.user_has_project_access(project_id))
  WITH CHECK (public.user_has_project_access(project_id));

-- Override puede borrarse: el usuario resetea la posición del item al default
CREATE POLICY "t9_overrides_delete"
  ON public.t9_overrides
  FOR DELETE
  USING (public.user_has_project_access(project_id));


-- ── t9_free_items ─────────────────────────────────────────────

CREATE POLICY "t9_free_items_select"
  ON public.t9_free_items
  FOR SELECT
  USING (public.user_has_project_access(project_id));

CREATE POLICY "t9_free_items_insert"
  ON public.t9_free_items
  FOR INSERT
  WITH CHECK (public.user_has_project_access(project_id));

CREATE POLICY "t9_free_items_update"
  ON public.t9_free_items
  FOR UPDATE
  USING  (public.user_has_project_access(project_id))
  WITH CHECK (public.user_has_project_access(project_id));

CREATE POLICY "t9_free_items_delete"
  ON public.t9_free_items
  FOR DELETE
  USING (public.user_has_project_access(project_id));


-- ================================================================
-- RESUMEN DE DEPENDENCIAS ENTRE SECCIONES
-- ================================================================
--
--  auth.users ──┬──► ai_rate_limit_log.user_id
--               └──► tool_outputs.updated_by
--
--  projects   ──┬──► ai_rate_limit_log.project_id
--               ├──► tool_outputs.project_id
--               ├──► t9_overrides.project_id
--               └──► t9_free_items.project_id
--
--  company_users ──► user_has_project_access() [JOIN con projects]
--
--  check_and_log_ai_call() ──► ai_rate_limit_log  [SECURITY DEFINER]
--  user_has_project_access() ──► projects + company_users [SECURITY DEFINER]
--
-- FLUJO EDGE FUNCTION (post-implementación):
--   1. Extraer JWT del header Authorization
--   2. Crear supabase_user_client(ANON_KEY, jwt) → RLS activo
--   3. supabase_admin.rpc('check_and_log_ai_call', {...}) → service_role solo para rate limit
--   4. Si allowed=false → 429
--   5. supabase_user_client.from('projects').select() → RLS valida acceso
--   6. Llamar a Claude API
--   7. supabase_user_client.from('tool_outputs').upsert() → RLS controla escritura
--
-- ================================================================

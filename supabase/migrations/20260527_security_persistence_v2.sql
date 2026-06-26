-- ================================================================
-- LEAN AI SYSTEM — Script SQL Maestro v2
-- Migración: Seguridad + Persistencia
-- Fecha: 2026-05-27
--
-- SCHEMA REAL VERIFICADO (src/types/database.types.ts):
--   ✓ projects        (id uuid, company_id uuid, owner_id uuid, ...)
--   ✓ project_members (project_id uuid, user_id uuid, role text)
--       → membresía explícita de consultores Alpha por proyecto
--   ✓ profiles        (id uuid, email, name, role UserRole, company_id uuid)
--       → rol client_editor / client_viewer accede por profiles.company_id
--   ✓ is_project_member(pid) ya existe — se reutiliza en el helper
--   ✓ t5_canvas       tabla existente (será supersedida por tool_outputs)
--   ✓ iso42001_controls tabla existente (será supersedida por tool_outputs)
--
-- NOTA T5/T12: t5_canvas e iso42001_controls existen pero los stores
--   siguen usando localStorage. Este script unifica T5/T12 en tool_outputs.
--   Las tablas antiguas no se tocan aquí; se marcarán deprecated al migrar
--   los stores en el sprint siguiente.
--
-- Secciones:
--   0. Helper compartido         set_updated_at()
--   A. Rate Limiting             ai_rate_limit_log + check_and_log_ai_call
--   B. tool_outputs              T5/T6/T7/T8/T12 unificados
--   C. T9 granular               t9_overrides + t9_free_items
--   D. Helper de acceso          user_has_project_access()
--   E. RPC transaccional         save_tool_output()
--   F. Grants y REVOKE           permisos de funciones
--   G. RLS completo              idempotente, TO authenticated
--   H. Edge Function flow        orden correcto documentado
-- ================================================================

-- ================================================================
-- 0. HELPER COMPARTIDO — set_updated_at()
--    Trigger reutilizado por todas las tablas con updated_at.
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
-- Accesible SOLO por la RPC check_and_log_ai_call (SECURITY DEFINER).
-- Ningún usuario del frontend puede leer ni escribir directamente.
-- RLS habilitado sin políticas de usuario = bloqueo total para anon/authenticated.

CREATE TABLE IF NOT EXISTS public.ai_rate_limit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_code   text        NOT NULL
              CHECK (tool_code IN (
                't5_canvas', 't6_policy', 't7_plan',
                't8_comms',  't12_iso',
                't9_overrides', 't9_free_items'   -- incluye operaciones de T9
              )),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_rate_limit_log IS
  'Log de llamadas IA por usuario. Solo escribe check_and_log_ai_call (service_role). '
  'Limpiar con pg_cron: DELETE ... WHERE created_at < now() - interval ''24 hours''.';

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_created
  ON public.ai_rate_limit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_created
  ON public.ai_rate_limit_log (created_at);

ALTER TABLE public.ai_rate_limit_log ENABLE ROW LEVEL SECURITY;
-- Sin políticas de usuario → acceso denegado por defecto para anon y authenticated.


-- ── RPC atómica: check_and_log_ai_call ───────────────────────
--
-- LLAMAR SOLO DESDE EDGE FUNCTION con service_role, DESPUÉS de validar
-- acceso al proyecto con el cliente user-scoped (ver sección H).
--
-- Advisory lock por user_id: serializa peticiones concurrentes del mismo
-- usuario → impossibilita race condition entre COUNT e INSERT.
--
-- Retorna jsonb:
--   { "allowed": true,  "calls_in_window": N, "limit": 10 }
--   { "allowed": false, "reason": "rate_limit_exceeded",
--     "calls_in_window": N, "limit": 10, "retry_after_seconds": 60 }

DROP FUNCTION IF EXISTS public.check_and_log_ai_call(uuid, uuid, text);

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
  v_limit        constant int := 10;
BEGIN
  -- Advisory lock a nivel de transacción, scoped por user_id.
  -- Se libera automáticamente en commit/rollback.
  -- hashtext() → int4, cast a int8 para pg_advisory_xact_lock.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text)::bigint);

  SELECT COUNT(*)
    INTO v_count
    FROM public.ai_rate_limit_log
   WHERE user_id    = p_user_id
     AND created_at > v_window_start;

  IF v_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed',             false,
      'reason',              'rate_limit_exceeded',
      'calls_in_window',     v_count,
      'limit',               v_limit,
      'retry_after_seconds', 60
    );
  END IF;

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
  'Rate limit atómico con advisory lock. Solo llamar desde Edge Function con service_role, '
  'DESPUÉS de validar acceso al proyecto con cliente user-scoped.';

-- Limpieza periódica sugerida (pg_cron):
-- SELECT cron.schedule('cleanup-rate-limit-log','0 3 * * *',
--   $$DELETE FROM public.ai_rate_limit_log WHERE created_at < now()-interval '24 hours'$$);


-- ================================================================
-- B. TOOL_OUTPUTS — tabla unificada (T5, T6, T7, T8, T12)
-- ================================================================
--
-- Dos tipos de datos con ciclos de vida distintos:
--
--   INTERACTIVO (T5 canvas, T12 controles ISO):
--     → UPDATE in-place; archived siempre false; version incrementa.
--
--   OUTPUT LLM (T6 política, T7 plan cambio, T8 comunicaciones):
--     → El registro activo se archiva (archived → true, status → 'archived')
--       antes de insertar la nueva versión. Nunca se borra.
--     → stale_after: sugerencia de regeneración (ej. now() + 90 días).
--
-- Invariante clave:
--   UNIQUE INDEX uniq_tool_outputs_active garantiza exactamente UNA fila
--   con archived=false por (project_id, tool_code) a nivel de motor.
--   No depende de lógica en el frontend → gestionado por save_tool_output().
--
-- Consistencia archived↔status:
--   CHECK chk_archived_status_consistent impide estados incoherentes.

CREATE TABLE IF NOT EXISTS public.tool_outputs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_code       text        NOT NULL
                  CHECK (tool_code IN (
                    't5_canvas',   -- estado interactivo: canvas de activación (T5)
                    't6_policy',   -- output LLM: política corporativa IA (T6)
                    't7_plan',     -- output LLM: plan de cambio (T7)
                    't8_comms',    -- output LLM: comunicaciones stakeholders (T8)
                    't12_iso'      -- estado interactivo: controles ISO 42001 (T12)
                  )),
  payload         jsonb       NOT NULL DEFAULT '{}',
  version         int         NOT NULL DEFAULT 1 CHECK (version >= 1),
  payload_version int         NOT NULL DEFAULT 1 CHECK (payload_version >= 1),
  -- payload_version: versión del schema del payload (para detectar drift entre versiones de app)
  status          text        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived', 'draft')),
  stale_after     timestamptz,
  -- NULL = no caduca (estados interactivos)
  -- valor = outputs LLM: fecha a partir de la cual se sugiere regeneración
  archived        boolean     NOT NULL DEFAULT false,
  -- false = registro activo (exactamente uno por project_id + tool_code)
  -- true  = versión histórica — NUNCA BORRAR (DELETE policy = false)

  -- ── Auditoría completa ──────────────────────────────────────
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- ── Constraint de consistencia archived↔status ──────────────
  CONSTRAINT chk_archived_status_consistent CHECK (
    (archived = false AND status IN ('active', 'draft'))
    OR
    (archived = true  AND status = 'archived')
  )
);

COMMENT ON TABLE  public.tool_outputs               IS 'Estado e outputs LLM para T5, T6, T7, T8, T12. Outputs archivados son inmutables.';
COMMENT ON COLUMN public.tool_outputs.tool_code     IS 't5_canvas | t6_policy | t7_plan | t8_comms | t12_iso';
COMMENT ON COLUMN public.tool_outputs.version       IS 'Versión del registro (incrementa en cada guardado activo).';
COMMENT ON COLUMN public.tool_outputs.payload_version IS 'Versión del schema del payload JSON (el frontend lo determina).';
COMMENT ON COLUMN public.tool_outputs.stale_after   IS 'Outputs LLM: fecha de expiración sugerida. NULL = nunca caduca.';
COMMENT ON COLUMN public.tool_outputs.archived      IS 'true = versión histórica inmutable. false = versión activa.';

-- Índice único parcial: UNA sola fila activa por (project_id, tool_code)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tool_outputs_active
  ON public.tool_outputs (project_id, tool_code)
  WHERE archived = false;

-- Índice para historial completo y auditoría
CREATE INDEX IF NOT EXISTS idx_tool_outputs_project_created
  ON public.tool_outputs (project_id, created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_tool_outputs_updated_at ON public.tool_outputs;
CREATE TRIGGER trg_tool_outputs_updated_at
  BEFORE UPDATE ON public.tool_outputs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tool_outputs ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- C. T9 — TABLAS GRANULARES (con roadmap_year)
-- ================================================================

-- ── t9_overrides ──────────────────────────────────────────────
-- Una fila por (proyecto, caso de uso, año de roadmap).
-- roadmap_year desacopla la posición del año actual del sistema:
-- si se regenera el roadmap en 2027, los datos de 2026 se conservan.

CREATE TABLE IF NOT EXISTS public.t9_overrides (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  use_case_id   text        NOT NULL,
  roadmap_year  smallint    NOT NULL DEFAULT EXTRACT(YEAR FROM now())::smallint,
  start_month   smallint    NOT NULL CHECK (start_month BETWEEN 0 AND 11),
  end_month     smallint    NOT NULL CHECK (end_month   BETWEEN 0 AND 11),
  responsible   text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT t9_overrides_end_gte_start   CHECK (end_month >= start_month),
  CONSTRAINT t9_overrides_year_range      CHECK (roadmap_year BETWEEN 2020 AND 2099),
  UNIQUE (project_id, use_case_id, roadmap_year)
);

COMMENT ON TABLE  public.t9_overrides              IS 'Posiciones/responsables editados en el Gantt T9, por año de roadmap.';
COMMENT ON COLUMN public.t9_overrides.use_case_id  IS 'UUID del UseCase en T4 (text, sin FK para evitar acoplamiento).';
COMMENT ON COLUMN public.t9_overrides.roadmap_year IS 'Año del roadmap al que pertenece este override. Desacopla del año del sistema.';

CREATE INDEX IF NOT EXISTS idx_t9_overrides_project_year
  ON public.t9_overrides (project_id, roadmap_year);

DROP TRIGGER IF EXISTS trg_t9_overrides_updated_at ON public.t9_overrides;
CREATE TRIGGER trg_t9_overrides_updated_at
  BEFORE UPDATE ON public.t9_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.t9_overrides ENABLE ROW LEVEL SECURITY;


-- ── t9_free_items ─────────────────────────────────────────────
-- Iniciativas libres del Gantt (no provienen de T4).

CREATE TABLE IF NOT EXISTS public.t9_free_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  roadmap_year  smallint    NOT NULL DEFAULT EXTRACT(YEAR FROM now())::smallint,
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
  CONSTRAINT t9_free_items_end_gte_start CHECK (end_month >= start_month),
  CONSTRAINT t9_free_items_year_range    CHECK (roadmap_year BETWEEN 2020 AND 2099)
);

COMMENT ON TABLE  public.t9_free_items              IS 'Iniciativas libres del Gantt T9. No provienen de T4. Por año de roadmap.';
COMMENT ON COLUMN public.t9_free_items.roadmap_year IS 'Año del roadmap al que pertenece el item libre.';

CREATE INDEX IF NOT EXISTS idx_t9_free_items_project_year
  ON public.t9_free_items (project_id, roadmap_year);

DROP TRIGGER IF EXISTS trg_t9_free_items_updated_at ON public.t9_free_items;
CREATE TRIGGER trg_t9_free_items_updated_at
  BEFORE UPDATE ON public.t9_free_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.t9_free_items ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- D. HELPER DE ACCESO — user_has_project_access(p_project_id)
-- ================================================================
--
-- Cubre DOS patrones de acceso del schema real:
--
--   1. Consultores Alpha: vía project_members.user_id
--      (roles: consultant, viewer en project_members)
--
--   2. Usuarios cliente: vía profiles.company_id = projects.company_id
--      (roles: client_editor, client_viewer en profiles.role)
--
-- SECURITY DEFINER: lee project_members y profiles sin que el llamador
-- necesite permisos directos sobre esas tablas.
-- STABLE: PostgreSQL cachea el resultado en la misma transacción →
-- múltiples evaluaciones RLS cuestan UNA sola query.

DROP FUNCTION IF EXISTS public.user_has_project_access(uuid);

CREATE OR REPLACE FUNCTION public.user_has_project_access(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Patrón 1: consultores asignados explícitamente al proyecto
    SELECT 1
    FROM   public.project_members pm
    WHERE  pm.project_id = p_project_id
      AND  pm.user_id    = auth.uid()

    UNION ALL

    -- Patrón 2: usuarios cliente vinculados por empresa
    SELECT 1
    FROM   public.projects  p
    JOIN   public.profiles  pr ON pr.company_id = p.company_id
    WHERE  p.id  = p_project_id
      AND  pr.id = auth.uid()
      AND  pr.role IN ('client_editor', 'client_viewer')
  )
$$;

COMMENT ON FUNCTION public.user_has_project_access IS
  'Acceso por project_members (consultores) O por profiles.company_id (clientes). '
  'STABLE → cacheado por transacción. Base de todas las políticas RLS.';


-- ================================================================
-- E. RPC TRANSACCIONAL — save_tool_output()
-- ================================================================
--
-- PROPÓSITO: único punto de escritura en tool_outputs desde el frontend
-- y Edge Function. Garantiza integridad transaccional sin depender de
-- upsert manual del cliente contra el índice parcial.
--
-- CICLOS DE VIDA por tool:
--   Interactivo (t5_canvas, t12_iso):
--     → UPDATE in-place si existe registro activo.
--     → INSERT si es la primera vez.
--
--   LLM (t6_policy, t7_plan, t8_comms):
--     → Archiva el registro activo actual (archived=true, status='archived').
--     → Inserta nueva fila (archived=false, version+1).
--     → Las versiones archivadas son INMUTABLES: no se borran jamás.
--
-- SEGURIDAD:
--   SECURITY DEFINER: necesario para poder archivar registros vía UPDATE
--   (la policy de UPDATE del frontend solo permite filas con archived=false;
--   el archivado pone archived=true, lo que el frontend no puede hacer).
--   La función verifica user_has_project_access() internamente.
--
-- PARÁMETROS:
--   p_project_id     — proyecto activo
--   p_tool_code      — herramienta (t5_canvas | t6_policy | t7_plan | t8_comms | t12_iso)
--   p_payload        — estado completo serializado como jsonb
--   p_stale_after    — NULL para interactivos; now()+90d para LLM sugerido
--   p_payload_version — versión del schema del payload que envía el frontend
--
-- RETORNA: uuid del registro guardado (nuevo o actualizado)

DROP FUNCTION IF EXISTS public.save_tool_output(uuid, text, jsonb, timestamptz, int);

CREATE OR REPLACE FUNCTION public.save_tool_output(
  p_project_id      uuid,
  p_tool_code       text,
  p_payload         jsonb,
  p_stale_after     timestamptz DEFAULT NULL,
  p_payload_version int         DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    uuid := auth.uid();
  v_is_llm       boolean;
  v_current_id   uuid;
  v_current_ver  int;
  v_new_id       uuid;

  -- Tools que generan output LLM (archivo histórico en cada guardado)
  v_llm_tools    text[] := ARRAY['t6_policy', 't7_plan', 't8_comms'];

  -- Tools de estado interactivo (update in-place)
  v_interactive_tools text[] := ARRAY['t5_canvas', 't12_iso'];
BEGIN

  -- ── 1. Validar autenticación ────────────────────────────────
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'save_tool_output: usuario no autenticado'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- ── 2. Validar acceso al proyecto ───────────────────────────
  -- Comprueba project_members (consultores) y profiles.company_id (clientes).
  IF NOT public.user_has_project_access(p_project_id) THEN
    RAISE EXCEPTION 'save_tool_output: acceso denegado al proyecto %', p_project_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- ── 3. Validar tool_code ────────────────────────────────────
  IF p_tool_code NOT IN (
    't5_canvas', 't6_policy', 't7_plan', 't8_comms', 't12_iso'
  ) THEN
    RAISE EXCEPTION 'save_tool_output: tool_code inválido: %', p_tool_code
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- ── 4. Determinar tipo de tool ──────────────────────────────
  v_is_llm := p_tool_code = ANY(v_llm_tools);

  -- ── 5. Obtener registro activo actual ───────────────────────
  SELECT id, version
    INTO v_current_id, v_current_ver
    FROM public.tool_outputs
   WHERE project_id = p_project_id
     AND tool_code  = p_tool_code
     AND archived   = false;

  IF v_is_llm THEN
    -- ── 6a. Flujo LLM: archivar anterior + insertar nuevo ────

    IF v_current_id IS NOT NULL THEN
      -- Archivar versión activa (SECURITY DEFINER: bypasses UPDATE policy
      -- que solo permite archived=false; esta mutación pone archived=true)
      UPDATE public.tool_outputs
         SET archived    = true,
             status      = 'archived',
             updated_at  = now(),
             updated_by  = v_caller_id
       WHERE id = v_current_id;
    END IF;

    -- Insertar nueva versión activa
    INSERT INTO public.tool_outputs (
      project_id,   tool_code,    payload,
      version,      payload_version,
      status,       archived,     stale_after,
      created_by,   updated_by
    ) VALUES (
      p_project_id, p_tool_code,  p_payload,
      COALESCE(v_current_ver, 0) + 1,
      p_payload_version,
      'active',     false,        p_stale_after,
      v_caller_id,  v_caller_id
    )
    RETURNING id INTO v_new_id;

  ELSE
    -- ── 6b. Flujo interactivo: upsert in-place ───────────────

    IF v_current_id IS NOT NULL THEN
      UPDATE public.tool_outputs
         SET payload         = p_payload,
             version         = v_current_ver + 1,
             payload_version = p_payload_version,
             stale_after     = p_stale_after,
             updated_at      = now(),
             updated_by      = v_caller_id
       WHERE id = v_current_id
      RETURNING id INTO v_new_id;
    ELSE
      INSERT INTO public.tool_outputs (
        project_id,   tool_code,    payload,
        version,      payload_version,
        status,       archived,     stale_after,
        created_by,   updated_by
      ) VALUES (
        p_project_id, p_tool_code,  p_payload,
        1,            p_payload_version,
        'active',     false,        p_stale_after,
        v_caller_id,  v_caller_id
      )
      RETURNING id INTO v_new_id;
    END IF;

  END IF;

  RETURN v_new_id;

END;
$$;

COMMENT ON FUNCTION public.save_tool_output IS
  'Único punto de escritura en tool_outputs. LLM: archiva anterior + inserta nuevo. '
  'Interactivo: update in-place. SECURITY DEFINER para gestionar archivo histórico.';


-- ================================================================
-- F. GRANTS Y REVOKE — permisos de funciones
-- ================================================================
--
-- Principio: mínimo privilegio.
--   check_and_log_ai_call → solo service_role (Edge Function admin)
--   user_has_project_access → solo authenticated (RLS policies y RPCs de usuario)
--   save_tool_output → solo authenticated (frontend y Edge Function user-scoped)
--   set_updated_at → trigger interno, sin acceso directo de usuarios

-- ── check_and_log_ai_call ─────────────────────────────────────
REVOKE ALL ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) TO service_role;

-- ── user_has_project_access ───────────────────────────────────
-- Necesita ser callable por authenticated para que las RLS policies funcionen.
-- anon bloqueado: usuarios no autenticados no acceden a datos de proyectos.
REVOKE ALL    ON FUNCTION public.user_has_project_access(uuid) FROM PUBLIC;
REVOKE ALL    ON FUNCTION public.user_has_project_access(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.user_has_project_access(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.user_has_project_access(uuid) TO service_role;

-- ── save_tool_output ──────────────────────────────────────────
-- Callable por authenticated (frontend directo y Edge Function user-scoped).
-- El service_role puede invocarla pero nunca debería hacerlo directamente
-- (la Edge Function usa el cliente user-scoped para save).
REVOKE ALL    ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) FROM PUBLIC;
REVOKE ALL    ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) FROM anon;
GRANT  EXECUTE ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) TO authenticated;

-- ── set_updated_at ────────────────────────────────────────────
-- Solo se ejecuta como función de trigger. Sin acceso directo de usuarios.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM authenticated;
-- (service_role mantiene acceso implícito como owner)


-- ================================================================
-- G. RLS — POLÍTICAS COMPLETAS (idempotentes, TO authenticated)
-- ================================================================
--
-- Todas las políticas de usuario son TO authenticated:
--   - anon (no autenticado) queda bloqueado por defecto.
--   - service_role bypassa RLS por definición de Postgres → no necesita políticas.

-- ── tool_outputs ──────────────────────────────────────────────

DROP POLICY IF EXISTS "tool_outputs_select"    ON public.tool_outputs;
DROP POLICY IF EXISTS "tool_outputs_insert"    ON public.tool_outputs;
DROP POLICY IF EXISTS "tool_outputs_update"    ON public.tool_outputs;
DROP POLICY IF EXISTS "tool_outputs_no_delete" ON public.tool_outputs;

-- SELECT: activos e históricos del propio proyecto
CREATE POLICY "tool_outputs_select"
  ON public.tool_outputs
  FOR SELECT
  TO authenticated
  USING (public.user_has_project_access(project_id));

-- INSERT: solo para filas activas; created_by debe ser el propio usuario
-- En la práctica el frontend debería usar save_tool_output() en lugar de INSERT directo.
-- Esta política actúa como red de seguridad.
CREATE POLICY "tool_outputs_insert"
  ON public.tool_outputs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_project_access(project_id)
    AND archived = false
    AND (created_by IS NULL OR created_by = auth.uid())
  );

-- UPDATE: solo filas activas (archived = false).
-- Las filas archivadas son inmutables desde el frontend.
-- El archivado real lo gestiona save_tool_output() (SECURITY DEFINER).
CREATE POLICY "tool_outputs_update"
  ON public.tool_outputs
  FOR UPDATE
  TO authenticated
  USING  (public.user_has_project_access(project_id) AND archived = false)
  WITH CHECK (public.user_has_project_access(project_id) AND archived = false);

-- DELETE: prohibido para todos los usuarios.
-- Los outputs LLM son auditoría permanente.
CREATE POLICY "tool_outputs_no_delete"
  ON public.tool_outputs
  FOR DELETE
  TO authenticated
  USING (false);


-- ── t9_overrides ──────────────────────────────────────────────

DROP POLICY IF EXISTS "t9_overrides_select" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_insert" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_update" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_delete" ON public.t9_overrides;

CREATE POLICY "t9_overrides_select"
  ON public.t9_overrides
  FOR SELECT
  TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY "t9_overrides_insert"
  ON public.t9_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_project_access(project_id));

CREATE POLICY "t9_overrides_update"
  ON public.t9_overrides
  FOR UPDATE
  TO authenticated
  USING  (public.user_has_project_access(project_id))
  WITH CHECK (public.user_has_project_access(project_id));

-- Override puede borrarse: el consultor resetea la posición al valor calculado
CREATE POLICY "t9_overrides_delete"
  ON public.t9_overrides
  FOR DELETE
  TO authenticated
  USING (public.user_has_project_access(project_id));


-- ── t9_free_items ─────────────────────────────────────────────

DROP POLICY IF EXISTS "t9_free_items_select" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_insert" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_update" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_delete" ON public.t9_free_items;

CREATE POLICY "t9_free_items_select"
  ON public.t9_free_items
  FOR SELECT
  TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY "t9_free_items_insert"
  ON public.t9_free_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_project_access(project_id));

CREATE POLICY "t9_free_items_update"
  ON public.t9_free_items
  FOR UPDATE
  TO authenticated
  USING  (public.user_has_project_access(project_id))
  WITH CHECK (public.user_has_project_access(project_id));

CREATE POLICY "t9_free_items_delete"
  ON public.t9_free_items
  FOR DELETE
  TO authenticated
  USING (public.user_has_project_access(project_id));


-- ================================================================
-- H. EDGE FUNCTION FLOW — orden correcto post-implementación
-- ================================================================
--
-- El orden importa: primero autenticar, luego verificar acceso,
-- solo entonces consumir rate limit y llamar a Claude.
-- El registro de llamada debe producirse DESPUÉS de verificar
-- que el usuario tiene acceso legítimo al proyecto.
--
-- PASO 1 — Validar JWT (service_role client, solo para auth)
--   const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
--   const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt)
--   if (error || !user) return 401
--
-- PASO 2 — Crear cliente user-scoped (ANON_KEY + JWT del usuario)
--   const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
--     global: { headers: { Authorization: `Bearer ${jwt}` } }
--   })
--   // A partir de aquí, RLS se aplica automáticamente con auth.uid() = user.id
--
-- PASO 3 — Validar acceso al proyecto via RLS (user-scoped client)
--   const { data: project, error: projError } = await supabaseUser
--     .from('projects').select('id').eq('id', projectId).single()
--   if (projError || !project) return 403
--   // Si el usuario no tiene acceso, RLS devuelve 0 filas → projError o project=null
--
-- PASO 4 — Rate limit (service_role, DESPUÉS de verificar acceso)
--   const { data: rateCheck } = await supabaseAdmin
--     .rpc('check_and_log_ai_call', {
--       p_user_id:    user.id,
--       p_project_id: projectId,
--       p_tool_code:  toolCode
--     })
--   if (!rateCheck.allowed) return 429
--
-- PASO 5 — Llamar a Claude API
--   const result = await callClaude(system, userMessage, maxTokens)
--
-- PASO 6 — Guardar output (user-scoped client → RLS activo)
--   const { data: savedId } = await supabaseUser
--     .rpc('save_tool_output', {
--       p_project_id:      projectId,
--       p_tool_code:       toolCode,
--       p_payload:         result,
--       p_stale_after:     new Date(Date.now() + 90*24*60*60*1000).toISOString(),
--       p_payload_version: 1
--     })
--
-- ================================================================
-- ÍNDICE DE OBJETOS CREADOS
-- ================================================================
--
-- FUNCIONES:
--   public.set_updated_at()                              → trigger helper
--   public.check_and_log_ai_call(uuid, uuid, text)       → service_role only
--   public.user_has_project_access(uuid)                 → authenticated + service_role
--   public.save_tool_output(uuid, text, jsonb, ts, int)  → authenticated only
--
-- TABLAS:
--   public.ai_rate_limit_log    (RLS ON, sin políticas de usuario)
--   public.tool_outputs         (RLS ON, 4 políticas TO authenticated)
--   public.t9_overrides         (RLS ON, 4 políticas TO authenticated)
--   public.t9_free_items        (RLS ON, 4 políticas TO authenticated)
--
-- ÍNDICES:
--   idx_rate_limit_user_created, idx_rate_limit_created
--   uniq_tool_outputs_active (PARTIAL UNIQUE WHERE archived=false)
--   idx_tool_outputs_project_created
--   idx_t9_overrides_project_year, idx_t9_free_items_project_year
--
-- DEPENDENCIAS:
--   auth.users  ──► ai_rate_limit_log.user_id
--               ──► tool_outputs.created_by / updated_by
--   projects    ──► ai_rate_limit_log.project_id
--               ──► tool_outputs.project_id
--               ──► t9_overrides.project_id
--               ──► t9_free_items.project_id
--   project_members ──► user_has_project_access() [JOIN Patrón 1]
--   profiles        ──► user_has_project_access() [JOIN Patrón 2]
-- ================================================================

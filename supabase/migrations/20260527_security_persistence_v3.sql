-- ================================================================
-- GOBY — Script SQL Maestro v3
-- Migración: Seguridad + Persistencia
-- Fecha: 2026-05-27
--
-- CAMBIOS RESPECTO A v2:
--   [1] Split user_has_project_access →
--         user_can_read_project  (todos los miembros + client_editor + client_viewer)
--         user_can_edit_project  (sin client_viewer, sin project_members con role=viewer)
--   [2] save_tool_output usa user_can_edit_project (no user_has_project_access)
--   [3] Políticas INSERT/UPDATE/DELETE de t9_overrides y t9_free_items
--       usan user_can_edit_project
--   [4] Advisory lock en save_tool_output granular: project_id + tool_code
--       (hashtext(p_project_id::text || ':' || p_tool_code)::bigint)
--   [5] Políticas dependientes DROP antes de DROP FUNCTION
--       → ningún DROP FUNCTION sobre función referenciada por policy activa
--   [6] tool_outputs: escritura directa bloqueada para authenticated;
--       SELECT directo permitido; escritura solo vía save_tool_output() (SECURITY DEFINER)
--   [7] t9_overrides y t9_free_items: añadidos created_by + updated_by;
--       nuevo trigger set_audit_columns() maneja INSERT + UPDATE
--   [8] Grants de user_can_read_project y user_can_edit_project añadidos;
--       grants de user_has_project_access eliminados (función ya no existe)
--
-- SCHEMA REAL VERIFICADO (src/types/database.types.ts):
--   ✓ projects        (id uuid, company_id uuid, owner_id uuid, ...)
--   ✓ project_members (project_id uuid, user_id uuid, role text)
--       MemberRole incluye 'viewer' — excluido de user_can_edit_project
--   ✓ profiles        (id uuid, email, name, role UserRole, company_id uuid)
--       UserRole incluye 'client_editor', 'client_viewer'
--   ✓ is_project_member(pid) ya existe (no se modifica)
--   ✓ t5_canvas, iso42001_controls → se mantienen deprecated; migración de stores = sprint siguiente
--
-- NOTA SOBRE SEGURIDAD DEFINER y RLS:
--   En Supabase las funciones SECURITY DEFINER son propiedad del rol 'postgres'
--   (que tiene BYPASSRLS). Por tanto save_tool_output puede escribir en tool_outputs
--   aunque NO existan políticas INSERT/UPDATE para 'authenticated'.
--   Los usuarios autenticados solo pueden leer directamente (SELECT policy).
--   Toda escritura pasa por save_tool_output().
--
-- Secciones:
--   0.  Helpers compartidos     set_updated_at() + set_audit_columns()
--   A.  Rate Limiting           ai_rate_limit_log + check_and_log_ai_call
--   B.  tool_outputs            T5/T6/T7/T8/T12 unificados
--   C.  T9 granular             t9_overrides + t9_free_items (con created_by/updated_by)
--   D.  Pre-flight cleanup      DROP políticas dependientes → DROP user_has_project_access
--   E.  Helpers de acceso       user_can_read_project() + user_can_edit_project()
--   F.  RPC transaccional       save_tool_output() (advisory lock project+tool)
--   G.  Grants y REVOKE         permisos de funciones
--   H.  RLS completo            idempotente, TO authenticated, escritura directa bloqueada
--   I.  Edge Function flow      orden correcto documentado
-- ================================================================


-- ================================================================
-- 0. HELPERS COMPARTIDOS
-- ================================================================

-- ── set_updated_at ────────────────────────────────────────────
-- Trigger reutilizado por tool_outputs (solo updated_at).
-- Las tablas T9 usan set_audit_columns en su lugar.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- ── set_audit_columns ─────────────────────────────────────────
-- Trigger para t9_overrides y t9_free_items.
-- INSERT: inicializa created_by, updated_by, created_at, updated_at.
-- UPDATE: actualiza updated_at y updated_by con el usuario actual.
--
-- COALESCE en INSERT: si el llamador ya proveyó el valor, se respeta.
-- En UPDATE: updated_by siempre sobrescribe (garantía de trazabilidad).

CREATE OR REPLACE FUNCTION public.set_audit_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.updated_at := COALESCE(NEW.updated_at, now());
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by := COALESCE(NEW.updated_by, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_audit_columns IS
  'Trigger para t9_overrides y t9_free_items. '
  'INSERT: inicializa campos de auditoría. UPDATE: actualiza updated_at/updated_by.';


-- ================================================================
-- A. RATE LIMITING
-- ================================================================

-- ── Tabla de log ──────────────────────────────────────────────
-- Solo escribe check_and_log_ai_call (SECURITY DEFINER).
-- RLS habilitado sin políticas de usuario = bloqueo total para anon/authenticated.

CREATE TABLE IF NOT EXISTS public.ai_rate_limit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_code   text        NOT NULL
              CHECK (tool_code IN (
                't5_canvas', 't6_policy', 't7_plan',
                't8_comms',  't12_iso',
                't9_overrides', 't9_free_items'
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


-- ── RPC: check_and_log_ai_call ────────────────────────────────
-- LLAMAR SOLO desde Edge Function con service_role, DESPUÉS de validar
-- acceso al proyecto con cliente user-scoped (ver sección I).
-- Advisory lock por user_id: serializa peticiones concurrentes del mismo usuario.

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
  'Rate limit atómico con advisory lock por user_id. '
  'Solo llamar desde Edge Function con service_role, DESPUÉS de validar acceso al proyecto.';

-- Limpieza periódica sugerida (pg_cron):
-- SELECT cron.schedule('cleanup-rate-limit-log','0 3 * * *',
--   $$DELETE FROM public.ai_rate_limit_log WHERE created_at < now()-interval '24 hours'$$);


-- ================================================================
-- B. TOOL_OUTPUTS — tabla unificada (T5, T6, T7, T8, T12)
-- ================================================================
--
-- Escritura directa bloqueada para 'authenticated' (sin políticas INSERT/UPDATE).
-- Toda escritura pasa por save_tool_output() (SECURITY DEFINER → bypassrls).
-- Lectura directa permitida vía policy SELECT con user_can_read_project.
--
-- Ciclos de vida:
--   INTERACTIVO (t5_canvas, t12_iso): UPDATE in-place; version incrementa.
--   LLM (t6_policy, t7_plan, t8_comms): archiva anterior + inserta nuevo.
--     Los registros archivados son INMUTABLES y PERMANENTES.
--
-- Invariante: uniq_tool_outputs_active garantiza exactamente UNA fila activa
-- por (project_id, tool_code) a nivel de motor.

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
  status          text        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived', 'draft')),
  stale_after     timestamptz,
  archived        boolean     NOT NULL DEFAULT false,

  -- Auditoría
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT chk_archived_status_consistent CHECK (
    (archived = false AND status IN ('active', 'draft'))
    OR
    (archived = true  AND status = 'archived')
  )
);

COMMENT ON TABLE  public.tool_outputs               IS 'Estado e outputs LLM para T5, T6, T7, T8, T12. Escritura solo vía save_tool_output(). Outputs archivados son inmutables.';
COMMENT ON COLUMN public.tool_outputs.tool_code     IS 't5_canvas | t6_policy | t7_plan | t8_comms | t12_iso';
COMMENT ON COLUMN public.tool_outputs.version       IS 'Versión del registro (incrementa en cada guardado activo).';
COMMENT ON COLUMN public.tool_outputs.payload_version IS 'Versión del schema del payload JSON (el frontend lo determina).';
COMMENT ON COLUMN public.tool_outputs.stale_after   IS 'Outputs LLM: fecha de expiración sugerida. NULL = nunca caduca.';
COMMENT ON COLUMN public.tool_outputs.archived      IS 'true = versión histórica inmutable. false = versión activa.';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_tool_outputs_active
  ON public.tool_outputs (project_id, tool_code)
  WHERE archived = false;

CREATE INDEX IF NOT EXISTS idx_tool_outputs_project_created
  ON public.tool_outputs (project_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_tool_outputs_updated_at ON public.tool_outputs;
CREATE TRIGGER trg_tool_outputs_updated_at
  BEFORE UPDATE ON public.tool_outputs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tool_outputs ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- C. T9 — TABLAS GRANULARES
-- ================================================================
--
-- roadmap_year desacopla la posición del año actual del sistema.
-- created_by / updated_by gestionados por trigger set_audit_columns().

-- ── t9_overrides ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.t9_overrides (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  use_case_id   text        NOT NULL,
  roadmap_year  smallint    NOT NULL DEFAULT EXTRACT(YEAR FROM now())::smallint,
  start_month   smallint    NOT NULL CHECK (start_month BETWEEN 0 AND 11),
  end_month     smallint    NOT NULL CHECK (end_month   BETWEEN 0 AND 11),
  responsible   text        NOT NULL DEFAULT '',

  -- Auditoría completa
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT t9_overrides_end_gte_start CHECK (end_month >= start_month),
  CONSTRAINT t9_overrides_year_range    CHECK (roadmap_year BETWEEN 2020 AND 2099),
  UNIQUE (project_id, use_case_id, roadmap_year)
);

COMMENT ON TABLE  public.t9_overrides              IS 'Posiciones/responsables editados en el Gantt T9, por año de roadmap.';
COMMENT ON COLUMN public.t9_overrides.use_case_id  IS 'UUID del UseCase en T4 (text, sin FK para evitar acoplamiento).';
COMMENT ON COLUMN public.t9_overrides.roadmap_year IS 'Año del roadmap al que pertenece este override.';
COMMENT ON COLUMN public.t9_overrides.created_by   IS 'Usuario que creó el override.';
COMMENT ON COLUMN public.t9_overrides.updated_by   IS 'Último usuario que modificó el override.';

CREATE INDEX IF NOT EXISTS idx_t9_overrides_project_year
  ON public.t9_overrides (project_id, roadmap_year);

DROP TRIGGER IF EXISTS trg_t9_overrides_audit ON public.t9_overrides;
CREATE TRIGGER trg_t9_overrides_audit
  BEFORE INSERT OR UPDATE ON public.t9_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_columns();

ALTER TABLE public.t9_overrides ENABLE ROW LEVEL SECURITY;


-- ── t9_free_items ─────────────────────────────────────────────

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

  -- Auditoría completa
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT t9_free_items_end_gte_start CHECK (end_month >= start_month),
  CONSTRAINT t9_free_items_year_range    CHECK (roadmap_year BETWEEN 2020 AND 2099)
);

COMMENT ON TABLE  public.t9_free_items              IS 'Iniciativas libres del Gantt T9. No provienen de T4. Por año de roadmap.';
COMMENT ON COLUMN public.t9_free_items.roadmap_year IS 'Año del roadmap al que pertenece el item libre.';
COMMENT ON COLUMN public.t9_free_items.created_by   IS 'Usuario que creó el item libre.';
COMMENT ON COLUMN public.t9_free_items.updated_by   IS 'Último usuario que modificó el item libre.';

CREATE INDEX IF NOT EXISTS idx_t9_free_items_project_year
  ON public.t9_free_items (project_id, roadmap_year);

DROP TRIGGER IF EXISTS trg_t9_free_items_audit ON public.t9_free_items;
CREATE TRIGGER trg_t9_free_items_audit
  BEFORE INSERT OR UPDATE ON public.t9_free_items
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_columns();

ALTER TABLE public.t9_free_items ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- D. PRE-FLIGHT CLEANUP
-- ================================================================
--
-- PROPÓSITO: eliminar todas las políticas que referencian user_has_project_access
-- ANTES de intentar eliminar la función. Esto evita el error:
--   "cannot drop function user_has_project_access(uuid) because other objects depend on it"
--
-- Las políticas se recrean en la Sección H usando las nuevas funciones.
-- Es seguro ejecutar DROP POLICY IF EXISTS repetidamente (idempotente).

-- tool_outputs (pueden referenciar user_has_project_access si v2 fue ejecutada)
DROP POLICY IF EXISTS "tool_outputs_select"    ON public.tool_outputs;
DROP POLICY IF EXISTS "tool_outputs_insert"    ON public.tool_outputs;
DROP POLICY IF EXISTS "tool_outputs_update"    ON public.tool_outputs;
DROP POLICY IF EXISTS "tool_outputs_no_delete" ON public.tool_outputs;

-- t9_overrides
DROP POLICY IF EXISTS "t9_overrides_select" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_insert" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_update" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_delete" ON public.t9_overrides;

-- t9_free_items
DROP POLICY IF EXISTS "t9_free_items_select" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_insert" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_update" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_delete" ON public.t9_free_items;

-- Ahora es seguro eliminar la función antigua
DROP FUNCTION IF EXISTS public.user_has_project_access(uuid);


-- ================================================================
-- E. HELPERS DE ACCESO (reemplazan user_has_project_access)
-- ================================================================
--
-- SEPARACIÓN READ / EDIT:
--
--   user_can_read_project  → ve los datos del proyecto (lectura)
--   user_can_edit_project  → puede modificar datos del proyecto (escritura)
--
-- Ambas funciones cubren DOS patrones de acceso del schema real:
--   Patrón 1 — Consultores Alpha: vía project_members.user_id
--   Patrón 2 — Usuarios cliente:  vía profiles.company_id = projects.company_id
--
-- DIFERENCIA CLAVE:
--   user_can_read_project:  project_members (TODOS los roles) + client_editor + client_viewer
--   user_can_edit_project:  project_members (role != 'viewer') + client_editor
--                           → client_viewer y project_members viewer quedan excluidos
--
-- SUPUESTO SOBRE MemberRole:
--   Se asume que MemberRole incluye 'viewer' como rol de solo lectura.
--   Si se añaden roles nuevos de solo lectura en el futuro, actualizar estas funciones.
--
-- SECURITY DEFINER: lee project_members y profiles sin que el llamador
-- necesite permisos directos sobre esas tablas.
-- STABLE: PostgreSQL cachea el resultado en la misma transacción →
-- múltiples evaluaciones RLS cuestan UNA sola query.


-- ── user_can_read_project ─────────────────────────────────────
-- Acceso de lectura: todos los miembros del proyecto + ambos roles de cliente.

CREATE OR REPLACE FUNCTION public.user_can_read_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Patrón 1: cualquier miembro explícito del proyecto (todos los roles)
    SELECT 1
    FROM   public.project_members pm
    WHERE  pm.project_id = p_project_id
      AND  pm.user_id    = auth.uid()

    UNION ALL

    -- Patrón 2: usuarios cliente (editor o viewer) vinculados por empresa
    SELECT 1
    FROM   public.projects  p
    JOIN   public.profiles  pr ON pr.company_id = p.company_id
    WHERE  p.id  = p_project_id
      AND  pr.id = auth.uid()
      AND  pr.role IN ('client_editor', 'client_viewer')
  )
$$;

COMMENT ON FUNCTION public.user_can_read_project IS
  'Acceso de lectura: project_members (todos los roles) + client_editor + client_viewer. '
  'STABLE → cacheado por transacción. Base de políticas SELECT.';


-- ── user_can_edit_project ─────────────────────────────────────
-- Acceso de escritura: miembros con roles de edición + client_editor.
-- Excluidos explícitamente: project_members con role=''viewer'', client_viewer.

CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Patrón 1: miembros del proyecto CON rol de edición (excluye 'viewer')
    SELECT 1
    FROM   public.project_members pm
    WHERE  pm.project_id = p_project_id
      AND  pm.user_id    = auth.uid()
      AND  pm.role       != 'viewer'   -- viewer = solo lectura, sin escritura

    UNION ALL

    -- Patrón 2: usuarios cliente con rol editor (excluye client_viewer)
    SELECT 1
    FROM   public.projects  p
    JOIN   public.profiles  pr ON pr.company_id = p.company_id
    WHERE  p.id  = p_project_id
      AND  pr.id = auth.uid()
      AND  pr.role = 'client_editor'   -- client_viewer NO tiene permiso de escritura
  )
$$;

COMMENT ON FUNCTION public.user_can_edit_project IS
  'Acceso de escritura: project_members (role != viewer) + client_editor. '
  'Excluidos: project_members viewer, client_viewer. '
  'STABLE → cacheado por transacción. Base de políticas INSERT/UPDATE/DELETE y save_tool_output().';


-- ================================================================
-- F. RPC TRANSACCIONAL — save_tool_output()
-- ================================================================
--
-- ÚNICO punto de escritura en tool_outputs desde frontend y Edge Function.
-- Cambios respecto a v2:
--   - Verifica user_can_edit_project (no user_has_project_access)
--   - Advisory lock granular por project_id + tool_code
--     (en v2 era project-level; ahora es project+tool → mayor concurrencia)
--
-- CICLOS DE VIDA:
--   Interactivo (t5_canvas, t12_iso): UPDATE in-place.
--   LLM (t6_policy, t7_plan, t8_comms): archiva anterior + inserta nuevo.
--     Las versiones archivadas son INMUTABLES.
--
-- SEGURIDAD: SECURITY DEFINER (owner = postgres → bypassrls).
-- La política INSERT/UPDATE de authenticated en tool_outputs no existe → bloqueada.
-- Esta función es el único camino de escritura.

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
  v_caller_id         uuid := auth.uid();
  v_is_llm            boolean;
  v_current_id        uuid;
  v_current_ver       int;
  v_new_id            uuid;
  v_llm_tools         text[] := ARRAY['t6_policy', 't7_plan', 't8_comms'];
  v_interactive_tools text[] := ARRAY['t5_canvas', 't12_iso'];
BEGIN

  -- ── 1. Validar autenticación ────────────────────────────────
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'save_tool_output: usuario no autenticado'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- ── 2. Validar tool_code ────────────────────────────────────
  IF p_tool_code NOT IN (
    't5_canvas', 't6_policy', 't7_plan', 't8_comms', 't12_iso'
  ) THEN
    RAISE EXCEPTION 'save_tool_output: tool_code inválido: %', p_tool_code
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- ── 3. Validar acceso de edición al proyecto ─────────────────
  -- Usa user_can_edit_project: excluye client_viewer y project_members viewer.
  -- Consultores y client_editor sí pueden guardar outputs.
  IF NOT public.user_can_edit_project(p_project_id) THEN
    RAISE EXCEPTION 'save_tool_output: acceso de escritura denegado al proyecto %', p_project_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- ── 4. Advisory lock por project_id + tool_code ─────────────
  -- Serializa escrituras concurrentes sobre el MISMO (proyecto, herramienta).
  -- Dos guardados simultáneos de tool_code distintos en el mismo proyecto
  -- no se bloquean entre sí → mayor throughput que un lock por project_id.
  -- Se libera automáticamente al finalizar la transacción.
  PERFORM pg_advisory_xact_lock(
    hashtext(p_project_id::text || ':' || p_tool_code)::bigint
  );

  -- ── 5. Determinar tipo de tool ──────────────────────────────
  v_is_llm := p_tool_code = ANY(v_llm_tools);

  -- ── 6. Obtener registro activo actual ───────────────────────
  SELECT id, version
    INTO v_current_id, v_current_ver
    FROM public.tool_outputs
   WHERE project_id = p_project_id
     AND tool_code  = p_tool_code
     AND archived   = false;

  IF v_is_llm THEN
    -- ── 7a. Flujo LLM: archivar anterior + insertar nuevo ────
    -- SECURITY DEFINER necesario aquí: la policy de UPDATE de authenticated
    -- solo permite filas con archived=false; poner archived=true
    -- solo lo puede hacer esta función.

    IF v_current_id IS NOT NULL THEN
      UPDATE public.tool_outputs
         SET archived    = true,
             status      = 'archived',
             updated_at  = now(),
             updated_by  = v_caller_id
       WHERE id = v_current_id;
    END IF;

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
    -- ── 7b. Flujo interactivo: upsert in-place ───────────────

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
  'Único punto de escritura en tool_outputs. '
  'LLM: archiva anterior + inserta nuevo. Interactivo: update in-place. '
  'Verifica user_can_edit_project (excluye viewers). '
  'Advisory lock por project_id+tool_code para serializar concurrencia. '
  'SECURITY DEFINER → bypassrls → escribe aunque no existan policies INSERT/UPDATE para authenticated.';


-- ================================================================
-- G. GRANTS Y REVOKE — permisos de funciones
-- ================================================================
--
-- Principio: mínimo privilegio.
--
--   check_and_log_ai_call    → solo service_role (Edge Function admin)
--   user_can_read_project    → authenticated + service_role (RLS SELECT policies y RPCs)
--   user_can_edit_project    → authenticated + service_role (RLS write policies y RPCs)
--   save_tool_output         → solo authenticated (frontend y Edge Function user-scoped)
--   set_updated_at           → trigger interno, sin acceso directo
--   set_audit_columns        → trigger interno, sin acceso directo
--
-- user_has_project_access fue eliminada en sección D → no requiere REVOKE.

-- ── check_and_log_ai_call ─────────────────────────────────────
REVOKE ALL ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) TO service_role;

-- ── user_can_read_project ─────────────────────────────────────
REVOKE ALL    ON FUNCTION public.user_can_read_project(uuid) FROM PUBLIC;
REVOKE ALL    ON FUNCTION public.user_can_read_project(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.user_can_read_project(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.user_can_read_project(uuid) TO service_role;

-- ── user_can_edit_project ─────────────────────────────────────
REVOKE ALL    ON FUNCTION public.user_can_edit_project(uuid) FROM PUBLIC;
REVOKE ALL    ON FUNCTION public.user_can_edit_project(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.user_can_edit_project(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.user_can_edit_project(uuid) TO service_role;

-- ── save_tool_output ──────────────────────────────────────────
-- Solo authenticated. El frontend y la Edge Function user-scoped la llaman.
-- service_role puede invocarla técnicamente (bypassrls) pero NO debe hacerlo:
-- la Edge Function usa cliente user-scoped para que auth.uid() sea el del usuario.
REVOKE ALL    ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) FROM PUBLIC;
REVOKE ALL    ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) FROM anon;
GRANT  EXECUTE ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) TO authenticated;

-- ── set_updated_at + set_audit_columns ───────────────────────
-- Solo se ejecutan como funciones de trigger. Sin acceso directo de usuarios.
REVOKE ALL ON FUNCTION public.set_updated_at()     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at()     FROM anon;
REVOKE ALL ON FUNCTION public.set_updated_at()     FROM authenticated;
REVOKE ALL ON FUNCTION public.set_audit_columns()  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_audit_columns()  FROM anon;
REVOKE ALL ON FUNCTION public.set_audit_columns()  FROM authenticated;
-- service_role mantiene acceso implícito como owner en ambos casos.


-- ================================================================
-- H. RLS — POLÍTICAS COMPLETAS
-- ================================================================
--
-- Todas las políticas son TO authenticated.
-- anon: bloqueado por RLS sin políticas.
-- service_role: bypassa RLS por definición.
--
-- TOOL_OUTPUTS:
--   SELECT  → user_can_read_project  (todos los miembros + ambos roles cliente)
--   INSERT  → SIN POLÍTICA (escritura directa bloqueada; solo save_tool_output)
--   UPDATE  → SIN POLÍTICA (escritura directa bloqueada; solo save_tool_output)
--   DELETE  → USING(false) (auditoría permanente; nadie borra)
--
-- T9_OVERRIDES / T9_FREE_ITEMS:
--   SELECT  → user_can_read_project
--   INSERT  → user_can_edit_project (viewers no pueden crear items)
--   UPDATE  → user_can_edit_project (viewers no pueden modificar)
--   DELETE  → user_can_edit_project (viewers no pueden borrar; consultor sí)


-- ── tool_outputs ──────────────────────────────────────────────
-- Nota: DROP POLICY ya ejecutados en Sección D.

-- SELECT: lectura directa permitida para todos los miembros del proyecto
CREATE POLICY "tool_outputs_select"
  ON public.tool_outputs
  FOR SELECT
  TO authenticated
  USING (public.user_can_read_project(project_id));

-- INSERT: SIN POLÍTICA → bloqueado para authenticated.
-- save_tool_output (SECURITY DEFINER → bypassrls) es el único camino de escritura.
-- Nota: si en el futuro se necesita INSERT directo controlado, añadir policy aquí
-- con user_can_edit_project como condición.

-- UPDATE: SIN POLÍTICA → bloqueado para authenticated.
-- Mismo razonamiento que INSERT.

-- DELETE: prohibido para todos los usuarios autenticados.
-- Los outputs LLM son auditoría permanente; los interactivos tampoco se borran.
CREATE POLICY "tool_outputs_no_delete"
  ON public.tool_outputs
  FOR DELETE
  TO authenticated
  USING (false);


-- ── t9_overrides ──────────────────────────────────────────────
-- Nota: DROP POLICY ya ejecutados en Sección D.

CREATE POLICY "t9_overrides_select"
  ON public.t9_overrides
  FOR SELECT
  TO authenticated
  USING (public.user_can_read_project(project_id));

CREATE POLICY "t9_overrides_insert"
  ON public.t9_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "t9_overrides_update"
  ON public.t9_overrides
  FOR UPDATE
  TO authenticated
  USING  (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));

-- Override puede borrarse: el consultor resetea la posición al valor calculado.
-- Viewers excluidos.
CREATE POLICY "t9_overrides_delete"
  ON public.t9_overrides
  FOR DELETE
  TO authenticated
  USING (public.user_can_edit_project(project_id));


-- ── t9_free_items ─────────────────────────────────────────────
-- Nota: DROP POLICY ya ejecutados en Sección D.

CREATE POLICY "t9_free_items_select"
  ON public.t9_free_items
  FOR SELECT
  TO authenticated
  USING (public.user_can_read_project(project_id));

CREATE POLICY "t9_free_items_insert"
  ON public.t9_free_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "t9_free_items_update"
  ON public.t9_free_items
  FOR UPDATE
  TO authenticated
  USING  (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "t9_free_items_delete"
  ON public.t9_free_items
  FOR DELETE
  TO authenticated
  USING (public.user_can_edit_project(project_id));


-- ================================================================
-- I. EDGE FUNCTION FLOW — orden correcto post-implementación
-- ================================================================
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
--   // A partir de aquí, RLS se aplica con auth.uid() = user.id
--
-- PASO 3 — Validar acceso al proyecto via RLS (user-scoped client)
--   const { data: project, error: projError } = await supabaseUser
--     .from('projects').select('id').eq('id', projectId).single()
--   if (projError || !project) return 403
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
--   // save_tool_output verifica user_can_edit_project internamente
--   // → si el user-scoped client pasa el Paso 3 pero el usuario es viewer,
--   //   save_tool_output devolverá error 'insufficient_privilege' en Paso 6.


-- ================================================================
-- ÍNDICE DE OBJETOS CREADOS / MODIFICADOS
-- ================================================================
--
-- FUNCIONES NUEVAS (reemplazan user_has_project_access):
--   public.user_can_read_project(uuid)                    → authenticated + service_role
--   public.user_can_edit_project(uuid)                    → authenticated + service_role
--
-- FUNCIONES NUEVAS (helpers):
--   public.set_audit_columns()                            → trigger interno (t9 tables)
--
-- FUNCIONES MANTENIDAS:
--   public.set_updated_at()                               → trigger interno
--   public.check_and_log_ai_call(uuid, uuid, text)        → service_role only
--   public.save_tool_output(uuid, text, jsonb, ts, int)   → authenticated only
--
-- FUNCIÓN ELIMINADA:
--   public.user_has_project_access(uuid)                  → reemplazada por las dos de arriba
--
-- TABLAS CREADAS:
--   public.ai_rate_limit_log    (RLS ON, sin políticas de usuario)
--   public.tool_outputs         (RLS ON, 2 políticas: SELECT + no-DELETE)
--   public.t9_overrides         (RLS ON, 4 políticas, created_by/updated_by)
--   public.t9_free_items        (RLS ON, 4 políticas, created_by/updated_by)
--
-- ÍNDICES:
--   idx_rate_limit_user_created, idx_rate_limit_created
--   uniq_tool_outputs_active (PARTIAL UNIQUE WHERE archived=false)
--   idx_tool_outputs_project_created
--   idx_t9_overrides_project_year, idx_t9_free_items_project_year
--
-- TRIGGERS:
--   trg_tool_outputs_updated_at  → set_updated_at()      (BEFORE UPDATE)
--   trg_t9_overrides_audit       → set_audit_columns()   (BEFORE INSERT OR UPDATE)
--   trg_t9_free_items_audit      → set_audit_columns()   (BEFORE INSERT OR UPDATE)
--
-- RLS TOOL_OUTPUTS (cambio vs v2):
--   ✓ SELECT  → user_can_read_project
--   ✗ INSERT  → SIN POLÍTICA (bloqueado para authenticated)
--   ✗ UPDATE  → SIN POLÍTICA (bloqueado para authenticated)
--   ✓ DELETE  → USING(false)
--
-- RLS T9_OVERRIDES / T9_FREE_ITEMS (cambio vs v2):
--   ✓ SELECT  → user_can_read_project
--   ✓ INSERT  → user_can_edit_project  (era user_has_project_access)
--   ✓ UPDATE  → user_can_edit_project  (era user_has_project_access)
--   ✓ DELETE  → user_can_edit_project  (era user_has_project_access)
--
-- DEPENDENCIAS:
--   auth.users  ──► ai_rate_limit_log.user_id
--               ──► tool_outputs.created_by / updated_by
--               ──► t9_overrides.created_by / updated_by
--               ──► t9_free_items.created_by / updated_by
--   projects    ──► ai_rate_limit_log.project_id
--               ──► tool_outputs.project_id
--               ──► t9_overrides.project_id
--               ──► t9_free_items.project_id
--   project_members ──► user_can_read_project() + user_can_edit_project() [Patrón 1]
--   profiles        ──► user_can_read_project() + user_can_edit_project() [Patrón 2]
-- ================================================================

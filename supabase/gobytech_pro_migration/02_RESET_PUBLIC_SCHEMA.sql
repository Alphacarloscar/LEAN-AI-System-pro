-- ================================================================
-- GOBY — gobytech_pro Production Setup
-- Bloque 02: RESET PUBLIC SCHEMA
--
-- ESTRATEGIA: Opción A — Rebuild limpio
--   Elimina todas las tablas del schema public en orden inverso
--   de dependencias FK para evitar errores de constraint.
--   NO toca: auth schema, storage schema, Supabase internals.
--   NO toca: auth.users (el superadmin se preserva).
--
-- DESTRUCTIVO E IRREVERSIBLE. Ejecutar solo tras 01_BACKUP_REMINDER.
-- ================================================================


-- ── 1. Eliminar triggers dependientes (orden importa) ─────────
-- SAFE PATCH: comentado porque la tabla puede no existir en legacy y DROP TRIGGER ON tabla inexistente puede fallar.
-- DROP TRIGGER IF EXISTS trg_t9_free_items_audit    ON public.t9_free_items;
-- SAFE PATCH: comentado porque la tabla puede no existir en legacy y DROP TRIGGER ON tabla inexistente puede fallar.
-- DROP TRIGGER IF EXISTS trg_t9_overrides_audit     ON public.t9_overrides;
-- SAFE PATCH: comentado porque la tabla puede no existir en legacy y DROP TRIGGER ON tabla inexistente puede fallar.
-- DROP TRIGGER IF EXISTS trg_tool_outputs_updated_at ON public.tool_outputs;


-- ── 2. Eliminar policies (evitar errores al eliminar funciones) ─
-- tool_outputs
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "tool_outputs_select" ON public.tool_outputs;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "tool_outputs_insert" ON public.tool_outputs;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "tool_outputs_update" ON public.tool_outputs;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "tool_outputs_no_delete" ON public.tool_outputs;

-- t9_overrides
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "t9_overrides_select" ON public.t9_overrides;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "t9_overrides_insert" ON public.t9_overrides;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "t9_overrides_update" ON public.t9_overrides;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "t9_overrides_delete" ON public.t9_overrides;

-- t9_free_items
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "t9_free_items_select" ON public.t9_free_items;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "t9_free_items_insert" ON public.t9_free_items;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "t9_free_items_update" ON public.t9_free_items;
-- SAFE PATCH: policy explícita comentada; el loop dinámico elimina policies existentes.
-- DROP POLICY IF EXISTS "t9_free_items_delete" ON public.t9_free_items;

-- Resto de tablas
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ── 3. Eliminar tablas en orden inverso de FK ─────────────────
-- Nivel 3: tablas que apuntan a projects
DROP TABLE IF EXISTS public.ai_rate_limit_log       CASCADE;
DROP TABLE IF EXISTS public.tool_outputs            CASCADE;
DROP TABLE IF EXISTS public.t9_overrides            CASCADE;
DROP TABLE IF EXISTS public.t9_free_items           CASCADE;
DROP TABLE IF EXISTS public.t1_dimension_scores     CASCADE;
DROP TABLE IF EXISTS public.stakeholders            CASCADE;
DROP TABLE IF EXISTS public.value_streams           CASCADE;
DROP TABLE IF EXISTS public.use_cases               CASCADE;
DROP TABLE IF EXISTS public.t5_canvas               CASCADE;
DROP TABLE IF EXISTS public.iso42001_controls       CASCADE;
DROP TABLE IF EXISTS public.company_profiles        CASCADE;
DROP TABLE IF EXISTS public.frictions               CASCADE;
DROP TABLE IF EXISTS public.snapshots               CASCADE;

-- Nivel 2: tablas de membresía
DROP TABLE IF EXISTS public.project_members         CASCADE;

-- Nivel 2: tablas de empresa (departments antes que companies)
DROP TABLE IF EXISTS public.company_departments     CASCADE;

-- Nivel 1: tablas base (projects antes que companies)
DROP TABLE IF EXISTS public.projects                CASCADE;

-- Nivel 0: profiles y companies (profiles referencia auth.users)
DROP TABLE IF EXISTS public.profiles                CASCADE;
DROP TABLE IF EXISTS public.companies               CASCADE;

-- Legacy tables (pre-rename, por si existen en gobytech_pro antiguo)
DROP TABLE IF EXISTS public.engagements             CASCADE;
DROP TABLE IF EXISTS public.engagement_members      CASCADE;
DROP TABLE IF EXISTS public.t1_score_snapshots      CASCADE;
DROP TABLE IF EXISTS public.stakeholder_snapshots   CASCADE;
DROP TABLE IF EXISTS public.value_stream_snapshots  CASCADE;


-- ── 4. Eliminar funciones en orden seguro ─────────────────────
-- Funciones que dependen de tablas ya eliminadas
DROP FUNCTION IF EXISTS public.save_tool_output(uuid, text, jsonb, timestamptz, int);
DROP FUNCTION IF EXISTS public.check_and_log_ai_call(uuid, uuid, text);

-- Helpers de acceso (usados por policies ya eliminadas)
DROP FUNCTION IF EXISTS public.user_can_read_project(uuid);
DROP FUNCTION IF EXISTS public.user_can_edit_project(uuid);
DROP FUNCTION IF EXISTS public.user_has_project_access(uuid);  -- deprecated, puede existir
DROP FUNCTION IF EXISTS public.is_company_project(uuid);
DROP FUNCTION IF EXISTS public.can_write_project(uuid);
DROP FUNCTION IF EXISTS public.is_project_member(uuid);
DROP FUNCTION IF EXISTS public.is_platform_admin();
DROP FUNCTION IF EXISTS public.is_superadmin();

-- Helpers de RLS legacy
DROP FUNCTION IF EXISTS public.is_engagement_member(uuid);
DROP FUNCTION IF EXISTS public.can_write_engagement(uuid);

-- Trigger helpers
DROP FUNCTION IF EXISTS public.set_audit_columns();
DROP FUNCTION IF EXISTS public.set_updated_at();
-- SAFE PATCH: no eliminar public.handle_new_user porque auth.users.on_auth_user_created depende de esta función.
-- Se actualizará en 03_SCHEMA_CREATE mediante CREATE OR REPLACE FUNCTION.
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- Función de snapshots legacy
DROP FUNCTION IF EXISTS public.create_snapshot(uuid, text, text, uuid, text);


-- ── 5. Verificar limpieza ─────────────────────────────────────
DO $$
DECLARE
  v_table_count int;
  v_func_count  int;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  SELECT COUNT(*) INTO v_func_count
  FROM information_schema.routines
  WHERE routine_schema = 'public';

  RAISE NOTICE '[RESET] Tablas restantes en public: %', v_table_count;
  RAISE NOTICE '[RESET] Funciones restantes en public: %', v_func_count;

  IF v_table_count > 0 OR v_func_count > 0 THEN
    RAISE NOTICE '[RESET WARNING] Quedan objetos en public. Revisar antes de continuar.';
    -- No abortar: Supabase puede tener funciones internas en public que no debemos tocar
  ELSE
    RAISE NOTICE '[RESET OK] Schema public limpio. Continúa con 03_SCHEMA_CREATE.sql';
  END IF;
END $$;

-- Mostrar lo que queda (para revisión manual)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

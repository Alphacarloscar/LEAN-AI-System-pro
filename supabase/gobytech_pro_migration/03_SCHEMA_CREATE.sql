-- ================================================================
-- GOBY — gobytech_pro Production Setup
-- Bloque 03: SCHEMA CREATE
--
-- Crea el schema completo de producción: tablas, funciones,
-- triggers, constraints, índices, RLS y policies.
--
-- Fuente: todas las migrations de lean_ai_pro (001-008 + v3.1)
-- más el schema drift detectado en Sprint 10 (companies.sector,
-- companies.company_size, company_departments,
-- t1_dimension_scores.interviewee_department).
--
-- ⚠ AVISO DE SCHEMA DRIFT:
--   Las columnas marcadas con [DRIFT] existen en los tipos
--   TypeScript (database.types.ts) pero NO tienen migration SQL
--   correspondiente en el repositorio. Se incluyen aquí porque
--   lean_ai_pro las tiene — pero VERIFICA antes de ejecutar
--   que la estructura real de lean_ai_pro coincide.
--   Ver RESUMEN_EJECUTIVO.md sección "Schema drift detectado".
-- ================================================================


-- ── Extensión ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
-- HELPERS COMPARTIDOS (declarados primero — triggers los usan)
-- ================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_audit_columns()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    NEW.updated_at := now();
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
    NEW.updated_at := now();
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_audit_columns IS
  'Trigger para t9_overrides y t9_free_items. '
  'INSERT: fuerza campos de auditoría; el cliente no los controla. '
  'UPDATE: preserva OLD.created_at y OLD.created_by.';

REVOKE ALL ON FUNCTION public.set_updated_at()    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_audit_columns() FROM PUBLIC, anon, authenticated;


-- ================================================================
-- TABLA: companies
-- ================================================================
CREATE TABLE public.companies (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  slug         text        UNIQUE,
  sector       text        NOT NULL DEFAULT '',   -- [DRIFT] Sprint 10: movido desde company_profiles
  company_size text        NOT NULL DEFAULT '',   -- [DRIFT] Sprint 10: movido desde company_profiles
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.companies.sector       IS '[DRIFT Sprint 10] Sector de la empresa. Movido desde company_profiles.';
COMMENT ON COLUMN public.companies.company_size IS '[DRIFT Sprint 10] Tamaño de empresa. Movido desde company_profiles.';


-- ================================================================
-- TABLA: company_departments
-- ================================================================
-- [DRIFT Sprint 10] Esta tabla aparece en database.types.ts pero
-- no tiene migration SQL en el repositorio.

CREATE TABLE public.company_departments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        NOT NULL DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.company_departments IS
  '[DRIFT Sprint 10] Departamentos de empresa. Tabla en tipos TS sin migration SQL.';


-- ================================================================
-- TABLA: profiles
-- ================================================================
CREATE TABLE public.profiles (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      text NOT NULL,
  name       text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT 'client_viewer'
             CONSTRAINT profiles_role_check
             CHECK (role IN ('superadmin', 'consultant', 'client_editor', 'client_viewer')),
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.profiles.role IS
  'superadmin=Alpha plataforma (acceso global) | consultant=consultor Alpha | '
  'client_editor=cliente operativo | client_viewer=cliente solo lectura';


-- ================================================================
-- TABLA: projects
-- ================================================================
CREATE TABLE public.projects (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  owner_id      uuid        REFERENCES public.profiles(id) NOT NULL,
  company_id    uuid        REFERENCES public.companies(id),
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'archived')),
  current_phase text        NOT NULL DEFAULT 'listen'
                            CHECK (current_phase IN ('listen', 'evaluate', 'activate', 'normalize', 'closed')),
  start_date    date,
  end_date      date,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: project_members
-- ================================================================
CREATE TABLE public.project_members (
  project_id uuid        REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'consultant'
             CHECK (role IN ('consultant', 'viewer')),
  added_at   timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: company_profiles
-- ================================================================
CREATE TABLE public.company_profiles (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             uuid        REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  project_name           text        NOT NULL DEFAULT '',
  sector                 text        NOT NULL DEFAULT '',
  tamano_empresa         text        NOT NULL DEFAULT '',
  objetivo_principal_ia  text        NOT NULL DEFAULT '',
  horizonte_valor        text        NOT NULL DEFAULT '',
  ecosistema_tecnologico text        NOT NULL DEFAULT '',
  restricciones          text        NOT NULL DEFAULT '',
  areas_prioritarias     jsonb       NOT NULL DEFAULT '[]',
  saved_at               timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: frictions
-- ================================================================
CREATE TABLE public.frictions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  tipo           text        NOT NULL DEFAULT '',
  area_funcional text        NOT NULL DEFAULT '',
  frecuencia     text        CHECK (frecuencia IN ('Baja', 'Media', 'Alta')),
  impacto        text        CHECK (impacto IN ('Bajo', 'Medio', 'Alto')),
  notas          text        NOT NULL DEFAULT '',
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.frictions ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: t1_dimension_scores
-- ================================================================
CREATE TABLE public.t1_dimension_scores (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             uuid        REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  dimension_code         text        NOT NULL,
  subdimension_code      text        NOT NULL,
  score                  numeric(3,1) CHECK (score IS NULL OR (score >= 0 AND score <= 4)),
  evidence               text        NOT NULL DEFAULT '',
  interviewee_id         text,
  interviewee_name       text,
  interviewee_role       text,
  interviewee_type       text        NOT NULL DEFAULT 'business'
                                     CHECK (interviewee_type IN ('it', 'business')),
  interviewee_department text,       -- [DRIFT] en tipos TS, sin migration SQL
  updated_at             timestamptz DEFAULT now(),

  CONSTRAINT t1_scores_unique_per_interviewee
    UNIQUE NULLS NOT DISTINCT (project_id, dimension_code, subdimension_code, interviewee_id)
);

ALTER TABLE public.t1_dimension_scores ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.t1_dimension_scores.interviewee_department IS
  '[DRIFT Sprint ¿?] Columna en tipos TS pero sin migration SQL explícita. Verificar en lean_ai_pro.';


-- ================================================================
-- TABLA: stakeholders
-- ================================================================
CREATE TABLE public.stakeholders (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid        REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name             text        NOT NULL,
  role             text        NOT NULL,
  department       text        NOT NULL,
  archetype        text        NOT NULL,
  resistance       text        NOT NULL CHECK (resistance IN ('baja', 'media', 'alta')),
  interview        jsonb,
  notes            text,
  manual_override  boolean     NOT NULL DEFAULT false,
  unofficial_tools text        DEFAULT NULL,  -- Migration 007: Shadow AI
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.stakeholders.unofficial_tools IS
  'Shadow AI: herramientas externas (IA o digitales) que el stakeholder usa sin aprobación oficial.';


-- ================================================================
-- TABLA: value_streams
-- ================================================================
CREATE TABLE public.value_streams (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid        REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name              text        NOT NULL,
  department        text        NOT NULL,
  owner             text,
  owner_role        text,
  description       text,
  phase             text        NOT NULL,
  ai_category       text        NOT NULL,
  org_readiness     text        NOT NULL CHECK (org_readiness IN ('baja', 'media', 'alta')),
  opportunity_level text        NOT NULL CHECK (opportunity_level IN ('baja', 'media', 'alta', 'critica')),
  interview         jsonb,
  opportunities     jsonb       NOT NULL DEFAULT '[]',
  stages            jsonb       NOT NULL DEFAULT '[]',
  notes             text,
  manual_override   boolean     NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.value_streams ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: use_cases
-- ================================================================
CREATE TABLE public.use_cases (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid        REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name                  text        NOT NULL,
  description           text,
  department            text        NOT NULL,
  ai_category           text        NOT NULL,
  status                text        NOT NULL DEFAULT 'candidato'
    CHECK (status IN ('candidato','priorizado','go','no_go','en_piloto','completado')),
  sponsor_name          text,
  responsible_it_data   text,
  business_objective    text,
  imported_from_t3      jsonb,
  stakeholder_scores    jsonb       NOT NULL DEFAULT '[]',
  scores                jsonb       NOT NULL DEFAULT '{}',
  priority_score        numeric(5,2) NOT NULL DEFAULT 0,
  economics             jsonb,
  go_no_go              jsonb,
  roadmap               jsonb,
  t1_context            jsonb,
  t2_context            jsonb,
  ai_act_classification jsonb,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: t5_canvas
-- ================================================================
CREATE TABLE public.t5_canvas (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid        REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name        text        NOT NULL DEFAULT '',
  domains             jsonb       NOT NULL DEFAULT '{}',
  maturity_level      text        NOT NULL DEFAULT 'inicial',
  activation_sequence jsonb       NOT NULL DEFAULT '[]',
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.t5_canvas ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: iso42001_controls
-- ================================================================
CREATE TABLE public.iso42001_controls (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  code          text        NOT NULL,
  clause        text        NOT NULL,
  title         text        NOT NULL,
  description   text        NOT NULL DEFAULT '',
  auto_inferred boolean     NOT NULL DEFAULT false,
  status        text        NOT NULL DEFAULT 'no_iniciado'
    CHECK (status IN ('no_iniciado', 'en_progreso', 'implementado')),
  notes         text,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (project_id, code)
);

ALTER TABLE public.iso42001_controls ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: snapshots
-- (versión simplificada de Sprint 8 — not the complex 002 version)
-- ================================================================
CREATE TABLE public.snapshots (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        REFERENCES public.projects(id) ON DELETE CASCADE,
  tool       text        NOT NULL,
  label      text        NOT NULL DEFAULT '',
  data       jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: ai_rate_limit_log
-- ================================================================
CREATE TABLE public.ai_rate_limit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  project_id  uuid        NOT NULL REFERENCES public.projects(id)  ON DELETE CASCADE,
  tool_code   text        NOT NULL
              CHECK (tool_code IN (
                't5_canvas', 't6_policy', 't7_plan',
                't8_comms',  't12_iso',
                't9_overrides', 't9_free_items'
              )),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_rate_limit_log ENABLE ROW LEVEL SECURITY;
-- Sin políticas de usuario → acceso denegado por defecto.

COMMENT ON TABLE public.ai_rate_limit_log IS
  'Log de llamadas IA por usuario. Solo escribe check_and_log_ai_call (service_role). '
  'Limpiar con pg_cron: DELETE WHERE created_at < now() - interval ''24 hours''.';


-- ================================================================
-- TABLA: tool_outputs
-- ================================================================
CREATE TABLE public.tool_outputs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_code       text        NOT NULL
                  CHECK (tool_code IN (
                    't5_canvas', 't6_policy', 't7_plan', 't8_comms', 't12_iso'
                  )),
  payload         jsonb       NOT NULL DEFAULT '{}',
  version         int         NOT NULL DEFAULT 1 CHECK (version >= 1),
  payload_version int         NOT NULL DEFAULT 1 CHECK (payload_version >= 1),
  status          text        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived', 'draft')),
  stale_after     timestamptz,
  archived        boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT chk_archived_status_consistent CHECK (
    (archived = false AND status IN ('active', 'draft'))
    OR (archived = true AND status = 'archived')
  )
);

ALTER TABLE public.tool_outputs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.tool_outputs IS
  'Estado e outputs LLM para T5, T6, T7, T8, T12. Escritura solo vía save_tool_output(). '
  'Outputs archivados son inmutables.';


-- ================================================================
-- TABLA: t9_overrides
-- ================================================================
CREATE TABLE public.t9_overrides (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  use_case_id   text        NOT NULL,
  roadmap_year  smallint    NOT NULL DEFAULT EXTRACT(YEAR FROM now())::smallint,
  start_month   smallint    NOT NULL CHECK (start_month BETWEEN 0 AND 11),
  end_month     smallint    NOT NULL CHECK (end_month   BETWEEN 0 AND 11),
  responsible   text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT t9_overrides_end_gte_start CHECK (end_month >= start_month),
  CONSTRAINT t9_overrides_year_range    CHECK (roadmap_year BETWEEN 2020 AND 2099),
  UNIQUE (project_id, use_case_id, roadmap_year)
);

ALTER TABLE public.t9_overrides ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TABLA: t9_free_items
-- ================================================================
CREATE TABLE public.t9_free_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  roadmap_year  smallint    NOT NULL DEFAULT EXTRACT(YEAR FROM now())::smallint,
  name          text        NOT NULL CHECK (length(trim(name)) > 0),
  department    text        NOT NULL DEFAULT '',
  responsible   text        NOT NULL DEFAULT '',
  start_month   smallint    NOT NULL CHECK (start_month BETWEEN 0 AND 11),
  end_month     smallint    NOT NULL CHECK (end_month   BETWEEN 0 AND 11),
  risk_level    text        NOT NULL DEFAULT 'bajo' CHECK (risk_level IN ('bajo', 'medio', 'alto')),
  status        text        NOT NULL DEFAULT 'pendiente'
                            CHECK (status IN ('pendiente', 'en_curso', 'completado')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT t9_free_items_end_gte_start CHECK (end_month >= start_month),
  CONSTRAINT t9_free_items_year_range    CHECK (roadmap_year BETWEEN 2020 AND 2099)
);

ALTER TABLE public.t9_free_items ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- ÍNDICES
-- ================================================================

-- companies
CREATE INDEX IF NOT EXISTS idx_companies_slug               ON public.companies(slug);

-- company_departments
CREATE INDEX IF NOT EXISTS idx_company_departments_company  ON public.company_departments(company_id);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_company             ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id          ON public.profiles(company_id);  -- alias FASE3

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_company             ON public.projects(company_id);

-- project_members (simple + compuesto)
CREATE INDEX IF NOT EXISTS idx_project_members_user         ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_proj         ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id      ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id   ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_proj_user    ON public.project_members(project_id, user_id);

-- company_profiles
CREATE INDEX IF NOT EXISTS idx_company_profiles_proj        ON public.company_profiles(project_id);

-- frictions
CREATE INDEX IF NOT EXISTS idx_frictions_proj               ON public.frictions(project_id);

-- t1_dimension_scores
CREATE INDEX IF NOT EXISTS idx_t1_scores_proj               ON public.t1_dimension_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_t1_scores_proj_interviewee   ON public.t1_dimension_scores(project_id, interviewee_id);
CREATE INDEX IF NOT EXISTS idx_t1_dimension_scores_project_id ON public.t1_dimension_scores(project_id);

-- stakeholders
CREATE INDEX IF NOT EXISTS idx_stakeholders_proj            ON public.stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_proj_id         ON public.stakeholders(project_id, id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_project_id      ON public.stakeholders(project_id);

-- value_streams
CREATE INDEX IF NOT EXISTS idx_value_streams_proj           ON public.value_streams(project_id);
CREATE INDEX IF NOT EXISTS idx_value_streams_project_id     ON public.value_streams(project_id);

-- use_cases
CREATE INDEX IF NOT EXISTS idx_use_cases_proj               ON public.use_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_use_cases_status             ON public.use_cases(status);
CREATE INDEX IF NOT EXISTS idx_use_cases_project_id         ON public.use_cases(project_id);

-- t5_canvas
CREATE INDEX IF NOT EXISTS idx_t5_canvas_proj               ON public.t5_canvas(project_id);

-- iso42001_controls
CREATE INDEX IF NOT EXISTS idx_iso42001_proj                ON public.iso42001_controls(project_id);

-- snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_proj               ON public.snapshots(project_id);

-- ai_rate_limit_log
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_created      ON public.ai_rate_limit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created           ON public.ai_rate_limit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limit_log_created_at ON public.ai_rate_limit_log(user_id, tool_code, created_at);

-- tool_outputs
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tool_outputs_active  ON public.tool_outputs(project_id, tool_code) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_tool_outputs_project_created ON public.tool_outputs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_outputs_project_tool    ON public.tool_outputs(project_id, tool_code);

-- t9_overrides
CREATE INDEX IF NOT EXISTS idx_t9_overrides_project_year    ON public.t9_overrides(project_id, roadmap_year);

-- t9_free_items
CREATE INDEX IF NOT EXISTS idx_t9_free_items_project_year   ON public.t9_free_items(project_id, roadmap_year);


-- ================================================================
-- TRIGGERS
-- ================================================================

CREATE TRIGGER trg_tool_outputs_updated_at
  BEFORE UPDATE ON public.tool_outputs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_t9_overrides_audit
  BEFORE INSERT OR UPDATE ON public.t9_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_columns();

CREATE TRIGGER trg_t9_free_items_audit
  BEFORE INSERT OR UPDATE ON public.t9_free_items
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_columns();


-- ================================================================
-- FUNCIONES RLS HELPER
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_project_member(pid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = pid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_project(pid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.projects WHERE id = pid AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.project_members
               WHERE project_id = pid AND user_id = auth.uid() AND role = 'consultant')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_company_project(pid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.projects  p
    JOIN   public.profiles  pr ON pr.company_id = p.company_id
    WHERE  p.id          = pid
      AND  pr.id         = auth.uid()
      AND  p.company_id  IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_read_project(p_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = p_project_id AND pm.user_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.projects p
    JOIN public.profiles pr ON pr.company_id = p.company_id
    WHERE p.id = p_project_id AND pr.id = auth.uid()
      AND pr.role IN ('client_editor', 'client_viewer')
  )
$$;

CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = p_project_id AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'editor', 'consultant')
    UNION ALL
    SELECT 1 FROM public.projects p
    JOIN public.profiles pr ON pr.company_id = p.company_id
    WHERE p.id = p_project_id AND pr.id = auth.uid()
      AND pr.role = 'client_editor'
  )
$$;


-- ================================================================
-- FUNCIÓN: handle_new_user (trigger de auth)
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client_viewer'),
    CASE
      WHEN NEW.raw_user_meta_data->>'company_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'company_id')::uuid
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- SAFE PATCH: no tocar auth.users. El trigger on_auth_user_created ya existe y apunta a public.handle_new_user.
-- CREATE OR REPLACE FUNCTION public.handle_new_user actualiza la función sin recrear el trigger.
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();


-- ================================================================
-- FUNCIÓN: check_and_log_ai_call
-- ================================================================

CREATE OR REPLACE FUNCTION public.check_and_log_ai_call(
  p_user_id    uuid,
  p_project_id uuid,
  p_tool_code  text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count        int;
  v_window_start timestamptz  := now() - interval '1 minute';
  v_limit        constant int := 10;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text)::bigint);

  SELECT COUNT(*) INTO v_count
  FROM public.ai_rate_limit_log
  WHERE user_id = p_user_id AND created_at > v_window_start;

  IF v_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false, 'reason', 'rate_limit_exceeded',
      'calls_in_window', v_count, 'limit', v_limit, 'retry_after_seconds', 60
    );
  END IF;

  INSERT INTO public.ai_rate_limit_log (user_id, project_id, tool_code)
  VALUES (p_user_id, p_project_id, p_tool_code);

  RETURN jsonb_build_object('allowed', true, 'calls_in_window', v_count + 1, 'limit', v_limit);
END;
$$;

COMMENT ON FUNCTION public.check_and_log_ai_call IS
  'Rate limit atómico con advisory lock por user_id. Solo llamar desde Edge Function con service_role.';


-- ================================================================
-- FUNCIÓN: save_tool_output
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_tool_output(
  p_project_id      uuid,
  p_tool_code       text,
  p_payload         jsonb,
  p_stale_after     timestamptz DEFAULT NULL,
  p_payload_version int         DEFAULT 1
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_id         uuid := auth.uid();
  v_is_llm            boolean;
  v_current_id        uuid;
  v_current_ver       int;
  v_new_id            uuid;
  v_llm_tools         text[] := ARRAY['t6_policy', 't7_plan', 't8_comms'];
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'save_tool_output: usuario no autenticado' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tool_code NOT IN ('t5_canvas', 't6_policy', 't7_plan', 't8_comms', 't12_iso') THEN
    RAISE EXCEPTION 'save_tool_output: tool_code inválido: %', p_tool_code USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF NOT public.user_can_edit_project(p_project_id) THEN
    RAISE EXCEPTION 'save_tool_output: acceso de escritura denegado al proyecto %', p_project_id USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_project_id::text || ':' || p_tool_code)::bigint);

  v_is_llm := p_tool_code = ANY(v_llm_tools);

  SELECT id, version INTO v_current_id, v_current_ver
  FROM public.tool_outputs
  WHERE project_id = p_project_id AND tool_code = p_tool_code AND archived = false;

  IF v_is_llm THEN
    IF v_current_id IS NOT NULL THEN
      UPDATE public.tool_outputs
         SET archived = true, status = 'archived', updated_at = now(), updated_by = v_caller_id
       WHERE id = v_current_id;
    END IF;
    INSERT INTO public.tool_outputs (project_id, tool_code, payload, version, payload_version, status, archived, stale_after, created_by, updated_by)
    VALUES (p_project_id, p_tool_code, p_payload, COALESCE(v_current_ver, 0) + 1, p_payload_version, 'active', false, p_stale_after, v_caller_id, v_caller_id)
    RETURNING id INTO v_new_id;
  ELSE
    IF v_current_id IS NOT NULL THEN
      UPDATE public.tool_outputs
         SET payload = p_payload, version = v_current_ver + 1, payload_version = p_payload_version,
             stale_after = p_stale_after, updated_at = now(), updated_by = v_caller_id
       WHERE id = v_current_id RETURNING id INTO v_new_id;
    ELSE
      INSERT INTO public.tool_outputs (project_id, tool_code, payload, version, payload_version, status, archived, stale_after, created_by, updated_by)
      VALUES (p_project_id, p_tool_code, p_payload, 1, p_payload_version, 'active', false, p_stale_after, v_caller_id, v_caller_id)
      RETURNING id INTO v_new_id;
    END IF;
  END IF;

  RETURN v_new_id;
END;
$$;

COMMENT ON FUNCTION public.save_tool_output IS
  'Único punto de escritura en tool_outputs. LLM: archiva anterior + inserta nuevo. '
  'Interactivo: update in-place. Verifica user_can_edit_project. SECURITY DEFINER.';


-- ================================================================
-- FUNCIÓN: create_project
-- Formalizada en migración 20260602 — parche manual en gobytech_pro.
-- Firma: create_project(uuid, text, text) → validada en producción.
-- ================================================================

CREATE OR REPLACE FUNCTION public.create_project(
  p_company_id uuid    DEFAULT NULL,
  p_name       text    DEFAULT NULL,
  p_phase      text    DEFAULT 'listen'
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
BEGIN
  -- ── Autorización explícita ─────────────────────────────────────
  -- SECURITY DEFINER bypasa RLS. La autorización queda aquí dentro.
  -- Solo superadmin y consultant pueden crear proyectos.
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

  -- ── Crear el proyecto ──────────────────────────────────────────
  INSERT INTO public.projects (
    id,
    name,
    owner_id,
    company_id,
    status,
    current_phase,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    trim(p_name),
    auth.uid(),
    p_company_id,
    'active',
    p_phase,
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

COMMENT ON FUNCTION public.create_project(uuid, text, text) IS
  'Crea un proyecto y añade al creador como project_member (consultant). '
  'Solo superadmin y consultant pueden invocarla — client_editor y client_viewer '
  'son rechazados explícitamente dentro de la función. '
  'SECURITY DEFINER para escribir en project_members sin conflicto de RLS. '
  'Formalizada en migración 20260602 desde parche manual en gobytech_pro. '
  'Firma: create_project(uuid, text, text) → validada en producción.';


-- ================================================================
-- GRANTS Y REVOKE
-- ================================================================

REVOKE ALL ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_log_ai_call(uuid, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.user_can_read_project(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.user_can_read_project(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.user_can_edit_project(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.user_can_edit_project(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) TO authenticated;

REVOKE ALL     ON FUNCTION public.create_project(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_project(uuid, text, text) TO authenticated;


-- ================================================================
-- RLS — POLÍTICAS COMPLETAS
-- ================================================================

-- ── companies ────────────────────────────────────────────────
CREATE POLICY "companies_select_authenticated" ON public.companies
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "companies_admin_write" ON public.companies
  FOR ALL USING (public.is_platform_admin());


-- ── company_departments ──────────────────────────────────────
CREATE POLICY "company_departments_select" ON public.company_departments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "company_departments_admin_write" ON public.company_departments
  FOR ALL USING (public.is_platform_admin());


-- ── profiles ────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY "profiles_admin_update_all" ON public.profiles
  FOR UPDATE USING (public.is_platform_admin());


-- ── projects ────────────────────────────────────────────────
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.is_company_project(id) OR public.is_project_member(id) OR public.is_platform_admin()
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_platform_admin());


-- ── project_members ─────────────────────────────────────────
CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());

CREATE POLICY "project_members_write" ON public.project_members
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── company_profiles ────────────────────────────────────────
CREATE POLICY "company_profiles_select" ON public.company_profiles
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "company_profiles_write" ON public.company_profiles
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── frictions ───────────────────────────────────────────────
CREATE POLICY "frictions_select" ON public.frictions
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "frictions_write" ON public.frictions
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── t1_dimension_scores ─────────────────────────────────────
CREATE POLICY "t1_select" ON public.t1_dimension_scores
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "t1_write" ON public.t1_dimension_scores
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── stakeholders ────────────────────────────────────────────
CREATE POLICY "stakeholders_select" ON public.stakeholders
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "stakeholders_write" ON public.stakeholders
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── value_streams ───────────────────────────────────────────
CREATE POLICY "value_streams_select" ON public.value_streams
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "value_streams_write" ON public.value_streams
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── use_cases ───────────────────────────────────────────────
CREATE POLICY "use_cases_select" ON public.use_cases
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "use_cases_write" ON public.use_cases
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── t5_canvas ───────────────────────────────────────────────
CREATE POLICY "t5_canvas_select" ON public.t5_canvas
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "t5_canvas_write" ON public.t5_canvas
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── iso42001_controls ───────────────────────────────────────
CREATE POLICY "iso42001_select" ON public.iso42001_controls
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "iso42001_write" ON public.iso42001_controls
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── snapshots ───────────────────────────────────────────────
CREATE POLICY "snapshots_select" ON public.snapshots
  FOR SELECT USING (
    public.is_company_project(project_id) OR public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "snapshots_write" ON public.snapshots
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());


-- ── tool_outputs ────────────────────────────────────────────
CREATE POLICY "tool_outputs_select"
  ON public.tool_outputs FOR SELECT TO authenticated
  USING (public.user_can_read_project(project_id));

-- Sin INSERT ni UPDATE para authenticated (solo save_tool_output)
CREATE POLICY "tool_outputs_no_delete"
  ON public.tool_outputs FOR DELETE TO authenticated
  USING (false);


-- ── t9_overrides ────────────────────────────────────────────
CREATE POLICY "t9_overrides_select"
  ON public.t9_overrides FOR SELECT TO authenticated
  USING (public.user_can_read_project(project_id));

CREATE POLICY "t9_overrides_insert"
  ON public.t9_overrides FOR INSERT TO authenticated
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "t9_overrides_update"
  ON public.t9_overrides FOR UPDATE TO authenticated
  USING (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "t9_overrides_delete"
  ON public.t9_overrides FOR DELETE TO authenticated
  USING (public.user_can_edit_project(project_id));


-- ── t9_free_items ───────────────────────────────────────────
CREATE POLICY "t9_free_items_select"
  ON public.t9_free_items FOR SELECT TO authenticated
  USING (public.user_can_read_project(project_id));

CREATE POLICY "t9_free_items_insert"
  ON public.t9_free_items FOR INSERT TO authenticated
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "t9_free_items_update"
  ON public.t9_free_items FOR UPDATE TO authenticated
  USING (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "t9_free_items_delete"
  ON public.t9_free_items FOR DELETE TO authenticated
  USING (public.user_can_edit_project(project_id));


-- ── ai_rate_limit_log: sin políticas de usuario ─────────────
-- (acceso denegado por defecto para anon y authenticated)


-- ================================================================
-- VERIFICACIÓN RÁPIDA
-- ================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

DO $$
BEGIN
  RAISE NOTICE '[SCHEMA CREATE OK] Continúa con 04_SYSTEM_SEED.sql';
END $$;

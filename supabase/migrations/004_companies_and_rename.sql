-- ============================================================
-- GOBY — Migración 004: Companies + Rename projects
--
-- INSTRUCCIONES PARA CARLOS:
--   1. Abre el NUEVO proyecto Supabase (gobytech-prod)
--   2. Ve a SQL Editor
--   3. Pega ESTE archivo completo y pulsa Run
--   4. Verifica que no hay errores en la consola
--
-- Cambios que hace esta migración:
--   A. Crea tabla `companies` (entidad empresa/cliente)
--   B. Añade `company_id` a `profiles` y a `projects`
--   C. Renombra `engagements` → `projects`
--   D. Renombra `engagement_members` → `project_members`
--   E. Renombra columna `engagement_id` → `project_id` en TODAS las tablas
--   F. Actualiza todas las RLS policies y funciones helper
--   G. Añade rol `platform_admin` para Carlos (superadmin)
--
-- NOTA: Esta migración se ejecuta sobre el proyecto NUEVO (vacío).
--       Incluye también las migraciones 001, 002, 003 base.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PASO 1: Crear tabla companies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 2: Tabla profiles (con company_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      text NOT NULL,
  name       text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT 'viewer'
             CHECK (role IN ('admin', 'consultant', 'viewer')),
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- NOTA: 'admin' = platform admin (solo Carlos).
--       'consultant' = consultor Alpha asignado a proyectos.
--       'viewer' = usuario del cliente.


-- ============================================================
-- PASO 3: Tabla projects (antes engagements)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  owner_id      uuid REFERENCES public.profiles(id) NOT NULL,
  company_id    uuid REFERENCES public.companies(id),
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'archived')),
  current_phase text NOT NULL DEFAULT 'listen'
                CHECK (current_phase IN ('listen', 'evaluate', 'activate', 'normalize', 'closed')),
  start_date    date,
  end_date      date,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 4: Tabla project_members (antes engagement_members)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'consultant'
             CHECK (role IN ('consultant', 'viewer')),
  added_at   timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 5: Tabla company_profiles (project_id en lugar de engagement_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  project_name           text NOT NULL DEFAULT '',
  sector                 text NOT NULL DEFAULT '',
  tamano_empresa         text NOT NULL DEFAULT '',
  objetivo_principal_ia  text NOT NULL DEFAULT '',
  horizonte_valor        text NOT NULL DEFAULT '',
  ecosistema_tecnologico text NOT NULL DEFAULT '',
  restricciones          text NOT NULL DEFAULT '',
  areas_prioritarias     jsonb NOT NULL DEFAULT '[]',
  saved_at               timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 6: Tabla frictions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.frictions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  tipo          text NOT NULL DEFAULT '',
  area_funcional text NOT NULL DEFAULT '',
  frecuencia    text CHECK (frecuencia IN ('Baja', 'Media', 'Alta')),
  impacto       text CHECK (impacto IN ('Bajo', 'Medio', 'Alto')),
  notas         text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.frictions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 7: Tabla t1_dimension_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.t1_dimension_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  dimension_code    text NOT NULL,
  subdimension_code text NOT NULL,
  score             numeric(3,1) CHECK (score IS NULL OR (score >= 0 AND score <= 4)),
  evidence          text NOT NULL DEFAULT '',
  interviewee_id    text,
  interviewee_name  text,
  interviewee_role  text,
  interviewee_type  text NOT NULL DEFAULT 'business'
                    CHECK (interviewee_type IN ('it', 'business')),
  updated_at        timestamptz DEFAULT now()
);

-- Unique constraint incluyendo interviewee_id (migración 003 integrada)
ALTER TABLE public.t1_dimension_scores
  ADD CONSTRAINT t1_scores_unique_per_interviewee
  UNIQUE NULLS NOT DISTINCT
    (project_id, dimension_code, subdimension_code, interviewee_id);

ALTER TABLE public.t1_dimension_scores ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 8: Tabla stakeholders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stakeholders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name            text NOT NULL,
  role            text NOT NULL,
  department      text NOT NULL,
  archetype       text NOT NULL,
  resistance      text NOT NULL CHECK (resistance IN ('baja', 'media', 'alta')),
  interview       jsonb,
  notes           text,
  manual_override boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 9: Tabla value_streams
-- ============================================================
CREATE TABLE IF NOT EXISTS public.value_streams (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name              text NOT NULL,
  department        text NOT NULL,
  owner             text,
  owner_role        text,
  description       text,
  phase             text NOT NULL,
  ai_category       text NOT NULL,
  org_readiness     text NOT NULL CHECK (org_readiness IN ('baja', 'media', 'alta')),
  opportunity_level text NOT NULL CHECK (opportunity_level IN ('baja', 'media', 'alta', 'critica')),
  interview         jsonb,
  opportunities     jsonb NOT NULL DEFAULT '[]',
  stages            jsonb NOT NULL DEFAULT '[]',
  notes             text,
  manual_override   boolean NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.value_streams ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 10: Tabla use_cases
-- ============================================================
CREATE TABLE IF NOT EXISTS public.use_cases (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name                  text NOT NULL,
  description           text,
  department            text NOT NULL,
  ai_category           text NOT NULL,
  status                text NOT NULL DEFAULT 'candidato'
    CHECK (status IN ('candidato','priorizado','go','no_go','en_piloto','completado')),
  sponsor_name          text,
  responsible_it_data   text,
  business_objective    text,
  imported_from_t3      jsonb,
  stakeholder_scores    jsonb NOT NULL DEFAULT '[]',
  scores                jsonb NOT NULL,
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


-- ============================================================
-- PASO 11: Tabla t5_canvas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.t5_canvas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name        text NOT NULL DEFAULT '',
  domains             jsonb NOT NULL DEFAULT '{}',
  maturity_level      text NOT NULL DEFAULT 'inicial',
  activation_sequence jsonb NOT NULL DEFAULT '[]',
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.t5_canvas ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 12: Tabla iso42001_controls
-- ============================================================
CREATE TABLE IF NOT EXISTS public.iso42001_controls (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  code       text NOT NULL,
  clause     text NOT NULL,
  title      text NOT NULL,
  description text NOT NULL DEFAULT '',
  auto_inferred boolean NOT NULL DEFAULT false,
  status     text NOT NULL DEFAULT 'no_iniciado'
    CHECK (status IN ('no_iniciado', 'en_progreso', 'implementado')),
  notes      text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_id, code)
);

ALTER TABLE public.iso42001_controls ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 13: Tabla snapshots (migración 002 integrada)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.snapshots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  tool       text NOT NULL,
  label      text NOT NULL DEFAULT '',
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- FUNCIONES HELPER PARA RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_project_member(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = pid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_project(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = pid AND user_id = auth.uid() AND role = 'consultant'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ── companies ───────────────────────────────────────────────────
CREATE POLICY "companies_select_authenticated" ON public.companies
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "companies_admin_write" ON public.companies
  FOR ALL USING (public.is_platform_admin());


-- ── profiles ────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY "profiles_admin_update_all" ON public.profiles
  FOR UPDATE USING (public.is_platform_admin());


-- ── projects ────────────────────────────────────────────────────
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.is_project_member(id) OR public.is_platform_admin()
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() OR public.is_platform_admin()
  );

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    owner_id = auth.uid() OR public.is_platform_admin()
  );


-- ── project_members ─────────────────────────────────────────────
CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "project_members_write" ON public.project_members
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── company_profiles ────────────────────────────────────────────
CREATE POLICY "company_profiles_select" ON public.company_profiles
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "company_profiles_write" ON public.company_profiles
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── frictions ───────────────────────────────────────────────────
CREATE POLICY "frictions_select" ON public.frictions
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "frictions_write" ON public.frictions
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── t1_dimension_scores ─────────────────────────────────────────
CREATE POLICY "t1_select" ON public.t1_dimension_scores
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "t1_write" ON public.t1_dimension_scores
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── stakeholders ────────────────────────────────────────────────
CREATE POLICY "stakeholders_select" ON public.stakeholders
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "stakeholders_write" ON public.stakeholders
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── value_streams ───────────────────────────────────────────────
CREATE POLICY "value_streams_select" ON public.value_streams
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "value_streams_write" ON public.value_streams
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── use_cases ───────────────────────────────────────────────────
CREATE POLICY "use_cases_select" ON public.use_cases
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "use_cases_write" ON public.use_cases
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── t5_canvas ───────────────────────────────────────────────────
CREATE POLICY "t5_canvas_select" ON public.t5_canvas
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "t5_canvas_write" ON public.t5_canvas
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── iso42001_controls ───────────────────────────────────────────
CREATE POLICY "iso42001_select" ON public.iso42001_controls
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "iso42001_write" ON public.iso42001_controls
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ── snapshots ───────────────────────────────────────────────────
CREATE POLICY "snapshots_select" ON public.snapshots
  FOR SELECT USING (
    public.is_project_member(project_id) OR public.is_platform_admin()
  );

CREATE POLICY "snapshots_write" ON public.snapshots
  FOR ALL USING (
    public.can_write_project(project_id) OR public.is_platform_admin()
  );


-- ============================================================
-- TRIGGER: auto-crear perfil al hacer signup
-- Incluye company_id si viene en raw_user_meta_data
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_project_members_user  ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_proj  ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_proj ON public.company_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_frictions_proj        ON public.frictions(project_id);
CREATE INDEX IF NOT EXISTS idx_t1_scores_proj        ON public.t1_dimension_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_proj     ON public.stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_value_streams_proj    ON public.value_streams(project_id);
CREATE INDEX IF NOT EXISTS idx_use_cases_proj        ON public.use_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_use_cases_status      ON public.use_cases(status);
CREATE INDEX IF NOT EXISTS idx_t5_canvas_proj        ON public.t5_canvas(project_id);
CREATE INDEX IF NOT EXISTS idx_iso42001_proj         ON public.iso42001_controls(project_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company      ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company      ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_proj        ON public.snapshots(project_id);


-- ============================================================
-- VERIFICACIÓN FINAL
-- Ejecuta esto para confirmar que todo está bien
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

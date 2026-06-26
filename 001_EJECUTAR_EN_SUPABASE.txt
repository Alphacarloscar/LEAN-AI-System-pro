-- ============================================================
-- LEAN AI System Enterprise — Migración 001: Schema Foundation
--
-- INSTRUCCIONES PARA EJECUTAR:
--   1. Abre Supabase Dashboard → SQL Editor
--   2. Pega este archivo completo y ejecuta
--   3. Verifica que todas las tablas aparecen en Table Editor
--
-- Tablas: profiles, engagements, engagement_members,
--         company_profiles, frictions,
--         t1_dimension_scores, stakeholders, value_streams,
--         use_cases, t5_canvas, iso42001_controls
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────────
-- gen_random_uuid() disponible desde pg 13+ en Supabase sin extensión
-- pero uuid-ossp da compatibilidad extra
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLA: profiles
-- Extiende auth.users con nombre y rol.
-- Se crea automáticamente al hacer signup (ver trigger).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      text NOT NULL,
  name       text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT 'viewer'
             CHECK (role IN ('admin', 'consultant', 'viewer')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: engagements
-- Un engagement = un proyecto con un cliente.
-- Un consultor puede tener múltiples engagements.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.engagements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  owner_id      uuid REFERENCES public.profiles(id) NOT NULL,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'archived')),
  current_phase text NOT NULL DEFAULT 'listen'
                CHECK (current_phase IN ('listen', 'evaluate', 'activate', 'normalize', 'closed')),
  start_date    date,
  end_date      date,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: engagement_members
-- Controla qué usuarios tienen acceso a qué engagement
-- y con qué rol (consultant = lectura+escritura, viewer = solo lectura).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.engagement_members (
  engagement_id uuid REFERENCES public.engagements(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'consultant'
                CHECK (role IN ('consultant', 'viewer')),
  added_at      timestamptz DEFAULT now(),
  PRIMARY KEY (engagement_id, user_id)
);

ALTER TABLE public.engagement_members ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: company_profiles
-- Uno por engagement. Alimenta T1–T13 vía context_refs.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id          uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL UNIQUE,
  engagement_name        text NOT NULL DEFAULT '',
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
-- TABLA: frictions
-- Registro de fricciones organizativas (normalizado fuera de company_profiles).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.frictions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  tipo          text NOT NULL DEFAULT '',
  area_funcional text NOT NULL DEFAULT '',
  frecuencia    text CHECK (frecuencia IN ('Baja', 'Media', 'Alta')),
  impacto       text CHECK (impacto IN ('Bajo', 'Medio', 'Alto')),
  notas         text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.frictions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: t1_dimension_scores
-- T1 — Maturity Radar: scores por subdimensión.
-- 6 dimensiones × 4 subdimensiones = 24 filas por engagement.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.t1_dimension_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id     uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  dimension_code    text NOT NULL,  -- 'strategy', 'data', 'technology', etc.
  subdimension_code text NOT NULL,  -- 'data-availability', etc.
  score             numeric(3,1) CHECK (score IS NULL OR (score >= 0 AND score <= 4)),
  evidence          text NOT NULL DEFAULT '',
  interviewee_id    text,
  interviewee_name  text,
  interviewee_role  text,
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (engagement_id, dimension_code, subdimension_code)
);

ALTER TABLE public.t1_dimension_scores ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: stakeholders
-- T2 — Stakeholder Matrix: 5 arquetipos.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stakeholders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  name            text NOT NULL,
  role            text NOT NULL,
  department      text NOT NULL,
  archetype       text NOT NULL,  -- ArchetypeCode
  resistance      text NOT NULL CHECK (resistance IN ('baja', 'media', 'alta')),
  interview       jsonb,          -- InterviewResult | null
  notes           text,
  manual_override boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: value_streams
-- T3 — Value Stream Map: procesos de negocio.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.value_streams (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id     uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  name              text NOT NULL,
  department        text NOT NULL,
  owner             text,
  owner_role        text,
  description       text,
  phase             text NOT NULL,        -- ProcessPhase
  ai_category       text NOT NULL,        -- AICategoryCode
  org_readiness     text NOT NULL CHECK (org_readiness IN ('baja', 'media', 'alta')),
  opportunity_level text NOT NULL CHECK (opportunity_level IN ('baja', 'media', 'alta', 'critica')),
  interview         jsonb,                -- ProcessInterviewResult | null
  opportunities     jsonb NOT NULL DEFAULT '[]',  -- AIOpportunity[]
  stages            jsonb NOT NULL DEFAULT '[]',  -- ProcessStage[]
  notes             text,
  manual_override   boolean NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.value_streams ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: use_cases
-- T4 — Use Case Priority Board: la tabla más compleja.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.use_cases (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id         uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  name                  text NOT NULL,
  description           text,
  department            text NOT NULL,
  ai_category           text NOT NULL,
  status                text NOT NULL DEFAULT 'candidato'
    CHECK (status IN ('candidato','priorizado','go','no_go','en_piloto','completado')),
  sponsor_name          text,
  responsible_it_data   text,
  business_objective    text,
  imported_from_t3      jsonb,           -- ImportedFromT3 | null
  stakeholder_scores    jsonb NOT NULL DEFAULT '[]',  -- StakeholderScore[]
  scores                jsonb NOT NULL,  -- UseCaseScores {kpiImpact, feasibility, aiRisk, dataDependency}
  priority_score        numeric(5,2) NOT NULL DEFAULT 0,
  economics             jsonb,           -- UseCaseEconomics | null
  go_no_go              jsonb,           -- GoNoGoDecision | null
  roadmap               jsonb,           -- UseCaseRoadmap | null
  t1_context            jsonb,           -- T1Context | null
  t2_context            jsonb,           -- T2Context | null
  ai_act_classification jsonb,           -- AIActClassification | null
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: t5_canvas
-- T5 — AI Taxonomy Canvas: uno por engagement.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.t5_canvas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id       uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name        text NOT NULL DEFAULT '',
  domains             jsonb NOT NULL DEFAULT '{}',   -- Record<T5DomainCode, T5DomainAssessment>
  maturity_level      text NOT NULL DEFAULT 'inicial',
  activation_sequence jsonb NOT NULL DEFAULT '[]',   -- T5DomainCode[]
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.t5_canvas ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: iso42001_controls
-- T6 — Risk & Governance: 14 controles ISO 42001 por engagement.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.iso42001_controls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  code          text NOT NULL,    -- '5.2', '6.1', etc.
  clause        text NOT NULL,    -- ISO42001Clause
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  auto_inferred boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'no_iniciado'
    CHECK (status IN ('no_iniciado', 'en_progreso', 'implementado')),
  notes         text,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (engagement_id, code)
);

ALTER TABLE public.iso42001_controls ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- FUNCIONES HELPER PARA RLS
-- SECURITY DEFINER: se ejecutan con los permisos del creador,
-- no del usuario llamante — necesario para leer engagement_members.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_engagement_member(eid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.engagement_members
    WHERE engagement_id = eid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_engagement(eid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Miembro con rol consultor
    EXISTS (
      SELECT 1 FROM public.engagement_members
      WHERE engagement_id = eid AND user_id = auth.uid() AND role = 'consultant'
    )
    OR
    -- Admin global
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    );
$$;


-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ── profiles ────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can see all profiles (needed for member management)
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── engagements ─────────────────────────────────────────────────
CREATE POLICY "engagements_select_member" ON public.engagements
  FOR SELECT USING (public.is_engagement_member(id));

CREATE POLICY "engagements_insert_auth" ON public.engagements
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "engagements_update_owner" ON public.engagements
  FOR UPDATE USING (owner_id = auth.uid());


-- ── engagement_members ──────────────────────────────────────────
CREATE POLICY "engagement_members_select" ON public.engagement_members
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "engagement_members_write" ON public.engagement_members
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── company_profiles ────────────────────────────────────────────
CREATE POLICY "company_profiles_select" ON public.company_profiles
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "company_profiles_write" ON public.company_profiles
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── frictions ───────────────────────────────────────────────────
CREATE POLICY "frictions_select" ON public.frictions
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "frictions_write" ON public.frictions
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── t1_dimension_scores ─────────────────────────────────────────
CREATE POLICY "t1_select" ON public.t1_dimension_scores
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "t1_write" ON public.t1_dimension_scores
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── stakeholders ────────────────────────────────────────────────
CREATE POLICY "stakeholders_select" ON public.stakeholders
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "stakeholders_write" ON public.stakeholders
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── value_streams ───────────────────────────────────────────────
CREATE POLICY "value_streams_select" ON public.value_streams
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "value_streams_write" ON public.value_streams
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── use_cases ───────────────────────────────────────────────────
CREATE POLICY "use_cases_select" ON public.use_cases
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "use_cases_write" ON public.use_cases
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── t5_canvas ───────────────────────────────────────────────────
CREATE POLICY "t5_canvas_select" ON public.t5_canvas
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "t5_canvas_write" ON public.t5_canvas
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── iso42001_controls ───────────────────────────────────────────
CREATE POLICY "iso42001_select" ON public.iso42001_controls
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "iso42001_write" ON public.iso42001_controls
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ============================================================
-- TRIGGER: auto-crear perfil al hacer signup en Supabase Auth
-- Se ejecuta tras INSERT en auth.users.
-- El nombre se lee de raw_user_meta_data.name (enviado en signUp).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Eliminar trigger si existe (idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- Todos los foreign keys + campos de búsqueda frecuente.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_engagement_members_user   ON public.engagement_members(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_members_eng    ON public.engagement_members(engagement_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_eng      ON public.company_profiles(engagement_id);
CREATE INDEX IF NOT EXISTS idx_frictions_eng             ON public.frictions(engagement_id);
CREATE INDEX IF NOT EXISTS idx_t1_scores_eng             ON public.t1_dimension_scores(engagement_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_eng          ON public.stakeholders(engagement_id);
CREATE INDEX IF NOT EXISTS idx_value_streams_eng         ON public.value_streams(engagement_id);
CREATE INDEX IF NOT EXISTS idx_use_cases_eng             ON public.use_cases(engagement_id);
CREATE INDEX IF NOT EXISTS idx_use_cases_status          ON public.use_cases(status);
CREATE INDEX IF NOT EXISTS idx_t5_canvas_eng             ON public.t5_canvas(engagement_id);
CREATE INDEX IF NOT EXISTS idx_iso42001_eng              ON public.iso42001_controls(engagement_id);

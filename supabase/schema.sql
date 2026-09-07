-- ============================================================
-- GOBY — Consolidated Schema
--
-- Generated: 2026-09-04
-- Version: 2.2.0
-- Purpose: Single schema file consolidating all migrations
--
-- This file is idempotent:
--   - Uses IF NOT EXISTS / IF EXISTS / ON CONFLICT
--   - Safe to run multiple times
--   - Compatible with PostgreSQL 13+
--
-- Table Count: ~40+
-- Function Count: ~15+
-- RLS Policies: ~50+
-- Seed Rows: ~100+ (domains, controls, templates)
--
-- Instructions:
--   1. supabase status                    (verify DEV local)
--   2. cat supabase/schema.sql | psql <DEV_CONNECTION>
--   3. Or: copy-paste into Supabase SQL Editor
--
-- ============================================================

-- Start transaction for safety
BEGIN;

-- Consolidating migrations...

-- ========== 001_foundation.sql ==========
-- Original source: 001_foundation.sql

-- ============================================================
-- GOBY — Migración 001: Schema Foundation
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


-- ========== 002_snapshots.sql ==========
-- Original source: 002_snapshots.sql

-- ============================================================
-- GOBY — Migración 002: Snapshots longitudinales
--
-- INSTRUCCIONES PARA EJECUTAR:
--   1. Abre Supabase Dashboard → SQL Editor
--   2. Pega este archivo completo y ejecuta
--   3. Verifica que las 4 tablas aparecen en Table Editor
--
-- Prerequisito: 001_foundation.sql debe estar ejecutado.
--   Depende de: engagements, t1_dimension_scores, stakeholders,
--               value_streams, is_engagement_member, can_write_engagement
--
-- Tablas nuevas: snapshots, t1_score_snapshots,
--                stakeholder_snapshots, value_stream_snapshots
--
-- Función nueva: create_snapshot(engagement_id, type, label, created_by, notes?)
--   → crea cabecera + copia estado activo de T1, T2 y T3 en una sola llamada
-- ============================================================


-- ============================================================
-- TABLA: snapshots
-- Cabecera de cada snapshot. Un snapshot = estado capturado
-- del engagement en un momento clave del sprint.
-- Las tablas _snapshots referencian esta cabecera vía snapshot_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  created_by    uuid REFERENCES public.profiles(id) NOT NULL,
  type          text NOT NULL
                CHECK (type IN ('baseline', 'mid_sprint', 'final', 'review')),
  label         text NOT NULL,          -- Ej: "Baseline semana 1", "Revisión mes 3"
  notes         text,                   -- Opcional — contexto libre del consultor
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: t1_score_snapshots
-- Copia punto-en-el-tiempo de t1_dimension_scores.
-- Conserva la evidencia y el entrevistado del momento del snapshot.
-- No tiene UNIQUE por (snapshot_id, dimension, sub) — un snapshot
-- puede tener 0..N scores; la integridad la garantiza create_snapshot().
-- ============================================================
CREATE TABLE IF NOT EXISTS public.t1_score_snapshots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id       uuid REFERENCES public.snapshots(id) ON DELETE CASCADE NOT NULL,
  engagement_id     uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  dimension_code    text NOT NULL,
  subdimension_code text NOT NULL,
  score             numeric(3,1) CHECK (score IS NULL OR (score >= 0 AND score <= 4)),
  evidence          text NOT NULL DEFAULT '',
  interviewee_id    text,
  interviewee_name  text,
  interviewee_role  text
  -- Sin updated_at: los snapshots son inmutables una vez creados
);

ALTER TABLE public.t1_score_snapshots ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: stakeholder_snapshots
-- Copia punto-en-el-tiempo de stakeholders (T2).
-- Captura arquetipo, resistencia y resultado de entrevista
-- tal como estaban en el momento del snapshot.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stakeholder_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id     uuid REFERENCES public.snapshots(id) ON DELETE CASCADE NOT NULL,
  engagement_id   uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  stakeholder_id  uuid REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  -- Campos copiados del estado activo en el momento del snapshot
  name            text NOT NULL,
  role            text NOT NULL,
  department      text NOT NULL,
  archetype       text NOT NULL,
  resistance      text NOT NULL CHECK (resistance IN ('baja', 'media', 'alta')),
  interview       jsonb,          -- Copia del InterviewResult en ese momento
  notes           text,
  manual_override boolean NOT NULL DEFAULT false
);

ALTER TABLE public.stakeholder_snapshots ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: value_stream_snapshots
-- Copia punto-en-el-tiempo de value_streams (T3).
-- Captura org_readiness y opportunity_level — los dos campos
-- que evolucionan a lo largo del sprint y justifican el tracking.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.value_stream_snapshots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id       uuid REFERENCES public.snapshots(id) ON DELETE CASCADE NOT NULL,
  engagement_id     uuid REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  value_stream_id   uuid REFERENCES public.value_streams(id) ON DELETE SET NULL,
  -- Campos copiados del estado activo en el momento del snapshot
  name              text NOT NULL,
  department        text NOT NULL,
  phase             text NOT NULL,
  ai_category       text NOT NULL,
  org_readiness     text NOT NULL CHECK (org_readiness IN ('baja', 'media', 'alta')),
  opportunity_level text NOT NULL CHECK (opportunity_level IN ('baja', 'media', 'alta', 'critica')),
  opportunities     jsonb NOT NULL DEFAULT '[]',  -- Copia de AIOpportunity[]
  notes             text
);

ALTER TABLE public.value_stream_snapshots ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES — Snapshots
-- Mismo patrón que 001_foundation.sql:
--   SELECT → is_engagement_member
--   ALL    → can_write_engagement
-- ============================================================

-- ── snapshots ────────────────────────────────────────────────────
CREATE POLICY "snapshots_select" ON public.snapshots
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "snapshots_write" ON public.snapshots
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── t1_score_snapshots ───────────────────────────────────────────
-- RLS vía engagement_id directo (evita join con snapshots en cada check)
CREATE POLICY "t1_score_snapshots_select" ON public.t1_score_snapshots
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "t1_score_snapshots_write" ON public.t1_score_snapshots
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── stakeholder_snapshots ─────────────────────────────────────────
CREATE POLICY "stakeholder_snapshots_select" ON public.stakeholder_snapshots
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "stakeholder_snapshots_write" ON public.stakeholder_snapshots
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ── value_stream_snapshots ────────────────────────────────────────
CREATE POLICY "value_stream_snapshots_select" ON public.value_stream_snapshots
  FOR SELECT USING (public.is_engagement_member(engagement_id));

CREATE POLICY "value_stream_snapshots_write" ON public.value_stream_snapshots
  FOR ALL USING (public.can_write_engagement(engagement_id));


-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- Clave para las queries de comparación delta (snapshot A vs B).
-- ============================================================

-- snapshots: búsqueda por engagement y por tipo
CREATE INDEX IF NOT EXISTS idx_snapshots_engagement   ON public.snapshots(engagement_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_type         ON public.snapshots(type);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at   ON public.snapshots(created_at);

-- t1_score_snapshots: lookup por snapshot y por engagement
CREATE INDEX IF NOT EXISTS idx_t1_snap_snapshot       ON public.t1_score_snapshots(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_t1_snap_engagement     ON public.t1_score_snapshots(engagement_id);
CREATE INDEX IF NOT EXISTS idx_t1_snap_dimension      ON public.t1_score_snapshots(dimension_code);

-- stakeholder_snapshots
CREATE INDEX IF NOT EXISTS idx_sh_snap_snapshot       ON public.stakeholder_snapshots(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_sh_snap_engagement     ON public.stakeholder_snapshots(engagement_id);
CREATE INDEX IF NOT EXISTS idx_sh_snap_stakeholder    ON public.stakeholder_snapshots(stakeholder_id);

-- value_stream_snapshots
CREATE INDEX IF NOT EXISTS idx_vs_snap_snapshot       ON public.value_stream_snapshots(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_vs_snap_engagement     ON public.value_stream_snapshots(engagement_id);
CREATE INDEX IF NOT EXISTS idx_vs_snap_value_stream   ON public.value_stream_snapshots(value_stream_id);


-- ============================================================
-- FUNCIÓN: create_snapshot
--
-- Crea un snapshot completo del estado activo del engagement
-- en una sola llamada desde el frontend.
--
-- Parámetros:
--   p_engagement_id  — UUID del engagement a capturar
--   p_type           — 'baseline' | 'mid_sprint' | 'final' | 'review'
--   p_label          — Texto libre (ej. "Baseline semana 1")
--   p_created_by     — UUID del usuario que crea el snapshot
--   p_notes          — Opcional. Contexto libre del consultor.
--
-- Retorna: UUID del snapshot recién creado.
--
-- Comportamiento:
--   1. Verifica que el usuario tiene permiso de escritura.
--   2. Inserta cabecera en snapshots.
--   3. Copia t1_dimension_scores → t1_score_snapshots.
--   4. Copia stakeholders       → stakeholder_snapshots.
--   5. Copia value_streams      → value_stream_snapshots.
--   Todo ocurre en la misma transacción — si algo falla, se revierte.
--
-- SECURITY DEFINER: necesario para copiar datos de las tablas activas
-- sin que el frontend necesite permisos de inserción directa en _snapshots.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_snapshot(
  p_engagement_id uuid,
  p_type          text,
  p_label         text,
  p_created_by    uuid,
  p_notes         text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot_id uuid;
BEGIN
  -- ── Guardia de permisos ──────────────────────────────────────
  -- Verifica que el usuario llamante puede escribir en el engagement.
  -- Aunque SECURITY DEFINER da permisos elevados, queremos asegurar
  -- que solo consultores/admins crean snapshots.
  IF NOT public.can_write_engagement(p_engagement_id) THEN
    RAISE EXCEPTION 'No tienes permiso para crear snapshots en este engagement (id: %)', p_engagement_id
      USING ERRCODE = '42501';  -- insufficient_privilege
  END IF;

  -- ── Validar type ─────────────────────────────────────────────
  IF p_type NOT IN ('baseline', 'mid_sprint', 'final', 'review') THEN
    RAISE EXCEPTION 'Tipo de snapshot inválido: %. Valores permitidos: baseline, mid_sprint, final, review', p_type
      USING ERRCODE = '22023';  -- invalid_parameter_value
  END IF;

  -- ── 1. Crear cabecera del snapshot ───────────────────────────
  INSERT INTO public.snapshots (engagement_id, created_by, type, label, notes)
  VALUES (p_engagement_id, p_created_by, p_type, p_label, p_notes)
  RETURNING id INTO v_snapshot_id;

  -- ── 2. Copiar T1 — t1_dimension_scores ──────────────────────
  INSERT INTO public.t1_score_snapshots (
    snapshot_id,
    engagement_id,
    dimension_code,
    subdimension_code,
    score,
    evidence,
    interviewee_id,
    interviewee_name,
    interviewee_role
  )
  SELECT
    v_snapshot_id,
    engagement_id,
    dimension_code,
    subdimension_code,
    score,
    evidence,
    interviewee_id,
    interviewee_name,
    interviewee_role
  FROM public.t1_dimension_scores
  WHERE engagement_id = p_engagement_id;

  -- ── 3. Copiar T2 — stakeholders ──────────────────────────────
  INSERT INTO public.stakeholder_snapshots (
    snapshot_id,
    engagement_id,
    stakeholder_id,
    name,
    role,
    department,
    archetype,
    resistance,
    interview,
    notes,
    manual_override
  )
  SELECT
    v_snapshot_id,
    engagement_id,
    id,            -- stakeholder_id apunta al registro activo
    name,
    role,
    department,
    archetype,
    resistance,
    interview,
    notes,
    manual_override
  FROM public.stakeholders
  WHERE engagement_id = p_engagement_id;

  -- ── 4. Copiar T3 — value_streams ─────────────────────────────
  INSERT INTO public.value_stream_snapshots (
    snapshot_id,
    engagement_id,
    value_stream_id,
    name,
    department,
    phase,
    ai_category,
    org_readiness,
    opportunity_level,
    opportunities,
    notes
  )
  SELECT
    v_snapshot_id,
    engagement_id,
    id,            -- value_stream_id apunta al registro activo
    name,
    department,
    phase,
    ai_category,
    org_readiness,
    opportunity_level,
    opportunities,
    notes
  FROM public.value_streams
  WHERE engagement_id = p_engagement_id;

  -- ── Retornar el ID del snapshot creado ───────────────────────
  RETURN v_snapshot_id;

END;
$$;

-- Revocar ejecución pública y otorgar solo a usuarios autenticados
REVOKE EXECUTE ON FUNCTION public.create_snapshot FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_snapshot TO authenticated;


-- FIN DE MIGRACION 002
-- Verificacion rapida (ejecutar por separado en nueva query):
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('snapshots','t1_score_snapshots','stakeholder_snapshots','value_stream_snapshots')
--   ORDER BY table_name;
--   Debe devolver 4 filas.
--
--   SELECT routine_name FROM information_schema.routines
--   WHERE routine_schema = 'public' AND routine_name = 'create_snapshot';
--   Debe devolver 1 fila.


-- ========== 003_t1_multiinterviewee.sql ==========
-- Original source: 003_t1_multiinterviewee.sql

-- ============================================================
-- 003_t1_multiinterviewee.sql
--
-- Amplía t1_dimension_scores para soportar múltiples
-- entrevistados por engagement (multi-interviewee T1).
--
-- Problema original: UNIQUE (engagement_id, dimension_code,
-- subdimension_code) — sin interviewee_id, lo que impide
-- guardar scores distintos por entrevistado.
--
-- Cambios:
--   1. Eliminar UNIQUE constraint actual (sin interviewee_id)
--   2. Añadir columna interviewee_type ('it' | 'business')
--   3. Nueva UNIQUE constraint incluyendo interviewee_id
--
-- ⚠ INSTRUCCIONES PARA CARLOS:
--   Supabase Dashboard → SQL Editor → pegar este script → Run
-- ============================================================

-- 1. Eliminar la constraint UNIQUE que bloquea múltiples entrevistados
ALTER TABLE public.t1_dimension_scores
  DROP CONSTRAINT IF EXISTS
    t1_dimension_scores_engagement_id_dimension_code_subdimension_code_key;

-- 2. Añadir columna interviewee_type si no existe
ALTER TABLE public.t1_dimension_scores
  ADD COLUMN IF NOT EXISTS interviewee_type text NOT NULL DEFAULT 'business'
  CHECK (interviewee_type IN ('it', 'business'));

-- 3. Nueva UNIQUE constraint que incluye interviewee_id
--    NULLS NOT DISTINCT: dos filas con interviewee_id=NULL se consideran
--    iguales → soporta el caso "score global sin entrevistado específico".
ALTER TABLE public.t1_dimension_scores
  ADD CONSTRAINT t1_scores_unique_per_interviewee
  UNIQUE NULLS NOT DISTINCT
    (engagement_id, dimension_code, subdimension_code, interviewee_id);

-- Verificación: debe devolver la nueva constraint
SELECT conname, contype
  FROM pg_constraint
 WHERE conrelid = 'public.t1_dimension_scores'::regclass
   AND contype = 'u';


-- ========== 004_companies_and_rename.sql ==========
-- Original source: 004_companies_and_rename.sql

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

-- ============================================================
-- INCREMENTAL CONTINUITY BLOCK
-- When the Supabase CLI applies migrations sequentially after
-- 001–003, this block renames the engagements→projects schema
-- and drops the 002 snapshot subsystem (replaced here by a
-- simpler JSONB-based snapshots table).
-- All DO blocks are idempotent — safe on fresh and repeated runs.
-- ============================================================

-- 1. Drop 002 snapshot subsystem (schema is incompatible with PASO 13 below)
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.create_snapshot(uuid, text, text, uuid, text);
  DROP TABLE IF EXISTS public.value_stream_snapshots;
  DROP TABLE IF EXISTS public.stakeholder_snapshots;
  DROP TABLE IF EXISTS public.t1_score_snapshots;
  DROP TABLE IF EXISTS public.snapshots;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Drop old RLS policies (recreated below with project_id semantics)
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_select_own"       ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own"       ON public.profiles;
  DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='engagements') THEN
    DROP POLICY IF EXISTS "engagements_select_member" ON public.engagements;
    DROP POLICY IF EXISTS "engagements_insert_auth"   ON public.engagements;
    DROP POLICY IF EXISTS "engagements_update_owner"  ON public.engagements;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='engagement_members') THEN
    DROP POLICY IF EXISTS "engagement_members_select" ON public.engagement_members;
    DROP POLICY IF EXISTS "engagement_members_write"  ON public.engagement_members;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "company_profiles_select" ON public.company_profiles;
  DROP POLICY IF EXISTS "company_profiles_write"  ON public.company_profiles;
  DROP POLICY IF EXISTS "frictions_select"        ON public.frictions;
  DROP POLICY IF EXISTS "frictions_write"         ON public.frictions;
  DROP POLICY IF EXISTS "t1_select"               ON public.t1_dimension_scores;
  DROP POLICY IF EXISTS "t1_write"                ON public.t1_dimension_scores;
  DROP POLICY IF EXISTS "stakeholders_select"     ON public.stakeholders;
  DROP POLICY IF EXISTS "stakeholders_write"      ON public.stakeholders;
  DROP POLICY IF EXISTS "value_streams_select"    ON public.value_streams;
  DROP POLICY IF EXISTS "value_streams_write"     ON public.value_streams;
  DROP POLICY IF EXISTS "use_cases_select"        ON public.use_cases;
  DROP POLICY IF EXISTS "use_cases_write"         ON public.use_cases;
  DROP POLICY IF EXISTS "t5_canvas_select"        ON public.t5_canvas;
  DROP POLICY IF EXISTS "t5_canvas_write"         ON public.t5_canvas;
  DROP POLICY IF EXISTS "iso42001_select"         ON public.iso42001_controls;
  DROP POLICY IF EXISTS "iso42001_write"          ON public.iso42001_controls;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Drop old helper functions (recreated below)
DROP FUNCTION IF EXISTS public.is_engagement_member(uuid);
DROP FUNCTION IF EXISTS public.can_write_engagement(uuid);
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 4. Rename engagements → projects
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='engagements')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='projects')
  THEN
    ALTER TABLE public.engagements RENAME TO projects;
  END IF;
END $$;

-- 5. Rename engagement_members → project_members
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='engagement_members')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='project_members')
  THEN
    ALTER TABLE public.engagement_members RENAME TO project_members;
  END IF;
END $$;

-- 6. Rename engagement_id → project_id in all child tables
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_members' AND column_name='engagement_id') THEN
    ALTER TABLE public.project_members RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='company_profiles' AND column_name='engagement_id') THEN
    ALTER TABLE public.company_profiles RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='company_profiles' AND column_name='engagement_name') THEN
    ALTER TABLE public.company_profiles RENAME COLUMN engagement_name TO project_name;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='frictions' AND column_name='engagement_id') THEN
    ALTER TABLE public.frictions RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='t1_dimension_scores' AND column_name='engagement_id') THEN
    -- Drop constraint from migration 003 (references old column name)
    ALTER TABLE public.t1_dimension_scores DROP CONSTRAINT IF EXISTS t1_scores_unique_per_interviewee;
    -- Drop original inline UNIQUE from migration 001 (3-col, no interviewee_id).
    -- PostgreSQL truncates the auto-generated name to 63 chars, so the actual
    -- stored name differs from the full identifier used at CREATE TABLE time.
    ALTER TABLE public.t1_dimension_scores
      DROP CONSTRAINT IF EXISTS "t1_dimension_scores_engagement_id_dimension_code_subdimensi_key";
    ALTER TABLE public.t1_dimension_scores RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stakeholders' AND column_name='engagement_id') THEN
    ALTER TABLE public.stakeholders RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='value_streams' AND column_name='engagement_id') THEN
    ALTER TABLE public.value_streams RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='use_cases' AND column_name='engagement_id') THEN
    ALTER TABLE public.use_cases RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='t5_canvas' AND column_name='engagement_id') THEN
    ALTER TABLE public.t5_canvas RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='iso42001_controls' AND column_name='engagement_id') THEN
    ALTER TABLE public.iso42001_controls RENAME COLUMN engagement_id TO project_id;
  END IF;
END $$;

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
-- Add company_id when profiles was created by migration 001 (which lacked it)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

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
-- Add company_id when projects was renamed from engagements (which lacked it)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);


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


-- ========== 005_company_wide_access.sql ==========
-- Original source: 005_company_wide_access.sql

-- ============================================================
-- GOBY — Migración 005: Acceso por empresa + roles editor/viewer
--
-- Cambios:
--   A. Nueva función is_company_project(pid) — acceso READ por empresa
--   B. Actualiza can_write_project() — añade check owner_id
--   C. Reemplaza RLS de SELECT en todas las tablas:
--      antes: is_project_member(id)
--      ahora: is_company_project(id) — toda la empresa puede leer
--   D. WRITE sigue protegido: solo owner del proyecto o admin
--   E. Profiles: añade 'editor' como rol válido (alias de consultant)
--
-- Ejecutar en:
--   1. lean-ai-pro (staging/piloto)
--   2. gobytech-prod (producción)
-- ============================================================


-- ── A. Nueva función: acceso de lectura por empresa ──────────

CREATE OR REPLACE FUNCTION public.is_company_project(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.projects  p
    JOIN   public.profiles  pr ON pr.company_id = p.company_id
    WHERE  p.id             = pid
      AND  pr.id            = auth.uid()
      AND  p.company_id     IS NOT NULL
  );
$$;


-- ── B. Actualizar can_write_project: añadir check owner ──────

CREATE OR REPLACE FUNCTION public.can_write_project(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    -- Creador del proyecto siempre puede escribir
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE  id = pid AND owner_id = auth.uid()
    )
    OR
    -- Consultor asignado explícitamente puede escribir
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE  project_id = pid
        AND  user_id    = auth.uid()
        AND  role       = 'consultant'
    )
    OR
    -- Platform admin puede escribir todo
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE  id = auth.uid() AND role = 'admin'
    );
$$;


-- ── C. Actualizar RLS SELECT — acceso por empresa ────────────
-- Patrón: is_company_project(project_id) OR is_platform_admin()
-- Esto reemplaza is_project_member(project_id) en todos los SELECTs


-- projects
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.is_company_project(id)
    OR public.is_project_member(id)   -- fallback: proyectos sin empresa
    OR public.is_platform_admin()
  );


-- company_profiles
DROP POLICY IF EXISTS "company_profiles_select" ON public.company_profiles;
CREATE POLICY "company_profiles_select" ON public.company_profiles
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- frictions
DROP POLICY IF EXISTS "frictions_select" ON public.frictions;
CREATE POLICY "frictions_select" ON public.frictions
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- t1_dimension_scores
DROP POLICY IF EXISTS "t1_select" ON public.t1_dimension_scores;
CREATE POLICY "t1_select" ON public.t1_dimension_scores
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- stakeholders
DROP POLICY IF EXISTS "stakeholders_select" ON public.stakeholders;
CREATE POLICY "stakeholders_select" ON public.stakeholders
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- value_streams
DROP POLICY IF EXISTS "value_streams_select" ON public.value_streams;
CREATE POLICY "value_streams_select" ON public.value_streams
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- use_cases
DROP POLICY IF EXISTS "use_cases_select" ON public.use_cases;
CREATE POLICY "use_cases_select" ON public.use_cases
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- t5_canvas
DROP POLICY IF EXISTS "t5_canvas_select" ON public.t5_canvas;
CREATE POLICY "t5_canvas_select" ON public.t5_canvas
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- iso42001_controls
DROP POLICY IF EXISTS "iso42001_select" ON public.iso42001_controls;
CREATE POLICY "iso42001_select" ON public.iso42001_controls
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- snapshots
DROP POLICY IF EXISTS "snapshots_select" ON public.snapshots;
CREATE POLICY "snapshots_select" ON public.snapshots
  FOR SELECT USING (
    public.is_company_project(project_id)
    OR public.is_project_member(project_id)
    OR public.is_platform_admin()
  );


-- ── D. Perfiles: ampliar CHECK para aceptar 'editor' ─────────
-- 'editor' = futuro nombre de 'consultant'
-- Ambos coexisten durante la transición

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'consultant', 'editor', 'viewer'));


-- ── Verificación final ────────────────────────────────────────
SELECT routine_name
FROM   information_schema.routines
WHERE  routine_schema = 'public'
  AND  routine_name IN (
    'is_company_project',
    'can_write_project',
    'is_project_member',
    'is_platform_admin'
  )
ORDER BY routine_name;


-- ========== 006_performance_indexes.sql ==========
-- Original source: 006_performance_indexes.sql

-- ============================================================
-- 006_performance_indexes.sql
--
-- Índices de rendimiento adicionales.
--
-- Problema: la función is_project_member(pid) ejecuta
--   SELECT 1 FROM project_members WHERE project_id = pid AND user_id = auth.uid()
-- Esta query usa los índices separados idx_project_members_proj y
-- idx_project_members_user, pero un índice compuesto es más eficiente
-- porque resuelve ambas condiciones en una sola pasada de índice.
--
-- Impacto: la política RLS de t1_dimension_scores se evalúa potencialmente
-- por cada fila devuelta. Con un índice compuesto (project_id, user_id),
-- la comprobación de membresía es O(log n) con una sola pasada.
--
-- INSTRUCCIONES PARA CARLOS:
--   Supabase Dashboard → SQL Editor → pegar este script → Run
-- ============================================================

-- Índice compuesto en project_members para acelerar is_project_member()
CREATE INDEX IF NOT EXISTS idx_project_members_proj_user
  ON public.project_members(project_id, user_id);

-- Índice compuesto en t1_dimension_scores para acelerar SELECT + ORDER
-- (aunque hemos eliminado el ORDER BY del código, este índice ayuda
-- con cualquier query que filtre por project_id e interviewee_id)
CREATE INDEX IF NOT EXISTS idx_t1_scores_proj_interviewee
  ON public.t1_dimension_scores(project_id, interviewee_id);

-- Mismo patrón para stakeholders (T2) — mismo tipo de RLS overhead
CREATE INDEX IF NOT EXISTS idx_stakeholders_proj_id
  ON public.stakeholders(project_id, id);

-- Verificación: listar los nuevos índices
SELECT indexname, indexdef
  FROM pg_indexes
 WHERE tablename IN ('project_members', 't1_dimension_scores', 'stakeholders')
   AND indexname LIKE '%proj%'
 ORDER BY tablename, indexname;


-- ========== 007_stakeholder_unofficial_tools.sql ==========
-- Original source: 007_stakeholder_unofficial_tools.sql

-- ============================================================
-- Migration 007 — Shadow AI: unofficial_tools en stakeholders
--
-- Añade la columna unofficial_tools (text, nullable) a la tabla
-- stakeholders para registrar herramientas externas (IA o digitales)
-- que los stakeholders usan por su cuenta.
--
-- La columna alimenta el indicador "Riesgo de Shadow AI" visible
-- en T6 (Gobernanza) y T10 (Dashboard Principal).
--
-- Compatibilidad: columna nullable, por lo que los registros
-- existentes no se ven afectados. RLS heredada de la tabla.
-- ============================================================

ALTER TABLE stakeholders
  ADD COLUMN IF NOT EXISTS unofficial_tools text DEFAULT NULL;

COMMENT ON COLUMN stakeholders.unofficial_tools IS
  'Shadow AI: herramientas externas (IA o digitales) que el stakeholder usa sin aprobación oficial. Capturado de forma empática durante la entrevista de perfil en T2.';


-- ========== 008_roles_four_tier.sql ==========
-- Original source: 008_roles_four_tier.sql

-- ============================================================
-- Migration 008 — Roles 4-tier
--
-- Reemplaza el sistema de 3 roles (admin/consultant/viewer) por
-- un sistema de 4 roles que separa el equipo Alpha del cliente:
--
--   superadmin    → Alpha platform admin (antes 'admin')
--   consultant    → Consultor Alpha (sin cambio)
--   client_editor → Cliente operativo — edita su empresa
--   client_viewer → Cliente directivo — solo lectura (antes 'viewer')
--
-- Pasos:
--   1. Eliminar CHECK constraint antiguo en profiles.role
--   2. Migrar datos existentes: admin→superadmin, viewer→client_viewer
--   3. Añadir nuevo CHECK constraint con los 4 roles
--   4. Actualizar DEFAULT de profiles.role
--   5. Actualizar is_platform_admin() → chequea 'superadmin'
--   6. Añadir alias is_superadmin() para legibilidad futura
--   7. Actualizar handle_new_user trigger default: viewer→client_viewer
-- ============================================================

-- 1. Eliminar constraint antiguo (IF EXISTS para idempotencia)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Migrar datos existentes
UPDATE public.profiles SET role = 'superadmin'    WHERE role = 'admin';
UPDATE public.profiles SET role = 'client_viewer' WHERE role = 'viewer';

-- 3. Nuevo CHECK con los 4 roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin', 'consultant', 'client_editor', 'client_viewer'));

-- 4. Actualizar DEFAULT
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'client_viewer';

-- 5. Actualizar is_platform_admin() — ahora chequea 'superadmin'
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- 6. Alias semántico (útil para código nuevo)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_admin();
$$;

-- 7. Actualizar trigger handle_new_user para usar 'client_viewer' como default
--    (el trigger completo se recrea para cambiar la línea del COALESCE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

COMMENT ON COLUMN public.profiles.role IS
  'superadmin=Alpha plataforma (acceso global) | consultant=consultor Alpha | client_editor=cliente operativo | client_viewer=cliente solo lectura';


-- ========== 20260527_security_persistence.sql ==========
-- Original source: 20260527_security_persistence.sql

-- ================================================================
-- GOBY — Migración: Seguridad + Persistencia (v1 — DRAFT)
-- Fecha: 2026-05-27
--
-- SUPERSEDED: este archivo era un borrador (tabla company_users incorrecta,
-- nunca ejecutado en producción). Todo el DDL está en la versión canónica:
--   20260527_security_persistence_v3_1.sql
-- ================================================================


-- ========== 20260528_security_persistence.sql ==========
-- Original source: 20260528_security_persistence.sql

-- ================================================================
-- GOBY — Script SQL Maestro v3.1
-- Migración: Seguridad + Persistencia
-- Fecha: 2026-05-27
--
-- CAMBIOS RESPECTO A v3:
--   [1] set_audit_columns(): eliminado COALESCE; valores de auditoría
--       forzados incondicionalmente en INSERT; OLD preservado en UPDATE.
--   [2] user_can_edit_project(): pm.role != 'viewer' reemplazado por
--       whitelist explícita: IN ('owner', 'admin', 'editor', 'consultant').
--   [3] user_has_project_access() NO se elimina. Marcada deprecated.
--       Se eliminará en un sprint posterior tras confirmar ausencia
--       de dependencias en el resto del sistema.
--   [4] Entorno limpio confirmado (v1/v2 nunca ejecutadas).
--       CREATE TABLE IF NOT EXISTS se mantiene sin cambios.
--
-- HISTÓRICO DE VERSIONES:
--   v1 — primer draft (tabla company_users incorrecta, no ejecutada)
--   v2 — schema real verificado, 11 correcciones aplicadas
--   v3 — split read/edit, advisory lock por project+tool, blocked writes,
--        created_by/updated_by en T9, pre-flight cleanup
--   v3.1 — correcciones de auditoría, whitelist roles, deprecación segura
--
-- SCHEMA REAL VERIFICADO (src/types/database.types.ts):
--   ✓ projects        (id uuid, company_id uuid, owner_id uuid, ...)
--   ✓ project_members (project_id uuid, user_id uuid, role text)
--       MemberRole con permiso de edición: 'owner', 'admin', 'editor', 'consultant'
--       MemberRole de solo lectura: 'viewer' (excluido de user_can_edit_project)
--   ✓ profiles        (id uuid, email, name, role UserRole, company_id uuid)
--       UserRole con permiso de edición: 'client_editor'
--       UserRole de solo lectura: 'client_viewer' (excluido de user_can_edit_project)
--   ✓ is_project_member(pid) ya existe (no se modifica)
--   ✓ t5_canvas, iso42001_controls → deprecated; migración de stores = sprint siguiente
--
-- NOTA SOBRE SECURITY DEFINER y RLS:
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
--   D.  Pre-flight cleanup      DROP políticas dependientes de versiones anteriores
--       NOTA: user_has_project_access() NO se elimina (marcada deprecated).
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
--
-- INSERT: fuerza TODOS los campos de auditoría.
--   No se respetan valores enviados por el cliente en created_at, updated_at,
--   created_by ni updated_by. La fuente de verdad es siempre el servidor.
--
-- UPDATE: preserva created_at y created_by del registro original (OLD).
--   Actualiza updated_at y updated_by con el momento y usuario actuales.
--   Esto garantiza que ningún UPDATE puede modificar la autoría original.

CREATE OR REPLACE FUNCTION public.set_audit_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Forzado incondicional: el cliente nunca controla estos valores
    NEW.created_at := now();
    NEW.updated_at := now();
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();

  ELSIF TG_OP = 'UPDATE' THEN
    -- Preservar autoría y timestamp originales: inmutables tras INSERT
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
    -- Actualizar con el usuario y momento actuales
    NEW.updated_at := now();
    NEW.updated_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_audit_columns IS
  'Trigger para t9_overrides y t9_free_items. '
  'INSERT: fuerza created_at/updated_at/created_by/updated_by; el cliente no los controla. '
  'UPDATE: preserva OLD.created_at y OLD.created_by; actualiza updated_at y updated_by.';


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
-- created_by / updated_by gestionados por trigger set_audit_columns():
--   el cliente nunca controla estos campos; el servidor los fuerza.

-- ── t9_overrides ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.t9_overrides (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  use_case_id   text        NOT NULL,
  roadmap_year  smallint    NOT NULL DEFAULT EXTRACT(YEAR FROM now())::smallint,
  start_month   smallint    NOT NULL CHECK (start_month BETWEEN 0 AND 11),
  end_month     smallint    NOT NULL CHECK (end_month   BETWEEN 0 AND 11),
  responsible   text        NOT NULL DEFAULT '',

  -- Auditoría completa (gestionada por trigger set_audit_columns)
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
COMMENT ON COLUMN public.t9_overrides.created_by   IS 'Usuario que creó el override. Forzado por trigger; el cliente no lo controla.';
COMMENT ON COLUMN public.t9_overrides.updated_by   IS 'Último usuario que modificó el override. Forzado por trigger.';

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

  -- Auditoría completa (gestionada por trigger set_audit_columns)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT t9_free_items_end_gte_start CHECK (end_month >= start_month),
  CONSTRAINT t9_free_items_year_range    CHECK (roadmap_year BETWEEN 2020 AND 2099)
);

COMMENT ON TABLE  public.t9_free_items              IS 'Iniciativas libres del Gantt T9. No provienen de T4. Por año de roadmap.';
COMMENT ON COLUMN public.t9_free_items.roadmap_year IS 'Año del roadmap al que pertenece el item libre.';
COMMENT ON COLUMN public.t9_free_items.created_by   IS 'Usuario que creó el item libre. Forzado por trigger; el cliente no lo controla.';
COMMENT ON COLUMN public.t9_free_items.updated_by   IS 'Último usuario que modificó el item libre. Forzado por trigger.';

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
-- PROPÓSITO: eliminar políticas de versiones anteriores (v1/v2/v3)
-- antes de recrearlas con los helpers correctos.
-- Idempotente: DROP POLICY IF EXISTS es seguro en entorno limpio.
--
-- IMPORTANTE: user_has_project_access() NO se elimina en esta versión.
-- Se marca deprecated y se eliminará en un sprint posterior, una vez
-- confirmado que no tiene dependencias en otras partes del sistema
-- (triggers, views, funciones externas no rastreadas en este migration).

-- tool_outputs
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

-- DEPRECATED (no se elimina):
-- user_has_project_access() se mantiene si existe en el sistema.
-- No se usa en ninguna política nueva de este script.
-- Para eliminarla en el futuro:
--   1. Confirmar con grep/search que no tiene dependencias activas
--   2. Ejecutar: DROP FUNCTION IF EXISTS public.user_has_project_access(uuid);


-- ================================================================
-- E. HELPERS DE ACCESO
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
--   user_can_edit_project:  project_members IN ('owner','admin','editor','consultant')
--                           + client_editor únicamente
--                           → 'viewer' y client_viewer quedan excluidos de escritura
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
--
-- Whitelist explícita de roles de edición en project_members:
--   'owner'      → propietario del proyecto (máximo privilegio)
--   'admin'      → administrador del proyecto
--   'editor'     → editor con permiso de escritura
--   'consultant' → consultor Alpha asignado al proyecto
--
-- Excluidos de escritura:
--   'viewer'        → rol de solo lectura en project_members
--   'client_viewer' → rol de solo lectura en profiles

CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Patrón 1: miembros del proyecto con rol de edición (whitelist explícita)
    SELECT 1
    FROM   public.project_members pm
    WHERE  pm.project_id = p_project_id
      AND  pm.user_id    = auth.uid()
      AND  pm.role IN ('owner', 'admin', 'editor', 'consultant')

    UNION ALL

    -- Patrón 2: usuarios cliente con rol editor únicamente
    -- client_viewer queda excluido: no tiene permiso de escritura
    SELECT 1
    FROM   public.projects  p
    JOIN   public.profiles  pr ON pr.company_id = p.company_id
    WHERE  p.id  = p_project_id
      AND  pr.id = auth.uid()
      AND  pr.role = 'client_editor'
  )
$$;

COMMENT ON FUNCTION public.user_can_edit_project IS
  'Acceso de escritura: project_members IN (owner, admin, editor, consultant) + client_editor. '
  'Excluidos: viewer (project_members) y client_viewer (profiles). '
  'STABLE → cacheado por transacción. Base de políticas INSERT/UPDATE/DELETE y save_tool_output().';


-- ================================================================
-- F. RPC TRANSACCIONAL — save_tool_output()
-- ================================================================
--
-- ÚNICO punto de escritura en tool_outputs desde frontend y Edge Function.
--
-- Verifica user_can_edit_project (no user_has_project_access):
--   viewers y client_viewers no pueden guardar outputs.
--
-- Advisory lock granular por project_id + tool_code:
--   hashtext(p_project_id::text || ':' || p_tool_code)::bigint
--   → dos saves de tools distintas en el mismo proyecto no se bloquean entre sí.
--
-- CICLOS DE VIDA:
--   Interactivo (t5_canvas, t12_iso): UPDATE in-place.
--   LLM (t6_policy, t7_plan, t8_comms): archiva anterior + inserta nuevo.
--
-- SECURITY DEFINER (owner = postgres → bypassrls):
--   Puede archivar registros (archived=true) sin policy UPDATE que lo permita.
--   La policy de UPDATE de authenticated no existe → es el único camino de escritura.

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
  -- Whitelist: owner, admin, editor, consultant, client_editor.
  -- client_viewer y viewer no pueden guardar outputs.
  IF NOT public.user_can_edit_project(p_project_id) THEN
    RAISE EXCEPTION 'save_tool_output: acceso de escritura denegado al proyecto %', p_project_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- ── 4. Advisory lock por project_id + tool_code ─────────────
  -- Serializa escrituras concurrentes sobre el mismo (proyecto, herramienta).
  -- Saves de tools distintas en el mismo proyecto no se bloquean entre sí.
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
  'Verifica user_can_edit_project (whitelist explícita; excluye viewers). '
  'Advisory lock por project_id+tool_code para serializar concurrencia. '
  'SECURITY DEFINER → bypassrls → escribe aunque no existan policies INSERT/UPDATE para authenticated.';


-- ================================================================
-- G. GRANTS Y REVOKE — permisos de funciones
-- ================================================================
--
-- Mínimo privilegio:
--   check_and_log_ai_call    → solo service_role
--   user_can_read_project    → authenticated + service_role
--   user_can_edit_project    → authenticated + service_role
--   save_tool_output         → solo authenticated
--   set_updated_at           → trigger interno, sin acceso directo
--   set_audit_columns        → trigger interno, sin acceso directo
--
-- user_has_project_access (deprecated): si existe, sus grants actuales
-- no se modifican aquí. Se gestionarán cuando se elimine la función.

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
REVOKE ALL    ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) FROM PUBLIC;
REVOKE ALL    ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) FROM anon;
GRANT  EXECUTE ON FUNCTION public.save_tool_output(uuid, text, jsonb, timestamptz, int) TO authenticated;

-- ── set_updated_at + set_audit_columns ───────────────────────
REVOKE ALL ON FUNCTION public.set_updated_at()    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at()    FROM anon;
REVOKE ALL ON FUNCTION public.set_updated_at()    FROM authenticated;
REVOKE ALL ON FUNCTION public.set_audit_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_audit_columns() FROM anon;
REVOKE ALL ON FUNCTION public.set_audit_columns() FROM authenticated;


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
--   DELETE  → user_can_edit_project (viewers no pueden borrar)


-- ── tool_outputs ──────────────────────────────────────────────
-- (DROP POLICY ejecutados en Sección D)

CREATE POLICY "tool_outputs_select"
  ON public.tool_outputs
  FOR SELECT
  TO authenticated
  USING (public.user_can_read_project(project_id));

-- Sin policy INSERT ni UPDATE para authenticated:
--   → escritura directa bloqueada por RLS
--   → save_tool_output() (SECURITY DEFINER → bypassrls) es el único camino

CREATE POLICY "tool_outputs_no_delete"
  ON public.tool_outputs
  FOR DELETE
  TO authenticated
  USING (false);


-- ── t9_overrides ──────────────────────────────────────────────
-- (DROP POLICY ejecutados en Sección D)

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

CREATE POLICY "t9_overrides_delete"
  ON public.t9_overrides
  FOR DELETE
  TO authenticated
  USING (public.user_can_edit_project(project_id));


-- ── t9_free_items ─────────────────────────────────────────────
-- (DROP POLICY ejecutados en Sección D)

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
--
-- PASO 3 — Validar acceso al proyecto via RLS (user-scoped client)
--   const { data: project, error: projError } = await supabaseUser
--     .from('projects').select('id').eq('id', projectId).single()
--   if (projError || !project) return 403
--   // RLS projects usa user_can_read_project implícitamente (política existente)
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
-- PASO 6 — Guardar output (user-scoped client → save_tool_output verifica user_can_edit_project)
--   const { data: savedId } = await supabaseUser
--     .rpc('save_tool_output', {
--       p_project_id:      projectId,
--       p_tool_code:       toolCode,
--       p_payload:         result,
--       p_stale_after:     new Date(Date.now() + 90*24*60*60*1000).toISOString(),
--       p_payload_version: 1
--     })
--   // Si el usuario es client_viewer o viewer, save_tool_output devuelve
--   // error 'insufficient_privilege' aquí (DESPUÉS de consumir tokens de Claude).
--   // → Recomendación: verificar user_can_edit_project explícitamente en Paso 3
--   //   para detectar esta condición ANTES de llamar a la API.


-- ================================================================
-- ÍNDICE DE OBJETOS CREADOS / MODIFICADOS
-- ================================================================
--
-- FUNCIONES NUEVAS:
--   public.user_can_read_project(uuid)                    → authenticated + service_role
--   public.user_can_edit_project(uuid)                    → authenticated + service_role
--   public.set_audit_columns()                            → trigger interno (t9 tables)
--
-- FUNCIONES MANTENIDAS:
--   public.set_updated_at()                               → trigger interno
--   public.check_and_log_ai_call(uuid, uuid, text)        → service_role only
--   public.save_tool_output(uuid, text, jsonb, ts, int)   → authenticated only
--
-- FUNCIÓN DEPRECATED (NO ELIMINADA):
--   public.user_has_project_access(uuid)
--   → No se usa en ninguna policy nueva.
--   → Eliminar en sprint posterior tras confirmar ausencia de dependencias.
--   → Comando futuro: DROP FUNCTION IF EXISTS public.user_has_project_access(uuid);
--
-- TABLAS CREADAS (IF NOT EXISTS):
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
-- RLS TOOL_OUTPUTS:
--   ✓ SELECT     → user_can_read_project
--   ✗ INSERT     → SIN POLÍTICA (bloqueado para authenticated)
--   ✗ UPDATE     → SIN POLÍTICA (bloqueado para authenticated)
--   ✓ DELETE     → USING(false)
--
-- RLS T9_OVERRIDES / T9_FREE_ITEMS:
--   ✓ SELECT     → user_can_read_project
--   ✓ INSERT     → user_can_edit_project
--   ✓ UPDATE     → user_can_edit_project
--   ✓ DELETE     → user_can_edit_project
-- ================================================================


-- ========== 20260601_schema_drift_sprint10.sql ==========
-- Original source: 20260601_schema_drift_sprint10.sql

-- ================================================================
-- GOBY — Migration 20260601_schema_drift_sprint10 v3
--
-- PROPÓSITO:
--   Formaliza el schema drift de Sprint 10: columnas y tablas que
--   existen en database.types.ts pero carecían de migration SQL.
--
-- IDEMPOTENTE: todos los cambios usan IF NOT EXISTS / DO+IF.
--   Puede ejecutarse en lean_ai_pro (staging) o en gobytech_pro
--   antes o dentro del SQL maestro, sin romper datos existentes.
--
-- NO DESTRUCTIVO: no elimina columnas, tablas ni datos.
--
-- ITEMS DE DRIFT FORMALIZADOS:
--   1. companies.sector                           — text NOT NULL DEFAULT ''
--   2. companies.company_size                     — text NOT NULL DEFAULT ''
--   3. company_departments                        — tabla nueva con FK → companies
--   4. t1_dimension_scores.interviewee_department — text nullable
--
-- ESTÁNDAR DE UUID:
--   Este proyecto usa CREATE EXTENSION "uuid-ossp" por compatibilidad,
--   y gen_random_uuid() como DEFAULT (disponible desde pg13 sin extensión).
--   Patrón consistente con migrations 001–008 y v3.1.
--
-- CAMBIOS v2 vs v1:
--   [1] Precheck de dependencias: aborta si no existen las tablas
--       y funciones de las que depende este script.
--   [2] Estándar UUID: CREATE EXTENSION IF NOT EXISTS "uuid-ossp" + gen_random_uuid()
--   [3] RLS: TO authenticated en todas las policies de company_departments.
--       UPDATE incluye WITH CHECK explícito contra cambio de company_id.
--   [4] Log veraz de creación: DO$$ comprueba si la tabla existía antes
--       del CREATE IF NOT EXISTS y lanza NOTICE diferenciado.
--   [5] company_departments.updated_at + trigger set_updated_at().
-- CAMBIOS v3 vs v2:
--   [6] Precheck usa to_regprocedure() — más robusto que information_schema.routines.
--       Comprueba: is_platform_admin(), set_updated_at(), gen_random_uuid().
--   [7] INSERT/UPDATE en company_departments: solo 'superadmin' y 'consultant'.
--       'client_editor' eliminado de escritura — solo SELECT sobre su empresa.
-- ================================================================


-- ================================================================
-- EXTENSIÓN (estándar del proyecto)
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
-- PRECHECK DE DEPENDENCIAS — aborta si faltan
-- ================================================================
-- Este script depende de objetos creados por migrations anteriores.
-- Si no existen, algo en el orden de ejecución está mal.

DO $$
DECLARE
  v_missing text := '';
BEGIN
  -- Tabla: companies (item 1 y 2 requieren ADD COLUMN en esta tabla)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) THEN
    v_missing := v_missing || E'\n  — tabla public.companies no existe (requiere migration 004)';
  END IF;

  -- Tabla: t1_dimension_scores (item 4 requiere ADD COLUMN en esta tabla)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 't1_dimension_scores'
  ) THEN
    v_missing := v_missing || E'\n  — tabla public.t1_dimension_scores no existe (requiere migration 004)';
  END IF;

  -- Tabla: profiles (las policies de company_departments referencian profiles.company_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    v_missing := v_missing || E'\n  — tabla public.profiles no existe (requiere migration 004)';
  END IF;

  -- Función: is_platform_admin() — usada en policies de company_departments
  -- to_regprocedure() es más robusto que information_schema.routines:
  -- resuelve la función por firma completa y devuelve NULL si no existe,
  -- sin depender de permisos sobre vistas del catálogo.
  IF to_regprocedure('public.is_platform_admin()') IS NULL THEN
    v_missing := v_missing || E'\n  — función public.is_platform_admin() no existe (requiere migration 008 o v3.1)';
  END IF;

  -- Función: set_updated_at() — usada en el trigger de company_departments
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    v_missing := v_missing || E'\n  — función public.set_updated_at() no existe (requiere migration v3.1)';
  END IF;

  -- Función: gen_random_uuid() — usada como DEFAULT en company_departments.id
  -- Disponible desde pg13 sin extensión, pero verificamos explícitamente.
  IF to_regprocedure('gen_random_uuid()') IS NULL THEN
    v_missing := v_missing || E'\n  — función gen_random_uuid() no disponible (requiere PostgreSQL 13+ o pgcrypto)';
  END IF;

  IF v_missing <> '' THEN
    RAISE EXCEPTION
      E'[PRECHECK FAIL] Dependencias faltantes antes de ejecutar esta migration:%\n'
      'Ejecuta primero las migrations previas y vuelve a intentarlo.',
      v_missing;
  END IF;

  RAISE NOTICE '[PRECHECK OK] Todas las dependencias verificadas';
END $$;


-- ================================================================
-- ÍTEM 1 — companies.sector
-- ================================================================
-- En migration 004, companies se crea con: id, name, slug, created_at.
-- database.types.ts: CompanyRow.sector: string (NOT NULL).
-- Se añade como NOT NULL DEFAULT '' para no romper filas existentes.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'companies'
      AND column_name  = 'sector'
  ) THEN
    ALTER TABLE public.companies
      ADD COLUMN sector text NOT NULL DEFAULT '';

    COMMENT ON COLUMN public.companies.sector IS
      '[Sprint 10] Sector de la empresa. Drift formalizado: existía en types sin migration.';

    RAISE NOTICE '[DRIFT OK] companies.sector añadida';
  ELSE
    RAISE NOTICE '[DRIFT SKIP] companies.sector ya existía — sin cambios';
  END IF;
END $$;


-- ================================================================
-- ÍTEM 2 — companies.company_size
-- ================================================================
-- En migration 004, companies no tiene esta columna.
-- database.types.ts: CompanyRow.company_size: string (NOT NULL).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'companies'
      AND column_name  = 'company_size'
  ) THEN
    ALTER TABLE public.companies
      ADD COLUMN company_size text NOT NULL DEFAULT '';

    COMMENT ON COLUMN public.companies.company_size IS
      '[Sprint 10] Tamaño de empresa. Drift formalizado: existía en types sin migration.';

    RAISE NOTICE '[DRIFT OK] companies.company_size añadida';
  ELSE
    RAISE NOTICE '[DRIFT SKIP] companies.company_size ya existía — sin cambios';
  END IF;
END $$;


-- ================================================================
-- ÍTEM 3 — company_departments (tabla nueva)
-- ================================================================
-- database.types.ts: CompanyDepartmentRow { id, company_id, name, color, created_at }
-- No existe en ninguna migration anterior.
--
-- v2 añade:
--   — updated_at + trigger set_updated_at()
--   — TO authenticated en todas las policies
--   — WITH CHECK en UPDATE para impedir cambio de company_id

DO $$
DECLARE
  v_table_existed boolean;
BEGIN
  -- Capturar estado ANTES de la creación
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_departments'
  ) INTO v_table_existed;

  IF v_table_existed THEN
    RAISE NOTICE '[DRIFT SKIP] company_departments ya existía — CREATE IF NOT EXISTS no modifica nada';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.company_departments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        NOT NULL DEFAULT '#6B7280',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  v_table_exists_now boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_departments'
  ) INTO v_table_exists_now;

  IF v_table_exists_now THEN
    -- Distinguimos: si llegamos aquí tras el SKIP de arriba, ya lo sabemos.
    -- Si llegamos aquí sin haber imprimido SKIP, la tabla es nueva.
    RAISE NOTICE '[DRIFT OK] company_departments creada (o ya existía — ver NOTICE anterior)';
  ELSE
    RAISE EXCEPTION '[DRIFT FAIL] company_departments no fue creada. Revisar permisos o schema.';
  END IF;
END $$;

COMMENT ON TABLE public.company_departments IS
  '[Sprint 10] Departamentos de empresa para etiquetado de T1 interviewees. '
  'Formaliza drift entre database.types.ts y migrations 001–008.';


-- ── updated_at: añadir si falta (caso tabla preexistente sin ella) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'company_departments'
      AND column_name  = 'updated_at'
  ) THEN
    ALTER TABLE public.company_departments
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    RAISE NOTICE '[DRIFT OK] company_departments.updated_at añadida (tabla preexistente)';
  ELSE
    RAISE NOTICE '[DRIFT SKIP] company_departments.updated_at ya existía';
  END IF;
END $$;


-- ── Trigger set_updated_at ─────────────────────────────────────
-- DROP IF EXISTS primero para garantizar idempotencia aunque la firma cambie.
DROP TRIGGER IF EXISTS trg_company_departments_updated_at ON public.company_departments;

CREATE TRIGGER trg_company_departments_updated_at
  BEFORE UPDATE ON public.company_departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── Índice ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_company_departments_company
  ON public.company_departments(company_id);


-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;


-- ── Policies — limpieza previa para idempotencia ───────────────
DROP POLICY IF EXISTS "company_departments_select"      ON public.company_departments;
DROP POLICY IF EXISTS "company_departments_insert"      ON public.company_departments;
DROP POLICY IF EXISTS "company_departments_update"      ON public.company_departments;
DROP POLICY IF EXISTS "company_departments_delete"      ON public.company_departments;
DROP POLICY IF EXISTS "company_departments_admin_write" ON public.company_departments;


-- SELECT: superadmin ve todo; usuarios ven los depts de su empresa
CREATE POLICY "company_departments_select"
  ON public.company_departments
  FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id         = auth.uid()
        AND p.company_id = company_departments.company_id
    )
  );

-- INSERT: solo superadmin y consultant pueden crear departamentos.
-- client_editor y client_viewer no tienen este permiso — la estructura
-- de departamentos es responsabilidad del consultor Alpha, no del cliente.
CREATE POLICY "company_departments_insert"
  ON public.company_departments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id         = auth.uid()
        AND p.company_id = company_departments.company_id
        AND p.role       IN ('superadmin', 'consultant')
    )
  );

-- UPDATE: solo superadmin y consultant pueden modificar departamentos.
-- USING: verifica acceso a la fila actual (OLD).
-- WITH CHECK: verifica la fila resultante (NEW) — impide reasignar el
-- company_id a una empresa distinta incluso con permiso sobre la original.
CREATE POLICY "company_departments_update"
  ON public.company_departments
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id         = auth.uid()
        AND p.company_id = company_departments.company_id
        AND p.role       IN ('superadmin', 'consultant')
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id         = auth.uid()
        -- WITH CHECK evalúa la fila NEW: si company_id cambió,
        -- el nuevo valor debe seguir perteneciendo a la empresa del usuario.
        AND p.company_id = company_departments.company_id
        AND p.role       IN ('superadmin', 'consultant')
    )
  );

-- DELETE: solo superadmin y consultant de la empresa
CREATE POLICY "company_departments_delete"
  ON public.company_departments
  FOR DELETE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id         = auth.uid()
        AND p.company_id = company_departments.company_id
        AND p.role       IN ('superadmin', 'consultant')
    )
  );

DO $$
BEGIN
  RAISE NOTICE '[DRIFT OK] company_departments: RLS + 4 policies (TO authenticated) + trigger + índice';
END $$;


-- ================================================================
-- ÍTEM 4 — t1_dimension_scores.interviewee_department
-- ================================================================
-- En migration 004, t1_dimension_scores se crea sin esta columna.
-- database.types.ts: T1DimensionScoreRow.interviewee_department: string | null
-- Nullable: sin riesgo de rotura en filas existentes.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 't1_dimension_scores'
      AND column_name  = 'interviewee_department'
  ) THEN
    ALTER TABLE public.t1_dimension_scores
      ADD COLUMN interviewee_department text DEFAULT NULL;

    COMMENT ON COLUMN public.t1_dimension_scores.interviewee_department IS
      '[Sprint 10] Departamento del entrevistado. Nullable. '
      'Relacionado conceptualmente con company_departments.name (texto libre, no FK).';

    RAISE NOTICE '[DRIFT OK] t1_dimension_scores.interviewee_department añadida';
  ELSE
    RAISE NOTICE '[DRIFT SKIP] t1_dimension_scores.interviewee_department ya existía — sin cambios';
  END IF;
END $$;


-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================
DO $$
DECLARE
  v_sector           boolean;
  v_company_size     boolean;
  v_departments      boolean;
  v_dept_updated_at  boolean;
  v_dept_trigger     boolean;
  v_dept_rls         boolean;
  v_dept_policies    int;
  v_int_dept         boolean;
  v_ok               boolean := true;
BEGIN
  -- Columnas de companies
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='companies' AND column_name='sector'
  ) INTO v_sector;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='companies' AND column_name='company_size'
  ) INTO v_company_size;

  -- Tabla company_departments y sus objetos
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='company_departments'
  ) INTO v_departments;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='company_departments' AND column_name='updated_at'
  ) INTO v_dept_updated_at;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_schema='public'
      AND event_object_table='company_departments'
      AND trigger_name='trg_company_departments_updated_at'
  ) INTO v_dept_trigger;

  SELECT rowsecurity INTO v_dept_rls
  FROM pg_tables
  WHERE schemaname='public' AND tablename='company_departments';

  SELECT COUNT(*) INTO v_dept_policies
  FROM pg_policies
  WHERE schemaname='public' AND tablename='company_departments';

  -- Columna interviewee_department
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='t1_dimension_scores' AND column_name='interviewee_department'
  ) INTO v_int_dept;

  -- Evaluación
  IF NOT v_sector THEN
    RAISE WARNING '[VERIFY FAIL] companies.sector faltante';           v_ok := false;
  END IF;
  IF NOT v_company_size THEN
    RAISE WARNING '[VERIFY FAIL] companies.company_size faltante';     v_ok := false;
  END IF;
  IF NOT v_departments THEN
    RAISE WARNING '[VERIFY FAIL] company_departments tabla faltante';  v_ok := false;
  END IF;
  IF NOT v_dept_updated_at THEN
    RAISE WARNING '[VERIFY FAIL] company_departments.updated_at faltante'; v_ok := false;
  END IF;
  IF NOT v_dept_trigger THEN
    RAISE WARNING '[VERIFY FAIL] trigger trg_company_departments_updated_at faltante'; v_ok := false;
  END IF;
  IF NOT v_dept_rls THEN
    RAISE WARNING '[VERIFY FAIL] RLS no habilitado en company_departments'; v_ok := false;
  END IF;
  IF v_dept_policies < 4 THEN
    RAISE WARNING '[VERIFY FAIL] company_departments: % policies (esperadas ≥4)', v_dept_policies; v_ok := false;
  END IF;
  IF NOT v_int_dept THEN
    RAISE WARNING '[VERIFY FAIL] t1_dimension_scores.interviewee_department faltante'; v_ok := false;
  END IF;

  IF v_ok THEN
    RAISE NOTICE '================================================================';
    RAISE NOTICE '[MIGRATION v3 OK] 20260601_schema_drift_sprint10 completada.';
    RAISE NOTICE '  companies.sector                              ✓';
    RAISE NOTICE '  companies.company_size                        ✓';
    RAISE NOTICE '  company_departments (+ updated_at + trigger)  ✓';
    RAISE NOTICE '  company_departments RLS (% policies)          ✓', v_dept_policies;
    RAISE NOTICE '  t1_dimension_scores.interviewee_department    ✓';
    RAISE NOTICE '================================================================';
  ELSE
    RAISE EXCEPTION
      '[MIGRATION v3 FAIL] Uno o más items no quedaron aplicados correctamente. '
      'Ver los WARNINGS anteriores antes de continuar.';
  END IF;
END $$;


-- ========== 20260602_create_project_rpc.sql ==========
-- Original source: 20260602_create_project_rpc.sql

-- ================================================================
-- Migration: create_project RPC
-- Fecha: 2026-06-02
--
-- PROPÓSITO:
--   Formaliza la función public.create_project(uuid, text, text)
--   que existe en producción (gobytech_pro) pero fue añadida
--   manualmente durante la migración de Sprint 10.
--
--   Firma validada en producción:
--     create_project(uuid, text, text) → SETOF projects
--
--   El frontend la invoca como:
--     supabase.rpc('create_project', { p_company_id, p_name, p_phase })
--   Ver: src/services/projects.service.ts → createProject()
--
-- AUTORIZACIÓN:
--   Solo superadmin y consultant pueden crear proyectos.
--   client_editor y client_viewer son rechazados con EXCEPTION.
--
-- SEGURO: idempotente — CREATE OR REPLACE. No toca auth.users.
-- ================================================================


-- ── Dependencias previas ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    RAISE EXCEPTION '[create_project migration] ABORTADO: tabla public.projects no existe.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'project_members'
  ) THEN
    RAISE EXCEPTION '[create_project migration] ABORTADO: tabla public.project_members no existe.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION '[create_project migration] ABORTADO: tabla public.profiles no existe.';
  END IF;
END $$;


-- ── Función principal ─────────────────────────────────────────────
-- Firma: create_project(uuid, text, text) — coincide con gobytech_pro validado.
-- Parámetros en orden FK-primero para alinearse con la firma de producción.
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


-- ── Permisos ──────────────────────────────────────────────────────
-- GRANT a authenticated: cualquier autenticado puede llamarla.
-- La autorización real (superadmin/consultant) está dentro de la función.
REVOKE ALL     ON FUNCTION public.create_project(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_project(uuid, text, text) TO authenticated;


-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'create_project'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260602 OK] public.create_project(uuid, text, text) creada/actualizada correctamente';
  ELSE
    RAISE EXCEPTION '[20260602 FAIL] public.create_project no encontrada tras CREATE OR REPLACE';
  END IF;
END $$;


-- ========== 20260603_rls_policies.sql ==========
-- Original source: 20260603_rls_policies.sql

-- ================================================================
-- Migration: RLS Policies — setup completo para DEV
-- Fecha: 2026-06-02
--
-- Aplica todas las políticas RLS para las 18 tablas del schema.
-- Necesario tras ejecutar el schema desde el export de PRE,
-- ya que ese export incluye ENABLE ROW LEVEL SECURITY pero no
-- las políticas — resultado sin este fichero: 0 rows en todas
-- las queries aunque los datos existan.
--
-- IDEMPOTENTE: DROP POLICY IF EXISTS antes de cada CREATE.
-- ================================================================

-- ── companies ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies_select_authenticated" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_write"          ON public.companies;
CREATE POLICY "companies_select_authenticated" ON public.companies
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "companies_admin_write" ON public.companies
  FOR ALL USING (public.is_platform_admin());

-- ── profiles ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all"  ON public.profiles;
CREATE POLICY "profiles_select_own"       ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own"       ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_select_all" ON public.profiles FOR SELECT USING (public.is_platform_admin());
CREATE POLICY "profiles_admin_update_all" ON public.profiles FOR UPDATE USING (public.is_platform_admin());

-- ── projects ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (public.is_project_member(id) OR public.is_platform_admin());
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_platform_admin());

-- ── project_members ─────────────────────────────────────────────
DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_write"  ON public.project_members;
CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "project_members_write" ON public.project_members
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── company_profiles ────────────────────────────────────────────
DROP POLICY IF EXISTS "company_profiles_select" ON public.company_profiles;
DROP POLICY IF EXISTS "company_profiles_write"  ON public.company_profiles;
CREATE POLICY "company_profiles_select" ON public.company_profiles
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "company_profiles_write" ON public.company_profiles
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── frictions ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "frictions_select" ON public.frictions;
DROP POLICY IF EXISTS "frictions_write"  ON public.frictions;
CREATE POLICY "frictions_select" ON public.frictions
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "frictions_write" ON public.frictions
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── t1_dimension_scores ─────────────────────────────────────────
DROP POLICY IF EXISTS "t1_select" ON public.t1_dimension_scores;
DROP POLICY IF EXISTS "t1_write"  ON public.t1_dimension_scores;
CREATE POLICY "t1_select" ON public.t1_dimension_scores
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "t1_write" ON public.t1_dimension_scores
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── stakeholders ────────────────────────────────────────────────
DROP POLICY IF EXISTS "stakeholders_select" ON public.stakeholders;
DROP POLICY IF EXISTS "stakeholders_write"  ON public.stakeholders;
CREATE POLICY "stakeholders_select" ON public.stakeholders
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "stakeholders_write" ON public.stakeholders
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── value_streams ───────────────────────────────────────────────
DROP POLICY IF EXISTS "value_streams_select" ON public.value_streams;
DROP POLICY IF EXISTS "value_streams_write"  ON public.value_streams;
CREATE POLICY "value_streams_select" ON public.value_streams
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "value_streams_write" ON public.value_streams
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── use_cases ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "use_cases_select" ON public.use_cases;
DROP POLICY IF EXISTS "use_cases_write"  ON public.use_cases;
CREATE POLICY "use_cases_select" ON public.use_cases
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "use_cases_write" ON public.use_cases
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── t5_canvas ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "t5_canvas_select" ON public.t5_canvas;
DROP POLICY IF EXISTS "t5_canvas_write"  ON public.t5_canvas;
CREATE POLICY "t5_canvas_select" ON public.t5_canvas
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "t5_canvas_write" ON public.t5_canvas
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── iso42001_controls ───────────────────────────────────────────
DROP POLICY IF EXISTS "iso42001_select" ON public.iso42001_controls;
DROP POLICY IF EXISTS "iso42001_write"  ON public.iso42001_controls;
CREATE POLICY "iso42001_select" ON public.iso42001_controls
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "iso42001_write" ON public.iso42001_controls
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── snapshots ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "snapshots_select" ON public.snapshots;
DROP POLICY IF EXISTS "snapshots_write"  ON public.snapshots;
CREATE POLICY "snapshots_select" ON public.snapshots
  FOR SELECT USING (public.is_project_member(project_id) OR public.is_platform_admin());
CREATE POLICY "snapshots_write" ON public.snapshots
  FOR ALL USING (public.can_write_project(project_id) OR public.is_platform_admin());

-- ── tool_outputs ────────────────────────────────────────────────
DROP POLICY IF EXISTS "tool_outputs_select"    ON public.tool_outputs;
DROP POLICY IF EXISTS "tool_outputs_no_delete" ON public.tool_outputs;
CREATE POLICY "tool_outputs_select" ON public.tool_outputs
  FOR SELECT TO authenticated USING (public.user_can_read_project(project_id));
CREATE POLICY "tool_outputs_no_delete" ON public.tool_outputs
  FOR DELETE TO authenticated USING (false);

-- ── t9_overrides ────────────────────────────────────────────────
DROP POLICY IF EXISTS "t9_overrides_select" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_insert" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_update" ON public.t9_overrides;
DROP POLICY IF EXISTS "t9_overrides_delete" ON public.t9_overrides;
CREATE POLICY "t9_overrides_select" ON public.t9_overrides
  FOR SELECT TO authenticated USING (public.user_can_read_project(project_id));
CREATE POLICY "t9_overrides_insert" ON public.t9_overrides
  FOR INSERT TO authenticated WITH CHECK (public.user_can_edit_project(project_id));
CREATE POLICY "t9_overrides_update" ON public.t9_overrides
  FOR UPDATE TO authenticated
  USING (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));
CREATE POLICY "t9_overrides_delete" ON public.t9_overrides
  FOR DELETE TO authenticated USING (public.user_can_edit_project(project_id));

-- ── t9_free_items ───────────────────────────────────────────────
DROP POLICY IF EXISTS "t9_free_items_select" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_insert" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_update" ON public.t9_free_items;
DROP POLICY IF EXISTS "t9_free_items_delete" ON public.t9_free_items;
CREATE POLICY "t9_free_items_select" ON public.t9_free_items
  FOR SELECT TO authenticated USING (public.user_can_read_project(project_id));
CREATE POLICY "t9_free_items_insert" ON public.t9_free_items
  FOR INSERT TO authenticated WITH CHECK (public.user_can_edit_project(project_id));
CREATE POLICY "t9_free_items_update" ON public.t9_free_items
  FOR UPDATE TO authenticated
  USING (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));
CREATE POLICY "t9_free_items_delete" ON public.t9_free_items
  FOR DELETE TO authenticated USING (public.user_can_edit_project(project_id));

-- ── company_departments ─────────────────────────────────────────
DROP POLICY IF EXISTS "company_departments_select" ON public.company_departments;
DROP POLICY IF EXISTS "company_departments_insert" ON public.company_departments;
DROP POLICY IF EXISTS "company_departments_update" ON public.company_departments;
DROP POLICY IF EXISTS "company_departments_delete" ON public.company_departments;
CREATE POLICY "company_departments_select" ON public.company_departments
  FOR SELECT TO authenticated USING (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = company_departments.company_id)
  );
CREATE POLICY "company_departments_insert" ON public.company_departments
  FOR INSERT TO authenticated WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = company_departments.company_id AND p.role IN ('superadmin','consultant'))
  );
CREATE POLICY "company_departments_update" ON public.company_departments
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = company_departments.company_id AND p.role IN ('superadmin','consultant')))
  WITH CHECK (public.is_platform_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = company_departments.company_id AND p.role IN ('superadmin','consultant')));
CREATE POLICY "company_departments_delete" ON public.company_departments
  FOR DELETE TO authenticated USING (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = company_departments.company_id AND p.role IN ('superadmin','consultant'))
  );

-- ── ai_rate_limit_log ───────────────────────────────────────────
DROP POLICY IF EXISTS "ai_rate_limit_log_insert" ON public.ai_rate_limit_log;
DROP POLICY IF EXISTS "ai_rate_limit_log_select" ON public.ai_rate_limit_log;
CREATE POLICY "ai_rate_limit_log_insert" ON public.ai_rate_limit_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_rate_limit_log_select" ON public.ai_rate_limit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin());


-- ========== 20260703_company_persons.sql ==========
-- Original source: 20260703_company_persons.sql

-- ============================================================
-- Migration 20260703_company_persons.sql
--
-- Introduce la entidad CompanyPerson: persona de la empresa/proyecto
-- (nombre, cargo, departamento, tool de origen) reutilizable desde
-- T1, T2, T3, T9 y CompanyProfile mediante el componente
-- PersonSelectField.
--
-- Scope: project_id (obligatorio) — mismo patrón que t9_free_items
-- y stakeholders. company_id es opcional (FK a companies).
--
-- RLS: mismo patrón que t9_free_items — user_can_read_project /
-- user_can_edit_project (ver 20260528_security_persistence.sql y
-- 20260602_rls_policies.sql).
--
-- También añade person_id (nullable) a t1_dimension_scores y
-- t9_free_items para poder referenciar la persona seleccionada
-- desde esos formularios.
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. Tabla company_persons
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.company_persons (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id    uuid        REFERENCES public.companies(id) ON DELETE SET NULL,
  name          text        NOT NULL CHECK (length(trim(name)) > 0),
  role          text        NOT NULL DEFAULT '',
  department    text        NOT NULL DEFAULT '',
  source_tool   text        NOT NULL CHECK (source_tool IN ('t1', 't2', 't3', 't9', 'company_profile')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_persons ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.company_persons IS
  'Persona de la empresa/proyecto reutilizable entre T1, T2, T3, T9 y '
  'CompanyProfile via PersonSelectField. Scope: project_id.';

CREATE INDEX IF NOT EXISTS idx_company_persons_project_id
  ON public.company_persons (project_id);


-- ════════════════════════════════════════════════════════════════
-- 2. RLS — company_persons (patrón user_can_read_project / user_can_edit_project)
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "company_persons_select" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_insert" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_update" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_delete" ON public.company_persons;

CREATE POLICY "company_persons_select" ON public.company_persons
  FOR SELECT TO authenticated USING (public.user_can_read_project(project_id));

CREATE POLICY "company_persons_insert" ON public.company_persons
  FOR INSERT TO authenticated WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "company_persons_update" ON public.company_persons
  FOR UPDATE TO authenticated
  USING (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "company_persons_delete" ON public.company_persons
  FOR DELETE TO authenticated USING (public.user_can_edit_project(project_id));


-- ════════════════════════════════════════════════════════════════
-- 3. person_id en tablas consumidoras (nullable, idempotente)
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.t9_free_items
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.company_persons(id) ON DELETE SET NULL;

ALTER TABLE public.t1_dimension_scores
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.company_persons(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.t9_free_items.person_id IS
  'Referencia opcional a company_persons.id — seleccionado via PersonSelectField.';
COMMENT ON COLUMN public.t1_dimension_scores.person_id IS
  'Referencia opcional a company_persons.id — seleccionado via PersonSelectField. '
  'No sustituye a interviewee_id (histórico); ver TECH-DEBT.md.';


-- ========== 20260705_backfill_company_persons_all_projects.sql ==========
-- Original source: 20260705_backfill_company_persons_all_projects.sql

-- ============================================================
-- Backfill 20260705_backfill_company_persons_all_projects.sql
--
-- Versión GENÉRICA de 20260704_backfill_company_persons_toy_story.sql:
-- carga company_persons a partir de los datos YA EXISTENTES en
-- T1, T2, T3 y T9 para TODOS los proyectos/empresas de la base
-- de datos, no solo uno concreto.
--
-- Usar este fichero para futuras cargas (nuevos clientes, nuevos
-- proyectos) en lugar de duplicar un script por cliente.
--
-- Requiere: 20260703_company_persons.sql ya aplicada en el
-- entorno (tabla company_persons + columnas person_id en
-- t1_dimension_scores y t9_free_items).
--
-- IDEMPOTENTE: cada bloque usa NOT EXISTS — ejecutarlo varias
-- veces (o tras añadir un cliente nuevo) no duplica filas ya
-- creadas. Seguro de re-ejecutar en cualquier momento y en
-- cualquier entorno (DEV / PRE / PRO).
--
-- Deduplicación: una persona = (project_id, name, role) único —
-- mismo criterio que ya usa ImportFromT1Modal. T3 y T9 no
-- capturan cargo, así que una persona ya creada con cargo desde
-- T1/T2 puede aparecer también como fila separada "sin cargo" si
-- sale en T3/T9 — es intencional (ver docs/operations/DATABASES.md
-- sección "Scripts de Backfill" para el razonamiento).
--
-- Alcance T3: además de crear las personas, reescribe el JSONB
-- value_streams.stages añadiendo "personId" en cada etapa cuyo
-- "responsible" coincida con una persona creada/existente.
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. T1 — t1_dimension_scores (interviewee_name / interviewee_role / interviewee_department)
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(t1.interviewee_name),
  trim(coalesce(t1.interviewee_role, '')),
  trim(coalesce(t1.interviewee_department, '')),
  't1'
FROM public.t1_dimension_scores t1
JOIN public.projects p ON p.id = t1.project_id
WHERE t1.interviewee_name IS NOT NULL
  AND trim(t1.interviewee_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(t1.interviewee_name))
       AND lower(cp.role)  = lower(trim(coalesce(t1.interviewee_role, '')))
  );

-- Vincular person_id en t1_dimension_scores para las filas recién creadas / ya existentes
UPDATE public.t1_dimension_scores t1
   SET person_id = cp.id
  FROM public.company_persons cp
 WHERE t1.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(t1.interviewee_name))
   AND lower(cp.role)  = lower(trim(coalesce(t1.interviewee_role, '')))
   AND t1.person_id IS NULL;


-- ════════════════════════════════════════════════════════════════
-- 2. T2 — stakeholders (name / role / department)
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(s.name),
  trim(coalesce(s.role, '')),
  trim(coalesce(s.department, '')),
  't2'
FROM public.stakeholders s
JOIN public.projects p ON p.id = s.project_id
WHERE s.name IS NOT NULL
  AND trim(s.name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(s.name))
       AND lower(cp.role)  = lower(trim(coalesce(s.role, '')))
  );

-- stakeholders no tiene columna person_id (fuera de alcance de 20260703) — solo se crea la persona.


-- ════════════════════════════════════════════════════════════════
-- 3. T9 — t9_free_items (responsible / department)
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(t9.responsible),
  '',
  trim(coalesce(t9.department, '')),
  't9'
FROM public.t9_free_items t9
JOIN public.projects p ON p.id = t9.project_id
WHERE t9.responsible IS NOT NULL
  AND trim(t9.responsible) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(t9.responsible))
       AND lower(cp.role)  = ''
  );

-- Vincular person_id en t9_free_items para las filas recién creadas / ya existentes
UPDATE public.t9_free_items t9
   SET person_id = cp.id
  FROM public.company_persons cp
 WHERE t9.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(t9.responsible))
   AND cp.role = ''
   AND t9.person_id IS NULL;


-- ════════════════════════════════════════════════════════════════
-- 4. T3 — value_streams.stages (JSONB) → responsible / department por etapa
-- ════════════════════════════════════════════════════════════════

-- 4a. Crear personas a partir de cada etapa con "responsible" no vacío
INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(stage->>'responsible'),
  '',
  trim(coalesce(stage->>'department', '')),
  't3'
FROM public.value_streams vs
JOIN public.projects p ON p.id = vs.project_id
CROSS JOIN LATERAL jsonb_array_elements(vs.stages) AS stage
WHERE stage->>'responsible' IS NOT NULL
  AND trim(stage->>'responsible') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(stage->>'responsible'))
       AND lower(cp.role)  = ''
  );

-- 4b. Reescribir vs.stages añadiendo "personId" en cada etapa cuyo
--     "responsible" coincida con una company_persons existente.
--     Reconstruye el array completo por cada value_stream afectado
--     (de cualquier proyecto).
UPDATE public.value_streams vs
   SET stages = (
     SELECT jsonb_agg(
       CASE
         WHEN stage->>'responsible' IS NOT NULL
          AND trim(stage->>'responsible') <> ''
          AND cp.id IS NOT NULL
         THEN stage || jsonb_build_object('personId', cp.id::text)
         ELSE stage
       END
       ORDER BY ord
     )
     FROM jsonb_array_elements(vs.stages) WITH ORDINALITY AS elems(stage, ord)
     LEFT JOIN public.company_persons cp
       ON cp.project_id = vs.project_id
      AND lower(cp.name) = lower(trim(stage->>'responsible'))
      AND cp.role = ''
   )
 WHERE jsonb_array_length(vs.stages) > 0;


-- ════════════════════════════════════════════════════════════════
-- 5. Resumen de verificación (leer el NOTICE tras ejecutar)
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_total int;
BEGIN
  SELECT count(*) INTO v_total FROM public.company_persons;
  RAISE NOTICE 'company_persons totales en toda la BD tras el backfill: %', v_total;
END $$;

-- Desglose por proyecto/empresa y herramienta de origen — revisar
-- el resultado de este SELECT tras ejecutar el script.
SELECT
  c.name  AS empresa,
  p.name  AS proyecto,
  cp.source_tool,
  count(*) AS personas
FROM public.company_persons cp
JOIN public.projects  p ON p.id = cp.project_id
JOIN public.companies c ON c.id = p.company_id
GROUP BY c.name, p.name, cp.source_tool
ORDER BY c.name, p.name, cp.source_tool;


-- ========== 20260706001_merge_company_persons_function.sql ==========
-- Original source: 20260706001_merge_company_persons_function.sql

-- ============================================================
-- Migration 20260706_merge_company_persons_function.sql
--
-- Función RPC merge_company_persons: fusiona dos company_persons
-- (una "principal" que se conserva y una "sustituible" que se
-- elimina), repuntando todas las referencias reales (FK) de la
-- sustituible hacia la principal en T1, T2, T3 (JSONB) y T9.
--
-- Requiere: 20260703_company_persons.sql y
-- 20260706_stakeholders_person_id.sql ya aplicadas (T2 necesita
-- person_id real para poder fusionarse igual que T1/T9).
--
-- Atomicidad: SECURITY DEFINER + plpgsql — toda la función corre
-- en una única transacción implícita de Postgres. Cualquier
-- RAISE EXCEPTION revierte TODOS los cambios hechos hasta ese
-- punto dentro de la función — no hace falta rollback manual en
-- el cliente.
--
-- Autorización: solo superadmin/consultant (igual que
-- create_project en 20260602_create_project_rpc.sql).
-- ============================================================

CREATE OR REPLACE FUNCTION public.merge_company_persons(
  p_principal_id uuid,
  p_replaced_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role        text;
  v_project_principal   uuid;
  v_project_replaced     uuid;
  v_t1_count int;
  v_t2_count int;
  v_t3_count int;
  v_t9_count int;
BEGIN
  -- Autorización — solo superadmin/consultant
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('superadmin', 'consultant') THEN
    RAISE EXCEPTION 'Acceso denegado. Tu rol no está autorizado a fusionar personas.';
  END IF;

  IF p_principal_id IS NULL OR p_replaced_id IS NULL THEN
    RAISE EXCEPTION 'Debes indicar la persona principal y la persona a sustituir.';
  END IF;

  IF p_principal_id = p_replaced_id THEN
    RAISE EXCEPTION 'No puedes fusionar una persona consigo misma. Elige dos personas distintas.';
  END IF;

  SELECT project_id INTO v_project_principal FROM public.company_persons WHERE id = p_principal_id;
  SELECT project_id INTO v_project_replaced  FROM public.company_persons WHERE id = p_replaced_id;

  IF v_project_principal IS NULL THEN
    RAISE EXCEPTION 'La persona principal indicada no existe.';
  END IF;

  IF v_project_replaced IS NULL THEN
    RAISE EXCEPTION 'La persona a sustituir indicada no existe.';
  END IF;

  IF v_project_principal <> v_project_replaced THEN
    RAISE EXCEPTION 'Las dos personas deben pertenecer al mismo proyecto. No se puede fusionar entre proyectos distintos.';
  END IF;

  -- T1 — t1_dimension_scores.person_id
  UPDATE public.t1_dimension_scores
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t1_count = ROW_COUNT;

  -- T2 — stakeholders.person_id
  UPDATE public.stakeholders
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t2_count = ROW_COUNT;

  -- T3 — value_streams.stages[].personId (JSONB)
  WITH updated AS (
    UPDATE public.value_streams vs
       SET stages = (
         SELECT jsonb_agg(
           CASE
             WHEN stage->>'personId' = p_replaced_id::text
             THEN stage || jsonb_build_object('personId', p_principal_id::text)
             ELSE stage
           END
           ORDER BY ord
         )
         FROM jsonb_array_elements(vs.stages) WITH ORDINALITY AS elems(stage, ord)
       )
     WHERE vs.project_id = v_project_principal
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(vs.stages) s
          WHERE s->>'personId' = p_replaced_id::text
       )
    RETURNING 1
  )
  SELECT count(*) INTO v_t3_count FROM updated;

  -- T9 — t9_free_items.person_id
  UPDATE public.t9_free_items
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t9_count = ROW_COUNT;

  -- Eliminar la persona sustituible — solo si no quedó ninguna
  -- referencia sin repuntar (defensivo; ya deberían ser 0 tras
  -- los UPDATE anteriores).
  IF EXISTS (SELECT 1 FROM public.t1_dimension_scores WHERE person_id = p_replaced_id)
     OR EXISTS (SELECT 1 FROM public.stakeholders WHERE person_id = p_replaced_id)
     OR EXISTS (SELECT 1 FROM public.t9_free_items WHERE person_id = p_replaced_id)
  THEN
    RAISE EXCEPTION 'Quedan referencias sin repuntar tras la fusión. Operación cancelada.';
  END IF;

  DELETE FROM public.company_persons WHERE id = p_replaced_id;

  RETURN jsonb_build_object(
    't1_updated', v_t1_count,
    't2_updated', v_t2_count,
    't3_updated', v_t3_count,
    't9_updated', v_t9_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_company_persons(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.merge_company_persons(uuid, uuid) IS
  'Fusiona dos company_persons: repunta todas las referencias FK reales (T1/T2/T3-JSONB/T9) de p_replaced_id hacia p_principal_id y elimina p_replaced_id. Atómico — cualquier error revierte todos los cambios. Solo superadmin/consultant.';


-- ========== 20260706002_stakeholders_person_id.sql ==========
-- Original source: 20260706002_stakeholders_person_id.sql

-- ============================================================
-- Migration 20260706_stakeholders_person_id.sql
--
-- Añade person_id (FK nullable a company_persons) a stakeholders
-- (T2), que hasta ahora solo copiaba nombre/cargo/departamento
-- como texto libre sin vínculo real a company_persons.
--
-- Motivo: la función merge_company_persons (ver
-- 20260706_merge_company_persons_function.sql) necesita repuntar
-- referencias reales (FK), no adivinar coincidencias de texto.
-- Con esta columna, T1, T2, T3 y T9 quedan todos con una
-- referencia real a company_persons.
--
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS + backfill con
-- WHERE person_id IS NULL — seguro de re-ejecutar.
-- ============================================================

ALTER TABLE public.stakeholders
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.company_persons(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.stakeholders.person_id IS
  'Referencia opcional a company_persons.id — seleccionado via PersonSelectField. '
  'Antes de esta columna, T2 solo copiaba name/role/department como texto libre.';

CREATE INDEX IF NOT EXISTS idx_stakeholders_person_id
  ON public.stakeholders (person_id)
  WHERE person_id IS NOT NULL;

-- Backfill: mismo criterio (project_id, nombre, cargo) que
-- 20260705_backfill_company_persons_all_projects.sql, para todos
-- los proyectos existentes.
UPDATE public.stakeholders s
   SET person_id = cp.id
  FROM public.company_persons cp
 WHERE s.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(s.name))
   AND lower(cp.role)  = lower(trim(coalesce(s.role, '')))
   AND s.person_id IS NULL;

-- Verificación
DO $$
DECLARE
  v_total   int;
  v_linked  int;
BEGIN
  SELECT count(*) INTO v_total  FROM public.stakeholders;
  SELECT count(*) INTO v_linked FROM public.stakeholders WHERE person_id IS NOT NULL;
  RAISE NOTICE 'stakeholders: % de % filas vinculadas a company_persons tras el backfill', v_linked, v_total;
END $$;


-- ========== 20260707_company_departments_type.sql ==========
-- Original source: 20260707_company_departments_type.sql

-- ============================================================
-- Migration 20260707_company_departments_type.sql
--
-- Añade el campo `type` a company_departments para distinguir
-- departamentos IT / Tecnología de departamentos Negocio & Ops.
-- Reutiliza la misma distinción binaria que T1 ya usa para
-- clasificar entrevistados (interviewee.type: 'it' | 'business').
--
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS con DEFAULT + backfill
-- WHERE type IS NULL — seguro de re-ejecutar.
--
-- NOT NULL: se aplica tras el backfill, con DEFAULT 'negocio_ops'
-- para departamentos existentes sin clasificar explícitamente
-- (revisar/corregir con scripts/migrate-departments-to-type.sql).
-- ============================================================

ALTER TABLE public.company_departments
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'negocio_ops';

UPDATE public.company_departments
   SET type = 'negocio_ops'
 WHERE type IS NULL;

ALTER TABLE public.company_departments
  ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.company_departments
  DROP CONSTRAINT IF EXISTS company_departments_type_check;

ALTER TABLE public.company_departments
  ADD CONSTRAINT company_departments_type_check
  CHECK (type IN ('it', 'negocio_ops'));

COMMENT ON COLUMN public.company_departments.type IS
  'Clasificación del departamento: it (IT / Tecnología) o negocio_ops (Negocio & Ops). '
  'Misma distinción binaria que T1 usa para interviewee.type. DEFAULT negocio_ops — '
  'revisar clasificación real con scripts/migrate-departments-to-type.sql.';


-- ========== 20260708_company_persons_company_scope.sql ==========
-- Original source: 20260708_company_persons_company_scope.sql

-- ============================================================
-- Migration 20260708_company_persons_company_scope.sql
--
-- Amplía el scope de LECTURA de company_persons de project_id a
-- company_id, para soportar la sección "Personas en la empresa"
-- (antes "Equipo del proyecto"): lista todas las personas de
-- todos los proyectos de una misma empresa, no solo del proyecto
-- activo.
--
-- Modifica:
--   - 20260703_company_persons.sql          (policies RLS)
--   - 20260706_merge_company_persons_function.sql (validación de scope)
--
-- Escritura (INSERT/UPDATE/DELETE) NO cambia: sigue exigiendo
-- user_can_edit_project(project_id) de la fila concreta — alta y
-- edición de una persona siguen atadas a un proyecto específico.
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. Helper user_can_read_company — mismo patrón que
--    user_can_read_project (20260528_security_persistence.sql),
--    pero resuelto directamente por company_id en vez de project_id.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.user_can_read_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Patrón 1: cualquier miembro explícito de algún proyecto de esa empresa
    SELECT 1
    FROM   public.project_members pm
    JOIN   public.projects        p  ON p.id = pm.project_id
    WHERE  p.company_id = p_company_id
      AND  pm.user_id   = auth.uid()

    UNION ALL

    -- Patrón 2: usuarios cliente (editor o viewer) vinculados a esa empresa
    SELECT 1
    FROM   public.profiles pr
    WHERE  pr.company_id = p_company_id
      AND  pr.id         = auth.uid()
      AND  pr.role IN ('client_editor', 'client_viewer')
  )
$$;

COMMENT ON FUNCTION public.user_can_read_company IS
  'Acceso de lectura a nivel de empresa: miembro de cualquier proyecto de la empresa '
  '+ client_editor + client_viewer vinculados a esa empresa. STABLE → cacheado por transacción. '
  'Usado por company_persons_select para listar personas de todos los proyectos de una empresa.';


-- ════════════════════════════════════════════════════════════════
-- 2. Policies de company_persons — SELECT amplía a company_id,
--    INSERT/UPDATE/DELETE sin cambio de fondo (re-creadas para
--    dejar el archivo autocontenido e idempotente).
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "company_persons_select" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_insert" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_update" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_delete" ON public.company_persons;

-- SELECT: por empresa (nuevo) con fallback a por proyecto (cubre
-- filas legado con company_id NULL, y cubre también accesos que
-- solo tengan permiso a nivel de proyecto sin ser de la empresa).
CREATE POLICY "company_persons_select" ON public.company_persons
  FOR SELECT TO authenticated USING (
    public.user_can_read_company(company_id)
    OR public.user_can_read_project(project_id)
  );

CREATE POLICY "company_persons_insert" ON public.company_persons
  FOR INSERT TO authenticated WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "company_persons_update" ON public.company_persons
  FOR UPDATE TO authenticated
  USING (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "company_persons_delete" ON public.company_persons
  FOR DELETE TO authenticated USING (public.user_can_edit_project(project_id));


-- ════════════════════════════════════════════════════════════════
-- 3. Índice por company_id — el SELECT principal ahora filtra por
--    company_id en vez de (o además de) project_id.
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_company_persons_company_id
  ON public.company_persons (company_id);


-- ════════════════════════════════════════════════════════════════
-- 4. merge_company_persons — relaja la validación de "mismo
--    proyecto" a "misma empresa". El company_id se resuelve
--    siempre vía projects.company_id (no vía company_persons.company_id,
--    que puede ser NULL en filas legado).
--
--    LIMITACIÓN CONOCIDA (ver docs/architecture/TECH-DEBT.md):
--    el UPDATE de T3 (value_streams.stages, JSONB) sigue filtrando
--    por vs.project_id = v_project_principal — si las dos personas
--    fusionadas pertenecen a proyectos distintos de la misma empresa,
--    las referencias personId en value_streams del proyecto de la
--    persona sustituida NO se repuntan.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.merge_company_persons(
  p_principal_id uuid,
  p_replaced_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role        text;
  v_project_principal  uuid;
  v_project_replaced   uuid;
  v_company_principal  uuid;
  v_company_replaced   uuid;
  v_t1_count int;
  v_t2_count int;
  v_t3_count int;
  v_t9_count int;
BEGIN
  -- Autorización — solo superadmin/consultant
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('superadmin', 'consultant') THEN
    RAISE EXCEPTION 'Acceso denegado. Tu rol no está autorizado a fusionar personas.';
  END IF;

  IF p_principal_id IS NULL OR p_replaced_id IS NULL THEN
    RAISE EXCEPTION 'Debes indicar la persona principal y la persona a sustituir.';
  END IF;

  IF p_principal_id = p_replaced_id THEN
    RAISE EXCEPTION 'No puedes fusionar una persona consigo misma. Elige dos personas distintas.';
  END IF;

  SELECT project_id INTO v_project_principal FROM public.company_persons WHERE id = p_principal_id;
  SELECT project_id INTO v_project_replaced  FROM public.company_persons WHERE id = p_replaced_id;

  IF v_project_principal IS NULL THEN
    RAISE EXCEPTION 'La persona principal indicada no existe.';
  END IF;

  IF v_project_replaced IS NULL THEN
    RAISE EXCEPTION 'La persona a sustituir indicada no existe.';
  END IF;

  -- Resolver company_id canónico vía projects (no vía
  -- company_persons.company_id, que puede ser NULL en filas legado).
  SELECT company_id INTO v_company_principal FROM public.projects WHERE id = v_project_principal;
  SELECT company_id INTO v_company_replaced  FROM public.projects WHERE id = v_project_replaced;

  IF v_company_principal IS DISTINCT FROM v_company_replaced THEN
    RAISE EXCEPTION 'Las dos personas deben pertenecer a la misma empresa. No se puede fusionar entre empresas distintas.';
  END IF;

  -- T1 — t1_dimension_scores.person_id
  UPDATE public.t1_dimension_scores
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t1_count = ROW_COUNT;

  -- T2 — stakeholders.person_id
  UPDATE public.stakeholders
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t2_count = ROW_COUNT;

  -- T3 — value_streams.stages[].personId (JSONB)
  -- NOTA: sigue limitado a vs.project_id = v_project_principal — ver
  -- limitación conocida documentada en TECH-DEBT.md.
  WITH updated AS (
    UPDATE public.value_streams vs
       SET stages = (
         SELECT jsonb_agg(
           CASE
             WHEN stage->>'personId' = p_replaced_id::text
             THEN stage || jsonb_build_object('personId', p_principal_id::text)
             ELSE stage
           END
           ORDER BY ord
         )
         FROM jsonb_array_elements(vs.stages) WITH ORDINALITY AS elems(stage, ord)
       )
     WHERE vs.project_id = v_project_principal
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(vs.stages) s
          WHERE s->>'personId' = p_replaced_id::text
       )
    RETURNING 1
  )
  SELECT count(*) INTO v_t3_count FROM updated;

  -- T9 — t9_free_items.person_id
  UPDATE public.t9_free_items
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t9_count = ROW_COUNT;

  -- Eliminar la persona sustituible — solo si no quedó ninguna
  -- referencia sin repuntar (defensivo; ya deberían ser 0 tras
  -- los UPDATE anteriores).
  IF EXISTS (SELECT 1 FROM public.t1_dimension_scores WHERE person_id = p_replaced_id)
     OR EXISTS (SELECT 1 FROM public.stakeholders WHERE person_id = p_replaced_id)
     OR EXISTS (SELECT 1 FROM public.t9_free_items WHERE person_id = p_replaced_id)
  THEN
    RAISE EXCEPTION 'Quedan referencias sin repuntar tras la fusión. Operación cancelada.';
  END IF;

  DELETE FROM public.company_persons WHERE id = p_replaced_id;

  RETURN jsonb_build_object(
    't1_updated', v_t1_count,
    't2_updated', v_t2_count,
    't3_updated', v_t3_count,
    't9_updated', v_t9_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_company_persons(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.merge_company_persons(uuid, uuid) IS
  'Fusiona dos company_persons: repunta todas las referencias FK reales (T1/T2/T3-JSONB/T9) de p_replaced_id hacia p_principal_id y elimina p_replaced_id. '
  'Atómico — cualquier error revierte todos los cambios. Solo superadmin/consultant. '
  'Scope: misma empresa (company_id vía projects), no mismo proyecto — ver limitación conocida sobre T3 en TECH-DEBT.md.';


-- ========== 20260824001_governance_domains_and_package_config.sql ==========
-- Original source: 20260824001_governance_domains_and_package_config.sql

-- ============================================================
-- Migration 20260824_governance_domains_and_package_config.sql
--
-- ADR-029 — Fase 1: Base de datos y dominio
--
-- Objetivo: crear las tablas de configuración de dominio y añadir
-- domain_id + contracted_packages a la tabla projects.
--
-- Tablas nuevas:
--   - governance_domains       (catálogo de dominios)
--   - evaluation_dimensions    (dimensiones de evaluación por dominio)
--   - governance_configurations (configuración por empresa+dominio)
--   - llm_prompt_templates     (prompts parametrizados por dominio)
--   - framework_controls       (controles regulatorios por dominio)
--
-- Cambios en projects:
--   - domain_id uuid REFERENCES governance_domains(id) [NOT NULL]
--   - contracted_packages package_id[] NOT NULL DEFAULT '{}'
--
-- Nuevo tipo enum:
--   - package_id (boost_assessment, portfolio_management, legal_compliance)
--
-- Seed: Dominio AI Adoption como primer registro en governance_domains.
-- Backfill: todos los proyectos existentes reciben domain_id + todos los paquetes.
--
-- RLS:
--   - governance_domains: SELECT público, INSERT/UPDATE/DELETE solo service_role
--   - evaluation_dimensions: SELECT público, INSERT/UPDATE/DELETE solo service_role
--   - governance_configurations: SELECT por company_id (RLS), escritura service_role
--   - llm_prompt_templates: SELECT público, INSERT/UPDATE/DELETE solo service_role
--   - framework_controls: SELECT público, INSERT/UPDATE/DELETE solo service_role
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. Enum package_id
--    Tipos de paquetes contractados por proyecto
-- ════════════════════════════════════════════════════════════════

CREATE TYPE public.package_id AS ENUM (
  'boost_assessment',
  'portfolio_management',
  'legal_compliance'
);

COMMENT ON TYPE public.package_id IS
  'Tipos de paquetes de módulos que puede contratar un proyecto: '
  '- boost_assessment: T1 + T2 + T7 '
  '- portfolio_management: T3 + T5 + T8 + T9 + T11 (consume T4) '
  '- legal_compliance: T6 + T12 (consume T4)';


-- ════════════════════════════════════════════════════════════════
-- 2. Tabla governance_domains
--    Catálogo de dominios (AI Adoption, Data Governance, etc.)
--    Lectura pública (no contiene datos sensibles).
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.governance_domains (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,          -- 'ai_adoption', 'data_governance'
  label       text NOT NULL,                 -- 'AI Adoption', 'Data Governance'
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.governance_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "governance_domains_select" ON public.governance_domains
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "governance_domains_admin_write" ON public.governance_domains
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "governance_domains_admin_update" ON public.governance_domains
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "governance_domains_admin_delete" ON public.governance_domains
  FOR DELETE TO authenticated USING (false);

COMMENT ON TABLE public.governance_domains IS
  'Catálogo de dominios disponibles (AI Adoption, Data Governance, etc.). '
  'Lectura pública; escritura solo vía service_role. Sin datos sensibles.';


-- ════════════════════════════════════════════════════════════════
-- 3. Tabla evaluation_dimensions
--    Dimensiones de evaluación por dominio
--    Lectura pública (metadatos de configuración).
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.evaluation_dimensions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES public.governance_domains(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  label       text NOT NULL,
  weight      numeric(4,3) CHECK (weight IS NULL OR (weight >= 0 AND weight <= 1)),
  sort_order  integer NOT NULL DEFAULT 0,
  UNIQUE (domain_id, slug)
);

ALTER TABLE public.evaluation_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluation_dimensions_select" ON public.evaluation_dimensions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "evaluation_dimensions_admin_write" ON public.evaluation_dimensions
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "evaluation_dimensions_admin_update" ON public.evaluation_dimensions
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "evaluation_dimensions_admin_delete" ON public.evaluation_dimensions
  FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_evaluation_dimensions_domain_id
  ON public.evaluation_dimensions (domain_id);

COMMENT ON TABLE public.evaluation_dimensions IS
  'Dimensiones de evaluación (métricas) de cada dominio. '
  'Reemplaza literales hardcodeados en código. Lectura pública; escritura service_role.';


-- ════════════════════════════════════════════════════════════════
-- 4. Tabla governance_configurations
--    Configuración de gobierno por empresa + dominio (JSONB flexible)
--    RLS por company_id — cada empresa ve solo su configuración.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.governance_configurations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain_id   uuid NOT NULL REFERENCES public.governance_domains(id) ON DELETE CASCADE,
  config      jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, domain_id)
);

ALTER TABLE public.governance_configurations ENABLE ROW LEVEL SECURITY;

-- SELECT: usuario accede si es miembro de algún proyecto de esa empresa
-- Uso de user_can_read_company() del patrón de 20260708
CREATE POLICY "governance_configurations_select" ON public.governance_configurations
  FOR SELECT TO authenticated USING (
    public.user_can_read_company(company_id)
  );

-- INSERT/UPDATE/DELETE: solo service_role (no usuarios autenticados)
CREATE POLICY "governance_configurations_admin_write" ON public.governance_configurations
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "governance_configurations_admin_update" ON public.governance_configurations
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "governance_configurations_admin_delete" ON public.governance_configurations
  FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_governance_configurations_company_id
  ON public.governance_configurations (company_id);

CREATE INDEX IF NOT EXISTS idx_governance_configurations_domain_id
  ON public.governance_configurations (domain_id);

COMMENT ON TABLE public.governance_configurations IS
  'Configuración JSONB por empresa + dominio. RLS por company_id. '
  'Contenido: parámetros de gobierno, pesos de scoring, etc. Escribible solo vía service_role.';


-- ════════════════════════════════════════════════════════════════
-- 5. Tabla llm_prompt_templates
--    Prompts de LLM parametrizados por dominio + módulo
--    Lectura pública (metadatos); escritura service_role.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.llm_prompt_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES public.governance_domains(id) ON DELETE CASCADE,
  module_slug text NOT NULL,                 -- 't1_radar', 't6_risk', etc.
  prompt_key  text NOT NULL,
  template    text NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (domain_id, module_slug, prompt_key, version)
);

ALTER TABLE public.llm_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "llm_prompt_templates_select" ON public.llm_prompt_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "llm_prompt_templates_admin_write" ON public.llm_prompt_templates
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "llm_prompt_templates_admin_update" ON public.llm_prompt_templates
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "llm_prompt_templates_admin_delete" ON public.llm_prompt_templates
  FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_llm_prompt_templates_domain_id
  ON public.llm_prompt_templates (domain_id);

CREATE INDEX IF NOT EXISTS idx_llm_prompt_templates_module_slug
  ON public.llm_prompt_templates (module_slug);

CREATE INDEX IF NOT EXISTS idx_llm_prompt_templates_active
  ON public.llm_prompt_templates (is_active) WHERE is_active = true;

COMMENT ON TABLE public.llm_prompt_templates IS
  'Prompts parametrizados para Edge Functions, versión por dominio. '
  'Reemplaza literales AI hardcodeados en código. Lectura pública; escritura service_role.';


-- ════════════════════════════════════════════════════════════════
-- 6. Tabla framework_controls
--    Controles de frameworks regulatorios/metodológicos por dominio
--    Lectura pública (metadatos); escritura service_role.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.framework_controls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES public.governance_domains(id) ON DELETE CASCADE,
  control_id  text NOT NULL,                 -- 'GPAI-1.1', 'ISO-27001-A.5.1', etc.
  label       text NOT NULL,
  description text,
  category    text,
  is_active   boolean NOT NULL DEFAULT true,
  UNIQUE (domain_id, control_id)
);

ALTER TABLE public.framework_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "framework_controls_select" ON public.framework_controls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "framework_controls_admin_write" ON public.framework_controls
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "framework_controls_admin_update" ON public.framework_controls
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "framework_controls_admin_delete" ON public.framework_controls
  FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_framework_controls_domain_id
  ON public.framework_controls (domain_id);

COMMENT ON TABLE public.framework_controls IS
  'Controles regulatorios/metodológicos (GPAI, ISO, etc.) por dominio. '
  'Metadatos de configuración. Lectura pública; escritura service_role.';


-- ════════════════════════════════════════════════════════════════
-- 7. Extender projects: agregar domain_id y contracted_packages
--
--    domain_id: permitir NULL temporalmente; se populará en paso 9.
--    contracted_packages: array de package_id, default vacío.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.governance_domains(id),
  ADD COLUMN IF NOT EXISTS contracted_packages public.package_id[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.projects.domain_id IS
  'Dominio al que pertenece este proyecto (AI Adoption, Data Governance, etc.). '
  'FK a governance_domains. Determinará qué literales de configuración aplican.';

COMMENT ON COLUMN public.projects.contracted_packages IS
  'Array de tipos de paquetes contratados. Determina qué módulos T1-T13 están disponibles. '
  'Vacío = solo acceso a T10 (plataforma) en modo preview.';


-- ════════════════════════════════════════════════════════════════
-- 8. Seed: insertar dominio AI Adoption como primer registro
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.governance_domains (slug, label, description, is_active)
VALUES (
  'ai_adoption',
  'AI Adoption',
  'Consultoría de adopción de IA - metodología L.E.A.N.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Capturar el ID del dominio AI para el backfill
DO $$
DECLARE
  v_ai_domain_id uuid;
BEGIN
  SELECT id INTO v_ai_domain_id FROM public.governance_domains WHERE slug = 'ai_adoption' LIMIT 1;

  IF v_ai_domain_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo insertar el dominio AI Adoption';
  END IF;

  -- Paso 9: Backfill de proyectos existentes con domain_id + todos los paquetes
  UPDATE public.projects
     SET domain_id = v_ai_domain_id,
         contracted_packages = ARRAY['boost_assessment', 'portfolio_management', 'legal_compliance']::public.package_id[]
   WHERE domain_id IS NULL;

  -- Ahora hacer domain_id NOT NULL (todos los proyectos ya tienen valor)
  ALTER TABLE public.projects ALTER COLUMN domain_id SET NOT NULL;

END $$;


-- ════════════════════════════════════════════════════════════════
-- 10. Índices para performance en queries de projects
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_projects_domain_id
  ON public.projects (domain_id);

CREATE INDEX IF NOT EXISTS idx_projects_contracted_packages
  ON public.projects USING GIN (contracted_packages);


-- ════════════════════════════════════════════════════════════════
-- Fin de la migración
-- Verificación post-migración:
--   1. SELECT count(*) FROM governance_domains; → 1
--   2. SELECT count(*) FROM projects; → debe ser > 0 con domain_id NOT NULL
--   3. SELECT DISTINCT contracted_packages FROM projects; → debe tener valores
-- ════════════════════════════════════════════════════════════════


-- ========== 20260824002_seed_framework_controls.sql ==========
-- Original source: 20260824002_seed_framework_controls.sql

-- ADR-029 Fase 5 — TIPO 3: Seed de framework_controls para dominio AI Adoption
--
-- Propósito: Poblar framework_controls con los 15 labels de AI Act (Tipo A)
-- que se parametrizan por dominio en T6 y T4.
--
-- Labels incluidos:
-- T6: ai_act_dashboard, ai_act_risk, ai_act_coverage, ai_act_risk_evaluation,
--     ai_act_risk_subtitle, ai_act_policy_subtitle, ai_act_governance_subtitle
-- T4: ai_act_badge, ai_act_tab, ai_act_tooltip, ai_act_empty, ai_act_risk_level,
--     ai_act_prohibited, ai_act_no_obligations, ai_act_classification
--
-- Fecha: 2026-08-24
-- Estado: Ready for review

-- T6 — Risk Governance labels
INSERT INTO framework_controls
  (domain_id, control_id, label, category, is_active)
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_dashboard',
  'Dashboard AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_risk',
  'Riesgo AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_coverage',
  'Cobertura de clasificación AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_risk_evaluation',
  'Evaluación de riesgos regulatorios IA (AI Act)',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_risk_subtitle',
  'Recomendaciones de gobernanza basadas en tu exposición AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_policy_subtitle',
  'Política corporativa de IA conforme a EU AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_governance_subtitle',
  'Marco de gobernanza y compliance regulatorio',
  'regulatory',
  true
-- T4 — Use Case Priority Board labels
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_badge',
  'AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_tab',
  'AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_tooltip',
  'Ver clasificación AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_empty',
  'Sin clasificación AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_risk_level',
  'Nivel de riesgo EU AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_prohibited',
  'Sistema potencialmente prohibido — Art. 5 AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_no_obligations',
  'Sin obligaciones regulatorias específicas del AI Act. Se recomienda documentar el uso en el catálogo corporativo de IA como buena práctica de gobernanza.',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_classification',
  'Clasificación AI Act',
  'regulatory',
  true
ON CONFLICT (domain_id, control_id) DO NOTHING;


-- ========== 20260824003_seed_llm_prompt_templates.sql ==========
-- Original source: 20260824003_seed_llm_prompt_templates.sql

-- ADR-029 Fase 5 — TIPO 4: Migración de prompts LLM hardcodeados a BD
--
-- Objetivo: Poblart llm_prompt_templates con prompts iniciales del dominio AI Adoption
-- Prompts: T1 (Maturity Radar) y T6 (Risk Governance / Policy Generator)
--
-- Literal AI-specific sustiuidos por placeholders {{domain_label}}:
-- - T1: "adopción estratégica de IA" → "{{domain_label}}"
-- - T1: "evaluación de madurez IA" → "evaluación de madurez {{domain_label}}"
-- - T1: "madurez IA" → "madurez {{domain_label}}"
-- - T6: "gobernanza de IA" → "gobernanza {{domain_label}}"
-- - T6: "adopción de IA" → "adopción {{domain_label}}"
-- - T6: "EU AI Act" → "{{framework_name}}" (mantiene nombre framework como es, no es dominio)
--
-- Fecha: 2026-08-24
-- Estado: Ready for review

-- T1 Radar — System Prompt
INSERT INTO llm_prompt_templates
  (domain_id, module_slug, prompt_key, template, version, is_active)
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  't1_radar',
  'system_prompt',
  'Eres un consultor senior especializado en {{domain_label}} estratégica en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar una evaluación de madurez {{domain_label}} (escala 0–4) y generar recomendaciones ejecutivas específicas, priorizadas y accionables.

PRINCIPIOS DE TRABAJO:
1. Las recomendaciones deben ser específicas al sector, tamaño y ecosistema tecnológico de la empresa.
2. Prioriza las brechas críticas, no las dimensiones que ya funcionan bien.
3. Si hay brecha IT/Negocio significativa (diferencia > 0.5 puntos), debe aparecer en las recomendaciones.
4. Conecta dimensiones relacionadas cuando la solución es la misma (no repitas acciones similares).
5. Usa lenguaje ejecutivo directo. El destinatario es un CIO o COO, no un técnico.
6. Si el ecosistema tecnológico es específico (Microsoft, SAP, Salesforce...), recomienda dentro de ese ecosistema cuando sea posible.
7. El horizonte temporal debe ser coherente con el horizonte de valor declarado por la empresa.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: strategy|data|technology|talent|processes|governance",
      "rationale": "Por qué esta acción es prioritaria para ESTA empresa específicamente (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en esta evaluación, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor impacto potencial.',
  1,
  true
ON CONFLICT (domain_id, module_slug, prompt_key, version) DO NOTHING;

-- T6 Risk Governance — System Prompt (Policy Generator)
INSERT INTO llm_prompt_templates
  (domain_id, module_slug, prompt_key, template, version, is_active)
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  't6_risk',
  'system_prompt',
  'Eres un experto en gobernanza {{domain_label}} y derecho tecnológico europeo. Tu tarea es redactar una política corporativa de {{domain_label}} personalizada, aplicando el marco de la EU AI Act y las mejores prácticas del sector indicado.

INSTRUCCIONES DE RESPUESTA:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.
- Todos los campos son obligatorios.
- Redacta en español formal, con lenguaje corporativo preciso.
- Adapta cada sección al sector, tamaño de empresa y objetivo de {{domain_label}} específicos del contexto.

SCHEMA JSON OBLIGATORIO:
{
  "declaracion_opening": "Párrafo de apertura de la declaración de intenciones (3-4 frases). Contextualiza la política en el sector específico y menciona el compromiso con la EU AI Act.",
  "declaracion_mandate": "Párrafo del mandato de registro y evaluación (2-3 frases). Indica qué sistemas requieren evaluación de riesgo y quién es responsable.",
  "alcance_context": "Párrafo de contexto del alcance para este sector/empresa (3-4 frases). Define perimetrialmente qué sistemas y procesos quedan dentro y fuera de la política.",
  "principios": [
    { "title": "Nombre del principio", "desc": "Descripción de 2-3 frases aplicada específicamente al sector" }
  ],
  "contexto_sectorial": "Párrafo sobre riesgos regulatorios y oportunidades específicos del sector bajo la EU AI Act (3-4 frases). Menciona categorías de riesgo relevantes y normativa sectorial aplicable."
}

PRINCIPIOS: genera EXACTAMENTE 6 principios cubriendo: transparencia, responsabilidad, equidad, privacidad, supervisión humana, mejora continua.',
  1,
  true
ON CONFLICT (domain_id, module_slug, prompt_key, version) DO NOTHING;


-- ========== 20260825001_create_project_rpc_add_domain_id.sql ==========
-- Original source: 20260825001_create_project_rpc_add_domain_id.sql

-- ============================================================
-- Migration: Actualizar create_project RPC para aceptar domain_id
-- Fecha: 2026-08-25
--
-- PROPÓSITO:
--   Extender el RPC public.create_project() para aceptar domain_id
--   como parámetro obligatorio. Esto permite al cliente (ProjectsTab)
--   seleccionar el dominio al crear un proyecto.
--
--   Firma anterior (20260602):
--     create_project(uuid, text, text) → (p_company_id, p_name, p_phase)
--
--   Firma nueva:
--     create_project(uuid, text, uuid, text) → (p_company_id, p_name, p_domain_id, p_phase)
--
--   El parámetro p_domain_id es obligatorio (NOT NULL).
--   Validamos que exista en governance_domains.
--
-- ============================================================

-- ── Función principal actualizada ────────────────────────────
CREATE OR REPLACE FUNCTION public.create_project(
  p_company_id uuid    DEFAULT NULL,
  p_name       text    DEFAULT NULL,
  p_domain_id  uuid    DEFAULT NULL,
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
  v_domain_exists boolean;
BEGIN
  -- ── Autorización explícita ─────────────────────────────────────
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

  -- ── Asignar dominio por defecto (ai_adoption) si no se pasa ──────────
  IF p_domain_id IS NULL THEN
    SELECT id INTO p_domain_id
    FROM public.governance_domains
    WHERE slug = 'ai_adoption' AND is_active = true
    LIMIT 1;

    IF p_domain_id IS NULL THEN
      RAISE EXCEPTION 'create_project: no se pudo obtener el dominio por defecto (ai_adoption)';
    END IF;
  ELSE
    -- Validar que el dominio pasado existe
    SELECT EXISTS (
      SELECT 1 FROM public.governance_domains WHERE id = p_domain_id
    ) INTO v_domain_exists;

    IF NOT v_domain_exists THEN
      RAISE EXCEPTION 'create_project: domain_id % no existe en governance_domains', p_domain_id;
    END IF;
  END IF;

  -- ── Crear el proyecto ──────────────────────────────────────────
  INSERT INTO public.projects (
    id,
    name,
    owner_id,
    company_id,
    domain_id,
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
    p_domain_id,
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

COMMENT ON FUNCTION public.create_project(uuid, text, uuid, text) IS
  'Crea un proyecto con domain_id obligatorio. '
  'Solo superadmin y consultant pueden invocarla. '
  'SECURITY DEFINER para escribir en project_members sin conflicto de RLS. '
  'Firma actualizada en migración 20260825 — antes no aceptaba domain_id.';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.create_project(uuid, text, uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_project(uuid, text, uuid, text) TO authenticated;


-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'create_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260825 OK] create_project actualizado con p_domain_id';
  ELSE
    RAISE EXCEPTION '[20260825 FAIL] create_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;


-- ========== 20260825002_framework_controls_is_active.sql ==========
-- Original source: 20260825002_framework_controls_is_active.sql

-- ADR-029 Fase 5 — ADD COLUMN is_active a framework_controls
--
-- Propósito: Agregar columna is_active que faltaba en la definición
-- original de framework_controls. El seed 20260825 ya la referencia,
-- así que esta migración debe aplicarse antes del seed.
--
-- Idempotente: usa IF NOT EXISTS para poder re-ejecutarse sin error.

ALTER TABLE public.framework_controls
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.framework_controls.is_active IS
  'Flag para deshabilitar un control sin borrarlo (soft-delete pattern). '
  'Default true = control activo. Usado en queries y seeds como predicado.';


-- ========== 20260827001_projects_extended_fields.sql ==========
-- Original source: 20260827001_projects_extended_fields.sql

-- Add extended fields to projects table for objective, constraints, timeframe, and tech ecosystem
-- Aligns with ADR-029 multi-domain feature: these fields are domain-aware and populated during project creation
-- fricciones_oportunidades: JSONB array of friction objects with structure: {id, tipo, areaFuncional, frecuencia, impacto, notas}

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS objetivo_principal TEXT,
  ADD COLUMN IF NOT EXISTS restricciones TEXT,
  ADD COLUMN IF NOT EXISTS fricciones_oportunidades JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS horizonte_valor TEXT,
  ADD COLUMN IF NOT EXISTS ecosistema_tecnologico TEXT,
  ADD COLUMN IF NOT EXISTS areas_prioritarias TEXT[] DEFAULT '{}'::TEXT[];


-- ========== 20260827002_contracted_packages_default_all.sql ==========
-- Original source: 20260827002_contracted_packages_default_all.sql

-- ============================================================
-- 20260827002 — contracted_packages: default todos los paquetes
--
-- Problema: el default anterior era '{}' (vacío), por lo que
-- proyectos nuevos no tenían paquetes y el sidebar solo mostraba
-- T4 y T10 (PLATFORM + SHARED_KERNEL).
--
-- Fix: cambiar el DEFAULT a todos los paquetes actuales para que
-- proyectos nuevos tengan acceso completo desde el primer momento.
-- Los proyectos existentes vacíos también se actualizan.
--
-- Los paquetes disponibles son:
--   boost_assessment      → T1 · T2 · T7
--   portfolio_management  → T3 · T5 · T8 · T9 · T11
--   legal_compliance      → T6 · T12
-- ============================================================

-- 1. Cambiar el default de la columna
ALTER TABLE public.projects
  ALTER COLUMN contracted_packages
  SET DEFAULT ARRAY['boost_assessment','portfolio_management','legal_compliance']::public.package_id[];

-- 2. Rellenar proyectos existentes que quedaron con array vacío
UPDATE public.projects
SET contracted_packages = ARRAY['boost_assessment','portfolio_management','legal_compliance']::public.package_id[]
WHERE contracted_packages = '{}';

COMMENT ON COLUMN public.projects.contracted_packages IS
  'Paquetes contratados por el cliente. Default: todos los paquetes disponibles. '
  'Editable desde ProjectDetailView (solo superadmin/consultant).';


-- ========== 20260827003_companies_contracted_packages.sql ==========
-- Original source: 20260827003_companies_contracted_packages.sql

-- ============================================================
-- 20260827003 — companies.contracted_packages
--
-- Añade contracted_packages a companies para definir los planes
-- habilitados a nivel empresa (aplica como default a proyectos nuevos).
--
-- El campo per-proyecto en projects.contracted_packages sigue como
-- override individual. usePermissions lee desde projects (ya funciona).
-- La UI "Planes" en CompanyProfile edita este campo de empresa.
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS contracted_packages public.package_id[]
    NOT NULL DEFAULT ARRAY['boost_assessment','portfolio_management','legal_compliance']::public.package_id[];

COMMENT ON COLUMN public.companies.contracted_packages IS
  'Planes contratados a nivel empresa. Determina las herramientas disponibles '
  'para todos los proyectos de esta empresa. Editable en la UI "Planes".';


-- ========== 20260827004_create_project_rpc_extended_fields.sql ==========
-- Original source: 20260827004_create_project_rpc_extended_fields.sql

-- ============================================================
-- Migration: Extender create_project RPC con campos de objetivo/restricciones/horizonte/ecosistema/fricciones
-- Fecha: 2026-08-27
--
-- PROPÓSITO:
--   Extender public.create_project() para aceptar 5 parámetros opcionales:
--   - p_objetivo_principal: objetivo del proyecto
--   - p_restricciones: restricciones identificadas
--   - p_horizonte_valor: plazo esperado (Corto/Medio/Largo)
--   - p_ecosistema_tecnologico: stack tecnológico principal (dinámico según dominio)
--   - p_fricciones_oportunidades: fricciones y oportunidades de IA/transformación
--
--   Firma anterior (20260825):
--     create_project(uuid, text, uuid, text) → (p_company_id, p_name, p_domain_id, p_phase)
--
--   Firma nueva:
--     create_project(uuid, text, uuid, text, text, text, text, text, text)
--     → (p_company_id, p_name, p_domain_id, p_phase, p_objetivo_principal,
--        p_restricciones, p_horizonte_valor, p_ecosistema_tecnologico, p_fricciones_oportunidades)
--
--   Los 5 nuevos parámetros son opcionales (DEFAULT NULL).
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_project(
  p_company_id uuid    DEFAULT NULL,
  p_name       text    DEFAULT NULL,
  p_domain_id  uuid    DEFAULT NULL,
  p_phase      text    DEFAULT 'listen',
  p_objetivo_principal text DEFAULT NULL,
  p_restricciones text DEFAULT NULL,
  p_horizonte_valor text DEFAULT NULL,
  p_ecosistema_tecnologico text DEFAULT NULL,
  p_fricciones_oportunidades text DEFAULT NULL
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
  v_domain_exists boolean;
BEGIN
  -- ── Autorización explícita ─────────────────────────────────────
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

  -- ── Asignar dominio por defecto (ai_adoption) si no se pasa ──────────
  IF p_domain_id IS NULL THEN
    SELECT id INTO p_domain_id
    FROM public.governance_domains
    WHERE slug = 'ai_adoption' AND is_active = true
    LIMIT 1;

    IF p_domain_id IS NULL THEN
      RAISE EXCEPTION 'create_project: no se pudo obtener el dominio por defecto (ai_adoption)';
    END IF;
  ELSE
    -- Validar que el dominio pasado existe
    SELECT EXISTS (
      SELECT 1 FROM public.governance_domains WHERE id = p_domain_id
    ) INTO v_domain_exists;

    IF NOT v_domain_exists THEN
      RAISE EXCEPTION 'create_project: domain_id % no existe en governance_domains', p_domain_id;
    END IF;
  END IF;

  -- ── Crear el proyecto ──────────────────────────────────────────
  INSERT INTO public.projects (
    id,
    name,
    owner_id,
    company_id,
    domain_id,
    status,
    current_phase,
    objetivo_principal,
    restricciones,
    horizonte_valor,
    ecosistema_tecnologico,
    fricciones_oportunidades,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    trim(p_name),
    auth.uid(),
    p_company_id,
    p_domain_id,
    'active',
    p_phase,
    CASE WHEN p_objetivo_principal IS NOT NULL THEN trim(p_objetivo_principal) ELSE NULL END,
    CASE WHEN p_restricciones IS NOT NULL THEN trim(p_restricciones) ELSE NULL END,
    CASE WHEN p_horizonte_valor IS NOT NULL THEN trim(p_horizonte_valor) ELSE NULL END,
    CASE WHEN p_ecosistema_tecnologico IS NOT NULL THEN trim(p_ecosistema_tecnologico) ELSE NULL END,
    CASE WHEN p_fricciones_oportunidades IS NOT NULL THEN p_fricciones_oportunidades::jsonb ELSE '[]'::JSONB END,
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

COMMENT ON FUNCTION public.create_project(uuid, text, uuid, text, text, text, text, text, text) IS
  'Crea un proyecto con domain_id obligatorio y 5 campos opcionales de contexto. '
  'p_fricciones_oportunidades es JSONB array de {id, tipo, areaFuncional, frecuencia, impacto, notas}. '
  'Solo superadmin y consultant pueden invocarla. '
  'SECURITY DEFINER para escribir en project_members sin conflicto de RLS. '
  'Firma extendida en migración 20260827 — antes aceptaba solo (uuid, text, uuid, text).';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.create_project(uuid, text, uuid, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_project(uuid, text, uuid, text, text, text, text, text, text) TO authenticated;


-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'create_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260827 OK] create_project extendido con 5 campos opcionales';
  ELSE
    RAISE EXCEPTION '[20260827 FAIL] create_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;


-- ========== 20260828001_seed_transformacion_digital_domain.sql ==========
-- Original source: 20260828001_seed_transformacion_digital_domain.sql

-- ============================================================
-- Transformación Digital — Seed data para governance_domains y evaluation_dimensions
-- ADR-029 Fase 5: Multi-Domain Generalization
--
-- Objetivo: Insertar metadatos del dominio "Transformación Digital"
-- en las tablas de configuración creadas en 20260824_governance_domains_and_package_config.sql
--
-- Estructura: 1 governance_domain + 6 evaluation_dimensions (una por D1-D6)
--
-- Contexto (2026-08-28): el dominio Transformación Digital nunca se insertó
-- en producción — solo existía como spec de referencia en
-- docs/domains/transformacion-digital-seed.sql. Por eso ningún proyecto
-- podía usar realmente el dominio TD (el selector de dominios lee
-- governance_domains directamente) y todas las pantallas domain-aware
-- (incluido T10) caían siempre al fallback de AI Adoption. Esta migración
-- aplica esa spec para que el dominio exista de verdad.
--
-- Idempotente: usa ON CONFLICT DO NOTHING en ambos INSERTs.
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. Insertar dominio Transformación Digital
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.governance_domains (slug, label, description, is_active)
VALUES (
  'transformacion_digital',
  'Transformación Digital',
  'Consultoría de madurez en transformación digital — modernización de infraestructura, ' ||
  'datos, experiencia de cliente y gobernanza del cambio. Complementario a AI Adoption: ' ||
  'es la base digital que habilita iniciativas de IA a escala.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Capturar el ID del dominio para el resto de inserts
-- (reutiliza el mismo patrón que 20260824 para el dominio AI Adoption)


-- ════════════════════════════════════════════════════════════════
-- 2. Insertar 6 dimensiones de evaluación para Transformación Digital
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_td_domain_id uuid;
BEGIN
  -- Obtener ID del dominio Transformación Digital
  SELECT id INTO v_td_domain_id
    FROM public.governance_domains
    WHERE slug = 'transformacion_digital'
    LIMIT 1;

  IF v_td_domain_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo encontrar el dominio Transformación Digital. '
                    'Verifica que el INSERT anterior completó exitosamente.';
  END IF;

  -- ── D1: Visión y Liderazgo Digital ──────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'digital_vision', 'Visión y Liderazgo Digital', 0.20, 1)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D2: Datos y Analítica ──────────────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'data_analytics', 'Datos y Analítica', 0.16, 2)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D3: Infraestructura y Cloud ────────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'infrastructure_cloud', 'Infraestructura y Cloud', 0.16, 3)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D4: Talento y Cultura Digital ──────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'talent_culture', 'Talento y Cultura Digital', 0.18, 4)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D5: Experiencia de Cliente ─────────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'customer_experience', 'Experiencia de Cliente y Canales Digitales', 0.16, 5)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D6: Gobernanza y Gestión del Cambio ───────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'governance_change', 'Gobernanza y Gestión del Cambio', 0.14, 6)
  ON CONFLICT (domain_id, slug) DO NOTHING;

END $$;


-- ════════════════════════════════════════════════════════════════
-- 3. Verificación
-- ════════════════════════════════════════════════════════════════

-- Confirmar que el seed se aplicó correctamente:
-- SELECT slug, label FROM public.governance_domains WHERE slug = 'transformacion_digital';
-- SELECT d.label, ed.label, ed.weight
--   FROM public.governance_domains d
--   LEFT JOIN public.evaluation_dimensions ed ON d.id = ed.domain_id
--   WHERE d.slug = 'transformacion_digital'
--   ORDER BY ed.sort_order;

COMMENT ON TABLE public.governance_domains IS
  'Catálogo de dominios disponibles (AI Adoption, Transformación Digital, etc.). '
  'Lectura pública; escritura solo vía service_role. Sin datos sensibles.';

COMMENT ON TABLE public.evaluation_dimensions IS
  'Dimensiones de evaluación (métricas) de cada dominio. '
  'Reemplaza literales hardcodeados en código. Lectura pública; escritura service_role.';


-- ========== 20260829001_delete_project_rpc.sql ==========
-- Original source: 20260829001_delete_project_rpc.sql

-- ============================================================
-- Migration: Crear RPC delete_project para eliminar proyectos
-- Fecha: 2026-08-28
--
-- PROPÓSITO:
--   Permitir que superadmin/consultant eliminen proyectos.
--   Limpia project_members y company_profiles asociados.
--   Solo el propietario o un superadmin pueden eliminar.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_project_owner uuid;
BEGIN
  -- ── Autorización ──────────────────────────────────────────────
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'delete_project: usuario no autenticado o sin perfil en public.profiles';
  END IF;

  IF v_caller_role NOT IN ('superadmin', 'consultant') THEN
    RAISE EXCEPTION 'delete_project: acceso denegado. Rol % no está autorizado a eliminar proyectos.', v_caller_role;
  END IF;

  -- ── Validar que el proyecto existe ─────────────────────────────
  SELECT owner_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL THEN
    RAISE EXCEPTION 'delete_project: proyecto % no existe', p_project_id;
  END IF;

  -- ── Autorización a nivel de proyecto ────────────────────────────
  IF v_caller_role = 'consultant' AND v_project_owner != auth.uid() THEN
    RAISE EXCEPTION 'delete_project: consultant solo puede eliminar sus propios proyectos';
  END IF;

  -- ── Limpiar datos asociados ────────────────────────────────────
  -- Eliminar company_profiles asociados al proyecto
  DELETE FROM public.company_profiles
  WHERE engagement_id = p_project_id;

  -- Eliminar project_members asociados
  DELETE FROM public.project_members
  WHERE project_id = p_project_id;

  -- ── Eliminar el proyecto ──────────────────────────────────────
  DELETE FROM public.projects
  WHERE id = p_project_id;
END;
$$;

COMMENT ON FUNCTION public.delete_project(uuid) IS
  'Elimina un proyecto y sus datos asociados (company_profiles, project_members). '
  'Superadmin puede eliminar cualquier proyecto. '
  'Consultant solo puede eliminar sus propios proyectos.';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.delete_project(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_project(uuid) TO authenticated;

-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'delete_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260828 OK] delete_project creado con limpieza de datos asociados';
  ELSE
    RAISE EXCEPTION '[20260828 FAIL] delete_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;


-- ========== 20260829002_update_project_rpc.sql ==========
-- Original source: 20260829002_update_project_rpc.sql

-- ============================================================
-- Migration: Crear RPC update_project para editar proyectos
-- Fecha: 2026-08-28
--
-- PROPÓSITO:
--   Permitir que superadmin/consultant actualicen campos de un proyecto:
--   - name
--   - objetivo_principal
--   - restricciones
--   - horizonte_valor
--   - ecosistema_tecnologico
--   - fricciones_oportunidades (JSONB array)
--   - areas_prioritarias (TEXT[] de nombres de departamentos)
--
--   Solo el propietario del proyecto o un superadmin puede actualizarlo.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_project(
  p_project_id uuid,
  p_name text DEFAULT NULL,
  p_objetivo_principal text DEFAULT NULL,
  p_restricciones text DEFAULT NULL,
  p_horizonte_valor text DEFAULT NULL,
  p_ecosistema_tecnologico text DEFAULT NULL,
  p_fricciones_oportunidades text DEFAULT NULL,
  p_areas_prioritarias text[] DEFAULT NULL
)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_project_owner uuid;
  v_project projects;
BEGIN
  -- ── Autorización ──────────────────────────────────────────────
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'update_project: usuario no autenticado o sin perfil en public.profiles';
  END IF;

  IF v_caller_role NOT IN ('superadmin', 'consultant') THEN
    RAISE EXCEPTION 'update_project: acceso denegado. Rol % no está autorizado a actualizar proyectos.', v_caller_role;
  END IF;

  -- ── Validar que el proyecto existe ─────────────────────────────
  SELECT owner_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL THEN
    RAISE EXCEPTION 'update_project: proyecto % no existe', p_project_id;
  END IF;

  -- ── Autorización a nivel de proyecto ────────────────────────────
  -- Superadmin puede actualizar cualquier proyecto
  -- Consultant solo puede actualizar sus propios proyectos
  IF v_caller_role = 'consultant' AND v_project_owner != auth.uid() THEN
    RAISE EXCEPTION 'update_project: consultant solo puede actualizar sus propios proyectos';
  END IF;

  -- ── Actualizar campos ──────────────────────────────────────────
  UPDATE public.projects
  SET
    name = CASE WHEN p_name IS NOT NULL AND p_name != '' THEN p_name ELSE name END,
    objetivo_principal = CASE WHEN p_objetivo_principal IS NOT NULL THEN trim(p_objetivo_principal) ELSE objetivo_principal END,
    restricciones = CASE WHEN p_restricciones IS NOT NULL THEN trim(p_restricciones) ELSE restricciones END,
    horizonte_valor = CASE WHEN p_horizonte_valor IS NOT NULL AND p_horizonte_valor != '' THEN p_horizonte_valor ELSE horizonte_valor END,
    ecosistema_tecnologico = CASE WHEN p_ecosistema_tecnologico IS NOT NULL AND p_ecosistema_tecnologico != '' THEN p_ecosistema_tecnologico ELSE ecosistema_tecnologico END,
    fricciones_oportunidades = CASE WHEN p_fricciones_oportunidades IS NOT NULL THEN p_fricciones_oportunidades::jsonb ELSE fricciones_oportunidades END::jsonb,
    areas_prioritarias = CASE WHEN p_areas_prioritarias IS NOT NULL AND array_length(p_areas_prioritarias, 1) > 0 THEN p_areas_prioritarias ELSE areas_prioritarias END,
    updated_at = now()
  WHERE id = p_project_id
  RETURNING * INTO v_project;

  RETURN v_project;
END;
$$;

COMMENT ON FUNCTION public.update_project(uuid, text, text, text, text, text, text, text[]) IS
  'Actualiza campos de un proyecto existente. '
  'Superadmin puede actualizar cualquier proyecto. '
  'Consultant solo puede actualizar sus propios proyectos. '
  'p_fricciones_oportunidades es JSONB array de fricciones estructuradas.';

-- ── Permisos ──────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.update_project(uuid, text, text, text, text, text, text, text[]) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_project(uuid, text, text, text, text, text, text, text[]) TO authenticated;

-- ── Verificación post-migration ───────────────────────────────────
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name   = 'update_project'
      AND routine_type   = 'FUNCTION'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '[20260828 OK] update_project creado con soporte para fricciones JSONB';
  ELSE
    RAISE EXCEPTION '[20260828 FAIL] update_project no encontrado tras CREATE OR REPLACE';
  END IF;
END $$;


-- ========== 20260829003_fix_update_project_ambiguity.sql ==========
-- Original source: 20260829003_fix_update_project_ambiguity.sql

-- ============================================================
-- Migration: Eliminar función update_project ambigua (jsonb)
-- Fecha: 2026-08-28
--
-- PROBLEMA:
--   Existen dos versiones de update_project con firmas conflictivas:
--   1. p_fricciones_oportunidades => jsonb (vieja, causa ambigüedad)
--   2. p_fricciones_oportunidades => text (nueva, correcta)
--
--   PostgreSQL no puede elegir cuál usar. Esta migración elimina la vieja.
--
-- ============================================================

-- Eliminar la versión vieja con jsonb
DROP FUNCTION IF EXISTS public.update_project(
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text[]
) CASCADE;

-- Verificación post-migration
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname = 'update_project'
    AND pg_get_function_identity_arguments(oid) LIKE '%text[]%';

  IF v_count = 1 THEN
    RAISE NOTICE '[20260828 FIX OK] update_project eliminada versión jsonb. Queda solo versión text.';
  ELSE
    RAISE EXCEPTION '[20260828 FIX FAIL] Se esperaba 1 función update_project con text[], se encontraron %', v_count;
  END IF;
END $$;


-- ========== 20260903152412_create_application_texts_table.sql ==========
-- Original source: 20260903152412_create_application_texts_table.sql



-- ========== 20260903_add_text_columns.sql ==========
-- Original source: 20260903_add_text_columns.sql

-- Add new columns for filename and text_generalizado
ALTER TABLE public.application_texts
ADD COLUMN IF NOT EXISTS filename TEXT,
ADD COLUMN IF NOT EXISTS text_generalizado TEXT NOT NULL DEFAULT '[Sin especificar]';

-- Migrate data from text_es to filename and text_generalizado
UPDATE public.application_texts
SET
  filename = COALESCE(filename, text_es, tool_module || '_' || text_key),
  text_generalizado = COALESCE(NULLIF(text_generalizado, '[Sin especificar]'), text_es, '[Sin especificar]')
WHERE text_es IS NOT NULL;

-- Verify migration
SELECT
  COUNT(*) as total_rows,
  COUNT(filename) as rows_with_filename,
  COUNT(text_generalizado) as rows_with_text_generalizado,
  COUNT(text_es) as rows_with_old_text_es
FROM public.application_texts;

-- Show sample
SELECT tool_module, text_key, filename, text_generalizado, text_es
FROM public.application_texts
LIMIT 5;


-- ========== 20260903_app_labels_overrides.sql ==========
-- Original source: 20260903_app_labels_overrides.sql

﻿CREATE TABLE app_labels_overrides (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tool_code TEXT NOT NULL,
  field_key TEXT NOT NULL,
  label_es TEXT NOT NULL,
  label_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, tool_code, field_key)
);

ALTER TABLE app_labels_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proyecto owner puede ver sus overrides"
ON app_labels_overrides FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = app_labels_overrides.project_id
    AND p.created_by = auth.uid()
  )
);


-- ========== 20260903_fill_application_texts_defaults.sql ==========
-- Original source: 20260903_fill_application_texts_defaults.sql

-- Fill empty filename with tool_module + text_key
UPDATE public.application_texts
SET filename = COALESCE(
  NULLIF(filename, ''),
  tool_module || '_' || text_key
)
WHERE filename IS NULL OR filename = '';

-- Fill empty text_generalizado with a default message
UPDATE public.application_texts
SET text_generalizado = COALESCE(
  NULLIF(text_generalizado, ''),
  '[Sin especificar]'
)
WHERE text_generalizado IS NULL OR text_generalizado = '';

-- Verify results
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN filename IS NOT NULL THEN 1 END) as with_filename,
  COUNT(CASE WHEN text_generalizado IS NOT NULL THEN 1 END) as with_text_generalizado
FROM public.application_texts;


-- ========== 20260903_rls_application_texts.sql ==========
-- Original source: 20260903_rls_application_texts.sql

-- Enable RLS on application_texts
ALTER TABLE public.application_texts ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read application_texts (global texts)
CREATE POLICY "Authenticated users can read application_texts"
  ON public.application_texts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only superadmin/admin can update application_texts
CREATE POLICY "Admins can update application_texts"
  ON public.application_texts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND (public.profiles.role = 'superadmin' OR public.profiles.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND (public.profiles.role = 'superadmin' OR public.profiles.role = 'admin')
    )
  );


-- ========== 20260904_fix_application_texts_semantics.sql ==========
-- Original source: 20260904_fix_application_texts_semantics.sql

-- Fix semantic errors in application_texts table
-- 1. Rename text_generalizado to text_override (it's the override value, not generalized text)
-- 2. Drop the old columns no longer needed
-- 3. Ensure filename contains real file:line references, not module_key concatenations

-- Add new text_override column (if not already exists from previous migration)
ALTER TABLE public.application_texts
ADD COLUMN IF NOT EXISTS text_override TEXT;

-- Migrate existing data: if text_generalizado exists and is not '[Sin especificar]', move to text_override
UPDATE public.application_texts
SET text_override = NULLIF(text_generalizado, '[Sin especificar]')
WHERE text_generalizado IS NOT NULL AND text_generalizado != '[Sin especificar]';

-- For now, reset filename to empty so it can be properly populated with file:line values
-- This will be filled via a separate data migration or manual update
UPDATE public.application_texts
SET filename = NULL
WHERE filename IS NOT NULL AND filename LIKE '%_%';

-- Drop the old text_generalizado column (if this is a future migration, else comment out)
-- ALTER TABLE public.application_texts DROP COLUMN IF EXISTS text_generalizado;

-- Verify migration
SELECT
  COUNT(*) as total_rows,
  COUNT(CASE WHEN text_override IS NOT NULL THEN 1 END) as rows_with_override,
  COUNT(CASE WHEN filename IS NOT NULL THEN 1 END) as rows_with_filename
FROM public.application_texts;


-- ========== 20260904_refactor_application_texts_data.sql ==========
-- Original source: 20260904_refactor_application_texts_data.sql

-- Refactor application_texts data: clean up incorrect filename values
-- and prepare for proper seed data with file:line references
--
-- Current issue (ADR-??? BKL-XXX):
--   - filename column has incorrect values like "Admin_\"<text_key>\"" or "module_key"
--   - These should be replaced with actual file:line references (e.g., "AdminView.tsx:154")
--   - text_override column should be null for all entries (users set overrides in admin panel)
--
-- This migration:
--   1. Resets filename to NULL (will be populated by proper seed script)
--   2. Moves any existing text_generalizado to text_override if it's not a placeholder
--   3. Cleans up the table for fresh seed data

-- Reset all filenames to NULL (they will be populated with proper file:line values)
UPDATE public.application_texts
SET filename = NULL
WHERE filename IS NOT NULL;

-- Move text_generalizado to text_override (if it exists and is not a placeholder)
UPDATE public.application_texts
SET text_override = NULLIF(text_generalizado, '[Sin especificar]')
WHERE text_generalizado IS NOT NULL
  AND text_generalizado != '[Sin especificar]'
  AND text_override IS NULL;

-- Log the cleanup
SELECT
  COUNT(*) as total_rows,
  COUNT(CASE WHEN filename IS NULL THEN 1 END) as rows_with_null_filename,
  COUNT(CASE WHEN text_override IS NOT NULL THEN 1 END) as rows_with_override
FROM public.application_texts;


-- ========== End of Consolidated Schema ==========

-- Commit transaction
COMMIT;

-- ========== Post-Consolidation Notes ==========
--
-- 1. All migrations have been sequentially included
-- 2. Transaction wraps entire schema for atomicity
-- 3. Idempotent: safe to run multiple times
-- 4. Seed data is included (domains, controls, templates)
--
-- Verification queries (run after importing):
--
--   SELECT COUNT(*) as table_count
--   FROM information_schema.tables
--   WHERE table_schema = 'public';
--
--   SELECT COUNT(*) as function_count
--   FROM information_schema.routines
--   WHERE routine_schema = 'public';
--
--   SELECT COUNT(*) as index_count
--   FROM information_schema.indexes
--   WHERE schemaname = 'public';
--
-- ============================================================
Schema consolidated to: supabase/schema.sql

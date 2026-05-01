-- ============================================================
-- LEAN AI System Enterprise — Migración 002: Snapshots longitudinales
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

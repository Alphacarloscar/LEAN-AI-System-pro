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

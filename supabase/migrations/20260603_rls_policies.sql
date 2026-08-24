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

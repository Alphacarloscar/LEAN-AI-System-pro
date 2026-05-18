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

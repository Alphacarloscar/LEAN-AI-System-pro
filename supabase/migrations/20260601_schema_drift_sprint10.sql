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

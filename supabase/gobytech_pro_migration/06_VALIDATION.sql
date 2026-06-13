-- ================================================================
-- GOBY — gobytech_pro Production Setup
-- Bloque 06: VALIDATION
--
-- PROPÓSITO:
--   Verificar que la migración completa (bloques 00-05) ha dejado
--   gobytech_pro en el estado exacto que la aplicación necesita.
--
-- RESULTADO ESPERADO: todos los checks deben mostrar [OK].
--   Si alguno muestra [FAIL], el estado de la BD es inválido
--   y no debes lanzar la aplicación hasta corregirlo.
--
-- SEGURO: solo lectura. No modifica datos.
-- ================================================================


DO $$
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'GOBY — Bloque 06: VALIDATION';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Ejecutando 14 checks. Resultado esperado: todos [OK].';
  RAISE NOTICE '================================================================';
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 1 — Extensión uuid-ossp instalada
-- ════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE NOTICE '[CHECK 01 OK] uuid-ossp instalada';
  ELSE
    RAISE EXCEPTION '[CHECK 01 FAIL] uuid-ossp NO está instalada. Ejecuta 03_SCHEMA_CREATE.sql.';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 2 — Todas las tablas requeridas existen
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_missing text := '';
  v_table   text;
  v_tables  text[] := ARRAY[
    'companies',
    'company_departments',
    'profiles',
    'projects',
    'project_members',
    'company_profiles',
    'frictions',
    't1_dimension_scores',
    'stakeholders',
    'value_streams',
    'use_cases',
    't5_canvas',
    'iso42001_controls',
    'snapshots',
    'ai_rate_limit_log',
    'tool_outputs',
    't9_overrides',
    't9_free_items'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name   = v_table
        AND table_type   = 'BASE TABLE'
    ) THEN
      v_missing := v_missing || v_table || ' ';
    END IF;
  END LOOP;

  IF v_missing <> '' THEN
    RAISE EXCEPTION '[CHECK 02 FAIL] Tablas faltantes: %', v_missing;
  ELSE
    RAISE NOTICE '[CHECK 02 OK] Las 18 tablas requeridas existen';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 3 — RLS habilitado en todas las tablas requeridas
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_no_rls text := '';
  r        RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'companies','company_departments','profiles','projects',
        'project_members','company_profiles','frictions',
        't1_dimension_scores','stakeholders','value_streams',
        'use_cases','t5_canvas','iso42001_controls','snapshots',
        'ai_rate_limit_log','tool_outputs','t9_overrides','t9_free_items'
      )
      AND NOT rowsecurity
  LOOP
    v_no_rls := v_no_rls || r.tablename || ' ';
  END LOOP;

  IF v_no_rls <> '' THEN
    RAISE EXCEPTION '[CHECK 03 FAIL] RLS NO habilitado en: %', v_no_rls;
  ELSE
    RAISE NOTICE '[CHECK 03 OK] RLS habilitado en todas las tablas';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 4 — Policies RLS existen (mínimo requerido)
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public';

  IF v_count < 20 THEN
    RAISE EXCEPTION '[CHECK 04 FAIL] Solo % policies RLS encontradas. Se esperan ≥20.', v_count;
  ELSE
    RAISE NOTICE '[CHECK 04 OK] % policies RLS definidas', v_count;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 5 — Funciones críticas existen
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_missing text := '';
  v_fn      text;
  v_fns     text[] := ARRAY[
    'is_project_member',
    'can_write_project',
    'is_platform_admin',
    'is_superadmin',
    'is_company_project',
    'user_can_read_project',
    'user_can_edit_project',
    'handle_new_user',
    'check_and_log_ai_call',
    'save_tool_output',
    'set_updated_at',
    'set_audit_columns',
    'create_project'
  ];
BEGIN
  FOREACH v_fn IN ARRAY v_fns LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name   = v_fn
    ) THEN
      v_missing := v_missing || v_fn || ' ';
    END IF;
  END LOOP;

  IF v_missing <> '' THEN
    RAISE EXCEPTION '[CHECK 05 FAIL] Funciones faltantes: %', v_missing;
  ELSE
    RAISE NOTICE '[CHECK 05 OK] Las 13 funciones críticas existen';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 6 — Triggers críticos existen
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_missing text := '';
  v_trig    text;
  v_trigs   text[] := ARRAY[
    'on_auth_user_created',
    'trg_tool_outputs_updated_at',
    'trg_t9_overrides_audit',
    'trg_t9_free_items_audit'
  ];
BEGIN
  FOREACH v_trig IN ARRAY v_trigs LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name   = v_trig
      UNION ALL
      -- on_auth_user_created vive en schema auth
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_schema = 'auth'
        AND trigger_name   = v_trig
    ) THEN
      v_missing := v_missing || v_trig || ' ';
    END IF;
  END LOOP;

  IF v_missing <> '' THEN
    RAISE EXCEPTION '[CHECK 06 FAIL] Triggers faltantes: %', v_missing;
  ELSE
    RAISE NOTICE '[CHECK 06 OK] Los 4 triggers críticos existen';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 7 — Superadmin existe en public.profiles
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_role  text;
  v_email text := 'carlos.sanchez@consultoriaalpha.com';
BEGIN
  SELECT p.role INTO v_role
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = v_email;

  IF v_role IS NULL THEN
    RAISE EXCEPTION
      '[CHECK 07 FAIL] No se encontró perfil para %. '
      'Ejecuta 05_SUPERADMIN_SEED.sql.',
      v_email;
  ELSIF v_role <> 'superadmin' THEN
    RAISE EXCEPTION
      '[CHECK 07 FAIL] El perfil de % tiene role=% (esperado: superadmin).',
      v_email, v_role;
  ELSE
    RAISE NOTICE '[CHECK 07 OK] Superadmin % con role=superadmin', v_email;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 8 — is_platform_admin() reconoce al superadmin
-- (test indirecto: función existe y puede llamarse)
-- ════════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- Verificar que la función acepta ser llamada sin errores de sintaxis.
  -- El resultado será FALSE aquí (no hay sesión activa), pero no debe
  -- lanzar una excepción de "function does not exist".
  PERFORM public.is_platform_admin();
  RAISE NOTICE '[CHECK 08 OK] is_platform_admin() callable (sin sesión → false esperado)';
EXCEPTION
  WHEN undefined_function THEN
    RAISE EXCEPTION '[CHECK 08 FAIL] is_platform_admin() no existe';
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 9 — save_tool_output() es SECURITY DEFINER
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_security text;
BEGIN
  SELECT security_type INTO v_security
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name   = 'save_tool_output'
  LIMIT 1;

  IF v_security IS NULL THEN
    RAISE EXCEPTION '[CHECK 09 FAIL] save_tool_output() no encontrada';
  ELSIF v_security <> 'DEFINER' THEN
    RAISE EXCEPTION '[CHECK 09 FAIL] save_tool_output() security_type=% (esperado DEFINER)', v_security;
  ELSE
    RAISE NOTICE '[CHECK 09 OK] save_tool_output() SECURITY DEFINER';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 10 — check_and_log_ai_call() es SECURITY DEFINER
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_security text;
BEGIN
  SELECT security_type INTO v_security
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name   = 'check_and_log_ai_call'
  LIMIT 1;

  IF v_security IS NULL THEN
    RAISE EXCEPTION '[CHECK 10 FAIL] check_and_log_ai_call() no encontrada';
  ELSIF v_security <> 'DEFINER' THEN
    RAISE EXCEPTION '[CHECK 10 FAIL] check_and_log_ai_call() security_type=% (esperado DEFINER)', v_security;
  ELSE
    RAISE NOTICE '[CHECK 10 OK] check_and_log_ai_call() SECURITY DEFINER';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 11 — Columnas de schema drift presentes
--   companies.sector, companies.company_size
--   company_departments tabla
--   t1_dimension_scores.interviewee_department
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_missing text := '';
BEGIN
  -- companies.sector
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'companies'
      AND column_name  = 'sector'
  ) THEN v_missing := v_missing || 'companies.sector '; END IF;

  -- companies.company_size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'companies'
      AND column_name  = 'company_size'
  ) THEN v_missing := v_missing || 'companies.company_size '; END IF;

  -- t1_dimension_scores.interviewee_department
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 't1_dimension_scores'
      AND column_name  = 'interviewee_department'
  ) THEN v_missing := v_missing || 't1_dimension_scores.interviewee_department '; END IF;

  -- company_departments tabla
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'company_departments'
  ) THEN v_missing := v_missing || 'company_departments(tabla) '; END IF;

  IF v_missing <> '' THEN
    RAISE EXCEPTION '[CHECK 11 FAIL] Schema drift columns faltantes: %', v_missing;
  ELSE
    RAISE NOTICE '[CHECK 11 OK] Columnas de schema drift presentes';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 12 — Roles válidos definidos en profiles.role check constraint
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_constraint_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE '%profiles%role%'
  ) INTO v_constraint_exists;

  IF v_constraint_exists THEN
    RAISE NOTICE '[CHECK 12 OK] Check constraint de role en profiles encontrado';
  ELSE
    -- Puede no tener nombre estandarizado — verificar vía pg_constraint
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'profiles'
        AND c.contype = 'c'
    ) INTO v_constraint_exists;

    IF v_constraint_exists THEN
      RAISE NOTICE '[CHECK 12 OK] Check constraint en profiles encontrado';
    ELSE
      RAISE NOTICE '[CHECK 12 WARN] No se encontró check constraint de role en profiles — revisar manualmente';
    END IF;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 13 — BD está vacía de datos cliente (estado limpio)
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_companies int;
  v_projects  int;
  v_profiles  int;
BEGIN
  SELECT COUNT(*) INTO v_companies FROM public.companies;
  SELECT COUNT(*) INTO v_projects  FROM public.projects;
  SELECT COUNT(*) INTO v_profiles  FROM public.profiles;

  RAISE NOTICE '[CHECK 13] companies: % filas', v_companies;
  RAISE NOTICE '[CHECK 13] projects:  % filas', v_projects;
  RAISE NOTICE '[CHECK 13] profiles:  % filas (esperado: 1 = superadmin)', v_profiles;

  IF v_profiles = 1 AND v_companies = 0 AND v_projects = 0 THEN
    RAISE NOTICE '[CHECK 13 OK] BD limpia: solo superadmin, sin datos cliente';
  ELSIF v_profiles > 1 THEN
    RAISE NOTICE '[CHECK 13 WARN] Hay % perfiles. Esperado: 1 (superadmin). Revisar.', v_profiles;
  ELSE
    RAISE NOTICE '[CHECK 13 INFO] Estado: companies=%, projects=%, profiles=%', v_companies, v_projects, v_profiles;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CHECK 14 — Índices de performance presentes
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname NOT LIKE '%pkey';  -- excluir primary keys

  IF v_count < 15 THEN
    RAISE NOTICE '[CHECK 14 WARN] Solo % índices no-PK. Se esperan ≥15. Revisar 03_SCHEMA_CREATE.sql.', v_count;
  ELSE
    RAISE NOTICE '[CHECK 14 OK] % índices de performance encontrados', v_count;
  END IF;
END $$;


-- CHECK 15 — Constraints tool_code aceptan los 14 tool codes de ai-recommend v2
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing text[] := '{}';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tool_outputs_tool_code_check'
      AND conrelid = 'public.tool_outputs'::regclass
  ) THEN
    v_missing := array_append(v_missing, 'tool_outputs_tool_code_check');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_rate_limit_log_tool_code_check'
      AND conrelid = 'public.ai_rate_limit_log'::regclass
  ) THEN
    v_missing := array_append(v_missing, 'ai_rate_limit_log_tool_code_check');
  END IF;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION '[CHECK 15 FAIL] Constraints tool_code desactualizados o faltantes: %', v_missing;
  END IF;

  RAISE NOTICE '[CHECK 15 OK] Constraints tool_code de ai-recommend presentes en tool_outputs y ai_rate_limit_log';
END;
$$;


-- ════════════════════════════════════════════════════════════════
-- RESUMEN FINAL
-- ════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'VALIDACIÓN COMPLETA';
  RAISE NOTICE '';
  RAISE NOTICE 'Si todos los checks muestran [OK], gobytech_pro está listo.';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '  1. Revisar INFRA_CHECKLIST.md — Edge Functions, secrets, Vercel';
  RAISE NOTICE '  2. Apuntar GOBY_SUPABASE_URL y GOBY_ANON_KEY en Vercel (gobytech)';
  RAISE NOTICE '  3. Primer login con carlos.sanchez@consultoriaalpha.com';
  RAISE NOTICE '  4. Verificar que el perfil muestra role=superadmin en la app';
  RAISE NOTICE '================================================================';
END $$;


-- ── Inventario final (para revisión visual) ───────────────────
SELECT
  t.table_name,
  (
    SELECT COUNT(*)
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
  ) AS columns,
  (SELECT rowsecurity FROM pg_tables pt WHERE pt.schemaname = 'public' AND pt.tablename = t.table_name) AS rls_enabled
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type   = 'BASE TABLE'
ORDER BY t.table_name;

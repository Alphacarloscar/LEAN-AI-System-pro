-- ================================================================
-- GOBY — gobytech_pro Production Setup
-- Bloque 04: SYSTEM SEED
--
-- PROPÓSITO:
--   Seed técnico mínimo. Este schema no tiene tablas de catálogo
--   que requieran datos iniciales fijos (sin enum_lookups, sin
--   industry_codes, sin configuración de sistema).
--
--   Las únicas filas que necesita la app para funcionar son:
--   1. El perfil del superadmin (bloque 05).
--   2. Los datos de cliente (creados por el usuario en app).
--
--   Este bloque existe para cumplir la secuencia y documentar
--   explícitamente que el seed de catálogos no aplica.
--
-- SEGURO: no modifica datos. Solo imprime confirmación.
-- ================================================================


DO $$
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'GOBY — Bloque 04: SYSTEM SEED';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Este schema no contiene tablas de catálogo con datos fijos.';
  RAISE NOTICE 'No hay enum_lookups, industry_codes, ni configuración de sistema.';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas que reciben datos en este bloque: NINGUNA';
  RAISE NOTICE '';
  RAISE NOTICE 'Continúa con 05_SUPERADMIN_SEED.sql para crear el perfil';
  RAISE NOTICE 'del superadmin Carlos.';
  RAISE NOTICE '================================================================';
END $$;


-- ── Verificar que el schema está limpio y listo ───────────────
DO $$
DECLARE
  v_table_count int;
  v_companies   int;
  v_profiles    int;
  v_projects    int;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type   = 'BASE TABLE';

  SELECT COUNT(*) INTO v_companies FROM public.companies;
  SELECT COUNT(*) INTO v_profiles  FROM public.profiles;
  SELECT COUNT(*) INTO v_projects  FROM public.projects;

  RAISE NOTICE '[SEED CHECK] Tablas en public: %', v_table_count;
  RAISE NOTICE '[SEED CHECK] companies: % filas', v_companies;
  RAISE NOTICE '[SEED CHECK] profiles:  % filas', v_profiles;
  RAISE NOTICE '[SEED CHECK] projects:  % filas', v_projects;

  IF v_table_count < 15 THEN
    RAISE EXCEPTION
      '[SEED FAIL] Se esperan ≥15 tablas en public. Solo hay %. '
      'Ejecuta primero 03_SCHEMA_CREATE.sql.',
      v_table_count;
  END IF;

  RAISE NOTICE '[SEED OK] Schema listo. Continúa con 05_SUPERADMIN_SEED.sql';
END $$;

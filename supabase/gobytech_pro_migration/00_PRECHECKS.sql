-- ================================================================
-- GOBY — gobytech_pro Production Setup
-- Bloque 00: PRECHECKS
--
-- PROPÓSITO:
--   Verificar condiciones mínimas antes de ejecutar cualquier
--   bloque destructivo. Si alguna comprobación falla, el script
--   aborta con un mensaje claro.
--
-- EJECUTAR PRIMERO. No continúes si hay errores aquí.
-- ================================================================


-- ── 1. Confirmar que estamos en gobytech_pro ──────────────────
-- Supabase no expone el project_ref directamente desde SQL, pero
-- podemos comprobar la URL del Supabase Vault o una variable de
-- configuración personalizada si se ha insertado.
--
-- ACCIÓN MANUAL OBLIGATORIA:
--   Antes de ejecutar cualquier bloque, confirma visualmente en
--   Supabase Dashboard que estás conectado a gobytech_pro:
--     Settings → General → Reference ID
--   El Reference ID de gobytech_pro debe coincidir con el que
--   tienes registrado. Si estás en lean_ai_pro, PARA AQUÍ.
--
-- Este bloque imprime un recordatorio y luego verifica la
-- extensión uuid-ossp (mínimo requerido).

DO $$
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'GOBY — gobytech_pro Production Setup';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CONFIRMA ANTES DE CONTINUAR:';
  RAISE NOTICE '  1. Estás conectado a Supabase proyecto: gobytech_pro';
  RAISE NOTICE '  2. NO estás conectado a lean_ai_pro (staging)';
  RAISE NOTICE '  3. Has hecho backup manual desde Supabase Dashboard';
  RAISE NOTICE '  4. Tienes el user carlos.sanchez@consultoriaalpha creado en Auth';
  RAISE NOTICE '';
  RAISE NOTICE 'Si algún punto no se cumple, cancela ahora con Ctrl+C o cerrando el editor.';
  RAISE NOTICE '================================================================';
END $$;


-- ── 2. Verificar extensión requerida ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
  ) THEN
    RAISE NOTICE '[PRECHECK] uuid-ossp no está instalada — se instalará en bloque 03';
  ELSE
    RAISE NOTICE '[PRECHECK OK] uuid-ossp instalada';
  END IF;
END $$;


-- ── 3. Verificar que auth.users tiene el superadmin ──────────
DO $$
DECLARE
  v_user_id uuid;
  v_email   text := 'carlos.sanchez@consultoriaalpha.com';
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      E'[PRECHECK FAIL] El usuario % NO existe en auth.users.\n'
      'Debes crearlo desde Supabase Auth Dashboard ANTES de continuar.\n'
      'Pasos: Authentication → Users → Add user → email + password temporal.',
      v_email
      USING ERRCODE = 'raise_exception';
  ELSE
    RAISE NOTICE '[PRECHECK OK] Usuario % encontrado en auth.users — id: %', v_email, v_user_id;
  END IF;
END $$;


-- ── 4. Inventario actual del schema public ───────────────────
-- Lista tablas existentes para saber qué hay antes del reset.
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_schema = t.table_schema
     AND c.table_name   = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type   = 'BASE TABLE'
ORDER BY table_name;


-- ── 5. Inventario de funciones existentes ────────────────────
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;


-- ── 6. Inventario de policies RLS ────────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ── 7. Resultado esperado ─────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '[PRECHECKS COMPLETOS]';
  RAISE NOTICE 'Revisa los resultados de los SELECTs anteriores.';
  RAISE NOTICE 'Si todo es correcto, continúa con 01_BACKUP_REMINDER.sql';
END $$;

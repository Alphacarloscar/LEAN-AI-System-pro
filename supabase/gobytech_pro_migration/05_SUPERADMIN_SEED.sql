-- ================================================================
-- GOBY — gobytech_pro Production Setup
-- Bloque 05: SUPERADMIN SEED
--
-- PROPÓSITO:
--   Crear el perfil del superadmin en public.profiles a partir
--   del usuario que ya existe en auth.users.
--
-- PREREQUISITOS:
--   1. El usuario carlos.sanchez@consultoriaalpha.com debe existir
--      en auth.users (creado desde Supabase Auth Dashboard).
--      Si no existe → EXCEPTION → el bloque aborta.
--
--   2. El schema public debe estar creado (bloque 03 ejecutado).
--
-- SEGURIDAD:
--   — No inserta contraseñas.
--   — No usa service_role ni secrets.
--   — No expone el UUID del usuario en ningún mensaje visible.
--   — Usa INSERT ... ON CONFLICT (id) DO UPDATE para ser idempotente.
--
-- IDEMPOTENTE: se puede ejecutar varias veces sin efectos adversos.
-- ================================================================


DO $$
DECLARE
  v_user_id    uuid;
  v_user_email text := 'carlos.sanchez@consultoriaalpha.com';
  v_user_name  text := 'Carlos Sánchez';
  v_role       text := 'superadmin';
BEGIN

  -- ── 1. Verificar que el usuario existe en auth.users ─────────
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      E'[SUPERADMIN FAIL] El usuario % NO existe en auth.users.\n'
      'Debes crearlo desde Supabase Auth Dashboard ANTES de ejecutar este bloque:\n'
      '  Authentication → Users → Add user\n'
      '  Email: %\n'
      '  Password: temporal (el usuario lo cambiará en primer login)\n'
      '  Email confirm: habilitado\n'
      'Después de crearlo, ejecuta este bloque de nuevo.',
      v_user_email, v_user_email
      USING ERRCODE = 'raise_exception';
  END IF;

  RAISE NOTICE '[SUPERADMIN] Usuario encontrado en auth.users';

  -- ── 2. Upsert en public.profiles ─────────────────────────────
  -- ON CONFLICT (id): si el perfil ya existe (ej. re-run del seed),
  -- actualiza role y name sin tocar otros campos.
  -- company_id = NULL: superadmin no pertenece a ninguna empresa cliente.
  INSERT INTO public.profiles (id, email, name, role, company_id)
  VALUES (
    v_user_id,
    v_user_email,
    v_user_name,
    v_role,
    NULL   -- superadmin: sin empresa cliente asociada
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      name       = EXCLUDED.name,
      role       = EXCLUDED.role,
      company_id = NULL;

  RAISE NOTICE '[SUPERADMIN OK] Perfil upserted en public.profiles';
  RAISE NOTICE '  email : %', v_user_email;
  RAISE NOTICE '  name  : %', v_user_name;
  RAISE NOTICE '  role  : %', v_role;

  -- ── 3. Verificar que el perfil quedó bien ────────────────────
  DECLARE
    v_check_role text;
  BEGIN
    SELECT role INTO v_check_role
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_check_role <> v_role THEN
      RAISE EXCEPTION
        '[SUPERADMIN FAIL] El rol guardado (%) no coincide con el esperado (%).',
        v_check_role, v_role;
    END IF;

    RAISE NOTICE '[SUPERADMIN VERIFY OK] role = %', v_check_role;
  END;

  RAISE NOTICE '================================================================';
  RAISE NOTICE '[SUPERADMIN SEED COMPLETO]';
  RAISE NOTICE 'Continúa con 06_VALIDATION.sql para verificar toda la migración.';
  RAISE NOTICE '================================================================';

END $$;


-- ── Mostrar el perfil creado (para revisión visual) ───────────
-- El UUID se muestra truncado por seguridad — confirma visualmente
-- que el email y role son correctos.
SELECT
  LEFT(id::text, 8) || '...'  AS id_preview,
  email,
  name,
  role,
  company_id,
  created_at
FROM public.profiles
WHERE email = 'carlos.sanchez@consultoriaalpha.com';

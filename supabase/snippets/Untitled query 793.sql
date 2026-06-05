-- ================================================================
-- Seed: usuarios de prueba por rol (DEV únicamente)
-- Prerequisito: los 3 usuarios deben existir en auth.users
-- ================================================================

DO $$
DECLARE
  v_consultant_id   uuid;
  v_editor_id       uuid;
  v_viewer_id       uuid;
  v_company_id      uuid;
BEGIN

  -- Obtener UUIDs desde auth.users
  SELECT id INTO v_consultant_id FROM auth.users WHERE email = 'consultor@test.dev';
  SELECT id INTO v_editor_id     FROM auth.users WHERE email = 'editor@test.dev';
  SELECT id INTO v_viewer_id     FROM auth.users WHERE email = 'viewer@test.dev';

  -- Usar la primera empresa disponible en DEV para los roles de cliente
  SELECT id INTO v_company_id FROM public.companies LIMIT 1;

  -- Validar que los usuarios existen
  IF v_consultant_id IS NULL THEN
    RAISE EXCEPTION 'Usuario consultor@test.dev no encontrado en auth.users. Créalo primero en Authentication → Users.';
  END IF;
  IF v_editor_id IS NULL THEN
    RAISE EXCEPTION 'Usuario editor@test.dev no encontrado en auth.users.';
  END IF;
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Usuario viewer@test.dev no encontrado en auth.users.';
  END IF;

  -- Upsert de perfiles
  INSERT INTO public.profiles (id, email, name, role, company_id)
  VALUES
    (v_consultant_id, 'consultor@test.dev', 'Ana Consultora',  'consultant',    NULL),
    (v_editor_id,     'editor@test.dev',    'Luis Editor',     'client_editor', v_company_id),
    (v_viewer_id,     'viewer@test.dev',    'Marta Viewer',    'client_viewer', v_company_id)
  ON CONFLICT (id) DO UPDATE
    SET role       = EXCLUDED.role,
        name       = EXCLUDED.name,
        company_id = EXCLUDED.company_id;

  RAISE NOTICE '✓ Perfiles creados:';
  RAISE NOTICE '  consultor@test.dev  → consultant    (sin empresa)';
  RAISE NOTICE '  editor@test.dev     → client_editor (empresa: %)', v_company_id;
  RAISE NOTICE '  viewer@test.dev     → client_viewer (empresa: %)', v_company_id;

END $$;

-- Verificación visual
SELECT email, name, role, company_id
FROM public.profiles
WHERE email IN ('consultor@test.dev', 'editor@test.dev', 'viewer@test.dev')
ORDER BY role;
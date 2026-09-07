-- ============================================================
-- Migration 008 — Roles 4-tier
--
-- Reemplaza el sistema de 3 roles (admin/consultant/viewer) por
-- un sistema de 4 roles que separa el equipo Alpha del cliente:
--
--   superadmin    → Alpha platform admin (antes 'admin')
--   consultant    → Consultor Alpha (sin cambio)
--   client_editor → Cliente operativo — edita su empresa
--   client_viewer → Cliente directivo — solo lectura (antes 'viewer')
--
-- Pasos:
--   1. Eliminar CHECK constraint antiguo en profiles.role
--   2. Migrar datos existentes: admin→superadmin, viewer→client_viewer
--   3. Añadir nuevo CHECK constraint con los 4 roles
--   4. Actualizar DEFAULT de profiles.role
--   5. Actualizar is_platform_admin() → chequea 'superadmin'
--   6. Añadir alias is_superadmin() para legibilidad futura
--   7. Actualizar handle_new_user trigger default: viewer→client_viewer
-- ============================================================

-- 1. Eliminar constraint antiguo (IF EXISTS para idempotencia)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Migrar datos existentes
UPDATE public.profiles SET role = 'superadmin'    WHERE role = 'admin';
UPDATE public.profiles SET role = 'client_viewer' WHERE role = 'viewer';

-- 3. Nuevo CHECK con los 4 roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin', 'consultant', 'client_editor', 'client_viewer'));

-- 4. Actualizar DEFAULT
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'client_viewer';

-- 5. Actualizar is_platform_admin() — ahora chequea 'superadmin'
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- 6. Alias semántico (útil para código nuevo)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_admin();
$$;

-- 7. Actualizar trigger handle_new_user para usar 'client_viewer' como default
--    (el trigger completo se recrea para cambiar la línea del COALESCE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client_viewer'),
    CASE
      WHEN NEW.raw_user_meta_data->>'company_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'company_id')::uuid
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN public.profiles.role IS
  'superadmin=Alpha plataforma (acceso global) | consultant=consultor Alpha | client_editor=cliente operativo | client_viewer=cliente solo lectura';

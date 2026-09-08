-- ============================================================
-- 20260908003 — Epic 5: Agregar campos para gestión de usuarios
--
-- Propósito:
--   Campos administrativos para perfiles/usuarios.
--
-- Cambios:
--   - Actualizar CHECK constraint en role (4 valores)
--   - Agregar is_active
--   - Agregar updated_at
--   - Crear índices
-- ============================================================

-- Expandir valores de role
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin', 'consultant', 'client_editor', 'client_viewer'));

-- Agregar campos faltantes si no existen
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_is_active
  ON public.profiles (is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);

CREATE INDEX IF NOT EXISTS idx_profiles_company_id
  ON public.profiles (company_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;

CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

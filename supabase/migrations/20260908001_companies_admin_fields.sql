-- ============================================================
-- 20260908001 — Epic 3: Agregar campos is_active y updated_at
--
-- Propósito:
--   Habilitar gestión de estado de empresas (activa/inactiva)
--   y tracking de cambios en la tabla companies.
--
-- Campos nuevos:
--   - is_active BOOLEAN DEFAULT true
--   - updated_at TIMESTAMPTZ DEFAULT now()
--
-- RLS:
--   Solo superadmin (via is_platform_admin()) puede ver/editar.
-- ============================================================

-- Agregar campos a companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.companies.is_active IS
  'Estado de la empresa. Si es false, los usuarios pierden acceso al siguiente request.';

COMMENT ON COLUMN public.companies.updated_at IS
  'Timestamp de la última actualización (admin edita empresa, cambia paquetes, activa/desactiva).';

-- Actualizar trigger updated_at para companies (si no existe)
CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_companies_updated_at ON public.companies;

CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_companies_updated_at();

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_is_active
  ON public.companies (is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_companies_updated_at
  ON public.companies (updated_at DESC);

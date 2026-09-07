-- ============================================================
-- 20260827003 — companies.contracted_packages
--
-- Añade contracted_packages a companies para definir los planes
-- habilitados a nivel empresa (aplica como default a proyectos nuevos).
--
-- El campo per-proyecto en projects.contracted_packages sigue como
-- override individual. usePermissions lee desde projects (ya funciona).
-- La UI "Planes" en CompanyProfile edita este campo de empresa.
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS contracted_packages public.package_id[]
    NOT NULL DEFAULT ARRAY['boost_assessment','portfolio_management','legal_compliance']::public.package_id[];

COMMENT ON COLUMN public.companies.contracted_packages IS
  'Planes contratados a nivel empresa. Determina las herramientas disponibles '
  'para todos los proyectos de esta empresa. Editable en la UI "Planes".';

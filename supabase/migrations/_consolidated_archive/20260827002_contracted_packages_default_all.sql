-- ============================================================
-- 20260827002 — contracted_packages: default todos los paquetes
--
-- Problema: el default anterior era '{}' (vacío), por lo que
-- proyectos nuevos no tenían paquetes y el sidebar solo mostraba
-- T4 y T10 (PLATFORM + SHARED_KERNEL).
--
-- Fix: cambiar el DEFAULT a todos los paquetes actuales para que
-- proyectos nuevos tengan acceso completo desde el primer momento.
-- Los proyectos existentes vacíos también se actualizan.
--
-- Los paquetes disponibles son:
--   boost_assessment      → T1 · T2 · T7
--   portfolio_management  → T3 · T5 · T8 · T9 · T11
--   legal_compliance      → T6 · T12
-- ============================================================

-- 1. Cambiar el default de la columna
ALTER TABLE public.projects
  ALTER COLUMN contracted_packages
  SET DEFAULT ARRAY['boost_assessment','portfolio_management','legal_compliance']::public.package_id[];

-- 2. Rellenar proyectos existentes que quedaron con array vacío
UPDATE public.projects
SET contracted_packages = ARRAY['boost_assessment','portfolio_management','legal_compliance']::public.package_id[]
WHERE contracted_packages = '{}';

COMMENT ON COLUMN public.projects.contracted_packages IS
  'Paquetes contratados por el cliente. Default: todos los paquetes disponibles. '
  'Editable desde ProjectDetailView (solo superadmin/consultant).';

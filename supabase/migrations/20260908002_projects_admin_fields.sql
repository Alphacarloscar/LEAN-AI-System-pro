-- ============================================================
-- 20260908002 — Epic 4: Agregar estados faltantes a proyectos
--
-- Propósito:
--   Extender estados de proyecto para permitir paused y completed
--   además de active y archived.
--
-- Cambios:
--   - ALTER TABLE projects: expandir CHECK constraint en status
--   - Crear tipos y índices para performance
--   - RLS: verificar lectura-only para proyectos pausados/archivados
-- ============================================================

-- Actualizar CHECK constraint en projects.status
-- PostgreSQL no permite ALTER CHECK, así que eliminamos y recreamos
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('active', 'paused', 'archived', 'completed'));

-- Crear índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_projects_status
  ON public.projects (status);

-- Crear índice compuesto para búsquedas frecuentes (company_id + status)
CREATE INDEX IF NOT EXISTS idx_projects_company_status
  ON public.projects (company_id, status);

COMMENT ON COLUMN public.projects.status IS
  'Estado del proyecto: active (operativo), paused (pausado),
   archived (archivado sin recuperación), completed (finalizado).
   En paused y archived: acceso lectura-only vía RLS.';

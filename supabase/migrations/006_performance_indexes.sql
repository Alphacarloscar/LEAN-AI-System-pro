-- ============================================================
-- 006_performance_indexes.sql
--
-- Índices de rendimiento adicionales.
--
-- Problema: la función is_project_member(pid) ejecuta
--   SELECT 1 FROM project_members WHERE project_id = pid AND user_id = auth.uid()
-- Esta query usa los índices separados idx_project_members_proj y
-- idx_project_members_user, pero un índice compuesto es más eficiente
-- porque resuelve ambas condiciones en una sola pasada de índice.
--
-- Impacto: la política RLS de t1_dimension_scores se evalúa potencialmente
-- por cada fila devuelta. Con un índice compuesto (project_id, user_id),
-- la comprobación de membresía es O(log n) con una sola pasada.
--
-- INSTRUCCIONES PARA CARLOS:
--   Supabase Dashboard → SQL Editor → pegar este script → Run
-- ============================================================

-- Índice compuesto en project_members para acelerar is_project_member()
CREATE INDEX IF NOT EXISTS idx_project_members_proj_user
  ON public.project_members(project_id, user_id);

-- Índice compuesto en t1_dimension_scores para acelerar SELECT + ORDER
-- (aunque hemos eliminado el ORDER BY del código, este índice ayuda
-- con cualquier query que filtre por project_id e interviewee_id)
CREATE INDEX IF NOT EXISTS idx_t1_scores_proj_interviewee
  ON public.t1_dimension_scores(project_id, interviewee_id);

-- Mismo patrón para stakeholders (T2) — mismo tipo de RLS overhead
CREATE INDEX IF NOT EXISTS idx_stakeholders_proj_id
  ON public.stakeholders(project_id, id);

-- Verificación: listar los nuevos índices
SELECT indexname, indexdef
  FROM pg_indexes
 WHERE tablename IN ('project_members', 't1_dimension_scores', 'stakeholders')
   AND indexname LIKE '%proj%'
 ORDER BY tablename, indexname;

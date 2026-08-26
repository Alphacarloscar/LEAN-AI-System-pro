-- ============================================================
-- FASE 3 — Migración segura: índices de rendimiento críticos
--
-- EJECUTAR SOLO SI FASE 2 confirma que faltan estos índices.
-- Cada sentencia usa CREATE INDEX CONCURRENTLY IF NOT EXISTS:
--   - CONCURRENTLY: no bloquea lecturas/escrituras durante la creación
--   - IF NOT EXISTS: idempotente — seguro re-ejecutar
--
-- INSTRUCCIONES:
--   Supabase Dashboard → SQL Editor → pegar → Run
--   IMPORTANTE: ejecutar cada bloque individualmente si hay errores.
--   CONCURRENTLY no funciona dentro de una transacción explícita
--   (no envolver en BEGIN/COMMIT).
--
-- Columnas verificadas contra migraciones locales (2026-05-29):
--   ai_rate_limit_log.created_at  ← confirmado, NO 'called_at'
--   tool_outputs: (project_id, tool_code) ← índice compuesto
-- ============================================================

-- 1. value_streams — columna usada en T3 WHERE clause
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_value_streams_project_id
  ON public.value_streams(project_id);

-- 2. t1_dimension_scores — columna usada en T1 load
--    (puede coexistir con idx_t1_scores_proj_interviewee de 006)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_t1_dimension_scores_project_id
  ON public.t1_dimension_scores(project_id);

-- 3. use_cases — columna usada en T4 load
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_use_cases_project_id
  ON public.use_cases(project_id);

-- 4. stakeholders — columna usada en T2 load
--    (puede coexistir con idx_stakeholders_proj_id de 006)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stakeholders_project_id
  ON public.stakeholders(project_id);

-- 5+6. project_members — ambas direcciones de lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_members_user_id
  ON public.project_members(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_members_project_id
  ON public.project_members(project_id);

-- 7. profiles — lookup por company_id (usado en CompanyProfile + header)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_company_id
  ON public.profiles(company_id);

-- 8. tool_outputs — índice compuesto (project_id, tool_code) para T5–T8, T12
--    Evita full scan en save_tool_output y lecturas por herramienta
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tool_outputs_project_tool
  ON public.tool_outputs(project_id, tool_code);

-- 9. ai_rate_limit_log — columna confirmada: created_at (NO called_at)
--    Usado en rate limiting por usuario/tool en ventana de tiempo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_rate_limit_log_created_at
  ON public.ai_rate_limit_log(user_id, tool_code, created_at);

-- ============================================================
-- Verificación post-migración (ejecutar después)
-- ============================================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_value_streams_project_id',
    'idx_t1_dimension_scores_project_id',
    'idx_use_cases_project_id',
    'idx_stakeholders_project_id',
    'idx_project_members_user_id',
    'idx_project_members_project_id',
    'idx_profiles_company_id',
    'idx_tool_outputs_project_tool',
    'idx_ai_rate_limit_log_created_at'
  )
ORDER BY tablename, indexname;

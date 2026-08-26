-- ============================================================
-- FASE 2 — Verificación de índices existentes
--
-- INSTRUCCIONES:
--   Supabase Dashboard → SQL Editor → pegar → Run
--   Copiar el resultado completo y compartir con Claude.
--
-- Qué muestra: todos los índices de las 9 tablas críticas,
-- ordenados por tabla + nombre de índice.
-- ============================================================

SELECT
  t.tablename,
  i.indexname,
  i.indexdef
FROM pg_indexes i
JOIN (
  VALUES
    ('value_streams'),
    ('t1_dimension_scores'),
    ('use_cases'),
    ('stakeholders'),
    ('project_members'),
    ('profiles'),
    ('tool_outputs'),
    ('ai_rate_limit_log'),
    ('projects')
) AS t(tablename) ON i.tablename = t.tablename
WHERE i.schemaname = 'public'
ORDER BY t.tablename, i.indexname;

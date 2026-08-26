-- ============================================================
-- Migration 20260616_004_audit_schema_drift.sql
--
-- Corrige el drift entre el schema real en BD y la definición
-- consolidada en 20260615_003_audit_system.sql.
--
-- Problema: CREATE TABLE IF NOT EXISTS no añade columnas nuevas
-- si la tabla ya existía con un schema anterior.
--
-- Columnas añadidas a audit_logs:
--   · correlation_id
--
-- Columnas añadidas a audit_logs_archive:
--   · correlation_id
--   · user_email_hash
--   · ai_provider
--   · ai_model
--   · ai_total_tokens
--
-- Todos los ALTER TABLE usan ADD COLUMN IF NOT EXISTS — idempotente.
-- Relacionado: ADR-017 · 20260615_003_audit_system.sql
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. audit_logs — columnas faltantes
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS correlation_id text;

COMMENT ON COLUMN public.audit_logs.correlation_id IS
  'UUID generado por withCorrelationId() en la UI. Agrupa todas las trazas '
  'de una misma interacción de usuario. NULL para eventos de sistema o Edge Functions.';

CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id
  ON public.audit_logs (correlation_id)
  WHERE correlation_id IS NOT NULL;


-- ════════════════════════════════════════════════════════════════
-- 2. audit_logs_archive — columnas faltantes
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.audit_logs_archive
  ADD COLUMN IF NOT EXISTS correlation_id    text,
  ADD COLUMN IF NOT EXISTS user_email_hash   text,
  ADD COLUMN IF NOT EXISTS ai_provider       text,
  ADD COLUMN IF NOT EXISTS ai_model          text,
  ADD COLUMN IF NOT EXISTS ai_total_tokens   integer;

COMMENT ON COLUMN public.audit_logs_archive.correlation_id IS
  'Propagado desde audit_logs durante el archivado. Permite correlación histórica.';

COMMENT ON COLUMN public.audit_logs_archive.user_email_hash IS
  'HMAC-SHA256(user_email, pepper) — nunca PII en frío (GDPR).';

CREATE INDEX IF NOT EXISTS idx_audit_archive_correlation_id
  ON public.audit_logs_archive (correlation_id)
  WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_archive_user_email_hash
  ON public.audit_logs_archive (user_email_hash)
  WHERE user_email_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_archive_ai_model
  ON public.audit_logs_archive (ai_model, ai_total_tokens)
  WHERE ai_model IS NOT NULL;


-- ════════════════════════════════════════════════════════════════
-- 3. VERIFICACIÓN POST-DESPLIEGUE
-- ════════════════════════════════════════════════════════════════
--
-- A. Columnas en audit_logs (debe incluir correlation_id):
--      SELECT column_name FROM information_schema.columns
--      WHERE table_schema = 'public' AND table_name = 'audit_logs'
--      ORDER BY ordinal_position;
--
-- B. Columnas en audit_logs_archive (debe incluir todas las nuevas):
--      SELECT column_name FROM information_schema.columns
--      WHERE table_schema = 'public' AND table_name = 'audit_logs_archive'
--      ORDER BY ordinal_position;
--
-- C. Índices creados:
--      SELECT indexname FROM pg_indexes
--      WHERE tablename IN ('audit_logs', 'audit_logs_archive')
--        AND indexname LIKE '%correlation%' OR indexname LIKE '%email_hash%' OR indexname LIKE '%ai_model%';

-- ================================================================
-- Migration: 20260604_update_ai_rate_limit_tool_codes.sql
--
-- Amplía el CHECK constraint de ai_rate_limit_log.tool_code para
-- incluir todos los tool codes soportados por ai-recommend v2:
--   - Genéricos (RecommendationPanel): t1, t2, t4, t5, t6, t7, t8, t9, t10, t11
--   - Dedicados (hooks propios):       t3_opportunities, t6_policy, t7_plan, t8_comms
--
-- Contexto: la Edge Function ai-recommend soporta 14 tool codes desde
-- el commit e9a38a1 (fix: align ai-recommend tool codes with frontend).
-- El constraint anterior solo permitía los 7 tool codes del Sprint 6.
--
-- APLICADO MANUALMENTE en gobytech_pro antes de este commit.
-- Esta migration persiste el estado real de la BBDD en el repo.
-- ================================================================

ALTER TABLE public.ai_rate_limit_log
  DROP CONSTRAINT IF EXISTS ai_rate_limit_log_tool_code_check;

ALTER TABLE public.ai_rate_limit_log
  ADD CONSTRAINT ai_rate_limit_log_tool_code_check
  CHECK (tool_code IN (
    -- Genéricos — RecommendationPanel (T1-T11)
    't1', 't2', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11',
    -- Dedicados — hooks de generación específica
    't3_opportunities', 't6_policy', 't7_plan', 't8_comms'
  ));

-- Verificación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_rate_limit_log_tool_code_check'
      AND conrelid = 'public.ai_rate_limit_log'::regclass
  ) THEN
    RAISE EXCEPTION '[FAIL] Constraint ai_rate_limit_log_tool_code_check no encontrado tras la migración';
  END IF;
  RAISE NOTICE '[OK] ai_rate_limit_log_tool_code_check actualizado (14 tool codes)';
END;
$$;

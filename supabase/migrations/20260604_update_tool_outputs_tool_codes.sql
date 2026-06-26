-- ================================================================
-- Migration: 20260604_update_tool_outputs_tool_codes.sql
--
-- Amplía el CHECK constraint de tool_outputs.tool_code para incluir
-- todos los tool codes soportados por ai-recommend v2.
--
-- Problema: el constraint anterior solo permitía 5 códigos del Sprint 6.
-- Efecto: save_tool_output() fallaba silenciosamente para t1-t11 y
--         t3_opportunities → persistence.saved=false en todas las
--         recomendaciones nuevas → los usuarios debían regenerar al
--         navegar (estado no persistido en BD).
--
-- Tool codes anteriores (Sprint 6):
--   't5_canvas', 't6_policy', 't7_plan', 't8_comms', 't12_iso'
--
-- Tool codes actuales (Sprint 11, ai-recommend v2):
--   Genéricos (RecommendationPanel): t1, t2, t4, t5, t6, t7, t8, t9, t10, t11
--   Dedicados (hooks propios):       t3_opportunities, t6_policy, t7_plan, t8_comms
--
-- NOTA: Este SQL debe ejecutarse en gobytech_pro vía Supabase SQL Editor.
-- ================================================================

ALTER TABLE public.tool_outputs
  DROP CONSTRAINT IF EXISTS tool_outputs_tool_code_check;

ALTER TABLE public.tool_outputs
  ADD CONSTRAINT tool_outputs_tool_code_check
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
    WHERE conname = 'tool_outputs_tool_code_check'
      AND conrelid = 'public.tool_outputs'::regclass
  ) THEN
    RAISE EXCEPTION '[FAIL] Constraint tool_outputs_tool_code_check no encontrado tras la migración';
  END IF;
  RAISE NOTICE '[OK] tool_outputs_tool_code_check actualizado (14 tool codes)';
END;
$$;

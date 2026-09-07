-- ============================================================
-- Migration: Eliminar función update_project ambigua (jsonb)
-- Fecha: 2026-08-28
--
-- PROBLEMA:
--   Existen dos versiones de update_project con firmas conflictivas:
--   1. p_fricciones_oportunidades => jsonb (vieja, causa ambigüedad)
--   2. p_fricciones_oportunidades => text (nueva, correcta)
--
--   PostgreSQL no puede elegir cuál usar. Esta migración elimina la vieja.
--
-- ============================================================

-- Eliminar la versión vieja con jsonb
DROP FUNCTION IF EXISTS public.update_project(
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text[]
) CASCADE;

-- Verificación post-migration
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname = 'update_project'
    AND pg_get_function_identity_arguments(oid) LIKE '%text[]%';

  IF v_count = 1 THEN
    RAISE NOTICE '[20260828 FIX OK] update_project eliminada versión jsonb. Queda solo versión text.';
  ELSE
    RAISE EXCEPTION '[20260828 FIX FAIL] Se esperaba 1 función update_project con text[], se encontraron %', v_count;
  END IF;
END $$;

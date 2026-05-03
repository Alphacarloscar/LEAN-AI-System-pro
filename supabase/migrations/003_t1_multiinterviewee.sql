-- ============================================================
-- 003_t1_multiinterviewee.sql
--
-- Amplía t1_dimension_scores para soportar múltiples
-- entrevistados por engagement (multi-interviewee T1).
--
-- Problema original: UNIQUE (engagement_id, dimension_code,
-- subdimension_code) — sin interviewee_id, lo que impide
-- guardar scores distintos por entrevistado.
--
-- Cambios:
--   1. Eliminar UNIQUE constraint actual (sin interviewee_id)
--   2. Añadir columna interviewee_type ('it' | 'business')
--   3. Nueva UNIQUE constraint incluyendo interviewee_id
--
-- ⚠ INSTRUCCIONES PARA CARLOS:
--   Supabase Dashboard → SQL Editor → pegar este script → Run
-- ============================================================

-- 1. Eliminar la constraint UNIQUE que bloquea múltiples entrevistados
ALTER TABLE public.t1_dimension_scores
  DROP CONSTRAINT IF EXISTS
    t1_dimension_scores_engagement_id_dimension_code_subdimension_code_key;

-- 2. Añadir columna interviewee_type si no existe
ALTER TABLE public.t1_dimension_scores
  ADD COLUMN IF NOT EXISTS interviewee_type text NOT NULL DEFAULT 'business'
  CHECK (interviewee_type IN ('it', 'business'));

-- 3. Nueva UNIQUE constraint que incluye interviewee_id
--    NULLS NOT DISTINCT: dos filas con interviewee_id=NULL se consideran
--    iguales → soporta el caso "score global sin entrevistado específico".
ALTER TABLE public.t1_dimension_scores
  ADD CONSTRAINT t1_scores_unique_per_interviewee
  UNIQUE NULLS NOT DISTINCT
    (engagement_id, dimension_code, subdimension_code, interviewee_id);

-- Verificación: debe devolver la nueva constraint
SELECT conname, contype
  FROM pg_constraint
 WHERE conrelid = 'public.t1_dimension_scores'::regclass
   AND contype = 'u';

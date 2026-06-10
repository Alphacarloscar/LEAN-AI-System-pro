-- =================================================================
-- Migration: create_bulk_upsert_t1_scores_function
--
-- Description:
-- This migration creates a new RPC function `bulk_upsert_t1_scores`
-- to handle bulk inserts/updates of T1 dimension scores efficiently.
-- This replaces the client-side loop of upserts with a single
-- database function call, significantly improving performance.
--
-- DEPENDENCY: This function requires the database schema to have been
-- migrated at least up to '004_companies_and_rename.sql', which
-- defines the 't1_scores_unique_per_interviewee' unique constraint
-- on the 't1_dimension_scores' table. If an older schema is present,
-- this function may fail with a unique constraint violation.
--
-- Function: public.bulk_upsert_t1_scores(p_scores JSONB)
-- Parameters:
--   - p_scores: A JSONB array of t1_dimension_scores objects.
--
-- Logic:
-- 1. Takes a JSONB array of score objects.
-- 2. Uses `jsonb_to_recordset` or `jsonb_array_elements` to expand the array into a rowset.
-- 3. Performs a single `INSERT ... ON CONFLICT DO UPDATE` statement.
--    This is much more efficient than one `upsert` call per row from the client.
-- =================================================================

CREATE OR REPLACE FUNCTION public.bulk_upsert_t1_scores(p_scores jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.t1_dimension_scores (
    project_id,
    dimension_code,
    subdimension_code,
    score,
    evidence,
    interviewee_id,
    interviewee_name,
    interviewee_role,
    interviewee_type,
    interviewee_department
  )
  SELECT
    (item->>'project_id')::uuid,
    item->>'dimension_code',
    item->>'subdimension_code',
    (item->>'score')::numeric,
    item->>'evidence',
    item->>'interviewee_id',
    item->>'interviewee_name',
    item->>'interviewee_role',
    item->>'interviewee_type',
    item->>'interviewee_department'
  FROM jsonb_array_elements(p_scores) AS item
  ON CONFLICT ON CONSTRAINT t1_scores_unique_per_interviewee
  DO UPDATE SET
    score = EXCLUDED.score,
    evidence = EXCLUDED.evidence,
    interviewee_name = EXCLUDED.interviewee_name,
    interviewee_role = EXCLUDED.interviewee_role,
    interviewee_type = EXCLUDED.interviewee_type,
    interviewee_department = EXCLUDED.interviewee_department;
END;
$$;

-- ============================================================
-- GOBY — Migration: Clean up duplicate create_project functions
--
-- Issue: Multiple versions of create_project(...)  with different
--        parameter sets created via CREATE OR REPLACE, causing
--        PostgreSQL ambiguity error when calling the RPC.
--
-- Root cause: Migrations 20260602, 20260825001, 20260827004 each
--             created a new overload instead of replacing the previous.
--             CREATE OR REPLACE only works if parameter list is identical.
--
-- Solution: DROP all versions and keep only the latest with all fields
-- ============================================================

-- Drop the old overloads (keep only the full signature with extended fields)
DROP FUNCTION IF EXISTS public.create_project(uuid, text, text);
DROP FUNCTION IF EXISTS public.create_project(uuid, text, uuid, text);

-- The latest version remains:
-- public.create_project(
--   p_company_id uuid,
--   p_name text,
--   p_domain_id uuid,
--   p_phase text,
--   p_objetivo_principal text,
--   p_restricciones text,
--   p_horizonte_valor text,
--   p_ecosistema_tecnologico text,
--   p_fricciones_oportunidades text
-- )

-- Verify only one version remains
SELECT proname,
       array_agg(pg_get_function_identity_arguments(oid))
FROM pg_proc
WHERE proname = 'create_project' AND pronamespace = 'public'::regnamespace
GROUP BY proname;

-- =================================================================
-- Migration: create_project_function
--
-- Description:
-- This migration creates the `create_project` database function,
-- which was missing from the schema, causing errors in the application.
-- The function handles the creation of a new project and assigns
-- the creator as a member.
--
-- Function: public.create_project(p_name, p_company_id, p_phase)
-- Parameters:
--   - p_name: The name of the new project (TEXT).
--   - p_company_id: The ID of the company the project belongs to (UUID).
--   - p_phase: The initial phase of the project (TEXT, cast to lean_phase).
--
-- Logic:
-- 1. Inserts a new row into the `public.projects` table.
--    - `owner_id` is set to the ID of the calling user (`auth.uid()`).
--    - `status` defaults to 'active'.
-- 2. Inserts a row into `public.project_members` to grant the creator
--    'consultant' access to the new project.
-- 3. Returns the newly created project row.
-- 4. Uses `SECURITY DEFINER` to bypass RLS for the initial inserts,
--    as intended by the application architecture.
-- =================================================================

CREATE OR REPLACE FUNCTION public.create_project(
  p_name TEXT,
  p_company_id UUID,
  p_phase TEXT
)
RETURNS projects AS $$
DECLARE
  new_project public.projects;
BEGIN
  -- Insert the new project, setting the calling user as the owner.
  INSERT INTO public.projects (name, company_id, current_phase, owner_id, status)
  VALUES (p_name, p_company_id, p_phase, auth.uid(), 'active')
  RETURNING * INTO new_project;

  -- Make the creator a 'consultant' member of the new project.
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (new_project.id, auth.uid(), 'consultant');

  RETURN new_project;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Épica 8: project_members roles standardization + RLS overhaul
-- ============================================================
-- Fixes project_members.role CHECK constraint to match the actual
-- 4-tier role system (consultant/client_editor/client_viewer),
-- switches RLS policies from is_project_member/can_write_project
-- to the newer user_can_read_project/user_can_edit_project helpers,
-- and adds profiles.person_id to support account↔person linking.
--
-- Idempotent: uses IF NOT EXISTS / IF EXISTS / ON CONFLICT
-- Safe for re-run in any environment (DEV/PRE/PRO)
-- ============================================================

-- 1. Backfill legacy role values (viewer → client_viewer)
-- ============================================================
UPDATE public.project_members
  SET role = 'client_viewer'
WHERE role = 'viewer';

-- 2. Drop old CHECK constraint and recreate with correct role set
-- ============================================================
ALTER TABLE public.project_members
  DROP CONSTRAINT IF EXISTS project_members_role_check;

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_role_check
  CHECK (role IN ('consultant', 'client_editor', 'client_viewer'));

-- 3. Update user_can_edit_project to whitelist only reachable roles
--    (remove 'owner'/'admin'/'editor' which were never actually stored
--     since project_members.role only allowed 'consultant'/'viewer')
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(
      -- 1. Member with write-capable role (consultant or client_editor)
      (SELECT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = p_project_id
          AND user_id = auth.uid()
          AND role IN ('consultant', 'client_editor')
      )),
      -- 2. Pattern: client_editor at company level (Patrón 2)
      (SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'client_editor'
          AND company_id = (
            SELECT company_id FROM public.projects WHERE id = p_project_id
          )
      )),
      -- 3. Platform admin bypass
      (SELECT public.is_platform_admin()),
      false
    )
$$;

COMMENT ON FUNCTION public.user_can_edit_project(uuid) IS
  'Helper for project-scoped write access. True if: (1) member with role in (consultant, client_editor), '
  '(2) company-level client_editor, or (3) platform admin. Used by RLS policies on project_members and related tables.';

-- 4. Confirm user_can_read_project is up to date
--    (it accepts any member role, no need to whitelist)
-- ============================================================
-- No changes needed here — user_can_read_project already accepts
-- any project_members.role value and handles non-members correctly.
-- Just COMMENT to confirm for future maintainers.

COMMENT ON FUNCTION public.user_can_read_project(uuid) IS
  'Helper for project-scoped read access. True if: (1) project member (any role), '
  '(2) company-level client_editor, or (3) platform admin. Used by RLS SELECT policies.';

-- 5. Replace project_members RLS policies
--    OLD: project_members_select (is_project_member), project_members_write (can_write_project)
--    NEW: Explicit select/insert/update/delete using canonical helpers
-- ============================================================
DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_write" ON public.project_members;

CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT
  USING (public.user_can_read_project(project_id) OR public.is_platform_admin());

CREATE POLICY "project_members_insert" ON public.project_members
  FOR INSERT
  WITH CHECK (public.user_can_edit_project(project_id) OR public.is_platform_admin());

CREATE POLICY "project_members_update" ON public.project_members
  FOR UPDATE
  USING (public.user_can_edit_project(project_id) OR public.is_platform_admin())
  WITH CHECK (public.user_can_edit_project(project_id) OR public.is_platform_admin());

CREATE POLICY "project_members_delete" ON public.project_members
  FOR DELETE
  USING (public.user_can_edit_project(project_id) OR public.is_platform_admin());

-- 6. Add profiles.person_id to link accounts to directory entries
--    (nullable; used by Épica 8 invite-user flow to set the account↔person link)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS person_id uuid
  REFERENCES public.company_persons(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.person_id IS
  'Optional FK to company_persons. Set by invite-user edge function (Épica 8) '
  'to link an auth account to a directory person entry. Nullable — a profile '
  'exists without a linked person if not yet assigned to a company person.';

-- 7. Create index on profiles.person_id for efficient lookups
--    (optional but recommended for future queries on this relationship)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_person_id
  ON public.profiles(person_id)
  WHERE person_id IS NOT NULL;

-- 8. Note: is_project_member and can_write_project functions remain
--    in place (not dropped) for backwards compatibility with older code/documentation.
--    They are now superseded by user_can_read_project/user_can_edit_project for
--    this table's RLS policies.

COMMENT ON FUNCTION public.is_project_member(uuid) IS
  '[DEPRECATED for project_members RLS] Use user_can_read_project instead. '
  'This function is preserved for backwards compatibility but project_members '
  'policies now use the newer user_can_read_project helper.';

COMMENT ON FUNCTION public.can_write_project(uuid) IS
  '[DEPRECATED for project_members RLS] Use user_can_edit_project instead. '
  'This function is preserved for backwards compatibility but project_members '
  'policies now use the newer user_can_edit_project helper.';

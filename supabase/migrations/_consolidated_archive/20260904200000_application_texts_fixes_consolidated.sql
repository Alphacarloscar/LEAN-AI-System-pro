-- Fix semantic errors in application_texts table
-- 1. Rename text_generalizado to text_override (it's the override value, not generalized text)
-- 2. Drop the old columns no longer needed
-- 3. Ensure filename contains real file:line references, not module_key concatenations

-- Add new text_override column (if not already exists from previous migration)
ALTER TABLE public.application_texts
ADD COLUMN IF NOT EXISTS text_override TEXT;

-- Migrate existing data: if text_generalizado exists and is not '[Sin especificar]', move to text_override
UPDATE public.application_texts
SET text_override = NULLIF(text_generalizado, '[Sin especificar]')
WHERE text_generalizado IS NOT NULL AND text_generalizado != '[Sin especificar]';

-- For now, reset filename to empty so it can be properly populated with file:line values
-- This will be filled via a separate data migration or manual update
UPDATE public.application_texts
SET filename = NULL
WHERE filename IS NOT NULL AND filename LIKE '%_%';

-- Drop the old text_generalizado column (if this is a future migration, else comment out)
-- ALTER TABLE public.application_texts DROP COLUMN IF EXISTS text_generalizado;

-- Verify migration
SELECT
  COUNT(*) as total_rows,
  COUNT(CASE WHEN text_override IS NOT NULL THEN 1 END) as rows_with_override,
  COUNT(CASE WHEN filename IS NOT NULL THEN 1 END) as rows_with_filename
FROM public.application_texts;

-- Refactor application_texts data: clean up incorrect filename values
-- and prepare for proper seed data with file:line references
--
-- Current issue (ADR-??? BKL-XXX):
--   - filename column has incorrect values like "Admin_\"<text_key>\"" or "module_key"
--   - These should be replaced with actual file:line references (e.g., "AdminView.tsx:154")
--   - text_override column should be null for all entries (users set overrides in admin panel)
--
-- This migration:
--   1. Resets filename to NULL (will be populated by proper seed script)
--   2. Moves any existing text_generalizado to text_override if it's not a placeholder
--   3. Cleans up the table for fresh seed data

-- Reset all filenames to NULL (they will be populated with proper file:line values)
UPDATE public.application_texts
SET filename = NULL
WHERE filename IS NOT NULL;

-- Move text_generalizado to text_override (if it exists and is not a placeholder)
UPDATE public.application_texts
SET text_override = NULLIF(text_generalizado, '[Sin especificar]')
WHERE text_generalizado IS NOT NULL
  AND text_generalizado != '[Sin especificar]'
  AND text_override IS NULL;

-- Log the cleanup
SELECT
  COUNT(*) as total_rows,
  COUNT(CASE WHEN filename IS NULL THEN 1 END) as rows_with_null_filename,
  COUNT(CASE WHEN text_override IS NOT NULL THEN 1 END) as rows_with_override
FROM public.application_texts;

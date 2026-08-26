-- Adds an index to the profiles.id column to ensure fast lookups.
-- While this column is the primary key and should be indexed by default,
-- this explicitly ensures it, which can resolve performance issues if the
-- implicit index is not being used effectively by the query planner.
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);
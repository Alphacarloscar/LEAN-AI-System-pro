-- ============================================================
-- schema_metadata — tabla de control de versiones de BD
-- ============================================================
-- Almacena metadatos de la BD (versión, timestamps, etc.)
-- RLS: SELECT público (solo lectura), INSERT/UPDATE solo superadmin

CREATE TABLE IF NOT EXISTS schema_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: activar
ALTER TABLE schema_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT público (solo lectura)
CREATE POLICY "schema_metadata_select_public" ON schema_metadata
  FOR SELECT
  USING (true);

-- Policy: INSERT/UPDATE solo superadmin
CREATE POLICY "schema_metadata_insert_update_superadmin" ON schema_metadata
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "schema_metadata_update_superadmin" ON schema_metadata
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'superadmin')
  WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

-- Inicializar versión de BD
INSERT INTO schema_metadata (key, value)
VALUES ('db_version', '20260908')
ON CONFLICT (key) DO NOTHING;

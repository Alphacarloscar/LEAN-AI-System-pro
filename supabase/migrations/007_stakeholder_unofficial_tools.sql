-- ============================================================
-- Migration 007 — Shadow AI: unofficial_tools en stakeholders
--
-- Añade la columna unofficial_tools (text, nullable) a la tabla
-- stakeholders para registrar herramientas externas (IA o digitales)
-- que los stakeholders usan por su cuenta.
--
-- La columna alimenta el indicador "Riesgo de Shadow AI" visible
-- en T6 (Gobernanza) y T10 (Dashboard Principal).
--
-- Compatibilidad: columna nullable, por lo que los registros
-- existentes no se ven afectados. RLS heredada de la tabla.
-- ============================================================

ALTER TABLE stakeholders
  ADD COLUMN IF NOT EXISTS unofficial_tools text DEFAULT NULL;

COMMENT ON COLUMN stakeholders.unofficial_tools IS
  'Shadow AI: herramientas externas (IA o digitales) que el stakeholder usa sin aprobación oficial. Capturado de forma empática durante la entrevista de perfil en T2.';

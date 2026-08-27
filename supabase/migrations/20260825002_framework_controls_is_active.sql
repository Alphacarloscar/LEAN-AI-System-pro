-- ADR-029 Fase 5 — ADD COLUMN is_active a framework_controls
--
-- Propósito: Agregar columna is_active que faltaba en la definición
-- original de framework_controls. El seed 20260825 ya la referencia,
-- así que esta migración debe aplicarse antes del seed.
--
-- Idempotente: usa IF NOT EXISTS para poder re-ejecutarse sin error.

ALTER TABLE public.framework_controls
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.framework_controls.is_active IS
  'Flag para deshabilitar un control sin borrarlo (soft-delete pattern). '
  'Default true = control activo. Usado en queries y seeds como predicado.';

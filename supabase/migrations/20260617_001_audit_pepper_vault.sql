-- ============================================================
-- Migration 20260617_001_audit_pepper_vault.sql
--
-- Fix: hmac_email_hash lee el pepper desde vault.decrypted_secrets
-- en lugar de current_setting('app.audit_pepper').
--
-- Problema: Supabase Cloud no permite ALTER DATABASE ni ALTER ROLE
-- desde el SQL Editor (permission denied to set parameter).
--
-- Solución: vault.decrypted_secrets es accesible desde funciones
-- SECURITY DEFINER con service_role — no requiere ningún permiso
-- adicional del usuario que ejecuta las migraciones.
--
-- Prerrequisito (único paso manual):
--   Dashboard → Project Settings → Vault → Add new secret
--     Name:  audit_pepper
--     Value: <hex 64 chars — generar con: SELECT encode(gen_random_bytes(32),'hex')>
--
-- Relacionado: ADR-018 · 20260615_003_audit_system.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.hmac_email_hash(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_pepper text;
BEGIN
  IF p_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Lee el pepper desde Supabase Vault — accesible via SECURITY DEFINER
  -- sin necesidad de ALTER DATABASE ni permisos de superadmin.
  SELECT decrypted_secret
  INTO   v_pepper
  FROM   vault.decrypted_secrets
  WHERE  name = 'audit_pepper'
  LIMIT  1;

  IF v_pepper IS NULL OR trim(v_pepper) = '' THEN
    RAISE EXCEPTION
      'hmac_email_hash: secreto "audit_pepper" no encontrado en Vault. '
      'Añádelo en Dashboard → Project Settings → Vault → Add new secret.';
  END IF;

  RETURN encode(hmac(p_email, v_pepper, 'sha256'), 'hex');
END;
$$;

REVOKE ALL     ON FUNCTION public.hmac_email_hash(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hmac_email_hash(text) TO service_role;

COMMENT ON FUNCTION public.hmac_email_hash(text) IS
  'Pseudonimiza un email con HMAC-SHA256 usando el secreto "audit_pepper" '
  'almacenado en Supabase Vault (vault.decrypted_secrets). '
  'SECURITY DEFINER. Solo service_role puede invocarla. '
  'Devuelve NULL si p_email es NULL.';


-- ════════════════════════════════════════════════════════════════
-- VERIFICACIÓN POST-DESPLIEGUE
-- ════════════════════════════════════════════════════════════════
--
-- 1. Confirmar que el secreto existe en Vault:
--      SELECT name, created_at FROM vault.secrets
--      WHERE name = 'audit_pepper';
--
-- 2. Test HMAC (debe devolver hex de 64 chars):
--      SELECT public.hmac_email_hash('test@goby.com');
--
-- 3. Si devuelve el error "no encontrado", primero añadir el secreto
--    en Dashboard → Project Settings → Vault y repetir el test.

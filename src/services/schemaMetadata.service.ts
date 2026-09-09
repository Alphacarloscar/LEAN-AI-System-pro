// ============================================================
// Schema Metadata Service — Acceso centralizado a schema_metadata
//
// Gestiona valores clave-valor de control de BD (db_version, audit_intensive_mode, etc.)
// RLS: SELECT público (solo lectura), INSERT/UPDATE solo superadmin
//
// Relacionado: Épica 7 (schema_metadata creada), Épica 9 (audit_intensive_mode)
// ADR-011: centraliza acceso a la tabla en lugar de queries inline en componentes.
// ============================================================

import { supabase } from '@/lib/supabase'
import { reportError } from '@/lib/reportError'

export interface SchemaMetadataRow {
  key: string
  value: string
  updated_at: string
}

// Cast temporal hasta que schema_metadata esté en los tipos generados.
// Ver DEBT-018 para el plan de eliminación de este cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as any

/**
 * Lee un valor de schema_metadata por clave.
 * Cualquiera puede leer (RLS lo permite).
 * Retorna null si la clave no existe.
 */
export async function getSchemaMetadata(key: string): Promise<string | null> {
  try {
    const { data, error } = await db
      .from('schema_metadata')
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        // No row found — es normal, retornar null
        return null
      }
      reportError('schemaMetadata.getSchemaMetadata', error)
      return null
    }

    return (data as { value: string } | null)?.value ?? null
  } catch (err) {
    reportError('schemaMetadata.getSchemaMetadata', err)
    return null
  }
}

/**
 * Escribe un valor de schema_metadata (INSERT o UPDATE).
 * Solo superadmin puede llamar (RLS lo valida server-side).
 * Lanza si no es superadmin o si hay error de BD.
 */
export async function setSchemaMetadata(key: string, value: string): Promise<void> {
  try {
    const { error } = await db
      .from('schema_metadata')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) {
      reportError('schemaMetadata.setSchemaMetadata', error)
      throw new Error(`[SchemaMetadata] setSchemaMetadata failed: ${error.message}`)
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('[SchemaMetadata]')) {
      throw err
    }
    reportError('schemaMetadata.setSchemaMetadata', err)
    throw new Error('[SchemaMetadata] setSchemaMetadata: network or unexpected error')
  }
}

/**
 * Lee el modo intensivo de auditoría desde schema_metadata.
 * Cachea el valor en memoria con TTL de 5 minutos.
 * Retorna boolean: true = modo intensivo activo, false = modo normal.
 */
let intensiveModeCache: { value: boolean; expiresAt: number } | null = null
const INTENSIVE_MODE_TTL_MS = 5 * 60 * 1000 // 5 minutos

export async function getIntensiveMode(): Promise<boolean> {
  const now = Date.now()

  // Cache válido
  if (intensiveModeCache && intensiveModeCache.expiresAt > now) {
    return intensiveModeCache.value
  }

  // Cache expirado o no existe — leer de BD
  const strValue = await getSchemaMetadata('audit_intensive_mode')
  const value = strValue === 'true'

  // Guardar en cache
  intensiveModeCache = {
    value,
    expiresAt: now + INTENSIVE_MODE_TTL_MS,
  }

  return value
}

/**
 * Escribe el modo intensivo en schema_metadata.
 * Invalida el cache inmediatamente.
 * Solo superadmin puede llamar.
 */
export async function setIntensiveMode(enabled: boolean): Promise<void> {
  // Invalidar cache
  intensiveModeCache = null

  // Escribir a BD
  await setSchemaMetadata('audit_intensive_mode', enabled ? 'true' : 'false')
}

/**
 * Lee la versión de BD desde schema_metadata (usado en UserMenu.tsx actualmente inline).
 * Centraliza el acceso.
 */
export async function getDbVersion(): Promise<string | null> {
  return getSchemaMetadata('db_version')
}

/**
 * Invalida manualmente el cache de modo intensivo (útil en tests).
 */
export function invalidateIntensiveModeCache(): void {
  intensiveModeCache = null
}

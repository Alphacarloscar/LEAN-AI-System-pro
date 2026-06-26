// ============================================================
// Shared audit types — Deno Edge Functions
//
// Importar desde cualquier Edge Function con:
//   import type { AIAuditEntry } from '../_shared/audit-types.ts'
//
// El shape AIAuditEntry define el contrato de inserción en audit_logs
// para llamadas a proveedores LLM (Anthropic, etc.).
// Mantenerlo aquí evita definiciones duplicadas entre Edge Functions.
//
// Relacionado: ADR-017 (Proxy pattern), src/lib/audit/types.ts (cliente)
// ============================================================

export interface AIAuditEntry {
  userId:           string
  userEmail:        string | null
  projectId:        string
  tool:             string
  status:           'success' | 'error'
  durationMs:       number
  contextBytes:     number
  errorMessage:     string | null
  modelRequested:   string
  modelResponded:   string | null
  inputTokens:      number | null
  outputTokens:     number | null
  cacheWriteTokens: number | null
  cacheReadTokens:  number | null
  stopReason:       string | null
}

/**
 * Estructura del objeto `metadata` JSONB que las Edge Functions de IA
 * insertan en audit_logs. Columnas extraídas de campos propios del proveedor.
 */
export interface AIAuditMetadata {
  provider:           string
  model_requested:    string
  model_responded:    string | null
  input_tokens:       number | null
  output_tokens:      number | null
  total_tokens:       number | null
  cache_write_tokens: number | null
  cache_read_tokens:  number | null
  stop_reason:        string | null
  function_version:   string
}
